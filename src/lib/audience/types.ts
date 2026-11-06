/**
 * AI Audience Analyzer — Type definitions
 * Fasa 3.6 — TheViralFindsMY
 *
 * Aggregates click data into audience segments and produces
 * actionable content suggestions for Malaysian affiliate marketers.
 */

/** Single demographic slice (age / gender / location / device). */
export interface DemographicSlice {
  /** Stable key (e.g. "25-34", "female", "kuala-lumpur", "mobile"). */
  key: string
  /** Human-friendly label rendered in the UI. */
  label: string
  /** Share of total audience, 0-100. */
  percentage: number
  /** Absolute unique-clicker count backing this slice. */
  count: number
}

/** Full demographics breakdown used by the dashboard. */
export interface DemographicsBreakdown {
  ageRanges: DemographicSlice[]
  genders: DemographicSlice[]
  locations: DemographicSlice[]
  devices: DemographicSlice[]
}

/** One row in the interest affinity map (radar chart). */
export interface InterestEntry {
  /** Human label, e.g. "Beauty", "Tech". */
  interest: string
  /** Affinity score 0-100 (higher = more engaged). */
  affinity: number
  /** Click volume contributed by this interest. */
  clicks: number
  /** Estimated engagement lift vs baseline, as percentage. */
  engagementLift: number
}

/** Collection of interest entries ranked by affinity. */
export interface InterestMap {
  totalInterests: number
  topInterest: string
  entries: InterestEntry[]
}

/**
 * Active-hours heatmap cell.
 * `density` is normalised 0-100 for color intensity.
 */
export interface HeatmapCell {
  /** 0 (Sun) - 6 (Sat). */
  day: number
  /** 0-23 (hour in MYT). */
  hour: number
  /** Raw click count for this slot. */
  clicks: number
  /** Normalised intensity 0-100. */
  density: number
}

/** 7 rows × 24 cols grid of click-density cells. */
export interface ActiveHoursHeatmap {
  /** 168 cells (7 × 24), ordered by day then hour. */
  cells: HeatmapCell[]
  /** Hour-of-day with highest aggregate density, 0-23. */
  peakHour: number
  /** Day-of-week with highest aggregate density, 0-6. */
  peakDay: number
  /** Total clicks covered by the heatmap. */
  totalClicks: number
}

/** One AI / algorithmic content suggestion for the affiliate. */
export interface ContentSuggestion {
  /** Stable id. */
  id: string
  /** Short headline, e.g. "Your audience likes beauty content at 8 PM". */
  title: string
  /** 1-2 sentence explanation backed by audience data. */
  explanation: string
  /** Suggested content format / hook. */
  format: 'short_video' | 'live_stream' | 'carousel' | 'story' | 'blog_post'
  /** Best time-of-day to publish (MYT hour). */
  bestTime: string
  /** Expected engagement lift percentage (heuristic). */
  expectedLift: number
  /** Niche tags that triggered the suggestion. */
  tags: string[]
}

/** A logical audience segment (e.g. "Beauty Lovers", "Late-Night Shoppers"). */
export interface AudienceSegment {
  id: string
  name: string
  description: string
  size: number
  sharePercentage: number
  avgEngagement: number
  topInterest: string
}

/** Month-over-month audience trend point. */
export interface AudienceTrendPoint {
  /** YYYY-MM. */
  month: string
  /** Short label, e.g. "Jan". */
  label: string
  /** Cumulative unique audience size at month end. */
  audienceSize: number
  /** Net new audience members that month. */
  newMembers: number
  /** Engagement rate for the month, 0-100. */
  engagementRate: number
}

/** Top-line audience summary stats. */
export interface AudienceSummary {
  totalAudienceSize: number
  avgEngagementRate: number
  topInterest: string
  peakHour: number
  peakHourLabel: string
  activeSegments: number
  monthOverMonthGrowth: number
}

/** Full audience profile returned by the API. */
export interface AudienceProfile {
  summary: AudienceSummary
  demographics: DemographicsBreakdown
  interests: InterestMap
  heatmap: ActiveHoursHeatmap
  segments: AudienceSegment[]
  suggestions: ContentSuggestion[]
  trend: AudienceTrendPoint[]
  /** When the profile was generated. */
  generatedAt: string
  /** Optional niche filter applied to the analysis. */
  niche?: string
}

/** API response envelope (always carries `source`). */
export interface AudienceApiResponse {
  profile: AudienceProfile
  source: 'mock' | 'ai'
  /** True when the algorithmic fallback was used. */
  fallback?: boolean
}

/** POST body for refining the analysis by niche. */
export interface AudienceRefineRequest {
  niche?: string
}
