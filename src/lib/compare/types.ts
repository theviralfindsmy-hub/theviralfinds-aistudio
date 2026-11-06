/**
 * Multi-Platform Commission Comparison — Shared Types
 *
 * Used by the compare API route and the compare-page component to render
 * side-by-side commission data for the SAME product across Shopee,
 * TikTok Shop, and Lazada.
 *
 * All monetary values are in Malaysian Ringgit (RM).
 */

/** The three e-commerce platforms we compare. */
export type Platform = 'shopee' | 'tiktok' | 'lazada'

/** Normalised category bucket that all three platforms get mapped into. */
export type UnifiedCategory =
  | 'Beauty'
  | 'Fashion'
  | 'Electronics'
  | 'Home'
  | 'Food'
  | 'Baby'

/** A single platform's commission info for one matched product. */
export interface PlatformCommission {
  platform: Platform
  /** Platform-specific product ID (string for portability). */
  productId: string
  /** Product title as it appears on that platform. */
  productName: string
  /** Display thumbnail URL (may be a placeholder). */
  image: string
  /** Price in RM. */
  price: number
  /** Optional original/strike-through price in RM. */
  originalPrice?: number
  /** Commission rate as a percentage (e.g. 8.5 = 8.5%). */
  commissionRate: number
  /** Commission amount in RM = price * commissionRate / 100. */
  commissionAmount: number
  /** Shop/seller name on that platform. */
  shopName: string
  /** Sales count (lifetime units sold, approximate). */
  sales: number
  /** Star rating 0–5. */
  rating: number
  /** Deep/affiliate link URL (or product URL fallback). */
  affiliateUrl: string
  /** Unified category bucket (resolved from raw category). */
  category: UnifiedCategory | null
}

/**
 * A row in the comparison table — represents ONE logical product that may
 * be available on 1, 2, or 3 platforms simultaneously.
 */
export interface ComparisonRow {
  /** Stable id (hash of normalised name + category). */
  id: string
  /** Best canonical name (taken from the first available platform). */
  productName: string
  /** Normalised unified category bucket. */
  category: UnifiedCategory
  /** Representative thumbnail (from the first available platform). */
  thumbnail: string
  /** One entry per platform where this product is available. */
  matchedOnPlatforms: PlatformCommission[]
  /** Which platform pays the most commission for this product. */
  bestPlatform: Platform
  /** The winning commission amount in RM. */
  bestCommissionAmount: number
  /** How many of the 3 platforms carry this product. */
  matchCount: number
  /** Lowest available price across platforms (RM). */
  lowestPrice: number
}

/** Search/sort options the compare API supports. */
export type CompareSortOption =
  | 'best-commission' // highest bestCommissionAmount first
  | 'lowest-price' // lowest lowestPrice first
  | 'highest-rate' // highest commissionRate of the best platform first

/** Top-level response shape returned by GET /api/compare. */
export interface ComparisonResult {
  query: string
  category: UnifiedCategory | 'All'
  rows: ComparisonRow[]
  total: number
  source: 'mock' | 'api'
  /** Aggregate stats for the chart summary. */
  summary: {
    /** Average best-commission amount across all rows (RM). */
    avgBestCommission: number
    /** How many rows Shopee wins. */
    shopeeWins: number
    /** How many rows TikTok wins. */
    tiktokWins: number
    /** How many rows Lazada wins. */
    lazadaWins: number
    /** Average commission rate per platform (%). */
    avgRateByPlatform: Record<Platform, number>
    /** Average commission amount per platform (RM). */
    avgAmountByPlatform: Record<Platform, number>
  }
}

/** Map a raw product from any platform into a normalised PlatformCommission. */
export interface NormalizableProduct {
  platform: Platform
  productId: string | number
  productName: string
  image?: string
  imageUrl?: string
  price: number
  originalPrice?: number
  commissionRate: number
  commissionAmount?: number
  shopName?: string
  sales?: number
  rating?: number
  ratingStar?: number
  productLink?: string
  deepLink?: string
  /** Raw category string from the platform (e.g. "Beauty & Health"). */
  category?: string
}
