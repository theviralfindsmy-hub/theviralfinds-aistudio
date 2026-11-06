import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateBody } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

/**
 * POST /api/tiktok/connect
 * Save TikTok Shop Affiliate API credentials and test connection.
 * Also stores the connection in SocialAccount table.
 *
 * Body: { appKey, appSecret, accessToken?, shopId?, region? }
 */
const tiktokConnectSchema = z.object({
  appKey: z.string().min(1, 'App Key is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
  shopId: z.string().optional(),
  region: z.enum(['MY', 'SG', 'ID', 'TH', 'PH', 'VN']).default('MY'),
})

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    const { appKey, appSecret, accessToken, shopId, region } =
      await validateBody(request, tiktokConnectSchema)

    // Persist credentials to AppSetting table
    const settings = [
      { key: 'tiktok_app_key', value: appKey },
      { key: 'tiktok_app_secret', value: appSecret },
      { key: 'tiktok_access_token', value: accessToken },
      { key: 'tiktok_region', value: region },
      ...(shopId ? [{ key: 'tiktok_shop_id', value: shopId }] : []),
    ]

    for (const setting of settings) {
      await db.appSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    }

    // Store connection in SocialAccount table
    if (userId) {
      await db.socialAccount.upsert({
        where: { userId_platform: { userId, platform: 'tiktok' } },
        update: {
          platformUserId: shopId || appKey,
          platformUsername: `TikTok Shop (${region})`,
          accessToken,
          refreshToken: null,
          isConnected: true,
          isDemo: false,
          lastUsedAt: new Date(),
        },
        create: {
          userId,
          platform: 'tiktok',
          platformUserId: shopId || appKey,
          platformUsername: `TikTok Shop (${region})`,
          accessToken,
          isConnected: true,
          isDemo: false,
          lastUsedAt: new Date(),
        },
      })
    }

    // Test the connection using the TikTok API client
    let connected = false
    let source = 'db'
    try {
      const { TikTokApiClient } = await import('@/lib/tiktok/api-client')
      const client = new TikTokApiClient({
        appKey,
        appSecret,
        accessToken,
        shopId,
        region: region as 'MY' | 'SG' | 'ID' | 'TH' | 'PH' | 'VN',
      })
      const testResult = await client.testConnection()
      connected = testResult.success
      source = connected ? 'api' : 'db'
    } catch (apiError) {
      console.error('[TikTok Connect] API test failed, saving as DB-only:', apiError)
    }

    await db.appSetting.upsert({
      where: { key: 'tiktok_connection_status' },
      update: { value: connected ? 'connected' : 'db_saved' },
      create: { key: 'tiktok_connection_status', value: connected ? 'connected' : 'db_saved' },
    })

    if (connected) {
      await db.appSetting.upsert({
        where: { key: 'tiktok_last_connected' },
        update: { value: new Date().toISOString() },
        create: { key: 'tiktok_last_connected', value: new Date().toISOString() },
      })
    }

    return NextResponse.json({
      success: true,
      message: connected ? 'Connected to TikTok Shop API' : 'Credentials saved. API connection test failed.',
      region,
      source,
      connected,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/tiktok/connect
 * Get current TikTok Shop connection status from SocialAccount + AppSetting tables.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined

    // Check SocialAccount table first
    let socialAccount: Awaited<ReturnType<typeof db.socialAccount.findUnique>> = null
    if (userId) {
      socialAccount = await db.socialAccount.findUnique({
        where: { userId_platform: { userId, platform: 'tiktok' } },
      })
    }

    // Also check AppSetting for backward compat
    const settings = await db.appSetting.findMany({
      where: {
        key: {
          in: [
            'tiktok_app_key',
            'tiktok_region',
            'tiktok_shop_id',
            'tiktok_connection_status',
            'tiktok_last_connected',
          ],
        },
      },
    })

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    const isConnected = socialAccount?.isConnected || settingsMap.tiktok_connection_status === 'connected'

    return NextResponse.json({
      connected: isConnected,
      appKey: settingsMap.tiktok_app_key
        ? `${settingsMap.tiktok_app_key.slice(0, 4)}****`
        : null,
      region: settingsMap.tiktok_region || 'MY',
      shopId: settingsMap.tiktok_shop_id || null,
      lastConnected: socialAccount?.lastUsedAt?.toISOString() || settingsMap.tiktok_last_connected || null,
      source: isConnected ? 'api' : 'db',
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/tiktok/connect
 * Disconnect TikTok Shop — purges stored credentials + SocialAccount.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined

    const keysToDelete = [
      'tiktok_app_key',
      'tiktok_app_secret',
      'tiktok_access_token',
      'tiktok_shop_id',
      'tiktok_region',
      'tiktok_connection_status',
      'tiktok_last_connected',
      'tiktok_force_mock',
    ]

    for (const key of keysToDelete) {
      await db.appSetting
        .delete({ where: { key } })
        .catch(() => {})
    }

    // Remove from SocialAccount
    if (userId) {
      await db.socialAccount.deleteMany({
        where: { userId, platform: 'tiktok' },
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'TikTok Shop disconnected successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
