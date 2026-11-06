/**
 * AI Product Recommender — API Route
 *
 * GET /api/ai/recommend?audience=beauty_mama&limit=12&refresh=1
 *
 * Uses real DB data (user's existing links and conversion data) +
 * z-ai-web-dev-sdk to generate product recommendations with AI explanations.
 * Falls back to the algorithmic scorer from src/lib/recommender/algorithm.ts.
 */

import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

import {
  ALGORITHM_VERSION,
  calculateRecommendation,
  rankRecommendations,
} from '@/lib/recommender/algorithm'
import { getAudienceProfile } from '@/lib/recommender/mock-data'
import type {
  AudiencePersonaId,
  RecommendableProduct,
  Recommendation,
  RecommendationResponse,
  Platform,
} from '@/lib/recommender/types'

// ─── In-memory cache (5-minute TTL) ────────────────────────────────────────────

interface CacheEntry {
  recommendations: Recommendation[]
  audienceId: AudiencePersonaId
  generatedAt: string
  source: 'mock' | 'ai'
  aiEnhanced: boolean
}

const CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

// ─── Convert AffiliateLink from DB to RecommendableProduct ─────────────────────

function fromAffiliateLink(link: {
  id: string
  name: string
  productName: string | null
  productImage: string | null
  productPrice: number | null | { toNumber: () => number }
  commission: number | null | { toNumber: () => number }
  commissionRate: number | null | { toNumber: () => number }
  category: string | null
  clicks: number
  conversions: number
  earnings: number | { toNumber: () => number }
  shortCode: string
}): RecommendableProduct {
  const price = typeof link.productPrice === 'object' && link.productPrice?.toNumber
    ? link.productPrice.toNumber()
    : Number(link.productPrice) || 0
  const commissionRate = typeof link.commissionRate === 'object' && link.commissionRate?.toNumber
    ? link.commissionRate.toNumber()
    : Number(link.commissionRate) || 5
  const commission = typeof link.commission === 'object' && link.commission?.toNumber
    ? link.commission.toNumber()
    : Number(link.commission) || 0

  return {
    id: `shopee-${link.id}`,
    platform: 'shopee' as Platform,
    nativeId: link.id,
    name: link.productName || link.name,
    image: link.productImage || '',
    price,
    commissionRate,
    commissionAmount: commission > 0 ? commission : Math.round((price * commissionRate) / 100 * 100) / 100,
    sales: link.clicks, // use clicks as a proxy for sales/popularity
    rating: 4 + Math.random() * 0.9,
    shopName: 'Shopee Seller',
    category: link.category || 'General',
    productLink: `https://shopee.com.my/${link.shortCode}`,
  }
}

// ─── Fetch products from DB ────────────────────────────────────────────────────

async function fetchProductsFromDB(userId?: string): Promise<RecommendableProduct[]> {
  try {
    const links = await db.affiliateLink.findMany({
      where: userId ? { userId } : { status: 'active' },
      orderBy: { clicks: 'desc' },
      take: 60,
    })

    if (links.length > 0) {
      return links.map(fromAffiliateLink)
    }

    // No user links — get all active links
    const allLinks = await db.affiliateLink.findMany({
      where: { status: 'active' },
      orderBy: { clicks: 'desc' },
      take: 60,
    })

    return allLinks.map(fromAffiliateLink)
  } catch (err) {
    console.warn('[/api/ai/recommend] DB query failed:', err)
    return []
  }
}

// ─── AI explanation enhancer ───────────────────────────────────────────────────

interface AiExplanationPayload {
  productName: string
  platform: string
  audienceName: string
  audiencePct: number
  commissionPct: number
  commissionRm: number
  trendPct: number
  sales: number
  peakHours: string
}

