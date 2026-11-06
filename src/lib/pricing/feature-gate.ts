// ─── Feature Gating (Task 4-A / Fasa 4.1) ─────────────────────────────────────
//
// Pure utility functions used by API middleware and UI components to enforce
// the freemium tier limits. No DB access — pass in the user's tier + current
// usage and the gate returns a structured result.

import type {
  FeatureGateResult,
  FeatureKey,
  PricingTier,
  UpgradePrompt,
} from './types'
import {
  TIER_RANK,
  TIER_LABELS,
  getFeatureLimit,
  getPlanFeatures,
  isFeatureAvailable,
} from './plans'

// ─── Tier comparison ──────────────────────────────────────────────────────────

export function tierGte(a: PricingTier, b: PricingTier): boolean {
  return TIER_RANK[a] >= TIER_RANK[b]
}

/** Returns the minimum tier that enables `feature` (or null if never enabled). */
export function minimumTierForFeature(feature: FeatureKey): PricingTier | null {
  const order: PricingTier[] = ['free', 'pro', 'business', 'enterprise']
  for (const tier of order) {
    if (isFeatureAvailable(tier, feature)) return tier
  }
  return null
}

// ─── Boolean access check ─────────────────────────────────────────────────────

/**
 * Whether the user's tier unlocks the feature at all (regardless of quota).
 * Use this for boolean capabilities (e.g. A/B testing, white-label).
 */
export function checkFeatureAccess(
  userTier: PricingTier,
  feature: FeatureKey,
): boolean {
  return isFeatureAvailable(userTier, feature)
}

// ─── Quota check ──────────────────────────────────────────────────────────────

/**
 * Check whether the user can perform one more action against a metered feature.
 * Returns { allowed, remaining, limit, reason }.
 *
 * - If the feature is disabled on the tier → not allowed, reason=feature_disabled.
 * - If the feature is enabled and limit is null → unlimited, allowed.
 * - If count >= limit → reason=usage_exceeded.
 */
export function checkUsageLimit(
  userTier: PricingTier,
  feature: FeatureKey,
  currentUsage: number,
): FeatureGateResult {
  const enabled = isFeatureAvailable(userTier, feature)
  if (!enabled) {
    return {
      allowed: false,
      reason: 'feature_disabled',
      minimumTier: minimumTierForFeature(feature) ?? undefined,
      remaining: 0,
      limit: 0,
    }
  }

  const limit = getFeatureLimit(userTier, feature)
  if (limit === null) {
    // Unlimited on this tier.
    return { allowed: true, remaining: null, limit: null }
  }

  const remaining = Math.max(0, limit - currentUsage)
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'usage_exceeded',
      remaining: 0,
      limit,
    }
  }
  return { allowed: true, remaining, limit }
}

// ─── Upgrade prompt builder ───────────────────────────────────────────────────

const PROMPT_TEMPLATES: Partial<
  Record<
    FeatureKey,
    (currentTier: PricingTier, currentUsage: number) => Omit<UpgradePrompt, 'id'>
  >
