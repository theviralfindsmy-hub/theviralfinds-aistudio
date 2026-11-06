/**
 * Data fetchers for the export routes.
 *
 * Each fetcher tries the real Prisma database first, then falls back to
 * demo data when the table is empty (matching the behaviour of
 * /api/earnings and /api/analytics).
 */

import { db } from '@/lib/db'
import {
  formatMYDate,
  resolvePeriod,
  aggregateByDay,
} from './utils'
import {
  getDemoEarningsRows,
  getDemoLinkRows,
  getDemoAnalyticsRows,
  type EarningsRow,
  type LinkRow,
  type AnalyticsDayRow,
} from './demo-data'

export type { EarningsRow, LinkRow, AnalyticsDayRow }

/** Fetch earnings rows (real DB first, demo fallback). */
export async function fetchEarningsRows(
  period: string | null,
  startDate?: string | null,
  endDate?: string | null
): Promise<{ rows: EarningsRow[]; source: 'database' | 'demo' }> {
  try {
    const total = await db.conversion.count()
    if (total === 0) {
      return {
        rows: getDemoEarningsRows(period, startDate, endDate),
        source: 'demo',
      }
    }

    const { start, end } = resolvePeriod(period, startDate, endDate)
    const conversions = await db.conversion.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        affiliateLink: {
          select: { name: true, productName: true, shortCode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const rows: EarningsRow[] = conversions.map((c) => ({
      id: c.id,
      date: c.createdAt.toISOString(),
      orderId: c.orderId,
      productName:
        c.affiliateLink?.name ||
        c.affiliateLink?.productName ||
        'Unknown Product',
      amount: Number(c.amount),
      commission: Number(c.commission),
      status: c.status,
    }))

    return { rows, source: 'database' }
  } catch (error) {
    console.error('fetchEarningsRows error:', error)
    return {
      rows: getDemoEarningsRows(period, startDate, endDate),
      source: 'demo',
    }
  }
}

/** Fetch all affiliate links (real DB first, demo fallback). */
export async function fetchLinkRows(): Promise<{
  rows: LinkRow[]
  source: 'database' | 'demo'
}> {
  try {
    const total = await db.affiliateLink.count()
    if (total === 0) {
      return { rows: getDemoLinkRows(), source: 'demo' }
    }

    const links = await db.affiliateLink.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const rows: LinkRow[] = links.map((link) => ({
      id: link.id,
      name: link.name,
      shortCode: link.shortCode,
      affiliateUrl: link.affiliateUrl,
      productName: link.productName,
      clicks: link.clicks,
      conversions: link.conversions,
      earnings: Number(link.earnings),
      ctr: link.ctr ? Number(link.ctr) : null,
      status: link.status,
      createdAt: link.createdAt.toISOString(),
    }))

    return { rows, source: 'database' }
  } catch (error) {
    console.error('fetchLinkRows error:', error)
    return { rows: getDemoLinkRows(), source: 'demo' }
  }
}

/** Fetch daily analytics rows (real DB first, demo fallback). */
export async function fetchAnalyticsRows(
  period: string | null,
  startDate?: string | null,
  endDate?: string | null
): Promise<{ rows: AnalyticsDayRow[]; source: 'database' | 'demo' }> {
  try {
    const totalClicks = await db.clickRecord.count()
    const totalConversions = await db.conversion.count()
    if (totalClicks === 0 && totalConversions === 0) {
      return {
        rows: getDemoAnalyticsRows(period, startDate, endDate),
        source: 'demo',
      }
    }

    const { start, end } = resolvePeriod(period, startDate, endDate)

    const clicksOverTime = await db.clickRecord.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { id: true },
    })
    const clicksByDay = aggregateByDay(
      clicksOverTime.map((r) => ({
        date: r.createdAt,
        value: r._count.id,
      })),
      start,
      end
    ).map((r) => ({ date: r.date, count: r.value }))

    const conversionsOverTime = await db.conversion.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { id: true },
    })
    const conversionsByDay = aggregateByDay(
      conversionsOverTime.map((r) => ({
        date: r.createdAt,
        value: r._count.id,
      })),
      start,
      end
    ).map((r) => ({ date: r.date, count: r.value }))

    const earningsByDayRaw = await db.conversion.groupBy({
      by: ['createdAt'],
      _sum: { commission: true },
      where: { createdAt: { gte: start, lte: end } },
    })
    const earningsByDay = aggregateByDay(
      earningsByDayRaw.map((r) => ({
        date: r.createdAt,
        value: r._sum.commission ? Number(r._sum.commission) : 0,
      })),
      start,
      end
    ).map((r) => ({ date: r.date, value: r.value }))

    const allDates = new Set<string>([
      ...clicksByDay.map((c) => c.date),
      ...conversionsByDay.map((c) => c.date),
      ...earningsByDay.map((e) => e.date),
    ])

    const rows: AnalyticsDayRow[] = Array.from(allDates)
      .sort()
      .map((date) => {
        const clicks = clicksByDay.find((c) => c.date === date)?.count ?? 0
        const conversions =
          conversionsByDay.find((c) => c.date === date)?.count ?? 0
        const earnings = earningsByDay.find((e) => e.date === date)?.value ?? 0
        const ctr =
          clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0
        return { date, clicks, conversions, ctr, earnings }
      })

    return { rows, source: 'database' }
  } catch (error) {
    console.error('fetchAnalyticsRows error:', error)
    return {
      rows: getDemoAnalyticsRows(period, startDate, endDate),
      source: 'demo',
    }
  }
}

/** Build a human-readable period label, e.g. "01/06/2025 - 30/06/2025". */
export function buildPeriodLabel(
  period: string | null,
  startDate?: string | null,
  endDate?: string | null
): string {
  const { start, end } = resolvePeriod(period, startDate, endDate)
  return `${formatMYDate(start)} - ${formatMYDate(end)}`
}
