/**
 * Smart Commission XTRA Alert Bot — Mock Data
 *
 * Fasa 3.3 (CHECKLIST Section 3.3).
 *
 * Generates realistic Malaysian-market Commission XTRA products and alerts
 * across 5 niches (beauty, tech, fashion, home, food). All timestamps are
 * computed at module load so the countdown UI always looks fresh.
 *
 * The matcher (`./matcher.ts`) transforms `MOCK_XTRA_PRODUCTS` into
 * `MOCK_ALERTS` by scoring each product against the user's primary niche.
 *
 * Currency: RM. Timezone assumed: Asia/Kuala_Lumpur (UTC+8).
 */

import type { AlertNiche, AlertType, XtraProduct } from './types'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns an ISO string offset from "now" by the given number of minutes. */
function minutesFromNow(min: number): string {
  return new Date(Date.now() + min * 60 * 1000).toISOString()
}

/** Returns an ISO string offset from "now" by the given number of hours. */
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
}

/** Returns an ISO string offset from "now" by the given number of days. */
function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString()
}

/** Returns an ISO string in the past by the given number of minutes. */
function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString()
}

/** Deterministic placeholder thumbnail keyed by a seed string. */
function thumbnail(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/200/200`
}

interface RawProductSeed {
  id: string
  productName: string
  itemId: string
  baseCommission: number
  boostedCommission: number
  price: number
  niche: AlertNiche
  category: string
  shopName: string
  xtraType: AlertType
  /** Minutes until expiry. */
  expiresInMinutes: number
  /** Minutes since the boost started. */
  startedMinutesAgo: number
  estimatedMonthlySales: number
  rating: number
}

// ─── 15 XTRA product seeds (3 per niche) ────────────────────────────────────
//
// Malaysian-context product names mixing EN + BM. Boosted commissions are
// realistic for Shopee MY's Commission XTRA programmes:
//   - Live XTRA: 60-90% (highest, short window)
//   - Flash XTRA: 30-50% (1-6h bursts)
//   - Weekend XTRA: 20-35% (3-day window Fri-Sun)
//   - Mega XTRA: 15-30% (campaign-scale, days-long)
//
const RAW_SEEDS: RawProductSeed[] = [
  // ── Beauty (3) ─────────────────────────────────────────────────────────
  {
    id: 'xtra-001',
    productName: 'Garnier Vitamin C Serum 30ml',
    itemId: '26491012345',
    baseCommission: 12,
    boostedCommission: 80,
    price: 32.9,
    niche: 'beauty',
    category: 'Skincare',
    shopName: 'Garnier Official Store',
    xtraType: 'live_xtra',
    expiresInMinutes: 204, // 3h 24m
    startedMinutesAgo: 36,
    estimatedMonthlySales: 4200,
    rating: 4.8,
  },
  {
    id: 'xtra-002',
    productName: 'Safi Balqis OxyWhite Serum 30ml',
    itemId: '26491067890',
    baseCommission: 10,
    boostedCommission: 30,
    price: 24.5,
    niche: 'beauty',
    category: 'Skincare',
    shopName: 'Safi Official Store',
    xtraType: 'weekend_xtra',
    expiresInMinutes: 3280, // ~2d 6h
    startedMinutesAgo: 240,
    estimatedMonthlySales: 6800,
    rating: 4.7,
  },
  {
    id: 'xtra-003',
    productName: 'Cetaphil Gentle Skin Cleanser 250ml',
    itemId: '26491033311',
    baseCommission: 8,
    boostedCommission: 22,
    price: 49.9,
    niche: 'beauty',
    category: 'Cleanser',
    shopName: 'Cetaphil Malaysia',
    xtraType: 'mega_xtra',
    expiresInMinutes: 4320, // 3 days
    startedMinutesAgo: 1440,
    estimatedMonthlySales: 3100,
    rating: 4.9,
  },

  // ── Tech / Electronics (3) ─────────────────────────────────────────────
  {
    id: 'xtra-004',
    productName: 'Xiaomi Redmi Buds 4 Active',
    itemId: '18430921122',
    baseCommission: 6,
    boostedCommission: 35,
    price: 89.0,
    niche: 'tech',
    category: 'Audio',
    shopName: 'Xiaomi Official Store',
    xtraType: 'flash_xtra',
    expiresInMinutes: 72, // 1h 12m
    startedMinutesAgo: 48,
    estimatedMonthlySales: 5400,
    rating: 4.6,
  },
  {
    id: 'xtra-005',
    productName: 'Anker PowerCore 10000mAh Power Bank',
    itemId: '18430978811',
    baseCommission: 5,
    boostedCommission: 25,
    price: 119.0,
    niche: 'tech',
    category: 'Accessories',
    shopName: 'Anker Malaysia Official',
    xtraType: 'live_xtra',
    expiresInMinutes: 165, // 2h 45m
    startedMinutesAgo: 15,
    estimatedMonthlySales: 2900,
    rating: 4.8,
  },
  {
    id: 'xtra-006',
    productName: 'Logitech MX Master 3S Wireless Mouse',
    itemId: '18430945567',
    baseCommission: 4.5,
    boostedCommission: 18,
    price: 429.0,
    niche: 'tech',
    category: 'Computer',
    shopName: 'Logitech Malaysia',
    xtraType: 'weekend_xtra',
    expiresInMinutes: 2880, // 2 days
    startedMinutesAgo: 540,
    estimatedMonthlySales: 760,
    rating: 4.9,
  },

  // ── Fashion (3) ────────────────────────────────────────────────────────
  {
    id: 'xtra-007',
    productName: 'Uniqlo AIRism UV Protection T-Shirt',
    itemId: '40112887722',
    baseCommission: 7,
    boostedCommission: 28,
    price: 49.9,
    niche: 'fashion',
    category: 'Apparel',
    shopName: 'Uniqlo Official Store',
    xtraType: 'weekend_xtra',
    expiresInMinutes: 3120, // ~2d 4h
    startedMinutesAgo: 360,
    estimatedMonthlySales: 4100,
    rating: 4.7,
  },
  {
    id: 'xtra-008',
    productName: 'Nike Dri-FIT Training Shorts',
    itemId: '40112441188',
    baseCommission: 6,
    boostedCommission: 32,
    price: 99.0,
    niche: 'fashion',
    category: 'Sportswear',
    shopName: 'Nike Official Store',
    xtraType: 'live_xtra',
    expiresInMinutes: 95, // ~1h 35m
    startedMinutesAgo: 25,
    estimatedMonthlySales: 2300,
    rating: 4.8,
  },
  {
    id: 'xtra-009',
    productName: 'Tudung Bawal Premium Soft Chiffon',
    itemId: '40112990333',
    baseCommission: 9,
    boostedCommission: 24,
    price: 39.0,
    niche: 'fashion',
    category: 'Hijab',
    shopName: 'Aina Syahirah Tudung',
    xtraType: 'flash_xtra',
    expiresInMinutes: 240, // 4h
    startedMinutesAgo: 60,
    estimatedMonthlySales: 8700,
    rating: 4.9,
  },

  // ── Home (3) ───────────────────────────────────────────────────────────
  {
    id: 'xtra-010',
    productName: 'Philips Air Fryer 4.1L HD9200',
    itemId: '22948112233',
    baseCommission: 5,
    boostedCommission: 25,
    price: 399.0,
    niche: 'home',
    category: 'Kitchen Appliance',
    shopName: 'Philips Official Store',
    xtraType: 'mega_xtra',
    expiresInMinutes: 300, // 5h
    startedMinutesAgo: 90,
    estimatedMonthlySales: 1500,
    rating: 4.8,
  },
  {
    id: 'xtra-011',
    productName: 'Dyson V8 Absolute Cordless Vacuum',
    itemId: '22948166744',
    baseCommission: 4,
    boostedCommission: 15,
    price: 1899.0,
    niche: 'home',
    category: 'Home Appliance',
    shopName: 'Dyson Malaysia',
    xtraType: 'weekend_xtra',
    expiresInMinutes: 2880,
    startedMinutesAgo: 480,
    estimatedMonthlySales: 420,
    rating: 4.9,
  },
  {
    id: 'xtra-012',
    productName: 'Microfiber Bed Sheet Set Queen Size',
    itemId: '22948182555',
    baseCommission: 8,
    boostedCommission: 30,
    price: 59.0,
    niche: 'home',
    category: 'Bedding',
    shopName: 'Home Comfort MY',
    xtraType: 'live_xtra',
    expiresInMinutes: 180, // 3h
    startedMinutesAgo: 30,
    estimatedMonthlySales: 1900,
    rating: 4.6,
  },

  // ── Food (3) ───────────────────────────────────────────────────────────
  {
    id: 'xtra-013',
    productName: 'Old Town White Coffee 3-in-1 (15 sachets)',
    itemId: '87122334455',
    baseCommission: 10,
    boostedCommission: 35,
    price: 24.9,
    niche: 'food',
    category: 'Beverage',
    shopName: 'Old Town Official Store',
    xtraType: 'flash_xtra',
    expiresInMinutes: 180, // 3h
    startedMinutesAgo: 60,
    estimatedMonthlySales: 12000,
    rating: 4.8,
  },
  {
    id: 'xtra-014',
    productName: 'Mamee Chef Curry Mi Goreng (12 pack)',
    itemId: '87122998766',
    baseCommission: 9,
    boostedCommission: 28,
    price: 18.9,
    niche: 'food',
    category: 'Snacks',
    shopName: 'Mamee Monster Store',
    xtraType: 'weekend_xtra',
    expiresInMinutes: 2160, // 1.5 days
    startedMinutesAgo: 720,
    estimatedMonthlySales: 9500,
    rating: 4.7,
  },
  {
    id: 'xtra-015',
    productName: 'Super Ring Snack Multipack (20 pcs)',
    itemId: '87122456123',
    baseCommission: 11,
    boostedCommission: 40,
    price: 14.9,
    niche: 'food',
    category: 'Snacks',
    shopName: 'Mamee-Double Decker',
    xtraType: 'live_xtra',
    expiresInMinutes: 145, // ~2h 25m
    startedMinutesAgo: 35,
    estimatedMonthlySales: 15000,
    rating: 4.9,
  },
]

// ─── Public mock data exports ──────────────────────────────────────────────

/**
 * Fully-realised `XtraProduct[]` — timestamps computed at module load so the
 * countdown UI on the alerts page is always relative to "now".
 */
export const MOCK_XTRA_PRODUCTS: XtraProduct[] = RAW_SEEDS.map((s) => ({
  id: s.id,
  productName: s.productName,
  itemId: s.itemId,
  thumbnail: thumbnail(s.productName),
  baseCommission: s.baseCommission,
  boostedCommission: s.boostedCommission,
  boostDelta: s.boostedCommission - s.baseCommission,
  price: s.price,
  niche: s.niche,
  category: s.category,
  shopName: s.shopName,
  xtraType: s.xtraType,
  startedAt: minutesAgo(s.startedMinutesAgo),
  expiresAt: minutesFromNow(s.expiresInMinutes),
  estimatedMonthlySales: s.estimatedMonthlySales,
  rating: s.rating,
}))

/** Quick lookup by id. */
export function getXtraProductById(id: string): XtraProduct | undefined {
  return MOCK_XTRA_PRODUCTS.find((p) => p.id === id)
}

/** Convenience: filter XTRA products by niche. */
export function getXtraProductsByNiche(niche: AlertNiche | 'all'): XtraProduct[] {
  if (niche === 'all') return MOCK_XTRA_PRODUCTS
  return MOCK_XTRA_PRODUCTS.filter((p) => p.niche === niche)
}

/** Convenience: products currently boosting (i.e. expiresAt > now). */
export function getActiveXtraProducts(): XtraProduct[] {
  const now = Date.now()
  return MOCK_XTRA_PRODUCTS.filter((p) => new Date(p.expiresAt).getTime() > now)
}

/**
 * Display metadata for each AlertType — used by both the API and the UI
 * to keep icon/colour/label choices consistent.
 */
export const ALERT_TYPE_META: Record<
  AlertType,
  {
    label: string
    shortLabel: string
    emoji: string
    /** Tailwind text/bg colour classes. */
    color: string
    bg: string
    /** Accent ring colour for the card border. */
    ring: string
    /** Hex colour for charts/badges. */
    hex: string
  }
> = {
  live_xtra: {
    label: 'Shopee Live XTRA',
    shortLabel: 'Live XTRA',
    emoji: '🟠',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    ring: 'ring-orange-500/30',
    hex: '#f97316',
  },
  flash_xtra: {
    label: 'Flash XTRA',
    shortLabel: 'Flash XTRA',
    emoji: '🔴',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/30',
    hex: '#ef4444',
  },
  weekend_xtra: {
    label: 'Weekend XTRA',
    shortLabel: 'Weekend XTRA',
    emoji: '🟣',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    ring: 'ring-purple-500/30',
    hex: '#a855f7',
  },
  mega_xtra: {
    label: 'Mega XTRA',
    shortLabel: 'Mega XTRA',
    emoji: '🟡',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
    ring: 'ring-yellow-500/30',
    hex: '#eab308',
  },
}

/** Display metadata for each niche. */
export const NICHE_META: Record<
  AlertNiche,
  { label: string; emoji: string; color: string }
> = {
  beauty: { label: 'Beauty', emoji: '💄', color: 'text-pink-600 dark:text-pink-400' },
  tech: { label: 'Tech', emoji: '📱', color: 'text-cyan-600 dark:text-cyan-400' },
  fashion: { label: 'Fashion', emoji: '👕', color: 'text-violet-600 dark:text-violet-400' },
  home: { label: 'Home', emoji: '🏠', color: 'text-emerald-600 dark:text-emerald-400' },
  food: { label: 'Food', emoji: '🍜', color: 'text-amber-600 dark:text-amber-400' },
}

/** All available niches (for the preferences toggle bar). */
export const ALL_NICHES: AlertNiche[] = ['beauty', 'tech', 'fashion', 'home', 'food']

/** Stable "last checked" timestamp — refreshed at module load. */
export const LAST_CHECKED_AT: string = minutesAgo(2)

/** When the next cron tick is expected (every 30 minutes by spec). */
export const NEXT_CHECK_AT: string = minutesFromNow(28)

/** Convenience re-export for time helpers used by the API route. */
export const __timeHelpers = { minutesFromNow, hoursFromNow, daysFromNow, minutesAgo }
