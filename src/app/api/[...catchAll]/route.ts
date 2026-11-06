import { NextResponse } from 'next/server'

/**
 * Catch-all 404 handler for unknown /api/* routes.
 * Returns a structured JSON 404 instead of Next.js's default HTML 404 page —
 * important because client-side fetch expects JSON and would otherwise throw
 * a SyntaxError when parsing HTML.
 *
 * This file is invoked when no other route.ts matches the requested path.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'API endpoint not found' },
    { status: 404 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'API endpoint not found' },
    { status: 404 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'API endpoint not found' },
    { status: 404 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'API endpoint not found' },
    { status: 404 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'API endpoint not found' },
    { status: 404 }
  )
}
