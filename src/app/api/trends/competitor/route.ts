import { NextRequest, NextResponse } from 'next/server'
import ZAI, { type SearchFunctionResultItem } from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

interface CompetitorProfile {
  id: string
  name: string
  niche: string
  platforms: string[]
  estimatedFollowers: string
  contentStrategy: string
  strengths: string[]
  tipsForYou: string
}

interface CompetitorTip {
  id: string
  category: string
  tip: string
  source: string
}

// ─── GET /api/trends/competitor ────────────────────────────────────────────────
// Queries CompetitorWatch from DB, enriches with AI analysis.

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    let competitors: CompetitorProfile[] = []
    let tips: CompetitorTip[] = []
    let source = 'db'

    // 1. Query CompetitorWatch from DB
    try {
      const watched = await db.competitorWatch.findMany({
        where: userId ? { userId } : {},
        orderBy: { updatedAt: 'desc' },
        take: 20,
      })

      if (watched.length > 0) {
        competitors = watched.map((w, idx) => ({
          id: w.id,
          name: w.shopName,
          niche: w.topProduct || 'General',
          platforms: [w.platform === 'shopee' ? 'Shopee' : w.platform === 'tiktok' ? 'TikTok' : 'Instagram'],
          estimatedFollowers: w.followerCount ? `${Math.round(w.followerCount / 1000)}K+` : 'N/A',
          contentStrategy: `Competitor on ${w.platform}. Top product: ${w.topProduct || 'Unknown'}. Average price: RM${w.avgPrice ? Number(w.avgPrice).toFixed(0) : 'N/A'}.`,
          strengths: ['Active on platform', 'Established presence'],
          tipsForYou: `Study their ${w.topProduct || 'product'} strategy on ${w.platform}. Price range RM${w.avgPrice ? Number(w.avgPrice).toFixed(0) : 'N/A'}.`,
        }))
        source = 'db'
      }
    } catch (dbErr) {
      console.warn('[/api/trends/competitor] DB query failed:', dbErr)
    }

    // 2. If DB empty, use AI + web search to generate competitor analysis
    if (competitors.length === 0) {
      try {
        const zai = await ZAI.create()

        const [search1, search2] = await Promise.allSettled([
          zai.functions.invoke('web_search', {
            query: 'top shopee affiliate malaysia 2025 successful creator',
            num: 10,
          }),
          zai.functions.invoke('web_search', {
            query: 'shopee affiliate tips strategies malaysia influencer',
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
                content: `You are a Shopee affiliate marketing analyst. Analyze competitor data and return a JSON object with two fields:

1. "competitors": Array of 6 competitor profiles. Each must have:
- id: string (format "comp-N")
- name: string (creative Malaysian affiliate name)
- niche: string (their specialty area)
- platforms: string[] (social platforms they use)
- estimatedFollowers: string (e.g. "320K+")
- contentStrategy: string (2-3 sentences describing their approach)
- strengths: string[] (3-4 key strengths)
- tipsForYou: string (1-2 sentence actionable tip)

2. "tips": Array of 8 strategy tips. Each must have:
- id: string (format "tip-N")
- category: string (one of: Content, Conversion, Seasonal, Platform, Trust, Format, Timing, Community)
- tip: string (actionable advice)
- source: string (where this insight comes from)

Focus on Malaysian market context. Return ONLY the JSON object, no markdown.`,
              },
              {
                role: 'user',
                content: `Based on these search results about top Shopee affiliates and strategies in Malaysia, analyze the competitive landscape:\n\n${searchContext}`,
              },
            ],
            thinking: { type: 'disabled' },
          })

          const content = completion.choices?.[0]?.message?.content || ''
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            competitors = parsed.competitors || []
            tips = parsed.tips || []
            source = 'ai_analysis'
          }
        }
      } catch (aiError) {
        console.error('AI competitor analysis error:', aiError)
      }
    }

    // 3. If still empty, use AI to generate competitor profiles (without web search)
    if (competitors.length === 0) {
      try {
        const zai = await ZAI.create()
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a Shopee Malaysia affiliate marketing expert. Generate 6 realistic competitor profiles for a Malaysian Shopee affiliate. Return a JSON object with "competitors" and "tips" arrays as described above. Focus on Malaysian market. Return ONLY JSON.`,
            },
            {
              role: 'user',
              content: 'Generate competitor analysis for Malaysian Shopee affiliates.',
            },
          ],
          thinking: { type: 'disabled' },
        })

        const content = completion.choices?.[0]?.message?.content || ''
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          competitors = parsed.competitors || []
          tips = parsed.tips || []
          source = 'ai'
        }
      } catch (aiErr) {
        console.warn('[/api/trends/competitor] AI fallback failed:', aiErr)
      }
    }

    // 4. Save AI-generated competitors to DB
    if (competitors.length > 0 && (source === 'ai_analysis' || source === 'ai')) {
      try {
        for (const comp of competitors.slice(0, 10)) {
          await db.competitorWatch.upsert({
            where: { id: comp.id },
            create: {
              id: comp.id,
              userId: userId || undefined,
              shopName: comp.name,
              platform: 'shopee',
              topProduct: comp.niche,
              followerCount: parseInt(comp.estimatedFollowers) * 1000 || null,
            },
            update: {
              shopName: comp.name,
              topProduct: comp.niche,
              lastChecked: new Date(),
            },
          })
        }
      } catch (dbErr) {
        console.warn('[/api/trends/competitor] Failed to save to DB:', dbErr)
      }
    }

    // 5. Final fallback — minimal algorithmic data
    if (competitors.length === 0) {
      competitors = [
        {
          id: 'comp-1',
          name: 'KakakTech',
          niche: 'Tech & Gadgets Reviews',
          platforms: ['TikTok', 'Instagram'],
          estimatedFollowers: '450K+',
          contentStrategy: 'Unboxing and honest review format with trending audio.',
          strengths: ['Authentic reviews', 'Consistent posting'],
          tipsForYou: 'Focus on authenticity — Malaysian audiences value honest opinions.',
        },
      ]
      source = 'algorithm'
    }

    return NextResponse.json({
      competitors,
      tips,
      source,
      fromCache: source === 'db',
    })
  } catch (error) {
    console.error('Competitor analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze competitors' },
      { status: 500 }
    )
  }
}
