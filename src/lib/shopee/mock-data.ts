/**
 * Shopee Affiliate API - Mock Data Service
 * 
 * Simulates realistic Shopee data for Malaysia (MY) market.
 * Uses Malaysian Ringgit (RM) pricing, Malay/English mixed product names,
 * and authentic Malaysian shop names.
 * 
 * This service mirrors the same method signatures as the real API,
 * so they can be used interchangeably.
 */

// ─── Types (mirrored from affiliate-api.ts) ─────────────────────

export interface ShopeeProduct {
  itemId: number
  name: string
  image: string
  price: number
  originalPrice?: number
  commissionRate: number
  commissionMin: number
  commissionMax: number
  sales: number
  ratingStar: number
  shopName: string
  shopId: number
  category: string
  categoryId: number
  productLink: string
  deepLink?: string
}

export interface ShopeeAffiliateLink {
  shortUrl: string
  longUrl: string
  deepLink: string
  generateUrl: string
}

export interface ShopeeCommissionOrder {
  orderSn: string
  orderCreateTime: number
  itemId: number
  itemName: string
  itemPrice: number
  commissionRate: number
  commission: number
  commissionStatus: 'pending' | 'confirmed' | 'rejected' | 'paid'
  orderStatus: string
  settleTime?: number
  clickTime: number
  subId?: string
}

export interface ShopeeCommissionSummary {
  totalCommission: number
  pendingCommission: number
  confirmedCommission: number
  rejectedCommission: number
  paidCommission: number
  totalOrders: number
  conversionRate: number
}

export interface ShopeeClickStats {
  date: string
  clicks: number
  uniqueClicks: number
  conversions: number
  earnings: number
}

export interface ShopeeAffiliateProfile {
  affiliateId: string
  name: string
  email: string
  status: string
  commissionRate: number
  totalEarnings: number
  joinDate: string
  region: string
}

export interface ShopeeCategory {
  categoryId: number
  name: string
  productCount: number
  avgCommissionRate: number
}

// ─── Seed Data ──────────────────────────────────────────────────

const CATEGORIES: ShopeeCategory[] = [
  { categoryId: 1, name: 'Electronics', productCount: 15420, avgCommissionRate: 3.5 },
  { categoryId: 2, name: 'Fashion', productCount: 32150, avgCommissionRate: 5.0 },
  { categoryId: 3, name: 'Home & Living', productCount: 18700, avgCommissionRate: 4.2 },
  { categoryId: 4, name: 'Beauty & Health', productCount: 24500, avgCommissionRate: 6.0 },
  { categoryId: 5, name: 'Sports & Outdoors', productCount: 9800, avgCommissionRate: 4.0 },
  { categoryId: 6, name: 'Food & Beverages', productCount: 12300, avgCommissionRate: 3.0 },
  { categoryId: 7, name: 'Toys & Games', productCount: 7600, avgCommissionRate: 4.5 },
  { categoryId: 8, name: 'Automotive', productCount: 5400, avgCommissionRate: 3.8 },
]

const SHOP_NAMES = [
  'TechGadget MY Official',
  'GadgetZone Malaysia',
  'Xiaomi Official Store MY',
  'Samsung Malaysia Official',
  'Kedai Gadget KL',
  'FashionHub.My',
  'BajuKurung Premium',
  'Muslimah Style MY',
  'Kasut Wanita Official',
  'Trendy Fashion MY',
  'HomeDecor Malaysia',
  'Kedai Runcit Online',
  'Kitchen World MY',
  'Cosmetic Beauty MY',
  'K-Beauty Malaysia',
  'Skincare HQ MY',
  'SportStation MY',
  'Outdoor Adventure MY',
  'Makanan Snack MY',
  'Kopi & Tea Malaysia',
  'ToyLand Malaysia',
  'GameZone MY',
  'AutoParts Malaysia',
  'Car Accessories MY',
  'Official Store MY',
  'Premium Seller KL',
  'BestDeal Malaysia',
  'Shopee Mall Official',
  'Digital World MY',
  'Smart Living Store',
]

