import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleError, ApiError } from '@/lib/api-error'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { DEMO_USER_ID } from '@/lib/realtime/constants'

/**
 * DELETE /api/social/disconnect/[platform]
 *
 * Disconnects (deletes) the SocialAccount for the given platform.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const { platform } = await params
    if (!['facebook', 'instagram', 'tiktok', 'twitter'].includes(platform)) {
      throw ApiError.badRequest(`Unsupported platform: ${platform}`)
    }

    const existing = await db.socialAccount.findUnique({
      where: {
        userId_platform: { userId: DEMO_USER_ID, platform },
      },
    })

    if (!existing) {
      throw ApiError.notFound(`No ${platform} account is connected`)
    }

    await db.socialAccount.delete({
      where: { id: existing.id },
    })

    return NextResponse.json({
      success: true,
      message: `${platform} account disconnected`,
      platform,
    })
  } catch (error) {
    return handleError(error)
  }
}
