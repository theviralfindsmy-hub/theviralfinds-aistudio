/**
 * Auto-Hashtag Optimizer — Mock Hashtag Database (Malaysian Market)
 *
 * Curated list of 60+ real Malaysian market hashtags across 5 niches
 * (Beauty, Tech, Fashion, Food, Home). Each base hashtag is expanded
 * across the 3 supported platforms (TikTok, Instagram, Facebook) with
 * per-platform metrics, giving the optimizer a rich pool to score from.
 *
 * Numbers (impressions, clicks, competition) are realistic estimates
 * based on typical Malaysian social media reach for affiliate content.
 */

import type { Hashtag, HashtagAnalytics, HashtagNiche, HashtagPerformance, HashtagPlatform, NicheHashtags, TrendDirection } from './types'

/** Display labels for each niche, used by selectors and analytics charts. */
export const NICHE_LABELS: Record<HashtagNiche, string> = {
  beauty: 'Beauty',
  tech: 'Tech',
  fashion: 'Fashion',
  food: 'Food',
  home: 'Home',
}

/** Display labels + emoji for each platform. */
export const PLATFORM_LABELS: Record<HashtagPlatform, { label: string; emoji: string }> = {
  tiktok: { label: 'TikTok', emoji: '🎵' },
  instagram: { label: 'Instagram', emoji: '📸' },
  facebook: { label: 'Facebook', emoji: '👍' },
}

/**
 * Base hashtag definition: niche + canonical metrics.
 * The `expandAcrossPlatforms` helper derives per-platform variants
 * by applying realistic deltas (TikTok usually has higher reach but
 * also higher competition, Facebook lower reach / older audience, etc).
 */
interface BaseHashtag {
  tag: string
  niche: HashtagNiche
  impressions: number
  avgClicks: number
  competition: number
  trendDirection: TrendDirection
  trendPercent: number
  relevanceScore: number
  description?: string
}

