import { NextResponse } from 'next/server'
import { PRICING_PLANS, FEATURE_LIST, FEATURE_META, YEARLY_DISCOUNT_PCT } from '@/lib/pricing/plans'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pricing/plans
 * Returns the static catalog of 4 pricing plans + the feature list.
 * Public endpoint (no auth required — pricing page is marketing surface).
 */
export async function GET() {
  try {
    return NextResponse.json({
      plans: PRICING_PLANS,
      features: FEATURE_LIST.map((key) => ({
        key,
        label: FEATURE_META[key].label,
        category: FEATURE_META[key].category,
      })),
      yearlyDiscountPct: YEARLY_DISCOUNT_PCT,
      currency: 'MYR',
      source: 'db' as const,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[pricing/plans] error:', error)
    return NextResponse.json(
      { error: 'Failed to load pricing plans', source: 'db' as const },
      { status: 500 },
    )
  }
}
