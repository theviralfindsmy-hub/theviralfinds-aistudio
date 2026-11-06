/**
 * A/B Content Testing — Algorithmic Prediction Scorer
 * Fasa 3.4 — TheViralFindsMY
 *
 * Each scorer returns a 0-100 integer. The combined predicted score is a
 * weighted average that prioritises hook strength (most important for
 * scroll-stopping) and CTA clarity (most important for conversion), with
 * hashtags and emotional triggers as supporting signals.
 *
 * The scorer is deterministic and side-effect free so it can run on both
 * AI-generated and mock/template content. It is intentionally transparent
 * (no ML) — every score component can be traced back to a content feature.
 */

import type { PredictionBreakdown, VariantScore } from './types'

// ─── Pattern libraries ─────────────────────────────────────────────────────

/** Power words / phrases that make a strong opening hook */
const HOOK_POWER_WORDS = [
  'murah', 'last', 'alert', 'breaking', 'stop', 'wait', 'rahsia', 'jangan',
  'cepat', 'quick', 'hurry', 'limited', 'flash', 'hot', 'viral', 'bestseller',
  'wajib', 'confirm', 'tipu', 'gila', 'shiok', 'walao', 'cedebest', 'terer',
  'chun', 'kaw', 'mantap', 'terbaik', 'power', 'hidup',
]

/** Strong call-to-action verbs / phrases */
const CTA_VERBS = [
  'click', 'tap', 'grab', 'shop', 'beli', 'sekarang', 'now', 'today',
  'jangan lepaskan', 'cepat', 'link bio', 'link kat bio', 'link dekat bio',
  'add to cart', 'checkout', 'order now', 'shop now', 'get it', 'grab now',
  'tap link', 'click link', 'dm', 'message', 'whatsapp',
]

/** Urgency / scarcity words */
const URGENCY_WORDS = [
  'last', 'limited', 'today', 'now', 'sekarang', 'hurung', 'tinggal',
  'stock', 'flash sale', '24 hours', '24 jam', 'last chance', 'final',
  'before gone', 'jangan lepaskan', 'kang habis', 'cepat',
]

/** Manglish / Malaysian emotional slang */
const EMOTION_WORDS = [
  'gila', 'best', 'shiok', 'walao', 'cedebest', 'terer', 'jealous', 'cute',
  'cantik', 'jom', 'happy', 'excited', 'love', 'suka', 'rajin', 'reward',
  'save', 'murah', 'hidup', 'power', 'amazed', 'shocked', 'worth', 'cun',
  'kaw', 'mantap', 'terbaik', 'gemok', 'sedap', 'pedas', 'merdu', 'lawa',
  'comel', 'terror', 'gempak', 'syok', 'teruk', 'kemik', 'geli',
]

/** Disclosure hashtags that increase trust */
const DISCLOSURE_TAGS = ['ad', 'promosi', 'affiliate', 'sponsored', 'iklan']

/** Platform-branded hashtags */
const PLATFORM_TAGS: Record<string, string[]> = {
  shopee: ['shopeemy', 'shopeemalaysia', 'shopeehaul', 'racunshopee', 'budol'],
  tiktok: ['tiktokmademebuyit', 'tiktokfinds', 'tiktokshop', 'tiktokviral'],
  lazada: ['lazadamy', 'lazadafinds', 'lazadahaul'],
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(n)))

const lower = (s: string) => s.toLowerCase()

const countMatches = (text: string, words: string[]): number =>
  words.reduce((acc, w) => (text.includes(w) ? acc + 1 : acc), 0)

/** Extract hashtags from content (#word) */
export function extractHashtags(content: string): string[] {
  const matches = content.match(/#[\p{L}\p{N}_]+/giu) || []
  // Dedupe case-insensitively, preserve original casing
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of matches) {
    const key = m.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push(m)
    }
  }
  return out
}

// ─── Scoring functions ─────────────────────────────────────────────────────

/**
 * Score the opening hook strength (first ~80 chars).
 *
 * Rewarded features:
 *  - Starts with emoji (visual scroll-stopper)
 *  - First word is a power word
 *  - Contains Manglish slang (relatability)
 *  - Has ALL-CAPS emphasis
 *  - Has ! or ? punctuation
 *  - Hook length is concise (5-80 chars)
 */
export function scoreHookStrength(content: string): number {
  if (!content || !content.trim()) return 0
  const hook = content.slice(0, 80)
  const hookLower = lower(hook)
  let score = 0

  // Emoji at the very start
  if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(hook)) score += 20
  // Power word in first 6 words
  const firstWords = hookLower.split(/\s+/).slice(0, 6).join(' ')
  if (HOOK_POWER_WORDS.some((w) => firstWords.includes(w))) score += 20
  // Manglish slang anywhere in the hook
  if (EMOTION_WORDS.some((w) => hookLower.includes(w))) score += 15
  // ALL-CAPS word (2+ chars)
  if (/\b[A-Z]{2,}\b/.test(hook)) score += 15
  // Exclamation or question mark
  if (/[!?]/.test(hook)) score += 15
  // Concise hook length
  const len = hook.trim().length
  if (len >= 5 && len <= 80) score += 15
  else if (len > 80) score += 8

  return clamp(score)
}

/**
 * Score CTA clarity.
 *
 * Rewarded features:
 *  - Presence of a strong CTA verb
 *  - Reference to a link / DM channel
 *  - Urgency word near the CTA
 *  - Action-emoji (👉 🔗 ⏰ 🛒 🛍️)
 *  - CTA appears in the last 40% of the content (closing punch)
 */
