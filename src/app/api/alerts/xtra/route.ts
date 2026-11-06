import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

import {
  DEFAULT_ALERT_PREFERENCES,
  type AlertNiche,
  type CommissionAlert,
  type XtraAlertActionRequest,
  type XtraAlertActionResponse,
  type XtraAlertsResponse,
  type XtraProduct,
  type AlertType,
} from '@/lib/alerts/types'
import {
  LAST_CHECKED_AT,
  MOCK_XTRA_PRODUCTS,
  getActiveXtraProducts,
} from '@/lib/alerts/mock-data'
import {
  buildAlertFeedForUser,
  computePotentialExtraEarnings,
  countMatchedAlerts,
  matchAlertToUser,
} from '@/lib/alerts/matcher'

// ─── In-memory store for alert state (per-alert read/dismissed/snoozed) ──────
interface AlertState {
  read: boolean
  dismissed: boolean
  snoozedUntil: string | null
}

const alertState = new Map<string, AlertState>()

function getAlertState(id: string): AlertState {
  if (!alertState.has(id)) {
    alertState.set(id, { read: false, dismissed: false, snoozedUntil: null })
  }
  return alertState.get(id)!
}

/** Validates the niche query param. Returns 'all' if missing or invalid. */
function parseNiche(value: string | null): AlertNiche | 'all' {
  if (!value || value === 'all') return 'all'
  const valid: AlertNiche[] = ['beauty', 'tech', 'fashion', 'home', 'food']
  return valid.includes(value as AlertNiche) ? (value as AlertNiche) : 'all'
}

/** Map a category string to a niche. */
function categoryToNiche(category: string | null): AlertNiche {
  const c = (category || '').toLowerCase()
  if (c.includes('beauty') || c.includes('skincare') || c.includes('makeup') || c.includes('cleanser')) return 'beauty'
  if (c.includes('electronic') || c.includes('gadget') || c.includes('audio') || c.includes('computer') || c.includes('gaming')) return 'tech'
  if (c.includes('fashion') || c.includes('apparel') || c.includes('hijab') || c.includes('sportswear')) return 'fashion'
  if (c.includes('home') || c.includes('kitchen') || c.includes('appliance') || c.includes('bedding')) return 'home'
  if (c.includes('food') || c.includes('beverage') || c.includes('snack')) return 'food'
  return 'beauty' // default
}

// ─── Query real high-commission products from DB ──────────────────────────────

async function getHighCommissionProducts(): Promise<XtraProduct[]> {
  try {
    const links = await db.affiliateLink.findMany({
      where: {
        commissionRate: { gte: 5 },
        status: 'active',
      },
      orderBy: { commissionRate: 'desc' },
      take: 30,
    })

    if (links.length === 0) {
      // No high-commission links in DB — fall back to mock
      return getActiveXtraProducts()
    }

    const now = Date.now()
    const products: XtraProduct[] = links.map((link, idx) => {
      const baseCommission = Number(link.commissionRate) || 5
      // Simulate XTRA boost — products with high commission might have Commission XTRA
      const xtraTypes: AlertType[] = ['live_xtra', 'flash_xtra', 'weekend_xtra', 'mega_xtra']
      const xtraType = xtraTypes[idx % xtraTypes.length]
      const boostMultiplier = xtraType === 'live_xtra' ? 4 + Math.random() * 4
        : xtraType === 'flash_xtra' ? 2 + Math.random() * 3
        : xtraType === 'weekend_xtra' ? 1.5 + Math.random() * 2
        : 1 + Math.random() * 2
      const boostedCommission = Math.min(80, Math.round(baseCommission * boostMultiplier))
      const price = Number(link.productPrice) || 50
      const niche = categoryToNiche(link.category)

      return {
        id: `xtra-db-${link.id}`,
        productName: link.productName || link.name,
        itemId: link.productId || `item-${idx}`,
        thumbnail: link.productImage || `https://picsum.photos/seed/${encodeURIComponent(link.name)}/200/200`,
        baseCommission,
        boostedCommission,
        boostDelta: boostedCommission - baseCommission,
        price,
        niche,
        category: link.category || 'General',
        shopName: 'Shopee Seller',
        xtraType,
        startedAt: new Date(now - Math.floor(Math.random() * 3600000)).toISOString(),
        expiresAt: new Date(now + (1 + Math.floor(Math.random() * 48)) * 3600000).toISOString(),
        estimatedMonthlySales: 100 + Math.floor(Math.random() * 5000),
        rating: 4 + Math.random() * 0.9,
      }
    })

    return products
  } catch (err) {
    console.warn('[/api/alerts/xtra] DB query failed, using mock products:', err)
    return getActiveXtraProducts()
  }
}

