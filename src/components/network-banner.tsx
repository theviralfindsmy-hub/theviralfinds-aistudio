'use client'

import { useEffect, useState } from 'react'
import { WifiOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNetworkStatus, useRetryConnection } from '@/hooks/use-network-status'

/**
 * Sticky top banner shown when the browser is offline. Auto-shows/hides based
 * on navigator.onLine. Includes a "Retry" button that pings /api/health.
 *
 * Renders null while online so it takes no layout space.
 */
export function NetworkBanner() {
  const isOnline = useNetworkStatus()
  // Track which "offline session" the user has dismissed — when the user
  // comes back online and then offline again, the banner reappears.
  const [dismissedSession, setDismissedSession] = useState<number | null>(null)
  const [retrying, setRetrying] = useState(false)
  const retry = useRetryConnection()

  // Reset dismissal whenever we go online (so the next offline session shows
  // the banner again). We use a ref-like counter via isOnline transitions.
  useEffect(() => {
    if (isOnline && dismissedSession !== null) {
      // Use microtask to avoid setState-in-effect warning by deferring.
      const id = window.setTimeout(() => setDismissedSession(null), 0)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [isOnline, dismissedSession])

  // Track the current offline session id
  const sessionId = isOnline ? null : 1
  const isDismissed = sessionId !== null && dismissedSession === sessionId

  if (isOnline || isDismissed) return null

  const handleRetry = async () => {
    setRetrying(true)
    await retry()
    setRetrying(false)
    // If still offline, the hook's toast already informed the user.
    // If back online, the banner will auto-hide via isOnline transition.
  }

  const handleDismiss = () => {
    if (sessionId !== null) setDismissedSession(sessionId)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[60] w-full bg-amber-500 text-amber-950 dark:text-amber-50 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>You are offline. Some features may not work.</span>
      <Button
        size="sm"
        variant="outline"
        onClick={handleRetry}
        disabled={retrying}
        className="h-7 px-2 text-xs border-amber-900/30 bg-transparent hover:bg-amber-900/10 text-amber-950 dark:text-amber-50"
      >
        {retrying ? 'Retrying…' : 'Retry'}
      </Button>
      <button
        aria-label="Dismiss"
        onClick={handleDismiss}
        className="ml-1 p-1 rounded hover:bg-amber-900/10"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
