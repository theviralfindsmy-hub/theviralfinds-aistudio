/**
 * AI Audience Analyzer — API route
 * Fasa 3.6 — TheViralFindsMY
 *
 * GET  /api/ai/audience          → returns full AudienceProfile
 * POST /api/ai/audience { niche } → returns profile refined by niche
 *
 * Aggregates real click/conversion data from DB (ClickRecord, Conversion).
 * Uses z-ai-web-dev-sdk to generate content suggestions tailored to the audience.
 * Falls back to algorithmic defaults when the SDK is unavailable or no data exists.
 */

import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

import {
  buildMockAudienceProfile,
  buildDemographics as buildMockDemographics,
  buildInterests as buildMockInterests,
  buildHeatmap as buildMockHeatmap,
  buildSegments as buildMockSegments,
  buildContentSuggestions as buildMockContentSuggestions,
  buildAudienceTrend as buildMockAudienceTrend,
  TOTAL_AUDIENCE_SIZE,
} from '@/lib/audience/mock-data'
import type {
  AudienceApiResponse,
  AudienceProfile,
  ContentSuggestion,
  DemographicSlice,
  DemographicsBreakdown,
  InterestEntry,
  InterestMap,
  ActiveHoursHeatmap,
  HeatmapCell,
  AudienceSegment,
  AudienceTrendPoint,
  AudienceSummary,
} from '@/lib/audience/types'

/** Convert an MYT hour (0-23) into a friendly 12-hour label. */
function hourLabel(hour: number): string {
  const ampm = hour < 12 ? 'AM' : 'PM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${ampm}`
}

// ─── Real data aggregation from DB ──────────────────────────────────────────

