/**
 * TikTok Shop Affiliate API - Mock Data Service
 *
 * Simulates realistic TikTok Shop data for Malaysia (MY) market.
 * Uses Malaysian Ringgit (RM) pricing, Manglish / Bahasa mixed product names,
 * and authentic Malaysian TikTok shop names.
 *
 * This service mirrors the same method signatures as the real API client
 * (`api-client.ts`), so they can be used interchangeably by the
 * `affiliate-service.ts` orchestrator.
 *
 * TikTok Shop Affiliate Program (MY):
 *   - https://shop.tiktok.com/university/embed?from=affiliate
 *   - Commission rates typically 5% – 20% for MY sellers
 *   - 7-day cookie window, paid out 30-60 days after order confirmation
 */

// ─── Types (mirrored from affiliate-service.ts) ─────────────────

export type TikTokProductCategory =
  | 'Beauty'
  | 'Fashion'
  | 'Electronics'
  | 'Home'
  | 'Food'
  | 'Health'
  | 'Kids'
  | 'Sports'
  | 'Automotive'

export type TikTokCommissionStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'paid'
  | 'rejected'
  | 'refunded'

export interface TikTokProduct {
  id: string
  productId: string
  title: string
  description: string
  price: number
  originalPrice?: number
  currency: 'MYR'
  commissionRate: number
  commissionAmount: number
  imageUrl: string
  videoUrl?: string
  shopName: string
  shopId: string
  category: TikTokProductCategory
  sales: number
  rating: number
  reviewCount: number
  stock: number
  productLink: string
  deepLink?: string
  platform: 'tiktok'
  hashtags: string[]
  trendScore: number
}

export interface TikTokAffiliateLink {
  shortUrl: string
  longUrl: string
  deepLink: string
  generateUrl: string
  trackingId: string
  expiresAt?: string
}

export interface TikTokCommissionOrder {
  orderId: string
  orderCreateTime: number
  productId: string
  productTitle: string
  productImage: string
  quantity: number
  unitPrice: number
  orderAmount: number
  commissionRate: number
  commissionAmount: number
  commissionStatus: TikTokCommissionStatus
  orderStatus: string
  settleTime?: number
  clickTime: number
  customerRegion: string
  subId?: string
}

export interface TikTokCommissionSummary {
  totalCommission: number
  pendingCommission: number
  confirmedCommission: number
  paidCommission: number
  rejectedCommission: number
  totalOrders: number
  conversionRate: number
  clickCount: number
}

export interface TikTokAffiliateProfile {
  affiliateId: string
  name: string
  email: string
  status: string
  commissionRate: number
  totalEarnings: number
  joinDate: string
  region: string
  followerCount: number
  shopConnected: boolean
}

export interface TikTokCategory {
  categoryId: string
  name: TikTokProductCategory
  productCount: number
  avgCommissionRate: number
}

// ─── Seed Data ──────────────────────────────────────────────────

export const TIKTOK_CATEGORIES: TikTokCategory[] = [
  { categoryId: 'beauty', name: 'Beauty', productCount: 18420, avgCommissionRate: 12.0 },
  { categoryId: 'fashion', name: 'Fashion', productCount: 26350, avgCommissionRate: 8.5 },
  { categoryId: 'electronics', name: 'Electronics', productCount: 12700, avgCommissionRate: 6.0 },
  { categoryId: 'home', name: 'Home', productCount: 15800, avgCommissionRate: 5.5 },
  { categoryId: 'food', name: 'Food', productCount: 9300, avgCommissionRate: 14.0 },
  { categoryId: 'health', name: 'Health', productCount: 6200, avgCommissionRate: 10.0 },
  { categoryId: 'kids', name: 'Kids', productCount: 7400, avgCommissionRate: 7.5 },
  { categoryId: 'sports', name: 'Sports', productCount: 5100, avgCommissionRate: 6.5 },
  { categoryId: 'automotive', name: 'Automotive', productCount: 3200, avgCommissionRate: 5.0 },
]

const TIKTOK_SHOP_NAMES = [
  'beautyholic.my',
  'K-Beauty Malaysia',
  'SkincareHQ Official',
  'Cosmetic World MY',
  'GlowUp Beauty Store',
  'FashionViral.My',
  'Tudung Raya Official',
  'BajuKurung Premium',
  'Trendy Style MY',
  'Kasut Cantik Official',
  'Hoodie Hub Malaysia',
  'Streetwear My',
  'GadgetZone Malaysia',
  'XiaomiHub.My',
  'Samsung Official MY',
  'TechPulse Store',
  'Earbuds Pro MY',
  'SmartHome MY',
  'HomeDecor KL',
  'KitchenPro Malaysia',
  'Dapur Nadia Store',
  'Cleaning Hacks MY',
  'SnackHub Malaysia',
  'Kedai Makanan My',
  'Maggi Lovers My',
  'Kopie Selatan',
  'SupplementHub MY',
  'Vitamin Pro Store',
  'Wellness Malaysia',
  'AnakKidz Store',
  'ToyRaya Official',
  'Outdoor Malaysia',
  'Gym Bros Store',
  'AutoParts Malaysia',
  'Kereta Gaya Store',
]

