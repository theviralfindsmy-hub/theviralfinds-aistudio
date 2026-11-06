/**
 * AI Product Recommender — Scoring Algorithm
 *
 * Final score (0-100) is a weighted blend:
 *   total = audience * 0.40 + commission * 0.30 + trend * 0.20 + gap * 0.10
 *
 * All sub-scores are 0-100 so the weighted sum stays in [0, 100].
 */

import type {
  AudienceProfile,
  Recommendation,
  RecommendationExplanation,
  RecommendationScore,
  RecommendableProduct,
} from './types'
import { MOCK_EXPLANATIONS } from './mock-data'

// ─── Helpers ───────────────────────────────────────────────────

const clamp = (n: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, n))

const round1 = (n: number): number => Math.round(n * 10) / 10

/**
 * Normalise a raw platform category string into a lowercase token
 * we can match against the audience's `topCategories`.
 *
 * e.g. "Beauty & Health" → "beauty", "Home & Living" → "home",
 *      "Food & Beverages" → "food", "Toys & Games" → "baby/toys".
 */
function unifyCategory(raw: string): string {
  const s = raw.toLowerCase().trim()
  if (s.includes('beauty') || s.includes('health')) return 'beauty'
  if (s.includes('fashion') || s.includes('cloth')) return 'fashion'
  if (s.includes('electronic') || s.includes('gadget') || s.includes('phone'))
    return 'electronics'
  if (s.includes('home') || s.includes('living') || s.includes('kitchen'))
    return 'home'
  if (s.includes('food') || s.includes('beverage') || s.includes('grocery'))
    return 'food'
  if (s.includes('baby') || s.includes('kid') || s.includes('toy')) return 'baby'
  if (s.includes('sport') || s.includes('fitness') || s.includes('outdoor'))
    return 'sports'
  if (s.includes('automotive') || s.includes('car')) return 'automotive'
  return s.split(/\s+/)[0] || 'other'
}

/**
 * Pick the strongest audience category weight that matches this product's category.
 * Falls back to 0 if no overlap.
 */
function audienceCategoryWeight(
  product: RecommendableProduct,
  audience: AudienceProfile,
): { category: string; weight: number } {
  const productCat = unifyCategory(product.category)
  let best = { category: productCat, weight: 0 }
  for (const cw of audience.topCategories) {
    const cat = unifyCategory(cw.category)
    if (cat === productCat && cw.weight > best.weight) {
      best = { category: cat, weight: cw.weight }
    }
  }
  return best
}

// ─── 1. Audience Match (40%) ───────────────────────────────────

/**
 * Score how well a product matches the audience persona.
 *
 * Combines:
 *   - category affinity (50%) — based on audience.topCategories weight
 *   - price sensitivity fit (20%) — does the price fit the audience's wallet?
 *   - rating quality (15%) — audiences trust highly-rated products more
 *   - shop reliability (15%) — sales count as a proxy for shop trust
 */
export function scoreAudienceMatch(
  product: RecommendableProduct,
  audience: AudienceProfile,
): number {
  // 1. Category affinity (50%)
  const { weight: catWeight } = audienceCategoryWeight(product, audience)
  const categoryScore = clamp(catWeight, 0, 100)

  // 2. Price sensitivity fit (20%)
  // Map priceSensitivity (1-5) to ideal price range:
  //   1 (luxury)      → RM 300+ is best
  //   2               → RM 100-300 best
  //   3               → RM 50-150 best
  //   4               → RM 20-80 best
  //   5 (price-sensitive) → RM 5-50 best
  const idealRanges: Record<number, [number, number]> = {
    1: [300, 3000],
    2: [100, 400],
    3: [50, 200],
    4: [20, 100],
    5: [5, 60],
  }
  const [minIdeal, maxIdeal] = idealRanges[audience.priceSensitivity] ?? [20, 200]
  let priceScore: number
  if (product.price >= minIdeal && product.price <= maxIdeal) {
    priceScore = 100
  } else if (product.price < minIdeal) {
    // Cheaper than ideal — still good for budget-conscious audiences
    const ratio = product.price / minIdeal
    priceScore = clamp(60 + ratio * 40, 60, 95)
  } else {
    // More expensive than ideal — steep penalty
    const ratio = maxIdeal / product.price
    priceScore = clamp(ratio * 80, 10, 70)
  }

  // 3. Rating quality (15%) — 5.0 = 100, 4.0 = 80, 3.0 = 60, etc.
  const ratingScore = clamp((product.rating / 5) * 100, 0, 100)

  // 4. Shop reliability (15%) — proxy from sales count
  // 5000+ sales = 100, 1000 = 80, 100 = 50, 10 = 20, 0 = 0
  const salesScore = clamp(
    product.sales >= 5000
      ? 100
      : product.sales >= 1000
        ? 80
        : product.sales >= 100
          ? 50
          : product.sales >= 10
            ? 20
            : 0,
    0,
    100,
  )

  const total =
    categoryScore * 0.5 +
    priceScore * 0.2 +
    ratingScore * 0.15 +
    salesScore * 0.15

  return clamp(round1(total))
}

