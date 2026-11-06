import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleError, ApiError } from '@/lib/api-error'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { publishPost } from '@/lib/social/publisher'

/**
 * POST /api/social/post/[id]/retry
 *
 * Retries publishing a failed (or partial) ScheduledPost.
 * Resets the post.status back to 'scheduled' and triggers the publisher
 * engine for this single post. Failed PostLogs under MAX_ATTEMPTS (3)
 * will get one more attempt; succeeded platforms are skipped.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }

    const { id } = await params

    const post = await db.scheduledPost.findUnique({ where: { id } })
    if (!post) {
      throw ApiError.notFound('Scheduled post not found')
    }

    if (post.status === 'published') {
      return NextResponse.json({
        success: false,
        message: 'Post is already published — nothing to retry.',
        postId: id,
        status: post.status,
      })
    }

    if ((post.retryCount || 0) >= 3) {
      throw ApiError.badRequest(`Max overall retries (3) already exceeded for this post`)
    }

    // Reset the post status to 'scheduled' so the publisher will pick it up.
    await db.scheduledPost.update({
      where: { id },
      data: { status: 'scheduled', errorMessage: null },
    })

    // Trigger the publisher for this single post
    const result = await publishPost(
      await db.scheduledPost.findUniqueOrThrow({ where: { id } })
    )

    return NextResponse.json({
      success: true,
      postId: id,
      status: result.status,
      platforms: result.platforms,
      retriedAt: new Date().toISOString(),
    })
  } catch (error) {
    return handleError(error)
  }
}
