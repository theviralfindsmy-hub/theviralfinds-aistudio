import { NextRequest, NextResponse } from 'next/server'
import { validateBody, profitCalculatorSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const body = await validateBody(request, profitCalculatorSchema)
    const {
      product,
      dailyViews = 500,
      clickRate = 5,       // percentage
      conversionRate = 3,  // percentage
      commissionType = 'same-shop',
    } = body

    const price = product.price
    const commissionRate = product.commissionRate
    const views = Math.max(1, dailyViews)
    const cRate = Math.max(0.01, Math.min(20, clickRate)) / 100
    const convRate = Math.max(0.005, Math.min(15, conversionRate)) / 100

    // Shopee commission: same-shop = full, different-shop = 50% of seller rate
    const effectiveCommissionRate = commissionType === 'different-shop'
      ? commissionRate * 0.5
      : commissionRate

    const earningsPerConversion = (price * effectiveCommissionRate) / 100

    // Daily calculations
    const dailyClicks = views * cRate
    const dailyConversions = dailyClicks * convRate
    const dailyEarnings = dailyConversions * earningsPerConversion

    // Monthly (30 days)
    const monthlyClicks = dailyClicks * 30
    const monthlyConversions = dailyConversions * 30
    const monthlyEarnings = dailyEarnings * 30

    // Yearly (365 days)
    const yearlyEarnings = dailyEarnings * 365

    // Break-even: when effort cost = reward
    // Assume RM5/day effort (content creation time)
    const dailyEffortCost = 5
    const breakEvenDays = dailyEarnings > 0 ? Math.ceil(dailyEffortCost / dailyEarnings) : null

    // Goal tracker: views needed to reach X per month
    const goalMilestones = [500, 1000, 2000, 5000, 10000]
    const goalViews = goalMilestones.map(targetMonthly => {
      const targetDaily = targetMonthly / 30
      const earningsPerView = dailyEarnings / views
      if (earningsPerView <= 0) {
        return { target: targetMonthly, viewsNeeded: Infinity, feasible: false }
      }
      const viewsNeeded = Math.ceil(targetDaily / earningsPerView)
      return {
        target: targetMonthly,
        viewsNeeded,
        feasible: viewsNeeded <= 1000000,
      }
    })

    return NextResponse.json({
      product: {
        name: product.name || 'Product',
        price,
        commissionRate,
        effectiveCommissionRate: Math.round(effectiveCommissionRate * 100) / 100,
        commissionType,
      },
      inputs: {
        dailyViews: views,
        clickRate: `${cRate * 100}%`,
        conversionRate: `${convRate * 100}%`,
      },
      daily: {
        clicks: Math.round(dailyClicks * 10) / 10,
        conversions: Math.round(dailyConversions * 100) / 100,
        earnings: Math.round(dailyEarnings * 100) / 100,
      },
      monthly: {
        clicks: Math.round(monthlyClicks),
        conversions: Math.round(monthlyConversions * 10) / 10,
        earnings: Math.round(monthlyEarnings * 100) / 100,
      },
      yearly: {
        earnings: Math.round(yearlyEarnings * 100) / 100,
      },
      perConversion: Math.round(earningsPerConversion * 100) / 100,
      breakEven: breakEvenDays ? {
        days: breakEvenDays,
        effortCostPerDay: dailyEffortCost,
      } : null,
      goalTracker: goalViews,
    })
  } catch (error) {
    return handleError(error)
  }
}
