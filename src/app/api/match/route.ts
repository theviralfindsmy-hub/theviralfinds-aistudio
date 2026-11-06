import { NextRequest, NextResponse } from 'next/server'
import {
  autoPickBest,
  searchAcrossPlatforms,
} from '@/lib/matcher/service'
import type {
  AutoPickRequest,
  AutoPickResponse,
  MatchSearchResponse,
} from '@/lib/matcher/types'

/**
 * GET /api/match?q=<keyword>&limit=<n>
 *
 * Searches all 3 affiliate platforms (Shopee, TikTok, Lazada) for the
 * given keyword and returns clustered match groups with per-platform
 * listings, prices and commissions.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || searchParams.get('query') || '').trim()
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10) || 20), 50) : 20

    if (!q) {
      return NextResponse.json(
        {
          error: 'Search query parameter "q" is required.',
          source: 'mock' as const,
        },
        { status: 400 }
      )
    }

    const result = await searchAcrossPlatforms(q, { limit })

    const body: MatchSearchResponse = {
      query: result.query,
      results: result.results,
      total: result.results.length,
      platformsSearched: result.platformsSearched,
      bestCommissionAmount: result.bestCommissionAmount,
      source: 'mock',
    }

    return NextResponse.json(body)
  } catch (error) {
    console.error('[GET /api/match] error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to search across platforms.',
        source: 'mock' as const,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/match/auto-pick
 * Body: { productId: string, productName?: string }
 *
 * Picks the best-paying platform for the given match id, generates an
 * affiliate link via that platform's mock service, and returns the
 * result for the UI to display + toast.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: AutoPickRequest
    try {
      body = (await request.json()) as AutoPickRequest
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON body. Expected { productId: string, productName?: string }.',
          source: 'mock' as const,
        },
        { status: 400 }
      )
    }

    if (!body || !body.productId || typeof body.productId !== 'string') {
      return NextResponse.json(
        {
          error: 'Field "productId" is required (string).',
          source: 'mock' as const,
        },
        { status: 400 }
      )
    }

    const result = await autoPickBest(body.productId, body.productName)

    const response: AutoPickResponse = {
      result,
      source: 'mock',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[POST /api/match/auto-pick] error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to auto-pick best platform.',
        source: 'mock' as const,
      },
      { status: 500 }
    )
  }
}
