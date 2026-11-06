'use client'

/**
 * HermesChatWidget — Floating AI assistant chat
 *
 * Features:
 *   - Floating purple button (bottom-right, above mobile nav) with mascot icon
 *   - Pulse animation on first visit to draw attention
 *   - Unread message badge (red dot)
 *   - Slide-in chat panel: 350px wide, 500px tall (mobile: full width minus margins)
 *   - Header: HERMES mascot + name + online status + clear/close buttons
 *   - Quick prompts (chips): trending products, caption template, conversion drop, post times
 *   - "HERMES is thinking..." typing indicator with 1.5s perceived delay
 *   - User bubbles: shopee orange (right-aligned)
 *   - HERMES bubbles: hermes purple tint (left-aligned, with mascot avatar)
 *   - Manglish personality throughout
 *   - Persistent chat history (localStorage 'tvf_hermes_chat_history', max 50)
 *   - Contextual first-visit hints per page (localStorage 'tvf_hermes_seen_<pageId>')
 *   - Voice input button (placeholder)
 *
 * Free-form messages call POST /api/hermes/chat.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore, type PageId } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  X, Send, Mic, Sparkles, Trash2, Lightbulb,
  TrendingUp, PenLine, AlertTriangle, Clock, Bot,
} from 'lucide-react'
import { HermesMascot, type HermesExpression } from './hermes-mascot'

// ─── Types ───────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'hermes'
  content: string
  timestamp: number
}

// ─── Constants ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'tvf_hermes_chat_history'
const SEEN_KEY = (pageId: string) => `tvf_hermes_seen_${pageId}`
const DISMISSED_KEY = (pageId: string) => `tvf_hermes_dismissed_${pageId}`
const FIRST_VISIT_KEY = 'tvf_hermes_first_visit_pulse_done'
const MAX_MESSAGES = 50
const THINKING_DELAY_MS = 1500

interface QuickPrompt {
  id: string
  label: string
  icon: typeof TrendingUp
  handler: () => void
}

interface PageHint {
  title: string
  message: string
  introPrompt: string
}

const PAGE_HINTS: Partial<Record<PageId, PageHint>> = {
  dashboard: {
    title: 'Welcome to your Dashboard! 👋',
    message: 'Here you can see earnings, top products, and recent activity. Want me to walk you through the key metrics?',
    introPrompt: 'Walk me through my dashboard — what should I focus on first?',
  },
  products: {
    title: 'Products page! 🛍️',
    message: 'Browse trending Shopee products, filter by commission rate, and create affiliate links. Need a recommendation?',
    introPrompt: 'Recommend me 3 trending products to promote right now.',
  },
  links: {
    title: 'Your Links page! 🔗',
    message: 'Every affiliate link you\'ve generated lives here. Want me to check link health?',
    introPrompt: 'How do I optimize my affiliate links for better conversion?',
  },
  content: {
    title: 'AI Content Studio! ✨',
    message: 'Generate captions, hashtags, and posts in Manglish. Try a quick prompt below!',
    introPrompt: 'Help me write a TikTok caption for a wireless earbuds product.',
  },
  trends: {
    title: 'Trend Spy! 🔥',
    message: 'See what\'s hot right now on Shopee MY. Click "Trending Now" for the freshest picks.',
    introPrompt: 'What\'s trending on Shopee Malaysia this week?',
  },
  analytics: {
    title: 'Analytics! 📊',
    message: 'Deep dive into your clicks, conversions, and earnings. Want me to explain any metric?',
    introPrompt: 'Explain my conversion funnel and where I\'m losing potential customers.',
  },
}

// ─── localStorage helpers (SSR-safe) ─────────────────────────────────────

function loadMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMessage[]
    if (!Array.isArray(parsed)) return []
    return parsed.slice(-MAX_MESSAGES)
  } catch {
    return []
  }
}

function saveMessages(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    const trimmed = messages.slice(-MAX_MESSAGES)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // ignore quota errors
  }
}

function getSeen(pageId: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return (
      window.localStorage.getItem(SEEN_KEY(pageId)) === '1' ||
      window.localStorage.getItem(DISMISSED_KEY(pageId)) === '1'
    )
  } catch {
    return true
  }
}

function markSeen(pageId: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SEEN_KEY(pageId), '1')
  } catch {
    // ignore
  }
}

function markDismissed(pageId: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DISMISSED_KEY(pageId), '1')
  } catch {
    // ignore
  }
}

// ─── Manglish helpers ────────────────────────────────────────────────────

const MANGLISH_PREFIXES = [
  'Wah, good question! Let me check... 🔍',
  'Steady lah, here\'s my take 👇',
  'Confirm best one — ',
  'Eh, let me analyze this for you... 🤔',
  'Power! Okay here goes 💪',
]

function randomManglishPrefix(): string {
  return MANGLISH_PREFIXES[Math.floor(Math.random() * MANGLISH_PREFIXES.length)]
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Quick prompt canned responses (no API) ──────────────────────────────

const CANNED_TRENDING = `Wah, good question! 🔥 Here are top 3 trending products right now gila one:

**1. Wireless Earbuds TWS Bluetooth 5.3** 🔊
• Price: RM 15.90 – 89.90
• Commission: 8% (highest tier!)
• Sales: 50,000+ this month
• Why: Evergreen tech accessory, mass appeal

**2. Sunscreen SPF50+ PA++++ Tone Up Cream** ☀️
• Price: RM 15.90 – 49.90
• Commission: 12% (Beauty category paling tinggi!)
• Sales: 50,000+ this month
• Why: Malaysian weather demands SPF, viral on TikTok

**3. Tudung Bawal Premium Cotton Matte 50x50** 🧕
• Price: RM 15.90 – 49.90
• Commission: 10%
• Sales: 40,000+ this month
• Why: Local market staple, repeat purchases

Steady lah, you start with the sunscreen — volume tinggi, commission rate pun mantap 📈. Want me to draft captions for any of these?`

const CANNED_CAPTION = `Power! 📝 Here's a Manglish caption template ready for you:

> Wah, this [product name] memang best gila! 🔥
> Tried it myself, confirm worth every ringgit 💸
> Price? RM XX only — cheaper than your daily kopi! ☕
>
> 🛒 Get yours now: [your affiliate link]
> #shopeemy #shopeeaffiliate #[niche] #[product]

I've also opened the **AI Content Studio** so you can generate more variations ✨. Just paste your product name + niche and hit Generate. Confirm can viral one! 🚀

Want a TikTok-specific version with hooks?`

const CANNED_CONVERSION_DROP = `Eh, your conversions dropped ah? Let me analyze... 🔍

Here are **3 possible reasons** (most common ones I see):

**1. Seasonal dip 📅**
Malaysia's slowest weeks are mid-month (post-payday) and post-sale slumps (after 9.9, 11.11). Check if your drop aligns with these patterns.

**2. Stale content 😴**
TikTok algorithm bores easily one. If your last 5 posts were similar style, reach confirm drop. Mix it up: unboxing vs comparison vs raw review vs lifestyle.

**3. Broken or expired links 🔗**
Very common issue! Products get delisted, links expire. Go to your Links page and run a health check. If 3+ links broken, your conversion drops even though clicks look fine.

**Quick diagnosis:**
- Clicks steady but conversions drop → it's content/relevance
- Clicks also drop → it's reach/algorithm
- Both drop suddenly → broken links (check first!)

Want me to dig into a specific product? Just paste the link 📊`

const CANNED_POST_TIMES = `Confirm best times for Malaysian audience! ⏰

**TikTok** (peak scrolling hours):
🌅 7–9 AM (morning commute / breakfast scroll)
🌙 8–11 PM (after dinner — PEAK engagement)
Weekend: 11 AM – 1 PM (lazy lunch browsing)

**Instagram** (Reels & Stories):
🌅 7–9 AM, 12–1 PM, 7–9 PM
Sunday 7 PM is gold 🥇 — highest engagement window

**Shopee Live** 🎥:
🌙 8–10 PM weekday (post-dinner shopping)
Weekend afternoons 2–5 PM

**Power tip 💡**: Post 30 mins BEFORE peak so the algorithm pushes you into the peak feed. Schedule your content calendar accordingly!

Steady lah, want me to help plan a weekly content schedule? 📅`

// ─── Component ───────────────────────────────────────────────────────────

export function HermesChatWidget() {
  const { activePage, setActivePage } = useAppStore()

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPulse, setShowPulse] = useState(false)
  const [showHint, setShowHint] = useState<PageHint | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [mascotExpression, setMascotExpression] = useState<HermesExpression>('happy')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Ref to the latest handleSend so external-event listeners (registered once)
  // always invoke the freshest version without re-subscribing on every render.
  const handleSendRef = useRef<(text: string, cannedResponse?: string) => Promise<void>>(
    async () => {},
  )

  // Load persisted messages on mount
  useEffect(() => {
    const loaded = loadMessages()
    setMessages(loaded)
    if (loaded.length === 0) {
      // Seed with a friendly welcome on very first visit
      const welcome: ChatMessage = {
        id: makeId(),
        role: 'hermes',
        content:
          'Hi there! I\'m HERMES, your Shopee Affiliate AI kawan 🤖✨\n\nI help you pick trending products, write Manglish captions, diagnose conversion drops, and grow your earnings. Click any quick prompt below or just type your question!\n\nSteady lah, let\'s make some commission together 🔥',
        timestamp: Date.now(),
      }
      setMessages([welcome])
      saveMessages([welcome])
    }
  }, [])

  // First-visit pulse on the floating button
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (!window.localStorage.getItem(FIRST_VISIT_KEY)) {
        setShowPulse(true)
        window.localStorage.setItem(FIRST_VISIT_KEY, '1')
        const t = setTimeout(() => setShowPulse(false), 8000)
        return () => clearTimeout(t)
      }
    } catch {
      // ignore
    }
  }, [])

  // Contextual hint when entering a new page (first time only)
  useEffect(() => {
    if (!activePage) return
    const hint = PAGE_HINTS[activePage]
    if (!hint) {
      setShowHint(null)
      return
    }
    if (getSeen(activePage)) {
      setShowHint(null)
      return
    }
    // Delay slightly so it doesn't fight with page transitions
    const t = setTimeout(() => setShowHint(hint), 1200)
    return () => clearTimeout(t)
  }, [activePage])

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isThinking])

  // Listen for external "open chat" events (e.g. from reactions)
  useEffect(() => {
    const openHandler = () => {
      setIsOpen(true)
      setUnreadCount(0)
    }
    const openWithMsgHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail
      setIsOpen(true)
      setUnreadCount(0)
      if (detail?.message) {
        // Slight delay so the panel finishes opening first
        setTimeout(() => handleSendRef.current(detail.message!), 400)
      }
    }
    window.addEventListener('hermes:open-chat', openHandler)
    window.addEventListener('hermes:open-chat-with-message', openWithMsgHandler as EventListener)
    return () => {
      window.removeEventListener('hermes:open-chat', openHandler)
      window.removeEventListener('hermes:open-chat-with-message', openWithMsgHandler as EventListener)
    }
  }, [])

  // Cleanup pending thinking timer on unmount
  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current)
    }
  }, [])

  // Persist messages whenever they change
  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  const openWidget = useCallback(() => {
    setIsOpen(true)
    setUnreadCount(0)
    setShowPulse(false)
    if (activePage) markSeen(activePage)
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [activePage])

  const closeWidget = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleOpenToggle = useCallback(() => {
    if (isOpen) closeWidget()
    else openWidget()
  }, [isOpen, openWidget, closeWidget])

  const handleClearChat = useCallback(() => {
    const welcome: ChatMessage = {
      id: makeId(),
      role: 'hermes',
      content: 'Fresh start! 🧹 Apa nak buat hari ini? Ask me anything about your Shopee affiliate journey 💪',
      timestamp: Date.now(),
    }
    setMessages([welcome])
    saveMessages([welcome])
    setShowClearConfirm(false)
    toast.success('Chat cleared', { description: 'HERMES is ready for fresh questions.' })
  }, [])

  // ─── Quick prompt handlers ─────────────────────────────────────────────

  const handleQuickTrending = useCallback(() => {
    handleSend('What should I promote today?', CANNED_TRENDING)
  }, [])

  const handleQuickCaption = useCallback(() => {
    // Show canned caption response AND navigate to AI Content page
    handleSend('Write me a caption for my product', CANNED_CAPTION)
    setTimeout(() => {
      setActivePage('content')
      toast.info('Opened AI Content Studio', {
        description: 'Paste your product details to generate full variations ✨',
      })
    }, 600)
  }, [setActivePage])

  const handleQuickConversion = useCallback(() => {
    handleSend('Why did my conversions drop?', CANNED_CONVERSION_DROP)
  }, [])

  const handleQuickPostTimes = useCallback(() => {
    handleSend('Best time to post on TikTok?', CANNED_POST_TIMES)
  }, [])

  const quickPrompts: QuickPrompt[] = [
    { id: 'trending', label: 'What should I promote today?', icon: TrendingUp, handler: handleQuickTrending },
    { id: 'caption', label: 'Write me a caption', icon: PenLine, handler: handleQuickCaption },
    { id: 'conversion', label: 'Why did conversions drop?', icon: AlertTriangle, handler: handleQuickConversion },
    { id: 'timing', label: 'Best time to post?', icon: Clock, handler: handleQuickPostTimes },
  ]

  // ─── Send message ──────────────────────────────────────────────────────

  const callHermesApi = useCallback(async (message: string): Promise<string> => {
    try {
      const res = await fetch('/api/hermes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) {
        throw new Error(`API ${res.status}`)
      }
      const data = await res.json()
      if (typeof data?.content === 'string' && data.content.trim().length > 0) {
        return data.content
      }
      throw new Error('Empty response')
    } catch {
      // Graceful fallback with Manglish personality
      return `Eh, my connection to the cloud gila slow right now 😅\n\nBut steady lah — here's what I can suggest: focus on your **top 3 best-converting products** this week. Push more content around them, A/B test 2 different hooks, and post during peak hours (8-10 PM MYT).\n\nTry sending your message again in a moment — I'll have fresher data then 🔧`
    }
  }, [])

  const handleSend = useCallback(
    async (text: string, cannedResponse?: string) => {
      const trimmed = text.trim()
      if (!trimmed || isThinking) return

      const userMsg: ChatMessage = {
        id: makeId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      }

      setMessages((cur) => [...cur, userMsg])
      setInput('')
      setIsThinking(true)
      setMascotExpression('thinking')

      // Always show "thinking" for at least THINKING_DELAY_MS (perceived value)
      const minDelay = new Promise<void>((resolve) => setTimeout(resolve, THINKING_DELAY_MS))

      try {
        let content: string
        if (cannedResponse) {
          await minDelay
          content = cannedResponse
        } else {
          const [apiContent] = await Promise.all([callHermesApi(trimmed), minDelay])
          // Sprinkle Manglish prefix occasionally to add character
          const prefix = Math.random() < 0.35 ? `${randomManglishPrefix()}\n\n` : ''
          content = `${prefix}${apiContent}`
        }

        const hermesMsg: ChatMessage = {
          id: makeId(),
          role: 'hermes',
          content,
          timestamp: Date.now(),
        }
        setMessages((cur) => [...cur, hermesMsg])

        // Mascot briefly excited, then back to happy
        setMascotExpression('excited')
        setTimeout(() => setMascotExpression('happy'), 1500)

        // If widget closed, increment unread
        setIsOpen((open) => {
          if (!open) {
            setUnreadCount((c) => c + 1)
          }
          return open
        })
      } catch {
        const errorMsg: ChatMessage = {
          id: makeId(),
          role: 'hermes',
          content:
            'Sorry ah, something went wrong on my end 😿. Please try again in a moment — I\'m refreshing my data sources.',
          timestamp: Date.now(),
        }
        setMessages((cur) => [...cur, errorMsg])
      } finally {
        setIsThinking(false)
      }
    },
    [isThinking, callHermesApi],
  )

  // Keep handleSendRef in sync so event listeners can call the latest version
  useEffect(() => {
    handleSendRef.current = handleSend
  }, [handleSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const handleVoiceInput = () => {
    toast.info('Voice input coming soon 🎤', {
      description: 'We\'re training HERMES to understand Manglish voice commands. Stay tuned!',
    })
  }

  const handleHintClick = () => {
    if (!activePage || !showHint) return
    markSeen(activePage)
    setShowHint(null)
    setIsOpen(true)
    setUnreadCount(0)
    if (showHint.introPrompt) {
      setTimeout(() => handleSend(showHint.introPrompt), 500)
    }
  }

  const handleHintDismiss = () => {
    if (!activePage) return
    markDismissed(activePage)
    setShowHint(null)
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed bottom-20 right-4 z-50 lg:bottom-6 flex flex-col items-end gap-3 pointer-events-none">
        {/* Contextual hint bubble (above button) */}
        <AnimatePresence>
          {showHint && !isOpen && (
            <motion.div
              key="hint-bubble"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="pointer-events-auto relative w-[280px] max-w-[calc(100vw-2rem)] rounded-2xl border border-hermes/30 bg-background shadow-xl shadow-hermes/10 p-3 pr-8"
            >
              <button
                aria-label="Dismiss hint"
                onClick={handleHintDismiss}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 rounded-lg bg-hermes/10 p-1">
                  <HermesMascot size="sm" expression="happy" animate={false} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-hermes mb-0.5 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> HERMES Tip
                  </p>
                  <p className="text-sm font-semibold text-foreground leading-snug mb-0.5">
                    {showHint.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {showHint.message}
                  </p>
                  <button
                    onClick={handleHintClick}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-hermes hover:text-hermes-dark transition-colors"
                  >
                    Show me around →
                  </button>
                </div>
              </div>
              {/* Speech tail */}
              <div className="absolute -bottom-2 right-8 w-4 h-4 rotate-45 bg-background border-r border-b border-hermes/30" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="pointer-events-auto w-[calc(100vw-2rem)] sm:w-[360px] h-[540px] max-h-[calc(100vh-7rem)] rounded-2xl border border-hermes/30 bg-background shadow-2xl shadow-hermes/20 overflow-hidden flex flex-col"
              role="dialog"
              aria-label="HERMES AI chat"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-hermes to-hermes-dark text-white px-4 py-3 flex items-center gap-3">
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 40%)',
                  }}
                />
                <div className="relative bg-white/15 rounded-xl p-1 flex-shrink-0">
                  <HermesMascot size="sm" expression={mascotExpression} animate={false} />
                </div>
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-sm leading-none">HERMES AI</h2>
                    <Sparkles className="w-3.5 h-3.5 text-shopee" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                    </span>
                    <span className="text-[11px] text-white/80">Online • Replies fast</span>
                  </div>
                </div>

                {/* Clear chat */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                      onClick={() => setShowClearConfirm((s) => !s)}
                      aria-label="Clear chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Clear chat history</TooltipContent>
                </Tooltip>

                {/* Close */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                  onClick={closeWidget}
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </Button>

                {/* Clear confirm overlay */}
                <AnimatePresence>
                  {showClearConfirm && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full right-0 mt-2 w-56 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-3 z-10"
                    >
                      <p className="text-xs font-medium mb-2">Clear all chat history?</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs flex-1"
                          onClick={handleClearChat}
                        >
                          Yes, clear
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs flex-1"
                          onClick={() => setShowClearConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 bg-muted/20 space-y-3">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Thinking indicator */}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex items-end gap-2"
                    >
                      <div className="flex-shrink-0 rounded-lg bg-hermes/10 p-0.5">
                        <HermesMascot size="sm" expression="thinking" animate={false} />
                      </div>
                      <div className="bg-hermes/10 rounded-2xl rounded-bl-md px-3.5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-hermes" />
                          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-hermes" />
                          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-hermes" />
                          <span className="text-[11px] text-muted-foreground ml-1.5 italic">
                            HERMES is thinking...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts */}
              <div className="px-3 py-2 border-t border-border bg-background">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar-mobile pb-1">
                  {quickPrompts.map((qp) => (
                    <button
                      key={qp.id}
                      onClick={qp.handler}
                      disabled={isThinking}
                      className={cn(
                        'inline-flex items-center gap-1 flex-shrink-0 rounded-full border border-hermes/30 bg-hermes/5 hover:bg-hermes/10 hover:border-hermes/50',
                        'text-[11px] font-medium text-hermes px-2.5 py-1 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                    >
                      <qp.icon className="w-3 h-3 flex-shrink-0" />
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border bg-background">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-hermes"
                        onClick={handleVoiceInput}
                        aria-label="Voice input"
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Voice input (coming soon)</TooltipContent>
                  </Tooltip>

                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask HERMES anything..."
                    disabled={isThinking}
                    className="flex-1 h-9 text-sm border-hermes/20 focus-visible:ring-hermes/30"
                    aria-label="Message HERMES"
                  />

                  <Button
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 bg-shopee hover:bg-shopee/90 text-white"
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || isThinking}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating button */}
        <motion.button
          onClick={handleOpenToggle}
          className={cn(
            'pointer-events-auto relative h-14 w-14 rounded-full bg-hermes hover:bg-hermes-dark',
            'text-white shadow-xl shadow-hermes/40 flex items-center justify-center',
            'transition-colors',
          )}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isOpen ? 'Close HERMES chat' : 'Open HERMES chat'}
        >
          {/* Pulse ring (first visit only) */}
          <AnimatePresence>
            {showPulse && !isOpen && (
              <motion.span
                className="absolute inset-0 rounded-full bg-hermes"
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                <Bot className="w-6 h-6" />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Unread badge */}
          {unreadCount > 0 && !isOpen && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>
      </div>
    </TooltipProvider>
  )
}

// ─── Message bubble sub-component ────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex items-end gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mb-0.5">
        {isUser ? (
          <div className="h-7 w-7 rounded-full bg-shopee/20 border border-shopee/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-shopee">YOU</span>
          </div>
        ) : (
          <div className="rounded-full bg-hermes/10 p-0.5">
            <HermesMascot size="sm" expression="happy" animate={false} />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-shopee text-white rounded-br-md'
            : 'bg-hermes/10 text-foreground rounded-bl-md border border-hermes/15',
        )}
      >
        {renderMessageContent(message.content)}
      </div>
    </motion.div>
  )
}

// Light markdown rendering: **bold**, *italic*, line breaks preserved.
function renderMessageContent(content: string) {
  const lines = content.split('\n')
  return lines.map((line, idx) => {
    if (line.trim() === '') {
      return <div key={idx} className="h-2" />
    }
    return (
      <div key={idx}>
        {parseInline(line)}
      </div>
    )
  })
}

function parseInline(text: string): React.ReactNode[] {
  // Tokenize for **bold**, *italic*
  const tokens: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index))
    }
    const m = match[0]
    if (m.startsWith('**')) {
      tokens.push(
        <strong key={`b-${key++}`} className={cn('font-bold')}>
          {m.slice(2, -2)}
        </strong>,
      )
    } else {
      tokens.push(
        <em key={`i-${key++}`} className="italic">
          {m.slice(1, -1)}
        </em>,
      )
    }
    lastIndex = match.index + m.length
  }
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex))
  }
  return tokens
}

export default HermesChatWidget
