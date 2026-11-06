import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined

    const linkWhere = userId ? { userId } : {}

    // ─── Aggregate stats from affiliate links ─────────────────────────────
    const linkStats = await db.affiliateLink.aggregate({
      _sum: { clicks: true, conversions: true, earnings: true },
      _count: true,
      where: linkWhere,
    })

    const activeLinks = await db.affiliateLink.count({ where: { ...linkWhere, status: 'active' } })
    const totalCampaigns = await db.campaign.count({})
    const activeCampaigns = await db.campaign.count({ where: { status: 'active' } })

    const totalClicks = linkStats._sum.clicks || 0
    const totalConversions = linkStats._sum.conversions || 0
    const totalEarnings = linkStats._sum.earnings ? Number(linkStats._sum.earnings) : 0
    const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0
    const totalLinks = linkWhere
      ? await db.affiliateLink.count({ where: linkWhere })
      : linkStats._count

    // ─── Recent activity (last 10 entries) ────────────────────────────────
    const recentClicks = await db.clickRecord.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      where: userId ? { userId } : {},
      include: { affiliateLink: { select: { name: true, shortCode: true } } },
    })

    const recentConversions = await db.conversion.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      where: userId ? { affiliateLink: { userId } } : {},
      include: { affiliateLink: { select: { name: true, shortCode: true } } },
    })

    const recentActivity = [
      ...recentClicks.map(c => ({
        id: c.id,
        type: 'click' as const,
        linkName: c.affiliateLink?.name || 'Unknown',
        shortCode: c.affiliateLink?.shortCode || '',
        country: c.country || null,
        device: c.device || null,
        timestamp: c.createdAt.toISOString(),
      })),
      ...recentConversions.map(c => ({
        id: c.id,
        type: 'conversion' as const,
        linkName: c.affiliateLink?.name || 'Unknown',
        shortCode: c.affiliateLink?.shortCode || '',
        amount: Number(c.amount),
        commission: Number(c.commission),
        status: c.status,
        timestamp: c.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)

    // ─── Top 5 products by earnings ───────────────────────────────────────
    const topProducts = await db.affiliateLink.findMany({
      take: 5,
      orderBy: { earnings: 'desc' },
      where: { ...linkWhere, earnings: { gt: 0 } },
      select: {
        id: true, productName: true, productImage: true, productPrice: true,
        commission: true, clicks: true, conversions: true, earnings: true,
      },
    })

    // ─── Earnings chart — last 30 days from conversions ──────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    const recentConversionsForChart = await db.conversion.findMany({
      where: userId
        ? { affiliateLink: { userId }, createdAt: { gte: thirtyDaysAgo } }
        : { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, commission: true },
    })

    const earningsDayMap = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      earningsDayMap.set(d.toISOString().split('T')[0], 0)
    }
    for (const c of recentConversionsForChart) {
      const day = new Date(c.createdAt).toISOString().split('T')[0]
      if (earningsDayMap.has(day)) {
        earningsDayMap.set(day, (earningsDayMap.get(day) || 0) + Number(c.commission))
      }
    }
    const earningsChart = Array.from(earningsDayMap.entries()).map(([date, value]) => {
      const d = new Date(date)
      return {
        date,
        name: `${d.getDate()}/${d.getMonth() + 1}`,
        value: Math.round(value * 100) / 100,
      }
    })

    // ─── Clicks chart — last 30 days from click records ──────────────────
    const recentClicksForChart = await db.clickRecord.findMany({
      where: userId
        ? { userId, createdAt: { gte: thirtyDaysAgo } }
        : { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    })

    const clicksDayMap = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      clicksDayMap.set(d.toISOString().split('T')[0], 0)
    }
    for (const c of recentClicksForChart) {
      const day = new Date(c.createdAt).toISOString().split('T')[0]
      if (clicksDayMap.has(day)) {
        clicksDayMap.set(day, (clicksDayMap.get(day) || 0) + 1)
      }
    }
    const clicksChart = Array.from(clicksDayMap.entries()).map(([date, count]) => {
      const d = new Date(date)
      return {
        date,
        name: `${d.getDate()}/${d.getMonth() + 1}`,
        clicks: count,
      }
    })

    // ─── Trends (compare last 7 days vs previous 7 days) ─────────────────
    const last7 = new Date(Date.now() - 7 * 86400000)
    const prev7 = new Date(Date.now() - 14 * 86400000)

    const [last7Clicks, prev7Clicks] = await Promise.all([
      db.clickRecord.count({
        where: { createdAt: { gte: last7 }, ...(userId ? { userId } : {}) },
      }),
      db.clickRecord.count({
        where: { createdAt: { gte: prev7, lt: last7 }, ...(userId ? { userId } : {}) },
      }),
    ])

    const [last7Conversions, prev7Conversions] = await Promise.all([
      db.conversion.findMany({
        where: { createdAt: { gte: last7 }, ...(userId ? { affiliateLink: { userId } } : {}) },
        select: { commission: true },
      }),
      db.conversion.findMany({
        where: { createdAt: { gte: prev7, lt: last7 }, ...(userId ? { affiliateLink: { userId } } : {}) },
        select: { commission: true },
      }),
    ])

    const last7Earnings = last7Conversions.reduce((sum, c) => sum + Number(c.commission), 0)
    const prev7Earnings = prev7Conversions.reduce((sum, c) => sum + Number(c.commission), 0)

    const clicksTrend = prev7Clicks > 0
      ? Math.round(((last7Clicks - prev7Clicks) / prev7Clicks) * 1000) / 10
      : last7Clicks > 0 ? 100 : 0
    const conversionsTrend = prev7Conversions.length > 0
      ? Math.round(((last7Conversions.length - prev7Conversions.length) / prev7Conversions.length) * 1000) / 10
      : last7Conversions.length > 0 ? 100 : 0
    const earningsTrend = prev7Earnings > 0
      ? Math.round(((last7Earnings - prev7Earnings) / prev7Earnings) * 1000) / 10
      : last7Earnings > 0 ? 100 : 0
    const conversionRateTrend = prev7Clicks > 0 && last7Clicks > 0
      ? Math.round(
          (((last7Conversions.length / last7Clicks) - (prev7Conversions.length / prev7Clicks)) /
            (prev7Conversions.length / prev7Clicks || 1)) * 1000
        ) / 10
      : 0

    return NextResponse.json({
      stats: {
        totalClicks,
        totalConversions,
        totalEarnings,
        conversionRate,
        activeLinks,
        totalLinks,
        activeCampaigns,
        totalCampaigns,
      },
      trends: {
        clicks: clicksTrend,
        conversions: conversionsTrend,
        earnings: earningsTrend,
        conversionRate: conversionRateTrend,
      },
      recentActivity,
      topProducts: topProducts.map(p => ({
        ...p,
        productPrice: p.productPrice ? Number(p.productPrice) : null,
        commission: p.commission ? Number(p.commission) : null,
        earnings: Number(p.earnings),
        rate: p.clicks > 0 ? Math.round((p.conversions / p.clicks) * 1000) / 10 : 0,
      })),
      earningsChart,
      clicksChart,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
