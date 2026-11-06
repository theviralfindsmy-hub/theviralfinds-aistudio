/**
 * Auto-Hashtag Optimizer — Type Definitions
 *
 * Models hashtag performance, scoring and suggestion metadata for the
 * Malaysian Shopee / TikTok / Instagram affiliate market.
 *
 * Used by:
 *   - src/lib/hashtags/mock-data.ts
 *   - src/lib/hashtags/scorer.ts
 *   - src/app/api/ai/hashtags/route.ts
 *   - src/components/pages/hashtags-page.tsx
 */

/** Social platforms where hashtags can be used. */
export type HashtagPlatform = 'tiktok' | 'instagram' | 'facebook'

/** Content niches supported by the optimizer. */
export type HashtagNiche = 'beauty' | 'tech' | 'fashion' | 'food' | 'home'

/** Trend direction for a hashtag (last 7-30 days). */
export type TrendDirection = 'up' | 'down' | 'stable'

/**
 * A single hashtag entry in the Malaysian hashtag database.
 * Used for both mock data and (future) real DB records.
 */
export interface Hashtag {
  /** Hashtag without the leading `#`, e.g. `SkincareMY`. */
  tag: string
  /** Platform the metrics apply to (a tag can appear on multiple platforms). */
  platform: HashtagPlatform
  /** Niche this hashtag is most relevant to. */
  niche: HashtagNiche
  /** Estimated 30-day impressions (reach) for posts using this tag. */
  impressions: number
  /** Average clicks per post using this tag. */
  avgClicks: number
  /** Competition intensity 1-10 (1 = low / wide open, 10 = saturated). */
  competition: number
  /** Recent trend direction. */
  trendDirection: TrendDirection
  /** Percentage change over the last 14 days (positive = growing). */
  trendPercent: number
  /** Built-in base relevance score 0-100 for the niche. */
  relevanceScore: number
  /** Free-text description for tooltips / explanations. */
  description?: string
}

/**
 * Aggregated historical performance record for a hashtag the user has
 * actually used in past posts. Drives the analytics dashboard charts.
 */
export interface HashtagPerformance {
  tag: string
  platform: HashtagPlatform
  /** ISO date the post went live (yyyy-mm-dd). */
  date: string
  impressions: number
  clicks: number
  /** Click-through rate (clicks / impressions) as a percentage 0-100. */
  ctr: number
  /** Affiliate conversions attributed to this hashtag. */
  conversions: number
}

/** Breakdown of how a hashtag's overall score was computed. */
export interface HashtagScore {
  /** Normalized reach score 0-100. */
  reach: number
  /** Normalized competition score 0-100 (higher = less competition). */
  competitionScore: number
  /** Normalized relevance score 0-100. */
  relevance: number
  /** Weighted overall score 0-100. */
  overall: number
}

/**
 * A scored hashtag suggestion returned to the dashboard.
 * Includes human-readable explanation for transparency.
 */
export interface HashtagSuggestion extends HashtagScore {
  tag: string
  platform: HashtagPlatform
  niche: HashtagNiche
  impressions: number
  avgClicks: number
  competition: number
  trendDirection: TrendDirection
  trendPercent: number
  /** Plain-English reason this tag ranks where it does. */
  explanation: string
}

/**
 * Per-niche bundle of hashtags, useful for the niche selector and
 * the "explore by niche" view in the analytics dashboard.
 */
export interface NicheHashtags {
  niche: HashtagNiche
  label: string
  /** All tags registered for this niche (any platform). */
  hashtags: Hashtag[]
}

/** Body of POST /api/ai/hashtags */
export interface HashtagOptimizeRequest {
  niche: HashtagNiche
  /** Content keywords the user typed in (free-form tags). */
  contentKeywords: string[]
  platform: HashtagPlatform
}

/** Response of POST /api/ai/hashtags */
export interface HashtagOptimizeResponse {
  niche: HashtagNiche
  platform: HashtagPlatform
  contentKeywords: string[]
  /** Top-N scored suggestions, sorted by overall score desc. */
  suggestions: HashtagSuggestion[]
  /** Where the suggestions came from. */
  source: 'ai' | 'mock'
  /** Optional AI-generated tip shown above the results. */
  aiTip?: string
}

/** Aggregated analytics payload used by the dashboard charts. */
export interface HashtagAnalytics {
  /** Time-series of total hashtag impressions/clicks per week. */
  performanceOverTime: Array<{
    week: string
    impressions: number
    clicks: number
    ctr: number
  }>
  /** Best performing hashtags from the user's history. */
  topPerforming: Array<{
    tag: string
    platform: HashtagPlatform
    totalImpressions: number
    totalClicks: number
    avgCtr: number
    uses: number
  }>
  /** Scatter plot data: each point is one hashtag's competition vs reach. */
  scatter: Array<{
    tag: string
    competition: number
    impressions: number
    niche: HashtagNiche
  }>
  source: 'mock' | 'api'
}
