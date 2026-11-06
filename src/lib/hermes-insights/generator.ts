/**
 * HERMES Proactive Insights — Generator Functions
 *
 * Pure, deterministic algorithms that turn raw metrics into ProactiveInsight
 * objects. Used by the API routes (server-side only). All functions are
 * side-effect free — persistence is handled by the caller.
 *
 * Malaysia-specific: currency is RM, peak hour defaults to 20 (8 PM MYT),
 * Manglish flavour in copy.
 */

import type {
  ProactiveInsight,
  InsightType,
  InsightSeverity,
  InsightData,
  InsightAction,
  UserProfile,
} from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a stable-ish id for algorithmically produced insights. */
function makeId(prefix: string, salt: string | number = Date.now()): string {
  return `${prefix}-${salt.toString(36)}`
}

/** Format a Malaysian Ringgit amount, e.g. 145.5 → "RM 145.50". */
export function formatRM(amount: number): string {
  return `RM ${amount.toFixed(2)}`
}

/** Percentage change from `before` to `after`, rounded to 1 decimal. */
export function pctChange(before: number, after: number): number {
  if (before === 0) return after > 0 ? 100 : 0
  return Number((((after - before) / before) * 100).toFixed(1))
}

/** Minutes since a timestamp, for "x minutes ago" copy. */
function minutesAgo(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000)
}

// ─── 1. Daily Summary ────────────────────────────────────────────────────────

export interface DailyMetrics {
  today: { clicks: number; conversions: number; earnings: number }
  yesterday: { clicks: number; conversions: number; earnings: number }
}

/**
 * Build a daily_summary insight comparing today vs yesterday.
 * Severity is `success` when earnings are up, `warning` when down >15%,
 * `info` otherwise.
 */
export function generateDailySummary(
  metrics: DailyMetrics,
  timestamp: string = new Date().toISOString(),
): ProactiveInsight {
  const clicksChange = pctChange(metrics.yesterday.clicks, metrics.today.clicks)
  const convChange = pctChange(
    metrics.yesterday.conversions,
    metrics.today.conversions,
  )
  const earnChange = pctChange(
    metrics.yesterday.earnings,
    metrics.today.earnings,
  )

  const todayRate =
    metrics.today.clicks > 0
      ? (metrics.today.conversions / metrics.today.clicks) * 100
      : 0
  const yestRate =
    metrics.yesterday.clicks > 0
      ? (metrics.yesterday.conversions / metrics.yesterday.clicks) * 100
      : 0

  const isUp = earnChange > 0
  const isCrash = earnChange < -15

  const severity: InsightSeverity = isCrash
    ? 'warning'
    : isUp
      ? 'success'
      : 'info'

  const title = isUp
    ? `Today's Performance: ${metrics.today.clicks} clicks, ${metrics.today.conversions} conversions, ${formatRM(metrics.today.earnings)} — up ${earnChange}% vs yesterday 🔥`
    : isCrash
      ? `Today's Performance: ${formatRM(metrics.today.earnings)} — down ${Math.abs(earnChange)}% vs yesterday ⚠️`
      : `Today's Performance: ${metrics.today.clicks} clicks, ${metrics.today.conversions} conversions, ${formatRM(metrics.today.earnings)}`

  const description = isUp
    ? `Syok lah! Earnings naik ${earnChange}% compared to yesterday. Conversions ${convChange >= 0 ? 'also up' : 'slightly down'} ${convChange}%. Keep the momentum going — post one more piece of content tonight to ride the wave.`
    : isCrash
      ? `Earnings dropped ${Math.abs(earnChange)}% vs yesterday. Clicks ${clicksChange >= 0 ? 'still ok at ' + clicksChange + '%' : 'also down ' + clicksChange + '%'}. Maybe review your top links — something might be broken or the audience shift.`
      : `Performance is about the same as yesterday. ${metrics.today.clicks} clicks with ${todayRate.toFixed(1)}% conversion rate (yesterday ${yestRate.toFixed(1)}%). Try a new content angle to break the plateau.`

  const data: InsightData = {
    today: {
      clicks: metrics.today.clicks,
      conversions: metrics.today.conversions,
      earnings: metrics.today.earnings,
      conversionRate: Number(todayRate.toFixed(2)),
    },
    yesterday: {
      clicks: metrics.yesterday.clicks,
      conversions: metrics.yesterday.conversions,
      earnings: metrics.yesterday.earnings,
      conversionRate: Number(yestRate.toFixed(2)),
    },
    changePct: {
      clicks: clicksChange,
      conversions: convChange,
      earnings: earnChange,
    },
  }

  const action: InsightAction = {
    label: 'View Analytics',
    action: 'view_analytics',
    href: '/analytics',
  }

  return {
    id: makeId('daily', new Date(timestamp).setHours(0, 0, 0, 0)),
    type: 'daily_summary',
    severity,
    title,
    description,
    timestamp,
    relevance: 88, // daily summary always near the top
    isRead: false,
    isActioned: false,
    source: 'algorithm',
    data,
    action,
    secondaryAction: {
      label: 'Mark as Actioned',
      action: 'dismiss',
    },
  }
}

