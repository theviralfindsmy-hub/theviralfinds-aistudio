/**
 * TypeSafe-AI Primitives: System One Deterministic Decision Engine
 * 
 * Provides fast, deterministic, schema-validated execution:
 * 1. scoreProductVirality — Mathematical virality model & impulse calculations
 * 2. routeAffiliateIntent — Deterministic keyword/context intent routing & entity extraction
 * 3. extractAndVerifyLink — Deep URL parsing, platform identification, parameter audit & SHA-256 tamper-evident evidence
 */

import { createHash } from 'crypto'
import {
  ScoreProductViralityInputSchema,
  ProductViralityScoreSchema,
  type ScoreProductViralityInput,
  type ProductViralityScore,
  RouteAffiliateIntentInputSchema,
  AffiliateIntentRouteSchema,
  type RouteAffiliateIntentInput,
  type AffiliateIntentRoute,
  ExtractAndVerifyLinkInputSchema,
  VerifiedAffiliateLinkResultSchema,
  type ExtractAndVerifyLinkInput,
  type VerifiedAffiliateLinkResult,
  type AffiliatePlatform,
  type ViralityTier,
} from './schemas'

// ============================================================================
// 1. Virality Scoring Primitive
// ============================================================================

const VIRAL_KEYWORDS_MY = [
  'viral', 'tiktok', 'racun', 'trending', 'mantap', 'murah', 'cantik', 'padu',
  'original', 'skintific', 'borong', 'aesthetic', 'glowing', 'organizer',
  'wireless', 'portable', 'fast charging', 'tahan lama', 'berbaloi', 'unboxing',
]

/**
 * Deterministic mathematical calculation of affiliate product virality score (0-100).
 * Balances price impulse threshold, commission ROI, social proof, and trending velocity.
 */
