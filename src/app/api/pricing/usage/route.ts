import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPeriod } from '@/lib/pricing/mock-data'
import { checkUsageLimit, getUpgradePrompt } from '@/lib/pricing/feature-gate'
import { getFeatureLimit, getPlan } from '@/lib/pricing/plans'
import type { FeatureKey, PricingTier, UsageIncrementRequest, UsageMetric, UsageTracking } from '@/lib/pricing/types'

export const dynamic = 'force-dynamic'

const METERED_FEATURES: FeatureKey[] = ['products', 'links', 'content', 'ai_content']

const VALID_FEATURES: FeatureKey[] = [
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

/**
 * Build UsageTracking from a Prisma UsageTracking row + subscription tier.
 */
function buildUsageResponse(
  row: {
    id: string
    userId: string
    period: string
    productsSearched: number
    linksCreated: number
    contentGenerated: number
    postsPublished: number
    aiQueries: number
    createdAt: Date
    updatedAt: Date
  },
  tier: PricingTier,
): UsageTracking {
  const plan = getPlan(tier)

  const counts: Record<string, number> = {
    products: row.productsSearched,
    links: row.linksCreated,
    content: row.contentGenerated,
    ai_content: row.aiQueries,
  }

  const metrics: UsageMetric[] = METERED_FEATURES.map((feature) => {
    const limit = getFeatureLimit(tier, feature)
    const count = counts[feature] ?? 0
    return {
      feature,
      label: plan.features.find((f) => f.key === feature)?.label ?? feature,
      count,
      limit,
      period: row.period,
      lastIncrementAt: row.updatedAt.toISOString(),
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
    userId: row.userId,
    period: row.period,
    metrics,
    overallUsagePct,
  }
}

/**
 * GET /api/pricing/usage
 * Returns the user's usage metrics for the current period from DB.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be signed in to view usage.', source: 'db' as const },
        { status: 401 },
      )
    }

    // Get user's subscription
    const sub = await db.subscription.findUnique({ where: { userId } })
    const tier = (sub?.plan ?? 'free') as PricingTier

    // Get usage for current period
    const period = currentPeriod()
    let usageRow = await db.usageTracking.findUnique({
      where: { userId_period: { userId, period } },
    })

    // If no usage row exists, create one
    if (!usageRow) {
      usageRow = await db.usageTracking.create({
        data: {
          userId,
          period,
          productsSearched: 0,
          linksCreated: 0,
          contentGenerated: 0,
          postsPublished: 0,
          aiQueries: 0,
        },
      })
    }

    const usage = buildUsageResponse(usageRow, tier)

    // Decorate each metric with the gating result
    const metricsWithGate = usage.metrics.map((m) => {
      const gate = checkUsageLimit(tier, m.feature, m.count)
      const prompt = !gate.allowed ? getUpgradePrompt(tier, m.feature, m.count) : null
      return { ...m, gate, upgradePrompt: prompt }
    })

    return NextResponse.json({
      usage: { ...usage, metrics: metricsWithGate },
      tier,
      source: 'db' as const,
    })
  } catch (error) {
    console.error('[pricing/usage GET] error:', error)
    return NextResponse.json(
      { error: 'Failed to load usage.', source: 'db' as const },
      { status: 500 },
    )
  }
}

/**
 * POST /api/pricing/usage
 * Body: { feature, delta? }
 * Increments a usage counter in the DB and returns the gate result.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be signed in to track usage.', source: 'db' as const },
        { status: 401 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as UsageIncrementRequest
    if (!body.feature || !VALID_FEATURES.includes(body.feature)) {
      return NextResponse.json(
        { error: 'Invalid feature key.', source: 'db' as const },
        { status: 400 },
      )
    }

    const delta = typeof body.delta === 'number' && body.delta > 0 ? body.delta : 1

    // Get subscription tier
    const sub = await db.subscription.findUnique({ where: { userId } })
    const tier = (sub?.plan ?? 'free') as PricingTier

    // Get current usage
    const period = currentPeriod()
    let usageRow = await db.usageTracking.findUnique({
      where: { userId_period: { userId, period } },
    })

    if (!usageRow) {
      usageRow = await db.usageTracking.create({
        data: {
          userId,
          period,
          productsSearched: 0,
          linksCreated: 0,
          contentGenerated: 0,
          postsPublished: 0,
          aiQueries: 0,
        },
      })
    }

    const usage = buildUsageResponse(usageRow, tier)

    // Pre-check: is the user allowed to perform one more?
    const currentMetric = usage.metrics.find((m) => m.feature === body.feature)
    const currentCount = currentMetric?.count ?? 0

    const preGate = checkUsageLimit(tier, body.feature, currentCount)
    if (!preGate.allowed) {
      const prompt = getUpgradePrompt(tier, body.feature, currentCount)
      return NextResponse.json({
        allowed: false,
        reason: preGate.reason,
        usage,
        upgradePrompt: prompt,
        source: 'db' as const,
      }, { status: 402 })
    }

    // Increment the counter in DB
    const fieldMap: Record<string, string> = {
      products: 'productsSearched',
      links: 'linksCreated',
      content: 'contentGenerated',
      ai_content: 'aiQueries',
    }

    const dbField = fieldMap[body.feature]
    if (dbField) {
      await db.usageTracking.update({
        where: { id: usageRow.id },
        data: { [dbField]: { increment: delta } },
      })
    }

    // Re-fetch updated usage
    const updatedRow = await db.usageTracking.findUnique({
      where: { id: usageRow.id },
    })

    const updatedUsage = updatedRow ? buildUsageResponse(updatedRow, tier) : usage
    const newMetric = updatedUsage.metrics.find((m) => m.feature === body.feature)
    const postGate = checkUsageLimit(tier, body.feature, newMetric?.count ?? 0)
    const prompt = !postGate.allowed
      ? getUpgradePrompt(tier, body.feature, newMetric?.count ?? 0)
      : null

    return NextResponse.json({
      allowed: true,
      usage: updatedUsage,
      gate: postGate,
      upgradePrompt: prompt,
      source: 'db' as const,
    })
  } catch (error) {
    console.error('[pricing/usage POST] error:', error)
    return NextResponse.json(
      { error: 'Failed to increment usage.', source: 'db' as const },
      { status: 500 },
    )
  }
}
