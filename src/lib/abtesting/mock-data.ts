/**
 * A/B Content Testing — Mock data + template fallback generator
 * Fasa 3.4 — TheViralFindsMY
 *
 * Two responsibilities:
 *  1. `generateTemplateVariants()` — deterministic template-based 3-variant
 *     generation used as a fallback when the AI (z-ai-web-dev-sdk) is
 *     unavailable or fails. Always produces 3 variants (A/B/C) with the
 *     same shape as AI output, and runs them through the scorer.
 *  2. `mockPastTests` — 5 pre-built A/B tests with realistic Malaysian
 *     Manglish content, predicted scores (computed via scorer), and
 *     actual performance data so the dashboard has history on first load.
 */

import { calculatePredictedScore, extractHashtags } from './scorer'
import type {
  AbNiche,
  AbPlatform,
  AbTone,
  AbTestResult,
  ContentVariant,
  VariantStyle,
} from './types'
import { VARIANT_STYLE_META } from './types'

// ─── Helpers ───────────────────────────────────────────────────────────────

let idCounter = 0
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`

/** Build a fully-scored ContentVariant from raw text */
function buildVariant(
  testId: string,
  style: VariantStyle,
  content: string,
  source: 'ai' | 'mock',
  createdAt: string
): ContentVariant {
  const meta = VARIANT_STYLE_META[style]
  const hashtags = extractHashtags(content)
  const { predictedScore, breakdown } = calculatePredictedScore(content, hashtags)
  return {
    id: nextId('var'),
    testId,
    label: meta.label,
    style,
    styleName: meta.name,
    content,
    hashtags,
    predictedScore,
    scoreBreakdown: breakdown,
    isWinner: false,
    actual: null,
    source,
    createdAt,
  }
}

// ─── Template fallback generator ───────────────────────────────────────────

/** Per-niche emoji + sample hashtags for template flavour */
const NICHE_FLAVOR: Record<AbNiche, { emoji: string; tags: string[] }> = {
  Beauty: { emoji: '✨', tags: ['SkincareMY', 'BeautyMustHave', 'GlowUp'] },
  Tech: { emoji: '📱', tags: ['TechMY', 'GadgetReview', 'TechFinds'] },
  Fashion: { emoji: '👗', tags: ['OOTDMY', 'FashionTrends', 'StyleInspo'] },
  Home: { emoji: '🏠', tags: ['HomeDecorMY', 'RumahIdaman', 'HomeHacks'] },
  Food: { emoji: '🍜', tags: ['FoodieMY', 'SedapGila', 'MakanMY'] },
}

const PLATFORM_TAG: Record<AbPlatform, string> = {
  shopee: '#ShopeeMY',
  tiktok: '#TikTokMadeMeBuyIt',
  lazada: '#LazadaMY',
}

/**
 * Generate 3 deterministic template-based variants for a given product.
 * Used as algorithmic fallback when the AI SDK is unavailable.
 */
export function generateTemplateVariants(
  product: string,
  platform: AbPlatform,
  niche: AbNiche,
  tone?: AbTone
): Omit<ContentVariant, 'id' | 'testId' | 'createdAt'>[] {
  const flavor = NICHE_FLAVOR[niche]
  const platTag = PLATFORM_TAG[platform]
  const prod = product.trim() || 'produk ni'
  const toneEmoji = tone === 'Hype' ? '🔥' : tone === 'Professional' ? '✅' : tone === 'Educational' ? '📚' : '💕'

  // Variant A — Direct & Punchy
  const contentA =
    `🔥 MURAH GILA! ${prod} ${flavor.emoji} Harga memang berbaloi, ` +
    `komisen affiliate pun sedap. Click link bio sekarang sebelum habis stock! ` +
    `${platTag} #${niche}Murah ${flavor.tags.map((t) => `#${t}`).join(' ')} #ad`

  // Variant B — Story-Driven
  const contentB =
    `Story time ${toneEmoji}: selalu jealous tengok orang dengan ${prod} ni. ` +
    `Rupanya rahsia dia cuma konsisten je! Lepas try 2 minggu, confirm terer gila. ` +
    `Harga pun tak sampai kantung. Cuba hari ni, link kat bio ${toneEmoji} ` +
    `${platTag} ${flavor.tags.map((t) => `#${t}`).join(' ')} #KisahSebenar #ad`

  // Variant C — Urgency-Focused
  const contentC =
    `⚠️ LAST 24 HOURS! ${prod} ${flavor.emoji} — Flash sale harga turun gila! ` +
    `Stock tinggal sikit je, jangan lepaskan peluang ni. ` +
    `Affiliate komisen 12% menanti. Click link bio NOW ⏰ ` +
    `${platTag} #FlashSaleMY ${flavor.tags.map((t) => `#${t}`).join(' ')} #Cepat #ad`

  const createdAt = new Date().toISOString()
  const styles: VariantStyle[] = ['direct', 'story', 'urgency']
  const bodies = [contentA, contentB, contentC]

  return styles.map((style, i) => {
    const meta = VARIANT_STYLE_META[style]
    const hashtags = extractHashtags(bodies[i])
    const { predictedScore, breakdown } = calculatePredictedScore(bodies[i], hashtags)
    return {
      label: meta.label,
      style,
      styleName: meta.name,
      content: bodies[i],
      hashtags,
      predictedScore,
      scoreBreakdown: breakdown,
      isWinner: false,
      actual: null,
      source: 'mock' as const,
    }
  })
}

