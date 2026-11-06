/**
 * TypeSafe-AI Zod Schemas & TypeScript Types
 * 
 * Provides runtime schema validation and static types for deterministic System One
 * affiliate intelligence primitives:
 * 1. scoreProductVirality (virality mathematical model)
 * 2. routeAffiliateIntent (intent routing & entity extraction)
 * 3. extractAndVerifyLink (affiliate URL verification & forensics evidence)
 */

import { z } from 'zod'

// ============================================================================
// 1. Virality Scoring Schema
// ============================================================================

export const ScoreProductViralityInputSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  price: z.number().nonnegative('Price must be non-negative'),
  originalPrice: z.number().nonnegative('Original price must be non-negative').optional(),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0% and 100%'),
  soldCount: z.number().int().nonnegative('Sold count must be a non-negative integer'),
  rating: z.number().min(0).max(5, 'Rating must be between 0 and 5'),
  category: z.string().min(1, 'Category is required'),
  trendKeywords: z.array(z.string()).optional().default([]),
})

export type ScoreProductViralityInput = z.input<typeof ScoreProductViralityInputSchema>

export const ViralityTierEnum = z.enum(['LOW', 'RISING', 'HIGH', 'SUPER_VIRAL'])
export type ViralityTier = z.infer<typeof ViralityTierEnum>

export const ProductViralityScoreSchema = z.object({
  viralityScore: z.number().int().min(0).max(100),
  tier: ViralityTierEnum,
  priceImpulseScore: z.number().min(0).max(100),
  commissionRoiScore: z.number().min(0).max(100),
  socialProofScore: z.number().min(0).max(100),
  trendAlignmentScore: z.number().min(0).max(100),
  suggestedAngles: z.array(z.string()),
  verdict: z.string(),
  deterministicBreakdown: z.record(z.string(), z.number()),
})

export type ProductViralityScore = z.infer<typeof ProductViralityScoreSchema>

// ============================================================================
// 2. Affiliate Intent Routing Schema
// ============================================================================

export const AffiliateIntentEnum = z.enum([
  'PRODUCT_SCOUTING',
  'COMMISSION_CALCULATION',
  'VIDEO_HOOK_CREATION',
  'BROADCAST_PUBLISH',
  'LINK_CLEANUP_VERIFICATION',
  'ANALYTICS_QUERY',
  'NAVIGATE_PAGE',
  'GENERAL_ASSISTANCE',
])
export type AffiliateIntent = z.infer<typeof AffiliateIntentEnum>

export const RadarPlatformEnum = z.enum(['tiktok', 'xhs', 'twitter', 'shorts', 'all'])
export type RadarPlatform = z.infer<typeof RadarPlatformEnum>

export const RouteAffiliateIntentInputSchema = z.object({
  input: z.string().min(1, 'User input prompt must not be empty'),
  activePage: z.string().optional(),
  contextData: z.record(z.string(), z.unknown()).optional(),
})

export type RouteAffiliateIntentInput = z.infer<typeof RouteAffiliateIntentInputSchema>

export const AffiliateIntentRouteSchema = z.object({
  intent: AffiliateIntentEnum,
  confidence: z.number().min(0).max(1),
  targetPage: z.string().optional(),
  extractedEntities: z.object({
    keywords: z.array(z.string()).default([]),
    platformTarget: RadarPlatformEnum.optional(),
    subId: z.string().optional(),
    url: z.string().optional(),
  }),
  recommendedAction: z.object({
    actionName: z.string(),
    params: z.record(z.string(), z.unknown()),
  }).optional(),
  requiresHumanConfirmation: z.boolean(),
})

export type AffiliateIntentRoute = z.infer<typeof AffiliateIntentRouteSchema>

// ============================================================================
// 3. Link Forensics & Extraction Schema
// ============================================================================

export const AffiliatePlatformEnum = z.enum(['shopee', 'tiktok', 'lazada', 'unknown'])
export type AffiliatePlatform = z.infer<typeof AffiliatePlatformEnum>

export const SubAffiliateParamsSchema = z.object({
  subId: z.string().optional(),
  af_sub1: z.string().optional(),
  af_sub2: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
})
export type SubAffiliateParams = z.infer<typeof SubAffiliateParamsSchema>

export const ExtractAndVerifyLinkInputSchema = z.object({
  rawUrl: z.string().min(1, 'Raw URL must not be empty'),
  subAffiliateParams: SubAffiliateParamsSchema.optional(),
  resolveRedirects: z.boolean().optional().default(false),
})

export type ExtractAndVerifyLinkInput = z.input<typeof ExtractAndVerifyLinkInputSchema>

export const EvidenceStatusEnum = z.enum(['verified', 'untracked', 'malformed'])
export type EvidenceStatus = z.infer<typeof EvidenceStatusEnum>

export const VerifiedAffiliateLinkResultSchema = z.object({
  isValid: z.boolean(),
  originalUrl: z.string(),
  platform: AffiliatePlatformEnum,
  isShortlink: z.boolean(),
  resolvedDestinationUrl: z.string().optional(),
  cleanUrl: z.string(),
  productId: z.string().optional(),
  shopId: z.string().optional(),
  affiliateParamsDetected: z.record(z.string(), z.string()),
  tamperProofEvidence: z.object({
    inputHash: z.string(),
    verifiedAt: z.string(),
    status: EvidenceStatusEnum,
  }),
  warnings: z.array(z.string()),
})

export type VerifiedAffiliateLinkResult = z.infer<typeof VerifiedAffiliateLinkResultSchema>