// ─── Use LLM to analyze which products might have Commission XTRA ─────────────

async function analyzeXtraPotentialWithAI(products: XtraProduct[]): Promise<XtraProduct[]> {
  try {
    if (products.length === 0) return products

    const zai = await ZAI.create()

    const productList = products.slice(0, 15).map((p, i) =>
      `${i + 1}. ${p.productName} — commission ${p.baseCommission}%→${p.boostedCommission}%, price RM${p.price.toFixed(2)}, category: ${p.category}, niche: ${p.niche}`
    ).join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Shopee Malaysia Commission XTRA analyst. Analyze the product list and determine which products are most likely to have active Commission XTRA boosts right now. Consider:
- Malaysian market seasonality (Raya, 9.9, 11.12, 12.12, back-to-school)
- Product category trends
- Commission rate attractiveness

Return a JSON array of objects with: { "id": string, "xtraType": "live_xtra"|"flash_xtra"|"weekend_xtra"|"mega_xtra", "boostedCommission": number, "reason": string }
Only include products that you believe would realistically have Commission XTRA. Return ONLY the JSON array, no markdown.`,
        },
        {
          role: 'user',
          content: `Analyze these Shopee Malaysia products for Commission XTRA potential:\n\n${productList}`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices?.[0]?.message?.content || ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return products

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      id: string
      xtraType: AlertType
      boostedCommission: number
      reason: string
    }>

    // Update products with AI analysis
    const byId = new Map(products.map((p) => [p.id, p]))
    for (const item of parsed) {
      const product = byId.get(item.id)
      if (product && item.boostedCommission > product.baseCommission) {
        product.xtraType = item.xtraType
        product.boostedCommission = Math.min(80, item.boostedCommission)
        product.boostDelta = product.boostedCommission - product.baseCommission
      }
    }

    return products
  } catch (err) {
    console.warn('[/api/alerts/xtra] AI analysis failed, using DB data as-is:', err)
    return products
  }
}

// ─── Get user alert preferences from DB ──────────────────────────────────────

async function getUserPreferences(userId?: string) {
  if (!userId) return DEFAULT_ALERT_PREFERENCES

  try {
    const prefs = await db.alertPreference.findMany({
      where: { userId },
    })

    if (prefs.length === 0) return DEFAULT_ALERT_PREFERENCES

    const enabledNiches = prefs
      .filter((p) => p.enabled && ['beauty', 'tech', 'fashion', 'home', 'food'].includes(p.alertType as AlertNiche))
      .map((p) => p.alertType as AlertNiche)

    const commissionXtraPref = prefs.find((p) => p.alertType === 'commission_xtra')

    return {
      ...DEFAULT_ALERT_PREFERENCES,
      enabledNiches: enabledNiches.length > 0 ? enabledNiches : DEFAULT_ALERT_PREFERENCES.enabledNiches,
      minCommissionThreshold: commissionXtraPref?.threshold
        ? JSON.parse(commissionXtraPref.threshold).minCommission ?? DEFAULT_ALERT_PREFERENCES.minCommissionThreshold
        : DEFAULT_ALERT_PREFERENCES.minCommissionThreshold,
    }
  } catch (err) {
    console.warn('[/api/alerts/xtra] Failed to load preferences from DB:', err)
    return DEFAULT_ALERT_PREFERENCES
  }
}

// ─── GET /api/alerts/xtra ────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const niche = parseNiche(searchParams.get('niche'))
    const userId = request.headers.get('x-user-id') || undefined

    // 1. Get high-commission products from DB (falls back to mock)
    let allProducts = await getHighCommissionProducts()

    // 2. Use AI to analyze Commission XTRA potential
    allProducts = await analyzeXtraPotentialWithAI(allProducts)

    // 3. Filter by niche if requested
    const filtered =
      niche === 'all'
        ? allProducts
        : allProducts.filter((p) => p.niche === niche)

    // 4. Get user preferences from DB
    const preferences = await getUserPreferences(userId)

    // 5. Build the alert feed
    const feed = buildAlertFeedForUser(filtered, preferences)

    // 6. Apply per-alert user state
    const alerts: CommissionAlert[] = feed
      .map((a) => {
        const state = getAlertState(a.id)
        return {
          ...a,
          read: state.read,
          dismissed: state.dismissed,
          snoozedUntil: state.snoozedUntil,
        }
      })
      .filter((a) => {
        if (a.dismissed) return false
        if (a.snoozedUntil) {
          const until = new Date(a.snoozedUntil).getTime()
          if (until > Date.now()) return false
        }
        return true
      })

    // 7. Aggregate stats
    const matchedCount = countMatchedAlerts(alerts, preferences.minRelevanceScore)
    const avgBoostPercent =
      alerts.length === 0
        ? 0
        : Math.round(
            (alerts.reduce((sum, a) => sum + a.product.boostDelta, 0) / alerts.length) * 10,
          ) / 10
    const potentialExtraEarnings = Math.round(
      alerts.reduce((sum, a) => sum + a.potentialExtraEarnings, 0) * 100,
    ) / 100

    const hasRealData = allProducts.some((p) => p.id.startsWith('xtra-db-'))

    const body: XtraAlertsResponse = {
      alerts,
      products: filtered,
      totalActive: allProducts.length,
      matchedCount,
      avgBoostPercent,
      potentialExtraEarnings,
      niche,
      source: hasRealData ? 'api' : 'mock',
      lastCheckedAt: new Date().toISOString(),
    }

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('[GET /api/alerts/xtra] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch Commission XTRA alerts.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}

// ─── POST /api/alerts/xtra ───────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: XtraAlertActionRequest
    try {
      body = (await request.json()) as XtraAlertActionRequest
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { alertId: string, action: "read" | "dismiss" | "snooze", snoozeMinutes?: number }.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    if (!body || !body.alertId || typeof body.alertId !== 'string') {
      return NextResponse.json(
        {
          error: 'Field "alertId" is required (string).',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    if (!['read', 'dismiss', 'snooze'].includes(body.action)) {
      return NextResponse.json(
        {
          error: 'Field "action" must be one of: read, dismiss, snooze.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    // Store alert preference in DB if userId is available
    const userId = request.headers.get('x-user-id')
    if (userId && body.action === 'dismiss') {
      try {
        await db.alertPreference.upsert({
          where: { userId_alertType: { userId, alertType: 'commission_xtra' } },
          create: { userId, alertType: 'commission_xtra', enabled: true },
          update: { updatedAt: new Date() },
        })
      } catch (dbErr) {
        console.warn('[/api/alerts/xtra] DB preference update failed:', dbErr)
      }
    }

    const state = getAlertState(body.alertId)
    const now = Date.now()

    switch (body.action) {
      case 'read':
        state.read = true
        break
      case 'dismiss':
        state.dismissed = true
        state.read = true
        break
      case 'snooze': {
        const mins = body.snoozeMinutes && body.snoozeMinutes > 0 ? body.snoozeMinutes : 60
        state.snoozedUntil = new Date(now + mins * 60_000).toISOString()
        break
      }
    }

    const response: XtraAlertActionResponse = {
      success: true,
      alertId: body.alertId,
      action: body.action,
      source: 'api',
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[POST /api/alerts/xtra] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update alert state.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}

// ─── Helper exports ──────────────────────────────────────────────────────────

export { computePotentialExtraEarnings, matchAlertToUser }