const HASHTAG_POOL: Record<TikTokProductCategory, string[]> = {
  Beauty: ['#tiktokbeauty', '#skincareroutine', '#glowup', '#kbeauty', '#malaysiabeauty', '#makeuptutorial'],
  Fashion: ['#ootd', '#tudungstyle', '#bajukurung', '#fashiontiktok', '#malaysianfashion', '#streetwear'],
  Electronics: ['#techfinds', '#gadgetreview', '#xiaomi', '#techmalaysia', '#earbuds', '#smartphone'],
  Home: ['#homefinds', '#dapurcantik', '#homehacks', '#cleantok', '#malaysiahome', '#kitchenmusthave'],
  Food: ['#foodtiktok', '#malaysianfood', '#snackhaul', '#maggi', '#kakibang', '#mukbang'],
  Health: ['#healthtok', '#supplement', '#vitamin', '#wellness', '#malaysiahealth', '#fitnessjourney'],
  Kids: ['#kidstuff', '#babymusthave', '#momsoftiktok', '#malaysiakids', '#toys', '#playtime'],
  Sports: ['#fitnesstok', '#gymessentials', '#yogalife', '#malaysiafitness', '#workout', '#sportsmalaysia'],
  Automotive: ['#cargadgets', '#automalaysia', '#carmods', '#kereta', '#dashcam', '#carcare'],
}

// ─── Product Templates — 45 realistic Malaysian TikTok Shop products ─────────

interface ProductTemplate {
  title: string
  description: string
  category: TikTokProductCategory
  price: number
  originalPrice?: number
  commissionRate: number
  sales: number
  rating: number
  reviewCount: number
  stock: number
  trendScore: number
}

