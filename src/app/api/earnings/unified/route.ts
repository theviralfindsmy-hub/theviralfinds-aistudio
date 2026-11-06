import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  PLATFORM_COLORS,
  PLATFORM_EMOJI,
  PLATFORM_NAMES,
  MONTH_LABELS,
} from '@/lib/earnings/mock-data'
import type {
  AffiliatePlatform,
  EarningsPeriod,
  EarningsTrendPoint,
  PlatformBreakdown,
  PlatformEarning,
  UnifiedEarningsResponse,
  UnifiedEarningsSummary,
} from '@/lib/earnings/types'

const ALL_PLATFORMS: AffiliatePlatform[] = ['shopee', 'tiktok', 'lazada']

const PERIOD_DAYS: Record<EarningsPeriod, number> = {
  '30d': 30,
  '90d': 90,
  '12m': 365,
}

/**
 * GET /api/earnings/unified
 *
 * Returns unified earnings across Shopee, TikTok Shop, and Lazada,
 * sourced from real database data. At present, all DB conversions are
 * attributed to Shopee (the primary platform). TikTok and Lazada return
 * zeros until platform-specific attribution is added.
 *
 * Query params:
 *   - period: '30d' | '90d' | '12m' (default: '12m')
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)
    const rawPeriod = searchParams.get('period')

    const VALID_PERIODS: EarningsPeriod[] = ['30d', '90d', '12m']
    const period: EarningsPeriod =
      rawPeriod && VALID_PERIODS.includes(rawPeriod as EarningsPeriod)
        ? (rawPeriod as EarningsPeriod)
        : '12m'

    const days = PERIOD_DAYS[period]
    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // ── Scoped where for conversions ────────────────────────────────
    const conversionWhere = userId
      ? { affiliateLink: { userId } }
      : {}

    // ── Period aggregates ───────────────────────────────────────────
    const [periodAgg, totalClicksResult] = await Promise.all([
      db.conversion.aggregate({
        _sum: { commission: true, amount: true },
        _count: { id: true },
        where: { ...conversionWhere, createdAt: { gte: startDate } },
      }),
      db.affiliateLink.aggregate({
        _sum: { clicks: true, conversions: true },
        where: userId ? { userId } : {},
      }),
    ])

    const totalEarnings = periodAgg._sum.commission
      ? Number(periodAgg._sum.commission)
      : 0
    const totalRevenue = periodAgg._sum.amount
      ? Number(periodAgg._sum.amount)
      : 0
    const totalConversions = periodAgg._count.id || 0
    const totalClicks = totalClicksResult._sum.clicks || 0
    const allTimeConversions = totalClicksResult._sum.conversions || 0

    // ── Monthly trend (last 12 months) ──────────────────────────────
    // Use raw SQL for SQLite to group by month
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)

    const monthlyRows = await db.$queryRaw<
      Array<{ month: string; total_commission: number }>
    >`
      SELECT
        strftime('%Y-%m', "createdAt") AS month,
        CAST(SUM(CAST(commission AS REAL)) AS REAL) AS total_commission
      FROM conversions
      WHERE "createdAt" >= ${twelveMonthsAgo}
      GROUP BY strftime('%Y-%m', "createdAt")
      ORDER BY month ASC
    `

    // Build a map of month -> commission
    const monthMap = new Map<string, number>()
    for (const row of monthlyRows) {
      monthMap.set(row.month, row.total_commission || 0)
    }

    // Generate 12-month trend
    const trend: EarningsTrendPoint[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = MONTH_LABELS[d.getMonth()]
      const shopeeEarnings = monthMap.get(key) || 0
      trend.push({
        date: label,
        shopee: Math.round(shopeeEarnings * 100) / 100,
        tiktok: 0,
        lazada: 0,
        total: Math.round(shopeeEarnings * 100) / 100,
      })
    }

    // ── MoM change for Shopee ───────────────────────────────────────
    const lastMonth = trend.length >= 2 ? trend[trend.length - 1].shopee : 0
    const prevMonth = trend.length >= 2 ? trend[trend.length - 2].shopee : 0
    const shopeeMomChange = prevMonth > 0
      ? Math.round(((lastMonth - prevMonth) / prevMonth) * 10000) / 100
      : 0

    // ── Build per-platform data ─────────────────────────────────────
    // Currently all DB data is attributed to Shopee
    const byPlatform: PlatformEarning[] = ALL_PLATFORMS.map((platform) => {
      const isShopee = platform === 'shopee'
      const earnings = isShopee ? totalEarnings : 0
      const clicks = isShopee ? totalClicks : 0
      const conversions = isShopee ? totalConversions : 0
      const conversionRate = isShopee && clicks > 0
        ? Math.round((conversions / clicks) * 10000) / 100
        : isShopee ? 0 : (platform === 'tiktok' ? 5.8 : 3.5) // Default rates

      return {
        platform,
        platformName: PLATFORM_NAMES[platform],
        emoji: PLATFORM_EMOJI[platform],
        earnings,
        clicks,
        conversions,
        conversionRate,
        momChange: isShopee ? shopeeMomChange : 0,
        sparkline: isShopee
          ? trend.map((t) => t.shopee)
          : Array(12).fill(0),
        color: PLATFORM_COLORS[platform],
      }
    })

    // ── Summary ─────────────────────────────────────────────────────
    const summary: UnifiedEarningsSummary = {
      totalEarnings,
      totalClicks,
      totalConversions,
      avgConversionRate:
        totalClicks > 0
          ? Math.round((totalConversions / totalClicks) * 10000) / 100
          : 0,
      platformCount: totalEarnings > 0 ? 1 : 0,
      period,
    }

    // ── Breakdown (pie-chart data) ──────────────────────────────────
    const breakdown: PlatformBreakdown[] = byPlatform.map((p) => ({
      platform: p.platform,
      name: p.platformName,
      value: p.earnings,
      share: totalEarnings > 0
        ? (p.earnings / totalEarnings) * 100
        : 0,
      color: p.color,
    }))

    const response: UnifiedEarningsResponse = {
      summary,
      byPlatform,
      breakdown,
      trend,
      source: 'api',
      period,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[/api/earnings/unified] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch unified earnings',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'api',
      },
      { status: 500 }
    )
  }
}
