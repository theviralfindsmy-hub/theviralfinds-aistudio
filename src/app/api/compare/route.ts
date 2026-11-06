import { NextRequest, NextResponse } from 'next/server'
import { ShopeeMockService, type ShopeeProduct } from '@/lib/shopee/mock-data'
import { getTikTokMockService, type TikTokProduct } from '@/lib/tiktok/mock-data'
import { LazadaMockService, type LazadaProduct } from '@/lib/lazada/mock-data'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import {
  findMatches,
  buildComparisonRow,
  unifyCategory,
} from '@/lib/compare/matcher'
import type {
  Platform,
  UnifiedCategory,
  ComparisonRow,
  ComparisonResult,
  CompareSortOption,
  NormalizableProduct,
} from '@/lib/compare/types'

// ─── Singleton mock services (stable across requests) ─────────
const shopee = new ShopeeMockService()
const tiktok = getTikTokMockService()
let _lazadaInstance: LazadaMockService | null = null
function getLazadaMock(): LazadaMockService {
  if (!_lazadaInstance) _lazadaInstance = new LazadaMockService()
  return _lazadaInstance
}
const lazada = getLazadaMock()

// ─── Helpers ──────────────────────────────────────────────────

const UNIFIED_CATEGORIES: UnifiedCategory[] = [
  'Beauty',
  'Fashion',
  'Electronics',
  'Home',
  'Food',
  'Baby',
]

interface Queryable {
  name?: string
  title?: string
  category?: string
}

/** Filter products by search query (case-insensitive name/category match). */
function filterByQuery<T extends Queryable>(products: T[], query: string): T[] {
  if (!query.trim()) return products
  const q = query.toLowerCase().trim()
  const tokens = q.split(/\s+/).filter(Boolean)
  return products.filter((p) => {
    const name = (p.name || p.title || '').toLowerCase()
    const cat = (p.category || '').toLowerCase()
    return (
      name.includes(q) ||
      cat.includes(q) ||
      tokens.some((t) => name.includes(t) || cat.includes(t))
    )
  })
}

/** Convert a Shopee product into the normalisable shape. */
function fromShopee(p: ShopeeProduct): NormalizableProduct {
  return {
    platform: 'shopee',
    productId: p.itemId,
    productName: p.name,
    image: p.image,
    price: p.price,
    originalPrice: p.originalPrice,
    commissionRate: p.commissionRate,
    commissionAmount: (p.price * p.commissionRate) / 100,
    shopName: p.shopName,
    sales: p.sales,
    ratingStar: p.ratingStar,
    productLink: p.productLink,
    deepLink: p.deepLink,
    category: p.category,
  }
}

/** Convert a TikTok product into the normalisable shape. */
function fromTikTok(p: TikTokProduct): NormalizableProduct {
  return {
    platform: 'tiktok',
    productId: p.productId,
    productName: p.title,
    imageUrl: p.imageUrl,
    price: p.price,
    originalPrice: p.originalPrice,
    commissionRate: p.commissionRate,
    commissionAmount: p.commissionAmount,
    shopName: p.shopName,
    sales: p.sales,
    rating: p.rating,
    productLink: p.productLink,
    deepLink: p.deepLink,
    category: p.category,
  }
}

/** Convert a Lazada product into the normalisable shape. */
function fromLazada(p: LazadaProduct): NormalizableProduct {
  return {
    platform: 'lazada',
    productId: p.itemId,
    productName: p.title,
    imageUrl: p.imageUrl,
    price: p.price,
    originalPrice: p.originalPrice,
    commissionRate: p.commissionRate,
    commissionAmount: p.commissionAmount,
    shopName: p.shopName,
    sales: p.sales,
    rating: p.rating,
    productLink: p.productLink,
    deepLink: p.deepLink,
    category: p.category,
  }
}

/** Pull the entire catalog from all three platforms in parallel. */
async function loadAllProducts(): Promise<{
  shopee: ShopeeProduct[]
  tiktok: TikTokProduct[]
  lazada: LazadaProduct[]
}> {
  const [shopeeResult, tiktokResult, lazadaResult] = await Promise.all([
    shopee.searchProducts('', { limit: 100 }),
    tiktok.searchProducts('', { limit: 100 }),
    lazada.searchProducts('', { limit: 100 }),
  ])

  return {
    shopee: shopeeResult.products,
    tiktok: tiktokResult.products,
    lazada: lazadaResult.products,
  }
}

/** Sort the final comparison rows by the chosen option. */
function sortRows(rows: ComparisonRow[], sort: CompareSortOption): ComparisonRow[] {
  const sorted = [...rows]
  switch (sort) {
    case 'lowest-price':
      sorted.sort((a, b) => a.lowestPrice - b.lowestPrice)
      break
    case 'highest-rate':
      sorted.sort((a, b) => {
        const aRate =
          a.matchedOnPlatforms.find((m) => m.platform === a.bestPlatform)?.commissionRate ?? 0
        const bRate =
          b.matchedOnPlatforms.find((m) => m.platform === b.bestPlatform)?.commissionRate ?? 0
        return bRate - aRate
      })
      break
    case 'best-commission':
    default:
      sorted.sort((a, b) => b.bestCommissionAmount - a.bestCommissionAmount)
      break
  }
  return sorted
}

