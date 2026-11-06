'use client'

/**
 * HermesReactions — Milestone reaction system
 *
 * Listens for custom DOM events fired anywhere in the app:
 *   - 'hermes:milestone'      — earnings/usage milestones
 *   - 'hermes:first-link'     — first affiliate link created
 *   - 'hermes:streak'         — daily activity streak
 *   - 'hermes:high-conversion'— exceptional conversion rate
 *
 * Each event renders a toast notification (top-right) featuring the
 * HERMES mascot and a Manglish personality message. The toast auto-dismisses
 * after 5s. Clicking "Chat with HERMES" dispatches 'hermes:open-chat' with
 * a detail payload so the chat widget can open and pre-fill a follow-up.
 *
 * Helper `triggerHermesReaction(type, payload?)` is exported for pages
 * and other components to fire reactions without coupling to internals.
 */

import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, MessageCircle, Sparkles } from 'lucide-react'
import { HermesMascot, type HermesExpression } from './hermes-mascot'

export type HermesReactionType =
  | 'milestone'
  | 'first-link'
  | 'streak'
  | 'high-conversion'
  | 'custom'

export interface HermesReactionPayload {
  /** Display title (bold) */
  title?: string
  /** Main message body */
  message: string
  /** Optional follow-up message sent to chat when user clicks "Chat with HERMES" */
  followUp?: string
  /** Mascot expression override */
  expression?: HermesExpression
  /** Duration in ms (default 5000) */
  duration?: number
}

interface ReactionConfig {
  defaultTitle: string
  defaultMessage: string
  defaultFollowUp: string
  expression: HermesExpression
}

const REACTION_CONFIG: Record<Exclude<HermesReactionType, 'custom'>, ReactionConfig> = {
  milestone: {
    defaultTitle: 'Milestone Reached! 🎉',
    defaultMessage: 'Wah, RM 1,000 already! 🔥 Keep going, you memang power!',
    defaultFollowUp: 'I just hit RM 1,000 in earnings! What should I focus on next to scale to RM 5,000?',
    expression: 'excited',
  },
  'first-link': {
    defaultTitle: 'First Link Created! 🔗',
    defaultMessage: 'Your first affiliate link! Memang power 🎉 Now let\'s make it viral.',
    defaultFollowUp: 'I just created my first affiliate link! How do I promote it for maximum clicks?',
    expression: 'happy',
  },
  streak: {
    defaultTitle: 'Streak Unlocked! 🔥',
    defaultMessage: '7-day streak! You\'re on fire 🔥 Stay consistent, results confirm come!',
    defaultFollowUp: 'I just hit a 7-day streak! What\'s the best way to maintain momentum?',
    expression: 'excited',
  },
  'high-conversion': {
    defaultTitle: 'Conversion Champion! 🚀',
    defaultMessage: '23% conversion rate? Best gila! 🚀 You\'re in the top 1% of affiliates!',
    defaultFollowUp: 'My conversion rate just hit 23%! How can I replicate this across other products?',
    expression: 'happy',
  },
}

/**
 * Fire a HERMES milestone reaction from anywhere in the app.
 * Example: triggerHermesReaction('milestone', { message: 'RM 5,000!' })
 */
export function triggerHermesReaction(
  type: HermesReactionType,
  payload?: HermesReactionPayload,
) {
  if (typeof window === 'undefined') return
  const detail = payload ?? { message: '' }
  window.dispatchEvent(
    new CustomEvent<HermesReactionPayload>(`hermes:${type === 'custom' ? 'milestone' : type}`, {
      detail,
    }),
  )
}

interface ToastData {
  id: string | number
  title: string
  message: string
  followUp?: string
  expression: HermesExpression
}

function ReactionToast({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  const handleChat = () => {
    if (data.followUp) {
      window.dispatchEvent(
        new CustomEvent('hermes:open-chat-with-message', { detail: { message: data.followUp } }),
      )
    } else {
      window.dispatchEvent(new CustomEvent('hermes:open-chat'))
    }
    onDismiss()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="pointer-events-auto relative w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-hermes/30 bg-background shadow-xl shadow-hermes/10 overflow-hidden"
    >
      {/* Top accent stripe */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hermes via-hermes to-shopee" />

      <div className="flex items-start gap-3 p-4 pt-5">
        {/* Mascot avatar */}
        <div className="flex-shrink-0 rounded-xl bg-hermes/10 p-1.5">
          <HermesMascot size="sm" expression={data.expression} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-hermes flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wide text-hermes">
              HERMES AI
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug mb-1">
            {data.title}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.message}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleChat}
              className="inline-flex items-center gap-1.5 rounded-md bg-hermes/10 hover:bg-hermes/20 text-hermes text-xs font-semibold px-2.5 py-1.5 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              Chat with HERMES
            </button>
            <button
              onClick={onDismiss}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors"
            >
              <X className="w-3 h-3" />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// In-memory queue so multiple reactions stack visibly (sonner custom toasts
// render in their own portal — we keep a parallel React tree via state).

export function HermesReactions() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const dismiss = useCallback((id: string | number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id))
  }, [])

  const pushReaction = useCallback(
    (type: HermesReactionType, payload?: HermesReactionPayload) => {
      const cfg =
        type === 'custom'
          ? REACTION_CONFIG.milestone
          : REACTION_CONFIG[type as keyof typeof REACTION_CONFIG]

      const data: ToastData = {
        id: Date.now() + Math.random(),
        title: payload?.title ?? cfg.defaultTitle,
        message: payload?.message ?? cfg.defaultMessage,
        followUp: payload?.followUp ?? cfg.defaultFollowUp,
        expression: payload?.expression ?? cfg.expression,
      }

      setToasts((cur) => [...cur, data])

      const duration = payload?.duration ?? 5000
      window.setTimeout(() => dismiss(data.id), duration)
    },
    [dismiss],
  )

  useEffect(() => {
    const listeners: Array<{ type: HermesReactionType; eventName: string }> = [
      { type: 'milestone', eventName: 'hermes:milestone' },
      { type: 'first-link', eventName: 'hermes:first-link' },
      { type: 'streak', eventName: 'hermes:streak' },
      { type: 'high-conversion', eventName: 'hermes:high-conversion' },
    ]
    const handlers: Record<string, (e: Event) => void> = {}
    listeners.forEach(({ type, eventName }) => {
      handlers[eventName] = (e: Event) => {
        const detail = (e as CustomEvent<HermesReactionPayload>).detail ?? {}
        pushReaction(type, detail)
      }
      window.addEventListener(eventName, handlers[eventName])
    })

    return () => {
      listeners.forEach(({ eventName }) => {
        window.removeEventListener(eventName, handlers[eventName])
      })
    }
  }, [pushReaction])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-4 z-[90] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ReactionToast key={t.id} data={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default HermesReactions
