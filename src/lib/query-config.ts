/**
 * TanStack Query configuration for TheViralFindsMY.
 *
 * The goal is to make the app feel INSTANT by tiering stale times based on how
 * often the underlying data changes. Sensitive/real-time data (earnings, KPIs)
 * refetches often; stable data (trends, leaderboard) stays cached longer.
 *
 * Usage:
 *   import { defaultQueryClientOptions, QUERY_STALE_TIME } from '@/lib/query-config'
 *   const queryClient = new QueryClient({ defaultOptions: defaultQueryClientOptions })
 *
 *   // In a hook:
 *   useQuery({ queryKey, queryFn, staleTime: QUERY_STALE_TIME.dashboard })
 */

import type { DefaultOptions } from '@tanstack/react-query'

/**
 * Tiered stale times (ms) per data domain.
 *
 * Pick the value that matches how often the underlying source changes:
 * - 0s  → always refetch on mount (user-specific volatile state)
 * - 30s → money / KPIs — needs freshness
 * - 60s → products / marketplace — change occasionally
 * - 2m  → analytics — hourly rollups
 * - 5m  → trends — stable within hours
 * - 10m → leaderboard — daily snapshot
 */
export const QUERY_STALE_TIME = {
  dashboard: 30_000, // 30s — KPIs need freshness
  products: 60_000, // 1m — products don't change often
  trends: 300_000, // 5m — trends are stable
  analytics: 120_000, // 2m — analytics hourly
  earnings: 30_000, // 30s — money matters
  leaderboard: 600_000, // 10m — leaderboard daily
  marketplace: 60_000, // 1m
  user: 0, // always refetch
} as const

/** Garbage collection window — keep unused query data around for 5 minutes. */
export const QUERY_GC_TIME = 5 * 60 * 1000 // 5 min

/**
 * Error shape we expect from API routes. The fetch-utils layer stamps a
 * `status` field onto thrown Errors so we can branch on HTTP status codes.
 */
interface HttpErrorLike extends Error {
  status?: number
}

/**
 * Decide whether to retry a failed query.
 *
 * - Never retry 4xx responses (client error — won't fix itself).
 * - Retry up to 2 times for 5xx / network errors.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as HttpErrorLike).status
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return false
    }
  }
  return failureCount < 2
}

/**
 * Exponential backoff with a 30s ceiling. Capped so users on flaky networks
 * aren't waiting minutes between retries.
 */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30_000)
}

/**
 * Default options applied to every QueryClient created in the app.
 *
 * `refetchOnWindowFocus: false` — too noisy for an analytics dashboard where
 * users tab in/out constantly. `refetchOnReconnect: 'always'` ensures the
 * moment we recover from a network drop, fresh data is fetched.
 */
export const defaultQueryClientOptions: DefaultOptions = {
  queries: {
    staleTime: QUERY_STALE_TIME.dashboard, // sensible default; override per query
    gcTime: QUERY_GC_TIME,
    retry: shouldRetry,
    retryDelay,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
  },
  mutations: {
    retry: 1,
  },
}
