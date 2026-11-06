import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPlan, getPrice } from '@/lib/pricing/plans'
import type { BillingCycle, CheckoutRequest, CheckoutSession, PaymentMethod, PricingTier } from '@/lib/pricing/types'

export const dynamic = 'force-dynamic'

const VALID_TIERS: PricingTier[] = ['free', 'pro', 'business', 'enterprise']
const VALID_CYCLES: BillingCycle[] = ['monthly', 'yearly']
const VALID_METHODS: PaymentMethod[] = ['stripe', 'billplz']

/**
 * POST /api/pricing/checkout
 * Body: { tier, billingCycle, paymentMethod, promoCode? }
 *
 * Creates a checkout session, records it in the DB, and returns the checkout URL.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be signed in to start checkout.', source: 'db' as const },
        { status: 401 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as CheckoutRequest

    // ─── Validate
    if (!body.tier || !VALID_TIERS.includes(body.tier)) {
      return NextResponse.json(
        { error: 'Invalid tier.', source: 'db' as const },
        { status: 400 },
      )
    }
    if (!body.billingCycle || !VALID_CYCLES.includes(body.billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billingCycle. Must be monthly or yearly.', source: 'db' as const },
        { status: 400 },
      )
    }
    if (!body.paymentMethod || !VALID_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid paymentMethod. Must be stripe or billplz.', source: 'db' as const },
        { status: 400 },
      )
    }

    // Free & Enterprise are special cases.
    if (body.tier === 'free') {
      return NextResponse.json(
        { error: 'Free plan does not require checkout.', source: 'db' as const },
        { status: 400 },
      )
    }
    if (body.tier === 'enterprise') {
      return NextResponse.json(
        {
          error: 'Enterprise requires custom pricing. Please contact our sales team.',
          salesEmail: 'sales@theviralfindsmy.com',
          source: 'db' as const,
        },
        { status: 400 },
      )
    }

    // ─── Compute amount
    const plan = getPlan(body.tier)
    const amount = getPrice(body.tier, body.billingCycle)
    if (amount === null) {
      return NextResponse.json(
        { error: 'Could not determine price for the selected plan.', source: 'db' as const },
        { status: 500 },
      )
    }

    // ─── Build mock checkout URL
    const checkoutId = `cs_${body.paymentMethod}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const base = body.paymentMethod === 'stripe' ? 'https://checkout.stripe.com/c/pay' : 'https://www.billplz.com/bills'
    const checkoutUrl = `${base}/${checkoutId}?tier=${body.tier}&source=db`
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min expiry

    // ─── Record checkout in the DB (update subscription with checkoutUrl)
    let sub = await db.subscription.findUnique({ where: { userId } })
    if (sub) {
      await db.subscription.update({
        where: { id: sub.id },
        data: { checkoutUrl },
      })
    } else {
      // Create a pending subscription
      await db.subscription.create({
        data: {
          userId,
          plan: body.tier,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          checkoutUrl,
        },
      })
    }

    const checkoutSession: CheckoutSession = {
      id: checkoutId,
      url: checkoutUrl,
      tier: body.tier,
      billingCycle: body.billingCycle,
      paymentMethod: body.paymentMethod,
      amountRM: amount,
      currency: 'MYR',
      expiresAt: expiresAt.toISOString(),
      source: 'db',
    }

    return NextResponse.json({
      checkout: checkoutSession,
      plan,
      message: `Redirecting to ${body.paymentMethod === 'stripe' ? 'Stripe' : 'Billplz'} checkout for ${plan.name} (${body.billingCycle}) — RM ${amount.toFixed(2)} ${body.billingCycle === 'yearly' ? '/year' : '/month'}`,
      source: 'db' as const,
    })
  } catch (error) {
    console.error('[pricing/checkout POST] error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session.', source: 'db' as const },
      { status: 500 },
    )
  }
}
