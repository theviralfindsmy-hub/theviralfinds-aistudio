import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLazadaServiceFromDB } from '@/lib/lazada/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/**
 * GET /api/lazada/products
 * Search Lazada products.
 * Priority: real Lazada API → DB AffiliateLinks → LLM/web search → empty data.
 *
 * Query params: q, category, minPrice, maxPrice, sort, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const limited = enforceRateLimit(request, RATE_LIMITS.read)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || undefined
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined
    const sort = searchParams.get('sort') as
      | 'commission'
      | 'price'
      | 'sales'
      | 'rating'
      | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (isNaN(page) || page < 1) {
      throw ApiError.badRequest('Invalid "page" parameter')
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw ApiError.badRequest('Invalid "limit" parameter (must be 1-100)')
    }

    // ── 1. Try real Lazada API first ──
    const service = await getLazadaServiceFromDB()
    if (!service.isUsingMock) {
      try {
        const categoryId =
          category && /^\d+$/.test(category) ? parseInt(category) : undefined

        const result = await service.searchProducts(query, {
          page,
          limit,
          sortField: sort || 'sales',
          sortOrder: 'desc',
          categoryId,
          minPrice,
          maxPrice,
        })

        if (result.products.length > 0) {
          return NextResponse.json({
            products: result.products,
            total: result.total,
            source: 'api',
            connected: true,
          })
        }
      } catch (apiError) {
        console.error('[Lazada Products] API failed, falling back to DB:', apiError)
      }
    }

    // ── 2. Query AffiliateLink table for Lazada-related products ──
    const where: Record<string, unknown> = {}
    if (query) {
      where.OR = [
        { productName: { contains: query } },
        { name: { contains: query } },
        { category: { contains: query } },
        { tags: { contains: query } },
      ]
    }
    if (category) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { category: { contains: category } },
      ]
    }
    if (userId) {
      where.userId = userId
    }
    if (minPrice || maxPrice) {
      where.productPrice = {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      }
    }

    const [dbProducts, totalCount] = await Promise.all([
      db.affiliateLink.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sort === 'sales'
          ? { clicks: 'desc' }
          : sort === 'commission'
          ? { commissionRate: 'desc' }
          : sort === 'price'
          ? { productPrice: 'asc' }
          : { createdAt: 'desc' },
      }),
      db.affiliateLink.count({ where }),
    ])

    if (dbProducts.length > 0) {
      return NextResponse.json({
        products: dbProducts.map((link) => ({
          product_id: link.productId || link.id,
          product_name: link.productName || link.name,
          image_url: link.productImage || '',
          price: Number(link.productPrice || 0),
          commission_rate: Number(link.commissionRate || 0),
          commission: Number(link.commission || 0),
          sales: link.clicks,
          conversions: link.conversions,
          rating: 4.5,
          category: link.category || 'General',
          short_url: link.shortCode,
          affiliate_url: link.affiliateUrl,
          source: 'db',
        })),
        total: totalCount,
        source: 'db',
        connected: !service.isUsingMock,
      })
    }

    // ── 3. Use LLM + web search for product discovery ──
    if (query) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default
        const zai = await ZAI.create()

        const searchResults = await zai.functions.invoke('web_search', {
          query: `lazada malaysia ${query}`,
        })

        const searchContext = typeof searchResults === 'string'
          ? searchResults
          : JSON.stringify(searchResults)

        const chatResponse = await zai.chat.completions.create({
          model: 'default',
          messages: [
            {
              role: 'system',
              content: 'You are a Lazada Malaysia product data assistant. Extract product information from web search results and return a JSON array of products. Each product should have: product_name, price (in RM), commission_rate (percentage), sales, rating (0-5), category, image_url (or null), shop_name. Return ONLY the JSON array, no other text.',
            },
            {
              role: 'user',
              content: `Search results for "lazada malaysia ${query}":\n\n${searchContext}\n\nExtract up to ${limit} products as a JSON array.`,
            },
          ],
        })

        const content = chatResponse.choices?.[0]?.message?.content || '[]'
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        const aiProducts = jsonMatch ? JSON.parse(jsonMatch[0]) : []

        // Store discovered products in DB
        for (const product of aiProducts.slice(0, limit)) {
          try {
            const shortCode = Math.random().toString(36).substring(2, 10)
            await db.affiliateLink.create({
              data: {
                name: product.product_name || `Lazada - ${query}`,
                productUrl: `https://www.lazada.com.my/catalog/?q=${encodeURIComponent(query)}`,
                affiliateUrl: `https://www.lazada.com.my/catalog/?q=${encodeURIComponent(query)}`,
                productName: product.product_name,
                productImage: product.image_url || null,
                productPrice: product.price || null,
                commissionRate: product.commission_rate || null,
                category: product.category || query,
                shortCode,
                status: 'active',
                userId: userId || null,
              },
            })
          } catch {
            // Non-fatal
          }
        }

        return NextResponse.json({
          products: aiProducts.map((p: Record<string, unknown>, i: number) => ({
            product_id: `ai-lz-${Date.now()}-${i}`,
            product_name: p.product_name || `Lazada ${query} Product`,
            image_url: p.image_url || '',
            price: Number(p.price || 0),
            commission_rate: Number(p.commission_rate || 0),
            sales: Number(p.sales || 0),
            rating: Number(p.rating || 4.5),
            category: p.category || 'General',
            shop_name: p.shop_name || 'Lazada Mall',
            source: 'ai_search',
          })),
          total: aiProducts.length,
          source: 'ai_search',
          connected: !service.isUsingMock,
        })
      } catch (aiError) {
        console.error('[Lazada Products] AI search failed:', aiError)
      }
    }

    // ── 4. Empty data ──
    return NextResponse.json({
      products: [],
      total: 0,
      source: 'empty',
      connected: !service.isUsingMock,
    })
  } catch (error) {
    return handleError(error)
  }
}
