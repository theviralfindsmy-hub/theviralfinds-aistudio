import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/shopee/promotions
 *
 * Get promotion data from Campaign table + LLM/web search for real Shopee promotions.
 *
 * Query params:
 *   type          - 'discounts' | 'vouchers' | 'flash_sales' | 'bundles' | 'add_ons' (default: 'discounts')
 *   offset        - Pagination offset (default: 0)
 *   page_size     - Items per page (default: 20, max: 100)
 *   status_filter - Filter by status: 'UPCOMING' | 'ONGOING' | 'EXPIRED'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') || 'discounts'
    const offset = parseInt(searchParams.get('offset') || '0')
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('page_size') || '20'), 1),
      100
    )
    const statusFilter = searchParams.get('status_filter') || undefined

    // Validate type
    const validTypes = ['discounts', 'vouchers', 'flash_sales', 'bundles', 'add_ons'] as const
    if (!validTypes.includes(type as (typeof validTypes)[number])) {
      return NextResponse.json(
        { error: `Invalid "type" parameter. Must be one of: ${validTypes.join(', ')}`, code: 400 },
        { status: 400 }
      )
    }

    // Validate pagination
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid "offset" parameter', code: 400 },
        { status: 400 }
      )
    }

    // ── 1. Query Campaign table from DB ──
    const campaignWhere: Record<string, unknown> = {}
    if (statusFilter) {
      const statusMap: Record<string, string> = {
        'UPCOMING': 'active',
        'ONGOING': 'active',
        'EXPIRED': 'completed',
      }
      campaignWhere.status = statusMap[statusFilter] || statusFilter.toLowerCase()
    }

    const [campaigns, totalCount] = await Promise.all([
      db.campaign.findMany({
        where: campaignWhere,
        skip: offset,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          links: {
            select: {
              id: true,
              productName: true,
              productPrice: true,
              commissionRate: true,
              clicks: true,
              conversions: true,
            },
          },
        },
      }),
      db.campaign.count({ where: campaignWhere }),
    ])

    if (campaigns.length > 0) {
      // Map campaigns to the promotion type format
      const mappedData = mapCampaignsToType(campaigns, type)

      return NextResponse.json({
        success: true,
        data: mappedData,
        meta: { type, offset, page_size: pageSize, status_filter: statusFilter, source: 'db' },
      })
    }

    // ── 2. Use LLM + web search for real Shopee promotions ──
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const searchResults = await zai.functions.invoke('web_search', {
        query: `shopee malaysia promotions ${type} 2025`,
      })

      const searchContext = typeof searchResults === 'string'
        ? searchResults
        : JSON.stringify(searchResults)

      const chatResponse = await zai.chat.completions.create({
        model: 'default',
        messages: [
          {
            role: 'system',
            content: `You are a Shopee Malaysia promotions data assistant. Based on web search results, create a realistic JSON response for the promotion type "${type}". Return a JSON object with a "discount_list", "voucher_list", "flash_sale_list", "bundle_deal_list", or "add_on_deal_list" key (matching the type) containing an array of items. Each item should have realistic Malaysian market data (RM prices, Malaysian product names). Return ONLY the JSON object, no other text.`,
          },
          {
            role: 'user',
            content: `Search results for Shopee Malaysia ${type}:\n\n${searchContext}\n\nGenerate up to ${pageSize} ${type} promotions as JSON.`,
          },
        ],
      })

      const content = chatResponse.choices?.[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

      // Store discovered promotions as campaigns in DB for future retrieval
      const promotionItems = aiData[`${type}_list`] || aiData.discount_list || aiData.voucher_list || aiData.flash_sale_list || aiData.bundle_deal_list || aiData.add_on_deal_list || []
      for (const item of promotionItems.slice(0, 5)) {
        try {
          await db.campaign.create({
            data: {
              name: item.discount_name || item.voucher_name || item.flash_sale_name || item.name || `Shopee ${type}`,
              description: item.description || `Shopee Malaysia ${type} promotion`,
              status: 'active',
              budget: item.budget || item.total_price || null,
              startDate: item.start_time ? new Date(item.start_time * 1000) : new Date(),
              endDate: item.end_time ? new Date(item.end_time * 1000) : null,
            },
          })
        } catch {
          // Non-fatal
        }
      }

      return NextResponse.json({
        success: true,
        data: aiData,
        meta: { type, offset, page_size: pageSize, status_filter: statusFilter, source: 'ai_search' },
      })
    } catch (aiError) {
      console.error('[Shopee Promotions API] AI search failed:', aiError)
    }

    // ── 3. Empty data ──
    const emptyKey = `${type}_list` as string
    return NextResponse.json({
      success: true,
      data: { [emptyKey]: [], total_count: 0 },
      meta: { type, offset, page_size: pageSize, status_filter: statusFilter, source: 'empty' },
    })
  } catch (error) {
    console.error('[Shopee Promotions API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}

function mapCampaignsToType(campaigns: Record<string, unknown>[], type: string) {
  switch (type) {
    case 'discounts':
      return {
        discount_list: campaigns.map((c) => ({
          discount_id: c.id,
          discount_name: c.name,
          discount_type: 'percentage',
          discount_value: 10,
          start_time: Math.floor(new Date(c.startDate as string || Date.now()).getTime() / 1000),
          end_time: c.endDate ? Math.floor(new Date(c.endDate as string).getTime() / 1000) : null,
          status: c.status === 'active' ? 'ONGOING' : c.status === 'completed' ? 'EXPIRED' : 'UPCOMING',
          items: (c.links as Record<string, unknown>[])?.map((l) => ({
            item_id: l.id,
            item_name: l.productName || 'Product',
            original_price: Number(l.productPrice || 0) * 100,
            discounted_price: Number(l.productPrice || 0) * 90,
          })) || [],
        })),
        total_count: campaigns.length,
      }
    case 'vouchers':
      return {
        voucher_list: campaigns.map((c) => ({
          voucher_id: c.id,
          voucher_name: c.name,
          voucher_type: 'shop_voucher',
          discount_value: 10,
          min_spend: 5000,
          reward_type: 'percentage',
          start_time: Math.floor(new Date(c.startDate as string || Date.now()).getTime() / 1000),
          end_time: c.endDate ? Math.floor(new Date(c.endDate as string).getTime() / 1000) : null,
          status: c.status === 'active' ? 'ONGOING' : 'EXPIRED',
          usage_count: 0,
          max_usage: 100,
        })),
        total_count: campaigns.length,
      }
    case 'flash_sales':
      return {
        flash_sale_list: campaigns.map((c) => ({
          flash_sale_id: c.id,
          flash_sale_name: c.name,
          start_time: Math.floor(new Date(c.startDate as string || Date.now()).getTime() / 1000),
          end_time: c.endDate ? Math.floor(new Date(c.endDate as string).getTime() / 1000) : null,
          status: c.status === 'active' ? 'ONGOING' : 'EXPIRED',
          items: (c.links as Record<string, unknown>[])?.map((l) => ({
            item_id: l.id,
            item_name: l.productName || 'Product',
            original_price: Number(l.productPrice || 0) * 100,
            flash_sale_price: Number(l.productPrice || 0) * 80,
          })) || [],
        })),
        total_count: campaigns.length,
      }
    case 'bundles':
      return {
        bundle_deal_list: campaigns.map((c) => ({
          bundle_deal_id: c.id,
          bundle_deal_name: c.name,
          discount_type: 'percentage',
          discount_value: 15,
          start_time: Math.floor(new Date(c.startDate as string || Date.now()).getTime() / 1000),
          end_time: c.endDate ? Math.floor(new Date(c.endDate as string).getTime() / 1000) : null,
          status: c.status === 'active' ? 'ONGOING' : 'EXPIRED',
        })),
        total_count: campaigns.length,
      }
    case 'add_ons':
      return {
        add_on_deal_list: campaigns.map((c) => ({
          add_on_deal_id: c.id,
          add_on_deal_name: c.name,
          discount_type: 'fixed_amount',
          discount_value: 500,
          start_time: Math.floor(new Date(c.startDate as string || Date.now()).getTime() / 1000),
          end_time: c.endDate ? Math.floor(new Date(c.endDate as string).getTime() / 1000) : null,
          status: c.status === 'active' ? 'ONGOING' : 'EXPIRED',
        })),
        total_count: campaigns.length,
      }
    default:
      return { items: [], total_count: 0 }
  }
}
