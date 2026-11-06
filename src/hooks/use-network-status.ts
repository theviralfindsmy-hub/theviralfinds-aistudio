'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

/**
 * Tracks the browser's online/offline status and emits toast notifications
 * when the status changes. Returns the current online status.
 *
 * @example
 *   const isOnline = useNetworkStatus()
 *   return !isOnline && <OfflineBanner />
 */
export function useNetworkStatus(): boolean {
  // Always initialize to true so SSR and initial client hydration match
  const [isOnline, setIsOnline] = useState<boolean>(true)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Back online', {
        description: 'Your changes will now sync.',
      })
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.error('You are offline', {
        description: 'Some features may not work until you reconnect.',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * Returns a stable callback to manually test connectivity by pinging an API.
 * Useful for "retry" buttons when offline indicator is shown.
 */
export function useRetryConnection() {
  return useCallback(async (): Promise<boolean> => {
    try {
      // Hit a cheap endpoint to verify connectivity
      const res = await fetch('/api/health', { cache: 'no-store' })
      return res.ok
    } catch {
      return false
    }
  }, [])
}
