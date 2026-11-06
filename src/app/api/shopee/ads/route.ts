import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/shopee/ads
 *
 * Compute ad-like metrics from existing click/conversion data in DB.
 *
 * Query params:
 *   type    - 'balance' | 'campaigns' | 'keywords' | 'performance' (default: 'balance')
 *   from    - Unix timestamp start (for campaigns/performance, default: 7 days ago)
 *   to      - Unix timestamp end (for campaigns/performance, default: now)
 *   item_id - Item ID for keyword recommendations (required when type=keywords)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') || 'balance'
    const now = Math.floor(Date.now() / 1000)
    const sevenDaysAgo = now - 7 * 86400
    const from = searchParams.get('from') ? parseInt(searchParams.get('from')!) : sevenDaysAgo
    const to = searchParams.get('to') ? parseInt(searchParams.get('to')!) : now
    const itemId = searchParams.get('item_id')

    // Validate type
    const validTypes = ['balance', 'campaigns', 'keywords', 'performance'] as const
    if (!validTypes.includes(type as (typeof validTypes)[number])) {
      return NextResponse.json(
        { error: `Invalid "type" parameter. Must be one of: ${validTypes.join(', ')}`, code: 400 },
        { status: 400 }
      )
    }

    // keywords requires item_id
    if (type === 'keywords' && !itemId) {
      return NextResponse.json(
        { error: '"item_id" is required when type is "keywords"', code: 400 },
        { status: 400 }
      )
    }

    // Validate time range for campaigns/performance
    if ((type === 'campaigns' || type === 'performance') && (isNaN(from) || isNaN(to))) {
      return NextResponse.json(
        { error: 'Invalid "from" or "to" timestamp parameter', code: 400 },
        { status: 400 }
      )
    }

    const linkFilter = userId ? { userId } : {}

    switch (type) {
      case 'balance': {
        // Compute "ad balance" from total earnings minus payouts
        const [totalEarnings, totalPayouts] = await Promise.all([
          db.conversion.aggregate({
            where: {
              status: { in: ['confirmed', 'paid'] },
              affiliateLink: linkFilter,
            },
            _sum: { commission: true },
          }),
          db.payout.aggregate({
            where: { status: 'completed', userId: userId || undefined },
            _sum: { amount: true },
          }),
        ])

        const balance = Number(totalEarnings._sum.commission || 0) - Number(totalPayouts._sum.amount || 0)
        const pendingBalance = await db.conversion.aggregate({
          where: {
            status: 'pending',
            affiliateLink: linkFilter,
          },
          _sum: { commission: true },
        })

        return NextResponse.json({
          success: true,
          data: {
            total_balance: Math.max(0, Math.round(balance * 100)),
            pending_balance: Math.round(Number(pendingBalance._sum.commission || 0) * 100),
            currency: 'MYR',
            last_updated: new Date().toISOString(),
          },
          meta: { type: 'balance', source: 'db' },
        })
      }

      case 'campaigns': {
        // Treat each affiliate link as an "ad campaign"
        const links = await db.affiliateLink.findMany({
          where: {
            ...linkFilter,
            createdAt: {
              gte: new Date(from * 1000),
              lte: new Date(to * 1000),
            },
          },
          include: {
            clickRecords: {
              where: {
                createdAt: {
                  gte: new Date(from * 1000),
                  lte: new Date(to * 1000),
                },
              },
              select: { id: true, converted: true },
            },
            conversionRecords: {
              where: {
                createdAt: {
                  gte: new Date(from * 1000),
                  lte: new Date(to * 1000),
                },
              },
              select: { commission: true, amount: true },
            },
          },
          orderBy: { clicks: 'desc' },
        })

        const campaigns = links.map((link) => {
          const clickCount = link.clickRecords.length
          const convertedClicks = link.clickRecords.filter((c) => c.converted).length
          const totalSpend = Number(link.earnings) * 0.1 // Estimate 10% as ad spend
          const revenue = link.conversionRecords.reduce((sum, c) => sum + Number(c.commission), 0)
          const roas = totalSpend > 0 ? revenue / totalSpend : 0

          return {
            campaign_id: link.id,
            campaign_name: link.productName || link.name,
            campaign_type: 'affiliate_link',
            status: link.status === 'active' ? 'RUNNING' : 'PAUSED',
            daily_budget: 5000,
            total_budget: 50000,
            total_spend: Math.round(totalSpend * 100),
            total_clicks: clickCount,
            total_impressions: clickCount * 15, // estimate impressions at 15x clicks
            total_conversions: link.conversionRecords.length,
            revenue: Math.round(revenue * 100),
            roas: parseFloat(roas.toFixed(2)),
            ctr: clickCount > 0 ? parseFloat(((clickCount / (clickCount * 15)) * 100).toFixed(2)) : 0,
            conversion_rate: clickCount > 0 ? parseFloat(((convertedClicks / clickCount) * 100).toFixed(2)) : 0,
            start_time: Math.floor(link.createdAt.getTime() / 1000),
            end_time: link.expiresAt ? Math.floor(link.expiresAt.getTime() / 1000) : null,
          }
        })

        return NextResponse.json({
          success: true,
          data: {
            campaigns,
            total_campaigns: campaigns.length,
            running: campaigns.filter((c) => c.status === 'RUNNING').length,
            paused: campaigns.filter((c) => c.status === 'PAUSED').length,
          },
          meta: { type: 'campaigns', from, to, source: 'db' },
        })
      }

      case 'keywords': {
        // Generate keyword recommendations from link tags/categories using DB + LLM
        const link = await db.affiliateLink.findFirst({
          where: {
            ...linkFilter,
            OR: [
              { productId: itemId || undefined },
              { id: itemId || undefined },
            ],
          },
        })

        // Base keywords from link data
        const baseKeywords: string[] = []
        if (link?.productName) baseKeywords.push(link.productName)
        if (link?.category) baseKeywords.push(link.category)
        if (link?.tags) {
          try {
            const tags = JSON.parse(link.tags)
            if (Array.isArray(tags)) baseKeywords.push(...tags)
          } catch { /* ignore */ }
        }

        // Try to use LLM for better keyword suggestions
        try {
          const ZAI = (await import('z-ai-web-dev-sdk')).default
          const zai = await ZAI.create()

          const chatResponse = await zai.chat.completions.create({
            model: 'default',
            messages: [
              {
                role: 'system',
                content: 'You are a Shopee Malaysia ads keyword expert. Given a product, suggest relevant search keywords with estimated bid prices in MYR. Return a JSON array of objects with: keyword, search_volume (number), suggested_bid (number in cents), competition (low/medium/high), relevance_score (0-100). Return ONLY the JSON array.',
              },
              {
                role: 'user',
                content: `Generate keyword recommendations for Shopee product: "${link?.productName || itemId}". Category: "${link?.category || 'general'}". Existing tags: ${baseKeywords.join(', ')}`,
              },
            ],
          })

          const content = chatResponse.choices?.[0]?.message?.content || '[]'
          const jsonMatch = content.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const keywords = JSON.parse(jsonMatch[0])
            return NextResponse.json({
              success: true,
              data: {
                keywords,
                total: keywords.length,
                item_id: itemId,
              },
              meta: { type: 'keywords', item_id: itemId, source: 'ai' },
            })
          }
        } catch (aiError) {
          console.error('[Shopee Ads] AI keyword generation failed:', aiError)
        }

        // Fallback: generate keywords from link data
        const keywords = baseKeywords.map((kw, i) => ({
          keyword: kw,
          search_volume: 1000 + Math.floor(Math.random() * 5000),
          suggested_bid: (10 + i * 5) * 100,
          competition: i < 2 ? 'high' : i < 5 ? 'medium' : 'low',
          relevance_score: Math.max(100 - i * 10, 50),
        }))

        return NextResponse.json({
          success: true,
          data: {
            keywords,
            total: keywords.length,
            item_id: itemId,
          },
          meta: { type: 'keywords', item_id: itemId, source: 'db' },
        })
      }

      case 'performance': {
        // Aggregate performance metrics over time from DB
        const startDate = new Date(from * 1000)
        const endDate = new Date(to * 1000)

        const [clickStats, conversionStats] = await Promise.all([
          db.clickRecord.findMany({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              affiliateLink: linkFilter,
            },
            select: { createdAt: true, converted: true },
          }),
          db.conversion.findMany({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              affiliateLink: linkFilter,
            },
            select: { createdAt: true, commission: true, amount: true },
          }),
        ])

        // Group by day
        const dailyPerformance = new Map<string, {
          date: string
          clicks: number
          conversions: number
          spend: number
          revenue: number
        }>()

        for (const click of clickStats) {
          const dateKey = click.createdAt.toISOString().split('T')[0]
          const entry = dailyPerformance.get(dateKey) || { date: dateKey, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
          entry.clicks++
          if (click.converted) entry.conversions++
          dailyPerformance.set(dateKey, entry)
        }

        for (const conv of conversionStats) {
          const dateKey = conv.createdAt.toISOString().split('T')[0]
          const entry = dailyPerformance.get(dateKey) || { date: dateKey, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
          entry.revenue += Number(conv.commission)
          entry.spend += Number(conv.commission) * 0.1 // Estimate 10% as ad spend
          dailyPerformance.set(dateKey, entry)
        }

        const performance = Array.from(dailyPerformance.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        )

        return NextResponse.json({
          success: true,
          data: {
            performance,
            summary: {
              total_clicks: clickStats.length,
              total_conversions: conversionStats.length,
              total_spend: performance.reduce((sum, p) => sum + p.spend, 0),
              total_revenue: performance.reduce((sum, p) => sum + p.revenue, 0),
              avg_roas: performance.length > 0
                ? performance.reduce((sum, p) => sum + (p.spend > 0 ? p.revenue / p.spend : 0), 0) / performance.length
                : 0,
            },
          },
          meta: { type: 'performance', from, to, source: 'db' },
        })
      }
    }
  } catch (error) {
    console.error('[Shopee Ads API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}
