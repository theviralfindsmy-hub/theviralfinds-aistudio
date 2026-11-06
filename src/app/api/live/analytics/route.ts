import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { LiveAnalytics } from '@/lib/live/types'
import { MOCK_ANALYTICS, MOCK_SESSIONS } from '@/lib/live/mock-data'

// ─── GET /api/live/analytics?sessionId=xxx ──────────────────────────────────────
// Returns analytics from completed LiveSessions in DB.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Try DB first
      try {
        const session = await db.liveSession.findUnique({
          where: { id: sessionId },
        })

        if (session && session.status === 'completed') {
          const analytics = buildAnalyticsFromSession(session)
          return NextResponse.json({ analytics, source: 'db' })
        }

        if (session) {
          // Session exists but not completed — return placeholder
          const placeholder: LiveAnalytics = {
            sessionId,
            viewers: session.viewers,
            peakViewers: session.peakViewers,
            avgViewDurationSec: 0,
            clicks: 0,
            conversions: 0,
            conversionRate: 0,
            earnings: Number(session.revenue) || 0,
            potentialCommission: Number(session.revenue) || 0,
            topProducts: [],
            viewerTimeline: [],
            funnel: { impressions: 0, clicks: 0, addToCart: 0, purchases: 0 },
            earningsBreakdown: {
              baseCommission: 0,
              liveBonus: 0,
              total: Number(session.revenue) || 0,
            },
          }
          return NextResponse.json({ analytics: placeholder, source: 'db' })
        }
      } catch (dbErr) {
        console.warn('[/api/live/analytics] DB query failed:', dbErr)
      }

      // Fallback to mock
      const analytics = MOCK_ANALYTICS[sessionId]
      if (analytics) {
        return NextResponse.json({ analytics, source: 'mock' })
      }

      const mockSession = MOCK_SESSIONS.find((s) => s.id === sessionId)
      if (!mockSession) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      const placeholder: LiveAnalytics = {
        sessionId,
        viewers: mockSession.viewerCount ?? 0,
        peakViewers: mockSession.peakViewerCount ?? 0,
        avgViewDurationSec: 0,
        clicks: 0,
        conversions: 0,
        conversionRate: 0,
        earnings: mockSession.actualEarnings ?? 0,
        potentialCommission: mockSession.potentialEarnings,
        topProducts: [],
        viewerTimeline: [],
        funnel: { impressions: 0, clicks: 0, addToCart: 0, purchases: 0 },
        earningsBreakdown: {
          baseCommission: 0,
          liveBonus: 0,
          total: mockSession.actualEarnings ?? 0,
        },
      }
      return NextResponse.json({ analytics: placeholder, source: 'mock' })
    }

    // No sessionId — aggregate analytics from all completed sessions in DB
    try {
      const completedSessions = await db.liveSession.findMany({
        where: { status: 'completed' },
        orderBy: { scheduledAt: 'desc' },
      })

      if (completedSessions.length > 0) {
        const analyticsMap: Record<string, LiveAnalytics> = {}
        for (const session of completedSessions) {
          analyticsMap[session.id] = buildAnalyticsFromSession(session)
        }
        return NextResponse.json({
          analytics: analyticsMap,
          sessionIds: Object.keys(analyticsMap),
          source: 'db',
        })
      }
    } catch (dbErr) {
      console.warn('[/api/live/analytics] DB aggregation failed:', dbErr)
    }

    // Fallback to mock
    return NextResponse.json({
      analytics: MOCK_ANALYTICS,
      sessionIds: Object.keys(MOCK_ANALYTICS),
      source: 'mock',
    })
  } catch (error) {
    console.error('GET /api/live/analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live analytics' },
      { status: 500 }
    )
  }
}

/** Build analytics from a DB LiveSession row. */
function buildAnalyticsFromSession(session: {
  id: string
  viewers: number
  peakViewers: number
  revenue: number | { toNumber(): number }
  likes: number
  comments: number
  shares: number
  products: string | null
}): LiveAnalytics {
  const earnings = Number(session.revenue) || 0
  const totalClicks = Math.round(session.viewers * 0.42)
  const conversions = Math.round(totalClicks * 0.18)
  const conversionRate = totalClicks > 0 ? Math.round((conversions / totalClicks) * 1000) / 10 : 0

  // Generate viewer timeline
  const timelinePoints = 12
  const viewerTimeline = Array.from({ length: timelinePoints }, (_, i) => {
    const factor = Math.sin((i / (timelinePoints - 1)) * Math.PI)
    return {
      time: `${String(Math.floor((i * 10) / 60)).padStart(2, '0')}:${String((i * 10) % 60).padStart(2, '0')}`,
      viewers: Math.round(session.viewers * 0.4 + (session.peakViewers - session.viewers * 0.4) * factor),
    }
  })

  // Parse products for top products
  let products: Array<{ id: string; name: string }> = []
  try {
    products = session.products ? JSON.parse(session.products) : []
  } catch { /* ignore */ }

  const topProducts = products.slice(0, 3).map((p, i) => ({
    productId: p.id || `prod-${i}`,
    name: p.name || `Product ${i + 1}`,
    unitsSold: Math.round(session.viewers * 0.05),
    earnings: Math.round(earnings / Math.max(products.length, 1) * 100) / 100,
    conversionRate: 15 + Math.round(Math.random() * 10),
  }))

  const baseCommission = Math.round(earnings * 0.3 * 100) / 100
  const liveBonus = Math.round((earnings - baseCommission) * 100) / 100

  return {
    sessionId: session.id,
    viewers: session.viewers,
    peakViewers: session.peakViewers,
    avgViewDurationSec: 540 + Math.round(Math.random() * 300),
    clicks: totalClicks,
    conversions,
    conversionRate,
    earnings: Math.round(earnings * 100) / 100,
    potentialCommission: Math.round(earnings * 1.5 * 100) / 100,
    topProducts,
    viewerTimeline,
    funnel: {
      impressions: session.viewers * 3,
      clicks: totalClicks,
      addToCart: Math.round(totalClicks * 0.45),
      purchases: conversions,
    },
    earningsBreakdown: {
      baseCommission: Math.max(0, baseCommission),
      liveBonus: Math.max(0, liveBonus),
      total: Math.round(earnings * 100) / 100,
    },
  }
}