/** Curated base hashtags — 12 per niche × 5 niches = 60 base tags. */
const BASE_HASHTAGS: BaseHashtag[] = [
  // ── Beauty ───────────────────────────────────────────────────────
  { tag: 'SkincareMY', niche: 'beauty', impressions: 88000, avgClicks: 420, competition: 7, trendDirection: 'up', trendPercent: 12, relevanceScore: 95, description: 'Malaysian skincare community tag' },
  { tag: 'GarnierMY', niche: 'beauty', impressions: 54000, avgClicks: 280, competition: 5, trendDirection: 'stable', trendPercent: 2, relevanceScore: 88, description: 'Brand-specific — easy to rank' },
  { tag: 'BeautyReviewMY', niche: 'beauty', impressions: 72000, avgClicks: 360, competition: 6, trendDirection: 'up', trendPercent: 9, relevanceScore: 92, description: 'Review-focused discovery tag' },
  { tag: 'CantikGlow', niche: 'beauty', impressions: 38000, avgClicks: 210, competition: 3, trendDirection: 'up', trendPercent: 24, relevanceScore: 85, description: 'BM beauty glow — trending fast' },
  { tag: 'SkincareRoutine', niche: 'beauty', impressions: 165000, avgClicks: 720, competition: 9, trendDirection: 'stable', trendPercent: 1, relevanceScore: 90, description: 'Global tag — high reach, saturated' },
  { tag: 'WardahMY', niche: 'beauty', impressions: 41000, avgClicks: 240, competition: 4, trendDirection: 'up', trendPercent: 15, relevanceScore: 84, description: 'Halal beauty brand' },
  { tag: 'KBeautyMY', niche: 'beauty', impressions: 61000, avgClicks: 320, competition: 6, trendDirection: 'up', trendPercent: 8, relevanceScore: 86, description: 'Korean beauty in Malaysia' },
  { tag: 'SerumNiacinamide', niche: 'beauty', impressions: 33000, avgClicks: 195, competition: 4, trendDirection: 'stable', trendPercent: 3, relevanceScore: 82, description: 'Ingredient-specific tag' },
  { tag: 'MakeupTutorialMY', niche: 'beauty', impressions: 95000, avgClicks: 510, competition: 8, trendDirection: 'stable', trendPercent: -1, relevanceScore: 88, description: 'Tutorial content discovery' },
  { tag: 'TudungMakeup', niche: 'beauty', impressions: 28000, avgClicks: 170, competition: 3, trendDirection: 'up', trendPercent: 18, relevanceScore: 90, description: 'Hijabi makeup niche' },
  { tag: 'KulitCerah', niche: 'beauty', impressions: 47000, avgClicks: 250, competition: 5, trendDirection: 'up', trendPercent: 7, relevanceScore: 80, description: 'Brightening skincare in BM' },
  { tag: 'SunscreenMY', niche: 'beauty', impressions: 52000, avgClicks: 290, competition: 5, trendDirection: 'up', trendPercent: 11, relevanceScore: 85, description: 'SPF essentials for tropical climate' },

  // ── Tech ─────────────────────────────────────────────────────────
  { tag: 'GadgetReviewMY', niche: 'tech', impressions: 76000, avgClicks: 410, competition: 6, trendDirection: 'up', trendPercent: 10, relevanceScore: 95, description: 'Gadget reviews for MY audience' },
  { tag: 'XiaomiMY', niche: 'tech', impressions: 89000, avgClicks: 480, competition: 7, trendDirection: 'up', trendPercent: 14, relevanceScore: 90, description: 'Brand-specific, strong MY community' },
  { tag: 'TechReviewMY', niche: 'tech', impressions: 64000, avgClicks: 350, competition: 6, trendDirection: 'stable', trendPercent: 2, relevanceScore: 92, description: 'Broad tech review tag' },
  { tag: 'GadgetMurah', niche: 'tech', impressions: 44000, avgClicks: 260, competition: 4, trendDirection: 'up', trendPercent: 19, relevanceScore: 88, description: 'BM "cheap gadgets" — converts well' },
  { tag: 'UnboxingMY', niche: 'tech', impressions: 118000, avgClicks: 580, competition: 8, trendDirection: 'stable', trendPercent: 0, relevanceScore: 84, description: 'Unboxing discovery tag' },
  { tag: 'PowerbankMurah', niche: 'tech', impressions: 31000, avgClicks: 200, competition: 3, trendDirection: 'up', trendPercent: 16, relevanceScore: 86, description: 'Power bank deals in BM' },
  { tag: 'EarbudsMY', niche: 'tech', impressions: 58000, avgClicks: 320, competition: 5, trendDirection: 'up', trendPercent: 12, relevanceScore: 88, description: 'TWS earbuds niche' },
  { tag: 'SamsungMY', niche: 'tech', impressions: 102000, avgClicks: 540, competition: 8, trendDirection: 'stable', trendPercent: 1, relevanceScore: 82, description: 'Brand tag — high reach, high competition' },
  { tag: 'SetupMeja', niche: 'tech', impressions: 36000, avgClicks: 215, competition: 4, trendDirection: 'up', trendPercent: 21, relevanceScore: 84, description: 'Desk setup inspiration (BM)' },
  { tag: 'SmartphoneReview', niche: 'tech', impressions: 145000, avgClicks: 680, competition: 9, trendDirection: 'stable', trendPercent: -2, relevanceScore: 80, description: 'Saturated global tag' },
  { tag: 'AksesoriPhone', niche: 'tech', impressions: 49000, avgClicks: 280, competition: 5, trendDirection: 'up', trendPercent: 9, relevanceScore: 85, description: 'iPhone accessories' },
  { tag: 'GamingSetupMY', niche: 'tech', impressions: 67000, avgClicks: 370, competition: 6, trendDirection: 'up', trendPercent: 13, relevanceScore: 86, description: 'Gaming rig community' },

  // ── Fashion ──────────────────────────────────────────────────────
  { tag: 'FashionMY', niche: 'fashion', impressions: 98000, avgClicks: 470, competition: 8, trendDirection: 'stable', trendPercent: 1, relevanceScore: 92, description: 'Broad Malaysian fashion tag' },
  { tag: 'OOTDMY', niche: 'fashion', impressions: 132000, avgClicks: 620, competition: 9, trendDirection: 'up', trendPercent: 6, relevanceScore: 90, description: 'Outfit of the day — saturated but strong' },
  { tag: 'BajuKurungModen', niche: 'fashion', impressions: 57000, avgClicks: 320, competition: 5, trendDirection: 'up', trendPercent: 17, relevanceScore: 95, description: 'Modern baju kurung — festive ready' },
  { tag: 'TudungBawal', niche: 'fashion', impressions: 71000, avgClicks: 390, competition: 6, trendDirection: 'up', trendPercent: 13, relevanceScore: 94, description: 'Hijab fashion community' },
  { tag: 'StreetwearMY', niche: 'fashion', impressions: 63000, avgClicks: 340, competition: 6, trendDirection: 'up', trendPercent: 11, relevanceScore: 88, description: 'Streetwear scene in MY' },
  { tag: 'KurungRaya', niche: 'fashion', impressions: 84000, avgClicks: 440, competition: 7, trendDirection: 'up', trendPercent: 25, relevanceScore: 96, description: 'Seasonal Raya fashion — spikes yearly' },
  { tag: 'HijabStyle', niche: 'fashion', impressions: 109000, avgClicks: 510, competition: 8, trendDirection: 'stable', trendPercent: 2, relevanceScore: 88, description: 'Hijab styling inspiration' },
  { tag: 'BajuMelayu', niche: 'fashion', impressions: 48000, avgClicks: 270, competition: 5, trendDirection: 'up', trendPercent: 14, relevanceScore: 92, description: 'Traditional menswear' },
  { tag: 'MurahTapiCantik', niche: 'fashion', impressions: 42000, avgClicks: 250, competition: 4, trendDirection: 'up', trendPercent: 22, relevanceScore: 86, description: 'BM "cheap but pretty" — strong CTA' },
  { tag: 'SneakerMY', niche: 'fashion', impressions: 79000, avgClicks: 420, competition: 7, trendDirection: 'up', trendPercent: 8, relevanceScore: 85, description: 'Sneakerhead community' },
  { tag: 'JubahMurah', niche: 'fashion', impressions: 36000, avgClicks: 210, competition: 4, trendDirection: 'stable', trendPercent: 3, relevanceScore: 84, description: 'Affordable jubah / abaya' },
  { tag: 'ShawlBawal', niche: 'fashion', impressions: 46000, avgClicks: 260, competition: 5, trendDirection: 'up', trendPercent: 12, relevanceScore: 90, description: 'Bawal shawl — evergreen product' },

  // ── Food ─────────────────────────────────────────────────────────
  { tag: 'FoodieMY', niche: 'food', impressions: 121000, avgClicks: 580, competition: 9, trendDirection: 'stable', trendPercent: 1, relevanceScore: 92, description: 'Malaysian foodies — broad reach' },
  { tag: 'ResipiMY', niche: 'food', impressions: 87000, avgClicks: 460, competition: 7, trendDirection: 'up', trendPercent: 9, relevanceScore: 95, description: 'Recipe sharing community' },
  { tag: 'MakanMY', niche: 'food', impressions: 94000, avgClicks: 510, competition: 8, trendDirection: 'up', trendPercent: 7, relevanceScore: 93, description: 'Where to eat in Malaysia' },
  { tag: 'KuihRaya', niche: 'food', impressions: 68000, avgClicks: 380, competition: 6, trendDirection: 'up', trendPercent: 28, relevanceScore: 96, description: 'Seasonal festive cookies' },
  { tag: 'StreetFoodMY', niche: 'food', impressions: 73000, avgClicks: 400, competition: 6, trendDirection: 'up', trendPercent: 11, relevanceScore: 90, description: 'Street food discovery' },
  { tag: 'ResipiSimple', niche: 'food', impressions: 52000, avgClicks: 290, competition: 5, trendDirection: 'up', trendPercent: 14, relevanceScore: 88, description: 'Easy recipes in BM' },
  { tag: 'KopitiamMY', niche: 'food', impressions: 38000, avgClicks: 220, competition: 4, trendDirection: 'stable', trendPercent: 3, relevanceScore: 86, description: 'Local coffee shop culture' },
  { tag: 'RotiCanari', niche: 'food', impressions: 41000, avgClicks: 240, competition: 4, trendDirection: 'up', trendPercent: 10, relevanceScore: 84, description: 'Iconic Malaysian breakfast' },
  { tag: 'Aiskacik', niche: 'food', impressions: 29000, avgClicks: 180, competition: 3, trendDirection: 'up', trendPercent: 15, relevanceScore: 80, description: 'Dessert / beverage tag' },
  { tag: 'ResipiRaya', niche: 'food', impressions: 58000, avgClicks: 320, competition: 5, trendDirection: 'up', trendPercent: 26, relevanceScore: 94, description: 'Seasonal Raya recipes' },
  { tag: 'MakanSedap', niche: 'food', impressions: 47000, avgClicks: 270, competition: 5, trendDirection: 'up', trendPercent: 8, relevanceScore: 88, description: 'BM "delicious food"' },
  { tag: 'SarapanSenin', niche: 'food', impressions: 33000, avgClicks: 195, competition: 3, trendDirection: 'up', trendPercent: 17, relevanceScore: 82, description: 'Breakfast inspiration (BM)' },

  // ── Home ─────────────────────────────────────────────────────────
  { tag: 'HomeDecorMY', niche: 'home', impressions: 81000, avgClicks: 430, competition: 7, trendDirection: 'up', trendPercent: 9, relevanceScore: 93, description: 'Home decor inspiration' },
  { tag: 'DapurCantik', niche: 'home', impressions: 49000, avgClicks: 280, competition: 4, trendDirection: 'up', trendPercent: 16, relevanceScore: 92, description: 'BM "beautiful kitchen"' },
  { tag: 'KemasRumah', niche: 'home', impressions: 38000, avgClicks: 230, competition: 4, trendDirection: 'up', trendPercent: 19, relevanceScore: 88, description: 'Home organization in BM' },
  { tag: 'HomeOrganization', niche: 'home', impressions: 115000, avgClicks: 540, competition: 8, trendDirection: 'stable', trendPercent: 2, relevanceScore: 84, description: 'Global organization tag' },
  { tag: 'IkeaMY', niche: 'home', impressions: 67000, avgClicks: 360, competition: 6, trendDirection: 'up', trendPercent: 7, relevanceScore: 86, description: 'IKEA hacks & finds' },
  { tag: 'RuangKecil', niche: 'home', impressions: 31000, avgClicks: 195, competition: 3, trendDirection: 'up', trendPercent: 21, relevanceScore: 90, description: 'Small space living (BM)' },
  { tag: 'DekoBilik', niche: 'home', impressions: 36000, avgClicks: 215, competition: 3, trendDirection: 'up', trendPercent: 18, relevanceScore: 89, description: 'Room decor in BM' },
  { tag: 'BilikTidur', niche: 'home', impressions: 42000, avgClicks: 245, competition: 4, trendDirection: 'up', trendPercent: 12, relevanceScore: 86, description: 'Bedroom makeover tag' },
  { tag: 'HacksRumah', niche: 'home', impressions: 29000, avgClicks: 185, competition: 3, trendDirection: 'up', trendPercent: 22, relevanceScore: 88, description: 'Home hacks in BM' },
  { tag: 'TandasCantik', niche: 'home', impressions: 24000, avgClicks: 160, competition: 2, trendDirection: 'up', trendPercent: 24, relevanceScore: 84, description: 'Bathroom styling — low competition' },
  { tag: 'MiniMakeoverMY', niche: 'home', impressions: 45000, avgClicks: 260, competition: 4, trendDirection: 'up', trendPercent: 15, relevanceScore: 87, description: 'Quick room makeovers' },
  { tag: 'PlantParentMY', niche: 'home', impressions: 39000, avgClicks: 230, competition: 4, trendDirection: 'up', trendPercent: 13, relevanceScore: 82, description: 'Houseplant community in MY' },
]

