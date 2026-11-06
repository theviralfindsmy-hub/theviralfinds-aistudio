// ─── Pricing Plans (Task 4-A / Fasa 4.1) ──────────────────────────────────────
//
// Static configuration for the 4 freemium tiers. Imported by both the API
// routes (/api/pricing/plans, /checkout) and the feature-gate utility.
//
// Malaysian context:
//   - Prices in RM (Ringgit Malaysia).
//   - Pro = RM49/mo, Business = RM149/mo, Enterprise = custom.
//   - Yearly discount = 20% (12 months for the price of ~10).

import type {
  FeatureCapability,
  FeatureKey,
  PricingPlan,
  PricingTier,
} from './types'

// ─── Yearly discount ──────────────────────────────────────────────────────────

export const YEARLY_DISCOUNT_PCT = 20

/** Returns the yearly price (RM) for a plan, applying the 20% discount. */
export function computeYearlyPrice(monthly: number): number {
  const annual = monthly * 12
  const discounted = annual * (1 - YEARLY_DISCOUNT_PCT / 100)
  return Math.round(discounted * 100) / 100
}

// ─── Tier ordering (used by gating) ───────────────────────────────────────────

export const TIER_RANK: Record<PricingTier, number> = {
  free: 0,
  pro: 1,
  business: 2,
  enterprise: 3,
}

export const TIER_LABELS: Record<PricingTier, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
}

// ─── Feature catalogue (rows in the comparison table) ─────────────────────────

export const FEATURE_LIST: FeatureKey[] = [
  'products',
  'links',
  'content',
  'platforms',
  'analytics',
  'ai_content',
  'ab_testing',
  'audience_analyzer',
  'team_members',
  'api_access',
  'priority_support',
  'white_label',
  'custom_integrations',
  'sla',
  'dedicated_support',
]

/** Human-friendly metadata for each feature (label + category). */
export const FEATURE_META: Record<
  FeatureKey,
  { label: string; category: FeatureCapability['category'] }
> = {
  products: { label: 'Products tracked', category: 'core' },
  links: { label: 'Affiliate links / month', category: 'core' },
  content: { label: 'AI content generations / month', category: 'core' },
  platforms: { label: 'Connected platforms', category: 'core' },
  analytics: { label: 'Analytics depth', category: 'core' },
  ai_content: { label: 'AI content engine', category: 'ai' },
  ab_testing: { label: 'A/B testing', category: 'ai' },
  audience_analyzer: { label: 'Audience analyzer', category: 'ai' },
  team_members: { label: 'Team members', category: 'team' },
  api_access: { label: 'API access (calls / day)', category: 'team' },
  priority_support: { label: 'Priority support', category: 'support' },
  white_label: { label: 'White-label dashboard', category: 'enterprise' },
  custom_integrations: { label: 'Custom integrations', category: 'enterprise' },
  sla: { label: 'SLA & uptime guarantee', category: 'enterprise' },
  dedicated_support: { label: 'Dedicated account manager', category: 'enterprise' },
}

// ─── Plan definitions ─────────────────────────────────────────────────────────

const FREE_FEATURES: FeatureCapability[] = [
  feat('products', '50 / month', 50),
  feat('links', '20 / month', 20),
  feat('content', '5 / month', 5),
  feat('platforms', '1 platform', 1),
  feat('analytics', 'Basic (7-day history)', null, true),
  feat('ai_content', '—', 0, false),
  feat('ab_testing', '—', 0, false),
  feat('audience_analyzer', '—', 0, false),
  feat('team_members', '1 (solo)', 1),
  feat('api_access', '—', 0, false),
  feat('priority_support', '—', 0, false),
  feat('white_label', '—', 0, false),
  feat('custom_integrations', '—', 0, false),
  feat('sla', '—', 0, false),
  feat('dedicated_support', '—', 0, false),
]

const PRO_FEATURES: FeatureCapability[] = [
  feat('products', '500 / month', 500),
  feat('links', '200 / month', 200),
  feat('content', '50 / month', 50),
  feat('platforms', 'All platforms', null, true),
  feat('analytics', 'Advanced (90-day history)', null, true),
  feat('ai_content', '50 generations / month', 50),
  feat('ab_testing', '—', 0, false),
  feat('audience_analyzer', '—', 0, false),
  feat('team_members', '1 (solo)', 1),
  feat('api_access', '—', 0, false),
  feat('priority_support', 'Email priority', null, true),
  feat('white_label', '—', 0, false),
  feat('custom_integrations', '—', 0, false),
  feat('sla', '—', 0, false),
  feat('dedicated_support', '—', 0, false),
]

const BUSINESS_FEATURES: FeatureCapability[] = [
  feat('products', 'Unlimited', null, true),
  feat('links', 'Unlimited', null, true),
  feat('content', 'Unlimited', null, true),
  feat('platforms', 'All platforms', null, true),
  feat('analytics', 'Advanced (1-year history)', null, true),
  feat('ai_content', 'Unlimited', null, true),
  feat('ab_testing', 'Unlimited experiments', null, true),
  feat('audience_analyzer', 'Full audience profiles', null, true),
  feat('team_members', '3 members', 3),
  feat('api_access', '1,000 calls / day', 1000),
  feat('priority_support', 'Priority chat + email', null, true),
  feat('white_label', '—', 0, false),
  feat('custom_integrations', '—', 0, false),
  feat('sla', '—', 0, false),
  feat('dedicated_support', '—', 0, false),
]

