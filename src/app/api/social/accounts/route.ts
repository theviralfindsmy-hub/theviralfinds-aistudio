import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleError } from '@/lib/api-error'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { DEMO_USER_ID } from '@/lib/realtime/constants'
import { PLATFORM_META, isPlatformConfigured } from '@/lib/social/types'

// Force dynamic evaluation so this route always picks up the latest
// Prisma client after a schema push.
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/social/accounts
 *
 * Returns the list of connected SocialAccount rows for the demo user,
 * with per-platform metadata (configured, demo, displayName, icon, etc.).
 *
 * Response shape:
 *   {
 *     accounts: Array<{
 *       id, platform, platformUsername, isConnected, isDemo, lastUsedAt,
 *       createdAt, expiresAt, configured, displayName, icon, color,
 *       characterLimit, requiresImage, description
 *     }>,
 *     supportedPlatforms: ['facebook', 'instagram', 'tiktok', 'twitter']
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }

    const accounts = await db.socialAccount.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'asc' },
    })

    const enriched = accounts.map((acc) => {
      const meta = PLATFORM_META[acc.platform as keyof typeof PLATFORM_META]
      return {
        id: acc.id,
        platform: acc.platform,
        platformUsername: acc.platformUsername,
        platformUserId: acc.platformUserId,
        isConnected: acc.isConnected,
        isDemo: acc.isDemo,
        lastUsedAt: acc.lastUsedAt,
        createdAt: acc.createdAt,
        expiresAt: acc.expiresAt,
        configured: meta ? isPlatformConfigured(acc.platform as keyof typeof PLATFORM_META) : false,
        displayName: meta?.displayName ?? acc.platform,
        icon: meta?.icon ?? 'MessageCircle',
        color: meta?.color ?? '#888',
        characterLimit: meta?.characterLimit ?? 2000,
        requiresImage: meta?.requiresImage ?? false,
        description: meta?.description ?? '',
      }
    })

    return NextResponse.json({
      accounts: enriched,
      supportedPlatforms: Object.keys(PLATFORM_META),
    })
  } catch (error) {
    return handleError(error)
  }
}
