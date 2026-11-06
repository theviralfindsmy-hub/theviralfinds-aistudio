/**
 * Lazada Affiliate API - Mock Data Service
 *
 * Simulates realistic Lazada Malaysia (MY) market data.
 * Uses Malaysian Ringgit (RM) pricing, Malay/English/Manglish mixed product names,
 * and authentic Malaysian seller names.
 *
 * This service mirrors the same method signatures as the real API client,
 * so they can be used interchangeably by LazadaAffiliateService.
 *
 * Official API Docs: https://open.lazada.com/
 * Affiliate Portal: https://lazada-affiliate.com/
 */

// ─── Types (mirrored from affiliate-service.ts) ─────────────────

export interface LazadaProduct {
  id: string
  itemId: number
  title: string
  price: number // RM
  originalPrice?: number
  commissionRate: number // percentage 0-100
  commissionAmount: number // RM, computed = price * rate / 100
  imageUrl: string
  shopName: string
  category: string
  categoryId: number
  sales: number
  rating: number // 0-5
  reviewCount: number
  location: string
  platform: 'lazada'
  productLink: string
  deepLink?: string
  isLazMall?: boolean
  isFreeShipping?: boolean
}

export interface LazadaAffiliateLink {
  shortUrl: string
  longUrl: string
  deepLink: string
  trackingUrl: string
  subId?: string
}

export interface LazadaCommissionOrder {
  orderSn: string
  orderCreateTime: number // unix seconds
  itemId: number
  itemName: string
  itemPrice: number
  commissionRate: number
  commissionAmount: number
  commissionStatus: 'pending' | 'confirmed' | 'rejected' | 'paid'
  orderStatus: string
  settleTime?: number
  clickTime: number
  subId?: string
  platform: 'lazada'
}

export interface LazadaCommissionSummary {
  totalCommission: number
  pendingCommission: number
  confirmedCommission: number
  rejectedCommission: number
  paidCommission: number
  totalOrders: number
  conversionRate: number
}

export interface LazadaCategory {
  categoryId: number
  name: string
  productCount: number
  avgCommissionRate: number
}

export interface LazadaAffiliateProfile {
  affiliateId: string
  name: string
  email: string
  status: string
  commissionRate: number
  totalEarnings: number
  joinDate: string
  region: string
}

// ─── Categories ─────────────────────────────────────────────────

export const CATEGORIES: LazadaCategory[] = [
  { categoryId: 1, name: 'Beauty', productCount: 8, avgCommissionRate: 9 },
  { categoryId: 2, name: 'Fashion', productCount: 8, avgCommissionRate: 7 },
  { categoryId: 3, name: 'Electronics', productCount: 7, avgCommissionRate: 5 },
  { categoryId: 4, name: 'Home & Living', productCount: 7, avgCommissionRate: 6 },
  { categoryId: 5, name: 'Groceries', productCount: 6, avgCommissionRate: 10 },
  { categoryId: 6, name: 'Baby & Kids', productCount: 6, avgCommissionRate: 8 },
]

// ─── Shop Names (authentic Malaysian Lazada sellers) ───────────

const SHOP_NAMES: string[] = [
  'Safi Official Store',
  'Padini Official Store',
  'Anker Malaysia Official',
  'Dyson Malaysia Official',
  'Fortune Trading Official',
  'MamyPoko Official Store',
  'Watsons Malaysia',
  'Guardian Health & Beauty',
  'Sephora Malaysia',
  'Nike Official Store',
  'Adidas Malaysia Official',
  'Puma Southeast Asia',
  'Xiaomi Malaysia Official',
  'Samsung Experience Store',
  'Apple Premium Reseller MY',
  'Sony Malaysia Official',
  'Philips Official Store',
  'Sharp Malaysia Official',
  'Electrical World Sdn Bhd',
  'Kaison Malaysia Official',
  'MR DIY Official Store',
  'Jaya Grocer Online',
  'Tesco/Lotus Official',
  'AEON Malaysia Official',
  'Nestle Malaysia Official',
  'F&N Malaysia Official',
  'Mamee Official Store',
  'Munchy Food Industries',
  'Hup Seng Perusahaan',
  'Unicharm Malaysia',
]

const LOCATIONS: string[] = [
  'Kuala Lumpur',
  'Selangor',
  'Penang',
  'Johor',
  'Perak',
  'Sabah',
  'Sarawak',
  'Negeri Sembilan',
  'Pahang',
  'Melaka',
]

// ─── Product Catalog (42 realistic Malaysian Lazada products) ──

interface ProductSeed {
  title: string
  category: string
  categoryId: number
  price: number
  originalPrice?: number
  commissionRate: number
  sales: number
  rating: number
  reviewCount: number
  isLazMall?: boolean
  isFreeShipping?: boolean
}

const PRODUCT_SEEDS: ProductSeed[] = [
  // === Beauty (8 products) ===
  {
    title: 'Safi Balqis OxyWhite Glowing Serum 30ml',
    category: 'Beauty',
    categoryId: 1,
    price: 29.90,
    originalPrice: 39.90,
    commissionRate: 10,
    sales: 15420,
    rating: 4.8,
    reviewCount: 8930,
    isLazMall: true,
    isFreeShipping: true,
  },
  {
    title: 'Wardah Perfect Bright Moisturizer 50ml Halal',
    category: 'Beauty',
    categoryId: 1,
    price: 45.90,
    originalPrice: 55.00,
    commissionRate: 9,
    sales: 8920,
    rating: 4.7,
    reviewCount: 5210,
    isLazMall: true,
  },
  {
    title: 'Sephora Collection Colorful Eyeshadow Palette',
    category: 'Beauty',
    categoryId: 1,
    price: 79.00,
    originalPrice: 99.00,
    commissionRate: 8,
    sales: 3210,
    rating: 4.6,
    reviewCount: 1820,
    isLazMall: true,
  },
  {
    title: 'Bioaqua Pink Foam Face Wash Cleanser 100g',
    category: 'Beauty',
    categoryId: 1,
    price: 12.90,
    originalPrice: 19.90,
    commissionRate: 12,
    sales: 24180,
    rating: 4.5,
    reviewCount: 15230,
    isFreeShipping: true,
  },
  {
    title: 'Nivea Sun Protect & White SPF50+ Sunscreen 50ml',
    category: 'Beauty',
    categoryId: 1,
    price: 24.90,
    originalPrice: 32.90,
    commissionRate: 9,
    sales: 11200,
    rating: 4.7,
    reviewCount: 6840,
    isLazMall: true,
  },
  {
    title: 'Cetaphil Gentle Skin Cleanser 250ml Sensitive Skin',
    category: 'Beauty',
    categoryId: 1,
    price: 49.90,
    originalPrice: 59.90,
    commissionRate: 7,
    sales: 7890,
    rating: 4.8,
    reviewCount: 4320,
    isLazMall: true,
    isFreeShipping: true,
  },
  {
    title: 'Maybelline Fit Me Matte+Poreless Foundation 30ml',
    category: 'Beauty',
    categoryId: 1,
    price: 32.90,
    originalPrice: 42.90,
    commissionRate: 8,
    sales: 13420,
    rating: 4.6,
    reviewCount: 7810,
    isLazMall: true,
  },
  {
    title: 'Mask Malaya Herbal Volcanic Mud Mask 100g',
    category: 'Beauty',
    categoryId: 1,
    price: 19.90,
    originalPrice: 29.90,
    commissionRate: 11,
    sales: 9870,
    rating: 4.4,
    reviewCount: 5230,
    isFreeShipping: true,
  },

  // === Fashion (8 products) ===
  {
    title: 'Padini Cargo Pants Mens Casual Slim Fit',
    category: 'Fashion',
    categoryId: 2,
    price: 89.90,
    originalPrice: 129.00,
    commissionRate: 7,
    sales: 5420,
    rating: 4.6,
    reviewCount: 2980,
    isLazMall: true,
    isFreeShipping: true,
  },
  {
    title: 'Nike Sportswear Club Fleece Hoodie Mens Original',
    category: 'Fashion',
    categoryId: 2,
    price: 159.00,
    originalPrice: 199.00,
    commissionRate: 6,
    sales: 3210,
    rating: 4.8,
    reviewCount: 1840,
    isLazMall: true,
  },
  {
    title: 'Uniqlo Airism UV Protection T-Shirt Short Sleeve',
    category: 'Fashion',
    categoryId: 2,
    price: 49.90,
    originalPrice: 59.90,
    commissionRate: 8,
    sales: 12450,
    rating: 4.7,
    reviewCount: 7210,
    isFreeShipping: true,
  },
  {
    title: 'Adidas Ultraboost 22 Running Shoes Mens Original',
    category: 'Fashion',
    categoryId: 2,
    price: 599.00,
    originalPrice: 799.00,
    commissionRate: 5,
    sales: 980,
    rating: 4.9,
    reviewCount: 540,
    isLazMall: true,
  },
  {
    title: 'Levis 501 Original Fit Jeans Mens Authentic',
    category: 'Fashion',
    categoryId: 2,
    price: 249.00,
    originalPrice: 329.00,
    commissionRate: 6,
    sales: 1870,
    rating: 4.7,
    reviewCount: 980,
    isLazMall: true,
  },
  {
    title: 'Baju Kurung Moden Wanita Muslimah Raya 2024',
    category: 'Fashion',
    categoryId: 2,
    price: 129.00,
    originalPrice: 189.00,
    commissionRate: 10,
    sales: 6720,
    rating: 4.6,
    reviewCount: 3940,
    isFreeShipping: true,
  },
  {
    title: 'Tudung Bawal Premium Lawa Voile Murah Soft',
    category: 'Fashion',
    categoryId: 2,
    price: 25.90,
    originalPrice: 39.90,
    commissionRate: 13,
    sales: 21340,
    rating: 4.7,
    reviewCount: 12450,
    isFreeShipping: true,
  },
  {
    title: 'Puma T-Shirt Mens Cotton Classic Logo Tee',
    category: 'Fashion',
    categoryId: 2,
    price: 79.00,
    originalPrice: 99.00,
    commissionRate: 7,
    sales: 4320,
    rating: 4.5,
    reviewCount: 2210,
    isLazMall: true,
  },

  // === Electronics (7 products) ===
  {
    title: 'Anker PowerCore 10000mAh Power Bank Slim Fast Charge',
    category: 'Electronics',
    categoryId: 3,
    price: 119.00,
    originalPrice: 149.00,
    commissionRate: 6,
    sales: 18420,
    rating: 4.8,
    reviewCount: 11230,
    isLazMall: true,
    isFreeShipping: true,
  },
  {
    title: 'Xiaomi Redmi Note 13 Pro 5G 256GB Smartphone Original',
    category: 'Electronics',
    categoryId: 3,
    price: 1299.00,
    originalPrice: 1499.00,
    commissionRate: 4,
    sales: 2340,
    rating: 4.7,
    reviewCount: 1340,
    isLazMall: true,
  },
  {
    title: 'Apple AirPods Pro 2nd Gen USB-C Original Malaysia',
    category: 'Electronics',
    categoryId: 3,
    price: 949.00,
    originalPrice: 1099.00,
    commissionRate: 3,
    sales: 1890,
    rating: 4.9,
    reviewCount: 1120,
    isLazMall: true,
  },
  {
    title: 'Samsung Galaxy Tab A9+ 11" 64GB WiFi Tablet Original',
    category: 'Electronics',
    categoryId: 3,
    price: 799.00,
    originalPrice: 999.00,
    commissionRate: 4,
    sales: 1230,
    rating: 4.6,
    reviewCount: 680,
    isLazMall: true,
  },
  {
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    category: 'Electronics',
    categoryId: 3,
    price: 1799.00,
    originalPrice: 1999.00,
    commissionRate: 3,
    sales: 540,
    rating: 4.9,
    reviewCount: 320,
    isLazMall: true,
  },
  {
    title: 'JBL Flip 6 Portable Bluetooth Speaker Waterproof',
    category: 'Electronics',
    categoryId: 3,
    price: 549.00,
    originalPrice: 699.00,
    commissionRate: 5,
    sales: 2980,
    rating: 4.7,
    reviewCount: 1640,
    isLazMall: true,
    isFreeShipping: true,
  },
  {
    title: 'Logitech MX Master 3S Wireless Mouse Silent Premium',
    category: 'Electronics',
    categoryId: 3,
    price: 429.00,
    originalPrice: 499.00,
    commissionRate: 5,
    sales: 1670,
    rating: 4.8,
    reviewCount: 920,
    isLazMall: true,
  },

  // === Home & Living (7 products) ===
  {
    title: 'Dyson V8 Absolute Cordless Vacuum Cleaner Original',
    category: 'Home & Living',
    categoryId: 4,
    price: 1899.00,
    originalPrice: 2299.00,
    commissionRate: 3,
    sales: 890,
    rating: 4.8,
    reviewCount: 540,
    isLazMall: true,
  },
  {
    title: 'Philips Air Fryer HD9200 4.1L Digital Healthy Cooking',
    category: 'Home & Living',
    categoryId: 4,
    price: 349.00,
    originalPrice: 449.00,
    commissionRate: 6,
    sales: 8420,
    rating: 4.7,
    reviewCount: 5120,
    isLazMall: true,
    isFreeShipping: true,
  },
  {
    title: 'Sharp Air Purifier FP-J30M-B Plasmacluster Malaysia',
    category: 'Home & Living',
    categoryId: 4,
    price: 599.00,
    originalPrice: 799.00,
    commissionRate: 5,
    sales: 2340,
    rating: 4.6,
    reviewCount: 1320,
    isLazMall: true,
  },
  {
    title: 'Kaison Insulated Water Bottle 500ml Stainless Steel',
    category: 'Home & Living',
    categoryId: 4,
    price: 22.90,
    originalPrice: 35.90,
    commissionRate: 12,
    sales: 14230,
    rating: 4.5,
    reviewCount: 8210,
    isFreeShipping: true,
  },
  {
    title: 'MR DIY Multi-Purpose Storage Box Foldable Organizer',
    category: 'Home & Living',
    categoryId: 4,
    price: 18.90,
    originalPrice: 29.90,
    commissionRate: 14,
    sales: 28940,
    rating: 4.4,
    reviewCount: 16540,
    isFreeShipping: true,
  },
  {
    title: 'Panasonic 4-Slice Toaster Sandwich Maker Breakfast',
    category: 'Home & Living',
    categoryId: 4,
    price: 159.00,
    originalPrice: 219.00,
    commissionRate: 7,
    sales: 3420,
    rating: 4.6,
    reviewCount: 1820,
    isLazMall: true,
  },
  {
    title: 'Pendekar Mosquito Racket Rechargeable Electric Killer',
    category: 'Home & Living',
    categoryId: 4,
    price: 19.90,
    originalPrice: 39.90,
    commissionRate: 13,
    sales: 32150,
    rating: 4.3,
    reviewCount: 19870,
    isFreeShipping: true,
  },

  // === Groceries (6 products) ===
  {
    title: 'Fortune Cooking Oil 5kg Halal Malaysia Murah',
    category: 'Groceries',
    categoryId: 5,
    price: 32.50,
    originalPrice: 39.90,
    commissionRate: 12,
    sales: 18520,
    rating: 4.7,
    reviewCount: 9230,
    isLazMall: true,
    isFreeShipping: true,
  },
  {
    title: 'Nestle MILO 3in1 Active 30 sachets Original Malaysia',
    category: 'Groceries',
    categoryId: 5,
    price: 26.90,
    originalPrice: 32.90,
    commissionRate: 11,
    sales: 22340,
    rating: 4.8,
    reviewCount: 13420,
    isLazMall: true,
  },
  {
    title: 'Mamee Chef Curry Mie Instant Noodle Pack 8s Pedas',
    category: 'Groceries',
    categoryId: 5,
    price: 14.90,
    originalPrice: 19.90,
    commissionRate: 13,
    sales: 16720,
    rating: 4.6,
    reviewCount: 8940,
    isFreeShipping: true,
  },
  {
    title: 'Madu Asli Tualang Pure Honey 500g Original Kelulut',
    category: 'Groceries',
    categoryId: 5,
    price: 49.90,
    originalPrice: 79.90,
    commissionRate: 10,
    sales: 6840,
    rating: 4.5,
    reviewCount: 3210,
    isFreeShipping: true,
  },
  {
    title: 'F&N NutriSoya Fresh Milk Soy Bean 1L Halal',
    category: 'Groceries',
    categoryId: 5,
    price: 7.90,
    originalPrice: 9.90,
    commissionRate: 14,
    sales: 12450,
    rating: 4.6,
    reviewCount: 5640,
    isLazMall: true,
  },
  {
    title: 'Hup Seng Cream Crackers Biscuit 800g Original Pack',
    category: 'Groceries',
    categoryId: 5,
    price: 11.90,
    originalPrice: 15.90,
    commissionRate: 13,
    sales: 9320,
    rating: 4.7,
    reviewCount: 4180,
    isFreeShipping: true,
  },

  // === Baby & Kids (6 products) ===
  {
    title: 'MamyPoko Pants Standard M56 Baby Diaper Original',
    category: 'Baby & Kids',
    categoryId: 6,
    price: 49.90,
    originalPrice: 59.90,
    commissionRate: 8,
    sales: 14230,
    rating: 4.8,
    reviewCount: 8420,
    isLazMall: true,
    isFreeShipping: true,
  },
  {
    title: 'Pampers Premium Care Pants L52 Diaper Original Halal',
    category: 'Baby & Kids',
    categoryId: 6,
    price: 59.90,
    originalPrice: 72.90,
    commissionRate: 7,
    sales: 11240,
    rating: 4.8,
    reviewCount: 6730,
    isLazMall: true,
  },
  {
    title: 'Anmum Essensis Stage 1 Infant Formula 0-6m 900g',
    category: 'Baby & Kids',
    categoryId: 6,
    price: 89.90,
    originalPrice: 109.00,
    commissionRate: 9,
    sales: 4320,
    rating: 4.7,
    reviewCount: 2340,
    isLazMall: true,
  },
  {
    title: 'Philips Avent Natural Baby Bottle Anti-Colic 260ml',
    category: 'Baby & Kids',
    categoryId: 6,
    price: 45.90,
    originalPrice: 59.90,
    commissionRate: 8,
    sales: 6890,
    rating: 4.7,
    reviewCount: 3810,
    isLazMall: true,
  },
  {
    title: 'Fisher-Price Baby Play Mat Activity Gym Educational',
    category: 'Baby & Kids',
    categoryId: 6,
    price: 149.00,
    originalPrice: 199.00,
    commissionRate: 7,
    sales: 2340,
    rating: 4.6,
    reviewCount: 1240,
    isLazMall: true,
    isFreeShipping: true,
  },
  {
    title: 'Johnson Baby Bedtime Lotion 500ml Sleep Gentle',
    category: 'Baby & Kids',
    categoryId: 6,
    price: 29.90,
    originalPrice: 39.90,
    commissionRate: 9,
    sales: 8920,
    rating: 4.7,
    reviewCount: 4520,
    isLazMall: true,
    isFreeShipping: true,
  },
]

// ─── Helpers ────────────────────────────────────────────────────

/** Round to 2 decimal places */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Random integer in range [min, max] */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Pick a random element from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Generate a random Lazada item ID (numeric string) */
function randomItemId(): number {
  return randInt(100000000, 999999999)
}

/** Generate a random Lazada order SN (e.g. "lz-1234567890") */
function randomOrderSn(): string {
  const digits = randInt(1000000000, 9999999999)
  return `lz-${digits}`
}

/** Generate a random short link code */
function randomShortCode(): string {
  return Math.random().toString(36).substring(2, 9)
}

/** Seeded random for deterministic mock data */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

// ─── Mock Service ───────────────────────────────────────────────

export class LazadaMockService {
  private products: LazadaProduct[]

  constructor() {
    this.products = this.generateProducts()
  }

  /** Build the full product catalog from seeds */
  private generateProducts(): LazadaProduct[] {
    return PRODUCT_SEEDS.map((seed, i) => {
      const shopName = SHOP_NAMES[i % SHOP_NAMES.length]
      const itemId = randomItemId()
      const commissionAmount = round2((seed.price * seed.commissionRate) / 100)

      return {
        id: `lz-${itemId}`,
        itemId,
        title: seed.title,
        price: seed.price,
        originalPrice: seed.originalPrice,
        commissionRate: seed.commissionRate,
        commissionAmount,
        imageUrl: `https://my-test.lazada.com.my/p/${itemId}.jpg`,
        shopName,
        category: seed.category,
        categoryId: seed.categoryId,
        sales: seed.sales,
        rating: seed.rating,
        reviewCount: seed.reviewCount,
        location: pick(LOCATIONS),
        platform: 'lazada' as const,
        productLink: `https://www.lazada.com.my/products/i${itemId}-s${itemId}.html`,
        deepLink: `lazada://product?item_id=${itemId}`,
        isLazMall: seed.isLazMall,
        isFreeShipping: seed.isFreeShipping,
      }
    })
  }

  /**
   * Search products by keyword with filtering, sorting and pagination
   */
  async searchProducts(
    query: string,
    options?: {
      page?: number
      limit?: number
      sortField?: 'commission' | 'price' | 'sales' | 'rating'
      sortOrder?: 'asc' | 'desc'
      categoryId?: number
      minPrice?: number
      maxPrice?: number
    }
  ): Promise<{ products: LazadaProduct[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const sortField = options?.sortField || 'sales'
    const sortOrder = options?.sortOrder || 'desc'

    const queryLower = query.toLowerCase().trim()
    let filtered: LazadaProduct[]

    if (!queryLower) {
      // Empty query → return full catalog
      filtered = [...this.products]
    } else {
      // Filter by keyword (case-insensitive match on title, category, shop)
      filtered = this.products.filter(
        (p) =>
          p.title.toLowerCase().includes(queryLower) ||
          p.category.toLowerCase().includes(queryLower) ||
          p.shopName.toLowerCase().includes(queryLower)
      )

      // Fall back to tokenised matching
      if (filtered.length === 0) {
        const tokens = queryLower.split(/\s+/).filter(Boolean)
        filtered = this.products.filter((p) =>
          tokens.some(
            (t) =>
              p.title.toLowerCase().includes(t) ||
              p.category.toLowerCase().includes(t)
          )
        )
      }

      // If still nothing, return a random curated subset with the query prepended
      if (filtered.length === 0) {
        const shuffled = [...this.products].sort(() => Math.random() - 0.5)
        filtered = shuffled.slice(0, Math.min(limit, shuffled.length)).map((p) => ({
          ...p,
          id: `lz-${randomItemId()}`,
          itemId: randomItemId(),
          title: `${query} - ${p.title}`,
        }))
      }
    }

    // Category filter
    if (options?.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === options.categoryId)
    }

    // Price filters
    if (options?.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= (options.minPrice ?? 0))
    }
    if (options?.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= (options.maxPrice ?? Infinity))
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number
      let bVal: number
      switch (sortField) {
        case 'commission':
          aVal = a.commissionRate
          bVal = b.commissionRate
          break
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        case 'rating':
          aVal = a.rating
          bVal = b.rating
          break
        case 'sales':
        default:
          aVal = a.sales
          bVal = b.sales
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const paged = filtered.slice(start, start + limit)

    return { products: paged, total }
  }

  /** Get product detail by item ID */
  async getProductDetail(itemId: number): Promise<LazadaProduct | null> {
    const product = this.products.find((p) => p.itemId === itemId)
    if (product) return { ...product }
    // Generate a synthetic product for unknown IDs (so deep links still work)
    const seed = pick(PRODUCT_SEEDS)
    return {
      id: `lz-${itemId}`,
      itemId,
      title: seed.title,
      price: seed.price,
      originalPrice: seed.originalPrice,
      commissionRate: seed.commissionRate,
      commissionAmount: round2((seed.price * seed.commissionRate) / 100),
      imageUrl: `https://my-test.lazada.com.my/p/${itemId}.jpg`,
      shopName: pick(SHOP_NAMES),
      category: seed.category,
      categoryId: seed.categoryId,
      sales: seed.sales,
      rating: seed.rating,
      reviewCount: seed.reviewCount,
      location: pick(LOCATIONS),
      platform: 'lazada',
      productLink: `https://www.lazada.com.my/products/i${itemId}-s${itemId}.html`,
      deepLink: `lazada://product?item_id=${itemId}`,
      isLazMall: seed.isLazMall,
      isFreeShipping: seed.isFreeShipping,
    }
  }

  /** Generate a mock affiliate tracking link */
  async generateAffiliateLink(params: {
    itemId?: number
    productUrl?: string
    subId?: string
  }): Promise<LazadaAffiliateLink> {
    const shortCode = randomShortCode()
    const itemId = params.itemId || randomItemId()
    const subId = params.subId || ''

    return {
      shortUrl: `https://s.lazada.com.my/${shortCode}`,
      longUrl: `https://lazada.com.my/affiliate/${shortCode}?item_id=${itemId}&sub_id=${subId}`,
      deepLink: `lazada://product?item_id=${itemId}&aff_id=${shortCode}&aff_sub=${subId}`,
      trackingUrl: `https://affiliate.lazada.com.my/track/${shortCode}`,
      subId: subId || undefined,
    }
  }

  /** Get mock commission orders */
  async getCommissionOrders(params?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: 'pending' | 'confirmed' | 'rejected' | 'paid'
  }): Promise<{ orders: LazadaCommissionOrder[]; total: number }> {
    const page = params?.page || 1
    const limit = params?.limit || 50
    const statuses: Array<'pending' | 'confirmed' | 'rejected' | 'paid'> = [
      'pending',
      'confirmed',
      'rejected',
      'paid',
    ]
    const orderStatuses = ['DELIVERED', 'SHIPPED', 'IN_PROGRESS', 'COMPLETED', 'RTS']

    const orderCount = randInt(30, 140)
    const orders: LazadaCommissionOrder[] = []

    for (let i = 0; i < orderCount; i++) {
      const seed = i + (params?.startTime || 0)
      const tmpl = PRODUCT_SEEDS[seed % PRODUCT_SEEDS.length]
      const price = tmpl.price
      const commissionRate = tmpl.commissionRate
      const commissionAmount = round2((price * commissionRate) / 100)
      const status = statuses[Math.floor(seededRandom(seed * 7) * statuses.length)]
      const daysAgo = Math.floor(seededRandom(seed * 13) * 60)
      const orderTime = Math.floor(Date.now() / 1000) - daysAgo * 86400
      const clickTime = orderTime - randInt(300, 86400)

      if (params?.commissionStatus && status !== params.commissionStatus) continue
      if (params?.startTime && orderTime < params.startTime) continue
      if (params?.endTime && orderTime > params.endTime) continue

      orders.push({
        orderSn: randomOrderSn(),
        orderCreateTime: orderTime,
        itemId: randomItemId(),
        itemName: tmpl.title,
        itemPrice: price,
        commissionRate,
        commissionAmount,
        commissionStatus: status,
        orderStatus: pick(orderStatuses),
        settleTime:
          status === 'paid'
            ? orderTime + randInt(86400, 86400 * 30)
            : undefined,
        clickTime,
        subId: Math.random() > 0.6 ? `sub_${randInt(100, 999)}` : undefined,
        platform: 'lazada',
      })
    }

    const total = orders.length
    const start = (page - 1) * limit
    return { orders: orders.slice(start, start + limit), total }
  }

  /** Get mock commission summary */
  async getCommissionSummary(_params?: {
    startTime?: number
    endTime?: number
  }): Promise<LazadaCommissionSummary> {
    return {
      totalCommission: round2(randInt(2000, 8000) + Math.random() * 500),
      pendingCommission: round2(randInt(300, 1500) + Math.random() * 100),
      confirmedCommission: round2(randInt(1000, 4000) + Math.random() * 200),
      rejectedCommission: round2(randInt(50, 400) + Math.random() * 50),
      paidCommission: round2(randInt(500, 3000) + Math.random() * 200),
      totalOrders: randInt(200, 1500),
      conversionRate: round2(randInt(40, 120) / 10),
    }
  }

  /** Test mock connection */
  async testConnection(): Promise<{ success: boolean; message: string; region: string }> {
    return {
      success: true,
      message: 'Connected to mock data service (Lazada API not configured)',
      region: 'MY',
    }
  }

  /** Get mock affiliate profile */
  async getAffiliateProfile(): Promise<LazadaAffiliateProfile> {
    return {
      affiliateId: 'MY-LZ-AFF-20240042',
      name: 'TheViralFinds MY',
      email: 'affiliate@theviralfinds.my',
      status: 'active',
      commissionRate: 7.5,
      totalEarnings: round2(randInt(5000, 15000) + Math.random() * 500),
      joinDate: '2024-02-01',
      region: 'MY',
    }
  }

  /** Get top products by commission × sales */
  async getTopProducts(limit?: number): Promise<LazadaProduct[]> {
    const sorted = [...this.products].sort(
      (a, b) =>
        b.price * b.commissionRate * b.sales - a.price * a.commissionRate * a.sales
    )
    return sorted.slice(0, limit || 10)
  }

  /** Get categories */
  async getCategories(): Promise<LazadaCategory[]> {
    return CATEGORIES
  }
}
