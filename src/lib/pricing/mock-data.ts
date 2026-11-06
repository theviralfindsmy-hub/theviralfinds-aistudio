// ─── Pricing Mock Data (Task 4-A / Fasa 4.1) ──────────────────────────────────
//
// In-memory mock store for the demo user's subscription + usage tracking.
// Designed to be swapped for Prisma Subscription / UsageTracking models
// in production (CHECKLIST 4.1.1, 4.1.2) WITHOUT changing the API surface.

import type {
  FeatureKey,
  Subscription,
  UsageMetric,
  UsageTracking,
  UpgradePrompt,
  PricingTier,
} from './types'
import { getFeatureLimit, getPlan } from './plans'
import { getUpgradePrompt } from './feature-gate'

// ─── Current period (YYYY-MM, MYT) ────────────────────────────────────────────

export function currentPeriod(now: Date = new Date()): string {
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// ─── Mock subscription (demo user on Free tier) ───────────────────────────────

const DEMO_USER_ID = 'demo-pricing-user'

const now = new Date()
const isoNow = now.toISOString()
const startISO = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago

const DEFAULT_SUBSCRIPTION: Subscription = {
  id: 'sub_demo_0001',
  userId: DEMO_USER_ID,
  tier: 'free',
  status: 'active',
  billingCycle: 'monthly',
  startDate: startISO,
  endDate: null, // free = perpetual
  cancelledAt: null,
  paymentMethod: null,
  amountRM: 0,
  trialEndsAt: null,
  createdAt: startISO,
  updatedAt: isoNow,
}

// Module-scope mutable state (persists for the server lifetime).
let currentSubscription: Subscription = { ...DEFAULT_SUBSCRIPTION }

export function getMockSubscription(): Subscription {
  return { ...currentSubscription }
}

export function setMockSubscription(next: Subscription): void {
  currentSubscription = { ...next, updatedAt: new Date().toISOString() }
}

// ─── Mock usage tracking ──────────────────────────────────────────────────────

const METERED_FEATURES: FeatureKey[] = ['products', 'links', 'content', 'ai_content']

/** Initial demo usage — user is partway through the month. */
const INITIAL_USAGE: Partial<Record<FeatureKey, number>> = {
  products: 32,
  links: 12,
  content: 3,
  ai_content: 0, // free tier has no AI access
}

let currentUsage: UsageTracking = buildUsageTracking('free', INITIAL_USAGE)

function buildUsageTracking(
  tier: PricingTier,
  counts: Partial<Record<FeatureKey, number>>,
): UsageTracking {
  const period = currentPeriod()
  const metrics: UsageMetric[] = METERED_FEATURES.map((feature) => {
    const limit = getFeatureLimit(tier, feature)
    const count = counts[feature] ?? 0
    return {
      feature,
      label: getPlan(tier).features.find((f) => f.key === feature)?.label ?? feature,
      count,
      limit,
      period,
      lastIncrementAt: isoNow,
    }
  })

  const metered = metrics.filter((m) => m.limit !== null && m.limit > 0)
  const overallUsagePct =
    metered.length === 0
      ? 0
      : Math.round(
          (metered.reduce((acc, m) => acc + (m.count / (m.limit || 1)) * 100, 0) /
            metered.length) *
            100,
        ) / 100

  return {
    userId: DEMO_USER_ID,
    period,
    metrics,
    overallUsagePct,
  }
}

export function getMockUsage(): UsageTracking {
  return {
    ...currentUsage,
    metrics: currentUsage.metrics.map((m) => ({ ...m })),
  }
}

export function incrementMockUsage(feature: FeatureKey, delta: number = 1): UsageTracking {
  const metrics = currentUsage.metrics.map((m) =>
    m.feature === feature
      ? {
          ...m,
          count: m.count + delta,
          lastIncrementAt: new Date().toISOString(),
        }
      : m,
  )
  const metered = metrics.filter((m) => m.limit !== null && m.limit > 0)
  const overallUsagePct =
    metered.length === 0
      ? 0
      : Math.round(
          (metered.reduce((acc, m) => acc + (m.count / (m.limit || 1)) * 100, 0) /
            metered.length) *
            100,
        ) / 100

  currentUsage = {
    ...currentUsage,
    metrics,
    overallUsagePct,
  }
  return getMockUsage()
}

/** Reset usage to a clean slate (called when tier changes to keep numbers sensible). */
export function resetUsageForTier(tier: PricingTier): UsageTracking {
  currentUsage = buildUsageTracking(tier, {})
  return getMockUsage()
}

// ─── Upgrade prompt examples (used by FAQ / empty states) ─────────────────────

export const UPGRADE_PROMPT_EXAMPLES: UpgradePrompt[] = [
  getUpgradePrompt('free', 'content', 5)!,
  getUpgradePrompt('free', 'products', 50)!,
  getUpgradePrompt('free', 'ai_content', 0)!,
  getUpgradePrompt('pro', 'ab_testing', 0)!,
  getUpgradePrompt('business', 'white_label', 0)!,
].filter(Boolean) as UpgradePrompt[]

// ─── Simulated checkout URL builder ───────────────────────────────────────────

let checkoutCounter = 0

export function buildMockCheckoutUrl(
  tier: PricingTier,
  method: 'stripe' | 'billplz',
): { id: string; url: string } {
  checkoutCounter += 1
  const id = `cs_${method}_${Date.now()}_${checkoutCounter}`
  // Simulated URLs — in production these would be real Stripe/Billplz URLs.
  const base = method === 'stripe' ? 'https://checkout.stripe.com/c/pay' : 'https://www.billplz.com/bills'
  const url = `${base}/${id}?tier=${tier}&source=mock`
  return { id, url }
}
