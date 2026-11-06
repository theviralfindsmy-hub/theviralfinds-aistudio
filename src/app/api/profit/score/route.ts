import { NextRequest, NextResponse } from 'next/server'
import { validateBody, profitScoreSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

// ─── Category average conversion rates (Shopee MY) ────────────────────────────
const CATEGORY_CONVERSION: Record<string, number> = {
  electronics: 2.5,
  beauty: 4.5,
  fashion: 3.8,
  health: 3.2,
  home_living: 3.0,
  mobile_gadgets: 2.8,
  food_beverage: 5.0,
  toys_kids: 3.5,
  sports: 2.9,
  automotive: 2.2,
  books_stationery: 3.6,
  pet: 4.2,
  general: 3.0,
}

// ─── Category competition levels (1=low, 10=high) ────────────────────────────
const CATEGORY_COMPETITION: Record<string, number> = {
  electronics: 8,
  beauty: 9,
  fashion: 9,
  health: 6,
  home_living: 5,
  mobile_gadgets: 8,
  food_beverage: 4,
  toys_kids: 5,
  sports: 4,
  automotive: 3,
  books_stationery: 3,
  pet: 3,
  general: 5,
}

// ─── Commission rate benchmarks for scoring ───────────────────────────────────
// Shopee MY: base 2.5%–12%, XTRA up to 50%
function scoreCommissionRate(rate: number): number {
  // Normalize: 2.5% → 0, 12% → 80, 50% → 100
  if (rate <= 2.5) return 5
  if (rate >= 50) return 100
  if (rate <= 12) return ((rate - 2.5) / (12 - 2.5)) * 80
  return 80 + ((rate - 12) / (50 - 12)) * 20
}

function scoreConversionRate(convRate: number): number {
  // 0% → 0, 5% → 80, 10%+ → 100
  if (convRate <= 0) return 0
  if (convRate >= 10) return 100
  if (convRate <= 5) return (convRate / 5) * 80
  return 80 + ((convRate - 5) / 5) * 20
}

function scoreAOV(price: number): number {
  // Higher price → more commission per sale
  // RM5 → 10, RM50 → 50, RM200 → 85, RM500+ → 100
  if (price <= 5) return 10
  if (price >= 500) return 100
  if (price <= 50) return 10 + ((price - 5) / 45) * 40
  if (price <= 200) return 50 + ((price - 50) / 150) * 35
  return 85 + ((price - 200) / 300) * 15
}

function scoreCompetition(level: number): number {
  // Lower competition → higher score
  // 1 → 100, 10 → 10
  return Math.max(10, 110 - level * 10)
}

function scoreSalesVolume(sales: number): number {
  // 0 → 0, 100 → 40, 1000 → 70, 10000+ → 100
  if (sales <= 0) return 0
  if (sales >= 10000) return 100
  if (sales <= 100) return (sales / 100) * 40
  if (sales <= 1000) return 40 + ((sales - 100) / 900) * 30
  return 70 + ((sales - 1000) / 9000) * 30
}

function scoreTrend(rating: number, sales: number): number {
  // Estimate trend from rating + sales momentum
  // High rating + growing sales = better trend
  const ratingScore = Math.min(100, (rating / 5) * 70)
  const momentumScore = sales > 500 ? 30 : sales > 100 ? 20 : sales > 20 ? 10 : 5
  return Math.min(100, ratingScore + momentumScore)
}

function getLevel(score: number): { level: string; emoji: string; color: string } {
  if (score >= 80) return { level: 'HOT', emoji: '🔥', color: '#22c55e' }
  if (score >= 60) return { level: 'GOOD', emoji: '✅', color: '#eab308' }
  if (score >= 40) return { level: 'AVERAGE', emoji: '⚠️', color: '#f97316' }
  return { level: 'SKIP', emoji: '❌', color: '#ef4444' }
}

function getRecommendation(score: number, breakdown: Record<string, number>, product: ProductInput): string {
  const parts: string[] = []

  if (score >= 80) {
    parts.push('🔥 This product has excellent profit potential! Promote it immediately.')
  } else if (score >= 60) {
    parts.push('✅ This product is worth promoting with good earning potential.')
  } else if (score >= 40) {
    parts.push('⚠️ This product has average profitability. Consider your strategy carefully.')
  } else {
    parts.push('❌ This product has low profit potential. Consider alternatives.')
  }

  if (breakdown.commission < 50) {
    parts.push(`Commission rate of ${product.commissionRate}% is below average — look for XTRA commission products to boost earnings.`)
  }
  if (breakdown.commission >= 70) {
    parts.push(`Strong commission rate of ${product.commissionRate}% — great earning per sale!`)
  }
  if (breakdown.conversion < 40) {
    parts.push(`${product.category} category has lower conversion rates. Focus on compelling content to improve click-through.`)
  }
  if (breakdown.aov >= 70) {
    parts.push(`At RM${product.price.toFixed(2)}, each conversion earns you RM${((product.price * product.commissionRate) / 100).toFixed(2)} — solid AOV!`)
  }
  if (breakdown.competition >= 70) {
    parts.push('Low competition in this niche — great opportunity to dominate!')
  }
  if (breakdown.competition < 40) {
    parts.push('High competition — differentiate your content to stand out.')
  }
  if (breakdown.sales >= 70) {
    parts.push('Strong sales volume indicates high market demand.')
  }
  if (breakdown.trend >= 60) {
    parts.push('Positive trend momentum — this product is gaining popularity.')
  }

  return parts.join(' ')
}

interface ProductInput {
  name: string
  price: number
  commissionRate: number
  category: string
  sales: number
  rating: number
}

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }
    const { product: rawProduct } = await validateBody(request, profitScoreSchema)

    const {
      name = 'Unknown Product',
      price = 0,
      commissionRate = 5,
      category = 'general',
      sales = 0,
      rating = 4.0,
    } = rawProduct

    // Get category-specific metrics
    const categoryKey = Object.keys(CATEGORY_CONVERSION).find(
      (k) => category.toLowerCase().replace(/[\s-]/g, '_').includes(k)
    ) || 'general'

    const convRate = CATEGORY_CONVERSION[categoryKey]
    const competitionLevel = CATEGORY_COMPETITION[categoryKey]

    // Calculate individual scores
    const commissionScore = scoreCommissionRate(commissionRate)
    const conversionScore = scoreConversionRate(convRate)
    const aovScore = scoreAOV(price)
    const competitionScore = scoreCompetition(competitionLevel)
    const salesScore = scoreSalesVolume(sales)
    const trendScore = scoreTrend(rating, sales)

    // Weighted total score
    const totalScore = Math.round(
      commissionScore * 0.25 +
      conversionScore * 0.30 +
      aovScore * 0.20 +
      competitionScore * 0.10 +
      salesScore * 0.10 +
      trendScore * 0.05
    )

    const clampedScore = Math.max(0, Math.min(100, totalScore))
    const { level, emoji, color } = getLevel(clampedScore)

    const breakdown = {
      commission: Math.round(commissionScore),
      conversion: Math.round(conversionScore),
      aov: Math.round(aovScore),
      competition: Math.round(competitionScore),
      sales: Math.round(salesScore),
      trend: Math.round(trendScore),
    }

    // Projected earnings
    const dailyViews = 500 // assumption
    const clickRate = 0.05 // 5% CTR
    const estimatedConversionRate = convRate / 100
    const dailyClicks = dailyViews * clickRate
    const dailyConversions = dailyClicks * estimatedConversionRate
    const earningsPerConversion = (price * commissionRate) / 100
    const dailyEarnings = dailyConversions * earningsPerConversion

    const projectedEarnings = {
      daily: Math.round(dailyEarnings * 100) / 100,
      monthly: Math.round(dailyEarnings * 30 * 100) / 100,
      yearly: Math.round(dailyEarnings * 365 * 100) / 100,
      perConversion: Math.round(earningsPerConversion * 100) / 100,
      assumptions: {
        dailyViews,
        clickRate: '5%',
        conversionRate: `${convRate}%`,
        commissionType: 'same-shop (full commission)',
      },
    }

    const recommendation = getRecommendation(clampedScore, breakdown, { name, price, commissionRate, category, sales, rating })

    return NextResponse.json({
      score: clampedScore,
      level,
      emoji,
      color,
      breakdown,
      recommendation,
      projectedEarnings,
      product: { name, price, commissionRate, category, sales, rating },
    })
  } catch (error) {
    return handleError(error)
  }
}
