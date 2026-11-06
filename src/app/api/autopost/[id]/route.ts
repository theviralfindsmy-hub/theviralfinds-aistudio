import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateBody, updateAutoPostSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

// PATCH /api/autopost/[id] - Update a scheduled post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const { id } = await params
    const body = await validateBody(request, updateAutoPostSchema)

    const existing = await db.scheduledPost.findUnique({ where: { id } })
    if (!existing) {
      throw ApiError.notFound('Post not found')
    }

    const data: Record<string, unknown> = {}
    if (body.caption !== undefined) data.caption = body.caption
    if (body.platforms !== undefined) data.platforms = JSON.stringify(body.platforms)
    if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt)
    if (body.status !== undefined) {
      data.status = body.status
      if (body.status === 'published') {
        data.publishedAt = new Date()
      }
    }
    if (body.result !== undefined) data.result = JSON.stringify(body.result)

    const updated = await db.scheduledPost.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      ...updated,
      platforms: JSON.parse(updated.platforms),
      hashtags: updated.hashtags ? JSON.parse(updated.hashtags) : [],
      result: updated.result ? JSON.parse(updated.result) : null,
    })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/autopost/[id] - Delete a scheduled post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const { id } = await params

    const existing = await db.scheduledPost.findUnique({ where: { id } })
    if (!existing) {
      throw ApiError.notFound('Post not found')
    }

    await db.scheduledPost.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Post deleted' })
  } catch (error) {
    return handleError(error)
  }
}
