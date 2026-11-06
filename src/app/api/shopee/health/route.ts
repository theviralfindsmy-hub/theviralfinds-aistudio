import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/shopee/health
 *
 * Compute real health metrics from DB data (conversion rate, click trends, etc.).
 *
 * Query params:
 *   type      - 'performance' | 'penalties' | 'issues' | 'late_orders' (default: 'performance')
 *   offset    - Pagination offset (default: 0)
 *   page_size - Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') || 'performance'
    const offset = parseInt(searchParams.get('offset') || '0')
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('page_size') || '20'), 1),
      100
    )

    // Validate type
    const validTypes = ['performance', 'penalties', 'issues', 'late_orders'] as const
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

    // Build base link filter
    const linkFilter = userId ? { userId } : {}

    switch (type) {
      case 'performance': {
        // Compute real performance metrics from DB
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400 * 1000)

        const [totalLinks, activeLinks, totalClicks, totalConversions, recentClicks, recentConversions] =
          await Promise.all([
            db.affiliateLink.count({ where: linkFilter }),
            db.affiliateLink.count({ where: { ...linkFilter, status: 'active' } }),
            db.clickRecord.count({
              where: { affiliateLink: linkFilter },
            }),
            db.conversion.count({
              where: { affiliateLink: linkFilter },
            }),
            db.clickRecord.count({
              where: {
                createdAt: { gte: thirtyDaysAgo },
                affiliateLink: linkFilter,
              },
            }),
            db.conversion.count({
              where: {
                createdAt: { gte: thirtyDaysAgo },
                affiliateLink: linkFilter,
              },
            }),
          ])

        // Calculate conversion rate
        const conversionRate = totalClicks > 0
          ? parseFloat(((totalConversions / totalClicks) * 100).toFixed(2))
          : 0

        // Calculate recent conversion rate
        const recentConversionRate = recentClicks > 0
          ? parseFloat(((recentConversions / recentClicks) * 100).toFixed(2))
          : 0

        // Get earnings data
        const earningsData = await db.conversion.aggregate({
          where: {
            affiliateLink: linkFilter,
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { commission: true, amount: true },
          _avg: { commission: true },
        })

        // Compute health score (0-100) based on real metrics
        let healthScore = 50 // base
        if (conversionRate > 0) healthScore += Math.min(conversionRate * 5, 20)
        if (activeLinks > 0) healthScore += Math.min(activeLinks * 2, 15)
        if (recentClicks > 0) healthScore += Math.min(recentClicks / 10, 10)
        if (recentConversions > 0) healthScore += Math.min(recentConversions * 2, 5)
        healthScore = Math.min(Math.round(healthScore), 100)

        // Click trend (7 day comparison)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400 * 1000)
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400 * 1000)

        const [thisWeek, lastWeek] = await Promise.all([
          db.clickRecord.count({
            where: { createdAt: { gte: sevenDaysAgo }, affiliateLink: linkFilter },
          }),
          db.clickRecord.count({
            where: {
              createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
              affiliateLink: linkFilter,
            },
          }),
        ])

        const clickTrend = lastWeek > 0
          ? parseFloat((((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1))
          : thisWeek > 0 ? 100 : 0

        return NextResponse.json({
          success: true,
          data: {
            health_score: healthScore,
            performance: {
              total_links: totalLinks,
              active_links: activeLinks,
              total_clicks: totalClicks,
              total_conversions: totalConversions,
              conversion_rate: conversionRate,
              recent_clicks: recentClicks,
              recent_conversions: recentConversions,
              recent_conversion_rate: recentConversionRate,
              recent_earnings: Number(earningsData._sum.commission || 0),
              recent_revenue: Number(earningsData._sum.amount || 0),
              avg_commission: Number(earningsData._avg.commission || 0),
              click_trend: clickTrend,
            },
          },
          meta: { type: 'performance', source: 'db' },
        })
      }

      case 'penalties': {
        // Compute penalty-like metrics from underperforming links
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000)

        // Links with high clicks but zero conversions = potential quality issues
        const underperformingLinks = await db.affiliateLink.findMany({
          where: {
            ...linkFilter,
            clicks: { gte: 50 },
            conversions: 0,
            createdAt: { lte: thirtyDaysAgo },
          },
          take: pageSize,
          skip: offset,
          orderBy: { clicks: 'desc' },
          select: {
            id: true,
            productName: true,
            clicks: true,
            conversions: true,
            createdAt: true,
            status: true,
          },
        })

        const penaltyPoints = underperformingLinks.map((link) => ({
          link_id: link.id,
          product_name: link.productName || 'Unknown',
          clicks: link.clicks,
          conversions: link.conversions,
          penalty_points: Math.floor(link.clicks / 10),
          reason: 'Zero conversions despite significant clicks',
          detected_at: link.createdAt.toISOString(),
        }))

        const totalPenaltyPoints = penaltyPoints.reduce((sum, p) => sum + p.penalty_points, 0)

        return NextResponse.json({
          success: true,
          data: {
            penalty_points: {
              total_points: totalPenaltyPoints,
              items: penaltyPoints,
              pagination: {
                has_next: underperformingLinks.length === pageSize,
                total: await db.affiliateLink.count({
                  where: { ...linkFilter, clicks: { gte: 50 }, conversions: 0 },
                }),
              },
            },
            punishments: {
              items: underperformingLinks.slice(0, 5).map((link) => ({
                link_id: link.id,
                product_name: link.productName || 'Unknown',
                punishment_type: 'reduced_visibility',
                start_time: link.createdAt.toISOString(),
                end_time: null,
                status: 'active',
              })),
            },
          },
          meta: { type: 'penalties', offset, page_size: pageSize, source: 'db' },
        })
      }

      case 'issues': {
        // Find links with potential listing issues
        const issues = await db.affiliateLink.findMany({
          where: {
            ...linkFilter,
            OR: [
              { status: 'paused' },
              { status: 'expired' },
              { productUrl: { equals: '' } },
            ],
          },
          take: pageSize,
          skip: offset,
          orderBy: { updatedAt: 'desc' },
        })

        return NextResponse.json({
          success: true,
          data: {
            total_issues: issues.length,
            items: issues.map((link) => ({
              link_id: link.id,
              product_name: link.productName || link.name,
              issue_type: link.status === 'expired'
                ? 'expired_listing'
                : link.status === 'paused'
                ? 'inactive_listing'
                : 'missing_url',
              severity: link.status === 'expired' ? 'high' : 'medium',
              suggestion: link.status === 'expired'
                ? 'Renew or update this link'
                : link.status === 'paused'
                ? 'Reactivate this link'
                : 'Add a valid product URL',
              detected_at: link.updatedAt.toISOString(),
            })),
            pagination: {
              has_next: issues.length === pageSize,
              offset,
            },
          },
          meta: { type: 'issues', offset, page_size: pageSize, source: 'db' },
        })
      }

      case 'late_orders': {
        // Find pending conversions that haven't been confirmed
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000)

        const lateConversions = await db.conversion.findMany({
          where: {
            status: 'pending',
            createdAt: { lte: sevenDaysAgo },
            affiliateLink: linkFilter,
          },
          take: pageSize,
          skip: offset,
          orderBy: { createdAt: 'asc' },
          include: {
            affiliateLink: {
              select: { productName: true, productId: true },
            },
          },
        })

        return NextResponse.json({
          success: true,
          data: {
            total_late_orders: lateConversions.length,
            items: lateConversions.map((c) => ({
              order_sn: c.orderId || c.id,
              item_name: c.affiliateLink?.productName || 'Unknown',
              days_pending: Math.floor((Date.now() - c.createdAt.getTime()) / 86400000),
              amount: Number(c.amount),
              commission: Number(c.commission),
              status: c.status,
              created_at: c.createdAt.toISOString(),
            })),
            pagination: {
              has_next: lateConversions.length === pageSize,
              offset,
            },
          },
          meta: { type: 'late_orders', offset, page_size: pageSize, source: 'db' },
        })
      }
    }
  } catch (error) {
    console.error('[Shopee Health API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}
