import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTikTokServiceFromDB } from '@/lib/tiktok/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

/**
 * GET /api/tiktok/commissions
 * Fetch TikTok Shop affiliate commission orders and a summary.
 * Priority: real TikTok API → DB Conversion table → empty data.
 *
 * Query params:
 *   startDate - ISO date (default: 30 days ago)
 *   endDate   - ISO date (default: now)
 *   status    - pending | confirmed | shipped | delivered | paid | rejected | refunded
 *   page      - default 1
 *   limit     - default 20
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const limited = enforceRateLimit(request, RATE_LIMITS.read)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const status = searchParams.get('status') as string | null
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

    // ── 1. Try real TikTok API first ──
    const service = await getTikTokServiceFromDB()
    if (!service.isUsingMock) {
      try {
        const [ordersResult, summaryResult] = await Promise.allSettled([
          service.getCommissions({
            page,
            limit,
            startTime,
            endTime,
            commissionStatus: (status || undefined) as never,
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
              paidCommission: summary.paidCommission,
              rejectedCommission: summary.rejectedCommission,
              totalOrders: summary.totalOrders,
              conversionRate: summary.conversionRate,
              clickCount: summary.clickCount,
            },
            total: orders.total,
            source: 'api',
            connected: true,
          })
        }
      } catch (apiError) {
        console.error('[TikTok Commissions] API failed, falling back to DB:', apiError)
      }
    }

    // ── 2. Query Conversion table for TikTok-linked conversions ──
    const startDate = new Date(startTime * 1000)
    const endDate = new Date(endTime * 1000)

    // Find TikTok-related affiliate links (by category, name, or tags containing 'tiktok')
    const tiktokLinks = userId
      ? await db.affiliateLink.findMany({
          where: {
            userId,
            OR: [
              { category: { contains: 'tiktok' } },
              { name: { contains: 'TikTok' } },
              { name: { contains: 'tiktok' } },
              { tags: { contains: 'tiktok' } },
            ],
          },
          select: { id: true },
        })
      : []

    const tiktokLinkIds = tiktokLinks.map((l) => l.id)

    // If we have TikTok-specific links, query their conversions; otherwise query all
    const where: Record<string, unknown> = {
      createdAt: { gte: startDate, lte: endDate },
    }
    if (status) {
      // Map TikTok-specific statuses to our ConversionStatus enum
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'shipped': 'confirmed',
        'delivered': 'confirmed',
        'paid': 'paid',
        'rejected': 'rejected',
        'refunded': 'rejected',
      }
      where.status = statusMap[status] || status
    }
    if (tiktokLinkIds.length > 0) {
      where.linkId = { in: tiktokLinkIds }
    } else if (userId) {
      // No TikTok-specific links found, query all user's conversions
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
    const paidCommission = allConversions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission), 0)
    const rejectedCommission = allConversions
      .filter((c) => c.status === 'rejected')
      .reduce((sum, c) => sum + Number(c.commission), 0)

    // Get click count for conversion rate
    const clickCount = await db.clickRecord.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(tiktokLinkIds.length > 0
          ? { linkId: { in: tiktokLinkIds } }
          : userId
          ? { affiliateLink: { userId } }
          : {}),
      },
    })

    const conversionRate = clickCount > 0 ? (total / clickCount) * 100 : 0

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
        paidCommission,
        rejectedCommission,
        totalOrders: total,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        clickCount,
      },
      total,
      source: 'db',
      connected: !service.isUsingMock,
    })
  } catch (error) {
    return handleError(error)
  }
}
