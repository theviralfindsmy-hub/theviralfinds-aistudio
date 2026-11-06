/**
 * Unit Test Suite for TypeSafe-AI Primitives
 * 
 * Verifies:
 * 1. scoreProductVirality — deterministic math, price impulse thresholds, edge cases, invalid inputs.
 * 2. routeAffiliateIntent — keyword classification, entity extraction, human confirmation gates.
 * 3. extractAndVerifyLink — platform detection, parameter audit, clean URL stripping, SHA-256 evidence.
 */

import { describe, it, expect } from 'bun:test'
import {
  scoreProductVirality,
  routeAffiliateIntent,
  extractAndVerifyLink,
} from '@/lib/typesafe-ai/primitives'
import {
  ScoreProductViralityInputSchema,
  ProductViralityScoreSchema,
  RouteAffiliateIntentInputSchema,
  AffiliateIntentRouteSchema,
  ExtractAndVerifyLinkInputSchema,
  VerifiedAffiliateLinkResultSchema,
} from '@/lib/typesafe-ai/schemas'

describe('TypeSafe-AI Primitives: scoreProductVirality', () => {
  it('correctly scores a high-virality impulse product (Super Viral candidate)', () => {
    const input = {
      title: 'Skintific 5X Ceramide Barrier Moisturizer Gel Viral TikTok Racun',
      price: 36.90,
      originalPrice: 55.00,
      commissionRate: 14.5,
      soldCount: 15400,
      rating: 4.9,
      category: 'Health & Beauty',
      trendKeywords: ['skintific', 'viral', 'moisturizer'],
    }

    const result = scoreProductVirality(input)

    // Verify schema adherence
    const validated = ProductViralityScoreSchema.parse(result)
    expect(validated.viralityScore).toBeGreaterThanOrEqual(80)
    expect(validated.tier).toBe('SUPER_VIRAL')
    expect(validated.priceImpulseScore).toBeGreaterThanOrEqual(80)
    expect(validated.commissionRoiScore).toBeGreaterThanOrEqual(85)
    expect(validated.socialProofScore).toBeGreaterThanOrEqual(85)
    expect(validated.suggestedAngles.length).toBeGreaterThan(0)
    expect(validated.deterministicBreakdown.rawVirality).toBe(result.viralityScore)
  })

  it('correctly scores an expensive, low-impulse item as LOW tier', () => {
    const input = {
      title: 'Luxury Swiss Automatic Tourbillon Watch Original',
      price: 2499.00,
      commissionRate: 2.0,
      soldCount: 8,
      rating: 3.5,
      category: 'Watches & Accessories',
      trendKeywords: [],
    }

    const result = scoreProductVirality(input)

    expect(result.viralityScore).toBeLessThan(45)
    expect(result.tier).toBe('LOW')
    expect(result.priceImpulseScore).toBeLessThanOrEqual(25)
    expect(result.commissionRoiScore).toBeLessThanOrEqual(35)
    expect(result.verdict).toContain('Low impulse conversion')
  })

  it('is strictly deterministic across repeated invocations with identical parameters', () => {
    const input = {
      title: 'Wireless Bluetooth Earbuds Noise Cancelling Padu',
      price: 49.00,
      commissionRate: 10.0,
      soldCount: 2300,
      rating: 4.7,
      category: 'Electronics',
      trendKeywords: ['wireless', 'padu'],
    }

    const run1 = scoreProductVirality(input)
    const run2 = scoreProductVirality(input)

    expect(run1.viralityScore).toBe(run2.viralityScore)
    expect(run1.tier).toBe(run2.tier)
    expect(run1.priceImpulseScore).toBe(run2.priceImpulseScore)
    expect(run1.commissionRoiScore).toBe(run2.commissionRoiScore)
    expect(run1.socialProofScore).toBe(run2.socialProofScore)
    expect(run1.trendAlignmentScore).toBe(run2.trendAlignmentScore)
    expect(run1.suggestedAngles).toEqual(run2.suggestedAngles)
  })

  it('handles edge case boundary zero inputs without NaN or infinity', () => {
    const input = {
      title: 'Free Sample Tester Kit',
      price: 0,
      commissionRate: 0,
      soldCount: 0,
      rating: 0,
      category: 'Samples',
      trendKeywords: [],
    }

    const result = scoreProductVirality(input)

    expect(Number.isNaN(result.viralityScore)).toBe(false)
    expect(Number.isFinite(result.viralityScore)).toBe(true)
    expect(result.viralityScore).toBeGreaterThanOrEqual(0)
    expect(result.viralityScore).toBeLessThanOrEqual(100)
    expect(result.tier).toBe('LOW')
  })

  it('handles edge case maximum scale inputs cleanly within [0, 100]', () => {
    const input = {
      title: 'Ultimate Mega viral TikTok Product',
      price: 15.00,
      originalPrice: 150.00,
      commissionRate: 100,
      soldCount: 1_000_000,
      rating: 5.0,
      category: 'Beauty',
      trendKeywords: ['viral', 'tiktok', 'racun', 'trending'],
    }

    const result = scoreProductVirality(input)

    expect(result.viralityScore).toBeLessThanOrEqual(100)
    expect(result.viralityScore).toBeGreaterThanOrEqual(85)
    expect(result.tier).toBe('SUPER_VIRAL')
  })

  it('rejects invalid inputs via Zod schema validation', () => {
    // Missing title (min 3 chars required)
    expect(() => scoreProductVirality({
      title: 'a',
      price: 25,
      commissionRate: 5,
      soldCount: 100,
      rating: 4,
      category: 'Misc',
      trendKeywords: [],
    } as any)).toThrow()

    // Negative price
    expect(() => scoreProductVirality({
      title: 'Valid Product Title',
      price: -10,
      commissionRate: 5,
      soldCount: 100,
      rating: 4,
      category: 'Misc',
      trendKeywords: [],
    } as any)).toThrow()

    // Rating > 5
    expect(() => scoreProductVirality({
      title: 'Valid Product Title',
      price: 20,
      commissionRate: 5,
      soldCount: 100,
      rating: 6.5,
      category: 'Misc',
      trendKeywords: [],
    } as any)).toThrow()

    // Commission > 100
    expect(() => scoreProductVirality({
      title: 'Valid Product Title',
      price: 20,
      commissionRate: 150,
      soldCount: 100,
      rating: 4.5,
      category: 'Misc',
      trendKeywords: [],
    } as any)).toThrow()
  })
})