export function scoreProductVirality(rawInput: ScoreProductViralityInput): ProductViralityScore {
  const input = ScoreProductViralityInputSchema.parse(rawInput)

  const {
    title,
    price,
    originalPrice,
    commissionRate,
    soldCount,
    rating,
    category,
    trendKeywords = [],
  } = input

  // 1. Price Impulse Buy Score (0-100)
  // In MY e-commerce (Shopee/TikTok MY), the peak impulse checkout sweet spot is RM 15 - RM 45.
  let priceImpulseScore: number
  if (price <= 45) {
    // Peak impulse zone: RM 15-45 is 80-100 points
    priceImpulseScore = Math.round(100 - (price / 45) * 20)
  } else {
    // Higher price reduces casual impulse buy, but retains value if under RM 150
    priceImpulseScore = Math.max(10, Math.round(80 - ((price - 45) / 105) * 60))
  }

  // Bonus for active price discount
  if (originalPrice && originalPrice > price) {
    const discountRate = (originalPrice - price) / originalPrice
    if (discountRate >= 0.2) {
      priceImpulseScore = Math.min(100, priceImpulseScore + Math.round(discountRate * 20))
    }
  }

  // 2. Commission ROI Score (0-100)
  // Standard affiliate rates are 3%-8%. >= 12% is elite tier.
  const baseCommissionScore = Math.min(100, Math.round((commissionRate / 12) * 100))
  // Absolute payout consideration: RM per unit sold
  const payoutPerUnit = (price * commissionRate) / 100
  let payoutBonus = 0
  if (payoutPerUnit >= 10) {
    payoutBonus = 15
  } else if (payoutPerUnit >= 5) {
    payoutBonus = 8
  }
  const commissionRoiScore = Math.min(100, Math.max(0, baseCommissionScore + payoutBonus))

  // 3. Social Proof Score (0-100)
  // Rating contributes up to 50 points (scaled by 5.0)
  const ratingScore = (Math.max(0, Math.min(5, rating)) / 5) * 50

  // Sold count contributes up to 50 points
  let soldScore: number
  if (soldCount >= 10000) {
    soldScore = 50
  } else if (soldCount >= 2000) {
    soldScore = 40 + ((soldCount - 2000) / 8000) * 10
  } else if (soldCount >= 500) {
    soldScore = 25 + ((soldCount - 500) / 1500) * 15
  } else if (soldCount >= 50) {
    soldScore = 10 + ((soldCount - 50) / 450) * 15
  } else {
    soldScore = (soldCount / 50) * 10
  }
  const socialProofScore = Math.min(100, Math.round(ratingScore + soldScore))

  // 4. Trend Alignment Score (0-100)
  const titleLower = title.toLowerCase()
  const categoryLower = category.toLowerCase()
  const allKeywords = Array.from(new Set([...VIRAL_KEYWORDS_MY, ...trendKeywords.map(k => k.toLowerCase())]))

  let matchedKeywords = 0
  for (const kw of allKeywords) {
    if (titleLower.includes(kw) || categoryLower.includes(kw)) {
      matchedKeywords++
    }
  }

  let trendAlignmentScore: number
  if (matchedKeywords === 0) {
    trendAlignmentScore = 40
  } else {
    trendAlignmentScore = Math.min(100, 45 + matchedKeywords * 15)
  }

  // 5. Composite Virality Score (0-100)
  // Weighting: 35% Impulse, 30% Commission, 25% Social Proof, 10% Trend Alignment
  const rawVirality = Math.round(
    priceImpulseScore * 0.35 +
    commissionRoiScore * 0.30 +
    socialProofScore * 0.25 +
    trendAlignmentScore * 0.10
  )
  const viralityScore = Math.min(100, Math.max(0, rawVirality))

  // 6. Tier Determination
  let tier: ViralityTier
  if (viralityScore >= 80) {
    tier = 'SUPER_VIRAL'
  } else if (viralityScore >= 65) {
    tier = 'HIGH'
  } else if (viralityScore >= 45) {
    tier = 'RISING'
  } else {
    tier = 'LOW'
  }

  // 7. Contextual Suggested Angles
  const suggestedAngles: string[] = []
  if (priceImpulseScore >= 75) {
    suggestedAngles.push(`Impulse Checkout ('Bawah RM${Math.ceil(price)} — grab sebelum sold out!')`)
  }
  if (socialProofScore >= 70) {
    suggestedAngles.push(`Social Proof & Hype ('Dah terjual ${soldCount.toLocaleString()} unit dengan rating ${rating.toFixed(1)}★')`)
  }
  if (commissionRoiScore >= 75) {
    suggestedAngles.push(`High Margin Hero ('Komisen RM${payoutPerUnit.toFixed(2)} per conversion')`)
  }
  if (categoryLower.includes('beauty') || categoryLower.includes('skincare')) {
    suggestedAngles.push("Before & After Skin Transformation ('Tengok perubahan seminggu...')")
  } else if (categoryLower.includes('electronic') || categoryLower.includes('gadget')) {
    suggestedAngles.push("Unboxing & Stress Test ('Gadget viral Shopee berbaloi ke tak?')")
  } else {
    suggestedAngles.push("Problem-Agitate-Solve ('Masalah yang korang selalu hadap setiap hari')")
  }

  // 8. Verdict
  let verdict: string
  if (tier === 'SUPER_VIRAL') {
    tier = 'SUPER_VIRAL'
    verdict = `Top-tier viral candidate. High impulse potential at RM${price.toFixed(2)} with ${commissionRate}% commission.`
  } else if (tier === 'HIGH') {
    verdict = `Strong candidate with solid conversion proof. Ideal for multi-angle short videos.`
  } else if (tier === 'RISING') {
    verdict = `Moderate viral velocity. Recommended for niche targeted audiences or bundles.`
  } else {
    verdict = `Low impulse conversion. Better suited for catalogue or organic search listings.`
  }

  const result: ProductViralityScore = {
    viralityScore,
    tier,
    priceImpulseScore,
    commissionRoiScore,
    socialProofScore,
    trendAlignmentScore,
    suggestedAngles,
    verdict,
    deterministicBreakdown: {
      priceImpulseScore,
      commissionRoiScore,
      socialProofScore,
      trendAlignmentScore,
      rawVirality,
      payoutPerUnit: Math.round(payoutPerUnit * 100) / 100,
    },
  }

  return ProductViralityScoreSchema.parse(result)
}

