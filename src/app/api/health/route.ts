import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/health
 * Lightweight health check. Returns 200 if the server and database are both
 * reachable. Used by the offline banner's "Retry" button.
 *
 * No rate limiting — this is intentionally cheap and called frequently.
 */
export async function GET() {
  const started = Date.now()
  try {
    // Run a trivial DB query (SELECT 1) to confirm connectivity.
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[health] DB unreachable:', error)
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'disconnected',
        error: 'Database unreachable',
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
