import { NextRequest, NextResponse } from 'next/server'
import { ShopeeAffiliateService } from '@/lib/shopee/affiliate-api'
import { emitConversion, emitClick, emitNotificationGeneric } from '@/lib/realtime/emit'
import { DEMO_USER_ID } from '@/lib/realtime/constants'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/**
 * POST /api/shopee/webhook
 * Receive Shopee Affiliate webhook events (conversions, clicks, etc.)
 *
 * Setup: Configure this URL in your Shopee Affiliate Dashboard > API > Webhook URL
 * The webhook sends real-time conversion/click notifications.
 *
 * Flow:
 *   Shopee ──HTTP──▶ /api/shopee/webhook ──HTTP──▶ notification-service:3003/emit
 *                                                              │
 *                                                              ▼
 *                                                   Socket.io → user's browser
 *                                                              │
 *                                                              ▼
 *                                              sonner toast + sound + bell badge
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.webhook)) {
      return enforceRateLimit(request, RATE_LIMITS.webhook)!
    }
    const body = await request.text()
    const signature = request.headers.get('x-shopee-signature') || ''

    // Get secret from DB to verify
    const { db } = await import('@/lib/db')
    const secretSetting = await db.appSetting.findUnique({
      where: { key: 'shopee_secret' }
    })

    if (!secretSetting) {
      throw ApiError.badRequest('Shopee not configured')
    }

    // Verify webhook signature
    const isValid = ShopeeAffiliateService.verifyWebhookSignature(
      body,
      signature,
      secretSetting.value
    )

    if (!isValid) {
      throw ApiError.unauthorized('Invalid webhook signature')
    }

    // Parse the webhook payload (malformed → 400)
    let payload: { event_type?: string; data?: Record<string, unknown> }
    try {
      payload = JSON.parse(body)
    } catch {
      throw ApiError.badRequest('Invalid JSON in webhook payload')
    }

    // Process different event types
    switch (payload.event_type) {
      case 'order_conversion': {
        // A new conversion happened - save to database
        const data = payload.data ?? {}
        const order_sn = data.order_sn as string | undefined
        const item_id = data.item_id as string | undefined
        const item_name = data.item_name as string | undefined
        const commission = data.commission as number | undefined
        const commission_rate = data.commission_rate as number | undefined

        // Find the affiliate link for this item
        const link = await db.affiliateLink.findFirst({
          where: { productId: item_id?.toString() }
        })

        if (link) {
          // Create conversion record
          await db.conversion.create({
            data: {
              linkId: link.id,
              orderId: order_sn ?? '',
              amount: commission_rate ?? 0,
              commission: commission ?? 0,
              status: 'pending',
            }
          })

          // Update link stats
          await db.affiliateLink.update({
            where: { id: link.id },
            data: {
              conversions: { increment: 1 },
              earnings: { increment: commission ?? 0 },
            }
          })
        }

        // Create notification
        await db.notification.create({
          data: {
            type: 'conversion',
            title: 'New Conversion! 🎉',
            description: `${item_name} - Commission: RM ${(commission ?? 0).toFixed(2)}`,
          }
        })

        // ─── Emit real-time socket event ───────────────────────────────
        // Use the link owner's userId if available, else fall back to demo user.
        const targetUserId = link?.userId || DEMO_USER_ID
        await emitConversion(targetUserId, {
          productName: item_name,
          itemId: item_id?.toString(),
          orderId: order_sn,
          commission: Number(commission) || 0,
          amount: Number(commission_rate) || 0,
        })
        break
      }

      case 'click': {
        // A new click was tracked
        const clickData = payload.data ?? {}
        const item_id = clickData.item_id as string | undefined
        const sub_id = clickData.sub_id as string | undefined
        const item_name = clickData.item_name as string | undefined

        const clickLink = await db.affiliateLink.findFirst({
          where: { productId: item_id?.toString() }
        })

        if (clickLink) {
          await db.affiliateLink.update({
            where: { id: clickLink.id },
            data: { clicks: { increment: 1 } }
          })

          await db.clickRecord.create({
            data: {
              linkId: clickLink.id,
              referer: sub_id || null,
              converted: false,
            }
          })
        }

        // ─── Emit real-time socket event ───────────────────────────────
        const clickUserId = clickLink?.userId || DEMO_USER_ID
        await emitClick(clickUserId, {
          productName: (item_name || clickLink?.productName) ?? undefined,
          itemId: item_id?.toString(),
          referer: sub_id ?? undefined,
        })
        break
      }

      case 'commission_update': {
        // Commission status changed (e.g., confirmed, paid)
        const commissionData = payload.data ?? {}
        const order_sn = commissionData.order_sn as string | undefined
        const commission_status = commissionData.commission_status as string | undefined

        await db.conversion.updateMany({
          where: { orderId: order_sn ?? '' },
          data: { status: commission_status === 'confirmed' ? 'confirmed' : commission_status === 'paid' ? 'paid' : 'rejected' }
        })

        await db.notification.create({
          data: {
            type: 'commission_update',
            title: `Commission ${commission_status}`,
            description: `Order ${order_sn} commission status updated to ${commission_status}`,
          }
        })

        // ─── Emit real-time socket event (generic notification) ────────
        await emitNotificationGeneric(DEMO_USER_ID, {
          title: `Commission ${commission_status}`,
          description: `Order ${order_sn} commission status updated to ${commission_status}`,
          type: 'commission_update',
        })
        break
      }

      default:
        console.warn('[shopee-webhook] Unknown event type received:', payload.event_type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
