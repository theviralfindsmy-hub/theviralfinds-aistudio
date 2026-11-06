/**
 * Unified Earnings Dashboard — Mock Data Service
 *
 * Generates realistic 12-month earnings data across Shopee, TikTok Shop,
 * and Lazada for the Malaysian affiliate market (RM currency).
 *
 * Realism assumptions:
 *  - Shopee dominates (~70% share) — RM 13-19k/month range
 *  - TikTok growing rapidly (~20% share) — +15-30% MoM growth
 *  - Lazada steady (~10% share) — RM 1.9-2.9k/month range
 *  - Conversion rates: Shopee 4.2%, TikTok 5.8%, Lazada 3.5%
 *  - 12 months of data covering Jan-Dec 2025
 */

import type {
  AffiliatePlatform,
  EarningsPeriod,
  EarningsTrendPoint,
  PlatformBreakdown,
  PlatformEarning,
  UnifiedEarningsResponse,
  UnifiedEarningsSummary,
} from './types'

/** Brand colors — avoids pure blue per project design rules. */
export const PLATFORM_COLORS: Record<AffiliatePlatform, string> = {
  shopee: '#EE4D2D', // Shopee orange (brand)
  tiktok: '#18181B', // TikTok dark / near-black
  lazada: '#7C3AED', // Lazada purple-violet variant (no pure blue)
}

/** Emoji icons used as mini-icons in cards. */
export const PLATFORM_EMOJI: Record<AffiliatePlatform, string> = {
  shopee: '🛍️',
  tiktok: '🎵',
  lazada: '🛒',
}

/** Display names. */
export const PLATFORM_NAMES: Record<AffiliatePlatform, string> = {
  shopee: 'Shopee',
  tiktok: 'TikTok Shop',
  lazada: 'Lazada',
}

/** Target conversion rates per platform (as percentages). */
const CONVERSION_RATES: Record<AffiliatePlatform, number> = {
  shopee: 4.2,
  tiktok: 5.8,
  lazada: 3.5,
}

/** Average commission per conversion (RM) — used to derive order volume. */
const AVG_COMMISSION: Record<AffiliatePlatform, number> = {
  shopee: 10.0,
  tiktok: 6.0,
  lazada: 8.0,
}

/** Month short labels covering Jan-Dec 2025. */
export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/** Raw monthly earnings (RM) per platform for Jan-Dec 2025. */
export const MONTHLY_EARNINGS: Record<AffiliatePlatform, number[]> = {
  // Shopee: ~RM 13-19k/month, steady growth with sale-season bumps
  shopee: [
    13200, 13800, 15200, 14500, 15300, 16800,
    16100, 17500, 18400, 17800, 18900, 19300,
  ],
  // TikTok: rapid growth +15-30% MoM, starting low
  tiktok: [
    1800, 2100, 2500, 2900, 3400, 4000,
    4600, 5300, 6100, 6900, 7800, 8800,
  ],
  // Lazada: steady, slight upward trend, RM 1.9-2.9k range
  lazada: [
    1900, 2000, 2150, 2050, 2200, 2400,
    2300, 2450, 2600, 2500, 2750, 2900,
  ],
}

/** Number of months covered by each period filter. */
const PERIOD_MONTHS: Record<EarningsPeriod, number> = {
  '30d': 1,
  '90d': 3,
  '12m': 12,
}

/**
 * Compute clicks from earnings using the platform's average commission
 * and target conversion rate.
 */
function deriveClicks(platform: AffiliatePlatform, earnings: number): number {
  const conversions = earnings / AVG_COMMISSION[platform]
  const clicks = conversions / (CONVERSION_RATES[platform] / 100)
  return Math.round(clicks)
}

/**
 * Compute conversions from earnings using the platform's average commission.
 */
function deriveConversions(platform: AffiliatePlatform, earnings: number): number {
  return Math.round(earnings / AVG_COMMISSION[platform])
}

/**
 * Slice the last N months of monthly data and sum the earnings.
 */
function sumLastMonths(values: number[], months: number): number {
  const sliced = values.slice(-months)
  return sliced.reduce((acc, v) => acc + v, 0)
}