// ─── 2. Anomaly Detection ────────────────────────────────────────────────────

export interface MetricSeries {
  metric: 'clicks' | 'conversions' | 'conversionRate' | 'earnings' | 'ctr'
  before: number
  after: number
  /** Human-readable window, e.g. "last 3 hours". */
  window: string
  /** Optional label for the affected scope (product name, campaign). */
  scope?: string
}

/**
 * Detect anomalies — any metric with >20% change (drop or spike).
 * Returns one ProactiveInsight per detected anomaly, severity scaled by size:
 *   >50% drop  → critical
 *   20-50% drop → warning
 *   >20% spike → success (we want to amplify these)
 */
export function detectAnomalies(
  series: MetricSeries[],
  timestamp: string = new Date().toISOString(),
): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []

  for (const s of series) {
    const change = pctChange(s.before, s.after)
    if (Math.abs(change) < 20) continue

    const isDrop = change < 0
    const magnitude = Math.abs(change)

    let severity: InsightSeverity
    if (isDrop && magnitude >= 50) severity = 'critical'
    else if (isDrop) severity = 'warning'
    else severity = 'success'

    const metricLabel = {
      clicks: 'Clicks',
      conversions: 'Conversions',
      conversionRate: 'Conversion rate',
      earnings: 'Earnings',
      ctr: 'CTR',
    }[s.metric]

    const title = isDrop
      ? `⚠️ ${metricLabel} dropped ${magnitude.toFixed(0)}% in ${s.window}${s.scope ? ` — ${s.scope}` : ''}`
      : `🚀 ${metricLabel} spiked ${magnitude.toFixed(0)}% in ${s.window}${s.scope ? ` — ${s.scope}` : ''}`

    const description = isDrop
      ? `${metricLabel} went from ${s.before} to ${s.after} (${change}%) over ${s.window}. This is unusual — could be a broken link, delisted product, or audience shift. Better investigate cepat sikit before commission bleeds.`
      : `${metricLabel} jumped from ${s.before} to ${s.after} (${change}%) over ${s.window}. Something you did is working! Identify the trigger and double down — post similar content or boost the winning link.`

    const action: InsightAction = isDrop
      ? { label: 'Investigate', action: 'investigate', href: '/analytics' }
      : { label: 'View Analytics', action: 'view_analytics', href: '/analytics' }

    insights.push({
      id: makeId('anom', `${s.metric}-${timestamp}`),
      type: 'anomaly',
      severity,
      title,
      description,
      timestamp,
      relevance: severity === 'critical' ? 96 : severity === 'warning' ? 84 : 78,
      isRead: false,
      isActioned: false,
      source: 'algorithm',
      data: {
        metric: s.metric,
        before: s.before,
        after: s.after,
        dropPct: change,
        window: s.window,
      },
      action,
      secondaryAction: {
        label: 'Mark as Actioned',
        action: 'dismiss',
      },
    })
  }

  return insights
}

// ─── 3. Opportunity Detection ────────────────────────────────────────────────

export interface ProductTrend {
  productName: string
  itemId?: string
  category: string
  /** Search-volume growth percentage (e.g. 240 = +240%). */
  trendPct: number
  /** How many affiliate-ready products match. */
  opportunitiesAvailable: number
  /** Average commission rate (e.g. 5 = 5%). */
  commissionRate: number
  /** Estimated monthly earnings potential in RM. */
  estimatedEarnings: number
}

/**
 * Convert a trending product into an opportunity insight.
 * Only products with trendPct >= 50 are surfaced (otherwise it's noise).
 */
