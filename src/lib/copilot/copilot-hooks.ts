'use client'

import { useContext, useEffect, useRef, useCallback } from 'react'
import {
  CopilotContext,
  type CopilotContextValue,
  type CopilotReadableRecord,
  type CopilotActionDefinition,
  type CopilotChatMessage,
} from './copilot-context'

/**
 * Hook to access the full Copilot AG-UI context
 */
export function useCopilot(): CopilotContextValue {
  const context = useContext(CopilotContext)
  if (!context) {
    throw new Error(
      'useCopilot must be used within a <CopilotProvider>. Wrap your tree in <CopilotProvider> to use CopilotKit AG-UI hooks.'
    )
  }
  return context
}

/**
 * Optional hook to access Copilot context safely without throwing
 */
export function useCopilotSafe(): CopilotContextValue | null {
  return useContext(CopilotContext)
}

/**
 * AG-UI protocol hook: useCopilotReadable
 * Exposes active UI state and data to the Copilot agent's reasoning engine
 */
export function useCopilotReadable<T>(record: {
  id?: string
  description: string
  value: T
  parentId?: string
}): void {
  const context = useCopilotSafe()
  const idRef = useRef<string>(
    record.id || `readable-${record.description.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  )

  useEffect(() => {
    if (!context) return

    const id = record.id || idRef.current
    const readableRecord: CopilotReadableRecord<T> = {
      id,
      description: record.description,
      value: record.value,
      parentId: record.parentId,
    }

    const unregister = context.registerReadable(readableRecord)
    return () => {
      unregister()
    }
  }, [context, record.id, record.description, record.value, record.parentId])
}

/**
 * AG-UI protocol hook: useCopilotAction
 * Registers client-side tools and callable actions that Copilot or user can trigger
 */
export function useCopilotAction<T = any, R = any>(
  action: CopilotActionDefinition<T, R>
): void {
  const context = useCopilotSafe()
  const actionRef = useRef(action)
  actionRef.current = action

  useEffect(() => {
    if (!context) return

    const actionDef: CopilotActionDefinition<T, R> = {
      name: action.name,
      description: action.description,
      parameters: action.parameters,
      render: action.render,
      handler: (args: T) => actionRef.current.handler(args),
    }

    const unregister = context.registerAction(actionDef)
    return () => {
      unregister()
    }
  }, [context, action.name, action.description, action.parameters, action.render])
}

/**
 * Helper hook for Copilot chat messaging and interaction
 */
export function useCopilotChat() {
  const context = useCopilot()

  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        actionData?: CopilotChatMessage['actionData']
        generativeCard?: CopilotChatMessage['generativeCard']
      }
    ) => {
      if (!content.trim()) return

      // Add user message
      context.addMessage({
        role: 'user',
        content,
      })

      if (options?.actionData || options?.generativeCard) {
        context.addMessage({
          role: 'assistant',
          content: 'Tindakan diproses mengikut permintaan anda:',
          actionData: options.actionData,
          generativeCard: options.generativeCard,
        })
      }
    },
    [context]
  )

  return {
    messages: context.messages,
    addMessage: context.addMessage,
    setMessages: context.setMessages,
    clearMessages: context.clearMessages,
    sendMessage,
    isSidebarOpen: context.isSidebarOpen,
    setSidebarOpen: context.setSidebarOpen,
    toggleSidebar: context.toggleSidebar,
  }
}
