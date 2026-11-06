import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/shopee/orders
 *
 * Get order list from Conversion table in DB.
 *
 * Query params:
 *   time_range_field - 'create_time' | 'update_time' (default: 'create_time')
 *   from             - Unix timestamp start (default: 30 days ago)
 *   to               - Unix timestamp end (default: now)
 *   page_size        - Orders per page (default: 20, max: 100)
 *   cursor           - Pagination cursor from previous response
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)

    const timeRangeField = (searchParams.get('time_range_field') as 'create_time' | 'update_time') || 'create_time'
    const now = Math.floor(Date.now() / 1000)
    const thirtyDaysAgo = now - 30 * 86400
    const from = searchParams.get('from') ? parseInt(searchParams.get('from')!) : thirtyDaysAgo
    const to = searchParams.get('to') ? parseInt(searchParams.get('to')!) : now
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('page_size') || '20'), 1),
      100
    )
    const cursor = searchParams.get('cursor') || undefined

    // Validate time range
    if (isNaN(from) || isNaN(to)) {
      return NextResponse.json(
        { error: 'Invalid "from" or "to" timestamp parameter', code: 400 },
        { status: 400 }
      )
    }
    if (from > to) {
      return NextResponse.json(
        { error: '"from" timestamp must be before "to" timestamp', code: 400 },
        { status: 400 }
      )
    }
    if (timeRangeField !== 'create_time' && timeRangeField !== 'update_time') {
      return NextResponse.json(
        { error: 'Invalid "time_range_field". Must be "create_time" or "update_time"', code: 400 },
        { status: 400 }
      )
    }

    // Build where clause from Conversion table
    const dateField = timeRangeField === 'create_time' ? 'createdAt' : 'updatedAt'
    const where: Record<string, unknown> = {
      [dateField]: {
        gte: new Date(from * 1000),
        lte: new Date(to * 1000),
      },
    }
    if (userId) {
      where.affiliateLink = { userId }
    }

    // Query conversions (which represent orders)
    const [orders, totalCount] = await Promise.all([
      db.conversion.findMany({
        where,
        take: pageSize + 1, // take one extra to detect has_next
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { [dateField]: 'desc' },
        include: {
          affiliateLink: {
            select: {
              productName: true,
              productId: true,
              productImage: true,
              productPrice: true,
              productUrl: true,
              shortCode: true,
            },
          },
        },
      }),
      db.conversion.count({ where }),
    ])

    const hasMore = orders.length > pageSize
    const paginatedOrders = hasMore ? orders.slice(0, pageSize) : orders
    const lastOrder = paginatedOrders[paginatedOrders.length - 1]

    return NextResponse.json({
      success: true,
      data: {
        orders: paginatedOrders.map((c) => ({
          order_sn: c.orderId || c.id,
          order_status: c.status,
          create_time: Math.floor(c.createdAt.getTime() / 1000),
          update_time: Math.floor(c.updatedAt.getTime() / 1000),
          item_list: c.affiliateLink
            ? [{
                item_id: c.affiliateLink.productId || c.linkId,
                item_name: c.affiliateLink.productName || 'Unknown Product',
                item_image: c.affiliateLink.productImage || '',
                model_original_price: Number(c.affiliateLink.productPrice || 0),
                order_amount: Number(c.amount),
                commission: Number(c.commission),
                commission_rate: Number(c.amount) > 0
                  ? parseFloat(((Number(c.commission) / Number(c.amount)) * 100).toFixed(2))
                  : 0,
                product_url: c.affiliateLink.productUrl || '',
              }]
            : [],
          total_amount: Number(c.amount),
          total_commission: Number(c.commission),
          affiliate_link: c.affiliateLink?.shortCode || '',
        })),
        pagination: {
          more: hasMore,
          next_cursor: hasMore && lastOrder ? lastOrder.id : null,
        },
      },
      meta: {
        time_range_field: timeRangeField,
        from,
        to,
        page_size: pageSize,
        total_count: totalCount,
        source: 'db',
      },
    })
  } catch (error) {
    console.error('[Shopee Orders API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}
