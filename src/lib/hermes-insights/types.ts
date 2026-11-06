/**
 * HERMES Proactive Insights — Shared Type Definitions
 *
 * These types are used by:
 *   - src/lib/hermes-insights/generator.ts   (algorithms that build insights)
 *   - src/lib/hermes-insights/mock-data.ts   (realistic MY-context demo data)
 *   - src/app/api/hermes/insights/*          (API routes — server only)
 *   - src/components/pages/hermes-insights-section.tsx (UI component)
 *
 * Proactive insights are pushed to the user WITHOUT being asked — they include
 * daily summaries, anomaly detection, opportunity alerts, trend alerts, and
 * AI recommendations. Think of them as the agent tapping you on the shoulder.
 */

/** The 5 categories of proactive insight the HERMES agent can surface. */
export type InsightType =
  | 'daily_summary'   // 🟢 End-of-day performance recap vs yesterday
  | 'anomaly'         // 🔴 Unusual spike or drop (>20% change) detected
  | 'opportunity'     // 🟡 Trending product / niche ready to monetise
  | 'trend_alert'     // 🔵 Emerging cultural / seasonal trend to ride
  | 'recommendation'  // 🟣 AI-suggested action (best time to post, etc.)

/** Visual + behavioural severity used for colour-coding and prioritisation. */
export type InsightSeverity =
  | 'info'      // neutral update (most daily summaries)
  | 'success'   // positive news (earnings up, goal hit)
  | 'warning'   // something to watch (gradual decline)
  | 'critical'  // act now (broken links, conversion collapse)

/**
 * An actionable CTA attached to an insight.
 * e.g. "View Product" → /products/123, "Investigate" → /analytics,
 *      "Generate Content" → /hermes?task=content
 */
export interface InsightAction {
  /** Button label, e.g. "View Product", "Investigate", "Generate Content". */
  label: string
  /** Internal action key the frontend can switch on. */
  action: 'view_product' | 'investigate' | 'generate_content' |
          'generate_link' | 'schedule_post' | 'view_analytics' |
          'view_earnings' | 'dismiss'
  /** Optional href for navigation actions. */
  href?: string
  /** Optional payload (e.g. itemId for generate_link). */
  payload?: Record<string, string | number | boolean>
}

/** A single proactive insight pushed by HERMES. */
export interface ProactiveInsight {
  /** Stable unique id (cuid when DB-backed, mock-XX when from mock data). */
  id: string
  /** Which category of insight this is. */
  type: InsightType
  /** Severity drives colour + sort priority. */
  severity: InsightSeverity
  /** Short punchy headline (max ~80 chars), often with emoji. */
  title: string
  /** 1-3 sentence body with concrete numbers + Manglish flavour. */
  description: string
  /** ISO timestamp the insight was generated / detected. */
  timestamp: string
  /** Relevance score 0-100 (higher = more important to this user right now). */
  relevance: number
  /** Whether the user has dismissed / actioned this insight. */
  isRead: boolean
  isActioned: boolean
  /** Where this insight came from — required on every API response. */
  source: 'mock' | 'ai' | 'algorithm'
  /** Optional structured payload for rich card rendering. */
  data?: InsightData
  /** Optional primary CTA. */
  action?: InsightAction
  /** Optional secondary CTA (usually "Mark as Actioned"). */
  secondaryAction?: InsightAction
}

/**
 * Structured payload attached to specific insight types so the UI can render
 * rich cards (mini-stats, before/after comparisons, product previews).
 */
export interface InsightData {
  // ── daily_summary ────────────────────────────────────────────────
  today?: {
    clicks: number
    conversions: number
    earnings: number        // in RM
    conversionRate: number  // percentage
  }
  yesterday?: {
    clicks: number
    conversions: number
    earnings: number
    conversionRate: number
  }
  /** Percentage change vs yesterday (positive = up). */
  changePct?: {
    clicks?: number
    conversions?: number
    earnings?: number
  }

  // ── anomaly ──────────────────────────────────────────────────────
  metric?: 'clicks' | 'conversions' | 'conversionRate' | 'earnings' | 'ctr'
  before?: number
  after?: number
  /** Percentage change that triggered the anomaly (always negative for drop). */
  dropPct?: number
  /** Time window the anomaly was detected over, e.g. "last 3 hours". */
  window?: string

  // ── opportunity / trend_alert ────────────────────────────────────
  productName?: string
  itemId?: string
  category?: string
  /** Search-volume or interest change percentage. */
  trendPct?: number
  /** How many affiliate-ready products match this trend. */
  opportunitiesAvailable?: number
  /** Average commission rate for the opportunity. */
  commissionRate?: number
  /** Estimated earnings potential in RM. */
  estimatedEarnings?: number

  // ── recommendation ───────────────────────────────────────────────
  recommendationType?: 'post_timing' | 'content_format' | 'product_focus' |
                        'link_audit' | 'audience_targeting'
  suggestedTime?: string  // e.g. "7:45 PM MYT"
  expectedLift?: number   // percentage uplift expected
}

/** Lightweight user profile used by scoreInsightRelevance. */
export interface UserProfile {
  /** Top-performing product categories for this user. */
  topCategories: string[]
  /** Whether the user has connected Shopee API (real data available). */
  hasShopeeApi: boolean
  /** Average daily clicks (used to scale anomaly relevance). */
  avgDailyClicks: number
  /** Preferred posting hour 0-23 MYT. */
  peakHour: number
  /** Days since signup — newer users get more onboarding insights. */
  accountAgeDays: number
}

/** Shape of the GET /api/hermes/insights response. */
export interface InsightsListResponse {
  insights: ProactiveInsight[]
  count: number
  newCount: number
  generatedAt: string
  source: 'mock' | 'ai' | 'algorithm' | 'mixed'
}

/** Shape of the POST /api/hermes/insights/generate response. */
export interface GenerateInsightResponse {
  insight: ProactiveInsight
  source: 'ai' | 'algorithm'
  generatedAt: string
}

/** Filter query param shape for GET /api/hermes/insights?type=... */
export type InsightTypeFilter = InsightType | 'all'