const PRODUCT_TEMPLATES: Array<{
  name: string
  category: string
  categoryId: number
  priceRange: [number, number]
  commissionRange: [number, number]
  salesRange: [number, number]
}> = [
  // Electronics
  { name: 'Xiaomi Redmi Note 13 Pro 5G - ORIGINAL Malaysia Set', category: 'Electronics', categoryId: 1, priceRange: [699, 1299], commissionRange: [2, 4], salesRange: [2000, 15000] },
  { name: 'Samsung Galaxy S24 Ultra 512GB Malaysia Warranty', category: 'Electronics', categoryId: 1, priceRange: [2599, 4499], commissionRange: [1.5, 3], salesRange: [500, 5000] },
  { name: 'Wireless Earbuds TWS Bluetooth 5.3 Earphone', category: 'Electronics', categoryId: 1, priceRange: [15.90, 89.90], commissionRange: [4, 8], salesRange: [5000, 50000] },
  { name: 'USB-C Hub 7-in-1 Multiport Adapter HDMI PD', category: 'Electronics', categoryId: 1, priceRange: [29.90, 79.90], commissionRange: [3, 6], salesRange: [1000, 8000] },
  { name: 'Mechanical Keyboard RGB Gaming 75% Hot-Swap', category: 'Electronics', categoryId: 1, priceRange: [59.90, 299.00], commissionRange: [3, 5], salesRange: [800, 6000] },
  { name: 'Powerbank 20000mAh Fast Charging PD 65W', category: 'Electronics', categoryId: 1, priceRange: [39.90, 129.00], commissionRange: [3, 6], salesRange: [3000, 20000] },
  { name: 'Smartwatch Fitness Tracker Heart Rate SpO2', category: 'Electronics', categoryId: 1, priceRange: [49.90, 259.00], commissionRange: [4, 7], salesRange: [2000, 15000] },
  { name: 'Webcam 1080P HD Microphone Auto Focus Stream', category: 'Electronics', categoryId: 1, priceRange: [35.00, 149.00], commissionRange: [3, 6], salesRange: [500, 4000] },
  { name: 'iPhone 15 Pro Max 256GB Original Malaysia Set', category: 'Electronics', categoryId: 1, priceRange: [4299, 5299], commissionRange: [1, 2], salesRange: [200, 2000] },
  { name: 'Tablet Android 10 Inch 4GB RAM 64GB Kids Mode', category: 'Electronics', categoryId: 1, priceRange: [199.00, 599.00], commissionRange: [3, 5], salesRange: [1000, 8000] },

  // Fashion
  { name: 'Baju Kurung Moden Ready Stock - premium quality', category: 'Fashion', categoryId: 2, priceRange: [39.90, 159.00], commissionRange: [5, 8], salesRange: [3000, 25000] },
  { name: 'Kasut Wanita Heels Office Lady Formal shoes', category: 'Fashion', categoryId: 2, priceRange: [29.90, 129.00], commissionRange: [5, 7], salesRange: [1000, 8000] },
  { name: 'Telekung Solat Cotton Premium - Rose Gold', category: 'Fashion', categoryId: 2, priceRange: [35.00, 99.00], commissionRange: [5, 9], salesRange: [2000, 12000] },
  { name: 'Tudung Bawal Premium Cotton Matte 50x50', category: 'Fashion', categoryId: 2, priceRange: [15.90, 49.90], commissionRange: [6, 10], salesRange: [5000, 40000] },
  { name: 'Kemeja Lelaki Slim Fit Formal Office Shirt', category: 'Fashion', categoryId: 2, priceRange: [29.90, 89.90], commissionRange: [5, 8], salesRange: [2000, 15000] },
  { name: 'Jubah Muslimah Gaun Modern Elegant - free size', category: 'Fashion', categoryId: 2, priceRange: [49.90, 129.00], commissionRange: [5, 8], salesRange: [1500, 10000] },
  { name: 'Seluar Jeans Wanita High Waist Skinny Stretch', category: 'Fashion', categoryId: 2, priceRange: [35.00, 89.00], commissionRange: [5, 7], salesRange: [2000, 12000] },
  { name: 'Hoodie Unisex Oversized Streetwear Cotton Combed', category: 'Fashion', categoryId: 2, priceRange: [39.90, 99.00], commissionRange: [5, 8], salesRange: [3000, 20000] },
  { name: 'Kasut Lelaki Sports Running Breathable Mesh', category: 'Fashion', categoryId: 2, priceRange: [49.90, 169.00], commissionRange: [4, 7], salesRange: [1000, 8000] },
  { name: 'Bajutidur Wanita Cotton Set Sulam Premium', category: 'Fashion', categoryId: 2, priceRange: [25.90, 69.90], commissionRange: [6, 9], salesRange: [3000, 18000] },

  // Home & Living
  { name: 'Set Cadar Katil 5in1 Microfiber King Queen Single', category: 'Home & Living', categoryId: 3, priceRange: [29.90, 89.90], commissionRange: [4, 7], salesRange: [5000, 30000] },
  { name: 'Rak Buku 5 Tier Storage Organizer Skruless', category: 'Home & Living', categoryId: 3, priceRange: [25.00, 59.90], commissionRange: [4, 6], salesRange: [2000, 12000] },
  { name: 'Pembasuh Kipas Ultrasonic Humidifier LED 300ml', category: 'Home & Living', categoryId: 3, priceRange: [19.90, 49.90], commissionRange: [5, 8], salesRange: [3000, 18000] },
  { name: 'Tikar Sembahjad Velvet Premium 80x120cm', category: 'Home & Living', categoryId: 3, priceRange: [35.00, 99.00], commissionRange: [5, 8], salesRange: [2000, 10000] },
  { name: 'Vacuum Cleaner Wireless Rechargeable 6000Pa', category: 'Home & Living', categoryId: 3, priceRange: [59.00, 199.00], commissionRange: [3, 6], salesRange: [1000, 6000] },
  { name: 'Lampu Meja LED Study Eye-Caring Touch Dimmer', category: 'Home & Living', categoryId: 3, priceRange: [19.90, 69.90], commissionRange: [5, 8], salesRange: [2000, 10000] },
  { name: 'Kasur Lipat Folding Mattress 4inch Queen Single', category: 'Home & Living', categoryId: 3, priceRange: [79.00, 199.00], commissionRange: [3, 5], salesRange: [1000, 5000] },

  // Beauty & Health
  { name: 'Serum Vitamin C 20% Anti-Aging Brightening 30ml', category: 'Beauty & Health', categoryId: 4, priceRange: [19.90, 69.90], commissionRange: [6, 10], salesRange: [5000, 30000] },
  { name: 'Sunscreen SPF50+ PA++++ Tone Up Cream 50ml', category: 'Beauty & Health', categoryId: 4, priceRange: [15.90, 49.90], commissionRange: [7, 12], salesRange: [8000, 50000] },
  { name: 'Sheet Mask Korea 10pcs Hydrating Collagen Aloe', category: 'Beauty & Health', categoryId: 4, priceRange: [9.90, 29.90], commissionRange: [8, 12], salesRange: [10000, 60000] },
  { name: 'Lip Tint Velvet Matte Long Lasting Korean', category: 'Beauty & Health', categoryId: 4, priceRange: [8.90, 35.00], commissionRange: [8, 12], salesRange: [8000, 40000] },
  { name: 'Hair Treatment Argan Oil Keratin 200ml Repair', category: 'Beauty & Health', categoryId: 4, priceRange: [19.90, 59.90], commissionRange: [6, 10], salesRange: [3000, 15000] },
  { name: 'Body Lotion Whitening Moisturizing 400ml', category: 'Beauty & Health', categoryId: 4, priceRange: [12.90, 39.90], commissionRange: [6, 9], salesRange: [5000, 25000] },
  { name: 'Cleanser Foam Acne Gentle Daily 150ml', category: 'Beauty & Health', categoryId: 4, priceRange: [9.90, 35.00], commissionRange: [7, 11], salesRange: [6000, 35000] },
  { name: 'Perfume Original 50ml Long Lasting Unisex', category: 'Beauty & Health', categoryId: 4, priceRange: [29.90, 129.00], commissionRange: [5, 8], salesRange: [2000, 10000] },

  // Sports & Outdoors
  { name: 'Tikar Yoga Premium 6mm Anti-Slip TPE Non-Toxic', category: 'Sports & Outdoors', categoryId: 5, priceRange: [19.90, 69.90], commissionRange: [4, 7], salesRange: [3000, 15000] },
  { name: 'Dumbbell Set 20kg Adjustable Home Gym Rubber', category: 'Sports & Outdoors', categoryId: 5, priceRange: [59.00, 189.00], commissionRange: [3, 5], salesRange: [1000, 5000] },
  { name: 'Resistance Band Set 5pcs Latex Loop Exercise', category: 'Sports & Outdoors', categoryId: 5, priceRange: [9.90, 29.90], commissionRange: [5, 8], salesRange: [5000, 25000] },
  { name: 'Besi Angkat Adjustable Dumbbell 24kg Quick Change', category: 'Sports & Outdoors', categoryId: 5, priceRange: [199.00, 499.00], commissionRange: [2, 4], salesRange: [500, 3000] },
  { name: 'Trekking Pole Carbon Fiber Ultralight Pair', category: 'Sports & Outdoors', categoryId: 5, priceRange: [35.00, 129.00], commissionRange: [4, 6], salesRange: [800, 4000] },
  { name: 'Shaker Bottle 700ml Protein Gym Leak-Proof BPA Free', category: 'Sports & Outdoors', categoryId: 5, priceRange: [9.90, 29.90], commissionRange: [5, 8], salesRange: [5000, 25000] },

  // Food & Beverages
  { name: 'Kopi Susu Tambun 3in1 30 sachets - Best Seller', category: 'Food & Beverages', categoryId: 6, priceRange: [12.90, 29.90], commissionRange: [3, 5], salesRange: [10000, 80000] },
  { name: 'Keropok Lekor Terengganu 500g Frozen Ready Fried', category: 'Food & Beverages', categoryId: 6, priceRange: [15.00, 35.00], commissionRange: [3, 6], salesRange: [3000, 15000] },
  { name: 'Sambal Ikan Bilis Mama Recipe 250g Ready to Eat', category: 'Food & Beverages', categoryId: 6, priceRange: [9.90, 19.90], commissionRange: [4, 7], salesRange: [5000, 30000] },
  { name: 'Teh O Ais Limau 30 sachets Instant Drink', category: 'Food & Beverages', categoryId: 6, priceRange: [8.90, 19.90], commissionRange: [3, 5], salesRange: [8000, 50000] },
  { name: 'Kuih Raya Premium Mixed 4in1 Tin 800g Festive', category: 'Food & Beverages', categoryId: 6, priceRange: [25.00, 59.90], commissionRange: [4, 7], salesRange: [2000, 12000] },
  { name: 'Madu Asli Pure Honey 500g Royal Jelly Original', category: 'Food & Beverages', categoryId: 6, priceRange: [29.90, 89.90], commissionRange: [3, 5], salesRange: [2000, 10000] },

  // Toys & Games
  { name: 'LEGO Compatible Building Blocks 1000pcs Creative', category: 'Toys & Games', categoryId: 7, priceRange: [25.00, 79.90], commissionRange: [4, 7], salesRange: [2000, 12000] },
  { name: 'Board Game Monopoly Malaysia Edition Family Fun', category: 'Toys & Games', categoryId: 7, priceRange: [29.90, 69.90], commissionRange: [4, 6], salesRange: [1000, 6000] },
  { name: 'Action Figure Anime Collectible 15cm PVC Gift', category: 'Toys & Games', categoryId: 7, priceRange: [15.90, 59.90], commissionRange: [5, 8], salesRange: [1500, 8000] },
  { name: 'Puzzle 1000pcs Scenery Adult Jigsaw Educational', category: 'Toys & Games', categoryId: 7, priceRange: [12.90, 39.90], commissionRange: [5, 7], salesRange: [2000, 10000] },
  { name: 'RC Car Remote Control 2.4GHz Drift High Speed 1:16', category: 'Toys & Games', categoryId: 7, priceRange: [49.90, 159.00], commissionRange: [4, 6], salesRange: [800, 4000] },

  // Automotive
  { name: 'Dashcam 4K WiFi Front Rear Dual Camera Car', category: 'Automotive', categoryId: 8, priceRange: [89.00, 299.00], commissionRange: [3, 5], salesRange: [1000, 5000] },
  { name: 'Car Phone Holder Magnetic Dashboard Mount 360°', category: 'Automotive', categoryId: 8, priceRange: [9.90, 29.90], commissionRange: [5, 8], salesRange: [8000, 40000] },
  { name: 'Tire Inflator Portable Air Compressor 12V Digital', category: 'Automotive', categoryId: 8, priceRange: [35.00, 99.00], commissionRange: [3, 6], salesRange: [2000, 8000] },
  { name: 'Car Seat Cover Leather Universal Full Set Premium', category: 'Automotive', categoryId: 8, priceRange: [59.00, 199.00], commissionRange: [4, 6], salesRange: [1000, 5000] },
  { name: 'Car Charger USB-C PD 65W Fast Charging Dual Port', category: 'Automotive', categoryId: 8, priceRange: [12.90, 39.90], commissionRange: [5, 8], salesRange: [5000, 25000] },
  { name: 'Car Vacuum Cleaner Wireless 6000Pa Handheld', category: 'Automotive', categoryId: 8, priceRange: [29.90, 89.90], commissionRange: [4, 7], salesRange: [2000, 10000] },
]

