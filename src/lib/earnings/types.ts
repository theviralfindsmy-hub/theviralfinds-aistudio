/**
 * Unified Earnings Dashboard — Type Definitions
 *
 * Aggregates earnings from Shopee, TikTok Shop, and Lazada into a single
 * unified view. Malaysian market context (RM currency, en-MY locale).
 */

/** Supported affiliate platforms in the unified view. */
export type AffiliatePlatform = 'shopee' | 'tiktok' | 'lazada'

/** Time period filter supported by the unified earnings API. */
export type EarningsPeriod = '30d' | '90d' | '12m'

/** A single platform's earnings record for one period. */
export interface PlatformEarning {
  platform: AffiliatePlatform
  /** Display name e.g. "Shopee", "TikTok Shop", "Lazada" */
  platformName: string
  /** Emoji or short label used as a mini-icon */
  emoji: string
  /** Total earnings in RM for the selected period */
  earnings: number
  /** Total clicks for the selected period */
  clicks: number
  /** Total conversions (orders) for the selected period */
  conversions: number
  /** Conversion rate as a percentage (0-100) */
  conversionRate: number
  /** Month-over-month change as a percentage (positive = growth) */
  momChange: number
  /** 12-month sparkline data points (RM per month) */
  sparkline: number[]
  /** Brand color (hex) for chart rendering */
  color: string
}

/** Top-line summary across all platforms for the selected period. */
export interface UnifiedEarningsSummary {
  /** Sum of earnings across all platforms (RM) */
  totalEarnings: number
  /** Sum of clicks across all platforms */
  totalClicks: number
  /** Sum of conversions across all platforms */
  totalConversions: number
  /** Average conversion rate weighted by clicks (0-100) */
  avgConversionRate: number
  /** Number of platforms with active earnings data */
  platformCount: number
  /** Period this summary covers */
  period: EarningsPeriod
}

/** A single point in the cross-platform earnings trend (monthly). */
export interface EarningsTrendPoint {
  /** Short month label e.g. "Jan", "Feb" */
  date: string
  /** Shopee earnings for the month (RM) */
  shopee: number
  /** TikTok earnings for the month (RM) */
  tiktok: number
  /** Lazada earnings for the month (RM) */
  lazada: number
  /** Total earnings for the month across all platforms (RM) */
  total: number
}

/** Pie-chart friendly breakdown by platform. */
export interface PlatformBreakdown {
  platform: AffiliatePlatform
  /** Display name */
  name: string
  /** Earnings in RM */
  value: number
  /** Share of total earnings as a percentage (0-100) */
  share: number
  /** Brand color hex */
  color: string
}

/** Full response shape returned by the `/api/earnings/unified` endpoint. */
export interface UnifiedEarningsResponse {
  summary: UnifiedEarningsSummary
  byPlatform: PlatformEarning[]
  breakdown: PlatformBreakdown[]
  trend: EarningsTrendPoint[]
  source: 'mock' | 'api'
  period: EarningsPeriod
}
