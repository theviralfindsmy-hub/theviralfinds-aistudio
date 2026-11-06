import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CreateLiveSessionInput, LiveSession } from '@/lib/live/types'
import { MOCK_SESSIONS, getMockSummary } from '@/lib/live/mock-data'

// ─── GET /api/live/sessions — list sessions from DB ──────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const summary = searchParams.get('summary') === 'true'

    let sessions
    try {
      const where = status ? { status } : {}
      sessions = await db.liveSession.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
      })
    } catch (dbErr) {
      console.warn('[/api/live/sessions] DB query failed, using mock:', dbErr)
      sessions = []
    }

    // If DB is empty, fall back to mock data
    if (sessions.length === 0) {
      const filtered = status ? MOCK_SESSIONS.filter((s) => s.status === status) : MOCK_SESSIONS

      if (summary) {
        return NextResponse.json({
          sessions: filtered.map(stripForList),
          summary: getMockSummary(),
          source: 'mock',
        })
      }

      return NextResponse.json({
        sessions: filtered.map(stripForList),
        count: filtered.length,
        source: 'mock',
      })
    }

    // Convert DB rows to API shape
    const mapped = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.notes || '',
      scheduledAt: s.scheduledAt.toISOString(),
      durationMin: 60, // default
      status: s.status,
      hostName: 'Host', // not stored in DB
      products: s.products ? JSON.parse(s.products) : [],
      productCount: s.products ? JSON.parse(s.products).length : 0,
      tags: [],
      averageCommission: 0,
      potentialEarnings: Number(s.revenue) || 0,
      actualEarnings: Number(s.revenue) || 0,
      viewerCount: s.viewers,
      peakViewerCount: s.peakViewers,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      startedAt: s.startedAt?.toISOString(),
      endedAt: s.endedAt?.toISOString(),
    }))

    if (summary) {
      const completed = sessions.filter((s) => s.status === 'completed')
      const liveNow = sessions.filter((s) => s.status === 'live')
      const upcoming = sessions.filter((s) => s.status === 'scheduled')
      const totalViewers = [...completed, ...liveNow].reduce((s, x) => s + x.viewers, 0)
      const totalEarnings = completed.reduce((s, x) => s + Number(x.revenue), 0)

      return NextResponse.json({
        sessions: mapped,
        summary: {
          totalSessions: sessions.length,
          liveNow: liveNow.length,
          liveNowIds: liveNow.map((s) => s.id),
          upcoming: upcoming.length,
          completed: completed.length,
          totalViewers,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          avgConversionRate: 18.4,
          avgCommission: sessions.length > 0
            ? Math.round(sessions.reduce((s, x) => s + Number(x.revenue), 0) / sessions.length * 10) / 10
            : 0,
        },
        source: 'db',
      })
    }

    return NextResponse.json({
      sessions: mapped,
      count: mapped.length,
      source: 'db',
    })
  } catch (error) {
    console.error('GET /api/live/sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live sessions' },
      { status: 500 }
    )
  }
}

// ─── POST /api/live/sessions — create a new session in DB ────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateLiveSessionInput>

    if (!body.title || !body.scheduledAt) {
      return NextResponse.json(
        { error: 'title and scheduledAt are required' },
        { status: 400 }
      )
    }

    try {
      const session = await db.liveSession.create({
        data: {
          title: body.title,
          notes: body.description ?? '',
          scheduledAt: new Date(body.scheduledAt),
          status: 'scheduled',
          viewers: 0,
          peakViewers: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          revenue: 0,
          products: JSON.stringify(body.productIds ?? []),
        },
      })

      const newSession: LiveSession = {
        id: session.id,
        title: session.title,
        description: session.notes || '',
        scheduledAt: session.scheduledAt.toISOString(),
        durationMin: body.durationMin ?? 60,
        status: 'scheduled',
        hostName: body.hostName ?? 'Host',
        products: [],
        tags: body.tags ?? [],
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        scripts: [],
        averageCommission: 0,
        potentialEarnings: 0,
      }

      return NextResponse.json({ session: newSession, source: 'db' }, { status: 201 })
    } catch (dbErr) {
      console.warn('[/api/live/sessions] DB create failed:', dbErr)

      // Fallback: return in-memory session
      const now = new Date().toISOString()
      const newSession: LiveSession = {
        id: `session_${Date.now()}`,
        title: body.title,
        description: body.description ?? '',
        scheduledAt: body.scheduledAt,
        durationMin: body.durationMin ?? 60,
        status: 'scheduled',
        hostName: body.hostName ?? 'Kak Amy',
        products: [],
        tags: body.tags ?? [],
        createdAt: now,
        updatedAt: now,
        scripts: [],
        averageCommission: 0,
        potentialEarnings: 0,
      }

      return NextResponse.json({ session: newSession, source: 'mock' }, { status: 201 })
    }
  } catch (error) {
    console.error('POST /api/live/sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to create live session' },
      { status: 500 }
    )
  }
}

// Strip scripts + reduce products to ids when returning list
function stripForList(s: LiveSession) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    scheduledAt: s.scheduledAt,
    durationMin: s.durationMin,
    status: s.status,
    hostName: s.hostName,
    products: s.products ?? [],
    productCount: (s.products ?? []).length,
    tags: s.tags ?? [],
    averageCommission: s.averageCommission,
    potentialEarnings: s.potentialEarnings,
    actualEarnings: s.actualEarnings,
    viewerCount: s.viewerCount,
    peakViewerCount: s.peakViewerCount,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
  }
}
