/**
 * POST /api/hermes/insights/generate
 *
 * Generates a FRESH proactive insight using z-ai-web-dev-sdk based on
 * the user's ACTUAL data from the database (earnings, clicks, conversions).
 * Falls back to algorithmic generation if AI fails.
 *
 * The generated insight is persisted to the HermesInsight table.
 */

import { NextResponse, type NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import {
  buildRecommendation,
  defaultAlgorithmicRecommendation,
  type DailyMetrics,
} from '@/lib/hermes-insights/generator'
import type {
  GenerateInsightResponse,
  InsightType,
  ProactiveInsight,
} from '@/lib/hermes-insights/types'

// ─── Aggregate real data from DB ──────────────────────────────────────────────

async function aggregateUserMetrics(userId?: string): Promise<{
  daily: DailyMetrics | null
  topProducts: Array<{ name: string; clicks: number; conversions: number; earnings: number }>
  recentTrend: 'up' | 'down' | 'stable'
  totalEarnings: number
  totalClicks: number
  totalConversions: number
}> {
  const empty = {
    daily: null,
    topProducts: [],
    recentTrend: 'stable' as const,
    totalEarnings: 0,
    totalClicks: 0,
    totalConversions: 0,
  }

  try {
    // Get click stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const [todayClicks, yesterdayClicks] = await Promise.all([
      db.clickRecord.count({
        where: { createdAt: { gte: today } },
      }),
      db.clickRecord.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
    ])

    // Get conversion stats
    const [todayConversions, yesterdayConversions] = await Promise.all([
      db.conversion.findMany({
        where: { createdAt: { gte: today } },
        select: { amount: true, commission: true },
      }),
      db.conversion.findMany({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
        select: { amount: true, commission: true },
      }),
    ])

    const todayEarnings = todayConversions.reduce((s, c) => s + Number(c.commission), 0)
    const yesterdayEarnings = yesterdayConversions.reduce((s, c) => s + Number(c.commission), 0)

    const daily: DailyMetrics = {
      today: {
        clicks: todayClicks,
        conversions: todayConversions.length,
        earnings: Math.round(todayEarnings * 100) / 100,
      },
      yesterday: {
        clicks: yesterdayClicks,
        conversions: yesterdayConversions.length,
        earnings: Math.round(yesterdayEarnings * 100) / 100,
      },
    }

    // Top performing products
    const topLinks = await db.affiliateLink.findMany({
      where: userId ? { userId } : {},
      orderBy: { earnings: 'desc' },
      take: 5,
      select: {
        productName: true,
        clicks: true,
        conversions: true,
        earnings: true,
      },
    })

    const topProducts = topLinks.map((l) => ({
      name: l.productName || l.productName || 'Unknown',
      clicks: l.clicks,
      conversions: l.conversions,
      earnings: Number(l.earnings),
    }))

    // Total stats
    const totalClicks = await db.clickRecord.count()
    const totalConversions = await db.conversion.count()
    const totalEarningsResult = await db.conversion.aggregate({
      _sum: { commission: true },
    })
    const totalEarnings = Number(totalEarningsResult._sum.commission) || 0

    // Determine trend
    const recentTrend = todayEarnings > yesterdayEarnings * 1.1
      ? 'up' as const
      : todayEarnings < yesterdayEarnings * 0.9
        ? 'down' as const
        : 'stable' as const

    return {
      daily,
      topProducts,
      recentTrend,
      totalEarnings,
      totalClicks,
      totalConversions,
    }
  } catch (err) {
    console.warn('[hermes/insights/generate] DB aggregation failed:', err)
    return empty
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidFocus(value: unknown): value is InsightType {
  return typeof value === 'string' && [
    'daily_summary',
    'anomaly',
    'opportunity',
    'trend_alert',
    'recommendation',
  ].includes(value)
}

/** Algorithmic fallback — produces a deterministic insight per focus type. */
function algorithmicFallback(focus: InsightType, metrics: Awaited<ReturnType<typeof aggregateUserMetrics>>): ProactiveInsight {
  if (metrics.daily) {
    const { today, yesterday } = metrics.daily
    const changeClicks = yesterday.clicks > 0 ? Math.round(((today.clicks - yesterday.clicks) / yesterday.clicks) * 100) : 0
    const changeEarnings = yesterday.earnings > 0 ? Math.round(((today.earnings - yesterday.earnings) / yesterday.earnings) * 100) : 0

    return {
      id: `algo-${Date.now().toString(36)}`,
      type: focus,
      severity: changeEarnings >= 0 ? 'success' : 'warning',
      title: `Today: ${today.clicks} clicks, ${today.conversions} conversions, RM ${today.earnings.toFixed(2)}. ${changeEarnings >= 0 ? '+' : ''}${changeEarnings}% vs yesterday.`,
      description: `Based on your data: ${today.clicks} clicks today vs ${yesterday.clicks} yesterday. Earnings RM ${today.earnings.toFixed(2)} vs RM ${yesterday.earnings.toFixed(2)}. ${metrics.recentTrend === 'up' ? 'Trending upward!' : metrics.recentTrend === 'down' ? 'Slight decline — consider adjusting content.' : 'Stable performance.'}`,
      timestamp: new Date().toISOString(),
      relevance: 80,
      isRead: false,
      isActioned: false,
      source: 'algorithm',
      data: {
        today: { clicks: today.clicks, conversions: today.conversions, earnings: today.earnings, conversionRate: today.clicks > 0 ? Math.round((today.conversions / today.clicks) * 1000) / 10 : 0 },
        yesterday: { clicks: yesterday.clicks, conversions: yesterday.conversions, earnings: yesterday.earnings, conversionRate: yesterday.clicks > 0 ? Math.round((yesterday.conversions / yesterday.clicks) * 1000) / 10 : 0 },
        changePct: { clicks: changeClicks, earnings: changeEarnings },
      },
      secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
    }
  }

  return defaultAlgorithmicRecommendation()
}

/** Try to persist an AI insight to the DB. Failures are non-fatal. */
async function persistInsight(insight: ProactiveInsight): Promise<void> {
  try {
    await db.hermesInsight.create({
      data: {
        id: insight.id,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        severity: insight.severity,
        data: insight.data ? JSON.stringify(insight.data) : null,
        isRead: false,
        isActioned: false,
      },
    })
  } catch (dbErr) {
    console.warn('[hermes/insights/generate] DB persist failed:', dbErr)
  }
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      focus?: string
      context?: Record<string, unknown>
    }

    const focus: InsightType = isValidFocus(body.focus)
      ? body.focus
      : 'recommendation'

    const userId = request.headers.get('x-user-id') || undefined
    const contextStr = body.context
      ? `\nAdditional context: ${JSON.stringify(body.context)}`
      : ''

    // Aggregate real data from DB
    const metrics = await aggregateUserMetrics(userId)

    // Build focus-specific instruction for the AI
    const focusInstruction: Record<InsightType, string> = {
      daily_summary:
        'Generate a daily performance summary insight comparing today vs yesterday. Include clicks, conversions, earnings (RM), and a percentage change. Malaysian context, Manglish flavour.',
      anomaly:
        'Generate an anomaly detection insight — an unusual drop or spike in clicks, conversions, conversion rate, or earnings. Specify the metric, before/after values, the time window, and a clear "investigate" CTA. Malaysian context.',
      opportunity:
        'Generate a product opportunity insight — a trending product in Malaysia the user should promote now. Include product name, search growth %, commission rate, and estimated earnings. Manglish flavour.',
      trend_alert:
        'Generate a trend alert insight — an emerging cultural or seasonal trend (e.g. Raya Beauty, 11.11 prep) the user should create content for. Include platform, growth %, peak window, and a suggested action.',
      recommendation:
        'Generate a recommendation insight — a smart actionable suggestion (best posting time, content format, audience targeting, link audit). Include expected lift percentage. Manglish flavour.',
    }

    // Build data context for the AI
    const dataContext = metrics.daily
      ? `\n\nUser's actual data:\nToday: ${metrics.daily.today.clicks} clicks, ${metrics.daily.today.conversions} conversions, RM ${metrics.daily.today.earnings.toFixed(2)}\nYesterday: ${metrics.daily.yesterday.clicks} clicks, ${metrics.daily.yesterday.conversions} conversions, RM ${metrics.daily.yesterday.earnings.toFixed(2)}\nTotal: ${metrics.totalClicks} clicks, ${metrics.totalConversions} conversions, RM ${metrics.totalEarnings.toFixed(2)} earnings\nTrend: ${metrics.recentTrend}\nTop products: ${metrics.topProducts.map((p) => `${p.name} (${p.clicks} clicks, RM${p.earnings.toFixed(2)})`).join(', ')}`
      : '\n\nNo user data available yet — generate a general Malaysian market insight.'

    // ── Try AI generation ──────────────────────────────────────────────────
    let aiInsight: ProactiveInsight | null = null
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are HERMES, a proactive AI agent for TheViralFindsMY — an affiliate marketing platform for Malaysian Shopee affiliates. Generate ONE proactive insight as a strict JSON object with these exact fields:
{
  "type": "${focus}",
  "severity": "info" | "warning" | "critical" | "success",
  "title": "Short punchy headline (max 80 chars, can use emoji)",
  "description": "1-3 sentence body with concrete numbers. Use Malaysian context (RM currency, MYT timezone) and Manglish flavour (e.g. 'syok', 'naik', 'jangan lambat', 'cepat sikit').",
  "data": { ... }
}

For "data" field, use this shape based on type:
- daily_summary: { "today": {clicks,conversions,earnings,conversionRate}, "yesterday": {...}, "changePct": {clicks,conversions,earnings} }
- anomaly: { "metric": "clicks"|"conversions"|"conversionRate"|"earnings", "before": number, "after": number, "dropPct": number, "window": "last X hours" }
- opportunity: { "productName": string, "category": string, "trendPct": number, "opportunitiesAvailable": number, "commissionRate": number, "estimatedEarnings": number }
- trend_alert: { "productName": string, "trendPct": number }
- recommendation: { "recommendationType": "post_timing"|"content_format"|"product_focus"|"link_audit"|"audience_targeting", "suggestedTime"?: string, "expectedLift"?: number }

Return ONLY the JSON object. No markdown, no explanation.`,
          },
          {
            role: 'user',
            content: `${focusInstruction[focus]}${contextStr}${dataContext}

Make it realistic and specific to the Malaysian Shopee affiliate market.`,
          },
        ],
        thinking: { type: 'disabled' },
      })

      const content = completion.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Partial<ProactiveInsight> & {
          data?: Record<string, unknown>
        }

        if (parsed.title && parsed.description) {
          aiInsight = {
            id: `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            type: focus,
            severity: (['info', 'warning', 'critical', 'success'].includes(
              parsed.severity as string,
            )
              ? parsed.severity
              : 'info') as ProactiveInsight['severity'],
            title: String(parsed.title).slice(0, 200),
            description: String(parsed.description).slice(0, 1000),
            timestamp: new Date().toISOString(),
            relevance: 85,
            isRead: false,
            isActioned: false,
            source: 'ai',
            data: parsed.data as ProactiveInsight['data'],
            action: focus === 'opportunity'
              ? { label: 'Generate Link', action: 'generate_link' }
              : focus === 'anomaly'
                ? { label: 'Investigate', action: 'investigate', href: '/analytics' }
                : focus === 'trend_alert'
                  ? { label: 'Generate Content', action: 'generate_content', href: '/hermes' }
                  : focus === 'daily_summary'
                    ? { label: 'View Analytics', action: 'view_analytics', href: '/analytics' }
                    : { label: 'Generate Content', action: 'generate_content', href: '/hermes' },
            secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
          }
        }
      }
    } catch (aiErr) {
      console.warn('[hermes/insights/generate] AI generation failed, using algorithmic fallback:', aiErr)
    }

    // ── Fallback to algorithmic generation ─────────────────────────────────
    const finalInsight = aiInsight ?? algorithmicFallback(focus, metrics)
    const finalSource = aiInsight ? 'ai' : 'algorithm'

    // ── Persist AI insights to DB ──────────────────────────────────────────
    if (finalSource === 'ai') {
      await persistInsight(finalInsight)
    }

    const response: GenerateInsightResponse = {
      insight: finalInsight,
      source: finalSource,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[hermes/insights/generate] POST error:', error)
    const fallback = buildRecommendation({
      type: 'post_timing',
      title: '💡 Default recommendation: post at 7:45 PM MYT for peak 8 PM engagement.',
      description:
        'AI generation failed. Defaulting to algorithmic recommendation. Peak engagement window is 8-10 PM MYT — posting 15 minutes early lets the algorithm index your content. Expected lift: ~23% more clicks.',
      suggestedTime: '7:45 PM MYT',
      expectedLift: 23,
    })
    const response: GenerateInsightResponse = {
      insight: fallback,
      source: 'algorithm',
      generatedAt: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 200 })
  }
}
