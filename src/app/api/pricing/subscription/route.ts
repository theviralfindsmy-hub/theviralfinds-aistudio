import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPlan, getPrice, TIER_RANK } from '@/lib/pricing/plans'
import { currentPeriod } from '@/lib/pricing/mock-data'
import type { BillingCycle, PaymentMethod, PricingTier, Subscription, SubscriptionMutationRequest } from '@/lib/pricing/types'

export const dynamic = 'force-dynamic'

/**
 * Map a Prisma Subscription to the API Subscription type.
 */
function mapSubscription(row: {
  id: string
  userId: string
  plan: string
  status: string
  startDate: Date
  endDate: Date | null
  cancelAtPeriodEnd: boolean
  checkoutUrl: string | null
  createdAt: Date
  updatedAt: Date
}): Subscription {
  const tier = row.plan as PricingTier
  const plan = getPlan(tier)
  const isFree = tier === 'free'
  const isCancelled = row.status === 'cancelled'
  const isActive = row.status === 'active'

  return {
    id: row.id,
    userId: row.userId,
    tier,
    status: isCancelled ? 'cancelled' : isActive ? 'active' : (row.status as Subscription['status']),
    billingCycle: 'monthly' as BillingCycle,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate?.toISOString() ?? null,
    cancelledAt: isCancelled ? row.updatedAt.toISOString() : null,
    paymentMethod: null as PaymentMethod | null,
    amountRM: isFree ? 0 : (plan.priceMonthly ?? 0),
    trialEndsAt: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/**
 * GET /api/pricing/subscription
 * Returns the user's current subscription from DB.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', source: 'db' as const },
        { status: 401 },
      )
    }

    const sub = await db.subscription.findUnique({
      where: { userId },
    })

    if (!sub) {
      // Return a default free subscription
      const defaultSub: Subscription = {
        id: 'sub_free',
        userId,
        tier: 'free',
        status: 'active',
        billingCycle: 'monthly',
        startDate: new Date().toISOString(),
        endDate: null,
        cancelledAt: null,
        paymentMethod: null,
        amountRM: 0,
        trialEndsAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return NextResponse.json({
        subscription: defaultSub,
        source: 'db' as const,
      })
    }

    return NextResponse.json({
      subscription: mapSubscription(sub),
      source: 'db' as const,
    })
  } catch (error) {
    console.error('[pricing/subscription GET] error:', error)
    return NextResponse.json(
      { error: 'Failed to load subscription', source: 'db' as const },
      { status: 500 },
    )
  }
}

/**
 * POST /api/pricing/subscription
 * Body: { action, targetTier?, billingCycle?, paymentMethod? }
 * Updates the user's subscription in the DB.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be signed in to manage your subscription.', source: 'db' as const },
        { status: 401 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as SubscriptionMutationRequest
    const { action } = body
    if (!action || !['upgrade', 'downgrade', 'cancel', 'reactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be upgrade | downgrade | cancel | reactivate.', source: 'db' as const },
        { status: 400 },
      )
    }

    // Get current subscription
    let sub = await db.subscription.findUnique({ where: { userId } })

    // If no subscription, create a free one
    if (!sub) {
      sub = await db.subscription.create({
        data: {
          userId,
          plan: 'free',
          status: 'active',
          startDate: new Date(),
        },
      })
    }

    const currentTier = sub.plan as PricingTier
    let nextTier: PricingTier = currentTier
    let nextStatus = sub.status
    let nextEnd: Date | null = sub.endDate

    if (action === 'upgrade' || action === 'downgrade') {
      const target = body.targetTier as PricingTier | undefined
      if (!target || !['free', 'pro', 'business', 'enterprise'].includes(target)) {
        return NextResponse.json(
          { error: 'Invalid targetTier.', source: 'db' as const },
          { status: 400 },
        )
      }

      if (action === 'upgrade' && TIER_RANK[target] <= TIER_RANK[currentTier]) {
        return NextResponse.json(
          { error: `Upgrade must target a higher tier than ${currentTier}.`, source: 'db' as const },
          { status: 400 },
        )
      }
      if (action === 'downgrade' && TIER_RANK[target] >= TIER_RANK[currentTier]) {
        return NextResponse.json(
          { error: `Downgrade must target a lower tier than ${currentTier}.`, source: 'db' as const },
          { status: 400 },
        )
      }

      nextTier = target
      nextStatus = 'active'
      nextEnd = target === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    } else if (action === 'cancel') {
      nextStatus = 'cancelled'
      nextEnd = sub.endDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    } else if (action === 'reactivate') {
      nextStatus = 'active'
      nextEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    const updated = await db.subscription.update({
      where: { id: sub.id },
      data: {
        plan: nextTier,
        status: nextStatus,
        endDate: nextEnd,
        cancelAtPeriodEnd: action === 'cancel',
      },
    })

    const plan = getPlan(nextTier)

    return NextResponse.json({
      subscription: mapSubscription(updated),
      plan,
      message: `Subscription ${action} succeeded — you are now on the ${plan.name} plan.`,
      source: 'db' as const,
    })
  } catch (error) {
    console.error('[pricing/subscription POST] error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription.', source: 'db' as const },
      { status: 500 },
    )
  }
}
