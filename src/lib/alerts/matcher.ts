/**
 * Smart Commission XTRA Alert Bot — Relevance Matcher
 *
 * Fasa 3.3 (CHECKLIST Section 3.3.4).
 *
 * The matcher takes a raw `XtraProduct` (a Commission XTRA signal detected
 * by the monitor) and scores how relevant it is to the affiliate's chosen
 * niche. The resulting 0-100 relevance score gates whether an alert gets
 * pushed to the user.
 *
 * Scoring breakdown (max 100):
 *   1. Niche match          — up to 40 points
 *   2. Commission magnitude — up to 30 points
 *   3. Expiry urgency       — up to 20 points
 *   4. Keyword boost        — up to 10 points
 *
 * A score >= 60 (default `minRelevanceScore`) will trigger an alert push.
 */

import type {
  AlertNiche,
  AlertPreferences,
  AlertSeverity,
  AlertType,
  CommissionAlert,
  XtraProduct,
} from './types'
import { DEFAULT_ALERT_PREFERENCES } from './types'

// ─── Niche keyword dictionaries ─────────────────────────────────────────────
//
// Used by the keyword-boost scoring component. Keywords are matched
// case-insensitively against the product name + category.
//
const NICHE_KEYWORDS: Record<AlertNiche, string[]> = {
  beauty: [
    'serum',
    'cream',
    'moisturizer',
    'skincare',
    'cleanser',
    'lipstick',
    'foundation',
    'mask',
    'vitamin c',
    'oxywhite',
    'garnier',
    'safi',
    'cetaphil',
    'beauty',
    'makeup',
    'sunscreen',
    'toner',
  ],
  tech: [
    'phone',
    'earbuds',
    'headphone',
    'speaker',
    'charger',
    'power bank',
    'mouse',
    'keyboard',
    'monitor',
    'xiaomi',
    'anker',
    'logitech',
    'router',
    'laptop',
    'tablet',
    'gadget',
    'audio',
    'wireless',
  ],
  fashion: [
    'shirt',
    'pants',
    'shorts',
    'dress',
    'tudung',
    'hijab',
    'bawal',
    'kurung',
    'shoes',
    'sneakers',
    'nike',
    'uniqlo',
    'adidas',
    'apparel',
    'sportswear',
    'jacket',
    'bag',
  ],
  home: [
    'air fryer',
    'vacuum',
    'blender',
    'rice cooker',
    'kettle',
    'bed sheet',
    'pillow',
    'lamp',
    'philips',
    'dyson',
    'panasonic',
    'appliance',
    'kitchen',
    'home',
    'decor',
    'furniture',
    'bedding',
  ],
  food: [
    'coffee',
    'kopi',
    'snack',
    'biscuit',
    'noodle',
    'mi',
    'mamee',
    'super ring',
    'old town',
    'milo',
    'nescafe',
    'drink',
    'beverage',
    'tea',
    'chocolate',
    'cereal',
  ],
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Clamp a number to the [0, max] range. */
function clamp(n: number, max: number): number {
  if (n < 0) return 0
  if (n > max) return max
  return n
}

/** Minutes remaining until expiry (negative if already expired). */
export function minutesUntilExpiry(expiresAt: string, now: number = Date.now()): number {
  return Math.round((new Date(expiresAt).getTime() - now) / 60_000)
}

/**
 * Compute severity from expiry urgency + commission magnitude.
 *
 *   critical  — expires < 2h OR commission boost >= 40pp
 *   high      — expires < 8h OR commission boost >= 25pp
 *   medium    — expires < 24h OR commission boost >= 15pp
 *   low       — everything else
 */
export function computeSeverity(product: XtraProduct, now: number = Date.now()): AlertSeverity {
  const minsLeft = minutesUntilExpiry(product.expiresAt, now)
  const boost = product.boostDelta

  if (minsLeft < 120 || boost >= 40) return 'critical'
  if (minsLeft < 480 || boost >= 25) return 'high'
  if (minsLeft < 1440 || boost >= 15) return 'medium'
  return 'low'
}

// ─── Core matcher ───────────────────────────────────────────────────────────

export interface MatchResult {
  /** 0-100 relevance score. */
  score: number
  /** Component breakdown (for debugging / tooltip display). */
  breakdown: {
    niche: number
    commission: number
    urgency: number
    keyword: number
  }
  /** Whether the score meets the threshold for pushing an alert. */
  passes: boolean
}

/**
 * Compute the 0-100 relevance score for a product against a single niche.
 *
 * This is the pure scoring function — `matchAlertToUser` below wraps it with
 * preference-gating and produces the final `CommissionAlert`.
 */
export function scoreProductForNiche(
  product: XtraProduct,
  niche: AlertNiche,
  options: { now?: number } = {},
): MatchResult {
  const now = options.now ?? Date.now()

  // 1. Niche match (40 pts) -------------------------------------------------
  // Full 40 if the product's primary niche matches, partial credit (15) if
  // the product is in a *related* niche (e.g. beauty ↔ fashion).
  const RELATED: Record<AlertNiche, AlertNiche[]> = {
    beauty: ['fashion'],
    tech: ['home'],
    fashion: ['beauty'],
    home: ['tech', 'food'],
    food: ['home'],
  }
  let nicheScore = 0
  if (product.niche === niche) nicheScore = 40
  else if (RELATED[niche].includes(product.niche)) nicheScore = 15

  // 2. Commission magnitude (30 pts) ---------------------------------------
  // Scale the boost delta to 0-30. A 40+ pp boost earns the full 30.
  const commissionScore = clamp((product.boostDelta / 40) * 30, 30)

  // 3. Expiry urgency (20 pts) ---------------------------------------------
  // Tighter window = more urgent. Expires in <1h → full 20; >24h → 4.
  const minsLeft = minutesUntilExpiry(product.expiresAt, now)
  let urgencyScore: number
  if (minsLeft <= 0) urgencyScore = 0
  else if (minsLeft < 60) urgencyScore = 20
  else if (minsLeft < 180) urgencyScore = 16
  else if (minsLeft < 480) urgencyScore = 12
  else if (minsLeft < 1440) urgencyScore = 8
  else urgencyScore = 4
  urgencyScore = clamp(urgencyScore, 20)

  // 4. Keyword boost (10 pts) ----------------------------------------------
  // Award points if any of the niche's keywords appear in the product name
  // or category. Each keyword hit adds 2 pts (cap 10).
  const haystack = `${product.productName} ${product.category}`.toLowerCase()
  let keywordHits = 0
  for (const kw of NICHE_KEYWORDS[niche]) {
    if (haystack.includes(kw)) keywordHits++
  }
  const keywordScore = clamp(keywordHits * 2, 10)

  const total = Math.round(nicheScore + commissionScore + urgencyScore + keywordScore)
  return {
    score: total,
    breakdown: {
      niche: nicheScore,
      commission: Math.round(commissionScore),
      urgency: urgencyScore,
      keyword: keywordScore,
    },
    passes: total >= 60,
  }
}

/**
 * Score a product against ALL of the user's enabled niches and return the
 * best (max) score. Used when the affiliate has multiple niches enabled.
 */
export function scoreProductForUser(
  product: XtraProduct,
  niches: AlertNiche[],
  options: { now?: number } = {},
): MatchResult {
  if (niches.length === 0) {
    // No niches selected — neutral score (pass-through, never blocks).
    return {
      score: 50,
      breakdown: { niche: 0, commission: 0, urgency: 0, keyword: 0 },
      passes: true,
    }
  }
  let best: MatchResult | null = null
  for (const n of niches) {
    const r = scoreProductForNiche(product, n, options)
    if (!best || r.score > best.score) best = r
  }
  return best!
}

// ─── Alert construction ────────────────────────────────────────────────────

/** Pretty-print the AlertType for the headline. */
function typeLabel(t: AlertType): string {
  switch (t) {
    case 'live_xtra':
      return 'Shopee Live XTRA'
    case 'flash_xtra':
      return 'Flash XTRA'
    case 'weekend_xtra':
      return 'Weekend XTRA'
    case 'mega_xtra':
      return 'Mega XTRA'
  }
}

/** Build the alert description (Manglish tone). */
function buildDescription(product: XtraProduct): string {
  const pct = (v: number) => `${v}%`
  return `Commission naik dari ${pct(product.baseCommission)} → ${pct(
    product.boostedCommission,
  )} (+${product.boostDelta}pp). Harga RM ${product.price.toFixed(2)} dari ${product.shopName}.`
}

/**
 * Estimate the extra RM the affiliate could earn if they convert a typical
 * monthly sales volume at the boosted rate vs. the base rate.
 *
 *   extraEarnings = price × (boostDelta / 100) × estimatedMonthlySales × 0.05
 *
 * The 0.05 factor represents a conservative "affiliate-driven share" of
 * total monthly sales (5%) — realistic for a mid-tier Malaysian affiliate.
 */
export function computePotentialExtraEarnings(product: XtraProduct): number {
  const affiliateShare = 0.05
  const earnings = product.price * (product.boostDelta / 100) * product.estimatedMonthlySales * affiliateShare
  return Math.round(earnings * 100) / 100
}

/**
 * The headline entry point: turn a raw XTRA product signal into a
 * user-relevant `CommissionAlert` (or `null` if it fails the threshold).
 *
 * If `preferences.minRelevanceScore` is set, alerts below that threshold are
 * still returned but flagged with `relevanceScore` so the UI can choose to
 * hide them. Use `matchAlertToUser(...)?.passes` to gate push notifications.
 */
export function matchAlertToUser(
  product: XtraProduct,
  userNiches: AlertNiche[],
  options: {
    now?: number
    alertId?: string
    read?: boolean
    dismissed?: boolean
    snoozedUntil?: string | null
    createdAt?: string
  } = {},
): CommissionAlert {
  const now = options.now ?? Date.now()
  const match = scoreProductForUser(product, userNiches, { now })
  const severity = computeSeverity(product, now)
  const potential = computePotentialExtraEarnings(product)

  return {
    id: options.alertId ?? `alert-${product.id}`,
    product,
    type: product.xtraType,
    severity,
    relevanceScore: match.score,
    title: `${typeLabel(product.xtraType)} — ${product.productName}`,
    description: buildDescription(product),
    potentialExtraEarnings: potential,
    createdAt: options.createdAt ?? new Date(now - 60_000).toISOString(),
    expiresAt: product.expiresAt,
    read: options.read ?? false,
    dismissed: options.dismissed ?? false,
    snoozedUntil: options.snoozedUntil ?? null,
  }
}

/**
 * Batch helper: build alerts for every active XTRA product, filtered by the
 * user's preferences (only niches they care about, only commissions above
 * their threshold). Returns alerts sorted by (relevance desc, expiry asc).
 */
export function buildAlertFeedForUser(
  products: XtraProduct[],
  preferences: AlertPreferences = DEFAULT_ALERT_PREFERENCES,
  options: { now?: number } = {},
): CommissionAlert[] {
  const now = options.now ?? Date.now()
  const active = products.filter((p) => new Date(p.expiresAt).getTime() > now)

  const alerts = active
    .map((p) => matchAlertToUser(p, preferences.enabledNiches, { now }))
    // Apply preference filters.
    .filter((a) => {
      if (preferences.minCommissionThreshold > 0 && a.product.boostedCommission < preferences.minCommissionThreshold) {
        return false
      }
      // Don't hard-filter by minRelevanceScore here — let the UI show them
      // with a "low relevance" badge so users can discover opportunities
      // outside their niche. The push-notification gate uses `passes`.
      return true
    })

  // Sort: highest relevance first, then soonest expiry.
  alerts.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore
    }
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
  })

  return alerts
}

/** Convenience: count alerts that pass the relevance threshold. */
export function countMatchedAlerts(
  alerts: CommissionAlert[],
  minRelevance: number = DEFAULT_ALERT_PREFERENCES.minRelevanceScore,
): number {
  return alerts.filter((a) => a.relevanceScore >= minRelevance).length
}
