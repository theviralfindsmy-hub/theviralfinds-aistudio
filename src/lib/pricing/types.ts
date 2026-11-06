// ─── Pricing & Freemium Types (Task 4-A / Fasa 4.1) ────────────────────────────

/** The 4 subscription tiers offered by TheViralFindsMY. */
export type PricingTier = 'free' | 'pro' | 'business' | 'enterprise'

/** Billing cycle for paid plans. Yearly grants a 20% discount. */
export type BillingCycle = 'monthly' | 'yearly'

/** Payment gateways we (will) integrate. */
export type PaymentMethod = 'stripe' | 'billplz'

/** Lifecycle status of a subscription row. */
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'expired'

/** Feature keys used by the gating layer. Add new features here only. */
export type FeatureKey =
  | 'products'
  | 'links'
  | 'content'
  | 'platforms'
  | 'analytics'
  | 'ai_content'
  | 'ab_testing'
  | 'audience_analyzer'
  | 'team_members'
  | 'api_access'
  | 'priority_support'
  | 'white_label'
  | 'custom_integrations'
  | 'sla'
  | 'dedicated_support'

/** A single numeric or boolean feature capability. */
export interface FeatureCapability {
  key: FeatureKey
  label: string
  /** Human-friendly limit text shown in UI (e.g. "50 / month", "Unlimited", "All platforms"). */
  display: string
  /** Numeric limit (null = unlimited). Used by the gating layer for usage checks. */
  limit: number | null
  /** Whether the feature is enabled at all on this tier. */
  enabled: boolean
  /** Optional category for grouping in the comparison table. */
  category: 'core' | 'ai' | 'team' | 'support' | 'enterprise'
}

/** Static pricing plan definition (config, not user state). */
export interface PricingPlan {
  tier: PricingTier
  name: string
  tagline: string
  description: string
  /** Monthly price in RM. null = custom. */
  priceMonthly: number | null
  /** Yearly price in RM (already discounted). null = custom. */
  priceYearly: number | null
  /** Accent color token for the card. */
  accent: 'gray' | 'shopee' | 'hermes' | 'dark'
  /** Whether the card should show a "Most Popular" badge. */
  highlight?: boolean
  /** CTA button label. */
  cta: string
  /** Full list of features included in the plan. */
  features: FeatureCapability[]
  /** Short marketing bullets for the card (<=6). */
  bullets: string[]
}

/** A user's subscription state. Mirrors the planned Subscription Prisma model. */
export interface Subscription {
  id: string
  userId: string
  tier: PricingTier
  status: SubscriptionStatus
  billingCycle: BillingCycle
  startDate: string
  endDate: string | null
  cancelledAt: string | null
  paymentMethod: PaymentMethod | null
  /** Monthly recurring amount in RM actually charged. */
  amountRM: number
  /** Trial end (if trialing). */
  trialEndsAt: string | null
  createdAt: string
  updatedAt: string
}

/** Per-feature usage metric tracked monthly. */
export interface UsageMetric {
  feature: FeatureKey
  label: string
  /** Count consumed this month. */
  count: number
  /** Hard cap for the user's tier (null = unlimited). */
  limit: number | null
  /** Period bucket, format YYYY-MM. */
  period: string
  /** Last increment timestamp. */
  lastIncrementAt: string
}

/** Aggregate usage tracking for a single user (current month). */
export interface UsageTracking {
  userId: string
  period: string
  metrics: UsageMetric[]
  /** Convenience: percentage of total limit used across metered features. */
  overallUsagePct: number
}

/** Feature gate check result. */
export interface FeatureGateResult {
  allowed: boolean
  /** Reason for denial, if any. */
  reason?: 'tier_too_low' | 'usage_exceeded' | 'feature_disabled'
  /** The minimum tier that would unlock this feature. */
  minimumTier?: PricingTier
  /** Remaining quota (null when unlimited or feature disabled). */
  remaining?: number | null
  limit?: number | null
}

/** Upgrade prompt shown to users hitting a gate. */
export interface UpgradePrompt {
  id: string
  /** The feature the user tried to access. */
  feature: FeatureKey
  /** Current tier. */
  currentTier: PricingTier
  /** The tier we suggest upgrading to. */
  suggestedTier: PricingTier
  /** Short headline, e.g. "You've hit your free content limit". */
  headline: string
  /** Detailed body, Manglish where appropriate. */
  body: string
  /** CTA button text. */
  cta: string
  /** Optional discount badge (e.g. "20% off yearly"). */
  discountBadge?: string
}

/** Checkout request payload. */
export interface CheckoutRequest {
  tier: PricingTier
  billingCycle: BillingCycle
  paymentMethod: PaymentMethod
  /** Optional coupon/promo code. */
  promoCode?: string
}

/** Checkout session response (mock — no real Stripe/Billplz call yet). */
export interface CheckoutSession {
  id: string
  url: string
  tier: PricingTier
  billingCycle: BillingCycle
  paymentMethod: PaymentMethod
  amountRM: number
  currency: 'MYR'
  expiresAt: string
  /** Mock-only flag — real session would redirect to Stripe/Billplz. */
  source: 'mock' | 'db'
}

/** Subscription mutation request body. */
export interface SubscriptionMutationRequest {
  action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate'
  targetTier?: PricingTier
  billingCycle?: BillingCycle
  paymentMethod?: PaymentMethod
}

/** Usage increment request body. */
export interface UsageIncrementRequest {
  feature: FeatureKey
  /** Delta to add (default 1). */
  delta?: number
}
