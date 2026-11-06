/**
 * src/types/trend-radar.ts
 * 
 * Typed Data Models & Zod Schemas for the Multi-Platform Trend Radar Engine (Milestone 4).
 * Covers TikTok, Xiaohongshu (XHS), Twitter/X, and YouTube Shorts for viral affiliate product scouting.
 */

import { z } from 'zod'
import { ViralityTierEnum, type ViralityTier } from '@/lib/typesafe-ai/schemas'

// ============================================================================
// 1. Enums and Literal Constants
// ============================================================================

export const RADAR_PLATFORMS = ['tiktok', 'xhs', 'twitter', 'shorts'] as const
export const RadarPlatformEnum = z.enum(RADAR_PLATFORMS)
export type RadarPlatform = z.infer<typeof RadarPlatformEnum>

export const RADAR_PLATFORM_FILTERS = ['tiktok', 'xhs', 'twitter', 'shorts', 'all'] as const
export const RadarPlatformFilterEnum = z.enum(RADAR_PLATFORM_FILTERS)
export type RadarPlatformFilter = z.infer<typeof RadarPlatformFilterEnum>

export const GROWTH_VELOCITIES = ['SURGING', 'HIGH', 'STABLE'] as const
export const GrowthVelocityEnum = z.enum(GROWTH_VELOCITIES)
export type GrowthVelocity = z.infer<typeof GrowthVelocityEnum>

export const RADAR_LANGUAGES = ['ms', 'zh', 'en'] as const
export const RadarLanguageEnum = z.enum(RADAR_LANGUAGES)
export type RadarLanguage = z.infer<typeof RadarLanguageEnum>

export const RADAR_SORT_OPTIONS = ['virality', 'views', 'growth', 'recent', 'engagement'] as const
export const RadarSortEnum = z.enum(RADAR_SORT_OPTIONS)
export type RadarSortOption = z.infer<typeof RadarSortEnum>

// ============================================================================
// 2. Creator and Profile Models
// ============================================================================

export const RadarCreatorSchema = z.object({
  username: z.string().min(1, 'Creator username is required'),
  handle: z.string().min(1, 'Creator handle is required'),
  avatarUrl: z.string().url().optional(),
  followerCount: z.string().min(1, 'Follower count display string is required'),
  verified: z.boolean().optional().default(false),
})

export type RadarCreator = z.infer<typeof RadarCreatorSchema>

// ============================================================================
// 3. Engagement and Growth Metrics
// ============================================================================

export const RadarMetricsSchema = z.object({
  views: z.number().int().nonnegative('Views count must be non-negative'),
  likes: z.number().int().nonnegative('Likes count must be non-negative'),
  shares: z.number().int().nonnegative('Shares count must be non-negative'),
  comments: z.number().int().nonnegative('Comments count must be non-negative'),
  growthVelocity: GrowthVelocityEnum,
  engagementRate: z.number().min(0).max(100).optional(),
  velocityMultiplier: z.number().positive().optional(),
  publishedAt: z.string().optional(),
})

export type RadarMetrics = z.infer<typeof RadarMetricsSchema>

// ============================================================================
// 4. Product Recommendation & Virality Integration
// ============================================================================

export const RadarProductRecommendationSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  shopeeUrl: z.string().url().optional(),
  category: z.string().min(1, 'Product category is required'),
  estimatedPrice: z.number().positive('Estimated price must be greater than zero'),
  originalPrice: z.number().positive().optional(),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0% and 100%'),
  soldCount: z.number().int().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  viralityScore: z.number().int().min(0).max(100),
  viralityTier: ViralityTierEnum.optional(),
  suggestedAngles: z.array(z.string()).optional(),
  priceImpulseScore: z.number().min(0).max(100).optional(),
  commissionRoiScore: z.number().min(0).max(100).optional(),
  socialProofScore: z.number().min(0).max(100).optional(),
  trendAlignmentScore: z.number().min(0).max(100).optional(),
})

export type RadarProductRecommendation = z.infer<typeof RadarProductRecommendationSchema>

// ============================================================================
// 5. Core Trend Radar Feed Item
// ============================================================================

export const TrendRadarFeedItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  platform: RadarPlatformEnum,
  creator: RadarCreatorSchema,
  postUrl: z.string().url('Post URL must be a valid URI'),
  title: z.string().min(1, 'Post title is required'),
  hookText: z.string().min(1, 'Hook text is required'),
  summary: z.string().min(1, 'Summary is required'),
  productRecommendation: RadarProductRecommendationSchema.optional(),
  metrics: RadarMetricsSchema,
  tags: z.array(z.string()).default([]),
  language: RadarLanguageEnum,
  thumbnailUrl: z.string().url().optional(),
  embedId: z.string().optional(),
})

export type TrendRadarFeedItem = z.infer<typeof TrendRadarFeedItemSchema>

// ============================================================================
// 6. Query Parameters and API Response Schemas
// ============================================================================

export const TrendRadarQueryParamsSchema = z.object({
  platform: RadarPlatformFilterEnum.optional().default('all'),
  query: z.string().optional(),
  velocity: z.enum(['SURGING', 'HIGH', 'STABLE', 'all']).optional().default('all'),
  category: z.string().optional(),
  tier: z.enum(['LOW', 'RISING', 'HIGH', 'SUPER_VIRAL', 'all']).optional().default('all'),
  language: z.enum(['ms', 'zh', 'en', 'all']).optional().default('all'),
  minScore: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().int().optional().default(20).transform((val) => Math.min(100, Math.max(1, val))),
  page: z.coerce.number().int().optional().default(1).transform((val) => Math.max(1, val)),
  sortBy: RadarSortEnum.optional().default('virality'),
})

export type TrendRadarQueryParams = z.infer<typeof TrendRadarQueryParamsSchema>

export const TrendRadarApiResponseSchema = z.object({
  items: z.array(TrendRadarFeedItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  activeFilters: z.object({
    platform: RadarPlatformFilterEnum,
    velocity: z.enum(['SURGING', 'HIGH', 'STABLE', 'all']),
    category: z.string().optional(),
    query: z.string().optional(),
    tier: z.string().optional(),
    sortBy: RadarSortEnum,
  }),
  meta: z.object({
    totalSurging: z.number().int().nonnegative(),
    avgViralityScore: z.number().min(0).max(100),
    topCategory: z.string(),
    platformDistribution: z.record(RadarPlatformEnum, z.number().int().nonnegative()),
    generatedAt: z.string(),
  }),
})

export type TrendRadarApiResponse = z.infer<typeof TrendRadarApiResponseSchema>