describe('TypeSafe-AI Primitives: routeAffiliateIntent', () => {
  it('routes product scouting queries to PRODUCT_SCOUTING with platform entity', () => {
    const result = routeAffiliateIntent({
      input: 'Tolong cari produk viral skincare kat TikTok FYP minggu ni',
    })

    const validated = AffiliateIntentRouteSchema.parse(result)
    expect(validated.intent).toBe('PRODUCT_SCOUTING')
    expect(validated.targetPage).toBe('socialhub')
    expect(validated.extractedEntities.platformTarget).toBe('tiktok')
    expect(validated.confidence).toBeGreaterThan(0.8)
    expect(validated.requiresHumanConfirmation).toBe(false)
  })

  it('routes commission simulator queries to COMMISSION_CALCULATION', () => {
    const result = routeAffiliateIntent({
      input: 'Kira komisen kalau harga RM 45 dan commission 12% berapa untung projected',
    })

    expect(result.intent).toBe('COMMISSION_CALCULATION')
    expect(result.targetPage).toBe('calculator')
    expect(result.recommendedAction?.actionName).toBe('openCommissionSimulator')
    expect(result.requiresHumanConfirmation).toBe(false)
  })

  it('routes video hook generation queries to VIDEO_HOOK_CREATION', () => {
    const result = routeAffiliateIntent({
      input: 'Buatkan skrip video hook racun TikTok curiosity gap untuk mini fan',
    })

    expect(result.intent).toBe('VIDEO_HOOK_CREATION')
    expect(result.targetPage).toBe('content')
    expect(result.recommendedAction?.actionName).toBe('generateVideoHooks')
  })

  it('routes broadcast requests to BROADCAST_PUBLISH and requires human confirmation', () => {
    const result = routeAffiliateIntent({
      input: 'Siar dan broadcast post ni ke semua platform sekarang juga',
    })

    expect(result.intent).toBe('BROADCAST_PUBLISH')
    expect(result.targetPage).toBe('socialhub')
    expect(result.requiresHumanConfirmation).toBe(true) // Crucial safety check
    expect(result.recommendedAction?.actionName).toBe('triggerBroadcast')
  })

  it('routes link verification with embedded URL and subId to LINK_CLEANUP_VERIFICATION', () => {
    const result = routeAffiliateIntent({
      input: 'Tolong semak pautan https://shp.ee/abc1234 dengan subId=tvf_raya_promo',
    })

    expect(result.intent).toBe('LINK_CLEANUP_VERIFICATION')
    expect(result.targetPage).toBe('links')
    expect(result.extractedEntities.url).toBe('https://shp.ee/abc1234')
    expect(result.extractedEntities.subId).toBe('tvf_raya_promo')
  })

  it('routes analytics queries to ANALYTICS_QUERY', () => {
    const result = routeAffiliateIntent({
      input: 'Berapa total clicks dan conversion rate prestasi link saya semalam',
    })

    expect(result.intent).toBe('ANALYTICS_QUERY')
    expect(result.targetPage).toBe('analytics')
  })

  it('routes navigation requests to NAVIGATE_PAGE', () => {
    const result = routeAffiliateIntent({
      input: 'Buka page settings akaun',
    })

    expect(result.intent).toBe('NAVIGATE_PAGE')
    expect(result.targetPage).toBe('settings')
  })

  it('falls back to GENERAL_ASSISTANCE for ambiguous queries', () => {
    const result = routeAffiliateIntent({
      input: 'Selamat petang, apa khabar?',
      activePage: 'dashboard',
    })

    expect(result.intent).toBe('GENERAL_ASSISTANCE')
    expect(result.confidence).toBeLessThan(0.7)
    expect(result.requiresHumanConfirmation).toBe(false)
  })

  it('rejects empty inputs via Zod schema', () => {
    expect(() => routeAffiliateIntent({ input: '' })).toThrow()
  })
})