/** Aggregate demographics from ClickRecord data. */
async function aggregateDemographics(userId?: string): Promise<DemographicsBreakdown> {
  try {
    const whereClause = userId ? { userId } : {}
    const clicks = await db.clickRecord.findMany({
      where: whereClause,
      select: { country: true, device: true, browser: true, createdAt: true },
      take: 5000,
    })

    if (clicks.length === 0) {
      return buildMockDemographics()
    }

    const total = clicks.length

    // Device distribution
    const deviceCounts = new Map<string, number>()
    for (const c of clicks) {
      const dev = c.device || 'unknown'
      deviceCounts.set(dev, (deviceCounts.get(dev) || 0) + 1)
    }
    const devices: DemographicSlice[] = Array.from(deviceCounts.entries())
      .map(([key, count]) => ({
        key: key.toLowerCase(),
        label: key.charAt(0).toUpperCase() + key.slice(1),
        percentage: Math.round((count / total) * 100),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    // Country/location distribution
    const countryCounts = new Map<string, number>()
    for (const c of clicks) {
      const cn = c.country || 'unknown'
      countryCounts.set(cn, (countryCounts.get(cn) || 0) + 1)
    }
    const locationMap: Record<string, string> = {
      MY: 'Malaysia', SG: 'Singapore', ID: 'Indonesia', TH: 'Thailand',
      unknown: 'Unknown',
    }
    const locations: DemographicSlice[] = Array.from(countryCounts.entries())
      .map(([key, count]) => ({
        key: key.toLowerCase(),
        label: locationMap[key] || key,
        percentage: Math.round((count / total) * 100),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    // Age ranges — not stored in ClickRecord, so use heuristic defaults
    const ageRanges: DemographicSlice[] = [
      { key: '18-24', label: '18-24', percentage: 21, count: Math.round(total * 0.21) },
      { key: '25-34', label: '25-34', percentage: 42, count: Math.round(total * 0.42) },
      { key: '35-44', label: '35-44', percentage: 23, count: Math.round(total * 0.23) },
      { key: '45+', label: '45+', percentage: 14, count: Math.round(total * 0.14) },
    ]

    // Gender — not stored, use heuristic defaults
    const genders: DemographicSlice[] = [
      { key: 'female', label: 'Female', percentage: 68, count: Math.round(total * 0.68) },
      { key: 'male', label: 'Male', percentage: 30, count: Math.round(total * 0.30) },
      { key: 'other', label: 'Other', percentage: 2, count: Math.round(total * 0.02) },
    ]

    return { ageRanges, genders, locations, devices }
  } catch (err) {
    console.warn('[/api/ai/audience] DB aggregation failed, using mock demographics:', err)
    return buildMockDemographics()
  }
}

/** Aggregate interests from affiliate link categories and click data. */
async function aggregateInterests(userId?: string): Promise<InterestMap> {
  try {
    const links = await db.affiliateLink.findMany({
      where: userId ? { userId } : {},
      select: { category: true, clicks: true },
    })

    if (links.length === 0) return buildMockInterests()

    const catMap = new Map<string, { clicks: number; count: number }>()
    for (const l of links) {
      const cat = l.category || 'Other'
      const existing = catMap.get(cat) || { clicks: 0, count: 0 }
      existing.clicks += l.clicks
      existing.count += 1
      catMap.set(cat, existing)
    }

    const totalClicks = Array.from(catMap.values()).reduce((s, v) => s + v.clicks, 0)
    const entries: InterestEntry[] = Array.from(catMap.entries())
      .map(([interest, data]) => ({
        interest,
        affinity: Math.min(100, Math.round((data.clicks / Math.max(totalClicks, 1)) * 150)),
        clicks: data.clicks,
        engagementLift: Math.round(10 + (data.clicks / Math.max(totalClicks, 1)) * 50),
      }))
      .sort((a, b) => b.affinity - a.affinity)

    return {
      totalInterests: entries.length,
      topInterest: entries[0]?.interest || 'Beauty',
      entries: entries.length > 0 ? entries : buildMockInterests().entries,
    }
  } catch (err) {
    console.warn('[/api/ai/audience] Interest aggregation failed:', err)
    return buildMockInterests()
  }
}

/** Build heatmap from click timestamps. */
async function aggregateHeatmap(userId?: string): Promise<ActiveHoursHeatmap> {
  try {
    const clicks = await db.clickRecord.findMany({
      where: userId ? { userId } : {},
      select: { createdAt: true },
      take: 10000,
    })

    if (clicks.length < 10) return buildMockHeatmap()

    const cells: HeatmapCell[] = []
    let maxClicks = 0
    let totalClicks = 0

    // Initialize 7x24 grid
    const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))

    for (const c of clicks) {
      const d = new Date(c.createdAt)
      const day = d.getDay() // 0=Sun
      const hour = d.getHours()
      grid[day][hour]++
    }

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const clicks_ = grid[day][hour]
        cells.push({ day, hour, clicks: clicks_, density: 0 })
        totalClicks += clicks_
        if (clicks_ > maxClicks) maxClicks = clicks_
      }
    }

    for (const cell of cells) {
      cell.density = maxClicks > 0 ? Math.round((cell.clicks / maxClicks) * 100) : 0
    }

    const hourTotals = new Array(24).fill(0)
    const dayTotals = new Array(7).fill(0)
    for (const c of cells) {
      hourTotals[c.hour] += c.clicks
      dayTotals[c.day] += c.clicks
    }
    const peakHour = hourTotals.indexOf(Math.max(...hourTotals))
    const peakDay = dayTotals.indexOf(Math.max(...dayTotals))

    return { cells, peakHour, peakDay, totalClicks }
  } catch (err) {
    console.warn('[/api/ai/audience] Heatmap aggregation failed:', err)
    return buildMockHeatmap()
  }
}

/** Build audience profile from real DB data. */
async function buildProfileFromDB(userId?: string, niche?: string): Promise<AudienceProfile> {
  const [demographics, interests, heatmap] = await Promise.all([
    aggregateDemographics(userId),
    aggregateInterests(userId),
    aggregateHeatmap(userId),
  ])

  // Segments — use mock for now (requires ML clustering on real data)
  const segments = buildMockSegments()

  // Content suggestions — will be enriched by AI below
  const suggestions = buildMockContentSuggestions(niche)

  // Trend — build from conversion data
  let trend = buildMockAudienceTrend()
  try {
    const conversions = await db.conversion.findMany({
      where: {},
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    })
    if (conversions.length >= 2) {
      const months = new Map<string, { count: number; earnings: number }>()
      for (const c of conversions) {
        const month = new Date(c.createdAt).toISOString().slice(0, 7)
        const existing = months.get(month) || { count: 0, earnings: 0 }
        existing.count += 1
        existing.earnings += Number(c.amount)
        months.set(month, existing)
      }
      const sortedMonths = Array.from(months.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      let cumulative = 0
      trend = sortedMonths.slice(-8).map(([month, data]) => {
        cumulative += data.count
        return {
          month,
          label: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
          audienceSize: cumulative,
          newMembers: data.count,
          engagementRate: Math.round((data.earnings / Math.max(data.count, 1)) * 10) / 10,
        }
      })
    }
  } catch (err) {
    console.warn('[/api/ai/audience] Trend aggregation failed:', err)
  }

  const totalAudienceSize = demographics.locations.reduce((s, l) => s + l.count, 0) || TOTAL_AUDIENCE_SIZE
  const monthOverMonthGrowth = (() => {
    if (trend.length < 2) return 0
    const last = trend[trend.length - 1].audienceSize
    const prev = trend[trend.length - 2].audienceSize
    return prev > 0 ? Math.round(((last - prev) / prev) * 1000) / 10 : 0
  })()

  const summary: AudienceSummary = {
    totalAudienceSize,
    avgEngagementRate: 4.7,
    topInterest: interests.topInterest,
    peakHour: heatmap.peakHour,
    peakHourLabel: hourLabel(heatmap.peakHour),
    activeSegments: segments.length,
    monthOverMonthGrowth,
  }

  return {
    summary,
    demographics,
    interests,
    heatmap,
    segments,
    suggestions,
    trend,
    generatedAt: new Date().toISOString(),
    niche,
  }
}

/**
 * Ask Hermes (z-ai-web-dev-sdk) to refine content suggestions for the
 * given audience profile and optional niche.
 */
async function generateAiSuggestions(
  profile: AudienceProfile,
  niche?: string
): Promise<ContentSuggestion[] | null> {
  try {
    const zai = await ZAI.create()

    const audienceBrief = {
      totalSize: profile.summary.totalAudienceSize,
      topAgeRange: profile.demographics.ageRanges
        .slice()
        .sort((a, b) => b.percentage - a.percentage)[0]?.label,
      topGender: profile.demographics.genders
        .slice()
        .sort((a, b) => b.percentage - a.percentage)[0]?.label,
      topLocation: profile.demographics.locations[0]?.label,
      topDevice: profile.demographics.devices[0]?.label,
      topInterest: profile.interests.topInterest,
      peakHourLabel: profile.summary.peakHourLabel,
      avgEngagementRate: profile.summary.avgEngagementRate,
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a Shopee Malaysia affiliate marketing strategist. ' +
            'Based on the audience profile provided, return 3-6 content suggestions ' +
            'as a JSON array. Each item must have: id (string), title (string, ' +
            'punchy headline referencing audience data), explanation (string, 1-2 ' +
            'sentences with concrete numbers), format (one of: short_video, ' +
            'live_stream, carousel, story, blog_post), bestTime (string, MYT ' +
            'timing), expectedLift (number, percentage), tags (string array). ' +
            'Use Malaysian context (Klang Valley, Manglish, RM, 9.9 sale). ' +
            'Return ONLY the JSON array — no markdown, no commentary.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            audience: audienceBrief,
            topInterests: profile.interests.entries.slice(0, 5),
            segments: profile.segments.map((s) => ({
              name: s.name,
              share: s.sharePercentage,
              topInterest: s.topInterest,
              avgEngagement: s.avgEngagement,
            })),
            niche: niche || 'general',
          }),
        },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices?.[0]?.message?.content || ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const allowedFormats: ContentSuggestion['format'][] = [
      'short_video',
      'live_stream',
      'carousel',
      'story',
      'blog_post',
    ]

    const suggestions: ContentSuggestion[] = parsed
      .filter((item) => typeof item.title === 'string')
      .slice(0, 6)
      .map((item, idx) => {
        const formatRaw = String(item.format || 'short_video')
        const format = allowedFormats.includes(formatRaw as ContentSuggestion['format'])
          ? (formatRaw as ContentSuggestion['format'])
          : 'short_video'

        const tagsRaw = Array.isArray(item.tags)
          ? (item.tags as unknown[]).map(String)
          : []

        return {
          id: typeof item.id === 'string' ? String(item.id) : `ai-sug-${idx + 1}`,
          title: String(item.title),
          explanation:
            typeof item.explanation === 'string'
              ? String(item.explanation)
              : 'Suggested based on your audience profile.',
          format,
          bestTime:
            typeof item.bestTime === 'string' ? String(item.bestTime) : '8 PM MYT',
          expectedLift:
            typeof item.expectedLift === 'number'
              ? item.expectedLift
              : Math.round((item.expectedLift as number) || 20),
          tags: tagsRaw.length > 0 ? tagsRaw : [niche || 'general'],
        }
      })

    return suggestions.length > 0 ? suggestions : null
  } catch (err) {
    console.warn('[audience] AI suggestion unavailable, using audience profile fallback:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Build the audience profile. Tries real DB data first, then enriches with AI.
 */
async function buildProfile(
  userId?: string,
  niche?: string,
  useAi = true
): Promise<AudienceApiResponse> {
  // Build profile from real DB data (falls back to mock inside each aggregator)
  const baseProfile = await buildProfileFromDB(userId, niche)

  if (!useAi) {
    return { profile: baseProfile, source: 'mock', fallback: true }
  }

  const aiSuggestions = await generateAiSuggestions(baseProfile, niche)
  if (!aiSuggestions || aiSuggestions.length === 0) {
    return { profile: baseProfile, source: 'mock', fallback: true }
  }

  const profile: AudienceProfile = {
    ...baseProfile,
    suggestions: aiSuggestions,
    generatedAt: new Date().toISOString(),
  }

  return { profile, source: 'ai', fallback: false }
}

/** GET /api/ai/audience — returns the full audience analysis. */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const response = await buildProfile(userId, undefined, true)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[audience] GET error:', error)
    const fallback = buildMockAudienceProfile()
    return NextResponse.json({
      profile: fallback,
      source: 'mock',
      fallback: true,
    })
  }
}

/** POST /api/ai/audience — accepts `{ niche }` and returns refined analysis. */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    let body: { niche?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const niche =
      typeof body?.niche === 'string' ? body.niche.trim().slice(0, 60) : undefined

    const response = await buildProfile(userId, niche, true)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[audience] POST error:', error)
    const fallback = buildMockAudienceProfile()
    return NextResponse.json({
      profile: fallback,
      source: 'mock',
      fallback: true,
    })
  }
}

/** Re-export hour label helper for callers that need it. */
export { hourLabel }
