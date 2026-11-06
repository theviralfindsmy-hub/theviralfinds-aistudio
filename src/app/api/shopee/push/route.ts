import { NextRequest, NextResponse } from 'next/server'
import { ShopeeOpenAPIMockService } from '@/lib/shopee/open-api-mock'
// To switch to real API, import ShopeeOpenAPIClient instead:
// import { ShopeeOpenAPIClient, ShopeeOpenAPIConfig } from '@/lib/shopee/open-api-client'
// Then initialize with: const client = new ShopeeOpenAPIClient({ partnerId, partnerKey, region: 'MY', shopId, ... })

/**
 * GET /api/shopee/push
 *
 * Get current push notification configuration.
 *
 * POST /api/shopee/push
 *
 * Set push notification configuration.
 *
 * Body:
 *   push_config_list - Array of { push_type: string, enable: boolean }
 *                      Valid push_type values: NEW_ORDER, ORDER_CANCELLATION,
 *                      ORDER_PAYMENT, PRODUCT_REVIEW, CHAT_MESSAGE, SHOPEE_OFFICIAL
 */
export async function GET() {
  try {
    // ── Use mock service (switch to ShopeeOpenAPIClient when credentials are available) ──
    const service = new ShopeeOpenAPIMockService()

    const result = await service.getPushConfig()

    if (result.error !== 0) {
      return NextResponse.json(
        { error: result.message, code: result.error, request_id: result.request_id },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.response,
      meta: { source: 'mock' },
    })
  } catch (error) {
    console.error('[Shopee Push GET API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { push_config_list } = body as {
      push_config_list?: Array<{ push_type: string; enable: boolean }>
    }

    // Validate required fields
    if (!push_config_list || !Array.isArray(push_config_list) || push_config_list.length === 0) {
      return NextResponse.json(
        { error: '"push_config_list" is required and must be a non-empty array', code: 400 },
        { status: 400 }
      )
    }

    // Validate each config item
    const validPushTypes = [
      'NEW_ORDER',
      'ORDER_CANCELLATION',
      'ORDER_PAYMENT',
      'PRODUCT_REVIEW',
      'CHAT_MESSAGE',
      'SHOPEE_OFFICIAL',
    ]

    for (const config of push_config_list) {
      if (!config.push_type || typeof config.push_type !== 'string') {
        return NextResponse.json(
          { error: 'Each push config must have a "push_type" string', code: 400 },
          { status: 400 }
        )
      }
      if (typeof config.enable !== 'boolean') {
        return NextResponse.json(
          { error: 'Each push config must have an "enable" boolean', code: 400 },
          { status: 400 }
        )
      }
      if (!validPushTypes.includes(config.push_type)) {
        return NextResponse.json(
          { error: `Invalid push_type "${config.push_type}". Valid types: ${validPushTypes.join(', ')}`, code: 400 },
          { status: 400 }
        )
      }
    }

    // ── Use mock service (switch to ShopeeOpenAPIClient when credentials are available) ──
    const service = new ShopeeOpenAPIMockService()

    const result = await service.setPushConfig({ push_config_list })

    if (result.error !== 0) {
      return NextResponse.json(
        { error: result.message, code: result.error, request_id: result.request_id },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.response,
      meta: { source: 'mock' },
    })
  } catch (error) {
    console.error('[Shopee Push POST API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}