describe('TypeSafe-AI Primitives: extractAndVerifyLink', () => {
  it('correctly audits a valid Shopee product URL with tracking params and extracts IDs', () => {
    const rawUrl = 'https://shopee.com.my/Skintific-5X-Ceramide-Moisturizer-i.389201.12938491?sp_atk=abc-123&sub_id=my_sub_456&utm_source=telegram'

    const result = extractAndVerifyLink({ rawUrl })

    const validated = VerifiedAffiliateLinkResultSchema.parse(result)
    expect(validated.isValid).toBe(true)
    expect(validated.platform).toBe('shopee')
    expect(validated.isShortlink).toBe(false)
    expect(validated.shopId).toBe('389201')
    expect(validated.productId).toBe('12938491')
    expect(validated.affiliateParamsDetected.sub_id).toBe('my_sub_456')
    expect(validated.affiliateParamsDetected.utm_source).toBe('telegram')
    // Bloat param sp_atk should be stripped from cleanUrl
    expect(validated.cleanUrl).not.toContain('sp_atk')
    expect(validated.tamperProofEvidence.status).toBe('verified')
    expect(validated.tamperProofEvidence.inputHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('detects shortlinks like shp.ee and flags appropriate warnings', () => {
    const result = extractAndVerifyLink({
      rawUrl: 'https://shp.ee/m9x8y7z',
    })

    expect(result.isValid).toBe(true)
    expect(result.platform).toBe('shopee')
    expect(result.isShortlink).toBe(true)
    expect(result.warnings.some(w => w.includes('Shortlink detected'))).toBe(true)
  })

  it('detects TikTok product links and parses product ID', () => {
    const result = extractAndVerifyLink({
      rawUrl: 'https://www.tiktok.com/view/product/1729482910482?subId=tt_aff_99',
    })

    expect(result.isValid).toBe(true)
    expect(result.platform).toBe('tiktok')
    expect(result.productId).toBe('1729482910482')
    expect(result.affiliateParamsDetected.subId).toBe('tt_aff_99')
    expect(result.tamperProofEvidence.status).toBe('verified')
  })

  it('flags links without sub-affiliate parameters as untracked', () => {
    const result = extractAndVerifyLink({
      rawUrl: 'https://shopee.com.my/product/55123/998124',
    })

    expect(result.isValid).toBe(true)
    expect(result.tamperProofEvidence.status).toBe('untracked')
    expect(result.warnings.some(w => w.includes('No sub-affiliate parameter'))).toBe(true)
  })

  it('merges caller-specified subAffiliateParams into the cleaned URL', () => {
    const result = extractAndVerifyLink({
      rawUrl: 'https://shopee.com.my/product/55123/998124',
      subAffiliateParams: {
        subId: 'campaign_merdeka',
        utm_source: 'influencer_bio',
      },
    })

    expect(result.affiliateParamsDetected.subId).toBe('campaign_merdeka')
    expect(result.affiliateParamsDetected.utm_source).toBe('influencer_bio')
    expect(result.cleanUrl).toContain('subId=campaign_merdeka')
    expect(result.tamperProofEvidence.status).toBe('verified')
  })

  it('handles completely malformed URLs gracefully without crashing', () => {
    const result = extractAndVerifyLink({
      rawUrl: 'htt://invalid_url_with spaces',
    })

    expect(result.isValid).toBe(false)
    expect(result.platform).toBe('unknown')
    expect(result.tamperProofEvidence.status).toBe('malformed')
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.tamperProofEvidence.inputHash).toMatch(/^[a-f0-9]{64}$/)
  })
})