// ─── Past A/B tests (history) ──────────────────────────────────────────────

/** Construct a fully-formed past test with pre-set actual performance. */
function makePastTest(args: {
  id: string
  product: string
  platform: AbPlatform
  niche: AbNiche
  tone: AbTone | null
  createdAt: string
  bodies: [string, string, string] // A, B, C content
  actuals: [{ clicks: number; conv: number }, { clicks: number; conv: number }, { clicks: number; conv: number }]
  winnerIndex: 0 | 1 | 2
}): AbTestResult {
  const { id, product, platform, niche, tone, createdAt, bodies, actuals, winnerIndex } = args
  const styles: VariantStyle[] = ['direct', 'story', 'urgency']
  const variants: ContentVariant[] = styles.map((style, i) => {
    const v = buildVariant(id, style, bodies[i], 'mock', createdAt)
    const a = actuals[i]
    const ctr = a.clicks > 0 ? (a.conv / a.clicks) * 100 : 0
    v.actual = {
      clicks: a.clicks,
      conversions: a.conv,
      ctr: Math.round(ctr * 10) / 10,
      loggedAt: createdAt,
    }
    if (i === winnerIndex) v.isWinner = true
    return v
  })
  return {
    id,
    product,
    platform,
    niche,
    tone,
    variants,
    winnerVariantId: variants[winnerIndex].id,
    createdAt,
    source: 'mock',
  }
}