const ENTERPRISE_FEATURES: FeatureCapability[] = [
  feat('products', 'Unlimited', null, true),
  feat('links', 'Unlimited', null, true),
  feat('content', 'Unlimited', null, true),
  feat('platforms', 'All platforms + custom', null, true),
  feat('analytics', 'Custom dashboards', null, true),
  feat('ai_content', 'Unlimited + custom models', null, true),
  feat('ab_testing', 'Unlimited + multivariate', null, true),
  feat('audience_analyzer', 'Custom audiences', null, true),
  feat('team_members', 'Unlimited', null, true),
  feat('api_access', '10,000 calls / day', 10000),
  feat('priority_support', '24/7 priority', null, true),
  feat('white_label', 'Full white-label', null, true),
  feat('custom_integrations', 'Custom integrations', null, true),
  feat('sla', '99.9% uptime SLA', null, true),
  feat('dedicated_support', 'Dedicated account manager', null, true),
]

// ─── Helper: build a FeatureCapability ────────────────────────────────────────

function feat(
  key: FeatureKey,
  display: string,
  limit: number | null,
  enabled: boolean = true,
): FeatureCapability {
  return {
    key,
    label: FEATURE_META[key].label,
    display,
    limit,
    enabled,
    category: FEATURE_META[key].category,
  }
}

// ─── The 4 plans ──────────────────────────────────────────────────────────────

export const PRICING_PLANS: PricingPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    tagline: 'Cuba dulu, free selamanya',
    description:
      'Untuk affiliate baru nak try power TheViralFindsMY. Buat link, track klik, mula jana commission.',
    priceMonthly: 0,
    priceYearly: 0,
    accent: 'gray',
    cta: 'Get Started',
    features: FREE_FEATURES,
    bullets: [
      '50 produk / bulan',
      '20 affiliate links / bulan',
      '5 AI content generations / bulan',
      '1 platform (Shopee / TikTok / Lazada)',
      'Basic analytics (7 hari)',
      'Community support',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    tagline: 'Untuk affiliate serius',
    description:
      'Bila dah consistent income, naik Pro. AI content, semua platform, advanced analytics.',
    priceMonthly: 49,
    priceYearly: computeYearlyPrice(49),
    accent: 'shopee',
    highlight: true,
    cta: 'Upgrade to Pro',
    features: PRO_FEATURES,
    bullets: [
      '500 produk, 200 links, 50 AI content',
      'Semua platform (Shopee + TikTok + Lazada)',
      'Advanced analytics (90 hari)',
      'AI content generator (Manglish + BM)',
      'Priority email support',
      'Custom short links + QR codes',
    ],
  },
  {
    tier: 'business',
    name: 'Business',
    tagline: 'Untuk team & power user',
    description:
      'Team kecil-kecilan, banyak produk, kena scale. Buat A/B testing, audience analyzer, API access.',
    priceMonthly: 149,
    priceYearly: computeYearlyPrice(149),
    accent: 'hermes',
    cta: 'Upgrade to Business',
    features: BUSINESS_FEATURES,
    bullets: [
      'Unlimited produk, links & AI content',
      'A/B testing untuk caption + thumbnail',
      'Audience analyzer (5 personas)',
      '3 team members included',
      'API access (1,000 calls / hari)',
      'Priority chat + email support',
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    tagline: 'Untuk agency & brand besar',
    description:
      'White-label, unlimited team, dedicated support, custom integrations & SLA. Contact our sales team.',
    priceMonthly: null,
    priceYearly: null,
    accent: 'dark',
    cta: 'Contact Sales',
    features: ENTERPRISE_FEATURES,
    bullets: [
      'White-label dashboard (your brand)',
      'Unlimited team members',
      'Dedicated account manager',
      'Custom integrations (CRM, ERP)',
      '99.9% uptime SLA',
      '10,000 API calls / hari',
    ],
  },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getPlan(tier: PricingTier): PricingPlan {
  const plan = PRICING_PLANS.find((p) => p.tier === tier)
  if (!plan) throw new Error(`Unknown pricing tier: ${tier}`)
  return plan
}

export function getPlanFeatures(tier: PricingTier): FeatureCapability[] {
  return getPlan(tier).features
}

/** True if `tier` enables the feature at all (boolean capability check). */
export function isFeatureAvailable(tier: PricingTier, feature: FeatureKey): boolean {
  const cap = getPlanFeatures(tier).find((f) => f.key === feature)
  return Boolean(cap?.enabled)
}

/** Returns the numeric limit for a feature on a tier (null = unlimited). */
export function getFeatureLimit(
  tier: PricingTier,
  feature: FeatureKey,
): number | null {
  const cap = getPlanFeatures(tier).find((f) => f.key === feature)
  if (!cap || !cap.enabled) return 0
  return cap.limit
}

/** Effective monthly price for a tier + billing cycle (RM). null = custom. */
export function getPrice(
  tier: PricingTier,
  cycle: 'monthly' | 'yearly',
): number | null {
  const plan = getPlan(tier)
  return cycle === 'monthly' ? plan.priceMonthly : plan.priceYearly
}
