'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { WifiOff, X, CloudOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useOfflineMode } from '@/hooks/use-offline-mode'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

/**
 * OfflineBanner
 * -------------
 * Polished amber banner shown when the browser is offline. Replaces the bare
 * toast-only behaviour of `useNetworkStatus` with a persistent, dismissible
 * indicator that:
 *   - Tells the user we're showing cached data
 *   - Shows the last time we synced
 *   - Auto-hides when back online (+ a green "Back online!" toast for 2s)
 *   - Has a Retry button that invalidates the cache when reconnected
 *
 * Renders `null` while online so it takes no layout space.
 *
 * Color discipline: bg-amber-100 / text-amber-900 / border-amber-300.
 * Back-online toast: bg-emerald-600 text-white. NO indigo / blue.
 */

/** Human-friendly relative time formatter (e.g. "2 minutes ago"). */
function formatLastSync(date: Date | null): string {
  if (!date) return 'unknown'
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return 'just now'
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

/** Returns a current-time string, re-rendered every 30s so "2m ago" stays fresh. */
function useTickingLastSync(date: Date | null): string {
  // Tick state — only used to force a re-render every 30s.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!date) return
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000)
    return () => window.clearInterval(id)
  }, [date])
  return formatLastSync(date)
}

export function OfflineBanner() {
  const { isOffline, lastOnline, cachedDataAvailable } = useOfflineMode()
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotion()

  // Track which "offline session" the user dismissed — reappears next session.
  // We key the dismissal on the lastOnline timestamp so each new offline
  // window starts undismissed.
  const [dismissedSession, setDismissedSession] = useState<number | null>(null)
  // Have we already fired the "Back online!" toast for this recovery?
  const [recoveryToastShown, setRecoveryToastShown] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const sessionId = lastOnline ? lastOnline.getTime() : null
  const isDismissed = isOffline && sessionId !== null && dismissedSession === sessionId

  const lastSyncLabel = useTickingLastSync(lastOnline)

  // When we go from offline → online, fire the green recovery toast exactly
  // once, then clear the dismissal so a subsequent offline trip re-shows the
  // banner. Also invalidate queries so fresh data is fetched.
  useEffect(() => {
    if (!isOffline && !recoveryToastShown && sessionId !== null) {
      setRecoveryToastShown(true)
      setDismissedSession(null)
      // Invalidate so reconnect triggers a fresh fetch per our
      // refetchOnReconnect: 'always' default.
      void queryClient.invalidateQueries()
      toast.success('Back online!', {
        description: 'Fresh data is syncing now.',
        duration: 2000,
        style: {
          background: '#059669',
          color: '#ffffff',
          border: '1px solid #047857',
        },
      })
    }
    // Reset the flag when we go offline again so the next recovery re-fires.
    if (isOffline && recoveryToastShown) {
      setRecoveryToastShown(false)
    }
  }, [isOffline, recoveryToastShown, sessionId, queryClient])

  const handleDismiss = () => {
    if (sessionId !== null) setDismissedSession(sessionId)
  }

  const handleRetry = async () => {
    setRetrying(true)
    // Invalidate and let react-query attempt to refetch. If we're still
    // offline, the queries will fail and the banner stays.
    try {
      await queryClient.invalidateQueries()
      await queryClient.refetchQueries({ type: 'active' })
    } finally {
      setRetrying(false)
    }
  }

  const shouldShow = isOffline && !isDismissed

  // Animation variants — respect prefers-reduced-motion.
  const variants = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="offline-banner"
          role="status"
          aria-live="polite"
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'sticky top-0 z-[60] w-full',
            'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
            'border-b border-amber-300 dark:border-amber-700/50',
            'px-4 py-2.5 flex items-center justify-between gap-3 text-sm'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-300/50 dark:bg-amber-700/40 flex items-center justify-center">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-tight truncate">
                You&rsquo;re offline — showing last synced data
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-200/70 leading-tight flex items-center gap-1.5">
                <CloudOff className="w-3 h-3 flex-shrink-0" />
                {cachedDataAvailable ? (
                  <>
                    Last synced: <span className="font-medium tabular-nums">{lastSyncLabel}</span>
                  </>
                ) : (
                  'No cached data available yet'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className={cn(
                'flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium',
                'bg-amber-200/60 hover:bg-amber-200 dark:bg-amber-800/40 dark:hover:bg-amber-800/60',
                'text-amber-900 dark:text-amber-100',
                'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label="Retry connection"
            >
              <RefreshCw className={cn('w-3 h-3', retrying && 'animate-spin')} />
              <span className="hidden sm:inline">Retry</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss offline banner"
              className="p-1 rounded-md hover:bg-amber-200/60 dark:hover:bg-amber-800/40 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineBanner
