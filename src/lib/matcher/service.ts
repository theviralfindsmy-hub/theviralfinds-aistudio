/**
 * Cross-Platform Product Matcher — Service
 *
 * Aggregates products from the Shopee, TikTok and Lazada mock services
 * into unified `MatchResult` groups so affiliates can search once and
 * see the same product on all three platforms side-by-side.
 *
 * Matching algorithm (CHECKLIST 2.6.1 "Name similarity + category + price range"):
 *
 * 1. Tokenise each product name (lowercase, strip punctuation, remove
 *    Malaysian e-commerce stopwords like "ori", "original", "premium",
 *    "ready stock", "free shipping", "malaysia", "my", etc.).
 * 2. Compute Jaccard similarity between token sets of two listings.
 * 3. Boost similarity if the listings share the same detected brand
 *    (Xiaomi, Samsung, iPhone, Garnier, Cetaphil, LANEIGE, Maybelline,
 *    Philips, Anker, Dyson, Safi, Wardah, …) and/or category.
 * 4. Boost similarity if prices are within 30% of each other.
 * 5. Greedy cluster: walk through the union of all listings, assign
 *    each to the first existing cluster whose similarity ≥ threshold.
 * 6. Score each cluster's relevance to the query (0–100) using
 *    `scoreMatch()` — token overlap + startsWith bonus + category match.
 * 7. Sort clusters by relevance (desc) and return the top N.
 *
 * `autoPickBest(matchId)` picks the listing in the cluster with the
 * highest commissionAmount (RM) and generates a real affiliate link
 * via that platform's mock service.
 */

import {
  ShopeeMockService,
  type ShopeeProduct,
  type ShopeeAffiliateLink,
} from '@/lib/shopee/mock-data'
import {
  TikTokMockService,
  getTikTokMockService,
  type TikTokProduct,
  type TikTokAffiliateLink,
} from '@/lib/tiktok/mock-data'
import {
  LazadaMockService,
  type LazadaProduct,
  type LazadaAffiliateLink,
} from '@/lib/lazada/mock-data'
import {
  type AutoPickResult,
  type DataSource,
  type MatchedPlatformProduct,
  type MatchResult,
  type MatcherConfig,
  type Platform,
  DEFAULT_MATCHER_CONFIG,
} from './types'

// ─── Singleton mock-service instances ─────────────────────────

let _shopeeMock: ShopeeMockService | null = null
function getShopeeMock(): ShopeeMockService {
  if (!_shopeeMock) _shopeeMock = new ShopeeMockService()
  return _shopeeMock
}

let _lazadaMock: LazadaMockService | null = null
function getLazadaMock(): LazadaMockService {
  if (!_lazadaMock) _lazadaMock = new LazadaMockService()
  return _lazadaMock
}

function getTikTokMock(): TikTokMockService {
  return getTikTokMockService()
}

// ─── Normalisation helpers ────────────────────────────────────

const STOP_WORDS = new Set<string>([
  // English
  'the', 'and', 'for', 'with', 'of', 'a', 'an', 'to', 'in', 'on', 'at', 'by', 'is', 'are',
  'best', 'top', 'new', 'sale', 'ready', 'stock', 'premium', 'original', 'ori', 'oem',
  'free', 'shipping', 'fast', 'cod', 'malaysia', 'my', 'kl', 'official', 'store',
  'high', 'quality', 'super', 'pro', 'plus', 'max', 'set', 'pcs', 'pc', 'pack', 'pk',
  'size', 'full', 'mini', 'big', 'small', '1kg', '500g', '250g', '100g', '100ml',
  '50ml', '30ml', '200ml', '150ml', '400ml', '500ml', '250ml', 'unisex', 'unisize',
  'mens', 'womens', 'lelaki', 'wanita', 'kanak', 'kanak-kanak', 'bayi', 'murah',
  'promosi', 'diskaun', 'discount', 'promo', 'cheap', 'affordable', 'warranty',
  'garanti', 'ready-stock', 'readystock', 'rm', 'sen', 'kini', 'terkini', 'latest',
  // Brand-less modifiers
  'hd', 'wifi', 'bluetooth', 'usb', 'type-c', 'usbc', 'led', 'rgb', 'hdmi', 'pd',
  'qc', 'fast-charging', 'fastcharging', 'rechargeable', 'wireless',
])