async function enhanceExplanationsWithAI(
  payloads: AiExplanationPayload[],
): Promise<Map<string, string> | null> {
  if (payloads.length === 0) return null

  try {
    const zai = await ZAI.create()

    const systemPrompt = `You are an expert Shopee/TikTok/Lazada affiliate marketing strategist for the Malaysian market.
For each product I give you, write a single punchy sentence (max 25 words) explaining why it's a good pick for that audience.
Use Malaysian Manglish style (mix of English + Bahasa Melayu, e.g. "confirm untung", "best gila", "kena grab").
Reference the audience match %, the trend %, and the commission %. Always mention the commission XTRA % when commission >= 7%.
Output a JSON array of objects with {productName, summary}. No markdown, just JSON.`

    const userPrompt = JSON.stringify(
      payloads.map((p) => ({
        productName: p.productName,
        platform: p.platform,
        audienceName: p.audienceName,
        audienceMatchPct: p.audiencePct,
        commissionPct: p.commissionPct,
        commissionRm: p.commissionRm,
        trendPct: p.trendPct,
        sales: p.sales,
        peakHours: p.peakHours,
      })),
    )

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices?.[0]?.message?.content || ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      productName: string
      summary: string
    }>

    const map = new Map<string, string>()
    for (const item of parsed) {
      if (item.productName && item.summary) {
        map.set(item.productName, item.summary)
      }
    }
    return map
  } catch (err) {
    console.warn('[ai/recommend] AI enhancement unavailable, using algorithmic fallback explanations:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Main GET handler ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const audienceId = (searchParams.get('audience') || 'beauty_mama') as AudiencePersonaId
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 12, 1), 50) : 12
    const refresh = searchParams.get('refresh') === '1'
    const userId = request.headers.get('x-user-id') || undefined

    const audience = getAudienceProfile(audienceId)
    if (!audience) {
      return NextResponse.json(
        { error: `Unknown audience persona: ${audienceId}` },
        { status: 400 },
      )
    }

    // Cache check (unless ?refresh=1)
    const cacheKey = `${audienceId}:${limit}:${userId || 'global'}`
    if (!refresh) {
      const cached = CACHE.get(cacheKey)
      if (cached && Date.now() - new Date(cached.generatedAt).getTime() < CACHE_TTL_MS) {
        const response: RecommendationResponse = {
          audience,
          recommendations: cached.recommendations,
          source: cached.source,
          generatedAt: cached.generatedAt,
          algorithmVersion: ALGORITHM_VERSION,
          aiEnhanced: cached.aiEnhanced,
        }
        return NextResponse.json(response)
      }
    }

    // 1. Fetch products from DB
    let catalog = await fetchProductsFromDB(userId)

    // If no DB products, try to use the mock services as fallback
    if (catalog.length === 0) {
      try {
        const { ShopeeMockService } = await import('@/lib/shopee/mock-data')
        const shopeeMock = new ShopeeMockService()
        const shopeeRes = await shopeeMock.searchProducts('', { limit: 50, sortField: 'sales', sortOrder: 'desc' })
        catalog = shopeeRes.products.map((p) => ({
          id: `shopee-${p.itemId}`,
          platform: 'shopee' as Platform,
          nativeId: String(p.itemId),
          name: p.name,
          image: p.image,
          price: p.price,
          commissionRate: p.commissionRate,
          commissionAmount: Math.round((p.price * p.commissionRate) / 100 * 100) / 100,
          sales: p.sales,
          rating: p.ratingStar,
          shopName: p.shopName,
          category: p.category,
          productLink: p.productLink,
        }))
      } catch (mockErr) {
        console.warn('[/api/ai/recommend] Mock service fallback also failed:', mockErr)
      }
    }

    if (catalog.length === 0) {
      return NextResponse.json({
        audience,
        recommendations: [],
        source: 'ai',
        generatedAt: new Date().toISOString(),
        algorithmVersion: ALGORITHM_VERSION,
        aiEnhanced: false,
      })
    }

    // 2. Score every product with the weighted algorithm
    const scored = catalog.map((p, idx) => calculateRecommendation(p, audience, idx))

    // 3. Rank and pick top N
    const ranked = rankRecommendations(scored)
    const topN = ranked.slice(0, limit)

    // 4. Try to enhance the top-N explanations with AI
    const aiPayloads: AiExplanationPayload[] = topN.map((r) => ({
      productName: r.product.name,
      platform: r.product.platform,
      audienceName: audience.name,
      audiencePct: Math.round(r.score.audience),
      commissionPct: r.product.commissionRate,
      commissionRm: r.product.commissionAmount,
      trendPct: Math.round(
        (typeof r.product.trendScore === 'number' ? r.product.trendScore : r.score.trend) * 0.6,
      ),
      sales: r.product.sales,
      peakHours: audience.peakHours.length
        ? `${audience.peakHours[0]}:00-${audience.peakHours[audience.peakHours.length - 1]}:00`
        : 'anytime',
    }))

    const aiSummaries = await enhanceExplanationsWithAI(aiPayloads)
    let aiEnhanced = false

    if (aiSummaries && aiSummaries.size > 0) {
      for (const rec of topN) {
        const aiSummary = aiSummaries.get(rec.product.name)
        if (aiSummary) {
          rec.explanation = {
            ...rec.explanation,
            summary: aiSummary,
          }
          aiEnhanced = true
        }
      }
    }

    // 5. Cache the result
    const generatedAt = new Date().toISOString()
    const source: 'mock' | 'ai' = aiEnhanced ? 'ai' : 'mock'
    CACHE.set(cacheKey, {
      recommendations: topN,
      audienceId,
      generatedAt,
      source,
      aiEnhanced,
    })

    const response: RecommendationResponse = {
      audience,
      recommendations: topN,
      source,
      generatedAt,
      algorithmVersion: ALGORITHM_VERSION,
      aiEnhanced,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[ai/recommend] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
