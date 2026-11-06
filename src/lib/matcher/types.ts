/**
 * Cross-Platform Product Matcher — Types
 *
 * Domain types for the "Search Once. Find Everywhere." feature
 * (CHECKLIST Section 2.6). Allows a single keyword search to surface
 * the same product on all 3 platforms (Shopee, TikTok, Lazada) with
 * commission + price side-by-side so affiliates can auto-pick the
 * best-paying platform.
 *
 * All currency values are in Malaysian Ringgit (RM).
 */

export type Platform = 'shopee' | 'tiktok' | 'lazada'

/** Source-of-truth flag for every API response. */
export type DataSource = 'mock' | 'api'

/**
 * Normalised representation of a product listing on any of the 3
 * platforms. The matcher aggregates raw products from each platform's
 * mock service into this shape so they can be compared apples-to-apples.
 */
export interface MatchedPlatformProduct {
  platform: Platform
  /** Native product id from the platform (string for TikTok, number-as-string for Shopee/Lazada). */
  productId: string
  title: string
  image: string
  price: number // RM
  originalPrice?: number // RM
  commissionRate: number // percentage 0–100
  /** Computed commission in RM = price * commissionRate / 100. */
  commissionAmount: number
  sales: number
  rating: number // 0–5
  shopName: string
  category: string
  productLink: string
  /** Optional deep link / app scheme. */
  deepLink?: string
  /** Lazada-specific flags. */
  isLazMall?: boolean
  isFreeShipping?: boolean
  /** TikTok-specific trend score (0–100). */
  trendScore?: number
}

/**
 * A single "match group" — one logical product surfaced across
 * multiple platforms. The `query` is what the user typed.
 */
export interface MatchResult {
  /** Stable id for this match group (used by the UI as React key + auto-pick lookup). */
  id: string
  /** Display name (taken from the highest-scored listing or the query). */
  name: string
  /** Normalised category label (e.g. "Beauty", "Electronics"). */
  category: string
  /** Hero image URL (from the first available platform listing). */
  image: string
  /** Relevance score 0–100 for this match group relative to the query. */
  relevanceScore: number
  /** Per-platform listings that match the query. */
  listings: MatchedPlatformProduct[]
  /** Convenience: the platform that pays the highest commissionAmount (RM). */
  bestPlatform: Platform
  /** Highest commission amount (RM) across all listings. */
  bestCommissionAmount: number
  /** Lowest price (RM) across all listings — useful for "best deal" highlighting. */
  lowestPrice: number
  /** Highest price (RM) across all listings. */
  highestPrice: number
}

/** Result returned by `autoPickBest`. */
export interface AutoPickResult {
  /** The match group id that was looked up. */
  matchId: string
  productName: string
  /** The platform we recommend (highest commissionAmount RM). */
  platform: Platform
  /** Listing on the recommended platform. */
  listing: MatchedPlatformProduct
  /** Estimated commission in RM for a single sale on this platform. */
  commissionAmount: number
  commissionRate: number
  /** Auto-generated affiliate link details. */
  affiliateLink: {
    shortUrl: string
    longUrl: string
    deepLink?: string
    trackingUrl?: string
    trackingId?: string
    expiresAt?: string
  }
  /** Why this platform was picked (human-readable explanation in Manglish). */
  reason: string
  /** Whether the affiliate link came from the live API or mock service. */
  source: DataSource
}

/** Tunable configuration for the matcher service. */
export interface MatcherConfig {
  /** Minimum similarity (0–1) required to group two listings into the same match group. */
  similarityThreshold: number
  /** Max number of match groups to return per search. */
  maxResults: number
  /** Whether to allow synthetic matches (rename random products with the query) when no real matches exist. */
  allowSynthetic: boolean
  /** Per-platform page size when calling each mock service's searchProducts. */
  platformPageSize: number
}

export const DEFAULT_MATCHER_CONFIG: MatcherConfig = {
  similarityThreshold: 0.35,
  maxResults: 20,
  allowSynthetic: true,
  platformPageSize: 30,
}

/** Aggregate response shape for GET /api/match. */
export interface MatchSearchResponse {
  query: string
  results: MatchResult[]
  total: number
  platformsSearched: Platform[]
  bestCommissionAmount: number | null
  source: DataSource
}

/** Request body for POST /api/match/auto-pick. */
export interface AutoPickRequest {
  productId: string
  productName?: string
}

/** Response shape for POST /api/match/auto-pick. */
export interface AutoPickResponse {
  result: AutoPickResult
  source: DataSource
}