/** 5 past A/B tests with realistic Malaysian content + actual performance. */
export const mockPastTests: AbTestResult[] = [
  makePastTest({
    id: 'test-mock-001',
    product: 'Garnier Vitamin C Serum 30ml',
    platform: 'shopee',
    niche: 'Beauty',
    tone: 'Hype',
    createdAt: '2025-01-12T08:30:00.000Z',
    bodies: [
      '🔥 MURAH GILA! Garnier Serum RM32.90 je. Dapat 12% komisen. Click link bio sekarang sebelum habis stock! #GarnierMY #SkincareMurah #VitaminC #GlowUp #RacunShopee #ad',
      'Story time 🥹: selalu jealous tengok influencer kulit cerah. Rupanya rahsia dia Garnier Serum ni! Cuba hari ni, harga RM32.90 je. Link kat bio 💕 #GarnierMY #SkincareRoutine #KisahSebenar #GlowUp #ad',
      '⚠️ LAST 24 HOURS! Garnier Vitamin C Serum 30ml — harga turun dari RM49.90 ke RM32.90! 12% komisen untuk affiliate. Jangan lepaskan! Link bio NOW ⏰ #FlashSaleMY #GarnierMY #Cepat #SkincareMurah #ad',
    ],
    actuals: [
      { clicks: 412, conv: 38 },
      { clicks: 287, conv: 31 },
      { clicks: 521, conv: 49 },
    ],
    winnerIndex: 2,
  }),
  makePastTest({
    id: 'test-mock-002',
    product: 'Xiaomi Redmi Buds 5 Pro',
    platform: 'tiktok',
    niche: 'Tech',
    tone: 'Casual',
    createdAt: '2025-01-15T14:10:00.000Z',
    bodies: [
      '🔥 BEST GILER! Xiaomi Redmi Buds 5 Pro — ANC memang terer, battery 38 jam. Harga RM199 je. Click link bio sekarang! #TechMY #XiaomiMY #GadgetReview #TikTokMadeMeBuyIt #ad',
      'Story time 💕: selalu struggle dengan earbuds murah yang bater cepat habis. Rupanya Redmi Buds 5 Pro ni tahan 38 jam sumpah shiok! Link bio 🎧 #TechMY #GadgetFinds #KisahSebenar #ad',
      '⚠️ LAST CHANCE! Xiaomi Redmi Buds 5 Pro — flash sale RM199 (normal RM259)! Stock tinggal 20 unit je. Jangan lepaskan! Link bio NOW ⏰ #FlashSaleMY #TechMY #Cepat #GadgetReview #ad',
    ],
    actuals: [
      { clicks: 689, conv: 72 },
      { clicks: 412, conv: 51 },
      { clicks: 598, conv: 61 },
    ],
    winnerIndex: 0,
  }),
  makePastTest({
    id: 'test-mock-003',
    product: 'Baju Kurung Moden Pastel',
    platform: 'lazada',
    niche: 'Fashion',
    tone: 'Casual',
    createdAt: '2025-01-18T11:45:00.000Z',
    bodies: [
      '✨ LAWA GILA! Baju Kurung Moden Pastel — material flowy, jahitan cantik. Harga RM89 je. Grab sekarang sebelum habis! #OOTDMY #BajuKurung #FashionTrends #LazadaMY #Raya2025 #ad',
      'Story time 💕: cari baju raya yang comfy tapi cantik. Jumpa Baju Kurung Moden Pastel ni, confirm pukul! Material tak kedekut. Link bio 🥰 #OOTDMY #StyleInspo #KisahSebenar #Raya2025 #ad',
      '⚠️ RAYA COMING! Baju Kurung Moden Pastel — flash sale RM89 (was RM149)! Stock tinggal sikit, cepat grab! Link bio NOW ⏰ #FlashSaleMY #OOTDMY #Cepat #Raya2025 #ad',
    ],
    actuals: [
      { clicks: 521, conv: 45 },
      { clicks: 612, conv: 58 },
      { clicks: 498, conv: 41 },
    ],
    winnerIndex: 1,
  }),
  makePastTest({
    id: 'test-mock-004',
    product: 'Philips Air Fryer 4.1L',
    platform: 'shopee',
    niche: 'Home',
    tone: 'Educational',
    createdAt: '2025-01-22T16:20:00.000Z',
    bodies: [
      '🔥 WORTH IT! Philips Air Fryer 4.1L — goreng tanpa minyak, lagi sihat. Harga RM299 je. Click link bio sekarang! #HomeDecorMY #PhilipsMY #KitchenHacks #RacunShopee #ad',
      'Story time 📚: selalu ragu nak beli air fryer sebab takut teruk. Lepas cuba Philips 4.1L ni, hidup berubah! Makanan rangup, lagi sihat. Link bio 💚 #HomeDecorMY #KitchenHacks #KisahSebenar #ad',
      '⚠️ LAST 48 HOURS! Philips Air Fryer 4.1L — harga turun RM299 (normal RM449)! Stock terhad. Jangan lepaskan! Link bio NOW ⏰ #FlashSaleMY #HomeDecorMY #Cepat #KitchenHacks #ad',
    ],
    actuals: [
      { clicks: 354, conv: 24 },
      { clicks: 421, conv: 36 },
      { clicks: 487, conv: 33 },
    ],
    winnerIndex: 2,
  }),
  makePastTest({
    id: 'test-mock-005',
    product: 'Maggi Cukup Rasa Pedas Gila Bundle',
    platform: 'tiktok',
    niche: 'Food',
    tone: 'Hype',
    createdAt: '2025-01-25T19:00:00.000Z',
    bodies: [
      '🔥 SEDAP GILA! Maggi Pedas Gila Bundle — 5 pack RM15.90 je. Pedas sampai berpeluh! Click link bio sekarang! #FoodieMY #SedapGila #MaggiMY #TikTokMadeMeBuyIt #MakanMY #ad',
      'Story time 💕: kawan recommend Maggi Pedas Gila ni, sangka tipu je. Rupanya memang shiok, pedas sampai berpeluh! Wajib try. Link bio 🍜 #FoodieMY #SedapGila #KisahSebenar #ad',
      '⚠️ VIRAL ALERT! Maggi Pedas Gila Bundle — flash sale RM15.90 (was RM24.90)! Stock tinggal sikit, cepat grab! Link bio NOW ⏰ #FlashSaleMY #FoodieMY #Cepat #SedapGila #ad',
    ],
    actuals: [
      { clicks: 892, conv: 89 },
      { clicks: 645, conv: 67 },
      { clicks: 1023, conv: 102 },
    ],
    winnerIndex: 2,
  }),
]

// ─── In-memory store (used by /api/abtesting/track) ─────────────────────────
//
// Pre-seeded with the 5 past tests above. The track POST endpoint mutates
// this store; the GET endpoint reads from it. Suitable for single-process
// dev server.

export const abTestingStore: {
  tests: Map<string, AbTestResult>
} = {
  tests: new Map(mockPastTests.map((t) => [t.id, t])),
}

/** Allocate a fresh test id */
export function newTestId(): string {
  return `test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Allocate a fresh variant id */
export function newVariantId(): string {
  return `var-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