const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // ───── Beauty (10) ─────
  {
    title: 'Garnier Bright Complete Vitamin C Serum 30ml',
    description: 'Brighten kulit dalam 7 hari! Vitamin C + Niacinamide untuk tone lebih cerah. Sesuai untuk semua jenis kulit.',
    category: 'Beauty',
    price: 32.90,
    originalPrice: 49.90,
    commissionRate: 12,
    sales: 24500,
    rating: 4.8,
    reviewCount: 18200,
    stock: 850,
    trendScore: 96,
  },
  {
    title: 'Cetaphil Gentle Skin Cleanser 250ml',
    description: 'Pembersih wajah lembut untuk kulit sensitif. Dermatologist recommended. Tak keringkan kulit!',
    category: 'Beauty',
    price: 42.90,
    originalPrice: 59.90,
    commissionRate: 10,
    sales: 18200,
    rating: 4.9,
    reviewCount: 15600,
    stock: 420,
    trendScore: 92,
  },
  {
    title: 'LANEIGE Lip Sleeping Mask Berry 20g',
    description: 'Rawatan bibir semalaman. Bibir kering jadi lembut dan gebu. K-beauty bestseller!',
    category: 'Beauty',
    price: 68.00,
    originalPrice: 85.00,
    commissionRate: 15,
    sales: 32100,
    rating: 4.9,
    reviewCount: 27400,
    stock: 230,
    trendScore: 98,
  },
  {
    title: 'Some By Mi AHA BHA PHA 30 Days Miracle Toner 150ml',
    description: 'Toner untuk kulit berjerawat. AHA + BHA + PHA eksfoliasi lembut. Jerawat kurang dalam 30 hari!',
    category: 'Beauty',
    price: 49.90,
    originalPrice: 79.90,
    commissionRate: 14,
    sales: 21800,
    rating: 4.7,
    reviewCount: 14200,
    stock: 580,
    trendScore: 94,
  },
  {
    title: 'Anessa Perfect UV Sunscreen Skincare Milk SPF50+ 60ml',
    description: 'Sunscreen nombor 1 Jepun. Tahan peluh, tahan air, tak melekit. Wajib ada untuk cuaca Malaysia!',
    category: 'Beauty',
    price: 89.90,
    originalPrice: 119.90,
    commissionRate: 11,
    sales: 14600,
    rating: 4.8,
    reviewCount: 9800,
    stock: 320,
    trendScore: 90,
  },
  {
    title: 'Maybelline Fit Me Matte + Poreless Foundation 30ml',
    description: 'Foundation matte untuk kulit berminyak. Coverage sederhana, tak cet pori. Shade untuk kulit Malaysia!',
    category: 'Beauty',
    price: 29.90,
    originalPrice: 39.90,
    commissionRate: 13,
    sales: 28900,
    rating: 4.6,
    reviewCount: 22100,
    stock: 940,
    trendScore: 88,
  },
  {
    title: 'Innisfree Green Tea Seed Serum 80ml',
    description: 'Serum hydrating dengan ekstrak teh hijau Jeju. Kulit lembap dan cerah sepanjang hari.',
    category: 'Beauty',
    price: 99.00,
    originalPrice: 139.00,
    commissionRate: 12,
    sales: 12300,
    rating: 4.8,
    reviewCount: 8900,
    stock: 410,
    trendScore: 87,
  },
  {
    title: 'La Roche-Posay Effaclar Duo+M 40ml',
    description: 'Rawatan jerawat dan parut. Niacinamide + Procerad. Klinikal terbukti kurangkan jerawat dalam 8 minggu.',
    category: 'Beauty',
    price: 79.90,
    originalPrice: 99.90,
    commissionRate: 10,
    sales: 16700,
    rating: 4.7,
    reviewCount: 11200,
    stock: 280,
    trendScore: 89,
  },
  {
    title: 'Romand Juicy Lasting Tint 5.5g',
    description: 'Lip tint K-beauty viral di TikTok! Tekstur juicy, tahan lama. Shade trending: Almond Rose, Figfig.',
    category: 'Beauty',
    price: 45.90,
    originalPrice: 59.90,
    commissionRate: 16,
    sales: 41200,
    rating: 4.9,
    reviewCount: 35600,
    stock: 670,
    trendScore: 99,
  },
  {
    title: 'COSRX Advanced Snail 96 Mucin Power Essence 100ml',
    description: 'Essence siput K-beauty! Hydrating, repair skin barrier. Bestseller TikTok global.',
    category: 'Beauty',
    price: 69.00,
    originalPrice: 89.00,
    commissionRate: 13,
    sales: 38400,
    rating: 4.9,
    reviewCount: 31200,
    stock: 510,
    trendScore: 97,
  },

  // ───── Fashion (8) ─────
  {
    title: 'Uniqlo Airism Mask 3pcs',
    description: 'Topeng muka Airism selesa, breathable. 3 lapisan filter. Color: Black, White, Navy.',
    category: 'Fashion',
    price: 49.90,
    originalPrice: 59.90,
    commissionRate: 8,
    sales: 9800,
    rating: 4.7,
    reviewCount: 6300,
    stock: 1240,
    trendScore: 82,
  },
  {
    title: 'Tudung Bawal Premium Cotton Matte 50x50',
    description: 'Tudung bawal premium, lembut, tak nipis. 40+ warna available. Free shipping seluruh Malaysia!',
    category: 'Fashion',
    price: 29.90,
    originalPrice: 49.90,
    commissionRate: 12,
    sales: 52400,
    rating: 4.9,
    reviewCount: 48100,
    stock: 3200,
    trendScore: 95,
  },
  {
    title: 'Telekung Solat Cotton Premium - Rose Gold',
    description: 'Telekung solat cotton premium, sejuk dan selesa. Set tudung + baju + sarung tangan. Ready stock!',
    category: 'Fashion',
    price: 65.00,
    originalPrice: 99.00,
    commissionRate: 11,
    sales: 18900,
    rating: 4.8,
    reviewCount: 14200,
    stock: 680,
    trendScore: 90,
  },
  {
    title: 'Baju Kurung Moden Ready Stock Premium Quality',
    description: 'Baju kurung moden, embroidery cantik. Sesuai untuk raya, kenduri, office. Free size sampai XL.',
    category: 'Fashion',
    price: 89.00,
    originalPrice: 159.00,
    commissionRate: 9,
    sales: 14200,
    rating: 4.7,
    reviewCount: 9800,
    stock: 480,
    trendScore: 86,
  },
  {
    title: 'Hoodie Unisex Oversized Streetwear Cotton Combed',
    description: 'Hoodie oversized trending TikTok! Cotton combed 30s, sejuk dan tebal. Unisex, 7 warna available.',
    category: 'Fashion',
    price: 49.00,
    originalPrice: 89.00,
    commissionRate: 10,
    sales: 32800,
    rating: 4.6,
    reviewCount: 25600,
    stock: 1850,
    trendScore: 93,
  },
  {
    title: 'Kasut Wanita White Sneakers Platform Trending',
    description: 'White sneakers platform viral di TikTok! Sesuai dengan apa sahaja outfit. Sole anti-slip.',
    category: 'Fashion',
    price: 79.00,
    originalPrice: 129.00,
    commissionRate: 9,
    sales: 21600,
    rating: 4.5,
    reviewCount: 16800,
    stock: 720,
    trendScore: 91,
  },
  {
    title: 'Seluar Jeans Wanita High Waist Skinny Stretch',
    description: 'Jeans high waist, push up, mengikat perut. Stretch material, selesa untuk daily wear. Size S-XL.',
    category: 'Fashion',
    price: 59.00,
    originalPrice: 99.00,
    commissionRate: 10,
    sales: 18900,
    rating: 4.6,
    reviewCount: 13400,
    stock: 940,
    trendScore: 84,
  },
  {
    title: 'T-Shirt Polos Oversized Premium Cotton 30s',
    description: 'T-shirt oversized polos, cotton combed 30s. Drop shoulder, sesuai streetwear. 12 warna!',
    category: 'Fashion',
    price: 25.90,
    originalPrice: 45.90,
    commissionRate: 12,
    sales: 41200,
    rating: 4.7,
    reviewCount: 28900,
    stock: 2500,
    trendScore: 94,
  },

  // ───── Electronics (8) ─────
  {
    title: 'Xiaomi Redmi Buds 4 Active',
    description: 'Earbuds Xiaomi Redmi Buds 4 Active. Bluetooth 5.3, 30 jam playtime, IP54 waterproof. Original Malaysia set!',
    category: 'Electronics',
    price: 99.00,
    originalPrice: 139.00,
    commissionRate: 6,
    sales: 18600,
    rating: 4.7,
    reviewCount: 14200,
    stock: 1100,
    trendScore: 88,
  },
  {
    title: 'Xiaomi Redmi Note 13 Pro 5G 256GB Malaysia Set',
    description: 'Redmi Note 13 Pro 5G, 200MP camera, 120Hz AMOLED. Original Zitron warranty. Free gift!',
    category: 'Electronics',
    price: 1199.00,
    originalPrice: 1499.00,
    commissionRate: 4,
    sales: 5400,
    rating: 4.8,
    reviewCount: 3200,
    stock: 180,
    trendScore: 90,
  },
  {
    title: 'Anker Soundcore Life Note 3i True Wireless Earbuds',
    description: 'Anker earbuds dengan ANC. 32 jam playtime, IPX5. Calls clear. Brand terbaik dari Anker.',
    category: 'Electronics',
    price: 159.00,
    originalPrice: 219.00,
    commissionRate: 7,
    sales: 9200,
    rating: 4.8,
    reviewCount: 7100,
    stock: 460,
    trendScore: 86,
  },
  {
    title: 'Powerbank 20000mAh Anker PowerCore PD 22.5W',
    description: 'Powerbank Anker 20000mAh, fast charging PD 22.5W. Boleh charge phone 4-5 kali. Original!',
    category: 'Electronics',
    price: 129.00,
    originalPrice: 189.00,
    commissionRate: 6,
    sales: 14800,
    rating: 4.8,
    reviewCount: 11300,
    stock: 820,
    trendScore: 85,
  },
  {
    title: 'Smartwatch Xiaomi Mi Band 8 Original Malaysia Set',
    description: 'Mi Band 8, AMOLED display, 150+ sport modes. Heart rate, SpO2, sleep monitor. Battery 16 hari!',
    category: 'Electronics',
    price: 159.00,
    originalPrice: 199.00,
    commissionRate: 7,
    sales: 22300,
    rating: 4.7,
    reviewCount: 18600,
    stock: 920,
    trendScore: 92,
  },
  {
    title: 'Logitech MX Master 3S Wireless Mouse',
    description: 'Mouse Logitech MX Master 3S, silent click, USB-C, fast scroll. Untuk productivity!',
    category: 'Electronics',
    price: 399.00,
    originalPrice: 499.00,
    commissionRate: 5,
    sales: 3400,
    rating: 4.9,
    reviewCount: 2800,
    stock: 145,
    trendScore: 81,
  },
  {
    title: 'USB-C Hub UGREEN 9-in-1 Multiport Adapter',
    description: 'UGREEN USB-C hub, 9-in-1: HDMI 4K, USB 3.0, PD 100W, SD card. Untuk laptop dan tablet.',
    category: 'Electronics',
    price: 119.00,
    originalPrice: 169.00,
    commissionRate: 6,
    sales: 11200,
    rating: 4.7,
    reviewCount: 8600,
    stock: 540,
    trendScore: 84,
  },
  {
    title: 'Mechanical Keyboard Keychron K2 Wireless RGB',
    description: 'Keychron K2 wireless mechanical keyboard, hot-swap, RGB backlight. Mac & Windows compatible.',
    category: 'Electronics',
    price: 429.00,
    originalPrice: 529.00,
    commissionRate: 5,
    sales: 2100,
    rating: 4.8,
    reviewCount: 1600,
    stock: 95,
    trendScore: 78,
  },

  // ───── Home (7) ─────
  {
    title: 'Philips Air Fryer HD9200 4.1L',
    description: 'Air fryer Philips HD9200, 4.1L. Rapid Air Technology, kurang 90% minyak. Resipi Malaysia disertakan.',
    category: 'Home',
    price: 299.00,
    originalPrice: 449.00,
    commissionRate: 5,
    sales: 18400,
    rating: 4.8,
    reviewCount: 15600,
    stock: 680,
    trendScore: 93,
  },
  {
    title: 'Dyson V8 Absolute Cordless Vacuum Cleaner',
    description: 'Dyson V8 cordless, 2-in-1 stick + handheld. HEPA filter. Original Malaysia warranty 2 tahun.',
    category: 'Home',
    price: 1899.00,
    originalPrice: 2499.00,
    commissionRate: 4,
    sales: 2800,
    rating: 4.9,
    reviewCount: 2100,
    stock: 120,
    trendScore: 89,
  },
  {
    title: 'Set Cadar Katil Microfiber 5in1 King Queen',
    description: 'Set cadar microfiber, 5in1 termasuk bantal. Sejuk, lembut, tahan lalu. Free shipping!',
    category: 'Home',
    price: 49.90,
    originalPrice: 99.00,
    commissionRate: 8,
    sales: 38700,
    rating: 4.7,
    reviewCount: 32100,
    stock: 1800,
    trendScore: 91,
  },
  {
    title: 'Xiaomi Smart Air Purifier 4 Lite',
    description: 'Xiaomi air purifier 4 Lite, HEPA H13, OLED display. Untuk bilik hingga 36m². PM2.5 real-time.',
    category: 'Home',
    price: 499.00,
    originalPrice: 649.00,
    commissionRate: 5,
    sales: 6700,
    rating: 4.7,
    reviewCount: 5200,
    stock: 280,
    trendScore: 86,
  },
  {
    title: 'Vacuum Cleaner Wireless Rechargeable 18000Pa',
    description: 'Vacuum wireless 18000Pa suction, lightweight, LED light. Untuk rumah dan kereta. 4-in-1.',
    category: 'Home',
    price: 169.00,
    originalPrice: 299.00,
    commissionRate: 7,
    sales: 16400,
    rating: 4.5,
    reviewCount: 12800,
    stock: 760,
    trendScore: 87,
  },
  {
    title: 'Humidifier Diffuser Essential Oil 300ml LED',
    description: 'Diffuser + humidifier 2-in-1, LED 7 warna, auto-off. Untuk ruang santai dan tidur nyenyak.',
    category: 'Home',
    price: 39.90,
    originalPrice: 79.90,
    commissionRate: 9,
    sales: 24200,
    rating: 4.6,
    reviewCount: 18900,
    stock: 1240,
    trendScore: 88,
  },
  {
    title: 'Rak Storage 5 Tier Skruless Organizer',
    description: 'Rak 5 tingkat, skruless, mudah pasang. Muat 30kg setiap tingkat. Untuk dapur, bilik, garage.',
    category: 'Home',
    price: 59.90,
    originalPrice: 99.90,
    commissionRate: 8,
    sales: 21800,
    rating: 4.5,
    reviewCount: 16700,
    stock: 980,
    trendScore: 84,
  },

  // ───── Food (5) ─────
  {
    title: 'Maggi Cup Curry Flavour 4x70g',
    description: 'Maggi cup curry, 4 in 1 pack. Sedap dan pantas! Stok panas, harga runtuh. Halal Malaysia.',
    category: 'Food',
    price: 9.90,
    originalPrice: 14.90,
    commissionRate: 15,
    sales: 68400,
    rating: 4.8,
    reviewCount: 56200,
    stock: 8400,
    trendScore: 96,
  },
  {
    title: 'Munchys Muzic Wafers Roll Vanilla 12 packs',
    description: 'Munchys wafers roll vanilla, 12 packs. Snack kegemaran keluarga Malaysia. Halal Jakim.',
    category: 'Food',
    price: 14.90,
    originalPrice: 22.90,
    commissionRate: 13,
    sales: 32600,
    rating: 4.7,
    reviewCount: 24100,
    stock: 3200,
    trendScore: 89,
  },
  {
    title: 'Kopi Susu Tambun 3in1 30 sachets Best Seller',
    description: 'Kopi susu Tambun 3in1, 30 sachet. Kaw, kaya, sedap. Best seller di Utara Malaysia!',
    category: 'Food',
    price: 24.90,
    originalPrice: 34.90,
    commissionRate: 12,
    sales: 41800,
    rating: 4.8,
    reviewCount: 33500,
    stock: 2800,
    trendScore: 92,
  },
  {
    title: 'Sambal Ikan Bilis Mama Recipe 250g Ready to Eat',
    description: 'Sambal ikan bilis mama recipe, 250g. Pedas giler, ready to eat. Sesuai dengan nasi panas!',
    category: 'Food',
    price: 12.90,
    originalPrice: 19.90,
    commissionRate: 14,
    sales: 28900,
    rating: 4.7,
    reviewCount: 21800,
    stock: 1600,
    trendScore: 90,
  },
  {
    title: 'Keropok Lekor Terengganu 500g Frozen Ready Fried',
    description: 'Keropok lekor asli Terengganu, 500g frozen. Tahan 6 bulan. Goreng 5 minit siap makan!',
    category: 'Food',
    price: 18.90,
    originalPrice: 28.90,
    commissionRate: 13,
    sales: 22300,
    rating: 4.6,
    reviewCount: 17400,
    stock: 1200,
    trendScore: 87,
  },

  // ───── Health (3) ─────
  {
    title: 'Appeton Weight Gain Adult 900g Chocolate',
    description: 'Appeton weight gain adult, 900g. Tambah berat badan sihat. Vitamin + mineral. Halal.',
    category: 'Health',
    price: 89.00,
    originalPrice: 119.00,
    commissionRate: 9,
    sales: 7800,
    rating: 4.5,
    reviewCount: 5400,
    stock: 320,
    trendScore: 82,
  },
  {
    title: 'Blackmores Vitamin C 500mg 150 Tablets',
    description: 'Blackmores Vitamin C 500mg, 150 tablet. Boost sistem imunisasi. Original Australia.',
    category: 'Health',
    price: 79.90,
    originalPrice: 109.90,
    commissionRate: 10,
    sales: 12400,
    rating: 4.8,
    reviewCount: 9800,
    stock: 480,
    trendScore: 86,
  },
  {
    title: 'Lactokid Plus Step 3 Milk Powder 1-3 Years 900g',
    description: 'Susu Lactokid Plus Step 3, untuk anak 1-3 tahun. DHA + prebiotik. Halal Malaysia.',
    category: 'Health',
    price: 64.90,
    originalPrice: 79.90,
    commissionRate: 8,
    sales: 14600,
    rating: 4.7,
    reviewCount: 11200,
    stock: 540,
    trendScore: 84,
  },

  // ───── Kids (2) ─────
  {
    title: 'LEGO Classic Bricks 484pcs Creative Building',
    description: 'LEGO Classic 484pcs, 35 model ideas. Untuk umur 4+. Original LEGO Malaysia.',
    category: 'Kids',
    price: 99.00,
    originalPrice: 139.00,
    commissionRate: 6,
    sales: 6800,
    rating: 4.9,
    reviewCount: 5200,
    stock: 280,
    trendScore: 85,
  },
  {
    title: 'Action Figure Anime Collectible 15cm PVC',
    description: 'Action figure anime 15cm PVC. Detail tinggi, sesuai koleksi atau hadiah. 20+ model available.',
    category: 'Kids',
    price: 39.90,
    originalPrice: 69.90,
    commissionRate: 8,
    sales: 14200,
    rating: 4.6,
    reviewCount: 10800,
    stock: 860,
    trendScore: 83,
  },

  // ───── Sports (2) ─────
  {
    title: 'Tikar Yoga Premium 6mm Anti-Slip TPE',
    description: 'Tikar yoga 6mm TPE, anti-slip, no smell. Lightweight, free carry strap. Untuk yoga dan workout.',
    category: 'Sports',
    price: 49.90,
    originalPrice: 89.90,
    commissionRate: 7,
    sales: 16400,
    rating: 4.7,
    reviewCount: 12300,
    stock: 740,
    trendScore: 86,
  },
  {
    title: 'Adjustable Dumbbell Set 24kg Quick Change',
    description: 'Dumbbell adjustable 24kg, quick change system. Space-saving, ganti 5 set dumbbell. Untuk home gym.',
    category: 'Sports',
    price: 399.00,
    originalPrice: 599.00,
    commissionRate: 5,
    sales: 2800,
    rating: 4.6,
    reviewCount: 1900,
    stock: 130,
    trendScore: 80,
  },

  // ───── Automotive (2) ─────
  {
    title: 'Dashcam 70mai A800S 4K Front Rear Dual Camera',
    description: 'Dashcam 70mai A800S 4K front + 1080p rear. ADAS, GPS, WiFi. Original Xiaomi ecosystem.',
    category: 'Automotive',
    price: 449.00,
    originalPrice: 599.00,
    commissionRate: 5,
    sales: 4200,
    rating: 4.7,
    reviewCount: 3400,
    stock: 180,
    trendScore: 84,
  },
  {
    title: 'Car Phone Holder Magnetic Dashboard 360° Rotation',
    description: 'Phone holder magnetik dashboard, 360° rotation. 6 magnet neodymium kuat. Universal fit.',
    category: 'Automotive',
    price: 19.90,
    originalPrice: 39.90,
    commissionRate: 9,
    sales: 38600,
    rating: 4.5,
    reviewCount: 29400,
    stock: 2400,
    trendScore: 88,
  },
]

