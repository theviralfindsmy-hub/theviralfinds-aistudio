/**
 * AI Product Recommender — Types
 *
 * Scoring model:
 *   audience match (40%) + commission (30%) + trend (20%) + gap analysis (10%)
 */

// ─── Platform & Source ─────────────────────────────────────────

export type Platform = 'shopee' | 'tiktok' | 'lazada'

export type DataSource = 'mock' | 'ai'

// ─── Audience Profile ──────────────────────────────────────────

/**
 * Audience persona — represents a typical affiliate's audience.
 * Used to score how well a product matches their interests.
 */
export interface AudienceProfile {
  id: AudiencePersonaId
  name: string
  emoji: string
  /** Short tagline */
  tagline: string
  /** One-paragraph description */
  description: string
  /** Top categories this audience engages with (higher weight = more interest) */
  topCategories: AudienceCategoryWeight[]
  /** Peak engagement hours (24h MYT) */
  peakHours: number[]
  /** Audience age range */
  ageRange: string
  /** Primary gender split */
  genderSplit: { female: number; male: number }
  /** Devices they use */
  devices: ('mobile' | 'desktop' | 'tablet')[]
  /** Price sensitivity: 1 = luxury, 5 = very price-sensitive */
  priceSensitivity: number
  /** Geographic distribution across Malaysia */
  topStates: string[]
  /** Engagement rate (clicks per impression) */
  clickThroughRate: number
  /** Conversion rate once they click */
  conversionRate: number
  /** Languages they engage with */
  languages: ('en' | 'bm' | 'zh' | 'ta')[]
}

export type AudiencePersonaId =
  | 'beauty_mama'
  | 'tech_bro'
  | 'fitness_guru'
  | 'kitchen_queen'
  | 'student_saver'

export interface AudienceCategoryWeight {
  /** Unified category label (case-insensitive substring match against product.category) */
  category: string
  /** 0-100 weight: how strongly this audience cares about this category */
  weight: number
}

// ─── Product (unified across platforms) ────────────────────────

/**
 * Lightweight unified product shape used by the recommender.
 * Built by normalising Shopee / TikTok / Lazada mock products.
 */
export interface RecommendableProduct {
  id: string
  platform: Platform
  /** Native platform product identifier (itemId for Shopee/Lazada, productId for TikTok) */
  nativeId: string
  name: string
  image: string
  price: number // RM
  originalPrice?: number // RM
  commissionRate: number // percentage 0-100
  commissionAmount: number // RM
  sales: number
  rating: number // 0-5
  shopName: string
  category: string
  productLink: string
  /** Optional trend signal — already present on TikTok products, derived for others */
  trendScore?: number
}

// ─── Score & Explanation ───────────────────────────────────────

/**
 * Per-dimension breakdown (each 0-100).
 */
export interface RecommendationScore {
  /** 40% weight — audience match */
  audience: number
  /** 30% weight — commission attractiveness */
  commission: number
  /** 20% weight — sales velocity / trend */
  trend: number
  /** 10% weight — gap analysis: undersaturated niche */
  gap: number
  /** Weighted total (0-100) */
  total: number
}

/**
 * Why this product was recommended — natural-language explanation
 * with the data points behind it.
 */
export interface RecommendationExplanation {
  /** Human-readable summary, e.g. "High audience match (85%) + trending (+45%)..." */
  summary: string
  /** Short bullet-style reasons */
  bullets: string[]
  /** Per-dimension one-liners */
  dimensions: {
    audience: string
    commission: string
    trend: string
    gap: string
  }
  /** Suggested best posting time in 12h format (e.g. "8:00 PM") */
  suggestedPostTime: string
}

// ─── Recommendation Result ─────────────────────────────────────

export interface Recommendation {
  /** Stable recommendation id (deterministic from product id + audience id) */
  id: string
  product: RecommendableProduct
  score: RecommendationScore
  explanation: RecommendationExplanation
  /** True if in the top 3 by score */
  isTopPick: boolean
  /** Rank within the result set (1-based) */
  rank: number
}

// ─── API Response ──────────────────────────────────────────────

export interface RecommendationResponse {
  audience: AudienceProfile
  recommendations: Recommendation[]
  source: DataSource
  generatedAt: string
  /** Algorithm version for cache-busting */
  algorithmVersion: string
  /** Was AI used to enhance explanations? */
  aiEnhanced: boolean
}
