import { NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMITS, type RateLimitResult } from './rate-limit'

// Re-export so callers can import everything from a single module
export { RATE_LIMITS }

/**
 * Convenience: enforce a rate limit on a request. If exceeded, returns a 429
 * NextResponse (with Retry-After header). Otherwise returns null and the
 * caller continues normally.
 *
 * @example
 *   const limited = enforceRateLimit(req, RATE_LIMITS.ai)
 *   if (limited) return limited
 *   // ...continue handler
 */
export function enforceRateLimit(
  req: Request,
  preset: { limit: number; windowMs: number } = RATE_LIMITS.read
): NextResponse | null {
  const result: RateLimitResult = checkRateLimit(req, preset.limit, preset.windowMs)
  if (!result.allowed) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit of ${result.limit} requests per ${Math.round(
          preset.windowMs / 1000
        )}s exceeded. Try again in ${retryAfter}s.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
        },
      }
    )
  }
  return null
}