const BRAND_PATTERNS: Array<{ brand: string; pattern: RegExp }> = [
  { brand: 'Xiaomi', pattern: /\bxiaomi\b|\bredmi\b|\bmi\b\s|\bpoco\b/i },
  { brand: 'Samsung', pattern: /\bsamsung\b|\bgalaxy\b/i },
  { brand: 'Apple', pattern: /\biphone\b|\bapple\b|\bairpods\b|\bipad\b|\bmacbook\b/i },
  { brand: 'Garnier', pattern: /\bgarnier\b/i },
  { brand: 'Cetaphil', pattern: /\bcetaphil\b/i },
  { brand: 'LANEIGE', pattern: /\blaneige\b/i },
  { brand: 'Some By Mi', pattern: /\bsome\s*by\s*mi\b/i },
  { brand: 'Anessa', pattern: /\banessa\b/i },
  { brand: 'Maybelline', pattern: /\bmaybelline\b/i },
  { brand: 'Nivea', pattern: /\bnivea\b/i },
  { brand: 'Bioaqua', pattern: /\bbioaqua\b/i },
  { brand: 'Safi', pattern: /\bsafi\b/i },
  { brand: 'Wardah', pattern: /\bwardah\b/i },
  { brand: 'Philips', pattern: /\bphilips\b/i },
  { brand: 'Anker', pattern: /\banker\b/i },
  { brand: 'Dyson', pattern: /\bdyson\b/i },
  { brand: 'Sony', pattern: /\bsony\b/i },
  { brand: 'Nike', pattern: /\bnike\b/i },
  { brand: 'Adidas', pattern: /\badidas\b/i },
  { brand: 'Puma', pattern: /\bpuma\b/i },
  { brand: 'MamyPoko', pattern: /\bmamy\s*poko\b/i },
  { brand: 'Maggi', pattern: /\bmaggi\b/i },
  { brand: 'Nestle', pattern: /\bnestle\b/i },
  { brand: 'Uniqlo', pattern: /\buniqlo\b/i },
  { brand: 'LEGO', pattern: /\blego\b/i },
]

/** Tokenise a product name into meaningful lowercase tokens (stopwords removed). */
export function tokeniseName(name: string): string[] {
  const cleaned = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ') // keep letters, numbers, spaces, dashes
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const tokens = cleaned.split(' ').filter((t) => t.length > 1 && !STOP_WORDS.has(t))
  return Array.from(new Set(tokens)) // dedupe
}

/** Detect brand from a product name (returns lowercase brand or null). */
export function detectBrand(name: string): string | null {
  for (const { brand, pattern } of BRAND_PATTERNS) {
    if (pattern.test(name)) return brand.toLowerCase()
  }
  return null
}

/** Jaccard similarity between two token sets (0–1). */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let intersection = 0
  for (const t of setA) if (setB.has(t)) intersection++
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** Normalise category labels across the 3 platforms to a shared vocabulary. */
export function normaliseCategory(raw: string): string {
  const c = raw.toLowerCase().trim()
  if (c.includes('beauty') || c.includes('health') || c === 'beauty' || c === 'health') return 'Beauty & Health'
  if (c.includes('fashion') || c.includes('cloth') || c.includes('apparel')) return 'Fashion'
  if (c.includes('electronic') || c.includes('gadget') || c.includes('tech')) return 'Electronics'
  if (c.includes('home') || c.includes('living') || c.includes('kitchen')) return 'Home & Living'
  if (c.includes('food') || c.includes('beverage') || c.includes('grocer') || c.includes('snack')) return 'Food & Beverages'
  if (c.includes('sport') || c.includes('outdoor') || c.includes('fitness')) return 'Sports & Outdoors'
  if (c.includes('toy') || c.includes('game') || c.includes('kid') || c.includes('baby')) return 'Toys & Kids'
  if (c.includes('auto') || c.includes('car')) return 'Automotive'
  return raw
}

// ─── Relevance scoring ────────────────────────────────────────

/**
 * Score how relevant a product is to the search query (0–100).
 *
 * Weights:
 *   - 55% token-overlap (Jaccard between query tokens and name tokens)
 *   - 20% startsWith bonus (query appears at the start of the name)
 *   - 15% substring bonus (query appears anywhere in the name)
 *   - 10% category match (query appears in the normalised category)
 */
