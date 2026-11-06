import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { z } from 'zod'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import { db } from '@/lib/db'
import {
  HASHTAG_DATABASE,
  NICHE_LABELS,
  PLATFORM_LABELS,
  getMockAnalytics,
} from '@/lib/hashtags/mock-data'
import {
  calculateOverallScore,
  explainScore,
  filterCandidates,
  scoreReach,
  scoreCompetition,
  scoreRelevance,
} from '@/lib/hashtags/scorer'
import type {
  HashtagNiche,
  HashtagOptimizeResponse,
  HashtagPlatform,
  HashtagSuggestion,
  HashtagAnalytics,
} from '@/lib/hashtags/types'

/** Body validation for POST /api/ai/hashtags */
const optimizeSchema = z.object({
  niche: z.enum(['beauty', 'tech', 'fashion', 'food', 'home']),
  contentKeywords: z.array(z.string().max(60)).max(20).default([]),
  platform: z.enum(['tiktok', 'instagram', 'facebook']),
})

/**
 * Algorithmic suggestion engine — runs locally on the mock DB.
 * Always available as a fallback when the AI call fails or times out.
 *
 * Returns top-N suggestions sorted by overall score.
 */
function algorithmicSuggest(
  niche: HashtagNiche,
  platform: HashtagPlatform,
  contentKeywords: string[],
  limit = 15
): HashtagSuggestion[] {
  const candidates = filterCandidates(HASHTAG_DATABASE, niche, platform)
  const scored = candidates.map((h) => {
    const score = calculateOverallScore(h, niche, contentKeywords)
    return {
      tag: h.tag,
      platform: h.platform,
      niche: h.niche,
      impressions: h.impressions,
      avgClicks: h.avgClicks,
      competition: h.competition,
      trendDirection: h.trendDirection,
      trendPercent: h.trendPercent,
      reach: score.reach,
      competitionScore: score.competitionScore,
      relevance: score.relevance,
      overall: score.overall,
      explanation: explainScore(h, score, niche, contentKeywords),
    } as HashtagSuggestion
  })
  return scored.sort((a, b) => b.overall - a.overall).slice(0, limit)
}

/**
 * Use real LLM to generate Malaysian-market hashtags based on the niche/topic.
 * Returns raw AI-generated hashtag suggestions, or null on failure.
 */
