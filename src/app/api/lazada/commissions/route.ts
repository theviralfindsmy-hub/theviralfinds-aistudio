import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLazadaServiceFromDB } from '@/lib/lazada/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

/**
 * GET /api/lazada/commissions
 * Fetch commission orders and summary.
 * Priority: real Lazada API → DB Conversion table → empty data.
 *
 * Query params: startDate, endDate, status, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const limited = enforceRateLimit(request, RATE_LIMITS.read)
    if (limited) return limited

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

    const now = Math.floor(Date.now() / 1000)
    const defaultStart = now - 30 * 86400

    const startTime = startDateStr
      ? Math.floor(new Date(startDateStr).getTime() / 1000)
      : defaultStart
    const endTime = endDateStr
      ? Math.floor(new Date(endDateStr).getTime() / 1000)
      : now

    // ── 1. Try real Lazada API first ──
    const service = await getLazadaServiceFromDB()
    if (!service.isUsingMock) {
      try {
        const [ordersResult, summaryResult] = await Promise.allSettled([
          service.getCommissions({
            page,
            limit,
            startTime,
            endTime,
            commissionStatus: status || undefined,
          }),
          service.getCommissionSummary({ startTime, endTime }),
        ])

        const orders =
          ordersResult.status === 'fulfilled'
            ? ordersResult.value
            : null

        const summary =
          summaryResult.status === 'fulfilled'
            ? summaryResult.value
            : null

        if (orders && summary && orders.source === 'api') {
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
            source: 'api',
          })
        }
      } catch (apiError) {
        console.error('[Lazada Commissions] API failed, falling back to DB:', apiError)
      }
    }

    // ── 2. Query Conversion table for Lazada-linked conversions ──
    const startDate = new Date(startTime * 1000)
    const endDate = new Date(endTime * 1000)

    // Find Lazada-related affiliate links
    const lazadaLinks = userId
      ? await db.affiliateLink.findMany({
          where: {
            userId,
            OR: [
              { category: { contains: 'lazada' } },
              { name: { contains: 'Lazada' } },
              { name: { contains: 'lazada' } },
              { tags: { contains: 'lazada' } },
            ],
          },
          select: { id: true },
        })
      : []

    const lazadaLinkIds = lazadaLinks.map((l) => l.id)

    const where: Record<string, unknown> = {
      createdAt: { gte: startDate, lte: endDate },
    }
    if (status) {
      where.status = status
    }
    if (lazadaLinkIds.length > 0) {
      where.linkId = { in: lazadaLinkIds }
    } else if (userId) {
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
            select: { productName: true, productId: true, category: true },
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

    const totalClicks = lazadaLinkIds.length > 0
      ? await db.clickRecord.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            linkId: { in: lazadaLinkIds },
          },
        })
      : userId
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
        order_id: c.orderId || c.id,
        product_id: c.affiliateLink?.productId || c.linkId,
        product_name: c.affiliateLink?.productName || 'Unknown Product',
        category: c.affiliateLink?.category || '',
        order_amount: Number(c.amount),
        commission_rate: Number(c.amount) > 0
          ? parseFloat(((Number(c.commission) / Number(c.amount)) * 100).toFixed(2))
          : 0,
        commission: Number(c.commission),
        commission_status: c.status,
        order_time: Math.floor(c.createdAt.getTime() / 1000),
        settle_time: c.status === 'paid' ? Math.floor(c.updatedAt.getTime() / 1000) : undefined,
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
    return handleError(error)
  }
}