/**
 * Per-platform multipliers applied to base metrics. These reflect the
 * reality of Malaysian social media: TikTok skews younger / higher reach
 * but more saturated, Facebook skews older / lower reach but lower
 * competition for niche content, Instagram sits in between.
 */
const PLATFORM_MULTIPLIERS: Record<
  HashtagPlatform,
  { impressions: number; avgClicks: number; competition: number; relevanceBoost: number }
> = {
  tiktok: { impressions: 1.35, avgClicks: 1.30, competition: 1.20, relevanceBoost: 4 },
  instagram: { impressions: 1.05, avgClicks: 1.10, competition: 1.05, relevanceBoost: 2 },
  facebook: { impressions: 0.78, avgClicks: 0.85, competition: 0.85, relevanceBoost: 0 },
}

/**
 * Expand a base hashtag into a per-platform entry with adjusted metrics.
 * Rounds and clamps to keep the numbers realistic.
 */
function expandHashtag(base: BaseHashtag, platform: HashtagPlatform): Hashtag {
  const m = PLATFORM_MULTIPLIERS[platform]
  const competition = Math.max(1, Math.min(10, Math.round(base.competition * m.competition)))
  return {
    tag: base.tag,
    platform,
    niche: base.niche,
    impressions: Math.round(base.impressions * m.impressions),
    avgClicks: Math.round(base.avgClicks * m.avgClicks),
    competition,
    trendDirection: base.trendDirection,
    trendPercent: base.trendPercent,
    relevanceScore: Math.min(100, base.relevanceScore + m.relevanceBoost),
    description: base.description,
  }
}