export function scoreMatch(
  product: { title: string; category: string },
  query: string
): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0

  const queryTokens = tokeniseName(q)
  if (queryTokens.length === 0) {
    // Query had only stopwords — fall back to raw substring match.
    return product.title.toLowerCase().includes(q) ? 50 : 0
  }

  const nameTokens = tokeniseName(product.title)
  const overlap = jaccardSimilarity(queryTokens, nameTokens) // 0–1

  const nameLower = product.title.toLowerCase()
  const startsWith = nameLower.startsWith(q) ? 1 : 0
  const substring = nameLower.includes(q) ? 1 : 0

  const catNorm = normaliseCategory(product.category).toLowerCase()
  const categoryMatch = catNorm.includes(q) || queryTokens.some((t) => catNorm.includes(t)) ? 1 : 0

  const score =
    overlap * 55 +
    startsWith * 20 +
    substring * 15 +
    categoryMatch * 10

  return Math.round(Math.min(100, Math.max(0, score)))
}

// ─── Listing normalisation ────────────────────────────────────

function fromShopee(p: ShopeeProduct): MatchedPlatformProduct {
  const commissionAmount = (p.price * p.commissionRate) / 100
  return {
    platform: 'shopee',
    productId: String(p.itemId),
    title: p.name,
    image: p.image,
    price: p.price,
    originalPrice: p.originalPrice,
    commissionRate: p.commissionRate,
    commissionAmount: Math.round(commissionAmount * 100) / 100,
    sales: p.sales,
    rating: p.ratingStar,
    shopName: p.shopName,
    category: normaliseCategory(p.category),
    productLink: p.productLink,
    deepLink: p.deepLink,
  }
}

function fromTikTok(p: TikTokProduct): MatchedPlatformProduct {
  return {
    platform: 'tiktok',
    productId: p.productId,
    title: p.title,
    image: p.imageUrl,
    price: p.price,
    originalPrice: p.originalPrice,
    commissionRate: p.commissionRate,
    commissionAmount: p.commissionAmount,
    sales: p.sales,
    rating: p.rating,
    shopName: p.shopName,
    category: normaliseCategory(p.category),
    productLink: p.productLink,
    deepLink: p.deepLink,
    trendScore: p.trendScore,
  }
}

function fromLazada(p: LazadaProduct): MatchedPlatformProduct {
  return {
    platform: 'lazada',
    productId: String(p.itemId),
    title: p.title,
    image: p.imageUrl,
    price: p.price,
    originalPrice: p.originalPrice,
    commissionRate: p.commissionRate,
    commissionAmount: p.commissionAmount,
    sales: p.sales,
    rating: p.rating,
    shopName: p.shopName,
    category: normaliseCategory(p.category),
    productLink: p.productLink,
    deepLink: p.deepLink,
    isLazMall: p.isLazMall,
    isFreeShipping: p.isFreeShipping,
  }
}

// ─── Similarity between two listings (for clustering) ─────────

function listingSimilarity(a: MatchedPlatformProduct, b: MatchedPlatformProduct): number {
  const tokensA = tokeniseName(a.title)
  const tokensB = tokeniseName(b.title)
  const tokenSim = jaccardSimilarity(tokensA, tokensB)

  const brandA = detectBrand(a.title)
  const brandB = detectBrand(b.title)
  const brandBoost = brandA && brandB && brandA === brandB ? 0.15 : 0

  const catBoost = a.category === b.category ? 0.1 : 0

  // Price proximity: if both prices within 30% of each other, add 0.1
  const lower = Math.min(a.price, b.price)
  const upper = Math.max(a.price, b.price)
  const priceBoost = lower > 0 && upper / lower <= 1.3 ? 0.1 : 0

  return Math.min(1, tokenSim + brandBoost + catBoost + priceBoost)
}

// ─── In-memory match cache (for autoPickBest lookup) ──────────

interface CachedSearch {
  query: string
  results: MatchResult[]
  searchedAt: number
}

const MATCH_CACHE = new Map<string, CachedSearch>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function cacheKey(query: string, config: MatcherConfig): string {
  return `${query.toLowerCase().trim()}|${config.similarityThreshold}|${config.maxResults}|${config.allowSynthetic}`
}

function getCachedSearch(query: string, config: MatcherConfig): MatchResult[] | null {
  const key = cacheKey(query, config)
  const entry = MATCH_CACHE.get(key)
  if (!entry) return null
  if (Date.now() - entry.searchedAt > CACHE_TTL_MS) {
    MATCH_CACHE.delete(key)
    return null
  }
  return entry.results
}

