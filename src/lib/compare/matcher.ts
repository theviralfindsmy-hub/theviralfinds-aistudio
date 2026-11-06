/**
 * Multi-Platform Product Matching Algorithm
 *
 * The goal: given a list of products from Shopee / TikTok / Lazada, find
 * which ones are "the same product" so we can compare commissions side-by-side.
 *
 * Strategy:
 *  1. Normalize product names (lowercase, strip brand/marketing noise, drop
 *     common Malaysian tokens like "Original", "Premium", "Ready Stock").
 *  2. Extract the top-N "signature tokens" (longest non-stopword tokens).
 *  3. Two products match if they share >= 50% of their signature tokens AND
 *     their categories bucket into the same UnifiedCategory AND their prices
 *     are within ±20% of each other.
 *  4. Group all matching products into ComparisonRow groups, then compute
 *     the best commission among them.
 */

import type {
  Platform,
  PlatformCommission,
  UnifiedCategory,
  ComparisonRow,
  NormalizableProduct,
} from './types'

// ─── Category Normalization ────────────────────────────────────

/**
 * Map a raw platform category string into our 6 unified buckets.
 * Returns null if no good match is found.
 */
export function unifyCategory(raw: string): UnifiedCategory | null {
  const s = raw.toLowerCase()
  if (
    s.includes('beauty') ||
    s.includes('health') ||
    s.includes('cosmetic') ||
    s.includes('skincare')
  ) {
    return 'Beauty'
  }
  if (s.includes('fashion') || s.includes('cloth') || s.includes('apparel') || s.includes('muslimah')) {
    return 'Fashion'
  }
  if (s.includes('electronic') || s.includes('gadget') || s.includes('phone') || s.includes('tech')) {
    return 'Electronics'
  }
  if (s.includes('home') || s.includes('living') || s.includes('kitchen') || s.includes('decor')) {
    return 'Home'
  }
  if (
    s.includes('food') ||
    s.includes('beverage') ||
    s.includes('grocer') ||
    s.includes('snack') ||
    s.includes('kopi') ||
    s.includes('makanan')
  ) {
    return 'Food'
  }
  if (s.includes('baby') || s.includes('kid') || s.includes('toy') || s.includes('game')) {
    return 'Baby'
  }
  return null
}

// ─── Name Normalization ────────────────────────────────────────

/**
 * Noise tokens commonly seen in Malaysian e-commerce product titles that
 * don't help identify the actual product. Stripping them improves matching.
 */
const NOISE_TOKENS = new Set<string>([
  'original',
  'premium',
  'ready',
  'stock',
  'best',
  'seller',
  'authentic',
  'malaysia',
  'malaysian',
  'my',
  'kl',
  'official',
  'store',
  'shop',
  'free',
  'shipping',
  'warranty',
  'new',
  'hot',
  'sale',
  'promo',
  'promotion',
  'set',
  'sets',
  'ready',
  'stock',
  'super',
  'deals',
  'deal',
  'quality',
  'high',
  'low',
  'price',
  'cheapest',
  'murah',
  'asli',
  'paling',
  'terbaik',
  'cantik',
  'penghantaran',
  'percuma',
  'diskaun',
  '2023',
  '2024',
  '2025',
])

/** Lowercase + strip diacritics + remove punctuation, return token array. */
export function normalizeProductName(name: string): string[] {
  const cleaned = name
    .toLowerCase()
    // strip punctuation and digits-as-standalone-tokens
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const tokens = cleaned.split(' ').filter((t) => t.length >= 2 && !NOISE_TOKENS.has(t))

  // De-duplicate while preserving order
  const seen = new Set<string>()
  const unique: string[] = []
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t)
      unique.push(t)
    }
  }
  return unique
}

/**
 * Pick the "signature tokens" — top-N longest tokens (longer tokens tend to
 * be more product-specific, e.g. "redmi", "airpods", "telekung").
 */
export function signatureTokens(name: string, n = 5): string[] {
  const tokens = normalizeProductName(name)
  return [...tokens].sort((a, b) => b.length - a.length).slice(0, n).sort()
}

