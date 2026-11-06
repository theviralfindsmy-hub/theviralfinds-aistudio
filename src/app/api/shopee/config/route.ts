import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ShopeeAffiliateService } from '@/lib/shopee/affiliate-api'

/**
 * GET /api/shopee/config
 * Returns current Shopee API config (with secret masked)
 */
export async function GET() {
  try {
    const settings = await db.appSetting.findMany({
      where: {
        key: { in: ['shopee_app_id', 'shopee_secret', 'shopee_region'] },
      },
    })

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    const appId = settingsMap.shopee_app_id || null
    const secret = settingsMap.shopee_secret || null
    const region = settingsMap.shopee_region || 'my'
    const hasCredentials = !!(appId && secret)

    // Determine current status
    let status: 'connected' | 'disconnected' | 'no_access' | 'error' = 'disconnected'
    if (hasCredentials) {
      const service = new ShopeeAffiliateService({
        appId,
        secret,
        region,
      })
      status = service.status
    }

    return NextResponse.json({
      appId: appId || null,
      secret: secret ? '****masked' : null,
      region,
      hasCredentials,
      status,
    })
  } catch (error) {
    console.error('Get Shopee config error:', error)
    return NextResponse.json(
      { error: 'Failed to get Shopee config' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shopee/config
 * Save Shopee API credentials and test connection
 *
 * Body: { appId, secret, region }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appId, secret, region } = body

    if (!appId || !secret) {
      return NextResponse.json(
        { error: 'App ID and Secret are required' },
        { status: 400 }
      )
    }

    // Upsert credentials to AppSetting table
    const settingsToSave = [
      { key: 'shopee_app_id', value: String(appId) },
      { key: 'shopee_secret', value: String(secret) },
      { key: 'shopee_region', value: region || 'my' },
    ]

    for (const setting of settingsToSave) {
      await db.appSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    }

    // Test connection after saving
    const service = new ShopeeAffiliateService({
      appId: String(appId),
      secret: String(secret),
      region: region || 'my',
    })

    const testResult = await service.testConnection()

    // Save connection status
    await db.appSetting.upsert({
      where: { key: 'shopee_connection_status' },
      update: {
        value: testResult.success ? 'connected' : 'error',
      },
      create: {
        key: 'shopee_connection_status',
        value: testResult.success ? 'connected' : 'error',
      },
    })

    if (testResult.success) {
      await db.appSetting.upsert({
        where: { key: 'shopee_last_connected' },
        update: { value: new Date().toISOString() },
        create: {
          key: 'shopee_last_connected',
          value: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({
      success: testResult.success,
      status: testResult.success ? 'connected' : 'error',
      message: testResult.message,
      region: testResult.region,
      source: testResult.source,
    })
  } catch (error) {
    console.error('Save Shopee config error:', error)
    return NextResponse.json(
      {
        error: 'Failed to save Shopee config',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shopee/config
 * Remove Shopee API credentials
 */
export async function DELETE() {
  try {
    await db.appSetting.deleteMany({
      where: {
        key: {
          in: [
            'shopee_app_id',
            'shopee_secret',
            'shopee_region',
            'shopee_access_token',
            'shopee_connection_status',
            'shopee_last_connected',
          ],
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete Shopee config error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete Shopee config',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