> = {
  products: (currentTier, currentUsage) => ({
    feature: 'products',
    currentTier,
    suggestedTier: currentTier === 'free' ? 'pro' : 'business',
    headline: 'Product tracking dah penuh!',
    body: `You've tracked ${currentUsage} produk this month. Free plan limit 50 je. Upgrade Pro untuk 500 produk, atau Business untuk unlimited.`,
    cta: 'Upgrade sekarang',
    discountBadge: '20% off yearly',
  }),
  links: (currentTier, currentUsage) => ({
    feature: 'links',
    currentTier,
    suggestedTier: currentTier === 'free' ? 'pro' : 'business',
    headline: 'Affiliate link limit reached',
    body: `You've created ${currentUsage} affiliate links this month. Naik Pro untuk 200 links, atau Business untuk unlimited.`,
    cta: 'Upgrade sekarang',
    discountBadge: '20% off yearly',
  }),
  content: (currentTier, currentUsage) => ({
    feature: 'content',
    currentTier,
    suggestedTier: currentTier === 'free' ? 'pro' : 'business',
    headline: 'AI content limit habis',
    body: `You've generated ${currentUsage} AI content this month. Pro plan dapat 50 generations, Business pulak unlimited. Confirm berbaloi!`,
    cta: 'Upgrade untuk lagi AI content',
    discountBadge: '20% off yearly',
  }),
  ai_content: (currentTier) => ({
    feature: 'ai_content',
    currentTier,
    suggestedTier: 'pro',
    headline: 'AI Content engine tak available',
    body: 'Free plan tak ada akses ke AI content generator. Upgrade Pro untuk generate caption, script, hashtags Manglish + B. Masa.',
    cta: 'Unlock AI content',
    discountBadge: '20% off yearly',
  }),
  ab_testing: (currentTier) => ({
    feature: 'ab_testing',
    currentTier,
    suggestedTier: 'business',
    headline: 'A/B testing is Business-only',
    body: 'Nak tahu caption mana yang convert lagi tinggi? A/B testing ada pada Business plan. Test caption, thumbnail, hashtag sampai dapat yang paling power.',
    cta: 'Unlock A/B testing',
    discountBadge: '20% off yearly',
  }),
  audience_analyzer: (currentTier) => ({
    feature: 'audience_analyzer',
    currentTier,
    suggestedTier: 'business',
    headline: 'Audience Analyzer is Business-only',
    body: 'Understand your audience — Beauty Mama, Tech Bro, Fitness Guru, etc. — untuk pilih produk yang confirm laku. Available pada Business plan.',
    cta: 'Unlock Audience Analyzer',
    discountBadge: '20% off yearly',
  }),
  team_members: (currentTier) => ({
    feature: 'team_members',
    currentTier,
    suggestedTier: 'business',
    headline: 'Tambah team members',
    body: 'Nak add lagi team members? Business plan support 3 members. Enterprise dapat unlimited.',
    cta: 'Upgrade untuk team',
    discountBadge: '20% off yearly',
  }),
  api_access: (currentTier) => ({
    feature: 'api_access',
    currentTier,
    suggestedTier: 'business',
    headline: 'API access is Business-only',
    body: 'Nak integrate dengan system sendiri? Business plan dapat 1,000 API calls/hari, Enterprise 10,000/hari.',
    cta: 'Unlock API access',
    discountBadge: '20% off yearly',
  }),
  white_label: (currentTier) => ({
    feature: 'white_label',
    currentTier,
    suggestedTier: 'enterprise',
    headline: 'White-label is Enterprise-only',
    body: 'Nak brand dashboard dengan logo sendiri? Enterprise plan dapat white-label + custom domain + dedicated support.',
    cta: 'Contact Sales',
  }),
  custom_integrations: (currentTier) => ({
    feature: 'custom_integrations',
    currentTier,
    suggestedTier: 'enterprise',
    headline: 'Custom integrations are Enterprise-only',
    body: 'CRM, ERP, custom workflow — our team akan integrate untuk you. Enterprise plan je ada.',
    cta: 'Contact Sales',
  }),
  sla: (currentTier) => ({
    feature: 'sla',
    currentTier,
    suggestedTier: 'enterprise',
    headline: 'SLA & uptime guarantee',
    body: '99.9% uptime SLA dengan penalty kalau gagal. Enterprise plan je ada.',
    cta: 'Contact Sales',
  }),
  dedicated_support: (currentTier) => ({
    feature: 'dedicated_support',
    currentTier,
    suggestedTier: 'enterprise',
    headline: 'Dedicated account manager',
    body: 'Dapat account manager yang kenal business you. Enterprise plan je ada.',
    cta: 'Contact Sales',
  }),
}

/**
 * Builds an UpgradePrompt for the given feature / current usage.
 * Returns null when the user already has the highest possible tier,
 * OR when the feature is fully enabled & within quota.
 */
export function getUpgradePrompt(
  userTier: PricingTier,
  feature: FeatureKey,
  currentUsage: number = 0,
): UpgradePrompt | null {
  // Already on enterprise? No upgrades possible.
  if (userTier === 'enterprise') return null

  // Check if the user actually needs an upgrade.
  const gate = checkUsageLimit(userTier, feature, currentUsage)
  if (gate.allowed && gate.reason === undefined) {
    // Feature enabled and has remaining quota (or unlimited) → no prompt.
    return null
  }

  const template = PROMPT_TEMPLATES[feature]
  if (!template) return null

  const base = template(userTier, currentUsage)
  return {
    id: `prompt-${feature}-${userTier}`,
    ...base,
  }
}

// ─── Convenience: list all features not available on a tier ──────────────────

export function getMissingFeatures(
  userTier: PricingTier,
): FeatureKey[] {
  const all = getPlanFeatures(userTier)
  return all.filter((f) => !f.enabled).map((f) => f.key)
}

/** Tier display name. */
export function tierLabel(tier: PricingTier): string {
  return TIER_LABELS[tier]
}
