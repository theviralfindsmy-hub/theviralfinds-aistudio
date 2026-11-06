import { NextResponse } from 'next/server'
import { ShopeeOpenAPIMockService } from '@/lib/shopee/open-api-mock'
// To switch to real API, import ShopeeOpenAPIClient instead:
// import { ShopeeOpenAPIClient, ShopeeOpenAPIConfig } from '@/lib/shopee/open-api-client'
// Then initialize with: const client = new ShopeeOpenAPIClient({ partnerId, partnerKey, region: 'MY', shopId, ... })

/**
 * GET /api/shopee/shop
 *
 * Get shop info using ShopManager.
 * Returns shop profile and performance data.
 */
export async function GET() {
  try {
    // ── Use mock service (switch to ShopeeOpenAPIClient when credentials are available) ──
    const service = new ShopeeOpenAPIMockService()

    // Fetch profile and performance in parallel
    const [profileResult, performanceResult] = await Promise.all([
      service.getProfile(),
      service.getShopPerformance(),
    ])

    if (profileResult.error !== 0) {
      return NextResponse.json(
        { error: profileResult.message, code: profileResult.error, request_id: profileResult.request_id },
        { status: 400 }
      )
    }

    if (performanceResult.error !== 0) {
      return NextResponse.json(
        { error: performanceResult.message, code: performanceResult.error, request_id: performanceResult.request_id },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: profileResult.response,
        performance: performanceResult.response,
      },
      meta: {
        source: 'mock',
      },
    })
  } catch (error) {
    console.error('[Shopee Shop API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}
