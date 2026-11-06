import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'

/**
 * GET /api/shopee/commissions
 * Fetch commission orders and summary.
 * Priority: real Shopee API → DB Conversion table → empty data
 *
 * Query params: startDate, endDate, status, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const status = searchParams.get('status') as
      | 'pending'
      | 'confirmed'
      | 'rejected'
      | 'paid'
      | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Parse dates
    const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 86400 * 1000)
    const endDate = endDateStr ? new Date(endDateStr) : new Date()

    // ── 1. Try real Shopee API first if credentials exist ──
    try {
      const shopeeService = await getShopeeServiceFromDB()
      if (shopeeService && !shopeeService.isUsingMock) {
        const now = Math.floor(Date.now() / 1000)
        const defaultStart = now - 30 * 86400
        const startTime = startDateStr
          ? Math.floor(new Date(startDateStr).getTime() / 1000)
          : defaultStart
        const endTime = endDateStr
          ? Math.floor(new Date(endDateStr).getTime() / 1000)
          : now

        const [ordersResult, summaryResult] = await Promise.allSettled([
          shopeeService.getCommissionOrders({
            page,
            limit,
            startTime,
            endTime,
            commissionStatus: status || undefined,
          }),
          shopeeService.getCommissionSummary({
            startTime,
            endTime,
          }),
        ])

        const orders =
          ordersResult.status === 'fulfilled'
            ? ordersResult.value
            : null

        const summary =
          summaryResult.status === 'fulfilled'
            ? summaryResult.value
            : null

        if (orders && summary) {
          const source = orders.source === 'graphql_api' || summary.source === 'graphql_api'
            ? 'graphql_api'
            : 'api'

          return NextResponse.json({
            orders: orders.orders,
            summary: {
              totalCommission: summary.totalCommission,
              pendingCommission: summary.pendingCommission,
              confirmedCommission: summary.confirmedCommission,
              rejectedCommission: summary.rejectedCommission,
              paidCommission: summary.paidCommission,
              totalOrders: summary.totalOrders,
              conversionRate: summary.conversionRate,
            },
            total: orders.total,
            source,
          })
        }
      }
    } catch (apiError) {
      console.error('[Shopee Commissions] API failed, falling back to DB:', apiError)
    }

    // ── 2. Query Conversion table from DB ──
    const where: Record<string, unknown> = {
      createdAt: { gte: startDate, lte: endDate },
    }
    if (status) {
      where.status = status
    }
    // Scope to user's links if userId available
    if (userId) {
      where.affiliateLink = { userId }
    }

    const [conversions, total] = await Promise.all([
      db.conversion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          affiliateLink: {
            select: { productName: true, productId: true, productUrl: true },
          },
        },
      }),
      db.conversion.count({ where }),
    ])

    // Aggregate summary from DB
    const allConversions = await db.conversion.findMany({
      where,
      select: { commission: true, status: true, amount: true },
    })

    const totalCommission = allConversions.reduce((sum, c) => sum + Number(c.commission), 0)
    const pendingCommission = allConversions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.commission), 0)
    const confirmedCommission = allConversions
      .filter((c) => c.status === 'confirmed')
      .reduce((sum, c) => sum + Number(c.commission), 0)
    const rejectedCommission = allConversions
      .filter((c) => c.status === 'rejected')
      .reduce((sum, c) => sum + Number(c.commission), 0)
    const paidCommission = allConversions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission), 0)

    // Compute conversion rate from clicks vs conversions
    const totalClicks = userId
      ? await db.clickRecord.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            affiliateLink: { userId },
          },
        })
      : await db.clickRecord.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        })

    const conversionRate = totalClicks > 0 ? (total / totalClicks) * 100 : 0

    return NextResponse.json({
      orders: conversions.map((c) => ({
        orderSn: c.orderId || c.id,
        orderCreateTime: Math.floor(c.createdAt.getTime() / 1000),
        itemId: c.affiliateLink?.productId || c.linkId,
        itemName: c.affiliateLink?.productName || 'Unknown Product',
        itemPrice: Number(c.amount),
        commissionRate: Number(c.amount) > 0 ? (Number(c.commission) / Number(c.amount)) * 100 : 0,
        commission: Number(c.commission),
        commissionStatus: c.status,
        orderStatus: c.status,
        settleTime: c.status === 'paid' ? Math.floor(c.updatedAt.getTime() / 1000) : undefined,
        clickTime: Math.floor(c.createdAt.getTime() / 1000),
      })),
      summary: {
        totalCommission,
        pendingCommission,
        confirmedCommission,
        rejectedCommission,
        paidCommission,
        totalOrders: total,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
      },
      total,
      source: 'db',
    })
  } catch (error) {
    console.error('Shopee commissions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commission data' },
      { status: 500 }
    )
  }
}