function setCachedSearch(query: string, config: MatcherConfig, results: MatchResult[]): void {
  const key = cacheKey(query, config)
  MATCH_CACHE.set(key, { query, results, searchedAt: Date.now() })
  // Opportunistic cleanup
  if (MATCH_CACHE.size > 50) {
    const now = Date.now()
    for (const [k, v] of MATCH_CACHE) {
      if (now - v.searchedAt > CACHE_TTL_MS) MATCH_CACHE.delete(k)
    }
  }
}

// ─── Synthetic match generation (fallback for unknown queries) ──
//
// When a search query returns very few real matches across the 3
// platforms (e.g. "keropok lekor blandang"), we synthesise a single
// 3-platform cluster so the UI always has something to show. We pull
// a random product from each platform's public `searchProducts('')`
// API (which returns the full catalog) and relabel it with the query
// so the listings look like the same product family on each platform.

async function makeSyntheticListings(query: string): Promise<MatchedPlatformProduct[]> {
  const [shopeeRes, tiktokRes, lazadaRes] = await Promise.all([
    getShopeeMock().searchProducts('', { limit: 30, sortField: 'sales', sortOrder: 'desc' }),
    getTikTokMock().searchProducts('', { limit: 30, sortField: 'trend', sortOrder: 'desc' }),
    getLazadaMock().searchProducts('', { limit: 30, sortField: 'sales', sortOrder: 'desc' }),
  ])

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  if (shopeeRes.products.length === 0 || tiktokRes.products.length === 0 || lazadaRes.products.length === 0) {
    return []
  }

  const sP = pick(shopeeRes.products)
  const tP = pick(tiktokRes.products)
  const lP = pick(lazadaRes.products)

  // Vary the price slightly across platforms to make the comparison realistic.
  const sListing = fromShopee(sP)
  const tListing = fromTikTok(tP)
  const lListing = fromLazada(lP)

  // Randomise commission within plausible bands so the auto-pick isn't always
  // the same platform.
  const variants: Array<{
    listing: MatchedPlatformProduct
    rateBand: [number, number]
  }> = [
    { listing: sListing, rateBand: [3, 8] },
    { listing: tListing, rateBand: [5, 15] },
    { listing: lListing, rateBand: [4, 12] },
  ]

  const renamed = variants.map(({ listing, rateBand }) => {
    const rate = Math.round((rateBand[0] + Math.random() * (rateBand[1] - rateBand[0])) * 10) / 10
    const price = Math.round(listing.price * (0.9 + Math.random() * 0.2) * 100) / 100
    return {
      ...listing,
      title: `${query} — ${listing.shopName} Exclusive`,
      price,
      commissionRate: rate,
      commissionAmount: Math.round((price * rate) / 100 * 100) / 100,
    } satisfies MatchedPlatformProduct
  })

  return renamed
}

// ─── Greedy clustering of listings across platforms ───────────

function clusterListings(
  all: MatchedPlatformProduct[],
  threshold: number
): MatchedPlatformProduct[][] {
  // Sort by relevance-relevant fields: longer titles tend to be more specific.
  // Group greedily — each new listing joins the first cluster whose anchor
  // has similarity ≥ threshold.
  const clusters: MatchedPlatformProduct[][] = []

  for (const listing of all) {
    let placed = false
    for (const cluster of clusters) {
      // Don't allow two listings from the same platform in the same cluster
      // (we want each cluster to represent 1 product per platform).
      if (cluster.some((c) => c.platform === listing.platform)) continue
      const anchor = cluster[0]
      if (listingSimilarity(anchor, listing) >= threshold) {
        cluster.push(listing)
        placed = true
        break
      }
    }
    if (!placed) clusters.push([listing])
  }

  return clusters
}

