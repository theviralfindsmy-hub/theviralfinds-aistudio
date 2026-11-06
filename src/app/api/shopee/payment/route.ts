import { NextRequest, NextResponse } from 'next/server'
import { ShopeeOpenAPIMockService } from '@/lib/shopee/open-api-mock'
// To switch to real API, import ShopeeOpenAPIClient instead:
// import { ShopeeOpenAPIClient, ShopeeOpenAPIConfig } from '@/lib/shopee/open-api-client'
// Then initialize with: const client = new ShopeeOpenAPIClient({ partnerId, partnerKey, region: 'MY', shopId, ... })

/**
 * GET /api/shopee/payment
 *
 * Get payment/escrow data using PaymentManager.
 *
 * Query params:
 *   type - 'escrow_list' | 'wallet' | 'income' (default: 'escrow_list')
 *   offset      - Pagination offset (default: 0)
 *   page_size   - Items per page (default: 20, max: 100)
 *   order_sn    - Order SN for escrow detail (when type=escrow_list)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') || 'escrow_list'
    const offset = parseInt(searchParams.get('offset') || '0')
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('page_size') || '20'), 1),
      100
    )
    const orderSn = searchParams.get('order_sn') || undefined

    // Validate type
    const validTypes = ['escrow_list', 'wallet', 'income'] as const
    if (!validTypes.includes(type as (typeof validTypes)[number])) {
      return NextResponse.json(
        { error: `Invalid "type" parameter. Must be one of: ${validTypes.join(', ')}`, code: 400 },
        { status: 400 }
      )
    }

    // Validate pagination
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid "offset" parameter', code: 400 },
        { status: 400 }
      )
    }

    // ── Use mock service (switch to ShopeeOpenAPIClient when credentials are available) ──
    const service = new ShopeeOpenAPIMockService()

    switch (type) {
      case 'escrow_list': {
        // If order_sn provided, return escrow detail
        if (orderSn) {
          const result = await service.getEscrowDetail({ order_sn: orderSn })
          if (result.error !== 0) {
            return NextResponse.json(
              { error: result.message, code: result.error, request_id: result.request_id },
              { status: 400 }
            )
          }
          return NextResponse.json({
            success: true,
            data: result.response,
            meta: { type: 'escrow_detail', order_sn: orderSn, source: 'mock' },
          })
        }

        // Otherwise list escrows
        const result = await service.getEscrowList({ offset, page_size: pageSize })
        if (result.error !== 0) {
          return NextResponse.json(
            { error: result.message, code: result.error, request_id: result.request_id },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          data: result.response,
          meta: { type: 'escrow_list', offset, page_size: pageSize, source: 'mock' },
        })
      }

      case 'wallet': {
        const result = await service.getWalletTransactionList({ offset, page_size: pageSize })
        if (result.error !== 0) {
          return NextResponse.json(
            { error: result.message, code: result.error, request_id: result.request_id },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          data: result.response,
          meta: { type: 'wallet', offset, page_size: pageSize, source: 'mock' },
        })
      }

      case 'income': {
        const result = await service.getIncomeOverview()
        if (result.error !== 0) {
          return NextResponse.json(
            { error: result.message, code: result.error, request_id: result.request_id },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          data: result.response,
          meta: { type: 'income', source: 'mock' },
        })
      }
    }
  } catch (error) {
    console.error('[Shopee Payment API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}