/** Jaccard-style similarity between two token sets, range [0, 1]. */
export function tokenSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0
  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  let intersection = 0
  for (const t of setA) if (setB.has(t)) intersection++
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** Are two prices within ±20% of each other? */
export function pricesMatch(priceA: number, priceB: number, tolerance = 0.2): boolean {
  if (priceA <= 0 || priceB <= 0) return false
  const ratio = Math.min(priceA, priceB) / Math.max(priceA, priceB)
  return ratio >= 1 - tolerance
}

// ─── Product Normalization (platform-agnostic) ─────────────────

/** Convert a raw platform product into our normalised PlatformCommission. */
export function normalizeProduct(p: NormalizableProduct): PlatformCommission {
  const price = Number(p.price) || 0
  const rate = Number(p.commissionRate) || 0
  const commissionAmount =
    p.commissionAmount != null
      ? Number(p.commissionAmount)
      : Number(((price * rate) / 100).toFixed(2))

  // Resolve unified category from the raw platform category, if provided
  const category = p.category ? unifyCategory(p.category) : null

  return {
    platform: p.platform,
    productId: String(p.productId),
    productName: p.productName,
    image: p.image || p.imageUrl || '',
    price: Number(price.toFixed(2)),
    originalPrice: p.originalPrice ? Number(p.originalPrice.toFixed(2)) : undefined,
    commissionRate: Number(rate.toFixed(2)),
    commissionAmount: Number(commissionAmount.toFixed(2)),
    shopName: p.shopName || 'Unknown Shop',
    sales: Number(p.sales) || 0,
    rating: Number(p.rating ?? p.ratingStar ?? 0),
    affiliateUrl: p.deepLink || p.productLink || '#',
    category,
  }
}

// ─── Matching Algorithm ────────────────────────────────────────

interface NormalizedEntry {
  product: PlatformCommission
  signature: string[]
  price: number
}

/**
 * Group a flat list of normalised products (from all platforms) into
 * matched clusters. Two products are in the same cluster iff:
 *   - their token similarity >= 0.5  (i.e. ≥50% overlap of signature tokens)
 *   - their prices are within ±20% of each other
 *   - they come from different platforms (no same-platform clustering)
 *
 * Uses a union-find / single-pass clustering approach. Category is NOT
 * used for matching here because raw categories differ across platforms
 * (e.g. Shopee's "Beauty & Health" vs TikTok's "Beauty"); the caller
 * pre-filters by unified category before passing products in.
 */
export function findMatches(
  products: NormalizableProduct[]
): PlatformCommission[][] {
  if (products.length === 0) return []

  // Normalize everything up-front
  const entries: NormalizedEntry[] = products.map((p) => {
    const norm = normalizeProduct(p)
    const sig = signatureTokens(p.productName)
    return {
      product: norm,
      signature: sig,
      price: norm.price,
    }
  })

  // Union-Find structure
  const parent: number[] = entries.map((_, i) => i)
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }
  const union = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }

  // Pairwise compare: merge products that share ≥50% signature tokens,
  // have prices within ±20%, and come from different platforms.
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]
      const b = entries[j]
      if (a.product.platform === b.product.platform) continue

      const sim = tokenSimilarity(a.signature, b.signature)
      if (sim < 0.5) continue
      if (!pricesMatch(a.price, b.price)) continue
      union(i, j)
    }
  }

  // Group indices by root
  const groups = new Map<number, number[]>()
  for (let i = 0; i < entries.length; i++) {
    const root = find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(i)
  }

  // Convert to PlatformCommission[][] — one sub-array per matched product
  return Array.from(groups.values()).map((indices) =>
    indices.map((i) => entries[i].product)
  )
}

// ─── Best Commission Calculation ───────────────────────────────

/**
 * Given a cluster of matched products (1–3 platforms), pick the winner.
 * Returns the platform with the highest commissionAmount.
 * Ties broken by: higher commissionRate, then lower price.
 */
export function calculateBestCommission(
  matches: PlatformCommission[]
): { platform: Platform; amount: number } {
  if (matches.length === 0) {
    return { platform: 'shopee', amount: 0 }
  }
  const sorted = [...matches].sort((a, b) => {
    if (b.commissionAmount !== a.commissionAmount) {
      return b.commissionAmount - a.commissionAmount
    }
    if (b.commissionRate !== a.commissionRate) {
      return b.commissionRate - a.commissionRate
    }
    return a.price - b.price
  })
  return {
    platform: sorted[0].platform,
    amount: sorted[0].commissionAmount,
  }
}