function buildMatchResult(
  cluster: MatchedPlatformProduct[],
  query: string
): MatchResult {
  // Sort listings within the cluster so the highest-commission platform is first.
  const sorted = [...cluster].sort((a, b) => b.commissionAmount - a.commissionAmount)
  const best = sorted[0]

  // Pick a representative name: prefer the listing with the highest relevance to the query.
  const scored = sorted
    .map((l) => ({ l, s: scoreMatch({ title: l.title, category: l.category }, query) }))
    .sort((a, b) => b.s - a.s)
  const name = scored[0].l.title

  const prices = sorted.map((l) => l.price)
  const lowestPrice = Math.min(...prices)
  const highestPrice = Math.max(...prices)

  // Group relevance score = max listing score, slightly boosted for each extra platform.
  const maxListingScore = Math.max(...scored.map((s) => s.s))
  const platformBonus = (sorted.length - 1) * 5 // +5 per additional platform
  const relevanceScore = Math.min(100, maxListingScore + platformBonus)

  const category = best.category

  // Stable id — hash of the cluster's sorted product ids.
  const idParts = sorted.map((l) => `${l.platform}:${l.productId}`).sort()
  const id = `m_${hashStr(idParts.join('|'))}`

  return {
    id,
    name,
    category,
    image: best.image,
    relevanceScore,
    listings: sorted,
    bestPlatform: best.platform,
    bestCommissionAmount: best.commissionAmount,
    lowestPrice,
    highestPrice,
  }
}

