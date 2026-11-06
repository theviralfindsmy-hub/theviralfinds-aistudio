import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ShopeeAffiliateService } from '@/lib/shopee/affiliate-api'

/**
 * GET /api/shopee/status
 * Check Shopee connection status with 5-minute in-memory cache
 */

// ─── In-Memory Cache ──────────────────────────────────────────────
interface StatusCache {
  data: {
    connected: boolean
    status: 'connected' | 'disconnected' | 'no_access' | 'error'
    source: 'graphql_api' | 'mock'
    message: string
    region: string
    hasCredentials: boolean
  }
  timestamp: number
}

let statusCache: StatusCache | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    // Check cache first
    if (statusCache && Date.now() - statusCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(statusCache.data)
    }

    // Read credentials from DB
    const settings = await db.appSetting.findMany({
      where: {
        key: { in: ['shopee_app_id', 'shopee_secret', 'shopee_region'] },
      },
    })

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    const appId = settingsMap.shopee_app_id
    const secret = settingsMap.shopee_secret
    const region = settingsMap.shopee_region || 'my'

    // No credentials configured
    if (!appId || !secret) {
      const result = {
        connected: false,
        status: 'disconnected' as const,
        source: 'mock' as const,
        message: 'No API credentials configured',
        region,
        hasCredentials: false,
      }

      // Cache the disconnected status
      statusCache = { data: result, timestamp: Date.now() }

      return NextResponse.json(result)
    }

    // Credentials exist — test connection
    const service = new ShopeeAffiliateService({
      appId,
      secret,
      region,
    })

    const testResult = await service.testConnection()

    const result = {
      connected: testResult.success,
      status: (testResult.success
        ? 'connected'
        : testResult.source === 'mock'
          ? 'no_access'
          : 'error') as 'connected' | 'disconnected' | 'no_access' | 'error',
      source: testResult.source,
      message: testResult.message,
      region: testResult.region || region,
      hasCredentials: true,
    }

    // Cache the result
    statusCache = { data: result, timestamp: Date.now() }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Shopee status check error:', error)

    const errorResult = {
      connected: false,
      status: 'error' as const,
      source: 'mock' as const,
      message: error instanceof Error ? error.message : 'Failed to check Shopee status',
      region: 'my',
      hasCredentials: false,
    }

    return NextResponse.json(errorResult)
  }
}
