'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildTickerEntry,
  type TickerEntry,
} from '@/lib/community/mock-data'

const MAX_ENTRIES = 5 // visible at once
const MIN_INTERVAL = 3000
const MAX_INTERVAL = 5000

interface LiveEarningsTickerProps {
  className?: string
  /** Compact mode: smaller text + no LIVE label */
  compact?: boolean
}

function getVerb(template: TickerEntry['template']): string {
  switch (template) {
    case 'earned':
      return 'earned by'
    case 'commission':
      return 'commission for'
    case 'payout':
      return 'payout to'
    case 'sale':
      return 'sale by'
    case 'milestone':
      return 'milestone reached by'
    default:
      return ''
  }
}

export function LiveEarningsTicker({
  className,
  compact = false,
}: LiveEarningsTickerProps) {
  // Seed with 5 entries so it doesn't start empty
  const [entries, setEntries] = useState<TickerEntry[]>(() => {
    return Array.from({ length: MAX_ENTRIES }, () => buildTickerEntry())
  })
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pushEntry = useCallback(() => {
    setEntries((prev) => {
      const next = buildTickerEntry()
      // Add to end (right), drop oldest (left)
      return [...prev, next].slice(-MAX_ENTRIES)
    })
  }, [])

  useEffect(() => {
    if (paused) return
    let cancelled = false
    const schedule = () => {
      const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL)
      timerRef.current = setTimeout(() => {
        if (cancelled) return
        pushEntry()
        schedule()
      }, delay)
    }
    schedule()
    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [paused, pushEntry])

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm',
        compact ? 'py-1.5' : 'py-2',
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="status"
      aria-live="polite"
      aria-label="Live earnings ticker"
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-card to-transparent" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-card to-transparent" />

      <div
        className={cn(
          'flex items-center gap-2 px-3',
          compact ? 'text-xs' : 'text-sm',
        )}
      >
        {/* LIVE indicator */}
        <div className="flex shrink-0 items-center gap-1.5 pr-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          {!compact && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
              Live
            </span>
          )}
        </div>

        {/* Ticker items: horizontal flex with new items sliding in from right */}
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, x: 60 }}
                animate={{
                  opacity: i === entries.length - 1 ? 1 : 0.85,
                  x: 0,
                }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-1.5 whitespace-nowrap pr-4"
              >
                <span
                  className={cn(
                    'font-semibold',
                    i === entries.length - 1
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground',
                  )}
                >
                  RM {entry.amount.toLocaleString('en-MY', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={cn(
                    'text-muted-foreground',
                    compact ? 'text-[10px]' : 'text-xs',
                  )}
                >
                  {getVerb(entry.template)} {entry.subject}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span
                  className={cn(
                    'text-muted-foreground/70',
                    compact ? 'text-[10px]' : 'text-xs',
                  )}
                >
                  {entry.platform}
                </span>
                <span className="mx-1 text-muted-foreground/30">|</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Live radio icon */}
        {!compact && (
          <Radio className="size-4 shrink-0 animate-pulse text-red-500" aria-hidden />
        )}
      </div>
    </div>
  )
}

export default LiveEarningsTicker