// ============================================================================
// 2. Affiliate Intent Routing Primitive
// ============================================================================

/**
 * Deterministic intent classifier and entity extractor.
 * Maps open-ended prompts into rigid typed intents with zero hallucination.
 */
export function routeAffiliateIntent(rawInput: RouteAffiliateIntentInput): AffiliateIntentRoute {
  const input = RouteAffiliateIntentInputSchema.parse(rawInput)
  const q = input.input.trim().toLowerCase()

  // Entity extraction: URL detection
  const urlMatch = input.input.match(/https?:\/\/[^\s]+/i)
  const extractedUrl = urlMatch ? urlMatch[0] : undefined

  // Entity extraction: Platform detection
  let platformTarget: 'tiktok' | 'xhs' | 'twitter' | 'shorts' | 'all' | undefined
  if (q.includes('tiktok') || q.includes('fyp')) {
    platformTarget = 'tiktok'
  } else if (q.includes('xhs') || q.includes('xiaohongshu') || q.includes('redbook')) {
    platformTarget = 'xhs'
  } else if (q.includes('twitter') || q.includes(' x ') || q.startsWith('x ') || q.includes('tweet')) {
    platformTarget = 'twitter'
  } else if (q.includes('shorts') || q.includes('youtube')) {
    platformTarget = 'shorts'
  } else if (q.includes('all channels') || q.includes('semua platform') || q.includes('cross-platform')) {
    platformTarget = 'all'
  }

  // Entity extraction: SubId parameter
  const subIdMatch = input.input.match(/(?:subid|sub_id|af_sub)\s*[:=]?\s*([a-zA-Z0-9_-]+)/i)
  const extractedSubId = subIdMatch ? subIdMatch[1] : undefined

  // Extract core keywords (strip common stopwords)
  const stopwords = new Set([
    'tolong', 'sila', 'saya', 'nak', 'boleh', 'buat', 'untuk', 'dan', 'di', 'ke', 'dari',
    'yang', 'ini', 'itu', 'please', 'can', 'you', 'help', 'me', 'the', 'a', 'an', 'to', 'for', 'with',
  ])
  const words = q
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w))

  // Intent classification matching
  let intent: AffiliateIntentRoute['intent']
  let confidence: number
  let targetPage: string | undefined
  let recommendedAction: AffiliateIntentRoute['recommendedAction']
  let requiresHumanConfirmation = false

  // 1. LINK_CLEANUP_VERIFICATION
  if (
    extractedUrl ||
    q.includes('shp.ee') ||
    q.includes('vt.tiktok') ||
    q.includes('verify link') ||
    q.includes('clean link') ||
    q.includes('semak pautan') ||
    q.includes('forensik') ||
    q.includes('redirect') ||
    q.includes('shortlink')
  ) {
    intent = 'LINK_CLEANUP_VERIFICATION'
    confidence = extractedUrl ? 0.98 : 0.85
    targetPage = 'links'
    recommendedAction = {
      actionName: 'inspectAffiliateLink',
      params: { url: extractedUrl || '' },
    }
  }
  // 2. COMMISSION_CALCULATION
  else if (
    q.includes('kira komisen') ||
    q.includes('kalkulator') ||
    q.includes('calculator') ||
    q.includes('commission') ||
    q.includes('simulator') ||
    q.includes('berapa untung') ||
    q.includes('projected earnings') ||
    q.includes('roi')
  ) {
    intent = 'COMMISSION_CALCULATION'
    confidence = 0.95
    targetPage = 'calculator'
    recommendedAction = {
      actionName: 'openCommissionSimulator',
      params: { query: input.input },
    }
  }
  // 3. VIDEO_HOOK_CREATION
  else if (
    q.includes('hook') ||
    q.includes('skrip') ||
    q.includes('script') ||
    q.includes('caption') ||
    q.includes('video idea') ||
    q.includes('angle') ||
    q.includes('racun') ||
    q.includes('curiosity gap')
  ) {
    intent = 'VIDEO_HOOK_CREATION'
    confidence = 0.94
    targetPage = 'content'
    recommendedAction = {
      actionName: 'generateVideoHooks',
      params: { query: input.input, platform: platformTarget || 'tiktok' },
    }
  }
  // 4. BROADCAST_PUBLISH
  else if (
    q.includes('broadcast') ||
    q.includes('publish') ||
    q.includes('siar') ||
    q.includes('post to') ||
    q.includes('hantar post') ||
    q.includes('auto post') ||
    q.includes('blast')
  ) {
    intent = 'BROADCAST_PUBLISH'
    confidence = 0.92
    targetPage = 'socialhub'
    requiresHumanConfirmation = true // Sensitive action: external publication
    recommendedAction = {
      actionName: 'triggerBroadcast',
      params: { platform: platformTarget || 'all' },
    }
  }
  // 5. PRODUCT_SCOUTING
  else if (
    q.includes('scout') ||
    q.includes('cari produk') ||
    q.includes('viral product') ||
    q.includes('trending') ||
    q.includes('radar') ||
    q.includes('top product') ||
    q.includes('rekomendasi') ||
    q.includes('laku')
  ) {
    intent = 'PRODUCT_SCOUTING'
    confidence = 0.93
    targetPage = 'socialhub'
    recommendedAction = {
      actionName: 'scoutViralProducts',
      params: { keywords: words, platform: platformTarget || 'all' },
    }
  }
  // 6. ANALYTICS_QUERY
  else if (
    q.includes('analytics') ||
    q.includes('prestasi') ||
    q.includes('clicks') ||
    q.includes('conversion') ||
    q.includes('sales') ||
    q.includes('trafik') ||
    q.includes('traffic') ||
    q.includes('summary')
  ) {
    intent = 'ANALYTICS_QUERY'
    confidence = 0.90
    targetPage = 'analytics'
    recommendedAction = {
      actionName: 'fetchAnalyticsSummary',
      params: {},
    }
  }
  // 7. NAVIGATE_PAGE
  else if (
    q.includes('pergi ke') ||
    q.includes('buka page') ||
    q.includes('go to') ||
    q.includes('open') ||
    q.includes('navigate')
  ) {
    intent = 'NAVIGATE_PAGE'
    confidence = 0.88
    // Determine target page from keywords
    if (q.includes('setting')) targetPage = 'settings'
    else if (q.includes('earning')) targetPage = 'earnings'
    else if (q.includes('product')) targetPage = 'products'
    else if (q.includes('campaign')) targetPage = 'campaigns'
    else targetPage = input.activePage || 'dashboard'

    recommendedAction = {
      actionName: 'navigateToPage',
      params: { targetPage },
    }
  }
  // 8. GENERAL_ASSISTANCE
  else {
    intent = 'GENERAL_ASSISTANCE'
    confidence = 0.60
    targetPage = input.activePage
    recommendedAction = {
      actionName: 'askHermesCopilot',
      params: { query: input.input },
    }
  }

  const result: AffiliateIntentRoute = {
    intent,
    confidence,
    targetPage,
    extractedEntities: {
      keywords: words,
      platformTarget,
      subId: extractedSubId,
      url: extractedUrl,
    },
    recommendedAction,
    requiresHumanConfirmation,
  }

  return AffiliateIntentRouteSchema.parse(result)
}

