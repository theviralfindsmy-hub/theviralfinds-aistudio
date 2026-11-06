import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'
import { ShopeeOpenAPIClient, type ShopeeOpenAPIConfig } from '@/lib/shopee/open-api-client'

/**
 * GET /api/shopee/products
 *
 * Search/list products. Priority: real Shopee API → DB AffiliateLinks → LLM/web search.
 *
 * Query params:
 *   keyword     - Search keyword (optional)
 *   category_id - Category ID filter (optional)
 *   offset      - Pagination offset (default: 0)
 *   page_size   - Items per page (default: 20, max: 100)
 *   sort        - Sort order: RELEVANCE | LATEST | PRICE_ASC | PRICE_DESC | SALES
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)

    const keyword = searchParams.get('keyword') || undefined
    const categoryId = searchParams.get('category_id')
      ? parseInt(searchParams.get('category_id')!)
      : undefined
    const offset = parseInt(searchParams.get('offset') || '0')
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('page_size') || '20'), 1),
      100
    )
    const sort = searchParams.get('sort') as
      | 'RELEVANCE'
      | 'LATEST'
      | 'PRICE_ASC'
      | 'PRICE_DESC'
      | 'SALES'
      | null

    // Validate pagination
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid "offset" parameter', code: 400 },
        { status: 400 }
      )
    }
    if (isNaN(pageSize)) {
      return NextResponse.json(
        { error: 'Invalid "page_size" parameter', code: 400 },
        { status: 400 }
      )
    }

    // ── 1. Try real Shopee Open API if credentials exist ──
    try {
      const settings = await db.appSetting.findMany({
        where: {
          key: { in: ['shopee_partner_id', 'shopee_partner_key', 'shopee_shop_id', 'shopee_access_token', 'shopee_region'] },
        },
      })
      const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

      if (settingsMap.shopee_partner_id && settingsMap.shopee_partner_key) {
        const client = new ShopeeOpenAPIClient({
          partnerId: parseInt(settingsMap.shopee_partner_id),
          partnerKey: settingsMap.shopee_partner_key,
          region: (settingsMap.shopee_region as 'MY' | 'SG' | 'ID' | 'TH' | 'PH' | 'VN') || 'MY',
          shopId: settingsMap.shopee_shop_id ? parseInt(settingsMap.shopee_shop_id) : undefined,
          accessToken: settingsMap.shopee_access_token,
        } as ShopeeOpenAPIConfig)

        if (keyword || categoryId) {
          const result = await client.product.searchItem({
            keyword,
            category_id: categoryId,
            offset,
            page_size: pageSize,
            sort_by: sort ?? 'RELEVANCE',
          })
          if (result.error === 0) {
            return NextResponse.json({
              success: true,
              data: result.response,
              meta: { offset, page_size: pageSize, sort: sort ?? 'RELEVANCE', keyword, category_id: categoryId, source: 'shopee_open_api' },
            })
          }
        } else {
          const itemListResult = await client.product.getItemList({ offset, page_size: pageSize })
          if (itemListResult.error === 0) {
            const itemIds = itemListResult.response.item.map((i: { item_id: number }) => i.item_id)
            const itemDetails: unknown[] = []
            if (itemIds.length > 0) {
              const baseInfoResult = await client.product.getItemBaseInfo({ item_id_list: itemIds })
              if (baseInfoResult.error === 0) {
                itemDetails.push(...(baseInfoResult.response.item_list || []))
              }
            }
            return NextResponse.json({
              success: true,
              data: {
                items: itemDetails.length > 0 ? itemDetails : itemListResult.response.item,
                pagination: {
                  has_next: itemListResult.response.has_next,
                  next_offset: itemListResult.response.next_offset,
                  total_count: itemListResult.response.total_count,
                },
              },
              meta: { offset, page_size: pageSize, source: 'shopee_open_api' },
            })
          }
        }
      }
    } catch (openApiError) {
      console.error('[Shopee Products API] Open API failed, falling back:', openApiError)
    }

    // ── 2. Try Shopee Affiliate GraphQL API ──
    try {
      const shopeeService = await getShopeeServiceFromDB()
      if (shopeeService && !shopeeService.isUsingMock) {
        const result = await shopeeService.searchProducts(keyword || '', {
          limit: pageSize,
          categoryId,
        })
        if (result.products.length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              items: result.products.map((p) => ({
                item_id: p.itemId,
                item_name: p.name,
                item_status: 'NORMAL' as const,
                category_id: p.categoryId,
                image: [{ image_url: p.image }],
                price_info: [{ original_price: Math.round((p.originalPrice ?? p.price) * 100), current_price: Math.round(p.price * 100) }],
                commission_info: { commission_rate: p.commissionRate, commission_min: p.commissionMin, commission_max: p.commissionMax },
                sales: p.sales,
                rating_star: p.ratingStar,
                shop_info: { shop_id: p.shopId, shop_name: p.shopName },
              })),
              pagination: { has_next: result.total > offset + pageSize, next_offset: offset + pageSize, total_count: result.total },
            },
            meta: { offset, page_size: pageSize, sort: sort ?? 'RELEVANCE', keyword, source: 'graphql_api' },
          })
        }
      }
    } catch (graphqlError) {
      console.error('[Shopee Products API] GraphQL failed, falling back:', graphqlError)
    }

    // ── 3. Query AffiliateLink table from DB ──
    const where: Record<string, unknown> = {}
    if (keyword) {
      where.OR = [
        { productName: { contains: keyword } },
        { name: { contains: keyword } },
        { category: { contains: keyword } },
        { tags: { contains: keyword } },
      ]
    }
    if (categoryId) {
      where.category = String(categoryId)
    }

    const [dbProducts, totalCount] = await Promise.all([
      db.affiliateLink.findMany({
        where,
        skip: offset,
        take: pageSize,
        orderBy: sort === 'SALES'
          ? { clicks: 'desc' }
          : sort === 'PRICE_ASC'
          ? { productPrice: 'asc' }
          : sort === 'PRICE_DESC'
          ? { productPrice: 'desc' }
          : { createdAt: 'desc' },
        include: { clickRecords: { take: 1 } },
      }),
      db.affiliateLink.count({ where }),
    ])

    if (dbProducts.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          items: dbProducts.map((link) => ({
            item_id: link.productId || link.id,
            item_name: link.productName || link.name,
            item_status: link.status === 'active' ? 'NORMAL' : 'UNLISTED',
            category_id: link.category,
            image: link.productImage ? [{ image_url: link.productImage }] : [],
            price_info: link.productPrice
              ? [{ original_price: Math.round(Number(link.productPrice) * 100), current_price: Math.round(Number(link.productPrice) * 100) }]
              : [],
            commission_info: link.commissionRate
              ? { commission_rate: Number(link.commissionRate), commission_min: Number(link.commission || 0), commission_max: Number(link.commission || 0) }
              : null,
            sales: link.clicks,
            conversions: link.conversions,
            earnings: Number(link.earnings),
            short_code: link.shortCode,
            affiliate_url: link.affiliateUrl,
            created_at: link.createdAt.toISOString(),
          })),
          pagination: {
            has_next: totalCount > offset + pageSize,
            next_offset: offset + pageSize,
            total_count: totalCount,
          },
        },
        meta: { offset, page_size: pageSize, sort: sort ?? 'RELEVANCE', keyword, source: 'db' },
      })
    }

    // ── 4. Use LLM + web search for product discovery ──
    if (keyword) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default
        const zai = await ZAI.create()

        // Search the web for real Shopee products
        const searchResults = await zai.functions.invoke('web_search', {
          query: `shopee malaysia ${keyword}`,
        })

        // Use LLM to structure the search results into product listings
        const searchContext = typeof searchResults === 'string'
          ? searchResults
          : JSON.stringify(searchResults)

        const chatResponse = await zai.chat.completions.create({
          model: 'default',
          messages: [
            {
              role: 'system',
              content: 'You are a Shopee Malaysia product data assistant. Extract product information from web search results and return a JSON array of products. Each product should have: item_name, price (in RM), commission_rate (percentage), sales, rating_star (0-5), category, image_url (or null), shop_name. Return ONLY the JSON array, no other text.',
            },
            {
              role: 'user',
              content: `Search results for "shopee malaysia ${keyword}":\n\n${searchContext}\n\nExtract up to ${pageSize} products as a JSON array.`,
            },
          ],
        })

        const content = chatResponse.choices?.[0]?.message?.content || '[]'
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        const aiProducts = jsonMatch ? JSON.parse(jsonMatch[0]) : []

        // Store discovered products in DB for future retrieval
        for (const product of aiProducts.slice(0, pageSize)) {
          try {
            const shortCode = Math.random().toString(36).substring(2, 10)
            await db.affiliateLink.create({
              data: {
                name: product.item_name || `Shopee - ${keyword}`,
                productUrl: `https://shopee.com.my/search?keyword=${encodeURIComponent(keyword)}`,
                affiliateUrl: `https://shopee.com.my/search?keyword=${encodeURIComponent(keyword)}`,
                productName: product.item_name,
                productImage: product.image_url || null,
                productPrice: product.price ? product.price : null,
                commissionRate: product.commission_rate ? product.commission_rate : null,
                category: product.category || keyword,
                shortCode,
                status: 'active',
                userId: userId || null,
              },
            })
          } catch {
            // Non-fatal — skip if duplicate
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            items: aiProducts.map((p: Record<string, unknown>, i: number) => ({
              item_id: `ai-${Date.now()}-${i}`,
              item_name: p.item_name || `Shopee ${keyword} Product`,
              item_status: 'NORMAL' as const,
              category_id: p.category,
              image: p.image_url ? [{ image_url: p.image_url }] : [],
              price_info: p.price ? [{ original_price: Math.round(Number(p.price) * 100), current_price: Math.round(Number(p.price) * 100) }] : [],
              commission_info: p.commission_rate ? { commission_rate: Number(p.commission_rate), commission_min: 0, commission_max: 0 } : null,
              sales: p.sales || 0,
              rating_star: p.rating_star || 4.5,
              shop_info: { shop_name: p.shop_name || 'Shopee Mall' },
            })),
            pagination: {
              has_next: false,
              next_offset: offset + pageSize,
              total_count: aiProducts.length,
            },
          },
          meta: { offset, page_size: pageSize, sort: sort ?? 'RELEVANCE', keyword, source: 'ai_search' },
        })
      } catch (aiError) {
        console.error('[Shopee Products API] AI search failed:', aiError)
      }
    }

    // ── 5. Empty data when nothing found ──
    return NextResponse.json({
      success: true,
      data: {
        items: [],
        pagination: { has_next: false, next_offset: 0, total_count: 0 },
      },
      meta: { offset, page_size: pageSize, sort: sort ?? 'RELEVANCE', keyword, source: 'empty' },
    })
  } catch (error) {
    console.error('[Shopee Products API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}
