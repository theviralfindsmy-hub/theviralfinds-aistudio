/**
 * RealtimeProvider — mounts once near the app root, establishes a WebSocket
 * connection to the notification mini-service, and forwards all events into
 * the realtime store + sonner toasts.
 *
 * Renders `null` (no DOM). Children are passed through unchanged.
 *
 * Reconnection notices: a subtle toast is shown only after 10 seconds of
 * being disconnected, rather than a persistent banner.
 *
 * Usage:
 *   <RealtimeProvider>{children}</RealtimeProvider>
 */

'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { useRealtimeStore } from '@/store/realtime-store'
import { useAppStore } from '@/store/app-store'
import { DEMO_USER_ID } from '@/lib/realtime/constants'
import { toast } from 'sonner'

/** Milliseconds to wait before showing the reconnection toast. */
const RECONNECT_NOTICE_DELAY = 10_000

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const userId = isAuthenticated ? DEMO_USER_ID : undefined

  // Single source of truth for the socket connection.
  useRealtime(userId)

  // ─── Delayed reconnection toast ─────────────────────────────────────────
  const isConnected = useRealtimeStore((s) => s.isConnected)
  const isReconnecting = useRealtimeStore((s) => s.isReconnecting)
  const toastShownRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear any pending timer when connected
    if (isConnected) {
      toastShownRef.current = false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Only show toast when disconnected and after the delay
    if (isReconnecting && !toastShownRef.current) {
      timerRef.current = setTimeout(() => {
        // Double-check we're still reconnecting before showing
        const stillReconnecting = useRealtimeStore.getState().isReconnecting
        if (stillReconnecting && !toastShownRef.current) {
          toastShownRef.current = true
          toast('Reconnecting to real-time service…', {
            description: 'Live notifications may be delayed.',
            duration: 6000,
          })
        }
      }, RECONNECT_NOTICE_DELAY)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isConnected, isReconnecting])

  return <>{children}</>
}