/** Tiny non-crypto string hash (FNV-1a) for stable ids. */
function hashStr(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

// ─── Public API ───────────────────────────────────────────────

export interface SearchAcrossPlatformsOptions {
  limit?: number
  config?: Partial<MatcherConfig>
}

export interface SearchAcrossPlatformsResult {
  query: string
  results: MatchResult[]
  platformsSearched: Platform[]
  bestCommissionAmount: number | null
  source: DataSource
}

/**
 * Search all 3 platforms for the given query and return clustered
 * match groups sorted by relevance to the query.
 */
export async function searchAcrossPlatforms(
  query: string,
  opts: SearchAcrossPlatformsOptions = {}
): Promise<SearchAcrossPlatformsResult> {
  const config: MatcherConfig = { ...DEFAULT_MATCHER_CONFIG, ...opts.config }
  const limit = opts.limit ?? config.maxResults

  const q = query.trim()
  const platforms: Platform[] = ['shopee', 'tiktok', 'lazada']

  // Cache check
  const cached = getCachedSearch(q, config)
  if (cached) {
    return {
      query: q,
      results: cached.slice(0, limit),
      platformsSearched: platforms,
      bestCommissionAmount: cached.reduce((m, r) => Math.max(m, r.bestCommissionAmount), 0) || null,
      source: 'mock',
    }
  }

  const pageSize = config.platformPageSize

  // Run all 3 platform searches in parallel. Each platform's mock service
  // already falls back to "synthetic" matches when nothing is found, but
  // we want to ALSO surface truly cross-platform matches for unknown
  // queries — so we still do our own synthetic blending below if needed.
  const [shopeeRes, tiktokRes, lazadaRes] = await Promise.all([
    getShopeeMock().searchProducts(q, { limit: pageSize, sortField: 'sales', sortOrder: 'desc' }),
    getTikTokMock().searchProducts(q, { limit: pageSize, sortField: 'trend', sortOrder: 'desc' }),
    getLazadaMock().searchProducts(q, { limit: pageSize, sortField: 'sales', sortOrder: 'desc' }),
  ])

  let allListings: MatchedPlatformProduct[] = [
    ...shopeeRes.products.map(fromShopee),
    ...tiktokRes.products.map(fromTikTok),
    ...lazadaRes.products.map(fromLazada),
  ]

  // If the mock services returned very few cross-platform matches for this
  // query (e.g. a totally unknown keyword like "keropok lekor blandang"),
  // synthesise a 3-platform match so the UI always has something to show.
  const realMatchCount = allListings.length
  if (config.allowSynthetic && realMatchCount < 3) {
    const synthetic = await makeSyntheticListings(q)
    allListings = [...allListings, ...synthetic]
  }

  // Filter listings to those with at least *some* relevance to the query
  // (score ≥ 8). This weeds out obvious mismatches before clustering.
  const relevant = allListings.filter((l) => {
    const s = scoreMatch({ title: l.title, category: l.category }, q)
    return s >= 8
  })

  const pool = relevant.length > 0 ? relevant : allListings

  // Cluster across platforms.
  const clusters = clusterListings(pool, config.similarityThreshold)

  // Build MatchResult objects.
  let results = clusters
    .map((c) => buildMatchResult(c, q))
    .sort((a, b) => b.relevanceScore - a.relevanceScore || b.bestCommissionAmount - a.bestCommissionAmount)

  // Cap results.
  results = results.slice(0, limit)

  // Cache for auto-pick lookup.
  setCachedSearch(q, config, results)

  const bestCommissionAmount = results.reduce(
    (m, r) => Math.max(m, r.bestCommissionAmount),
    0
  ) || null

  return {
    query: q,
    results,
    platformsSearched: platforms,
    bestCommissionAmount,
    source: 'mock',
  }
}

/**
 * Find a previously-returned `MatchResult` by id (looks through the
 * in-memory cache). Falls back to a fresh search of recent queries.
 */
export function findMatchById(id: string): MatchResult | null {
  for (const entry of MATCH_CACHE.values()) {
    const found = entry.results.find((r) => r.id === id)
    if (found) return found
  }
  return null
}

/**
 * Pick the best-paying platform for the given match id and generate
 * an affiliate link. Used by the "Auto-Pick Best" one-click action.
 */
export async function autoPickBest(
  productId: string,
  productName?: string
): Promise<AutoPickResult> {
  // Try cache lookup first.
  let match = findMatchById(productId)

  // If not in cache, attempt a fresh search using the product name (if provided)
  // so the auto-pick button still works after a cache expiry / page refresh.
  if (!match && productName) {
    const fresh = await searchAcrossPlatforms(productName, { limit: 5 })
    match = fresh.results.find((r) => r.id === productId) ?? fresh.results[0] ?? null
  }

  if (!match) {
    throw new Error(`Match not found for id ${productId}. Try searching again.`)
  }

  // Best listing = highest commissionAmount (RM). The cluster is already
  // sorted by commissionAmount desc in buildMatchResult, so listings[0] is best.
  const best = match.listings[0]
  const reason = buildReason(match, best)

  // Generate the affiliate link using the right mock service.
  const affiliateLink = await generateLinkForListing(best)

  return {
    matchId: match.id,
    productName: match.name,
    platform: best.platform,
    listing: best,
    commissionAmount: best.commissionAmount,
    commissionRate: best.commissionRate,
    affiliateLink,
    reason,
    source: 'mock',
  }
}

function buildReason(match: MatchResult, best: MatchedPlatformProduct): string {
  const platformLabel =
    best.platform === 'shopee' ? 'Shopee' : best.platform === 'tiktok' ? 'TikTok Shop' : 'Lazada'

  const otherPlatforms = match.listings
    .filter((l) => l.platform !== best.platform)
    .map((l) => (l.platform === 'shopee' ? 'Shopee' : l.platform === 'tiktok' ? 'TikTok' : 'Lazada'))

  const otherPart =
    otherPlatforms.length > 0
      ? ` Lagi ${otherPlatforms.length} platform: ${otherPlatforms.join(', ')} — tapi komisen lebih rendah.`
      : ''

  return `${platformLabel} bagi komisen tertinggi (RM ${best.commissionAmount.toFixed(2)} = ${best.commissionRate}% × RM ${best.price.toFixed(2)}).${otherPart} Auto-pick confirm untung!`
}

async function generateLinkForListing(listing: MatchedPlatformProduct): Promise<AutoPickResult['affiliateLink']> {
  if (listing.platform === 'shopee') {
    const link: ShopeeAffiliateLink = await getShopeeMock().generateAffiliateLink({
      itemId: Number(listing.productId),
    })
    return {
      shortUrl: link.shortUrl,
      longUrl: link.longUrl,
      deepLink: link.deepLink,
    }
  }
  if (listing.platform === 'tiktok') {
    const link: TikTokAffiliateLink = await getTikTokMock().generateAffiliateLink({
      productId: listing.productId,
    })
    return {
      shortUrl: link.shortUrl,
      longUrl: link.longUrl,
      deepLink: link.deepLink,
      trackingId: link.trackingId,
      expiresAt: link.expiresAt,
    }
  }
  // lazada
  const link: LazadaAffiliateLink = await getLazadaMock().generateAffiliateLink({
    itemId: Number(listing.productId),
  })
  return {
    shortUrl: link.shortUrl,
    longUrl: link.longUrl,
    deepLink: link.deepLink,
    trackingUrl: link.trackingUrl,
  }
}

// ─── Demo / inspection helpers ────────────────────────────────

/** Return cached queries (for debugging + recent searches chip population). */
export function listCachedQueries(): string[] {
  return Array.from(MATCH_CACHE.values()).map((e) => e.query)
}

/** Clear the matcher cache (useful for tests / demo resets). */
export function clearMatcherCache(): void {
  MATCH_CACHE.clear()
}
