'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * useOfflineMode
 * --------------
 * Tracks the browser's online/offline status, remembers the last time we were
 * online (persisted to localStorage so it survives reloads), and exposes
 * whether TanStack Query has any cached data we can fall back on while offline.
 *
 * Why a separate hook from `useNetworkStatus`?
 *   - `useNetworkStatus` only returns `isOnline: boolean` and fires toasts.
 *   - This hook layers on top: lastOnline timestamp, cachedDataAvailable flag,
 *     and the inverse `isOffline` boolean for ergonomic `<OfflineBanner>` use.
 *
 * @example
 *   const { isOffline, lastOnline, cachedDataAvailable } = useOfflineMode()
 *   if (isOffline) return <OfflineBanner lastOnline={lastOnline} />
 */

const LAST_ONLINE_KEY = 'tvf_last_online'

export interface OfflineModeState {
  isOnline: boolean
  isOffline: boolean
  lastOnline: Date | null
  cachedDataAvailable: boolean
}

function readLastOnline(): Date | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LAST_ONLINE_KEY)
    if (!raw) return null
    const ms = Number(raw)
    if (!Number.isFinite(ms)) return null
    return new Date(ms)
  } catch {
    return null
  }
}

function writeLastOnline(date: Date): void {
  try {
    window.localStorage.setItem(LAST_ONLINE_KEY, String(date.getTime()))
  } catch {
    // localStorage might be unavailable (private mode) — silent fail.
  }
}

export function useOfflineMode(): OfflineModeState {
  // SSR-safe: assume online during server render so the banner doesn't render.
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [lastOnline, setLastOnline] = useState<Date | null>(null)
  const [cachedDataAvailable, setCachedDataAvailable] = useState<boolean>(false)
  const queryClient = useQueryClient()

  // On mount (client only), hydrate lastOnline from localStorage.
  useEffect(() => {
    // Use a microtask to avoid setState-during-render lint warning.
    const id = window.setTimeout(() => {
      setLastOnline(readLastOnline())
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  // Listen for online/offline events and persist lastOnline timestamp.
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      const now = new Date()
      writeLastOnline(now)
      setLastOnline(now)
    }
    const handleOffline = () => {
      setIsOnline(false)
      // Capture the moment we lost connectivity, if we don't already have one.
      // (If the user reloads while offline, we want to keep the previous value.)
      const prev = readLastOnline()
      if (!prev) {
        const now = new Date()
        writeLastOnline(now)
        setLastOnline(now)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Refresh the cachedDataAvailable flag whenever cache changes or we go offline.
  // QueryClient's cache has a `subscribe` API we can use to keep this in sync.
  useEffect(() => {
    const checkCache = () => {
      try {
        // getQueriesData() returns an array of [queryKey, data] tuples for
        // every cached query. If any has non-null data, we have something to
        // fall back on.
        const all = queryClient.getQueriesData<unknown>({ queryKey: [] })
        const hasData = all.some((entry) => {
          if (!Array.isArray(entry)) return false
          const data = entry[1]
          return data !== undefined && data !== null
        })
        setCachedDataAvailable(hasData)
      } catch {
        setCachedDataAvailable(false)
      }
    }

    // Initial check (deferred to avoid setState-in-effect lint warning).
    const id = window.setTimeout(checkCache, 0)

    // Subscribe to future cache changes.
    const unsubscribe = queryClient.getQueryCache().subscribe(checkCache)

    return () => {
      window.clearTimeout(id)
      unsubscribe()
    }
  }, [queryClient])

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnline,
    cachedDataAvailable,
  }
}