// ─── Helpers ────────────────────────────────────────────────────

/** Generate a random number in range [min, max] */
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

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

/** Generate a random Shopee item ID */
function randomItemId(): number {
  return randInt(10000000, 99999999)
}

/** Generate a random order SN */
function randomOrderSn(): string {
  const prefix = pick(['MY', 'SH', 'SP'])
  const digits = randInt(100000000000, 999999999999)
  return `${prefix}${digits}`
}

/** Generate a random short link code */
function randomShortCode(): string {
  return Math.random().toString(36).substring(2, 8)
}

/** Generate a seeded random number (deterministic for a given seed) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

/** Format a date as YYYY-MM-DD */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ─── Mock Service ───────────────────────────────────────────────

export class ShopeeMockService {
  private products: ShopeeProduct[]

  constructor() {
    this.products = this.generateProducts()
  }

  /**
   * Generate all mock products from templates
   */
  private generateProducts(): ShopeeProduct[] {
    const products: ShopeeProduct[] = []

    for (let i = 0; i < PRODUCT_TEMPLATES.length; i++) {
      const tmpl = PRODUCT_TEMPLATES[i]
      const shopName = SHOP_NAMES[i % SHOP_NAMES.length]
      const itemId = randomItemId()
      const price = round2(rand(tmpl.priceRange[0], tmpl.priceRange[1]))
      const originalPrice = Math.random() > 0.3 ? round2(price * rand(1.1, 1.8)) : undefined
      const commissionRate = round2(rand(tmpl.commissionRange[0], tmpl.commissionRange[1]))
      const sales = randInt(tmpl.salesRange[0], tmpl.salesRange[1])
      const ratingStar = round2(rand(3.8, 5.0))

      products.push({
        itemId,
        name: tmpl.name,
        image: `https://cf.shopee.com.my/file/sg-${itemId.toString(16)}`,
        price,
        originalPrice,
        commissionRate,
        commissionMin: round2(price * commissionRate / 100 * 0.5),
        commissionMax: round2(price * commissionRate / 100 * 2),
        sales,
        ratingStar,
        shopName,
        shopId: randInt(100000, 999999),
        category: tmpl.category,
        categoryId: tmpl.categoryId,
        productLink: `https://shopee.com.my/product/${shopName.replace(/\s/g, '-').toLowerCase()}-${itemId}`,
      })
    }

    return products
  }

