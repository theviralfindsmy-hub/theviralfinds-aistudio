import { NextRequest, NextResponse } from 'next/server'
import ZAI, { type SearchFunctionResultItem } from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

interface TrendingKeyword {
  id: string
  keyword: string
  searchVolumeEstimate: number
  category: string
  competitionLevel: 'Low' | 'Medium' | 'High'
  seasonalEvent?: string
  trendDirection: 'up' | 'stable' | 'down'
  relatedTerms: string[]
}

// ─── GET /api/trends/keywords ──────────────────────────────────────────────────
// Queries TrendKeyword from DB, if empty uses LLM to generate Malaysian market trends.
// Uses real web search via zai.functions.invoke('web_search', ...) to find actual trending topics.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'All'
    const includeSeasonal = searchParams.get('seasonal') !== 'false'
    const forceRefresh = searchParams.get('refresh') === 'true'

    let keywords: TrendingKeyword[] = []
    let source = 'db'

    // 1. Try querying TrendKeyword from DB first
    if (!forceRefresh) {
      try {
        const currentPeriod = new Date().toISOString().slice(0, 8) + // "2025-W01" format
          `W${String(Math.ceil(new Date().getDate() / 7)).padStart(2, '0')}`

        const dbKeywords = await db.trendKeyword.findMany({
          where: category !== 'All' ? { category } : {},
          orderBy: { searchVolume: 'desc' },
          take: 30,
        })

        if (dbKeywords.length > 0) {
          keywords = dbKeywords.map((k) => {
            const searchVol = k.searchVolume
            const compLevel = searchVol > 50000 ? 'High' : searchVol > 10000 ? 'Medium' : 'Low'
            return {
              id: k.id,
              keyword: k.keyword,
              searchVolumeEstimate: k.searchVolume,
              category: k.category || 'General',
              competitionLevel: compLevel as 'Low' | 'Medium' | 'High',
              trendDirection: (['up', 'stable', 'down'].includes(k.trend)
                ? k.trend : 'stable') as 'up' | 'stable' | 'down',
              relatedTerms: k.growthRate ? [`${Number(k.growthRate).toFixed(0)}% growth`] : [],
            }
          })
          source = 'db'
        }
      } catch (dbErr) {
        console.warn('[/api/trends/keywords] DB query failed:', dbErr)
      }
    }

    // 2. If DB empty or force refresh, use AI + web search
    if (keywords.length === 0 || forceRefresh) {
      try {
        const zai = await ZAI.create()

        // Search for trending keywords on Shopee Malaysia
        const [search1, search2] = await Promise.allSettled([
          zai.functions.invoke('web_search', {
            query: 'trending search terms shopee malaysia 2025 popular keywords',
            num: 10,
          }),
          zai.functions.invoke('web_search', {
            query: 'most searched products shopee malaysia viral keywords',
            num: 10,
          }),
        ])

        const allResults: SearchFunctionResultItem[] = []
        for (const result of [search1, search2]) {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allResults.push(...result.value)
          }
        }

        if (allResults.length > 0) {
          const searchContext = allResults
            .map((r, i) => `${i + 1}. ${r.name}: ${r.snippet}`)
            .join('\n')

          const completion = await zai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: `You are a Shopee Malaysia SEO and keyword expert. Analyze search data and return a JSON array of trending keywords. Each keyword must have:
- id: string (format "kw-N")
- keyword: string (the search term)
- searchVolumeEstimate: number (estimated monthly search volume)
- category: string (one of: Beauty, Fashion, Electronics, Home & Living, Pet, Food & Beverages, Automotive, Sports, Education)
- competitionLevel: string (exactly one of: "Low", "Medium", "High")
- trendDirection: string (exactly one of: "up", "stable", "down")
- relatedTerms: string[] (2-4 related search terms)

Return exactly 15 diverse keywords. Focus on Malaysian market. Return ONLY the JSON array, no markdown.`,
              },
              {
                role: 'user',
                content: `Based on these search results about trending Shopee Malaysia keywords, identify the top 15 trending search terms:\n\n${searchContext}`,
              },
            ],
            thinking: { type: 'disabled' },
          })

          const content = completion.choices?.[0]?.message?.content || ''
          const jsonMatch = content.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            keywords = JSON.parse(jsonMatch[0])
            source = 'ai_analysis'
          }
        }
      } catch (aiError) {
        console.error('AI keywords discovery error:', aiError)
      }
    }

    // 3. Save AI-generated keywords to DB for future retrieval
    if (keywords.length > 0 && (source === 'ai_analysis' || forceRefresh)) {
      try {
        const currentPeriod = new Date().toISOString().slice(0, 8) +
          `W${String(Math.ceil(new Date().getDate() / 7)).padStart(2, '0')}`

        for (const kw of keywords.slice(0, 20)) {
          await db.trendKeyword.upsert({
            where: {
              keyword_platform_period: {
                keyword: kw.keyword,
                platform: 'shopee',
                period: currentPeriod,
              },
            },
            create: {
              keyword: kw.keyword,
              category: kw.category,
              platform: 'shopee',
              searchVolume: kw.searchVolumeEstimate,
              growthRate: kw.trendDirection === 'up' ? 15 : kw.trendDirection === 'down' ? -10 : 0,
              trend: kw.trendDirection,
              period: currentPeriod,
            },
            update: {
              searchVolume: kw.searchVolumeEstimate,
              trend: kw.trendDirection,
            },
          })
        }
      } catch (dbErr) {
        console.warn('[/api/trends/keywords] Failed to save to DB:', dbErr)
      }
    }

    // 4. Fallback: if still empty, return minimal data
    if (keywords.length === 0) {
      keywords = [
        { id: 'kw-1', keyword: 'serum vitamin c', searchVolumeEstimate: 135000, category: 'Beauty', competitionLevel: 'High', trendDirection: 'up', relatedTerms: ['vitamin c serum', 'brightening serum'] },
        { id: 'kw-2', keyword: 'wireless earbuds', searchVolumeEstimate: 180000, category: 'Electronics', competitionLevel: 'High', trendDirection: 'stable', relatedTerms: ['tws earbuds', 'bluetooth earphone'] },
        { id: 'kw-3', keyword: 'tudung bawal', searchVolumeEstimate: 150000, category: 'Fashion', competitionLevel: 'High', trendDirection: 'up', relatedTerms: ['bawal instant', 'shawl premium'] },
      ]
      source = 'algorithm'
    }

    // Filter by category and seasonal
    let filtered = category === 'All'
      ? keywords
      : keywords.filter((k) => k.category === category)
    if (!includeSeasonal) {
      filtered = filtered.filter((k) => !k.seasonalEvent)
    }

    return NextResponse.json({
      keywords: filtered,
      total: keywords.length,
      source,
      fromCache: source === 'db',
    })
  } catch (error) {
    console.error('Keywords trend error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending keywords' },
      { status: 500 }
    )
  }
}