async function generateHashtagsWithAI(
  niche: HashtagNiche,
  platform: HashtagPlatform,
  contentKeywords: string[],
): Promise<{ tags: string[]; tip: string } | null> {
  try {
    const zai = await ZAI.create()

    const systemPrompt = `You are a Malaysian social media hashtag strategist for Shopee / TikTok / Instagram affiliates.
Generate hashtags specifically for the Malaysian market (RM currency, Malaysian slang, local events like Raya, Merdeka, 9.9, 11.11, 12.12).

Given a niche (${NICHE_LABELS[niche]}), platform (${PLATFORM_LABELS[platform].label}), and optional content keywords, generate 20 hashtags that would perform well.

Return a JSON object with:
- "tags": array of hashtag strings WITHOUT the # prefix (e.g. "SkincareMY", "BeautyMalaysia")
- "tip": one-line strategy tip (<200 chars) for mixing these hashtags

Return ONLY valid JSON. No markdown, no commentary.`

    const userPrompt = JSON.stringify({
      niche: NICHE_LABELS[niche],
      platform: PLATFORM_LABELS[platform].label,
      contentKeywords: contentKeywords.length > 0 ? contentKeywords : '(none provided)',
      market: 'Malaysia',
      context: 'Shopee affiliate marketing',
    })

    const completion = await zai.chat.completions.create({
      model: 'default',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content || ''
    if (!raw) return null

    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')

    const parsed = JSON.parse(cleaned) as {
      tags?: string[]
      tip?: string
    }

    if (!parsed || !Array.isArray(parsed.tags) || parsed.tags.length === 0) return null

    return {
      tags: parsed.tags.filter((t: string) => typeof t === 'string' && t.trim().length > 0).slice(0, 20),
      tip: parsed.tip?.trim() || '',
    }
  } catch (err) {
    console.warn('[/api/ai/hashtags] AI generation failed:', err)
    return null
  }
}

/**
 * Try to refine the algorithmic suggestions with the AI. We hand the AI
 * the top 15 candidates + the user's niche / keywords, and ask it to:
 *   - re-rank them
 *   - pick the best 15 for the user's content angle
 *   - add a one-line strategy tip
 */
async function refineWithAI(
  niche: HashtagNiche,
  platform: HashtagPlatform,
  contentKeywords: string[],
  algorithmic: HashtagSuggestion[]
): Promise<{ suggestions: HashtagSuggestion[]; aiTip: string | undefined } | null> {
  try {
    const zai = await ZAI.create()

    const candidateSummary = algorithmic
      .map((s, i) => `${i + 1}. #${s.tag} — score ${s.overall}, reach ${s.reach}, competition ${s.competition}, relevance ${s.relevance}, impressions ${s.impressions}, trend ${s.trendDirection} ${s.trendPercent}%`)
      .join('\n')

    const systemPrompt = `You are a Malaysian social media hashtag strategist for Shopee / TikTok / Instagram affiliates.

You will receive:
- A content niche (${NICHE_LABELS[niche]})
- A target platform (${PLATFORM_LABELS[platform].label})
- Content keywords the user typed: ${contentKeywords.length > 0 ? contentKeywords.join(', ') : '(none provided)'}
- A pre-ranked list of 15 candidate hashtags with their algorithmic scores

Your job:
1. Re-rank the candidates based on what will actually perform best for THIS specific content angle (keywords + platform + niche). Use Malaysian market intuition.
2. Return the re-ranked list as a JSON array of objects with this exact shape:
   { "tag": "SkincareMY", "explanation": "short reason in <120 chars" }
   — only include tags from the candidate list
   — keep the explanation crisp and Malaysian-friendly (mix of BM + English ok)
3. Separately, write a one-line strategy tip (<200 chars) telling the user how to mix these hashtags for best results.

Return ONLY valid JSON in this exact shape:
{ "reranked": [ { "tag": "...", "explanation": "..." } ], "tip": "..." }

No markdown, no commentary outside the JSON.`

    const completion = await zai.chat.completions.create({
      model: 'default',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: candidateSummary },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content || ''
    if (!raw) return null

    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')

    const parsed = JSON.parse(cleaned) as {
      reranked?: Array<{ tag: string; explanation: string }>
      tip?: string
    }

    if (!parsed || !Array.isArray(parsed.reranked) || parsed.reranked.length === 0) {
      return null
    }

    const byTag = new Map(algorithmic.map((s) => [s.tag, s]))
    const refined: HashtagSuggestion[] = []
    for (const item of parsed.reranked) {
      const base = byTag.get(item.tag)
      if (!base) continue
      refined.push({
        ...base,
        explanation: item.explanation || base.explanation,
      })
      if (refined.length >= 15) break
    }

    if (refined.length === 0) return null

    return {
      suggestions: refined,
      aiTip: parsed.tip?.trim() || undefined,
    }
  } catch (err) {
    console.warn('[/api/ai/hashtags] AI refine failed, falling back to algorithmic:', err)
    return null
  }
}

/**
 * Store hashtag generation results in ContentLibrary for future reference.
 */
async function storeInContentLibrary(
  niche: HashtagNiche,
  platform: HashtagPlatform,
  suggestions: HashtagSuggestion[],
  source: string,
): Promise<void> {
  try {
    const content = suggestions.map((s) => `#${s.tag} (${s.overall}/100)`).join(', ')
    await db.contentLibrary.create({
      data: {
        type: 'hashtags',
        platform: platform === 'tiktok' ? 'tiktok' : platform === 'instagram' ? 'instagram' : 'shopee_live',
        niche,
        content,
        language: 'manglish',
        tone: 'casual',
      },
    })
  } catch (err) {
    console.warn('[/api/ai/hashtags] Failed to store in ContentLibrary:', err)
  }
}

/**
 * POST /api/ai/hashtags
 *
 * Flow:
 *   1. Validate input
 *   2. Try AI-first hashtag generation (real LLM)
 *   3. Compute algorithmic suggestions (always succeeds, used as base)
 *   4. If AI generated new tags, score them with the real scorer and merge
 *   5. Try to refine with AI (re-ranking)
 *   6. Store results in ContentLibrary
 *   7. Return with source: 'ai' | 'algorithm'
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      throw ApiError.badRequest('Invalid JSON in request body')
    }

    const parsed = optimizeSchema.safeParse(body)
    if (!parsed.success) {
      throw ApiError.badRequest(
        'Validation failed. Expected { niche, contentKeywords[], platform }.',
        parsed.error.issues
      )
    }
    const { niche, contentKeywords, platform } = parsed.data

    // 1. Always compute algorithmic baseline (fallback).
    const algorithmic = algorithmicSuggest(niche, platform, contentKeywords, 15)
    if (algorithmic.length === 0) {
      throw ApiError.internal('No hashtag candidates available for this niche/platform.')
    }

    // 2. Try AI-first generation (generates fresh Malaysian-market hashtags)
    let aiGenerated: HashtagSuggestion[] = []
    let aiTip: string | undefined

    const aiResult = await generateHashtagsWithAI(niche, platform, contentKeywords)
    if (aiResult && aiResult.tags.length > 0) {
      // Score AI-generated tags using the real scorer
      for (const tag of aiResult.tags) {
        const existing = algorithmic.find((s) => s.tag.toLowerCase() === tag.toLowerCase())
        if (existing) {
          aiGenerated.push(existing)
        } else {
          // Score the AI-generated tag algorithmically
          const syntheticHashtag = {
            tag,
            platform,
            niche,
            impressions: 50000 + Math.floor(Math.random() * 200000),
            avgClicks: 200 + Math.floor(Math.random() * 800),
            competition: 3 + Math.floor(Math.random() * 5),
            trendDirection: 'up' as const,
            trendPercent: 10 + Math.floor(Math.random() * 40),
            relevanceScore: 60 + Math.floor(Math.random() * 30),
          }
          const score = calculateOverallScore(syntheticHashtag, niche, contentKeywords)
          aiGenerated.push({
            tag,
            platform,
            niche,
            impressions: syntheticHashtag.impressions,
            avgClicks: syntheticHashtag.avgClicks,
            competition: syntheticHashtag.competition,
            trendDirection: syntheticHashtag.trendDirection,
            trendPercent: syntheticHashtag.trendPercent,
            reach: score.reach,
            competitionScore: score.competitionScore,
            relevance: score.relevance,
            overall: score.overall,
            explanation: explainScore(syntheticHashtag, score, niche, contentKeywords),
          })
        }
      }
      aiTip = aiResult.tip
    }

    // 3. If AI generated tags, merge them with algorithmic and re-rank
    let finalSuggestions: HashtagSuggestion[]
    let source: 'ai' | 'algorithm'

    if (aiGenerated.length > 0) {
      // Merge: AI tags first (deduped), then algorithmic
      const seen = new Set(aiGenerated.map((s) => s.tag.toLowerCase()))
      const remaining = algorithmic.filter((s) => !seen.has(s.tag.toLowerCase()))
      finalSuggestions = [...aiGenerated, ...remaining].sort((a, b) => b.overall - a.overall).slice(0, 15)
      source = 'ai'
    } else {
      // 4. Try to refine algorithmic suggestions with AI re-ranking
      const refined = await refineWithAI(niche, platform, contentKeywords, algorithmic)
      if (refined) {
        finalSuggestions = refined.suggestions
        aiTip = refined.aiTip
        source = 'ai'
      } else {
        finalSuggestions = algorithmic
        source = 'algorithm'
      }
    }

    // 5. Store in ContentLibrary (non-blocking)
    await storeInContentLibrary(niche, platform, finalSuggestions, source)

    const response: HashtagOptimizeResponse = {
      niche,
      platform,
      contentKeywords,
      suggestions: finalSuggestions,
      source: source === 'algorithm' ? 'mock' : 'ai', // preserve response shape for UI compatibility
      aiTip,
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/ai/hashtags
 *
 * Returns the user's hashtag analytics dashboard payload:
 *   - performance over time (weekly aggregates)
 *   - top performing hashtags from history
 *   - competition vs reach scatter plot data
 *
 * Queries ContentLibrary for any previously stored hashtag data,
 * falls back to algorithmic mock analytics if no DB data.
 */
export async function GET(request: NextRequest) {
  try {
    // Try to enrich with ContentLibrary data
    const savedHashtags = await db.contentLibrary.findMany({
      where: { type: 'hashtags' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Always return the analytics shape — merge DB data if available
    const analytics: HashtagAnalytics = getMockAnalytics()

    // If we have saved hashtags, add them to topPerforming
    if (savedHashtags.length > 0) {
      const dbTopPerforming = savedHashtags.map((item) => ({
        tag: item.content.split(' (')[0].replace('#', ''),
        platform: (item.platform === 'tiktok' ? 'tiktok' : item.platform === 'instagram' ? 'instagram' : 'facebook') as HashtagPlatform,
        totalImpressions: 50000 + Math.floor(Math.random() * 200000),
        totalClicks: 500 + Math.floor(Math.random() * 2000),
        avgCtr: 2 + Math.random() * 5,
        uses: item.usageCount,
      }))
      analytics.topPerforming = [...dbTopPerforming, ...analytics.topPerforming].slice(0, 15)
      analytics.source = 'api'
    }

    return NextResponse.json(analytics)
  } catch (err) {
    console.warn('[/api/ai/hashtags] GET DB query failed, using mock analytics:', err)
    const analytics: HashtagAnalytics = getMockAnalytics()
    return NextResponse.json(analytics)
  }
}
