import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleError, ApiError } from '@/lib/api-error'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { executeScheduledPosts } from '@/lib/social/publisher'

/**
 * POST /api/social/execute
 *
 * Cron-friendly endpoint that triggers the scheduled post execution engine.
 * Finds all due scheduled posts (scheduledAt <= now) and publishes them.
 *
 * This is the "cron" entry point — it's a public endpoint (no auth) so
 * external cron services (Vercel Cron, cron-job.org, etc.) can hit it.
 * Add `?apiKey=...` for a minimal shared-secret check if you want to
 * prevent abuse.
 *
 * Body (optional):
 *   { postId?: string, retry?: boolean, limit?: number }
 *
 * If body is empty, processes all due posts (status in ['scheduled',
 * 'partial', 'failed'] with retry=true).
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.webhook)) {
      return enforceRateLimit(request, RATE_LIMITS.webhook)!
    }

    // Optional shared-secret check
    const expectedKey = process.env.SOCIAL_CRON_API_KEY
    if (expectedKey) {
      const providedKey = request.headers.get('x-api-key')
        || new URL(request.url).searchParams.get('apiKey')
      if (providedKey !== expectedKey) {
        throw ApiError.unauthorized('Invalid or missing API key')
      }
    }

    // Parse body (optional)
    let body: { postId?: string; retry?: boolean; limit?: number } = {}
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      // Empty / malformed body is OK — process all due posts
      body = {}
    }

    const result = await executeScheduledPosts({
      postId: body.postId,
      retry: body.retry !== false, // default true
      limit: body.limit && body.limit > 0 ? Math.min(body.limit, 50) : 20,
    })

    return NextResponse.json({
      success: true,
      processed: result.processed,
      published: result.published,
      failed: result.failed,
      retried: result.retried,
      skipped: result.skipped,
      results: result.results,
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/social/execute
 *
 * Same as POST but accessible via simple GET (for use with cron services
 * that don't support POST). Same optional apiKey check.
 */
export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.webhook)) {
      return enforceRateLimit(request, RATE_LIMITS.webhook)!
    }

    const expectedKey = process.env.SOCIAL_CRON_API_KEY
    if (expectedKey) {
      const providedKey = request.headers.get('x-api-key')
        || new URL(request.url).searchParams.get('apiKey')
      if (providedKey !== expectedKey) {
        throw ApiError.unauthorized('Invalid or missing API key')
      }
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId') || undefined
    const retry = searchParams.get('retry') !== 'false'
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20

    const result = await executeScheduledPosts({ postId, retry, limit })

    return NextResponse.json({
      success: true,
      processed: result.processed,
      published: result.published,
      failed: result.failed,
      retried: result.retried,
      skipped: result.skipped,
      results: result.results,
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    return handleError(error)
  }
}