// ─── 2. Commission (30%) ───────────────────────────────────────

/**
 * Score commission attractiveness.
 *
 * Uses BOTH commission rate % AND absolute commission amount in RM:
 *   - Rate: 10%+ = 100, 5% = 70, 3% = 40, 1% = 15, 0% = 0
 *   - Amount: RM 10+ = 100, RM 5 = 75, RM 2 = 50, RM 0.50 = 25, RM 0 = 0
 *
 * Final = max(rateScore, amountScore * 0.6 + rateScore * 0.4)
 * (This favours high-rate products but rewards high-amount ones too.)
 */
export function scoreCommission(product: RecommendableProduct): number {
  const rate = product.commissionRate
  const amount = product.commissionAmount

  // Rate score (logarithmic curve so 10% feels saturated)
  const rateScore = clamp(
    rate >= 15
      ? 100
      : rate >= 10
        ? 92
        : rate >= 7
          ? 80
          : rate >= 5
            ? 68
            : rate >= 3
              ? 48
              : rate >= 1
                ? 25
                : 5,
    0,
    100,
  )

  // Amount score
  const amountScore = clamp(
    amount >= 15
      ? 100
      : amount >= 10
        ? 88
        : amount >= 5
          ? 72
        : amount >= 2
          ? 52
          : amount >= 0.5
            ? 30
            : 8,
    0,
    100,
  )

  const total = Math.max(rateScore * 0.6 + amountScore * 0.4, rateScore * 0.85)
  return clamp(round1(total))
}

// ─── 3. Trend (20%) ────────────────────────────────────────────

/**
 * Score trend / sales velocity.
 *
 * Uses product.sales as a proxy for current demand, plus optional trendScore
 * (TikTok products carry one).
 *
 *   - sales >= 10000 → 100
 *   - sales >= 5000  → 88
 *   - sales >= 2000  → 75
 *   - sales >= 500   → 60
 *   - sales >= 100   → 42
 *   - sales >= 10    → 25
 *   - sales < 10     → 10
 *
 * If a trendScore (0-100) is provided, blend it 60/40 with sales.
 */
export function scoreTrend(product: RecommendableProduct): number {
  const salesScore = clamp(
    product.sales >= 10000
      ? 100
      : product.sales >= 5000
        ? 88
        : product.sales >= 2000
          ? 75
          : product.sales >= 500
            ? 60
            : product.sales >= 100
              ? 42
              : product.sales >= 10
                ? 25
                : 10,
    0,
    100,
  )

  if (typeof product.trendScore === 'number' && product.trendScore > 0) {
    const blended = salesScore * 0.6 + product.trendScore * 0.4
    return clamp(round1(blended))
  }

  return clamp(round1(salesScore))
}

// ─── 4. Gap Analysis (10%) ─────────────────────────────────────

/**
 * Score "gap analysis" — how undersaturated this niche is for this audience.
 *
 * Logic:
 *   - If the product's category is NOT in the audience's top-2 categories,
 *     it's an "untapped niche" → high gap score (encourage diversification).
 *   - If it IS in the top-2, gap score depends on sales: a high-sales product
 *     in a saturated niche = low gap; a low-sales product in the top niche
 *     = moderate gap (it's an opportunity within the niche).
 *   - Mid-tier products (in the audience's category list but not top-2) get
 *     a moderate gap score.
 *
 * Inverts the audience match partially — we want the recommender to surface
 * products the affiliate MIGHT be overlooking.
 */
export function scoreGap(
  product: RecommendableProduct,
  audience: AudienceProfile,
): number {
  const productCat = unifyCategory(product.category)
  const topCats = audience.topCategories.slice(0, 2).map((c) => unifyCategory(c.category))
  const allCats = audience.topCategories.map((c) => unifyCategory(c.category))

  const inTop2 = topCats.includes(productCat)
  const inAny = allCats.includes(productCat)

  if (!inAny) {
    // Untapped niche for this audience — highest gap score
    // But still reward high quality (rating + sales) so we don't recommend junk
    const qualityBoost = clamp(
      (product.rating / 5) * 60 + (product.sales >= 100 ? 30 : 0) + (product.commissionRate >= 5 ? 10 : 0),
      0,
      100,
    )
    return clamp(round1(qualityBoost))
  }

  if (!inTop2) {
    // Mid-tier — moderate gap, scales with product quality
    const midScore = clamp(
      50 + (product.rating / 5) * 30 + (product.commissionRate >= 5 ? 15 : 0) + (product.sales >= 500 ? 5 : 0),
      0,
      100,
    )
    return clamp(round1(midScore))
  }

  // In top-2 — gap is small UNLESS sales are low (then it's an opportunity within the niche)
  if (product.sales < 500) {
    // Opportunity within the niche: high quality + low sales = niche gap
    return clamp(round1(50 + (product.rating / 5) * 30))
  }
  // Saturated niche hit — low gap score
  return clamp(round1(20 + (product.rating / 5) * 15))
}

