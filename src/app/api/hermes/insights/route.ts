/**
 * GET  /api/hermes/insights
 *   Returns proactive insights from the DB (HermesInsight table).
 *   Uses real user data (earnings, clicks, conversions) for context.
 *
 * POST /api/hermes/insights
 *   Marks an insight as actioned (or read).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  filterAndSort,
  countNew,
  scoreInsightRelevance,
} from '@/lib/hermes-insights/generator'
import type {
  ProactiveInsight,
  InsightType,
  InsightTypeFilter,
  InsightsListResponse,
  UserProfile,
} from '@/lib/hermes-insights/types'

// In-memory actioned state for non-DB insights
const mockActionedState = new Map<string, { isRead: boolean; isActioned: boolean }>()

// Default user profile built from real data when possible
async function buildUserProfile(userId?: string): Promise<UserProfile> {
  const defaultProfile: UserProfile = {
    topCategories: ['Beauty', 'Fashion', 'Electronics'],
    hasShopeeApi: false,
    avgDailyClicks: 200,
    peakHour: 20,
    accountAgeDays: 45,
  }

  if (!userId) return defaultProfile

  try {
    // Get user's top categories from their links
    const links = await db.affiliateLink.findMany({
      where: { userId },
      select: { category: true, clicks: true, createdAt: true },
      orderBy: { clicks: 'desc' },
      take: 50,
    })

    if (links.length > 0) {
      const catMap = new Map<string, number>()
      for (const l of links) {
        if (l.category) {
          catMap.set(l.category, (catMap.get(l.category) || 0) + l.clicks)
        }
      }
      const topCategories = Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat)

      // Get click stats
      const totalClicks = links.reduce((s, l) => s + l.clicks, 0)
      const daysActive = Math.max(1, Math.ceil((Date.now() - links[links.length - 1].createdAt.getTime()) / 86400000))

      return {
        ...defaultProfile,
        topCategories: topCategories.length > 0 ? topCategories : defaultProfile.topCategories,
        avgDailyClicks: Math.round(totalClicks / daysActive),
        accountAgeDays: daysActive,
      }
    }
  } catch (err) {
    console.warn('[hermes/insights] Failed to build user profile:', err)
  }

  return defaultProfile
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidTypeFilter(value: string | null): value is InsightTypeFilter {
  if (value === 'all') return true
  return ['daily_summary', 'anomaly', 'opportunity', 'trend_alert', 'recommendation'].includes(value || '')
}

/** Convert a DB HermesInsight row → ProactiveInsight. */
function dbRowToInsight(row: {
  id: string
  type: string
  title: string
  description: string
  severity: string
  data: string | null
  isRead: boolean
  isActioned: boolean
  createdAt: Date
}): ProactiveInsight {
  const severity = (['info', 'warning', 'critical', 'success'].includes(row.severity)
    ? row.severity
    : 'info') as ProactiveInsight['severity']

  const typeMap: Record<string, InsightType> = {
    trend: 'trend_alert',
    alert: 'anomaly',
    opportunity: 'opportunity',
    recommendation: 'recommendation',
    daily_summary: 'daily_summary',
    anomaly: 'anomaly',
    trend_alert: 'trend_alert',
  }
  const type = typeMap[row.type] ?? 'recommendation'

  let parsedData: ProactiveInsight['data'] = undefined
  if (row.data) {
    try { parsedData = JSON.parse(row.data) } catch { /* ignore */ }
  }

  return {
    id: row.id,
    type,
    severity,
    title: row.title,
    description: row.description,
    timestamp: row.createdAt.toISOString(),
    relevance: 75,
    isRead: row.isRead,
    isActioned: row.isActioned,
    source: 'ai',
    data: parsedData,
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  }
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type')
    const typeFilter: InsightTypeFilter = isValidTypeFilter(typeParam)
      ? typeParam
      : 'all'

    const userId = request.headers.get('x-user-id') || undefined

    // 1. Load DB-backed AI insights
    let dbInsights: ProactiveInsight[] = []
    try {
      const rows = await db.hermesInsight.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
      dbInsights = rows.map(dbRowToInsight)
    } catch (dbErr) {
      console.warn('[hermes/insights] DB read failed:', dbErr)
    }

    // 2. If no DB insights, return empty (not mock data)
    // Real insights come from POST /api/hermes/insights/generate
    const combined = dbInsights

    // 3. Build real user profile
    const userProfile = await buildUserProfile(userId)

    // 4. Re-score relevance against user profile
    const scored = combined.map((i) => ({
      ...i,
      relevance: scoreInsightRelevance(i, userProfile),
    }))

    // 5. Filter + sort
    const finalInsights = filterAndSort(scored, typeFilter)

    const responseSource: InsightsListResponse['source'] = dbInsights.length > 0 ? 'ai' : 'mock'

    const responseBody: InsightsListResponse = {
      insights: finalInsights,
      count: finalInsights.length,
      newCount: countNew(finalInsights),
      generatedAt: new Date().toISOString(),
      source: responseSource,
    }

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('[hermes/insights] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch insights',
        insights: [],
        count: 0,
        newCount: 0,
        generatedAt: new Date().toISOString(),
        source: 'mock',
      },
      { status: 500 },
    )
  }
}

// ─── POST (mark as actioned / read) ──────────────────────────────────────────

interface MarkActionedBody {
  id?: string
  action?: 'actioned' | 'read'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as MarkActionedBody
    const { id, action = 'actioned' } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 },
      )
    }

    if (action !== 'actioned' && action !== 'read') {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Must be 'actioned' or 'read'.` },
        { status: 400 },
      )
    }

    // Try DB update first
    try {
      const updateData = action === 'actioned'
        ? { isActioned: true, isRead: true }
        : { isRead: true }

      const updated = await db.hermesInsight.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({
        ok: true,
        id,
        action,
        state: {
          isRead: updated.isRead,
          isActioned: updated.isActioned,
        },
        source: 'ai',
      })
    } catch (dbErr) {
      // Not in DB — update in-memory state
      const current = mockActionedState.get(id) ?? { isRead: false, isActioned: false }
      const next = action === 'actioned'
        ? { isRead: true, isActioned: true }
        : { ...current, isRead: true }
      mockActionedState.set(id, next)
      return NextResponse.json({
        ok: true,
        id,
        action,
        state: next,
        source: 'mock',
      })
    }
  } catch (error) {
    console.error('[hermes/insights] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 },
    )
  }
}