// ============================================================================
// 3. Link Forensics & Extraction Primitive
// ============================================================================

const SHORTLINK_HOSTS = new Set([
  'shp.ee',
  'shope.ee',
  'vt.tiktok.com',
  'vm.tiktok.com',
  's.lazada.com.my',
  's.lazada.sg',
  'c.lazada.com.my',
  'bit.ly',
  'tinyurl.com',
  't.co',
])

/**
 * Validates, cleanses, and audits affiliate links.
 * Extracts sub-affiliate tracking parameters and generates tamper-evident SHA-256 evidence.
 */
export function extractAndVerifyLink(rawInput: ExtractAndVerifyLinkInput): VerifiedAffiliateLinkResult {
  const input = ExtractAndVerifyLinkInputSchema.parse(rawInput)
  const trimmedUrl = input.rawUrl.trim()

  const warnings: string[] = []

  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmedUrl)
  } catch {
    // Malformed URL handling
    const inputHash = createHash('sha256').update(trimmedUrl).digest('hex')
    return VerifiedAffiliateLinkResultSchema.parse({
      isValid: false,
      originalUrl: trimmedUrl,
      platform: 'unknown',
      isShortlink: false,
      cleanUrl: trimmedUrl,
      affiliateParamsDetected: {},
      tamperProofEvidence: {
        inputHash,
        verifiedAt: new Date().toISOString(),
        status: 'malformed',
      },
      warnings: ['Invalid URL format: unable to parse as a valid HTTP/HTTPS URI'],
    })
  }

  // Strict protocol check ensuring only http: and https: are marked valid
  const isHttpOrHttps = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  if (!isHttpOrHttps) {
    warnings.push(`Invalid URL protocol: "${parsedUrl.protocol}". Only http: and https: protocols are permitted.`)
  }

  const hostname = parsedUrl.hostname.toLowerCase()
  const pathname = parsedUrl.pathname
  const isShortlink = SHORTLINK_HOSTS.has(hostname)

  // 1. Platform Detection
  let platform: AffiliatePlatform = 'unknown'
  if (hostname.includes('shopee') || hostname === 'shp.ee' || hostname === 'shope.ee') {
    platform = 'shopee'
  } else if (hostname.includes('tiktok') || hostname.includes('byteoversea')) {
    platform = 'tiktok'
  } else if (hostname.includes('lazada') || hostname.includes('slazada')) {
    platform = 'lazada'
  }

  // 2. Product and Shop ID Extraction
  let productId: string | undefined
  let shopId: string | undefined

  if (platform === 'shopee') {
    // Standard Shopee pattern: ...-i.{shopId}.{productId}
    const dotMatch = pathname.match(/-i\.(\d+)\.(\d+)/)
    if (dotMatch) {
      shopId = dotMatch[1]
      productId = dotMatch[2]
    } else {
      // Alternative pattern: /product/{shopId}/{productId}
      const slashMatch = pathname.match(/\/product\/(\d+)\/(\d+)/)
      if (slashMatch) {
        shopId = slashMatch[1]
        productId = slashMatch[2]
      } else {
        // Query param fallbacks
        productId = parsedUrl.searchParams.get('itemid') || parsedUrl.searchParams.get('productId') || undefined
        shopId = parsedUrl.searchParams.get('shopid') || parsedUrl.searchParams.get('shopId') || undefined
      }
    }
  } else if (platform === 'tiktok') {
    const ttProductMatch = pathname.match(/\/product\/(\d+)/) || pathname.match(/\/view\/product\/(\d+)/)
    if (ttProductMatch) {
      productId = ttProductMatch[1]
    }
  } else if (platform === 'lazada') {
    const lazMatch = pathname.match(/-i(\d+)-s(\d+)\.html/)
    if (lazMatch) {
      productId = lazMatch[1]
      shopId = lazMatch[2]
    }
  }

  // 3. Affiliate Parameters Audit
  const affiliateParamsDetected: Record<string, string> = {}
  const targetParamKeys = [
    'sub_id', 'subId', 'af_sub1', 'af_sub2', 'af_sub', 'utm_source',
    'utm_medium', 'utm_campaign', 'aff_trace_key', 'af_id', 'affiliate_id',
  ]

  for (const key of targetParamKeys) {
    const val = parsedUrl.searchParams.get(key)
    if (val) {
      affiliateParamsDetected[key] = val
    }
  }

  // Apply any caller-specified subAffiliateParams if not present
  if (input.subAffiliateParams) {
    const { subId, af_sub1, af_sub2, utm_source, utm_campaign } = input.subAffiliateParams
    if (subId && !affiliateParamsDetected.subId && !affiliateParamsDetected.sub_id) {
      affiliateParamsDetected.subId = subId
    }
    if (af_sub1 && !affiliateParamsDetected.af_sub1) affiliateParamsDetected.af_sub1 = af_sub1
    if (af_sub2 && !affiliateParamsDetected.af_sub2) affiliateParamsDetected.af_sub2 = af_sub2
    if (utm_source && !affiliateParamsDetected.utm_source) affiliateParamsDetected.utm_source = utm_source
    if (utm_campaign && !affiliateParamsDetected.utm_campaign) affiliateParamsDetected.utm_campaign = utm_campaign
  }

  // 4. Construct Clean URL
  // Remove ad/session clutter while preserving essential affiliate identifiers
  const cleanUrlObj = new URL(trimmedUrl)
  const bloatParams = [
    'sp_atk', 'xptdk', 'smtt', 'fbclid', 'gclid', '_ga', 'source',
    'click_id', 'tracking_id', '__cf_chl_tk', 'entry_point',
  ]
  for (const param of bloatParams) {
    cleanUrlObj.searchParams.delete(param)
  }

  // Ensure detected affiliate params are standardized in cleanUrl
  for (const [k, v] of Object.entries(affiliateParamsDetected)) {
    cleanUrlObj.searchParams.set(k, v)
  }
  const cleanUrl = cleanUrlObj.toString()

  // 5. Warnings & Evidence Status
  const hasSubId = Boolean(
    affiliateParamsDetected.sub_id ||
    affiliateParamsDetected.subId ||
    affiliateParamsDetected.af_sub1 ||
    affiliateParamsDetected.af_sub
  )

  let evidenceStatus: 'verified' | 'untracked' = 'verified'
  if (!hasSubId && !isShortlink) {
    evidenceStatus = 'untracked'
    warnings.push('No sub-affiliate parameter (subId/af_sub) detected. Commissions may be attributed to a generic pool.')
  }
  if (isShortlink) {
    warnings.push('Shortlink detected. Full redirect resolution is required to verify terminal destination parameters.')
  }

  // 6. SHA-256 Tamper-Evident Evidence Hash
  const canonicalPayload = JSON.stringify({
    originalUrl: trimmedUrl,
    cleanUrl,
    platform,
    productId,
    shopId,
    params: Object.keys(affiliateParamsDetected).sort().reduce((acc, k) => {
      acc[k] = affiliateParamsDetected[k]
      return acc
    }, {} as Record<string, string>),
  })

  const inputHash = createHash('sha256').update(canonicalPayload).digest('hex')

  const result: VerifiedAffiliateLinkResult = {
    isValid: isHttpOrHttps,
    originalUrl: trimmedUrl,
    platform,
    isShortlink,
    cleanUrl,
    productId,
    shopId,
    affiliateParamsDetected,
    tamperProofEvidence: {
      inputHash,
      verifiedAt: new Date().toISOString(),
      status: evidenceStatus,
    },
    warnings,
  }

  return VerifiedAffiliateLinkResultSchema.parse(result)
}