/**
 * The full hashtag database: every base tag expanded across all 3 platforms.
 * 60 base tags × 3 platforms = 180 entries.
 */
export const HASHTAG_DATABASE: Hashtag[] = BASE_HASHTAGS.flatMap((base) =>
  (['tiktok', 'instagram', 'facebook'] as HashtagPlatform[]).map((p) =>
    expandHashtag(base, p)
  )
)

/** Lookup helper: all hashtags for a specific niche + platform. */
export function getHashtagsByNicheAndPlatform(
  niche: HashtagNiche,
  platform: HashtagPlatform
): Hashtag[] {
  return HASHTAG_DATABASE.filter((h) => h.niche === niche && h.platform === platform)
}

/** Bundle hashtags by niche (used by the niche selector). */
export function getNicheHashtags(): NicheHashtags[] {
  const niches: HashtagNiche[] = ['beauty', 'tech', 'fashion', 'food', 'home']
  return niches.map((niche) => ({
    niche,
    label: NICHE_LABELS[niche],
    hashtags: HASHTAG_DATABASE.filter((h) => h.niche === niche),
  }))
}

/**
 * Mock historical performance records for the analytics dashboard.
 * Generates ~16 weeks of weekly records for 8 of the user's most-used
 * hashtags, with realistic variance (weekend spikes, gradual growth).
 */