  /**
   * Search products by keyword with filtering and sorting
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
  ): Promise<{ products: ShopeeProduct[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const sortField = options?.sortField || 'sales'
    const sortOrder = options?.sortOrder || 'desc'

    // Filter by keyword (case-insensitive match on name and category)
    const queryLower = query.toLowerCase()
    let filtered = this.products.filter(
      (p) =>
        p.name.toLowerCase().includes(queryLower) ||
        p.category.toLowerCase().includes(queryLower) ||
        p.shopName.toLowerCase().includes(queryLower)
    )

    // If no keyword matches, return a mix of random products with the query appended
    if (filtered.length === 0) {
      const keywords = queryLower.split(/\s+/).filter(Boolean)
      filtered = this.products.filter(
        (p) => keywords.some((kw) => p.name.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw))
      )

      // If still no matches, return a curated subset with modified names
      if (filtered.length === 0) {
        const shuffled = [...this.products].sort(() => Math.random() - 0.5)
        filtered = shuffled.slice(0, Math.min(limit, shuffled.length)).map((p) => ({
          ...p,
          name: `${query} - ${p.name}`,
          itemId: randomItemId(),
        }))
      }
    }

    // Filter by category
    if (options?.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === options.categoryId)
    }

    // Filter by price range
    if (options?.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= (options.minPrice ?? 0))
    }
    if (options?.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= (options.maxPrice ?? Infinity))
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number, bVal: number
      switch (sortField) {
        case 'commission':
          aVal = a.commissionRate
          bVal = b.commissionRate
          break
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        case 'sales':
          aVal = a.sales
          bVal = b.sales
          break
        case 'rating':
          aVal = a.ratingStar
          bVal = b.ratingStar
          break
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

  /**
   * Get product detail by item ID
   */
  async getProductDetail(itemId: number): Promise<ShopeeProduct | null> {
    const product = this.products.find((p) => p.itemId === itemId)
    if (product) return { ...product }
    // Return a generated product for unknown IDs
    const tmpl = pick(PRODUCT_TEMPLATES)
    const price = round2(rand(tmpl.priceRange[0], tmpl.priceRange[1]))
    const commissionRate = round2(rand(tmpl.commissionRange[0], tmpl.commissionRange[1]))
    return {
      itemId,
      name: tmpl.name,
      image: `https://cf.shopee.com.my/file/sg-${itemId.toString(16)}`,
      price,
      originalPrice: round2(price * rand(1.1, 1.5)),
      commissionRate,
      commissionMin: round2(price * commissionRate / 100 * 0.5),
      commissionMax: round2(price * commissionRate / 100 * 2),
      sales: randInt(tmpl.salesRange[0], tmpl.salesRange[1]),
      ratingStar: round2(rand(3.8, 5.0)),
      shopName: pick(SHOP_NAMES),
      shopId: randInt(100000, 999999),
      category: tmpl.category,
      categoryId: tmpl.categoryId,
      productLink: `https://shopee.com.my/product/-${itemId}`,
      deepLink: `shopee://product/${itemId}`,
    }
  }