// ─── Full Cluster → ComparisonRow ──────────────────────────────

/** Stable hash for IDs — short and deterministic. */
function shortHash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

/**
 * Convert a matched cluster into a ComparisonRow ready for the UI.
 */
export function buildComparisonRow(
  cluster: PlatformCommission[]
): ComparisonRow | null {
  if (cluster.length === 0) return null

  // Pick a canonical name (prefer Shopee > TikTok > Lazada for naming)
  const platformOrder: Platform[] = ['shopee', 'tiktok', 'lazada']
  const sortedByPref = [...cluster].sort(
    (a, b) => platformOrder.indexOf(a.platform) - platformOrder.indexOf(b.platform)
  )
  const canonical = sortedByPref[0]

  // Determine unified category:
  //   1. If the canonical product has a unified category attached, use it.
  //   2. Otherwise fall back to name inference.
  const rowCategory: UnifiedCategory =
    canonical.category ?? inferCategoryFromName(canonical.productName)

  const best = calculateBestCommission(cluster)
  const lowestPrice = Math.min(...cluster.map((c) => c.price))

  return {
    id: `cmp-${shortHash(canonical.productName.toLowerCase() + rowCategory)}`,
    productName: canonical.productName,
    category: rowCategory,
    thumbnail: canonical.image,
    matchedOnPlatforms: cluster,
    bestPlatform: best.platform,
    bestCommissionAmount: best.amount,
    matchCount: cluster.length,
    lowestPrice,
  }
}

/** Infer a unified category from a product name when no category is provided. */
export function inferCategoryFromName(name: string): UnifiedCategory {
  const lower = name.toLowerCase()
  if (
    lower.includes('serum') ||
    lower.includes('sunscreen') ||
    lower.includes('lip') ||
    lower.includes('skincare') ||
    lower.includes('beauty') ||
    lower.includes('mask') ||
    lower.includes('cream') ||
    lower.includes('perfume') ||
    lower.includes('cleanser') ||
    lower.includes('lotion')
  ) {
    return 'Beauty'
  }
  if (
    lower.includes('baju') ||
    lower.includes('kurung') ||
    lower.includes('tudung') ||
    lower.includes('telekung') ||
    lower.includes('kasut') ||
    lower.includes('hoodie') ||
    lower.includes('jeans') ||
    lower.includes('jubah') ||
    lower.includes('kemeja') ||
    lower.includes('fashion')
  ) {
    return 'Fashion'
  }
  if (
    lower.includes('phone') ||
    lower.includes('redmi') ||
    lower.includes('samsung') ||
    lower.includes('iphone') ||
    lower.includes('earbuds') ||
    lower.includes('keyboard') ||
    lower.includes('powerbank') ||
    lower.includes('smartwatch') ||
    lower.includes('webcam') ||
    lower.includes('tablet') ||
    lower.includes('usb') ||
    lower.includes('gadget')
  ) {
    return 'Electronics'
  }
  if (
    lower.includes('cadar') ||
    lower.includes('rak') ||
    lower.includes('humidifier') ||
    lower.includes('vacuum') ||
    lower.includes('lampu') ||
    lower.includes('kasur') ||
    lower.includes('tikar') ||
    lower.includes('kitchen') ||
    lower.includes('home')
  ) {
    return 'Home'
  }
  if (
    lower.includes('kopi') ||
    lower.includes('snack') ||
    lower.includes('sambal') ||
    lower.includes('kuih') ||
    lower.includes('madu') ||
    lower.includes('makanan') ||
    lower.includes('food') ||
    lower.includes('keropok')
  ) {
    return 'Food'
  }
  if (
    lower.includes('baby') ||
    lower.includes('toy') ||
    lower.includes('lego') ||
    lower.includes('puzzle') ||
    lower.includes('kids') ||
    lower.includes('game')
  ) {
    return 'Baby'
  }
  return 'Home'
}
