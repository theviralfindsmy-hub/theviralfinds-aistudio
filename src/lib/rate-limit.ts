/**
 * Lightweight in-memory rate limiter.
 *
 * Stores request counts per identifier (typically client IP) with a sliding
 * window. Uses a Map keyed by identifier; entries are evicted lazily when the
 * window expires or when the map grows too large.
 *
 * NOTE: This is suitable for a single-process Next.js dev server. For
 * production multi-instance deployments, use Redis or similar shared store.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const MAX_ENTRIES = 10_000
const store = new Map<string, RateLimitRecord>()

/** Periodically purge expired entries to prevent memory leaks */
function purgeExpired(now: number) {
  if (store.size < MAX_ENTRIES) return
  for (const [key, record] of store) {
    if (now > record.resetTime) {
      store.delete(key)
    }
  }
  // If still too large, clear oldest half
  if (store.size >= MAX_ENTRIES) {
    const entries = [...store.entries()].sort(
      (a, b) => a[1].resetTime - b[1].resetTime
    )
    const toRemove = Math.floor(entries.length / 2)
    for (let i = 0; i < toRemove; i++) {
      store.delete(entries[i][0])
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Unix ms timestamp when the limit resets */
  resetAt: number
  /** Total limit for this window */
  limit: number
}

/**
 * Check rate limit for a given identifier.
 *
 * @param identifier  Unique key (IP address, user ID, etc.)
 * @param limit       Max requests allowed in the window
 * @param windowMs    Window size in milliseconds (default 60s)
 */
export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now()
  purgeExpired(now)

  const existing = store.get(identifier)

  if (!existing || now > existing.resetTime) {
    const resetAt = now + windowMs
    store.set(identifier, { count: 1, resetTime: resetAt })
    return { allowed: true, remaining: limit - 1, resetAt, limit }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetTime, limit }
  }

  existing.count++
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetTime,
    limit,
  }
}

/**
 * Extract a best-effort client identifier from a Request.
 * Prefers x-forwarded-for, falls back to cf-connecting-ip, then 'unknown'.
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    // Could be a list "client, proxy1, proxy2"; take the first
    return forwarded.split(',')[0].trim()
  }
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

/**
 * Check rate limit for an incoming request.
 * Returns the result; if `allowed === false`, the caller should respond 429.
 *
 * @example
 *   const rl = checkRateLimit(req, 30)
 *   if (!rl.allowed) {
 *     return NextResponse.json({ error: 'Too many requests' }, {
 *       status: 429,
 *       headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
 *     })
 *   }
 */
export function checkRateLimit(
  req: Request,
  limit: number = 100,
  windowMs?: number
): RateLimitResult {
  const identifier = getClientIdentifier(req)
  return rateLimit(identifier, limit, windowMs)
}

/** Preset rate limit tiers for different endpoint types */
export const RATE_LIMITS = {
  /** Read-only GET endpoints — generous */
  read: { limit: 200, windowMs: 60_000 },
  /** AI generation endpoints — expensive, so stricter */
  ai: { limit: 20, windowMs: 60_000 },
  /** Mutation endpoints (POST/PATCH/DELETE) — moderate */
  write: { limit: 60, windowMs: 60_000 },
  /** Public webhook receivers — very generous */
  webhook: { limit: 500, windowMs: 60_000 },
} as const
