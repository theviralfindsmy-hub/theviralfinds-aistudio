'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useAppStore, type PageId } from '@/store/app-store'

export type CopilotActionStatus = 'idle' | 'executing' | 'complete' | 'error'

export interface CopilotReadableRecord<T = unknown> {
  id: string
  description: string
  value: T
  parentId?: string
}

export interface CopilotActionDefinition<T = any, R = any> {
  name: string
  description: string
  parameters?: any // Zod schema or object validator
  render?: (props: {
    status: CopilotActionStatus
    args: T
    result?: R
  }) => React.ReactNode
  handler: (args: T) => Promise<R> | R
}

export interface CopilotChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
  actionData?: {
    type?: 'navigation' | 'filter' | 'product_card' | 'quick_action' | 'card'
    cardType?:
      | 'commission_simulator'
      | 'viral_hook'
      | 'broadcast_action'
      | 'product_card'
      | 'navigation'
      | 'quick_action'
    targetPage?: PageId
    actionLabel?: string
    productName?: string
    commissionRate?: number
    price?: number
    cardProps?: Record<string, any>
  }
  generativeCard?: {
    type: 'commission_simulator' | 'viral_hook' | 'broadcast_action'
    props?: Record<string, any>
  }
}

export interface CopilotContextValue {
  // Active page state
  activePage: PageId
  setActivePage: (page: PageId) => void

  // Readable context registry (useCopilotReadable)
  readables: Record<string, CopilotReadableRecord>
  registerReadable: (record: CopilotReadableRecord) => () => void
  unregisterReadable: (id: string) => void
  getReadable: (id: string) => CopilotReadableRecord | undefined

  // Action registry (useCopilotAction)
  actions: Record<string, CopilotActionDefinition>
  registerAction: (action: CopilotActionDefinition) => () => void
  unregisterAction: (name: string) => void
  getAction: (name: string) => CopilotActionDefinition | undefined
  executeAction: <T = any, R = any>(name: string, args: T) => Promise<R>
  actionStatuses: Record<
    string,
    { status: CopilotActionStatus; args?: any; result?: any; error?: string }
  >

  // Chat message & Generative UI state
  messages: CopilotChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<CopilotChatMessage[]>>
  addMessage: (
    message: Omit<CopilotChatMessage, 'id' | 'timestamp'> & { id?: string }
  ) => CopilotChatMessage
  clearMessages: () => void

  // Sidebar visibility & ⌘J state
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  toggleSidebar: () => void

  // Generative Card Persistent State
  cardState: Record<string, any>
  setCardState: (cardId: string, state: any) => void
}

export const CopilotContext = createContext<CopilotContextValue | null>(null)

export const DEFAULT_COPILOT_MESSAGES: CopilotChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content:
      'Hai! Saya Hermes Copilot anda. Saya membaca konteks skrin secara langsung melalui protokol AG-UI untuk bantu anda cari produk viral Shopee/TikTok, kira simulasi komisen, atau autopost terus ke media sosial.',
    timestamp: Date.now(),
    actionData: {
      type: 'card',
      cardType: 'commission_simulator',
      actionLabel: 'Buka Simulator Komisen',
      cardProps: {
        initialPrice: 45.0,
        initialUnits: 150,
        initialCommissionRate: 12.0,
      },
    },
  },
]

export interface CopilotProviderProps {
  children: ReactNode
  initialActivePage?: PageId
  initialMessages?: CopilotChatMessage[]
  initialOpen?: boolean
}

