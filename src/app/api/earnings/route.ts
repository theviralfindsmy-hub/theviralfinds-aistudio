import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/earnings
 *
 * Query params: period ('7d' | '30d' | '90d')
 *
 * Returns: summary, chart, recentConversions, payouts, goals, earningsByStatus, categoryBreakdown
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const now = new Date()
    let startDate: Date
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    // ── Scoped where clauses ────────────────────────────────────────
    const conversionWhere = userId
      ? { affiliateLink: { userId } }
      : {}

    // ── Time boundaries for today / this week ──────────────────────
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Sunday as start of week
    weekStart.setHours(0, 0, 0, 0)

    // ── Total & period summary ──────────────────────────────────────
    const [
      totalEarningsResult,
      periodEarningsResult,
      todayEarningsResult,
      weekEarningsResult,
      totalConversions,
      earningsByStatus,
    ] = await Promise.all([
      db.conversion.aggregate({
        _sum: { commission: true, amount: true },
        where: conversionWhere,
      }),
      db.conversion.aggregate({
        _sum: { commission: true, amount: true },
        where: { ...conversionWhere, createdAt: { gte: startDate } },
      }),
      db.conversion.aggregate({
        _sum: { commission: true },
        where: { ...conversionWhere, createdAt: { gte: todayStart } },
      }),
      db.conversion.aggregate({
        _sum: { commission: true },
        where: { ...conversionWhere, createdAt: { gte: weekStart } },
      }),
      db.conversion.count({ where: conversionWhere }),
      // Group earnings by status
      db.conversion.groupBy({
        by: ['status'],
        _sum: { commission: true },
        where: conversionWhere,
      }),
    ])

    const totalEarnings = totalEarningsResult._sum.commission
      ? Number(totalEarningsResult._sum.commission)
      : 0
    const periodEarnings = periodEarningsResult._sum.commission
      ? Number(periodEarningsResult._sum.commission)
      : 0
    const todayEarnings = todayEarningsResult._sum.commission
      ? Number(todayEarningsResult._sum.commission)
      : 0
    const weekEarnings = weekEarningsResult._sum.commission
      ? Number(weekEarningsResult._sum.commission)
      : 0
    const totalRevenue = totalEarningsResult._sum.amount
      ? Number(totalEarningsResult._sum.amount) : 0

    // Format earnings by status
    const statusBreakdown: Record<string, number> = {}
    for (const row of earningsByStatus) {
      statusBreakdown[row.status] = row._sum.commission
        ? Number(row._sum.commission)
        : 0
    }

    // ── Chart data — earnings by day ────────────────────────────────
    const earningsByDayRaw = await db.conversion.groupBy({
      by: ['createdAt'],
      _sum: { commission: true },
      where: { ...conversionWhere, createdAt: { gte: startDate } },
    })

    const chart = aggregateByDay(
      earningsByDayRaw.map((r) => ({
        date: r.createdAt,
        value: r._sum.commission ? Number(r._sum.commission) : 0,
      })),
      startDate,
      now
    )

    // ── Recent conversions ──────────────────────────────────────────
    const recentConversions = await db.conversion.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      where: conversionWhere,
      include: {
        affiliateLink: {
          select: { name: true, productName: true, shortCode: true },
        },
      },
    })

    // ── Payout history ──────────────────────────────────────────────
    const payoutWhere = userId ? { userId } : {}

    const [payouts, pendingPayoutResult, completedPayoutResult] = await Promise.all([
      db.payout.findMany({
        where: payoutWhere,
        orderBy: { requestedAt: 'desc' },
        take: 10,
      }),
      db.payout.aggregate({
        _sum: { amount: true },
        where: { ...payoutWhere, status: 'pending' },
      }),
      db.payout.aggregate({
        _sum: { amount: true },
        where: { ...payoutWhere, status: 'completed' },
      }),
    ])

    const pendingPayout = pendingPayoutResult._sum.amount
      ? Number(pendingPayoutResult._sum.amount)
      : 0
    const completedPayout = completedPayoutResult._sum.amount
      ? Number(completedPayoutResult._sum.amount)
      : 0

    // ── Earning goals ───────────────────────────────────────────────
    const earningGoals = await db.earningGoal.findMany({
      where: { status: 'active' },
    })

    // ── Commission breakdown by category ────────────────────────────
    const linkCategoryEarnings = await db.conversion.groupBy({
      by: ['linkId'],
      _sum: { commission: true },
      where: conversionWhere,
    })

    // Get category for each link
    const linkIds = linkCategoryEarnings.map((l) => l.linkId)
    const linkCategories = await db.affiliateLink.findMany({
      where: { id: { in: linkIds } },
      select: { id: true, category: true },
    })

    const categoryMap = new Map(linkCategories.map((l) => [l.id, l.category || 'Uncategorized']))
    const categoryEarnings: Record<string, number> = {}
    for (const entry of linkCategoryEarnings) {
      const cat = categoryMap.get(entry.linkId) || 'Uncategorized'
      categoryEarnings[cat] = (categoryEarnings[cat] || 0) + (entry._sum.commission ? Number(entry._sum.commission) : 0)
    }

    const categoryBreakdown = Object.entries(categoryEarnings)
      .map(([category, commission]) => ({ category, commission }))
      .sort((a, b) => b.commission - a.commission)

    return NextResponse.json({
      period,
      summary: {
        totalEarnings,
        periodEarnings,
        todayEarnings,
        weekEarnings,
        totalRevenue,
        pendingPayout,
        completedPayout,
        conversionCount: totalConversions,
        avgCommission: totalConversions > 0 ? Math.round((totalEarnings / totalConversions) * 100) / 100 : 0,
      },
      earningsByStatus: {
        pending: statusBreakdown['pending'] || 0,
        confirmed: statusBreakdown['confirmed'] || 0,
        rejected: statusBreakdown['rejected'] || 0,
        paid: statusBreakdown['paid'] || 0,
      },
      chart,
      recentConversions: recentConversions.map((c) => ({
        id: c.id,
        linkName: c.affiliateLink?.name || c.affiliateLink?.productName || 'Unknown',
        amount: Number(c.amount),
        commission: Number(c.commission),
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        bankName: p.bankName,
        status: p.status,
        requestedAt: p.requestedAt.toISOString(),
        processedAt: p.processedAt ? p.processedAt.toISOString() : null,
        note: p.note,
      })),
      goals: earningGoals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        period: g.period,
        status: g.status,
        progress:
          Number(g.targetAmount) > 0
            ? Math.min(
                100,
                Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
              )
            : 0,
      })),
      categoryBreakdown,
    })
  } catch (error) {
    console.error('Earnings API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
}

// ── Helper ────────────────────────────────────────────────────────────

function aggregateByDay(
  data: Array<{ date: Date; value: number }>,
  startDate: Date,
  endDate: Date
): Array<{ date: string; value: number }> {
  const dayMap = new Map<string, number>()

  const current = new Date(startDate)
  while (current <= endDate) {
    const key = current.toISOString().split('T')[0]
    dayMap.set(key, 0)
    current.setDate(current.getDate() + 1)
  }

  for (const item of data) {
    const key = new Date(item.date).toISOString().split('T')[0]
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) || 0) + item.value)
    }
  }

  return Array.from(dayMap.entries()).map(([date, value]) => ({
    date,
    value: Math.round(value * 100) / 100,
  }))
}
