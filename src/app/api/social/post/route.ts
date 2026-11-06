import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleError, ApiError } from '@/lib/api-error'
import { validateBody, socialPostSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { publishPost } from '@/lib/social/publisher'

/**
 * POST /api/social/post
 *
 * Publishes a post to its connected platforms. Two modes:
 *
 *   1. With postId: looks up an existing ScheduledPost and publishes it now
 *      (regardless of scheduledAt).
 *   2. With caption + platforms (+ optional imageUrl/affiliateLink/etc.):
 *      creates a ScheduledPost AND publishes it immediately.
 *
 * Returns the per-platform publish results.
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }

    const body = await validateBody(request, socialPostSchema)

    let postId: string
    let isExisting = false

    if (body.postId) {
      // Mode 1: publish an existing scheduled post
      const existing = await db.scheduledPost.findUnique({
        where: { id: body.postId },
      })
      if (!existing) {
        throw ApiError.notFound('Scheduled post not found')
      }
      postId = existing.id
      isExisting = true
    } else {
      // Mode 2: create a new post and publish it immediately
      const created = await db.scheduledPost.create({
        data: {
          caption: body.caption!,
          platforms: JSON.stringify(body.platforms),
          productUrl: body.productUrl || null,
          affiliateLink: body.affiliateLink || null,
          imageUrl: body.imageUrl || null,
          hashtags: body.hashtags ? JSON.stringify(body.hashtags) : null,
          status: 'scheduled',
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
        },
      })
      postId = created.id
    }

    // Run the publisher engine for this post
    const result = await publishPost(
      await db.scheduledPost.findUniqueOrThrow({ where: { id: postId } })
    )

    return NextResponse.json({
      success: true,
      postId,
      isExisting,
      status: result.status,
      platforms: result.platforms,
    }, { status: isExisting ? 200 : 201 })
  } catch (error) {
    return handleError(error)
  }
}