export function scoreCTAClarity(content: string): number {
  if (!content || !content.trim()) return 0
  const text = lower(content)
  let score = 0

  if (CTA_VERBS.some((v) => text.includes(v))) score += 30
  if (/\b(link|bio|dm|dm me|whatsapp|wa\s|shopee\.com\.my|tiktok\.com)\b/.test(text)) score += 25
  if (URGENCY_WORDS.some((w) => text.includes(w))) score += 20
  // Action emoji
  if (/[👉🔗⏰🛒🛍️💵💰🔥✨]/u.test(content)) score += 15

  // CTA in last 40% of content
  const ctaIdx = CTA_VERBS.reduce((idx, v) => {
    const i = text.lastIndexOf(v)
    return i > idx ? i : idx
  }, -1)
  if (ctaIdx >= 0) {
    const ratio = ctaIdx / Math.max(text.length, 1)
    if (ratio >= 0.6) score += 10
    else if (ratio >= 0.4) score += 5
  }

  return clamp(score)
}

/**
 * Score hashtag diversity and relevance.
 *
 * Rewarded features:
 *  - Hashtag count is in the sweet spot (5-9)
 *  - Platform-specific hashtags present
 *  - Disclosure hashtag present (builds trust)
 *  - Mix of trending + niche tags
 */
export function scoreHashtagMix(content: string, hashtagsArg?: string[]): number {
  const hashtags = (hashtagsArg && hashtagsArg.length ? hashtagsArg : extractHashtags(content))
    .map((h) => h.replace(/^#/, '').toLowerCase())

  if (hashtags.length === 0) return 10

  let score = 0
  // Count-based base score
  if (hashtags.length >= 5 && hashtags.length <= 9) score += 50
  else if (hashtags.length >= 3 && hashtags.length <= 12) score += 35
  else if (hashtags.length >= 1) score += 20

  // Diversity — unique tags only
  const unique = new Set(hashtags).size
  if (unique === hashtags.length) score += 10

  // Disclosure tag
  if (hashtags.some((h) => DISCLOSURE_TAGS.some((d) => h.includes(d)))) score += 15
  // Platform tag (any platform)
  const allPlatformTags = Object.values(PLATFORM_TAGS).flat()
  if (hashtags.some((h) => allPlatformTags.includes(h))) score += 15
  // At least one long-tail niche tag (>8 chars = specific)
  if (hashtags.some((h) => h.length > 8)) score += 10

  return clamp(score)
}

/**
 * Score emotional trigger density.
 *
 * Rewarded features:
 *  - Number of emotional words / slang
 *  - Emoji density (visual emotion)
 *  - Exclamation density (enthusiasm)
 */
export function scoreEmotionalTrigger(content: string): number {
  if (!content || !content.trim()) return 0
  const text = lower(content)

  const emotionHits = countMatches(text, EMOTION_WORDS)
  let score = 20 // baseline
  if (emotionHits >= 5) score = 100
  else if (emotionHits >= 3) score = 80
  else if (emotionHits >= 1) score = 55

  // Emoji density
  const emojiMatches = content.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu) || []
  const emojiCount = emojiMatches.length
  if (emojiCount >= 4) score += 15
  else if (emojiCount >= 2) score += 10
  else if (emojiCount >= 1) score += 5

  // Exclamation density
  const bangs = (content.match(/!/g) || []).length
  if (bangs >= 3) score += 10
  else if (bangs >= 1) score += 5

  return clamp(score)
}

// ─── Combined predicted score ──────────────────────────────────────────────

/** Weights — sum to 1.0. Hook + CTA dominate; hashtags + emotion support. */
export const SCORE_WEIGHTS = {
  hook: 0.30,
  cta: 0.25,
  hashtags: 0.20,
  emotion: 0.25,
} as const

/**
 * Calculate the weighted predicted score for a piece of content.
 * Returns both the overall score (0-100) and the per-dimension breakdown.
 */
export function calculatePredictedScore(
  content: string,
  hashtags?: string[]
): VariantScore {
  const breakdown: PredictionBreakdown = {
    hook: scoreHookStrength(content),
    cta: scoreCTAClarity(content),
    hashtags: scoreHashtagMix(content, hashtags),
    emotion: scoreEmotionalTrigger(content),
  }

  const predictedScore = clamp(
    breakdown.hook * SCORE_WEIGHTS.hook +
      breakdown.cta * SCORE_WEIGHTS.cta +
      breakdown.hashtags * SCORE_WEIGHTS.hashtags +
      breakdown.emotion * SCORE_WEIGHTS.emotion
  )

  return { predictedScore, breakdown }
}

/** Human-readable label for a score band — used by the UI for color coding */
export function scoreBand(score: number): {
  label: string
  color: string
  bg: string
  text: string
} {
  if (score >= 80)
    return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-500', text: 'text-emerald-700' }
  if (score >= 65)
    return { label: 'Good', color: 'text-lime-600', bg: 'bg-lime-500', text: 'text-lime-700' }
  if (score >= 50)
    return { label: 'Average', color: 'text-amber-600', bg: 'bg-amber-500', text: 'text-amber-700' }
  if (score >= 35)
    return { label: 'Weak', color: 'text-orange-600', bg: 'bg-orange-500', text: 'text-orange-700' }
  return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-500', text: 'text-red-700' }
}