  /**
   * Generate a mock affiliate link
   */
  async generateAffiliateLink(params: {
    itemId?: number
    productUrl?: string
    subId?: string
    deepLinkType?: 'default' | 'app_only'
  }): Promise<ShopeeAffiliateLink> {
    const shortCode = randomShortCode()
    const itemId = params.itemId || randomItemId()
    const subId = params.subId || ''

    return {
      shortUrl: `https://shp.ee/${shortCode}`,
      longUrl: `https://shopee.com.my/affiliate/${shortCode}?item_id=${itemId}&sub_id=${subId}`,
      deepLink: `shopee://product/${itemId}?af_id=${shortCode}&af_sub=${subId}`,
      generateUrl: `https://shopee.com.my/universal-link/${shortCode}`,
    }
  }

  /**
   * Get mock commission orders
   */
  async getCommissionOrders(params?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: 'pending' | 'confirmed' | 'rejected' | 'paid'
  }): Promise<{ orders: ShopeeCommissionOrder[]; total: number }> {
    const page = params?.page || 1
    const limit = params?.limit || 50
    const statuses: Array<'pending' | 'confirmed' | 'rejected' | 'paid'> = ['pending', 'confirmed', 'rejected', 'paid']
    const orderStatuses = ['COMPLETED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED']

    // Generate deterministic but varied orders
    const orderCount = randInt(30, 150)
    const orders: ShopeeCommissionOrder[] = []

    for (let i = 0; i < orderCount; i++) {
      const seed = i + (params?.startTime || 0)
      const tmpl = PRODUCT_TEMPLATES[seed % PRODUCT_TEMPLATES.length]
      const price = round2(rand(tmpl.priceRange[0], tmpl.priceRange[1]))
      const commissionRate = round2(rand(tmpl.commissionRange[0], tmpl.commissionRange[1]))
      const commission = round2(price * commissionRate / 100)
      const status = statuses[Math.floor(seededRandom(seed * 7) * statuses.length)]
      const daysAgo = Math.floor(seededRandom(seed * 13) * 60)
      const orderTime = Math.floor(Date.now() / 1000) - daysAgo * 86400
      const clickTime = orderTime - randInt(300, 86400)

      // Filter by status if specified
      if (params?.commissionStatus && status !== params.commissionStatus) continue

      // Filter by time range
      if (params?.startTime && orderTime < params.startTime) continue
      if (params?.endTime && orderTime > params.endTime) continue

      orders.push({
        orderSn: randomOrderSn(),
        orderCreateTime: orderTime,
        itemId: randomItemId(),
        itemName: tmpl.name,
        itemPrice: price,
        commissionRate,
        commission,
        commissionStatus: status,
        orderStatus: pick(orderStatuses),
        settleTime: status === 'paid' ? orderTime + randInt(86400, 86400 * 30) : undefined,
        clickTime,
        subId: Math.random() > 0.6 ? `sub_${randInt(100, 999)}` : undefined,
      })
    }

    const total = orders.length
    const start = (page - 1) * limit
    const paged = orders.slice(start, start + limit)

    return { orders: paged, total }
  }

  /**
   * Get mock commission summary
   */
  async getCommissionSummary(_params?: {
    startTime?: number
    endTime?: number
  }): Promise<ShopeeCommissionSummary> {
    return {
      totalCommission: round2(rand(2000, 8000)),
      pendingCommission: round2(rand(300, 1500)),
      confirmedCommission: round2(rand(1000, 4000)),
      rejectedCommission: round2(rand(50, 400)),
      paidCommission: round2(rand(500, 3000)),
      totalOrders: randInt(200, 1500),
      conversionRate: round2(rand(4, 12)),
    }
  }

  /**
   * Get mock click statistics with daily data
   */
  async getClickStats(params: {
    startTime: number
    endTime: number
    granularity?: 'hour' | 'day' | 'week' | 'month'
  }): Promise<ShopeeClickStats[]> {
    const granularity = params.granularity || 'day'
    const startTime = params.startTime * 1000 // Convert to ms
    const endTime = params.endTime * 1000

    const stats: ShopeeClickStats[] = []

    if (granularity === 'hour') {
      // Generate hourly stats for a day
      const startDate = new Date(startTime)
      for (let h = 0; h < 24; h++) {
        const date = new Date(startDate)
        date.setHours(h, 0, 0, 0)
        const seed = date.getTime() / 1000
        stats.push({
          date: `${formatDate(date)} ${String(h).padStart(2, '0')}:00`,
          clicks: Math.floor(seededRandom(seed) * 200 + 20),
          uniqueClicks: Math.floor(seededRandom(seed + 1) * 150 + 15),
          conversions: Math.floor(seededRandom(seed + 2) * 15 + 1),
          earnings: round2(seededRandom(seed + 3) * 80 + 5),
        })
      }
    } else {
      // Generate daily stats
      const start = new Date(startTime)
      const end = new Date(endTime)
      const current = new Date(start)

      while (current <= end) {
        const seed = current.getTime() / 86400000
        const dayOfWeek = current.getDay()
        // Weekends get more traffic
        const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.5 : 1.0

        stats.push({
          date: formatDate(current),
          clicks: Math.floor((seededRandom(seed) * 400 + 80) * weekendMultiplier),
          uniqueClicks: Math.floor((seededRandom(seed + 1) * 280 + 60) * weekendMultiplier),
          conversions: Math.floor((seededRandom(seed + 2) * 25 + 3) * weekendMultiplier),
          earnings: round2((seededRandom(seed + 3) * 180 + 30) * weekendMultiplier),
        })

        if (granularity === 'week') {
          current.setDate(current.getDate() + 7)
        } else if (granularity === 'month') {
          current.setMonth(current.getMonth() + 1)
        } else {
          current.setDate(current.getDate() + 1)
        }
      }
    }

    return stats
  }

  /**
   * Test mock connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; region: string }> {
    return {
      success: true,
      message: 'Connected to mock data service (Shopee API not configured)',
      region: 'MY',
    }
  }

  /**
   * Get mock affiliate profile
   */
  async getAffiliateProfile(): Promise<ShopeeAffiliateProfile> {
    return {
      affiliateId: 'MY-AFF-20240001',
      name: 'TheViralFinds MY',
      email: 'affiliate@theviralfinds.my',
      status: 'active',
      commissionRate: 5.5,
      totalEarnings: round2(rand(5000, 15000)),
      joinDate: '2024-01-15',
      region: 'MY',
    }
  }

  /**
   * Get top products by commission/earnings
   */
  async getTopProducts(limit?: number): Promise<ShopeeProduct[]> {
    const sorted = [...this.products].sort(
      (a, b) => (b.price * b.commissionRate * b.sales) - (a.price * a.commissionRate * a.sales)
    )
    return sorted.slice(0, limit || 10)
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<ShopeeCategory[]> {
    return CATEGORIES
  }
}
