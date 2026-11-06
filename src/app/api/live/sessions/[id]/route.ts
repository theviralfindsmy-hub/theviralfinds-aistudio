import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { LiveSession, UpdateLiveSessionInput } from '@/lib/live/types'
import { MOCK_SESSIONS } from '@/lib/live/mock-data'

// ─── GET /api/live/sessions/[id] — full session detail from DB ────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try DB first
    try {
      const session = await db.liveSession.findUnique({
        where: { id },
      })

      if (session) {
        const products = session.products ? JSON.parse(session.products) : []
        const script = session.script ? JSON.parse(session.script) : null

        const liveSession: LiveSession = {
          id: session.id,
          title: session.title,
          description: session.notes || '',
          scheduledAt: session.scheduledAt.toISOString(),
          durationMin: 60,
          status: session.status as LiveSession['status'],
          hostName: 'Host',
          products,
          tags: [],
          averageCommission: 0,
          potentialEarnings: Number(session.revenue) || 0,
          actualEarnings: Number(session.revenue) || 0,
          viewerCount: session.viewers,
          peakViewerCount: session.peakViewers,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          startedAt: session.startedAt?.toISOString(),
          endedAt: session.endedAt?.toISOString(),
          scripts: script ? [script] : [],
        }

        return NextResponse.json({ session: liveSession, source: 'db' })
      }
    } catch (dbErr) {
      console.warn('[/api/live/sessions/[id]] DB query failed:', dbErr)
    }

    // Fallback to mock data
    const mockSession = MOCK_SESSIONS.find((s) => s.id === id)
    if (!mockSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ session: mockSession, source: 'mock' })
  } catch (error) {
    console.error('GET /api/live/sessions/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/live/sessions/[id] — update a session in DB ──────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as Partial<UpdateLiveSessionInput>

    try {
      const updateData: Record<string, unknown> = {}

      if (body.title) updateData.title = body.title
      if (body.description) updateData.notes = body.description
      if (body.scheduledAt) updateData.scheduledAt = new Date(body.scheduledAt)
      if (body.status) updateData.status = body.status
      if (body.tags) updateData.notes = body.tags.join(', ')

      // If status changed to 'live', stamp startedAt
      if (body.status === 'live') {
        updateData.startedAt = new Date()
      }
      // If status changed to 'completed', stamp endedAt
      if (body.status === 'completed') {
        updateData.endedAt = new Date()
      }

      const updated = await db.liveSession.update({
        where: { id },
        data: updateData,
      })

      const products = updated.products ? JSON.parse(updated.products) : []
      const liveSession: LiveSession = {
        id: updated.id,
        title: updated.title,
        description: updated.notes || '',
        scheduledAt: updated.scheduledAt.toISOString(),
        durationMin: 60,
        status: updated.status as LiveSession['status'],
        hostName: 'Host',
        products,
        tags: [],
        averageCommission: 0,
        potentialEarnings: Number(updated.revenue) || 0,
        actualEarnings: Number(updated.revenue) || 0,
        viewerCount: updated.viewers,
        peakViewerCount: updated.peakViewers,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        startedAt: updated.startedAt?.toISOString(),
        endedAt: updated.endedAt?.toISOString(),
        scripts: [],
      }

      return NextResponse.json({ session: liveSession, source: 'db' })
    } catch (dbErr) {
      console.warn('[/api/live/sessions/[id]] DB update failed:', dbErr)
      return NextResponse.json(
        { error: 'Session not found or update failed' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('PATCH /api/live/sessions/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

// ─── DELETE /api/live/sessions/[id] — cancel a session in DB ──────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    try {
      const updated = await db.liveSession.update({
        where: { id },
        data: {
          status: 'cancelled',
          endedAt: new Date(),
        },
      })

      return NextResponse.json({ ok: true, sessionId: updated.id, source: 'db' })
    } catch (dbErr) {
      console.warn('[/api/live/sessions/[id]] DB delete failed:', dbErr)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('DELETE /api/live/sessions/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel session' },
      { status: 500 }
    )
  }
}
