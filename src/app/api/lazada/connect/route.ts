import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/**
 * POST /api/lazada/connect
 * Save Lazada credentials, store in SocialAccount table, and test connection.
 *
 * Body: { appKey, appSecret, region?, accessToken? }
 */
interface ConnectRequestBody {
  appKey?: string
  appSecret?: string
  region?: 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn'
  accessToken?: string
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    let body: ConnectRequestBody
    try {
      body = await request.json()
    } catch {
      throw ApiError.badRequest('Invalid JSON in request body')
    }

    const { appKey, appSecret, region = 'my', accessToken } = body

    if (!appKey || !appSecret) {
      throw ApiError.badRequest('appKey and appSecret are required')
    }

    // Save credentials to AppSetting table
    const settings = [
      { key: 'lazada_app_key', value: appKey },
      { key: 'lazada_app_secret', value: appSecret },
      { key: 'lazada_region', value: region.toLowerCase() },
      ...(accessToken ? [{ key: 'lazada_access_token', value: accessToken }] : []),
    ]

    for (const s of settings) {
      await db.appSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value },
      })
    }

    // Store connection in SocialAccount table
    if (userId) {
      await db.socialAccount.upsert({
        where: { userId_platform: { userId, platform: 'lazada' } },
        update: {
          platformUserId: appKey,
          platformUsername: `Lazada (${region.toUpperCase()})`,
          accessToken: accessToken || '',
          refreshToken: null,
          isConnected: true,
          isDemo: false,
          lastUsedAt: new Date(),
        },
        create: {
          userId,
          platform: 'lazada',
          platformUserId: appKey,
          platformUsername: `Lazada (${region.toUpperCase()})`,
          accessToken: accessToken || '',
          isConnected: true,
          isDemo: false,
          lastUsedAt: new Date(),
        },
      })
    }

    // Test the connection
    let connected = false
    let source = 'db'
    try {
      const { getLazadaServiceFromDB } = await import('@/lib/lazada/affiliate-service')
      const service = await getLazadaServiceFromDB()
      const testResult = await service.testConnection()
      connected = testResult.success && testResult.source === 'api'
      source = connected ? 'api' : 'db'
    } catch (apiError) {
      console.error('[Lazada Connect] API test failed:', apiError)
    }

    await db.appSetting.upsert({
      where: { key: 'lazada_connection_status' },
      update: { value: connected ? 'connected' : 'db_saved' },
      create: { key: 'lazada_connection_status', value: connected ? 'connected' : 'db_saved' },
    })
    await db.appSetting.upsert({
      where: { key: 'lazada_last_connected' },
      update: { value: new Date().toISOString() },
      create: { key: 'lazada_last_connected', value: new Date().toISOString() },
    })

    return NextResponse.json({
      success: true,
      message: connected ? 'Connected to Lazada API' : 'Credentials saved. API connection test incomplete.',
      region,
      source,
      connected,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/lazada/connect
 * Disconnect — remove Lazada credentials from AppSetting + SocialAccount.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    await db.appSetting.deleteMany({
      where: {
        key: {
          in: [
            'lazada_app_key',
            'lazada_app_secret',
            'lazada_access_token',
            'lazada_connection_status',
            'lazada_last_connected',
          ],
        },
      },
    })

    // Remove from SocialAccount
    if (userId) {
      await db.socialAccount.deleteMany({
        where: { userId, platform: 'lazada' },
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'Lazada account disconnected',
      connected: false,
      source: 'db',
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/lazada/connect
 * Get current Lazada connection status from SocialAccount + AppSetting tables.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined

    // Check SocialAccount table first
    let socialAccount: Awaited<ReturnType<typeof db.socialAccount.findUnique>> = null
    if (userId) {
      socialAccount = await db.socialAccount.findUnique({
        where: { userId_platform: { userId, platform: 'lazada' } },
      })
    }

    // Also check AppSetting for backward compat
    const settings = await db.appSetting.findMany({
      where: {
        key: {
          in: [
            'lazada_app_key',
            'lazada_region',
            'lazada_connection_status',
            'lazada_last_connected',
          ],
        },
      },
    })

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    const connected = socialAccount?.isConnected || map.lazada_connection_status === 'connected'

    return NextResponse.json({
      connected,
      appKey: map.lazada_app_key
        ? `${map.lazada_app_key.slice(0, 4)}****`
        : null,
      region: map.lazada_region || 'my',
      lastConnected: socialAccount?.lastUsedAt?.toISOString() || map.lazada_last_connected || null,
      source: connected ? 'api' : 'db',
    })
  } catch (error) {
    return handleError(error)
  }
}