export function getMockPerformanceHistory(): HashtagPerformance[] {
  const today = new Date()
  const featuredTags = [
    { tag: 'SkincareMY', platform: 'tiktok' as HashtagPlatform, baseImp: 9200, baseClicks: 410 },
    { tag: 'OOTDMY', platform: 'instagram' as HashtagPlatform, baseImp: 11500, baseClicks: 520 },
    { tag: 'GadgetMurah', platform: 'tiktok' as HashtagPlatform, baseImp: 4800, baseClicks: 290 },
    { tag: 'ResipiSimple', platform: 'tiktok' as HashtagPlatform, baseImp: 6300, baseClicks: 340 },
    { tag: 'DapurCantik', platform: 'instagram' as HashtagPlatform, baseImp: 5200, baseClicks: 280 },
    { tag: 'BajuKurungModen', platform: 'instagram' as HashtagPlatform, baseImp: 7800, baseClicks: 420 },
    { tag: 'FoodieMY', platform: 'facebook' as HashtagPlatform, baseImp: 8900, baseClicks: 460 },
    { tag: 'HomeDecorMY', platform: 'instagram' as HashtagPlatform, baseImp: 6700, baseClicks: 360 },
  ]

  const records: HashtagPerformance[] = []
  featuredTags.forEach((t, ti) => {
    for (let w = 15; w >= 0; w--) {
      const d = new Date(today)
      d.setDate(d.getDate() - w * 7)
      const dateStr = d.toISOString().slice(0, 10)
      // Growth curve + weekly noise + per-tag offset for variety.
      const growth = 1 + (15 - w) * 0.04
      const noise = 0.85 + Math.sin(w * 0.7 + ti) * 0.15
      const impressions = Math.round(t.baseImp * growth * noise)
      const clicks = Math.round(t.baseClicks * growth * noise)
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
      const conversions = Math.round(clicks * (0.02 + (ti % 3) * 0.01))
      records.push({
        tag: t.tag,
        platform: t.platform,
        date: dateStr,
        impressions,
        clicks,
        ctr: Math.round(ctr * 100) / 100,
        conversions,
      })
    }
  })
  return records
}