/** Build aggregate summary stats. */
function buildSummary(rows: ComparisonRow[]) {
  const platforms: Platform[] = ['shopee', 'tiktok', 'lazada']
  const sumBy: Record<Platform, { rate: number; amount: number; count: number }> = {
    shopee: { rate: 0, amount: 0, count: 0 },
    tiktok: { rate: 0, amount: 0, count: 0 },
    lazada: { rate: 0, amount: 0, count: 0 },
  }
  let shopeeWins = 0
  let tiktokWins = 0
  let lazadaWins = 0
  let totalBest = 0

  for (const row of rows) {
    totalBest += row.bestCommissionAmount
    if (row.bestPlatform === 'shopee') shopeeWins++
    else if (row.bestPlatform === 'tiktok') tiktokWins++
    else if (row.bestPlatform === 'lazada') lazadaWins++

    for (const p of row.matchedOnPlatforms) {
      sumBy[p.platform].rate += p.commissionRate
      sumBy[p.platform].amount += p.commissionAmount
      sumBy[p.platform].count += 1
    }
  }

  const avgRateByPlatform = {} as Record<Platform, number>
  const avgAmountByPlatform = {} as Record<Platform, number>
  for (const pf of platforms) {
    avgRateByPlatform[pf] = sumBy[pf].count > 0 ? sumBy[pf].rate / sumBy[pf].count : 0
    avgAmountByPlatform[pf] = sumBy[pf].count > 0 ? sumBy[pf].amount / sumBy[pf].count : 0
  }

  return {
    avgBestCommission: rows.length > 0 ? totalBest / rows.length : 0,
    shopeeWins,
    tiktokWins,
    lazadaWins,
    avgRateByPlatform,
    avgAmountByPlatform,
  }
}

/**
 * Apply both query and category filters to each platform's catalog, then
 * convert to NormalizableProduct[].
 */
function prepareProducts(
  catalogs: {
    shopee: ShopeeProduct[]
    tiktok: TikTokProduct[]
    lazada: LazadaProduct[]
  },
  query: string,
  categoryParam: UnifiedCategory | 'All'
): NormalizableProduct[] {
  const targetCat = categoryParam === 'All' ? null : categoryParam

  const sFiltered = targetCat
    ? catalogs.shopee.filter((p) => unifyCategory(p.category) === targetCat)
    : catalogs.shopee
  const tFiltered = targetCat
    ? catalogs.tiktok.filter((p) => unifyCategory(p.category) === targetCat)
    : catalogs.tiktok
  const lFiltered = targetCat
    ? catalogs.lazada.filter((p) => unifyCategory(p.category) === targetCat)
    : catalogs.lazada

  const sf = filterByQuery(
    sFiltered as unknown as Array<{ name: string; category: string }>,
    query
  ) as unknown as ShopeeProduct[]
  const tf = filterByQuery(
    tFiltered as unknown as Array<{ title: string; category: string }>,
    query
  ) as unknown as TikTokProduct[]
  const lf = filterByQuery(
    lFiltered as unknown as Array<{ title: string; category: string }>,
    query
  ) as unknown as LazadaProduct[]

  return [...sf.map(fromShopee), ...tf.map(fromTikTok), ...lf.map(fromLazada)]
}

// ─── Route Handler ────────────────────────────────────────────

/**
 * GET /api/compare
 *
 * Query params:
 *   - q:        search query (case-insensitive match on product name/category)
 *   - category: optional unified category (Beauty | Fashion | Electronics |
 *               Home | Food | Baby). If omitted or "All", no filter applied.
 *   - sort:     best-commission (default) | lowest-price | highest-rate
 *
 * Response: ComparisonResult — rows of matched products with side-by-side
 * commission info, plus a summary object for charting.
 */
export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.read)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim()
    const categoryParam = (searchParams.get('category') || 'All').trim() as
      | UnifiedCategory
      | 'All'
    const sort = (searchParams.get('sort') || 'best-commission') as CompareSortOption

    if (
      categoryParam !== 'All' &&
      !UNIFIED_CATEGORIES.includes(categoryParam as UnifiedCategory)
    ) {
      throw ApiError.badRequest(
        `Invalid category. Allowed: All, ${UNIFIED_CATEGORIES.join(', ')}`
      )
    }

    const validSorts: CompareSortOption[] = [
      'best-commission',
      'lowest-price',
      'highest-rate',
    ]
    if (!validSorts.includes(sort)) {
      throw ApiError.badRequest(`Invalid sort. Allowed: ${validSorts.join(', ')}`)
    }

    // 1. Pull full catalogs from all three platforms
    const catalogs = await loadAllProducts()

    // 2. Apply query + category filters, then convert to normalised shape
    const all = prepareProducts(catalogs, query, categoryParam)

    // 3. Cluster matches across platforms
    const clusters = findMatches(all)

    // 4. Build ComparisonRow[]
    let rows: ComparisonRow[] = []
    for (const cluster of clusters) {
      const row = buildComparisonRow(cluster)
      if (row) rows.push(row)
    }

    // 5. Sort + cap to 50 rows
    rows = sortRows(rows, sort).slice(0, 50)

    // 6. Build summary
    const summary = buildSummary(rows)

    const result: ComparisonResult = {
      query,
      category: categoryParam,
      rows,
      total: rows.length,
      source: 'mock',
      summary,
    }

    return NextResponse.json(result)
  } catch (error) {
    return handleError(error)
  }
}
