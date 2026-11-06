import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/team/[id]/analytics
 *
 * Aggregated team analytics: total clicks/conversions/earnings, 12-month
 * trend, per-member contribution, platform distribution, and top shared links.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const team = await db.team.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'db' },
        { status: 404 },
      )
    }

    const memberUserIds = team.members.map((m) => m.userId)

    // Get all affiliate links for team members
    const links = await db.affiliateLink.findMany({
      where: { userId: { in: memberUserIds } },
      include: {
        clickRecords: {
          where: {
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
            },
          },
        },
        conversionRecords: {
          where: {
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
            },
          },
        },
      },
    })

    // Summary
    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0)
    const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0)
    const totalEarnings = links.reduce((sum, l) => sum + Number(l.earnings), 0)
    const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    // Build 12-month trend
    const now = new Date()
    const trend: Array<{ date: string; clicks: number; conversions: number; earnings: number }> = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthStart.toISOString().slice(0, 7)

      let monthClicks = 0
      let monthConversions = 0
      let monthEarnings = 0

      for (const link of links) {
        const monthClickRecords = link.clickRecords.filter(
          (c) => c.createdAt >= monthStart && c.createdAt <= monthEnd,
        )
        const monthConversionRecords = link.conversionRecords.filter(
          (c) => c.createdAt >= monthStart && c.createdAt <= monthEnd,
        )
        monthClicks += monthClickRecords.length
        monthConversions += monthConversionRecords.length
        monthEarnings += monthConversionRecords.reduce((s, c) => s + Number(c.commission), 0)
      }

      trend.push({
        date: monthLabel,
        clicks: monthClicks,
        conversions: monthConversions,
        earnings: Math.round(monthEarnings * 100) / 100,
      })
    }

    // Per-member contribution
    const perMember = await Promise.all(
      team.members.map(async (m) => {
        const memberLinks = links.filter((l) => l.userId === m.userId)
        const memberClicks = memberLinks.reduce((sum, l) => sum + l.clicks, 0)
        const memberConversions = memberLinks.reduce((sum, l) => sum + l.conversions, 0)
        const memberEarnings = memberLinks.reduce((sum, l) => sum + Number(l.earnings), 0)

        return {
          memberId: m.id,
          name: '',
          initials: '',
          avatarColor: '',
          clicks: memberClicks,
          conversions: memberConversions,
          earnings: Math.round(memberEarnings * 100) / 100,
        }
      }),
    )

    // Platform distribution (from link categories/tags)
    const platformMap: Record<string, { clicks: number; conversions: number; earnings: number }> = {}
    for (const link of links) {
      const platform = link.category || 'other'
      if (!platformMap[platform]) {
        platformMap[platform] = { clicks: 0, conversions: 0, earnings: 0 }
      }
      platformMap[platform].clicks += link.clicks
      platformMap[platform].conversions += link.conversions
      platformMap[platform].earnings += Number(link.earnings)
    }
    const platformDistribution = Object.entries(platformMap).map(([platform, data]) => ({
      platform,
      ...data,
      earnings: Math.round(data.earnings * 100) / 100,
    }))

    // Top shared links
    const topSharedLinks = links
      .sort((a, b) => Number(b.earnings) - Number(a.earnings))
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        title: l.name,
        product: l.productName ?? '',
        platform: l.category ?? 'other',
        clicks: l.clicks,
        conversions: l.conversions,
        earnings: Math.round(Number(l.earnings) * 100) / 100,
        ownerName: '',
      }))

    const analytics = {
      teamId: team.id,
      summary: {
        totalClicks,
        totalConversions,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        avgConversionRate: Math.round(avgConversionRate * 10) / 10,
      },
      trend,
      perMember,
      platformDistribution,
      topSharedLinks,
    }

    return NextResponse.json(
      { analytics, source: 'db' as const },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    console.error('[/api/team/[id]/analytics GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch team analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}