/**
 * Month-over-month change percentage for the most recent month vs the
 * month prior. Returns 0 when insufficient history.
 */
function computeMomChange(values: number[]): number {
  if (values.length < 2) return 0
  const current = values[values.length - 1]
  const previous = values[values.length - 2]
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Build a 12-month trend array of EarningsTrendPoint.
 * Always returns all 12 months regardless of selected period — the API
 * consumer can slice as needed. We still return the full set so the
 * cross-platform trend chart always has rich context.
 */
export function buildTrend(): EarningsTrendPoint[] {
  return MONTH_LABELS.map((label, idx) => {
    const shopee = MONTHLY_EARNINGS.shopee[idx]
    const tiktok = MONTHLY_EARNINGS.tiktok[idx]
    const lazada = MONTHLY_EARNINGS.lazada[idx]
    return {
      date: label,
      shopee,
      tiktok,
      lazada,
      total: shopee + tiktok + lazada,
    }
  })
}

/**
 * Build the per-platform aggregate (PlatformEarning) for the chosen period.
 */
function buildPlatformEarning(
  platform: AffiliatePlatform,
  period: EarningsPeriod,
): PlatformEarning {
  const months = PERIOD_MONTHS[period]
  const monthly = MONTHLY_EARNINGS[platform]
  const earnings = sumLastMonths(monthly, months)
  const clicks = deriveClicks(platform, earnings)
  const conversions = deriveConversions(platform, earnings)
  return {
    platform,
    platformName: PLATFORM_NAMES[platform],
    emoji: PLATFORM_EMOJI[platform],
    earnings,
    clicks,
    conversions,
    conversionRate: CONVERSION_RATES[platform],
    momChange: computeMomChange(monthly),
    sparkline: [...monthly], // always full 12-month context for the sparkline
    color: PLATFORM_COLORS[platform],
  }
}

/**
 * Build the top-line UnifiedEarningsSummary for the chosen period.
 */
function buildSummary(
  platforms: PlatformEarning[],
  period: EarningsPeriod,
): UnifiedEarningsSummary {
  const totalEarnings = platforms.reduce((acc, p) => acc + p.earnings, 0)
  const totalClicks = platforms.reduce((acc, p) => acc + p.clicks, 0)
  const totalConversions = platforms.reduce((acc, p) => acc + p.conversions, 0)
  const avgConversionRate =
    totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  return {
    totalEarnings,
    totalClicks,
    totalConversions,
    avgConversionRate,
    platformCount: platforms.length,
    period,
  }
}

/**
 * Build the pie-chart-friendly PlatformBreakdown array.
 */
function buildBreakdown(platforms: PlatformEarning[]): PlatformBreakdown[] {
  const total = platforms.reduce((acc, p) => acc + p.earnings, 0)
  return platforms.map((p) => ({
    platform: p.platform,
    name: p.platformName,
    value: p.earnings,
    share: total > 0 ? (p.earnings / total) * 100 : 0,
    color: p.color,
  }))
}

/**
 * Build the complete unified earnings response for the requested period.
 * Always returns `source: 'mock'` (real API integration comes later).
 */
export function buildUnifiedEarningsResponse(
  period: EarningsPeriod,
): UnifiedEarningsResponse {
  const allPlatforms: AffiliatePlatform[] = ['shopee', 'tiktok', 'lazada']
  const byPlatform = allPlatforms.map((p) => buildPlatformEarning(p, period))
  const summary = buildSummary(byPlatform, period)
  const breakdown = buildBreakdown(byPlatform)
  const trend = buildTrend()
  return {
    summary,
    byPlatform,
    breakdown,
    trend,
    source: 'mock',
    period,
  }
}

/**
 * Convenience: full 12-month aggregate totals (used for sanity checks and
 * the "all-time" snapshot, if needed).
 */
export const TOTALS_12M = {
  shopee: MONTHLY_EARNINGS.shopee.reduce((a, b) => a + b, 0),
  tiktok: MONTHLY_EARNINGS.tiktok.reduce((a, b) => a + b, 0),
  lazada: MONTHLY_EARNINGS.lazada.reduce((a, b) => a + b, 0),
} as const