// ─── Helpers ────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomProductId(): string {
  return `TT${Date.now().toString(36)}${randInt(100000, 999999)}`
}

function randomOrderId(): string {
  const prefix = pick(['TT', 'TK', 'MY'])
  const digits = randInt(100000000000, 999999999999)
  return `${prefix}${digits}`
}

function randomShortCode(): string {
  return Math.random().toString(36).substring(2, 10)
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function pickHashtags(category: TikTokProductCategory, count: number = 3): string[] {
  const pool = HASHTAG_POOL[category]
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, pool.length))
}

// ─── Mock Service ───────────────────────────────────────────────

export class TikTokMockService {
  private products: TikTokProduct[]

  constructor() {
    this.products = this.generateProducts()
  }

  /**
   * Convert all templates into TikTokProduct objects
   */
  private generateProducts(): TikTokProduct[] {
    return PRODUCT_TEMPLATES.map((tmpl, i) => {
      const shopName = TIKTOK_SHOP_NAMES[i % TIKTOK_SHOP_NAMES.length]
      const productId = `${randInt(7000000000000, 7999999999999)}`
      const id = `tt-${productId}`
      const commissionAmount = round2((tmpl.price * tmpl.commissionRate) / 100)
      const shopId = `${randInt(700000, 799999)}`
      const hashtags = pickHashtags(tmpl.category, 3)

      return {
        id,
        productId,
        title: tmpl.title,
        description: tmpl.description,
        price: round2(tmpl.price),
        originalPrice: tmpl.originalPrice ? round2(tmpl.originalPrice) : undefined,
        currency: 'MYR',
        commissionRate: tmpl.commissionRate,
        commissionAmount,
        imageUrl: `https://p16-oec-va.tiktokcdn.com/product/${productId}.webp`,
        videoUrl: `https://www.tiktok.com/@${shopName.replace(/[^a-z0-9]/gi, '').toLowerCase()}/video/${randInt(7000000000000, 7999999999999)}`,
        shopName,
        shopId,
        category: tmpl.category,
        sales: tmpl.sales,
        rating: tmpl.rating,
        reviewCount: tmpl.reviewCount,
        stock: tmpl.stock,
        productLink: `https://shop.tiktok.com/view/product/${productId}`,
        deepLink: `snssdk1129://ec/product/${productId}`,
        platform: 'tiktok',
        hashtags,
        trendScore: tmpl.trendScore,
      }
    })
  }

