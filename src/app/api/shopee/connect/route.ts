import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateBody, shopeeConnectSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

/**
 * POST /api/shopee/connect
 * Save Shopee Affiliate API credentials and test connection
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const { appId, secret, region, accessToken } = await validateBody(request, shopeeConnectSchema)

    // Save credentials to database
    const settings = [
      { key: 'shopee_app_id', value: appId },
      { key: 'shopee_secret', value: secret },
      { key: 'shopee_region', value: region.toLowerCase() },
      ...(accessToken ? [{ key: 'shopee_access_token', value: accessToken }] : []),
    ]

    for (const setting of settings) {
      await db.appSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    }

    // Test the connection
    const { ShopeeAffiliateService } = await import('@/lib/shopee/affiliate-api')
    const service = new ShopeeAffiliateService({
      appId,
      secret,
      region: region.toLowerCase(),
      accessToken: accessToken ?? undefined,
    })

    const testResult = await service.testConnection()

    // Save connection status
    await db.appSetting.upsert({
      where: { key: 'shopee_connection_status' },
      update: { value: testResult.success ? 'connected' : 'error' },
      create: { key: 'shopee_connection_status', value: testResult.success ? 'connected' : 'error' },
    })

    if (testResult.success) {
      await db.appSetting.upsert({
        where: { key: 'shopee_last_connected' },
        update: { value: new Date().toISOString() },
        create: { key: 'shopee_last_connected', value: new Date().toISOString() },
      })
    }

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      region: testResult.region,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/shopee/connect
 * Get current Shopee connection status
 */
export async function GET() {
  try {
    const settings = await db.appSetting.findMany({
      where: {
        key: { in: ['shopee_app_id', 'shopee_region', 'shopee_connection_status', 'shopee_last_connected'] }
      }
    })

    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))

    return NextResponse.json({
      connected: settingsMap.shopee_connection_status === 'connected',
      appId: settingsMap.shopee_app_id ? `${settingsMap.shopee_app_id.slice(0, 4)}****` : null,
      region: settingsMap.shopee_region || 'my',
      lastConnected: settingsMap.shopee_last_connected || null,
    })
  } catch (error) {
    return handleError(error)
  }
}
