/**
 * Auto-Hashtag Optimizer — Scoring functions
 *
 * Pure, deterministic helpers that turn raw hashtag metrics into
 * normalized 0-100 scores. Kept side-effect free so they can be unit
 * tested and reused by the API route + the dashboard tooltips.
 *
 * Weights (overall score):
 *   - 40% reach        (high impressions = more eyes)
 *   - 30% low competition (easier to rank / get discovered)
 *   - 30% relevance    (matches the niche + content keywords)
 */

import type { Hashtag, HashtagNiche, HashtagPlatform, HashtagScore } from './types'

/**
 * Normalize impressions to a 0-100 reach score using a log scale.
 *
 *   impressions <= 0     → 0
 *   impressions ~ 1k     → ~33
 *   impressions ~ 50k    → ~70
 *   impressions >= 500k  → ~95+
 *
 * Log scale reflects that the marginal value of an extra 1k impressions
 * shrinks as the baseline grows.
 */
export function scoreReach(impressions: number): number {
  if (!impressions || impressions <= 0) return 0
  // log10(x+1) gives a smooth curve; clamp at ~6 (≈1M) for a 100 ceiling.
  const raw = Math.log10(impressions + 1) // 0..6
  const score = Math.min(100, (raw / 6) * 100)
  return Math.round(score)
}

/**
 * Invert the 1-10 competition rating so that low competition = high score.
 * competition = 1  → 100
 * competition = 5  → ~56
 * competition = 10 → 10
 *
 * The curve is intentionally non-linear so that very low competition
 * tags get a strong bonus (they're the easiest discovery wins).
 */
export function scoreCompetition(competition: number): number {
  if (!competition || competition <= 0) return 100
  const c = Math.max(1, Math.min(10, competition))
  // 1 - ((c-1)/9)^1.3 keeps more score at the low end.
  const normalized = 1 - Math.pow((c - 1) / 9, 1.3)
  return Math.round(normalized * 100)
}

/**
 * Compute relevance of a hashtag to a niche + content keywords.
 *
 * - Base score comes from the hashtag's built-in `relevanceScore` for
 *   its niche (or 45 if niche doesn't match).
 * - Keyword matches boost the score (each keyword found in the tag adds
 *   a fixed bonus, capped so a single long tag can't dominate).
 * - Result is clamped to 0-100.
 */
export function scoreRelevance(
  hashtag: Hashtag,
  niche: HashtagNiche,
  contentKeywords: string[] = []
): number {
  const base = hashtag.niche === niche ? hashtag.relevanceScore : 45

  const cleanedKeywords = contentKeywords
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0)

  const tagLower = hashtag.tag.toLowerCase()
  let bonus = 0
  for (const kw of cleanedKeywords) {
    if (tagLower.includes(kw)) {
      bonus += 18
    } else if (kw.length >= 4 && tagLower.includes(kw.slice(0, 4))) {
      bonus += 8
    }
  }
  bonus = Math.min(bonus, 35)

  return Math.max(0, Math.min(100, Math.round(base + bonus)))
}

/** Weighted overall score: 40% reach + 30% low competition + 30% relevance. */
export function calculateOverallScore(
  hashtag: Hashtag,
  niche: HashtagNiche,
  contentKeywords: string[] = []
): HashtagScore {
  const reach = scoreReach(hashtag.impressions)
  const competitionScore = scoreCompetition(hashtag.competition)
  const relevance = scoreRelevance(hashtag, niche, contentKeywords)

  const overall = Math.round(
    reach * 0.4 + competitionScore * 0.3 + relevance * 0.3
  )

  return { reach, competitionScore, relevance, overall }
}

/**
 * Build a short human-readable explanation of why a tag ranks where it does.
 * Used by the dashboard "explanation" column.
 */
export function explainScore(
  hashtag: Hashtag,
  score: HashtagScore,
  niche: HashtagNiche,
  contentKeywords: string[] = []
): string {
  const parts: string[] = []

  if (score.reach >= 75) parts.push('strong reach')
  else if (score.reach >= 50) parts.push('decent reach')
  else parts.push('niche reach')

  if (score.competitionScore >= 75) parts.push('low competition — easy to rank')
  else if (score.competitionScore >= 50) parts.push('moderate competition')
  else parts.push('saturated — harder to stand out')

  if (score.relevance >= 80) parts.push(`highly relevant to ${niche}`)
  else if (score.relevance >= 60) parts.push(`relevant to ${niche}`)

  const matchedKeywords = contentKeywords.filter((k) =>
    hashtag.tag.toLowerCase().includes(k.trim().toLowerCase())
  )
  if (matchedKeywords.length > 0) {
    parts.push(`matches keywords: ${matchedKeywords.slice(0, 3).join(', ')}`)
  }

  if (hashtag.trendDirection === 'up') {
    parts.push(`trending up +${hashtag.trendPercent}%`)
  } else if (hashtag.trendDirection === 'down') {
    parts.push(`trending down ${hashtag.trendPercent}%`)
  }

  return parts.join(' • ')
}

/**
 * Filter the hashtag database by platform + niche, returning only tags
 * the optimizer should consider scoring. Exposed here so the API route
 * and the dashboard use the same filtering logic.
 */
export function filterCandidates(
  hashtags: Hashtag[],
  niche: HashtagNiche,
  platform: HashtagPlatform
): Hashtag[] {
  const sameNiche = hashtags.filter(
    (h) => h.niche === niche && h.platform === platform
  )
  const crossNiche = hashtags
    .filter((h) => h.niche !== niche && h.platform === platform)
    .slice(0, 6)
  return [...sameNiche, ...crossNiche]
}