  /**
   * Search products by keyword, with optional category filter and sorting
   */
  async searchProducts(
    query: string,
    options?: {
      page?: number
      limit?: number
      sortField?: 'commission' | 'price' | 'sales' | 'rating' | 'trend'
      sortOrder?: 'asc' | 'desc'
      category?: TikTokProductCategory
      minPrice?: number
      maxPrice?: number
    }
  ): Promise<{ products: TikTokProduct[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const sortField = options?.sortField || 'trend'
    const sortOrder = options?.sortOrder || 'desc'

    const queryLower = query.toLowerCase().trim()
    let filtered = this.products

    if (queryLower) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower) ||
          p.category.toLowerCase().includes(queryLower) ||
          p.shopName.toLowerCase().includes(queryLower) ||
          p.hashtags.some((h) => h.toLowerCase().includes(queryLower.replace('#', '')))
      )

      // If no keyword matches, try keyword splitting, then fall back to a curated subset
      if (filtered.length === 0) {
        const keywords = queryLower.split(/\s+/).filter(Boolean)
        filtered = this.products.filter((p) =>
          keywords.some(
            (kw) =>
              p.title.toLowerCase().includes(kw) ||
              p.category.toLowerCase().includes(kw) ||
              p.description.toLowerCase().includes(kw)
          )
        )

        if (filtered.length === 0) {
          const shuffled = [...this.products].sort(() => Math.random() - 0.5)
          filtered = shuffled.slice(0, Math.min(limit, shuffled.length)).map((p) => ({
            ...p,
            id: `tt-searched-${p.productId}`,
            title: `${query} - ${p.title}`,
          }))
        }
      }
    }

    if (options?.category) {
      filtered = filtered.filter((p) => p.category === options.category)
    }

    if (options?.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= (options.minPrice ?? 0))
    }
    if (options?.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= (options.maxPrice ?? Infinity))
    }

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
          aVal = a.rating
          bVal = b.rating
          break
        case 'trend':
          aVal = a.trendScore
          bVal = b.trendScore
          break
        default:
          aVal = a.trendScore
          bVal = b.trendScore
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const paged = filtered.slice(start, start + limit)

    return { products: paged, total }
  }

  /**
   * Get product detail by product ID
   */
  async getProductDetail(productId: string): Promise<TikTokProduct | null> {
    const product = this.products.find((p) => p.productId === productId || p.id === productId)
    if (product) return { ...product }

    // Fallback: synthesize a product from a random template
    const tmpl = pick(PRODUCT_TEMPLATES)
    const shopName = pick(TIKTOK_SHOP_NAMES)
    const commissionAmount = round2((tmpl.price * tmpl.commissionRate) / 100)
    return {
      id: `tt-${productId}`,
      productId,
      title: tmpl.title,
      description: tmpl.description,
      price: round2(tmpl.price),
      originalPrice: tmpl.originalPrice ? round2(tmpl.originalPrice) : undefined,
      currency: 'MYR',
      commissionRate: tmpl.commissionRate,
      commissionAmount,
      imageUrl: `https://p16-oec-va.tiktokcdn.com/product/${productId}.webp`,
      shopName,
      shopId: `${randInt(700000, 799999)}`,
      category: tmpl.category,
      sales: tmpl.sales,
      rating: tmpl.rating,
      reviewCount: tmpl.reviewCount,
      stock: tmpl.stock,
      productLink: `https://shop.tiktok.com/view/product/${productId}`,
      deepLink: `snssdk1129://ec/product/${productId}`,
      platform: 'tiktok',
      hashtags: pickHashtags(tmpl.category, 3),
      trendScore: tmpl.trendScore,
    }
  }

  /**
   * Generate a mock TikTok affiliate link
   */
  async generateAffiliateLink(params: {
    productId?: string
    productUrl?: string
    subId?: string
  }): Promise<TikTokAffiliateLink> {
    const shortCode = randomShortCode()
    const productId = params.productId || randomProductId()
    const subId = params.subId || ''
    const trackingId = `ttra${randInt(10000000, 99999999)}`
    const expiresAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString()

    return {
      shortUrl: `https://shop.tiktok.com/r/${shortCode}`,
      longUrl: `https://shop.tiktok.com/view/product/${productId}?aff_platform=tiktok&aff_trace_key=${shortCode}&sub_id=${subId}`,
      deepLink: `snssdk1129://ec/product/${productId}?aff_id=${trackingId}&aff_sub=${subId}`,
      generateUrl: `https://shop.tiktok.com/affiliate/link?product_id=${productId}&aff_id=${trackingId}`,
      trackingId,
      expiresAt,
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
    commissionStatus?: TikTokCommissionStatus
  }): Promise<{ orders: TikTokCommissionOrder[]; total: number }> {
    const page = params?.page || 1
    const limit = params?.limit || 50
    const statuses: TikTokCommissionStatus[] = [
      'pending',
      'confirmed',
      'shipped',
      'delivered',
      'paid',
      'rejected',
      'refunded',
    ]
    const orderStatuses = ['AWAITING_SHIPMENT', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED']

    const orderCount = randInt(20, 120)
    const orders: TikTokCommissionOrder[] = []

    for (let i = 0; i < orderCount; i++) {
      const seed = i + (params?.startTime || 0)
      const tmpl = PRODUCT_TEMPLATES[seed % PRODUCT_TEMPLATES.length]
      const unitPrice = round2(tmpl.price)
      const quantity = randInt(1, 4)
      const orderAmount = round2(unitPrice * quantity)
      const commissionRate = tmpl.commissionRate
      const commissionAmount = round2((orderAmount * commissionRate) / 100)
      const status = statuses[Math.floor(seededRandom(seed * 7) * statuses.length)]
      const daysAgo = Math.floor(seededRandom(seed * 13) * 60)
      const orderTime = Math.floor(Date.now() / 1000) - daysAgo * 86400
      const clickTime = orderTime - randInt(300, 86400)

      if (params?.commissionStatus && status !== params.commissionStatus) continue
      if (params?.startTime && orderTime < params.startTime) continue
      if (params?.endTime && orderTime > params.endTime) continue

      orders.push({
        orderId: randomOrderId(),
        orderCreateTime: orderTime,
        productId: `${randInt(7000000000000, 7999999999999)}`,
        productTitle: tmpl.title,
        productImage: `https://p16-oec-va.tiktokcdn.com/product/seed${seed}.webp`,
        quantity,
        unitPrice,
        orderAmount,
        commissionRate,
        commissionAmount,
        commissionStatus: status,
        orderStatus: pick(orderStatuses),
        settleTime:
          status === 'paid' ? orderTime + randInt(86400 * 14, 86400 * 45) : undefined,
        clickTime,
        customerRegion: pick(['MY-01', 'MY-14', 'MY-10', 'MY-03', 'MY-04', 'MY-07']),
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
  }): Promise<TikTokCommissionSummary> {
    return {
      totalCommission: round2(rand(1500, 6500)),
      pendingCommission: round2(rand(200, 1200)),
      confirmedCommission: round2(rand(800, 3200)),
      paidCommission: round2(rand(400, 2500)),
      rejectedCommission: round2(rand(40, 350)),
      totalOrders: randInt(150, 1100),
      conversionRate: round2(rand(5, 15)),
      clickCount: randInt(3000, 25000),
    }
  }

  /**
   * Test mock connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; region: string }> {
    return {
      success: true,
      message: 'Connected to TikTok Shop mock data service (real API not configured)',
      region: 'MY',
    }
  }

  /**
   * Get mock affiliate profile
   */
  async getAffiliateProfile(): Promise<TikTokAffiliateProfile> {
    return {
      affiliateId: 'MY-TT-AFF-20240001',
      name: 'TheViralFinds MY',
      email: 'affiliate@theviralfinds.my',
      status: 'active',
      commissionRate: 10.0,
      totalEarnings: round2(rand(3500, 12000)),
      joinDate: '2024-02-01',
      region: 'MY',
      followerCount: randInt(12000, 85000),
      shopConnected: true,
    }
  }

  /**
   * Get top trending products by trend score
   */
  async getTopProducts(limit?: number): Promise<TikTokProduct[]> {
    const sorted = [...this.products].sort((a, b) => b.trendScore - a.trendScore)
    return sorted.slice(0, limit || 10)
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<TikTokCategory[]> {
    return TIKTOK_CATEGORIES
  }

  /**
   * Get raw mock product list (for testing/debugging)
   */
  getAllProducts(): TikTokProduct[] {
    return [...this.products]
  }
}

// ─── Singleton ──────────────────────────────────────────────────

let _mockInstance: TikTokMockService | null = null

export function getTikTokMockService(): TikTokMockService {
  if (!_mockInstance) {
    _mockInstance = new TikTokMockService()
  }
  return _mockInstance
}