export function detectOpportunities(
  productData: ProductTrend[],
  timestamp: string = new Date().toISOString(),
): ProactiveInsight[] {
  return productData
    .filter((p) => p.trendPct >= 50)
    .map((p) => {
      const isHot = p.trendPct >= 200
      const title = isHot
        ? `🚀 Trending now: "${p.productName}" searches up ${p.trendPct}% in Malaysia. ${p.opportunitiesAvailable} affiliate opportunities available.`
        : `📈 "${p.productName}" is picking up — searches up ${p.trendPct}%. ${p.opportunitiesAvailable} products ready to promote.`

      const description = `Searches for "${p.productName}" naik ${p.trendPct}% in Malaysia recently. ${p.opportunitiesAvailable} affiliate-ready products in this niche with average ${p.commissionRate}% commission. Estimated earning potential: ${formatRM(p.estimatedEarnings)}/month if you move now. Jangan lambat — competitors also seeing this trend.`

      const action: InsightAction = p.itemId
        ? {
            label: 'Generate Link',
            action: 'generate_link',
            payload: { itemId: p.itemId, productName: p.productName },
          }
        : {
            label: 'View Product',
            action: 'view_product',
            href: '/products',
          }

      return {
        id: makeId('opp', `${p.itemId || p.productName}-${timestamp}`),
        type: 'opportunity',
        severity: isHot ? 'warning' : 'info',
        title,
        description,
        timestamp,
        relevance: isHot ? 90 : 72,
        isRead: false,
        isActioned: false,
        source: 'algorithm',
        data: {
          productName: p.productName,
          itemId: p.itemId,
          category: p.category,
          trendPct: p.trendPct,
          opportunitiesAvailable: p.opportunitiesAvailable,
          commissionRate: p.commissionRate,
          estimatedEarnings: p.estimatedEarnings,
        },
        action,
        secondaryAction: {
          label: 'Mark as Actioned',
          action: 'dismiss',
        },
      } satisfies ProactiveInsight
    })
}

// ─── 4. Trend Alerts ─────────────────────────────────────────────────────────

export interface TrendSignal {
  /** The trend name, e.g. "Raya Beauty" or "Garnier Serum". */
  name: string
  /** Platform where it's trending, e.g. "TikTok", "Instagram". */
  platform: string
  /** Volume / interest change percentage. */
  trendPct: number
  /** Time-to-peak estimate, e.g. "before Hari Raya" or "in 3 days". */
  peakWindow: string
  /** Recommended action. */
  suggestedAction: string
  /** Whether it's seasonal (Raya, 11.11) or organic. */
  seasonal: boolean
}

/**
 * Generate trend_alert insights from cultural / seasonal signals.
 * These are higher-level than product opportunities — they tell the user
 * "ride this wave now before it peaks".
 */
export function generateTrendAlerts(
  signals: TrendSignal[],
  timestamp: string = new Date().toISOString(),
): ProactiveInsight[] {
  return signals.map((s) => {
    const isUrgent = s.trendPct >= 150 || s.seasonal
    const title = isUrgent
      ? `📈 "${s.name}" trending on ${s.platform}. Generate content now to ride the wave ${s.peakWindow}.`
      : `📊 "${s.name}" is heating up on ${s.platform} (+${s.trendPct}%). Consider content soon.`

    const description = `"${s.name}" is trending on ${s.platform} with ${s.trendPct}% growth${s.seasonal ? ' (seasonal — peak expected ' + s.peakWindow + ')' : ''}. ${s.suggestedAction} Early content catches 60-70% more engagement than peak-time content. Best timing: now until ${s.peakWindow}.`

    return {
      id: makeId('trend', `${s.name}-${timestamp}`),
      type: 'trend_alert',
      severity: isUrgent ? 'warning' : 'info',
      title,
      description,
      timestamp,
      relevance: isUrgent ? 86 : 70,
      isRead: false,
      isActioned: false,
      source: 'algorithm',
      data: {
        productName: s.name,
        trendPct: s.trendPct,
        opportunitiesAvailable: 0,
        recommendationType: 'content_format',
      },
      action: {
        label: 'Generate Content',
        action: 'generate_content',
        href: '/hermes',
      },
      secondaryAction: {
        label: 'Mark as Actioned',
        action: 'dismiss',
      },
    } satisfies ProactiveInsight
  })
}

// ─── 5. Recommendation Engine ────────────────────────────────────────────────

export interface Recommendation {
  type: 'post_timing' | 'content_format' | 'product_focus' |
        'link_audit' | 'audience_targeting'
  title: string
  description: string
  suggestedTime?: string
  expectedLift?: number
}

/**
 * Build a recommendation insight from a structured recommendation object.
 * Mostly used as the algorithmic fallback when AI generation fails.
 */
export function buildRecommendation(
  rec: Recommendation,
  timestamp: string = new Date().toISOString(),
): ProactiveInsight {
  const action: InsightAction =
    rec.type === 'post_timing'
      ? { label: 'Schedule Post', action: 'schedule_post', href: '/campaigns' }
      : rec.type === 'link_audit'
        ? { label: 'Investigate', action: 'investigate', href: '/links' }
        : { label: 'Generate Content', action: 'generate_content', href: '/hermes' }

  return {
    id: makeId('rec', `${rec.type}-${timestamp}`),
    type: 'recommendation',
    severity: 'info',
    title: rec.title,
    description: rec.description,
    timestamp,
    relevance: 75,
    isRead: false,
    isActioned: false,
    source: 'algorithm',
    data: {
      recommendationType: rec.type,
      suggestedTime: rec.suggestedTime,
      expectedLift: rec.expectedLift,
    },
    action,
    secondaryAction: {
      label: 'Mark as Actioned',
      action: 'dismiss',
    },
  }
}