export function CopilotProvider({
  children,
  initialActivePage,
  initialMessages = DEFAULT_COPILOT_MESSAGES,
  initialOpen = false,
}: CopilotProviderProps) {
  // Synchronize with app store activePage if available
  const appStore = useAppStore()
  const [localActivePage, setLocalActivePage] = useState<PageId>(
    initialActivePage || appStore?.activePage || 'dashboard'
  )

  const activePage = initialActivePage ? localActivePage : (appStore?.activePage ?? localActivePage)
  const setActivePage = useCallback(
    (page: PageId) => {
      if (appStore?.setActivePage) {
        appStore.setActivePage(page)
      }
      setLocalActivePage(page)
    },
    [appStore]
  )

  // Readable context registry
  const readablesRef = useRef<Record<string, CopilotReadableRecord>>({})
  const [readables, setReadables] = useState<Record<string, CopilotReadableRecord>>({})

  const registerReadable = useCallback((record: CopilotReadableRecord) => {
    readablesRef.current[record.id] = record
    setReadables((prev) => ({
      ...prev,
      [record.id]: record,
    }))
    return () => {
      delete readablesRef.current[record.id]
      setReadables((prev) => {
        const next = { ...prev }
        delete next[record.id]
        return next
      })
    }
  }, [])

  const unregisterReadable = useCallback((id: string) => {
    delete readablesRef.current[id]
    setReadables((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const getReadable = useCallback(
    (id: string) => readablesRef.current[id] ?? readables[id],
    [readables]
  )

  // Register baseline active page readable state automatically
  useEffect(() => {
    registerReadable({
      id: 'active_page_context',
      description: 'Current active page route in AppShell',
      value: {
        activePage,
        updatedAt: new Date().toISOString(),
      },
    })
  }, [activePage, registerReadable])

  // Action registry
  const actionsRef = useRef<Record<string, CopilotActionDefinition>>({})
  const [actions, setActions] = useState<Record<string, CopilotActionDefinition>>({})
  const actionStatusesRef = useRef<
    Record<string, { status: CopilotActionStatus; args?: any; result?: any; error?: string }>
  >({})
  const [actionStatuses, setActionStatuses] = useState<
    Record<string, { status: CopilotActionStatus; args?: any; result?: any; error?: string }>
  >({})

  const registerAction = useCallback((action: CopilotActionDefinition) => {
    actionsRef.current[action.name] = action
    setActions((prev) => ({
      ...prev,
      [action.name]: action,
    }))
    return () => {
      delete actionsRef.current[action.name]
      setActions((prev) => {
        const next = { ...prev }
        delete next[action.name]
        return next
      })
    }
  }, [])

  const unregisterAction = useCallback((name: string) => {
    delete actionsRef.current[name]
    setActions((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const getAction = useCallback(
    (name: string) => actionsRef.current[name] ?? actions[name],
    [actions]
  )

  const executeAction = useCallback(
    async <T = any, R = any>(name: string, args: T): Promise<R> => {
      const action = actionsRef.current[name] ?? actions[name]
      if (!action) {
        const err = `Action "${name}" is not registered in CopilotProvider.`
        const statusObj = { status: 'error' as const, args, error: err }
        actionStatusesRef.current[name] = statusObj
        setActionStatuses((prev) => ({
          ...prev,
          [name]: statusObj,
        }))
        throw new Error(err)
      }

      const execStatus = { status: 'executing' as const, args }
      actionStatusesRef.current[name] = execStatus
      setActionStatuses((prev) => ({
        ...prev,
        [name]: execStatus,
      }))

      try {
        let validatedArgs = args
        // If Zod schema or parser is present, validate
        if (action.parameters && typeof action.parameters.parse === 'function') {
          validatedArgs = action.parameters.parse(args)
        }

        const result = await Promise.resolve(action.handler(validatedArgs))

        const completeStatus = { status: 'complete' as const, args: validatedArgs, result }
        actionStatusesRef.current[name] = completeStatus
        setActionStatuses((prev) => ({
          ...prev,
          [name]: completeStatus,
        }))

        return result
      } catch (error: any) {
        const errMsg = error?.message || 'Error executing action'
        const errStatus = { status: 'error' as const, args, error: errMsg }
        actionStatusesRef.current[name] = errStatus
        setActionStatuses((prev) => ({
          ...prev,
          [name]: errStatus,
        }))
        throw error
      }
    },
    [actions]
  )

  // Chat messages
  const messagesRef = useRef<CopilotChatMessage[]>(initialMessages)
  const [messages, setMessages] = useState<CopilotChatMessage[]>(initialMessages)

  const addMessage = useCallback(
    (message: Omit<CopilotChatMessage, 'id' | 'timestamp'> & { id?: string }) => {
      const fullMessage: CopilotChatMessage = {
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        ...message,
      }
      messagesRef.current = [...messagesRef.current, fullMessage]
      setMessages((prev) => [...prev, fullMessage])
      return fullMessage
    },
    []
  )

  const clearMessages = useCallback(() => {
    messagesRef.current = []
    setMessages([])
  }, [])

  // Sidebar visibility
  const isSidebarOpenRef = useRef(initialOpen)
  const [isSidebarOpen, setSidebarOpenState] = useState(initialOpen)

  const setSidebarOpen = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof open === 'function' ? open(isSidebarOpenRef.current) : open
    isSidebarOpenRef.current = nextVal
    setSidebarOpenState(nextVal)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [setSidebarOpen])

  // Generative Card Persistent State
  const [cardState, setCardStateInternal] = useState<Record<string, any>>({})
  const setCardState = useCallback((cardId: string, state: any) => {
    setCardStateInternal((prev) => ({
      ...prev,
      [cardId]: typeof state === 'function' ? state(prev[cardId]) : state,
    }))
  }, [])

  const contextValue = useMemo<CopilotContextValue>(
    () => ({
      activePage,
      setActivePage,
      get readables() {
        return { ...readables, ...readablesRef.current }
      },
      registerReadable,
      unregisterReadable,
      getReadable,
      get actions() {
        return { ...actions, ...actionsRef.current }
      },
      registerAction,
      unregisterAction,
      getAction,
      executeAction,
      get actionStatuses() {
        return { ...actionStatuses, ...actionStatusesRef.current }
      },
      get messages() {
        return messagesRef.current
      },
      setMessages,
      addMessage,
      clearMessages,
      get isSidebarOpen() {
        return isSidebarOpenRef.current
      },
      setSidebarOpen,
      toggleSidebar,
      cardState,
      setCardState,
    }),
    [
      activePage,
      setActivePage,
      readables,
      registerReadable,
      unregisterReadable,
      getReadable,
      actions,
      registerAction,
      unregisterAction,
      getAction,
      executeAction,
      actionStatuses,
      messages,
      addMessage,
      clearMessages,
      isSidebarOpen,
      toggleSidebar,
      cardState,
      setCardState,
    ]
  )

  return (
    <CopilotContext.Provider value={contextValue}>
      {children}
    </CopilotContext.Provider>
  )
}