// ─── Combined Score + Explanation ──────────────────────────────

export const RECOMMENDATION_WEIGHTS = {
  audience: 0.4,
  commission: 0.3,
  trend: 0.2,
  gap: 0.1,
} as const

export const ALGORITHM_VERSION = '1.0.0'

export function calculateScores(
  product: RecommendableProduct,
  audience: AudienceProfile,
): RecommendationScore {
  const audienceScore = scoreAudienceMatch(product, audience)
  const commissionScore = scoreCommission(product)
  const trendScore = scoreTrend(product)
  const gapScore = scoreGap(product, audience)

  const total =
    audienceScore * RECOMMENDATION_WEIGHTS.audience +
    commissionScore * RECOMMENDATION_WEIGHTS.commission +
    trendScore * RECOMMENDATION_WEIGHTS.trend +
    gapScore * RECOMMENDATION_WEIGHTS.gap

  return {
    audience: audienceScore,
    commission: commissionScore,
    trend: trendScore,
    gap: gapScore,
    total: clamp(round1(total)),
  }
}

function formatHour12(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  let h12 = hour % 12
  if (h12 === 0) h12 = 12
  return `${h12}:00 ${period}`
}

function formatPeakHours(hours: number[]): string {
  if (hours.length === 0) return 'anytime'
  const start = hours[0]
  const end = hours[hours.length - 1]
  return `${formatHour12(start)} – ${formatHour12(end)}`
}

/**
 * Build the natural-language explanation for a recommendation.
 * Falls back to persona-specific templates from mock-data.ts.
 */
export function buildExplanation(
  product: RecommendableProduct,
  audience: AudienceProfile,
  score: RecommendationScore,
): RecommendationExplanation {
  // Trend percentage (rough proxy: trendScore 0-100 → 0-100% growth)
  const trendPct = Math.round(
    (typeof product.trendScore === 'number' ? product.trendScore : score.trend) * 0.6,
  )

  const dimensions = {
    audience:
      score.audience >= 80
        ? `High audience match (${score.audience}%) — ${audience.name} clicks ${audience.clickThroughRate >= 0.08 ? '3x' : '2x'} more on ${unifyCategory(product.category)} at ${formatPeakHours(audience.peakHours)}.`
        : score.audience >= 60
          ? `Moderate audience match (${score.audience}%) — solid fit for ${audience.name}.`
          : `Lower audience match (${score.audience}%) — stretching the audience's interests.`,
    commission:
      score.commission >= 80
        ? `Commission XTRA ${product.commissionRate}% available — RM${product.commissionAmount.toFixed(2)} per sale.`
        : score.commission >= 60
          ? `Healthy ${product.commissionRate}% commission — RM${product.commissionAmount.toFixed(2)} per sale.`
          : `Modest ${product.commissionRate}% commission — RM${product.commissionAmount.toFixed(2)} per sale.`,
    trend:
      score.trend >= 80
        ? `Trending +${trendPct}% this week — ${product.sales.toLocaleString()} sold.`
        : score.trend >= 60
          ? `Steady sales velocity — ${product.sales.toLocaleString()} sold.`
          : `Low sales velocity — ${product.sales.toLocaleString()} sold.`,
    gap:
      score.gap >= 75
        ? `Undersaturated niche for ${audience.name} — first-mover advantage.`
        : score.gap >= 50
          ? `Moderate gap — some room to differentiate.`
          : `Saturated niche — competition is fierce.`,
  }

  const bullets = [
    dimensions.audience,
    dimensions.commission,
    dimensions.trend,
    dimensions.gap,
  ]

  // Persona-specific summary using the mock template
  const summaryFn = MOCK_EXPLANATIONS[audience.id]
  const summary = summaryFn
    ? summaryFn(product.name, Math.round(score.audience), trendPct, product.commissionRate)
    : `Score ${score.total}/100 — ${dimensions.audience} ${dimensions.trend}`

  const suggestedPostTime = formatHour12(audience.peakHours[0] ?? 20)

  return {
    summary,
    bullets,
    dimensions,
    suggestedPostTime,
  }
}

/**
 * Full recommendation pipeline for one product.
 */
export function calculateRecommendation(
  product: RecommendableProduct,
  audience: AudienceProfile,
  rank = 0,
): Recommendation {
  const score = calculateScores(product, audience)
  const explanation = buildExplanation(product, audience, score)

  return {
    id: `rec-${audience.id}-${product.id}`,
    product,
    score,
    explanation,
    isTopPick: false, // set by the ranker below
    rank,
  }
}

/**
 * Rank and mark top picks (top 3 by score).
 */
export function rankRecommendations(
  recs: Recommendation[],
): Recommendation[] {
  const sorted = [...recs].sort((a, b) => b.score.total - a.score.total)
  return sorted.map((r, i) => ({
    ...r,
    rank: i + 1,
    isTopPick: i < 3,
  }))
}