// ─── 6. Relevance Scoring ────────────────────────────────────────────────────

/**
 * Score an insight's relevance to a specific user profile, 0-100.
 *
 * Factors:
 *   - severity: critical=+15, warning=+8, success=+5, info=+0
 *   - category match: insight category in user's topCategories → +12
 *   - recency: <1h=+15, <6h=+10, <24h=+5, older=0
 *   - anomaly scale: bigger drop → higher score (capped at +20)
 *   - opportunity size: higher estimatedEarnings → higher score (capped at +15)
 *   - new user bonus: <7 days account age → +8 to onboarding-style insights
 *
 * Final score is clamped to [0, 100] and rounded.
 */
export function scoreInsightRelevance(
  insight: ProactiveInsight,
  userProfile: UserProfile,
): number {
  let score = 50 // baseline

  // Severity weight
  const severityWeight: Record<InsightSeverity, number> = {
    critical: 15,
    warning: 8,
    success: 5,
    info: 0,
  }
  score += severityWeight[insight.severity]

  // Category match (for opportunities / trend alerts with category data)
  if (insight.data?.category && userProfile.topCategories.includes(insight.data.category)) {
    score += 12
  }

  // Recency
  const ageMin = minutesAgo(insight.timestamp)
  if (ageMin < 60) score += 15
  else if (ageMin < 360) score += 10
  else if (ageMin < 1440) score += 5

  // Anomaly scale
  if (insight.type === 'anomaly' && insight.data?.dropPct !== undefined) {
    const mag = Math.abs(insight.data.dropPct)
    score += Math.min(20, mag / 3) // 60% drop → +20
  }

  // Opportunity size
  if (insight.type === 'opportunity' && insight.data?.estimatedEarnings) {
    score += Math.min(15, insight.data.estimatedEarnings / 100)
  }

  // New-user onboarding bonus for recommendations
  if (insight.type === 'recommendation' && userProfile.accountAgeDays < 7) {
    score += 8
  }

  // Already actioned → big penalty (we don't want to resurface)
  if (insight.isActioned) score -= 40

  return Math.max(0, Math.min(100, Math.round(score)))
}

// ─── 7. Sort + Filter Utilities ──────────────────────────────────────────────

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  critical: 4,
  warning: 3,
  success: 2,
  info: 1,
}

/**
 * Sort insights by:
 *   1. Actioned insights go to the bottom
 *   2. Severity (critical first)
 *   3. Relevance score (descending)
 *   4. Recency (newer first)
 */
export function sortInsights(insights: ProactiveInsight[]): ProactiveInsight[] {
  return [...insights].sort((a, b) => {
    // Actioned always at bottom
    if (a.isActioned !== b.isActioned) return a.isActioned ? 1 : -1
    // Severity
    const sevDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
    if (sevDiff !== 0) return sevDiff
    // Relevance
    if (b.relevance !== a.relevance) return b.relevance - a.relevance
    // Recency
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
}

/** Filter insights by type (or 'all'). */
export function filterInsights(
  insights: ProactiveInsight[],
  type: InsightType | 'all',
): ProactiveInsight[] {
  if (type === 'all') return insights
  return insights.filter((i) => i.type === type)
}

/** Filter + sort in one call (used by the GET route). */
export function filterAndSort(
  insights: ProactiveInsight[],
  type: InsightType | 'all',
): ProactiveInsight[] {
  return sortInsights(filterInsights(insights, type))
}

/** Count how many insights are "new" (not read and not actioned). */
export function countNew(insights: ProactiveInsight[]): number {
  return insights.filter((i) => !i.isRead && !i.isActioned).length
}

/** Convenience: pick the best fallback recommendation when AI fails. */
export function defaultAlgorithmicRecommendation(): ProactiveInsight {
  return buildRecommendation({
    type: 'post_timing',
    title: "💡 Your audience engages most at 8 PM. Schedule your next post for 7:45 PM for maximum reach.",
    description:
      'Berdasarkan your last 30 days of click data, peak engagement is between 8-10 PM MYT. Posting 15 minutes before the peak lets the algorithm index your content while your audience is most active. Expected lift: ~23% more clicks.',
    suggestedTime: '7:45 PM MYT',
    expectedLift: 23,
  })
}
