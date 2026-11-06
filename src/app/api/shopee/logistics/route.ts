import { NextRequest, NextResponse } from 'next/server'
import { ShopeeOpenAPIMockService } from '@/lib/shopee/open-api-mock'
// To switch to real API, import ShopeeOpenAPIClient instead:
// import { ShopeeOpenAPIClient, ShopeeOpenAPIConfig } from '@/lib/shopee/open-api-client'
// Then initialize with: const client = new ShopeeOpenAPIClient({ partnerId, partnerKey, region: 'MY', shopId, ... })

/**
 * GET /api/shopee/logistics
 *
 * Get logistics/shipping data using LogisticsManager.
 *
 * Query params:
 *   order_sn - Order SN (required for tracking/shipping parameter)
 *   type     - 'tracking' | 'channels' | 'shipping_parameter' (default: 'channels')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') || 'channels'
    const orderSn = searchParams.get('order_sn') || undefined

    // Validate type
    const validTypes = ['tracking', 'channels', 'shipping_parameter'] as const
    if (!validTypes.includes(type as (typeof validTypes)[number])) {
      return NextResponse.json(
        { error: `Invalid "type" parameter. Must be one of: ${validTypes.join(', ')}`, code: 400 },
        { status: 400 }
      )
    }

    // tracking and shipping_parameter require order_sn
    if ((type === 'tracking' || type === 'shipping_parameter') && !orderSn) {
      return NextResponse.json(
        { error: '"order_sn" is required when type is "tracking" or "shipping_parameter"', code: 400 },
        { status: 400 }
      )
    }

    // ── Use mock service (switch to ShopeeOpenAPIClient when credentials are available) ──
    const service = new ShopeeOpenAPIMockService()

    switch (type) {
      case 'tracking': {
        // Return tracking info (includes tracking number + status history)
        const [trackingNumberResult, trackingInfoResult] = await Promise.all([
          service.getTrackingNumber({ order_sn: orderSn! }),
          service.getTrackingInfo({ order_sn: orderSn! }),
        ])

        if (trackingNumberResult.error !== 0) {
          return NextResponse.json(
            { error: trackingNumberResult.message, code: trackingNumberResult.error, request_id: trackingNumberResult.request_id },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          data: {
            tracking_number: trackingNumberResult.response,
            tracking_info: trackingInfoResult.error === 0 ? trackingInfoResult.response : null,
          },
          meta: { type: 'tracking', order_sn: orderSn, source: 'mock' },
        })
      }

      case 'channels': {
        const result = await service.getChannelList()
        if (result.error !== 0) {
          return NextResponse.json(
            { error: result.message, code: result.error, request_id: result.request_id },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          data: result.response,
          meta: { type: 'channels', source: 'mock' },
        })
      }

      case 'shipping_parameter': {
        const result = await service.getShippingParameter({ order_sn: orderSn! })
        if (result.error !== 0) {
          return NextResponse.json(
            { error: result.message, code: result.error, request_id: result.request_id },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          data: result.response,
          meta: { type: 'shipping_parameter', order_sn: orderSn, source: 'mock' },
        })
      }
    }
  } catch (error) {
    console.error('[Shopee Logistics API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}
