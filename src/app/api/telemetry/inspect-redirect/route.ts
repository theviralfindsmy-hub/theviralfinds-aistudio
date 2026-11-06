/**
 * POST /api/telemetry/inspect-redirect
 * 
 * Inspects an affiliate link redirect chain, audits tracking parameters,
 * identifies commission leakage risks, and returns a signed LinkForensicEvidence record.
 */

import { NextResponse } from 'next/server'
import { resolveRedirectChain } from '@/lib/telemetry/link-forensics'

export async function POST(request: Request) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload in request body' },
        { status: 400 }
      )
    }

    const { url, expectedSubId, maxHops, timeoutMs } = body || {}

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid "url" parameter in request body' },
        { status: 400 }
      )
    }

    const evidence = await resolveRedirectChain(url.trim(), {
      expectedSubId: typeof expectedSubId === 'string' ? expectedSubId.trim() : undefined,
      maxHops: typeof maxHops === 'number' && maxHops > 0 ? maxHops : undefined,
      timeoutMs: typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : undefined,
    })

    return NextResponse.json(evidence, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to inspect affiliate redirect chain' },
      { status: 500 }
    )
  }
}