/**
 * Aggregate the mock performance history into the chart-friendly shape
 * consumed by the analytics dashboard.
 */
export function getMockAnalytics(): HashtagAnalytics {
  const history = getMockPerformanceHistory()

  // Performance over time: bucket by week, sum across all tags.
  const weekBuckets = new Map<string, { impressions: number; clicks: number; posts: number }>()
  for (const rec of history) {
    const d = new Date(rec.date)
    // Label as "W1", "W2", ... starting from the oldest week.
    const weekIdx = Math.floor((Date.now() - d.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const label = `W${16 - weekIdx}`
    const existing = weekBuckets.get(label) ?? { impressions: 0, clicks: 0, posts: 0 }
    existing.impressions += rec.impressions
    existing.clicks += rec.clicks
    existing.posts += 1
    weekBuckets.set(label, existing)
  }
  const performanceOverTime = Array.from(weekBuckets.entries())
    .map(([week, v]) => ({
      week,
      impressions: v.impressions,
      clicks: v.clicks,
      ctr: v.impressions > 0 ? Math.round((v.clicks / v.impressions) * 10000) / 100 : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week, undefined, { numeric: true }))

  // Top performing: aggregate by tag.
  const byTag = new Map<string, { impressions: number; clicks: number; uses: number; platform: HashtagPlatform }>()
  for (const rec of history) {
    const existing = byTag.get(rec.tag) ?? { impressions: 0, clicks: 0, uses: 0, platform: rec.platform }
    existing.impressions += rec.impressions
    existing.clicks += rec.clicks
    existing.uses += 1
    byTag.set(rec.tag, existing)
  }
  const topPerforming = Array.from(byTag.entries())
    .map(([tag, v]) => ({
      tag,
      platform: v.platform,
      totalImpressions: v.impressions,
      totalClicks: v.clicks,
      avgCtr: v.impressions > 0 ? Math.round((v.clicks / v.impressions) * 10000) / 100 : 0,
      uses: v.uses,
    }))
    .sort((a, b) => b.totalImpressions - a.totalImpressions)
    .slice(0, 8)

  // Scatter: one point per (tag, niche) from the main DB.
  const seenTags = new Set<string>()
  const scatter = HASHTAG_DATABASE.filter((h) => {
    if (seenTags.has(h.tag)) return false
    seenTags.add(h.tag)
    return true
  }).map((h) => ({
    tag: h.tag,
    competition: h.competition,
    impressions: h.impressions,
    niche: h.niche,
  }))

  return {
    performanceOverTime,
    topPerforming,
    scatter,
    source: 'mock',
  }
}
