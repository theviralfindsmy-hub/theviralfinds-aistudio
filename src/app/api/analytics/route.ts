import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/analytics
 *
 * Query params: period ('7d' | '30d' | '90d'), compare ('true' to get period comparison)
 *
 * Returns: summary, clicksOverTime, conversionsOverTime, countries, devices,
 *          browsers, categories, topLinks, funnel, trafficSources, comparison (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const compare = searchParams.get('compare') === 'true'

    // ── Date ranges ─────────────────────────────────────────────────
    const now = new Date()
    let days: number
    switch (period) {
      case '7d':
        days = 7
        break
      case '90d':
        days = 90
        break
      case '30d':
      default:
        days = 30
        break
    }

    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)

    // ── Scoped where clauses ────────────────────────────────────────
    const linkWhere = userId ? { userId } : {}
    const clickWhere = userId ? { userId } : {}
    const conversionLinkWhere = userId
      ? { affiliateLink: { userId } }
      : {}

    // ── Period clicks & conversions ─────────────────────────────────
    const [periodClicks, periodConversions, periodEarningsResult, uniqueIps] = await Promise.all([
      db.clickRecord.count({
        where: { ...clickWhere, createdAt: { gte: startDate } },
      }),
      db.conversion.count({
        where: { ...conversionLinkWhere, createdAt: { gte: startDate } },
      }),
      db.conversion.aggregate({
        _sum: { commission: true, amount: true },
        where: { ...conversionLinkWhere, createdAt: { gte: startDate } },
      }),
      // Unique visitors — approximate by distinct IPs in period
      db.clickRecord.groupBy({
        by: ['ip'],
        where: { ...clickWhere, createdAt: { gte: startDate }, ip: { not: null } },
        _count: { id: true },
      }),
    ])

    const periodEarnings = periodEarningsResult._sum.commission
      ? Number(periodEarningsResult._sum.commission)
      : 0
    const periodRevenue = periodEarningsResult._sum.amount
      ? Number(periodEarningsResult._sum.amount)
      : 0
    const uniqueVisitors = uniqueIps.length

    // ── Clicks over time (grouped by day) ───────────────────────────
    const clicksOverTimeRaw = await db.clickRecord.groupBy({
      by: ['createdAt'],
      where: { ...clickWhere, createdAt: { gte: startDate } },
      _count: { id: true },
    })

    const clicksOverTime = aggregateByDay(
      clicksOverTimeRaw.map((r) => ({ date: r.createdAt, count: r._count.id })),
      startDate,
      now
    )

    // ── Conversions over time ───────────────────────────────────────
    const conversionsOverTimeRaw = await db.conversion.groupBy({
      by: ['createdAt'],
      _sum: { commission: true },
      where: { ...conversionLinkWhere, createdAt: { gte: startDate } },
    })

    const conversionsOverTime = aggregateByDay(
      conversionsOverTimeRaw.map((r) => ({
        date: r.createdAt,
        count: 1,
        value: r._sum.commission ? Number(r._sum.commission) : 0,
      })),
      startDate,
      now,
      true
    )

    // ── Country breakdown (top 10) ──────────────────────────────────
    const clicksByCountry = await db.clickRecord.groupBy({
      by: ['country'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      where: { ...clickWhere, country: { not: null } },
      take: 10,
    })

    const countries = clicksByCountry
      .filter((c) => c.country !== null)
      .map((c) => ({
        country: c.country || 'Unknown',
        clicks: c._count.id,
      }))

    // ── Device breakdown ────────────────────────────────────────────
    const clicksByDevice = await db.clickRecord.groupBy({
      by: ['device'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      where: { ...clickWhere, device: { not: null } },
    })

    const devices = clicksByDevice
      .filter((d) => d.device !== null)
      .map((d) => ({
        device: d.device || 'Unknown',
        clicks: d._count.id,
      }))

    // ── Browser breakdown ───────────────────────────────────────────
    const clicksByBrowser = await db.clickRecord.groupBy({
      by: ['browser'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      where: { ...clickWhere, browser: { not: null } },
    })

    const browsers = clicksByBrowser
      .filter((b) => b.browser !== null)
      .map((b) => ({
        browser: b.browser || 'Unknown',
        clicks: b._count.id,
      }))

    // ── Category breakdown ──────────────────────────────────────────
    const clicksByCategory = await db.affiliateLink.groupBy({
      by: ['category'],
      _sum: { clicks: true, conversions: true },
      _count: { id: true },
      where: { ...linkWhere, category: { not: null } },
    })

    const categories = clicksByCategory
      .filter((c) => c.category !== null)
      .map((c) => ({
        category: c.category || 'Unknown',
        links: c._count.id,
        clicks: c._sum.clicks || 0,
        conversions: c._sum.conversions || 0,
      }))

    // ── Top performing links ────────────────────────────────────────
    const topLinksRaw = await db.affiliateLink.findMany({
      where: { ...linkWhere, clicks: { gt: 0 } },
      orderBy: { earnings: 'desc' },
      take: 10,
    })

    const topLinks = topLinksRaw.map((link) => ({
      id: link.id,
      name: link.name,
      clicks: link.clicks,
      conversions: link.conversions,
      earnings: Number(link.earnings),
      ctr: link.clicks > 0 ? Math.round((link.conversions / link.clicks) * 10000) / 100 : 0,
    }))

    // ── Conversion funnel ───────────────────────────────────────────
    const [convertedClicks, funnelConversions, funnelRevenue] = await Promise.all([
      db.clickRecord.count({
        where: { ...clickWhere, createdAt: { gte: startDate }, converted: true },
      }),
      db.conversion.count({
        where: { ...conversionLinkWhere, createdAt: { gte: startDate } },
      }),
      db.conversion.aggregate({
        _sum: { amount: true },
        where: { ...conversionLinkWhere, createdAt: { gte: startDate }, status: { in: ['confirmed', 'paid'] } },
      }),
    ])

    const funnel = {
      views: periodClicks, // clicks serve as views in affiliate context
      clicks: periodClicks,
      convertedClicks,
      purchases: funnelConversions,
      revenue: funnelRevenue._sum.amount ? Number(funnelRevenue._sum.amount) : 0,
    }

    // ── Traffic sources (from referer) ──────────────────────────────
    const clicksByReferer = await db.clickRecord.groupBy({
      by: ['referer'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      where: { ...clickWhere, createdAt: { gte: startDate }, referer: { not: null } },
      take: 10,
    })

    const trafficSources = clicksByReferer
      .filter((r) => r.referer !== null)
      .map((r) => ({
        source: r.referer || 'Direct',
        clicks: r._count.id,
      }))

    // ── Period comparison (optional) ────────────────────────────────
    let comparison: {
      current: { clicks: number; conversions: number; earnings: number; revenue: number; conversionRate: number }
      previous: { clicks: number; conversions: number; earnings: number; revenue: number; conversionRate: number }
      change: { clicks: number; conversions: number; earnings: number; revenue: number }
    } | null = null
    if (compare) {
      const [
        prevPeriodClicks,
        prevPeriodConversions,
        prevPeriodEarningsResult,
      ] = await Promise.all([
        db.clickRecord.count({
          where: { ...clickWhere, createdAt: { gte: previousStartDate, lt: startDate } },
        }),
        db.conversion.count({
          where: { ...conversionLinkWhere, createdAt: { gte: previousStartDate, lt: startDate } },
        }),
        db.conversion.aggregate({
          _sum: { commission: true, amount: true },
          where: { ...conversionLinkWhere, createdAt: { gte: previousStartDate, lt: startDate } },
        }),
      ])

      const prevEarnings = prevPeriodEarningsResult._sum.commission
        ? Number(prevPeriodEarningsResult._sum.commission)
        : 0
      const prevRevenue = prevPeriodEarningsResult._sum.amount
        ? Number(prevPeriodEarningsResult._sum.amount)
        : 0

      comparison = {
        current: {
          clicks: periodClicks,
          conversions: periodConversions,
          earnings: periodEarnings,
          revenue: periodRevenue,
          conversionRate:
            periodClicks > 0
              ? Math.round((periodConversions / periodClicks) * 10000) / 100
              : 0,
        },
        previous: {
          clicks: prevPeriodClicks,
          conversions: prevPeriodConversions,
          earnings: prevEarnings,
          revenue: prevRevenue,
          conversionRate:
            prevPeriodClicks > 0
              ? Math.round((prevPeriodConversions / prevPeriodClicks) * 10000) / 100
              : 0,
        },
        change: {
          clicks: prevPeriodClicks > 0
            ? Math.round(((periodClicks - prevPeriodClicks) / prevPeriodClicks) * 10000) / 100
            : 0,
          conversions: prevPeriodConversions > 0
            ? Math.round(((periodConversions - prevPeriodConversions) / prevPeriodConversions) * 10000) / 100
            : 0,
          earnings: prevEarnings > 0
            ? Math.round(((periodEarnings - prevEarnings) / prevEarnings) * 10000) / 100
            : 0,
          revenue: prevRevenue > 0
            ? Math.round(((periodRevenue - prevRevenue) / prevRevenue) * 10000) / 100
            : 0,
        },
      }
    }

    return NextResponse.json({
      period,
      summary: {
        clicks: periodClicks,
        uniqueVisitors,
        conversions: periodConversions,
        earnings: periodEarnings,
        revenue: periodRevenue,
        conversionRate:
          periodClicks > 0
            ? Math.round((periodConversions / periodClicks) * 10000) / 100
            : 0,
        avgOrderValue:
          periodConversions > 0
            ? Math.round((periodRevenue / periodConversions) * 100) / 100
            : 0,
      },
      clicksOverTime,
      conversionsOverTime,
      countries,
      devices,
      browsers,
      categories,
      topLinks,
      funnel,
      trafficSources,
      ...(comparison ? { comparison } : {}),
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

// ── Helper ────────────────────────────────────────────────────────────

function aggregateByDay(
  data: Array<{ date: Date; count: number; value?: number }>,
  startDate: Date,
  endDate: Date,
  includeValue = false
): Array<{ date: string; count: number; value?: number }> {
  const dayMap = new Map<string, { count: number; value: number }>()

  // Initialize all days in range
  const current = new Date(startDate)
  while (current <= endDate) {
    const key = current.toISOString().split('T')[0]
    dayMap.set(key, { count: 0, value: 0 })
    current.setDate(current.getDate() + 1)
  }

  // Fill in data
  for (const item of data) {
    const key = new Date(item.date).toISOString().split('T')[0]
    if (dayMap.has(key)) {
      const existing = dayMap.get(key)!
      dayMap.set(key, {
        count: existing.count + item.count,
        value: existing.value + (item.value || 0),
      })
    }
  }

  return Array.from(dayMap.entries()).map(([date, { count, value }]) => ({
    date,
    count,
    ...(includeValue ? { value: Math.round(value * 100) / 100 } : {}),
  }))
}
