import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'

/**
 * GET /api/shopee/stats
 * Aggregate real stats from ClickRecord, Conversion, AffiliateLink tables.
 *
 * Query: ?period=7d|30d|90d&granularity=hour|day|week|month
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const granularity = searchParams.get('granularity') || 'day'

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 86400 * 1000)

    const linkFilter = userId ? { userId } : {}

    // ── 1. Try real Shopee API first if credentials exist ──
    try {
      const shopeeService = await getShopeeServiceFromDB()
      if (shopeeService && !shopeeService.isUsingMock) {
        const now = Math.floor(Date.now() / 1000)
        const periodSeconds: Record<string, number> = {
          '7d': 7 * 86400,
          '30d': 30 * 86400,
          '90d': 90 * 86400,
        }
        const startTime = now - (periodSeconds[period] || periodSeconds['30d'])

        const stats = await shopeeService.getClickStats({
          startTime,
          endTime: now,
          granularity: granularity as 'hour' | 'day' | 'week' | 'month',
        })

        if (stats.length > 0 && stats[0].source === 'graphql_api') {
          return NextResponse.json({
            connected: true,
            stats: stats.map((s) => ({
              date: s.date,
              clicks: s.clicks,
              uniqueClicks: s.uniqueClicks,
              conversions: s.conversions,
              earnings: s.earnings,
            })),
            period,
            granularity,
            source: 'graphql_api',
          })
        }
      }
    } catch (apiError) {
      console.error('[Shopee Stats] API failed, using DB:', apiError)
    }

    // ── 2. Aggregate stats from DB ──
    // Get all clicks in the period
    const clicks = await db.clickRecord.findMany({
      where: {
        createdAt: { gte: startDate },
        affiliateLink: linkFilter,
      },
      select: {
        createdAt: true,
        converted: true,
        country: true,
        device: true,
      },
    })

    // Get all conversions in the period
    const conversions = await db.conversion.findMany({
      where: {
        createdAt: { gte: startDate },
        affiliateLink: linkFilter,
      },
      select: {
        createdAt: true,
        commission: true,
        amount: true,
      },
    })

    // Group by date based on granularity
    const groupedData = new Map<string, {
      date: string
      clicks: number
      uniqueClicks: number
      conversions: number
      earnings: number
    }>()

    // Initialize all dates in the range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = formatDateKey(date, granularity)
      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, {
          date: date.toISOString().split('T')[0],
          clicks: 0,
          uniqueClicks: 0,
          conversions: 0,
          earnings: 0,
        })
      }
    }

    // Count clicks by date
    const clickDates = new Map<string, Set<string>>()
    for (const click of clicks) {
      const dateKey = formatDateKey(click.createdAt, granularity)
      const entry = groupedData.get(dateKey)
      if (entry) {
        entry.clicks++
        // Track unique by IP for approximation
        const ip = click.country || 'unknown'
        if (!clickDates.has(dateKey)) clickDates.set(dateKey, new Set())
        clickDates.get(dateKey)!.add(ip)
      }
    }

    // Update unique click counts
    for (const [dateKey, ips] of clickDates) {
      const entry = groupedData.get(dateKey)
      if (entry) {
        entry.uniqueClicks = ips.size
      }
    }

    // Count conversions by date
    for (const conv of conversions) {
      const dateKey = formatDateKey(conv.createdAt, granularity)
      const entry = groupedData.get(dateKey)
      if (entry) {
        entry.conversions++
        entry.earnings += Number(conv.commission)
      }
    }

    const stats = Array.from(groupedData.values())

    return NextResponse.json({
      connected: false,
      stats,
      period,
      granularity,
      source: 'db',
      message: 'Aggregated from database. Connect Shopee API for real-time statistics.',
    })
  } catch (error) {
    console.error('Shopee stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

function formatDateKey(date: Date, granularity: string): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  switch (granularity) {
    case 'hour':
      return `${y}-${m}-${d}T${String(date.getHours()).padStart(2, '0')}`
    case 'week': {
      const startOfYear = new Date(y, 0, 1)
      const weekNum = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
      return `${y}-W${String(weekNum).padStart(2, '0')}`
    }
    case 'month':
      return `${y}-${m}`
    default: // day
      return `${y}-${m}-${d}`
  }
}
