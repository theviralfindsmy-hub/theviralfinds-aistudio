/**
 * Affiliate Content Marketplace — Mock Data
 *
 * Fasa 4.2 (CHECKLIST Section 4.2).
 *
 * Generates:
 *   - 8 seller profiles (Malaysian affiliates)
 *   - 32 listings across 6 categories × 5 niches × 4 platforms
 *   - 12 reviews
 *
 * All currency in RM. Timestamps computed at module load so "createdAt"
 * values look recent (last ~120 days). The "current user" seller
 * (id = CURRENT_SELLER_ID) starts with no listings — the seller
 * dashboard UI uses it for the "Your Listings" tab and the sell flow
 * adds new listings under that id.
 */

import {
  CURRENT_SELLER_ID,
  type ListingCategory,
  type ListingNiche,
  type ListingPlatform,
  type ListingReview,
  type MarketplaceListing,
  type SellerProfile,
} from './types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString()
}

function thumbnail(seed: string, w = 400, h = 300): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

function avatar(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent('avatar-' + seed)}/80/80`
}

// ─── Sellers (8 + 1 "current user") ─────────────────────────────────────────

export const MOCK_SELLERS: SellerProfile[] = [
  {
    id: 'seller-01',
    name: 'Kakak Beauty',
    avatar: avatar('kakak-beauty'),
    bio: 'Beauty content creator dari KL. 5 tahun dalam affiliate game. Specialist skincare + makeup templates.',
    totalSales: 1284,
    totalRevenue: 38420.5,
    listingCount: 8,
    rating: 4.9,
    reviewCount: 312,
    joinedAt: daysAgo(540),
  },
  {
    id: 'seller-02',
    name: 'TechBros MY',
    avatar: avatar('techbros-my'),
    bio: 'Gadget reviewer + tech affiliate. Penang-based. Top seller untuk video scripts electronics.',
    totalSales: 892,
    totalRevenue: 28940.0,
    listingCount: 6,
    rating: 4.8,
    reviewCount: 198,
    joinedAt: daysAgo(420),
  },
  {
    id: 'seller-03',
    name: 'FashionHijab Studio',
    avatar: avatar('fashionhijab'),
    bio: 'Hijab + modest fashion content creator. Shah Alam. Specialist TikTok fashion scripts.',
    totalSales: 745,
    totalRevenue: 19320.75,
    listingCount: 5,
    rating: 4.9,
    reviewCount: 167,
    joinedAt: daysAgo(380),
  },
  {
    id: 'seller-04',
    name: 'RumahKita DIY',
    avatar: avatar('rumahkita'),
    bio: 'Home + living content creator. Johor Bahru. Live shopping specialist untuk home goods.',
    totalSales: 612,
    totalRevenue: 22180.4,
    listingCount: 4,
    rating: 4.7,
    reviewCount: 134,
    joinedAt: daysAgo(310),
  },
  {
    id: 'seller-05',
    name: 'MakanKaki Foodie',
    avatar: avatar('makankaki'),
    bio: 'Food blogger + Shopee Food affiliate. Ipoh. Buat caption + hashtag sets untuk F&B brands.',
    totalSales: 489,
    totalRevenue: 9870.25,
    listingCount: 4,
    rating: 4.8,
    reviewCount: 102,
    joinedAt: daysAgo(260),
  },
  {
    id: 'seller-06',
    name: 'DesignerDanial',
    avatar: avatar('designerdanial'),
    bio: 'Graphic designer turned affiliate. Bukit Bintang. Thumbnail PSD templates top seller.',
    totalSales: 358,
    totalRevenue: 17230.0,
    listingCount: 3,
    rating: 5.0,
    reviewCount: 89,
    joinedAt: daysAgo(220),
  },
  {
    id: 'seller-07',
    name: 'LiveQueen Nadia',
    avatar: avatar('livequeen-nadia'),
    bio: 'Top Shopee Live host. KL. Live shopping script templates — confirmed boleh convert.',
    totalSales: 1024,
    totalRevenue: 41280.6,
    listingCount: 3,
    rating: 4.9,
    reviewCount: 245,
    joinedAt: daysAgo(480),
  },
  {
    id: 'seller-08',
    name: 'EmailPro MY',
    avatar: avatar('emailpro-my'),
    bio: 'Email marketing consultant untuk e-commerce brands. Subang Jaya. Newsletter templates pro.',
    totalSales: 234,
    totalRevenue: 11820.0,
    listingCount: 2,
    rating: 4.6,
    reviewCount: 56,
    joinedAt: daysAgo(150),
  },
  // The "current user" seller profile — empty until they list something.
  {
    id: CURRENT_SELLER_ID,
    name: 'You',
    avatar: avatar('you-seller'),
    bio: 'This is your seller dashboard. List your first content template to start earning.',
    totalSales: 0,
    totalRevenue: 0,
    listingCount: 0,
    rating: 0,
    reviewCount: 0,
    joinedAt: daysAgo(0),
    isCurrentUser: true,
  },
]

// ─── Listings (32) ──────────────────────────────────────────────────────────

interface ListingSeed {
  id: string
  title: string
  description: string
  category: ListingCategory
  platform: ListingPlatform
  niche: ListingNiche
  price: number
  originalPrice?: number
  sellerId: string
  downloads: number
  rating: number
  reviewCount: number
  tags: string[]
  previewSnippet: string
  features: string[]
  contentBody: string
  createdAtDays: number
}

const LISTING_SEEDS: ListingSeed[] = [
  // ── Kakak Beauty (seller-01) ────────────────────────────────────────────
  {
    id: 'lst-001',
    title: '10 TikTok Beauty Video Scripts (Raya Edition)',
    description:
      '10 proven TikTok video scripts for beauty products during Raya season. Includes hook lines, product demo flow, CTA, dan hashtag suggestions. Manglish + BM mix untuk local audience. Each script 30-60 seconds, optimized untuk algorithm FYP.',
    category: 'video_scripts',
    platform: 'tiktok',
    niche: 'beauty',
    price: 29.9,
    originalPrice: 49.9,
    sellerId: 'seller-01',
    downloads: 142,
    rating: 4.9,
    reviewCount: 38,
    tags: ['tiktok', 'beauty', 'raya', 'skincare', 'makeup', 'video script'],
    previewSnippet:
      '🎬 SCRIPT 1: Raya Glow Serum Hook\n\n[WATERMARKED PREVIEW]\nHook: "Eh, raya nak dekat tapi muka still kusam? Jangan panik — saya ada satu trick..."',
    features: [
      '10 ready-to-shoot TikTok scripts',
      'Raya-themed hooks (Manglish + BM)',
      'Product demo flow diagram',
      'CTA templates with affiliate link insert',
      'Hashtag bundle (50+ Raya beauty tags)',
      'Filming tips for FYP algorithm',
    ],
    contentBody:
      '🎬 SCRIPT 1: Raya Glow Serum Hook (60s)\n\nHook (0-3s): "Eh, raya nak dekat tapi muka still kusam? Jangan panik — saya ada satu trick confirm korang tak expect."\n\nIntro (3-8s): [Show product] "Ni [PRODUCT NAME]. Serum Vitamin C yang saya guna dah 2 bulan."\n\nDemo (8-25s): [Apply on hand] "Texture dia ringan gila, absorb cepat. Takde sticky feeling."\n\nResult (25-45s): [Show before/after] "Lihat sebelum vs selepas. Kusam jadi glow!"\n\nCTA (45-60s): "Link dekat bio — grab sekarang sebelum sold out Raya nanti. Confirm puas!"\n\n#rayabeauty #skincareroutine #vitaminc #malaysiatiktok\n\n---\n\n🎬 SCRIPT 2: Lipstick Swatch Series (45s)\n[...full script body continues for all 10 scripts...]',
    createdAtDays: 18,
  },
  {
    id: 'lst-002',
    title: '50 Caption Templates for Shopee Beauty Products',
    description:
      '50 caption templates siap pakai untuk Shopee beauty products. Cover skincare, makeup, haircare, body care. Each template ada placeholder untuk product name, price, discount. BM + English mix.',
    category: 'captions',
    platform: 'shopee',
    niche: 'beauty',
    price: 19.9,
    sellerId: 'seller-01',
    downloads: 287,
    rating: 4.8,
    reviewCount: 64,
    tags: ['shopee', 'beauty', 'caption', 'skincare', 'makeup'],
    previewSnippet:
      '✍️ CAPTION 1: Skincare Launch\n\n[WATERMARKED PREVIEW]\n"Skincare baru dah landing! [PRODUCT] ni memang game-changer..."',
    features: [
      '50 caption templates',
      'Covers 4 beauty sub-niches',
      'BM + English mix',
      'Emojis + hashtag placement guide',
      'Editable placeholders',
      'Best for Shopee feed posts',
    ],
    contentBody:
      '✍️ CAPTION 1: Skincare Launch\n\n"Skincare baru dah landing! [PRODUCT] ni memang game-changer untuk yang ada masalah kusam. Bila pakai consistent 2 minggu confirm nampak result. Harga Raya [PRICE] je — grab cepat sebelum habis! 🎉\n\n👉 Link: [AFFILIATE_LINK]\n\n#skincare #rayabeauty #malaysiabeauty"\n\n---\n\n✍️ CAPTION 2: Makeup Tutorial Promo\n[...full template continues for all 50 captions...]',
    createdAtDays: 35,
  },
  {
    id: 'lst-003',
    title: 'Complete Hashtag Set — 200+ Malaysian Beauty Tags',
    description:
      '200+ hashtag马来西亚 beauty market, organized by sub-niche (skincare, makeup, haircare, bodycare). Includes trending tags, evergreen tags, Raya/Hari Terbuka tags. Updated for 2025 algorithm.',
    category: 'hashtag_sets',
    platform: 'all',
    niche: 'beauty',
    price: 14.9,
    sellerId: 'seller-01',
    downloads: 412,
    rating: 4.7,
    reviewCount: 89,
    tags: ['hashtag', 'beauty', 'malaysia', 'tiktok', 'instagram'],
    previewSnippet:
      '#️⃣ SKINCARE HASHTAGS (50)\n\n[WATERMARKED PREVIEW]\n#skincareroutine #skincaretips #vitaminc #malaysiaskincare #kulinsskincare...',
    features: [
      '200+ organized hashtags',
      '4 sub-niche categories',
      'Trending vs evergreen tagged',
      'Seasonal tags (Raya, Merdeka, 11.11)',
      'Copy-paste ready blocks',
      '2025 algorithm optimized',
    ],
    contentBody:
      '#️⃣ SKINCARE HASHTAGS (50)\n\n#skincareroutine #skincaretips #vitaminc #malaysiaskincare #kulinsskincare #skincareaddict #skincarecommunity #glowingskin #acnetreatment #oilcontrol #moisturizer #sunscreen #serum #toner #cleanser #exfoliate #skinbarrier #hyperpigmentation #brightening #antiaging #rayaskincare #shopeeskincare #tiktokskincare #beautytok #malaysiabeauty #skincaremy #kosmetikmalaysia #jelitawan #cantik #kulitcerah\n\n#️⃣ MAKEUP HASHTAGS (50)\n[...full list continues for all 200+ hashtags...]',
    createdAtDays: 50,
  },
  {
    id: 'lst-004',
    title: '5 Live Shopping Script Templates (Manglish)',
    description:
      '5 proven Manglish live shopping scripts untuk Shopee Live beauty. Cover launching new product, flash sale, Q&A session, demo session, giveaway. Each script 15-30 min flow.',
    category: 'live_scripts',
    platform: 'shopee',
    niche: 'beauty',
    price: 39.9,
    sellerId: 'seller-01',
    downloads: 89,
    rating: 5.0,
    reviewCount: 22,
    tags: ['shopee live', 'beauty', 'manglish', 'live script'],
    previewSnippet:
      '📡 LIVE SCRIPT 1: New Product Launch (15 min)\n\n[WATERMARKED PREVIEW]\nOpening (0-3 min): "Eh korang! Welcome welcome..."',
    features: [
      '5 full live shopping scripts',
      'Manglish + BM natural flow',
      '15-30 min each',
      'Includes audience interaction prompts',
      'Flash sale countdown templates',
      'Q&A handling scripts',
    ],
    contentBody:
      '📡 LIVE SCRIPT 1: New Product Launch (15 min)\n\nOpening (0-3 min):\n"Eh korang! Welcome welcome. Saya [NAME] dari [SHOP]. Hari ni saya ada satu produk baru yang confirm korang akan suka gila. Sebelum saya tunjuk, tekan heart dulu ya — kalau sampai 100 likes saya buat flash sale harga special!"\n\nProduct Reveal (3-7 min):\n"Ok ok, jom saya tunjuk. [Show product close-up] Ni dia — [PRODUCT NAME]. [Explain ingredients/benefits]. Korang tengok texture dia..." [Demo on hand]\n\nFlash Sale Pitch (7-12 min):\n"Ok korang, sekarang ni masa paling penting. Untuk 5 minit je, harga [PRICE] — normal [ORIGINAL_PRICE]. Lepas tu balik normal tau. Click banner bawah ni sekarang!"\n\nQ&A + Closing (12-15 min):\n[...full script with all 5 templates continues...]',
    createdAtDays: 12,
  },
  {
    id: 'lst-005',
    title: 'Email Newsletter Templates — Beauty E-commerce (7 pack)',
    description:
      '7 email newsletter templates untuk beauty e-commerce: welcome series, product launch, flash sale, abandoned cart, post-purchase, re-engagement, Raya promo. Mailchimp + Klaviyo compatible.',
    category: 'email_templates',
    platform: 'all',
    niche: 'beauty',
    price: 34.9,
    sellerId: 'seller-01',
    downloads: 56,
    rating: 4.7,
    reviewCount: 14,
    tags: ['email', 'newsletter', 'beauty', 'ecommerce', 'klaviyo'],
    previewSnippet:
      '📧 WELCOME EMAIL TEMPLATE\n\n[WATERMARKED PREVIEW]\nSubject: Welcome to [BRAND]! 🎉 Your 10% off code inside...',
    features: [
      '7 full email sequences',
      'Welcome + launch + sale + cart + post-purchase',
      'Mailchimp + Klaviyo ready',
      'Mobile-optimized HTML',
      'BM + English subject lines A/B',
      'Conversion copywriting framework',
    ],
    contentBody:
      '📧 WELCOME EMAIL TEMPLATE\n\nSubject: Welcome to [BRAND]! 🎉 Your 10% off code inside\n\nHi [FIRST_NAME],\n\nWelcome to the [BRAND] family! Kami super excited ada korang dalam community.\n\nAs a thank-you, guna code WELCOME10 untuk 10% off first purchase. Valid 7 days je tau!\n\n[SHOP NOW BUTTON]\n\nYang kami famous: [TOP_PRODUCT_1], [TOP_PRODUCT_2]\n\nxx,\n[BRAND] Team\n\n---\n\n📧 PRODUCT LAUNCH EMAIL TEMPLATE\n[...full templates continue...]',
    createdAtDays: 28,
  },
  {
    id: 'lst-006',
    title: 'Beauty Thumbnail PSD Pack — 12 Designs',
    description:
      '12 PSD thumbnail templates for beauty videos — TikTok, YouTube, Shopee. Editable text, color, product image slot. Manglish-friendly text overlays included.',
    category: 'thumbnail_designs',
    platform: 'all',
    niche: 'beauty',
    price: 44.9,
    originalPrice: 69.9,
    sellerId: 'seller-01',
    downloads: 78,
    rating: 4.9,
    reviewCount: 19,
    tags: ['thumbnail', 'psd', 'beauty', 'tiktok', 'youtube'],
    previewSnippet:
      '🖼️ PACK CONTENTS (12 designs)\n\n[WATERMARKED PREVIEW]\n1. "BEST SELLER!" pink bold\n2. "RAYA EDITION" gold gradient...',
    features: [
      '12 layered PSD files',
      'TikTok + YouTube + Shopee sizes',
      'Smart object for product image',
      'Editable Manglish text overlays',
      'Color palette guide',
      'Font links included',
    ],
    contentBody:
      '🖼️ PACK CONTENTS\n\n1. "BEST SELLER!" pink bold — TikTok 9:16\n2. "RAYA EDITION" gold gradient — TikTok 9:16\n3. "HARGA RAYA" red flash — Shopee 1:1\n4. "TUTORIAL" minimal aesthetic — YouTube 16:9\n5. "REVIEW" clean white — YouTube 16:9\n6. "GRAB IT!" urgent orange — TikTok 9:16\n7-12. [Additional designs...]\n\n📁 DOWNLOAD LINKS:\n• PSD pack (1.2 GB): [DOWNLOAD_URL_1]\n• Font pack: [DOWNLOAD_URL_2]\n• Color guide PDF: [DOWNLOAD_URL_3]\n\n📝 USAGE NOTES:\nReplace [PRODUCT_IMAGE] smart object with your product photo. Edit text layers as needed.',
    createdAtDays: 22,
  },

  // ── TechBros MY (seller-02) ─────────────────────────────────────────────
  {
    id: 'lst-007',
    title: 'Tech Review Video Scripts Pack — 15 Templates',
    description:
      '15 video script templates untuk tech product reviews. Cover smartphones, earbuds, smart home, accessories. Hook → spec rundown → demo → verdict flow. Optimized untuk 60-90s TikTok + 5-10 min YouTube.',
    category: 'video_scripts',
    platform: 'all',
    niche: 'tech',
    price: 35.9,
    sellerId: 'seller-02',
    downloads: 168,
    rating: 4.8,
    reviewCount: 42,
    tags: ['tech', 'review', 'gadget', 'video script', 'tiktok', 'youtube'],
    previewSnippet:
      '🎬 SCRIPT 1: Earbuds Review (TikTok 60s)\n\n[WATERMARKED PREVIEW]\nHook: "Earbuds RAYA ni saya rasa paling worth it..."',
    features: [
      '15 review scripts (TikTok + YouTube)',
      'Covers 4 tech sub-niches',
      'Spec rundown templates',
      'Verdict framework',
      'Affiliate link CTA placement',
      'BM + English mix',
    ],
    contentBody:
      '🎬 SCRIPT 1: Earbuds Review (TikTok 60s)\n\nHook (0-3s): "Earbuds RAYA ni saya rasa paling worth it bawah RM200. Tengok ni."\n\nSpec Rundown (3-20s): [Show earbuds] "[BRAND MODEL]. ANC, 30h battery, IPX5. Untuk harga [PRICE]? Confirm best deal."\n\nDemo (20-45s): [Test fit, sound test] "Bass dia — [play music] — sufficient la. ANC pun ok untuk harga ni."\n\nVerdict + CTA (45-60s): "Overall 8/10. Worth every sen. Link dekat bio — beli sebelum harga naik."',
    createdAtDays: 15,
  },
  {
    id: 'lst-008',
    title: '50 TikTok Tech Captions — Viral Format',
    description:
      '50 caption templates untuk tech products on TikTok. Viral format dengan hooks, questions, emoji combos. Cover smartphones, gadgets, accessories, smart home.',
    category: 'captions',
    platform: 'tiktok',
    niche: 'tech',
    price: 17.9,
    sellerId: 'seller-02',
    downloads: 234,
    rating: 4.7,
    reviewCount: 51,
    tags: ['tiktok', 'tech', 'caption', 'viral'],
    previewSnippet:
      '✍️ CAPTION 1: Smartphone Drop\n\n[WATERMARKED PREVIEW]\n"Phone baru drop! 📱 [BRAND] [MODEL] ni confirmed...',
    features: [
      '50 viral-format captions',
      'Hook + question + CTA structure',
      'Emoji combos that convert',
      'Hashtag placement guide',
      'Tech sub-niche covered',
      'Trending sound suggestions',
    ],
    contentBody:
      '✍️ CAPTION 1: Smartphone Drop\n\n"Phone baru drop! 📱 [BRAND] [MODEL] ni confirmed best phone bawah RM[PRICE] untuk [USE_CASE]. Camera dia [SPEC], battery [SPEC], performance [SPEC]. Worth upgrade ke tak? Comment below! 👇\n\n👉 Link: [AFFILIATE_LINK]\n\n#techtok #smartphone #malaysiatech #gadgetreview"',
    createdAtDays: 25,
  },
  {
    id: 'lst-009',
    title: 'Tech Hashtag Bundle — 150+ Malaysian Market Tags',
    description:
      '150+ hashtag马来西亚 tech market. Cover gadget review, smartphone, laptop, gaming, audio, smart home. Trending + evergreen mix. 2025 updated.',
    category: 'hashtag_sets',
    platform: 'all',
    niche: 'tech',
    price: 12.9,
    sellerId: 'seller-02',
    downloads: 298,
    rating: 4.6,
    reviewCount: 67,
    tags: ['hashtag', 'tech', 'malaysia', 'gadget'],
    previewSnippet:
      '#️⃣ SMARTPHONE HASHTAGS (40)\n\n[WATERMARKED PREVIEW]\n#smartphonemalaysia #techtok #gadgetreview #phonereview...',
    features: [
      '150+ organized hashtags',
      '6 tech sub-niches',
      'Trending tags flagged',
      'Local context (Malaysia + Singapore)',
      'Copy-paste blocks',
      'Monthly trending refresh guide',
    ],
    contentBody:
      '#️⃣ SMARTPHONE HASHTAGS (40)\n\n#smartphonemalaysia #techtok #gadgetreview #phonereview #xiaomi #samsungmy #realmemalaysia #iponemalaysia #techtokmy #gadgetmalaysia #smartphone #androidmy #iphoneuser #techtips #phonetips #malaysiatech #budgetphone #flagship #midrange #speccheck',
    createdAtDays: 40,
  },
  {
    id: 'lst-010',
    title: 'Tech Thumbnail Templates — 10 PSD Designs',
    description:
      '10 PSD thumbnail templates for tech reviews. Bold text, spec highlights, price tags. Editable layers. Manglish text overlays included.',
    category: 'thumbnail_designs',
    platform: 'all',
    niche: 'tech',
    price: 49.9,
    sellerId: 'seller-02',
    downloads: 67,
    rating: 4.9,
    reviewCount: 18,
    tags: ['thumbnail', 'psd', 'tech', 'youtube', 'tiktok'],
    previewSnippet:
      '🖼️ PACK CONTENTS (10 designs)\n\n[WATERMARKED PREVIEW]\n1. "BEST BUDGET?" bold yellow\n2. "8/10 VERDICT" rating card...',
    features: [
      '10 layered PSD files',
      'YouTube + TikTok sizes',
      'Smart object product slot',
      'Spec highlight badges',
      'Editable Manglish overlays',
      'Color-coded for sub-niche',
    ],
    contentBody:
      '🖼️ PACK CONTENTS\n\n1. "BEST BUDGET?" bold yellow — YouTube 16:9\n2. "8/10 VERDICT" rating card — YouTube 16:9\n3. "DROP TEST" red urgent — TikTok 9:16\n4. "RM[PRICE] WORTH IT?" — TikTok 9:16\n5. "FIRST LOOK" minimal — YouTube 16:9\n6-10. [Additional designs...]\n\n📁 DOWNLOAD LINKS:\n• PSD pack (1.8 GB): [DOWNLOAD_URL]',
    createdAtDays: 8,
  },
  {
    id: 'lst-011',
    title: 'Live Shopping Scripts — Tech Edition (8 templates)',
    description:
      '8 Manglish live shopping scripts untuk tech products on Shopee Live. Cover phone launch, gadget bundle, flash sale, comparison. 20-40 min each.',
    category: 'live_scripts',
    platform: 'shopee',
    niche: 'tech',
    price: 45.9,
    sellerId: 'seller-02',
    downloads: 54,
    rating: 4.8,
    reviewCount: 12,
    tags: ['shopee live', 'tech', 'manglish', 'live script'],
    previewSnippet:
      '📡 LIVE SCRIPT 1: Smartphone Launch (30 min)\n\n[WATERMARKED PREVIEW]\nOpening: "Welcome welcome! Hari ni korang memang...',
    features: [
      '8 full live shopping scripts',
      'Manglish + tech-savvy tone',
      '20-40 min each',
      'Comparison segment templates',
      'Q&A handling scripts',
      'Flash sale countdown flow',
    ],
    contentBody:
      '📡 LIVE SCRIPT 1: Smartphone Launch (30 min)\n\nOpening (0-3 min):\n"Welcome welcome! Hari ni korang memang kena ada sini sebab saya ada smartphone baru yang confirm jawab semua soalan korang. Saya [NAME], tech reviewer korang. Sebelum kita mula, tap heart sampai 200 — saya bocor harga special!"',
    createdAtDays: 30,
  },
  {
    id: 'lst-012',
    title: 'Tech E-commerce Email Templates (10 pack)',
    description:
      '10 email templates untuk tech e-commerce: product launch, comparison, sale, accessories upsell, warranty, review request, re-engagement. HTML + plain text versions.',
    category: 'email_templates',
    platform: 'all',
    niche: 'tech',
    price: 39.9,
    sellerId: 'seller-02',
    downloads: 41,
    rating: 4.6,
    reviewCount: 9,
    tags: ['email', 'tech', 'ecommerce', 'newsletter'],
    previewSnippet:
      '📧 PRODUCT LAUNCH EMAIL\n\n[WATERMARKED PREVIEW]\nSubject: [PRODUCT] dah land! 🚀 Best [CATEGORY] bawah RM[PRICE]...',
    features: [
      '10 full email templates',
      'HTML + plain text versions',
      'Spec comparison table templates',
      'Mobile-optimized',
      'Cross-sell + upsell framework',
      'Review request sequence',
    ],
    contentBody:
      '📧 PRODUCT LAUNCH EMAIL\n\nSubject: [PRODUCT] dah land! 🚀 Best [CATEGORY] bawah RM[PRICE]\n\nHi [FIRST_NAME],\n\n[PRODUCT] officially available di [SHOP]! Spec dia confirmed jawab semua需求 korang:\n\n• [SPEC_1]\n• [SPEC_2]\n• [SPEC_3]\n\nHarga: RM[PRICE] (was RM[ORIGINAL_PRICE])\n\n[SHOP NOW BUTTON]',
    createdAtDays: 45,
  },

  // ── FashionHijab Studio (seller-03) ─────────────────────────────────────
  {
    id: 'lst-013',
    title: 'TikTok Hijab Fashion Scripts — 12 Templates',
    description:
      '12 TikTok video scripts untuk hijab + modest fashion content. Cover styling tips, outfit ideas, haul, Raya baju kurung, tudung bawal tutorial. Manglish + BM.',
    category: 'video_scripts',
    platform: 'tiktok',
    niche: 'fashion',
    price: 27.9,
    sellerId: 'seller-03',
    downloads: 156,
    rating: 4.9,
    reviewCount: 34,
    tags: ['tiktok', 'fashion', 'hijab', 'modest', 'raya'],
    previewSnippet:
      '🎬 SCRIPT 1: Tudung Bawal Tutorial (45s)\n\n[WATERMARKED PREVIEW]\nHook: "Korang selalu struggle tudung bawal...',
    features: [
      '12 ready-to-shoot scripts',
      'Hijab styling focus',
      'Raya + daily outfit combos',
      'Manglish + BM natural',
      'CTA templates for affiliate',
      'Filming angle tips',
    ],
    contentBody:
      '🎬 SCRIPT 1: Tudung Bawal Tutorial (45s)\n\nHook (0-3s): "Korang selalu struggle tudung bawal? Ni tutorial paling senang — 3 step je."\n\nStep 1 (3-15s): [Demo] "Lipat dua, letak atas kepala. Cekuk sikit belakang."\nStep 2 (15-30s): [Demo] "Pin dekat bawah dagu. Tarik sikit untuk sleek look."\nStep 3 (30-45s): [Final look] "Cantik kan? Get the tudung dari [SHOP] — link bio."',
    createdAtDays: 16,
  },
  {
    id: 'lst-014',
    title: 'Shopee Fashion Captions — 40 Templates',
    description:
      '40 caption templates untuk Shopee fashion products. Cover baju kurung, tudung, modest wear, daily outfit, Raya edition. BM + English mix.',
    category: 'captions',
    platform: 'shopee',
    niche: 'fashion',
    price: 18.9,
    sellerId: 'seller-03',
    downloads: 198,
    rating: 4.7,
    reviewCount: 41,
    tags: ['shopee', 'fashion', 'caption', 'hijab', 'raya'],
    previewSnippet:
      '✍️ CAPTION 1: Baju Kurung Raya\n\n[WATERMARKED PREVIEW]\n"Raya year [YEAR] incoming! Baju kurung [BRAND] ni...',
    features: [
      '40 caption templates',
      'Raya + daily + special occasion',
      'BM + English mix',
      'Emoji + hashtag guide',
      'Affiliate link placeholder',
      'Best for Shopee feed',
    ],
    contentBody:
      '✍️ CAPTION 1: Baju Kurung Raya\n\n"Raya tahun ni korang pakai apa? Baju kurung [BRAND] ni memang confirm jawab. Material [FABRIC], sulam [DETAIL]. Harga Raya [PRICE] je — bawah RM200! 🌙✨\n\n👉 Link: [AFFILIATE_LINK]\n\n#raya[year] #bajukurung #modestfashion #malaysiafashion"',
    createdAtDays: 32,
  },
  {
    id: 'lst-015',
    title: 'Fashion Hashtag Set — 180+ Malaysian Modest Wear Tags',
    description:
      '180+ hashtag马来西亚 modest fashion. Cover hijab, baju kurung, baju melayu, abaya, modest daily wear. Trending + evergreen.',
    category: 'hashtag_sets',
    platform: 'all',
    niche: 'fashion',
    price: 13.9,
    sellerId: 'seller-03',
    downloads: 267,
    rating: 4.8,
    reviewCount: 58,
    tags: ['hashtag', 'fashion', 'hijab', 'modest', 'malaysia'],
    previewSnippet:
      '#️⃣ HIJAB HASHTAGS (45)\n\n[WATERMARKED PREVIEW]\n#hijabmalaysia #tudungbawal #tudungstyle #modestfashion...',
    features: [
      '180+ organized hashtags',
      '5 fashion sub-niches',
      'Seasonal (Raya, Hari Raya Haji)',
      'Copy-paste blocks',
      'Trending tags flagged',
      'Local context (Malaysia)',
    ],
    contentBody:
      '#️⃣ HIJAB HASHTAGS (45)\n\n#hijabmalaysia #tudungbawal #tudungstyle #modestfashion #hijabstyle #tudungmurah #hijabtutorial #tudungpeople #hijabista #malaysiahijab #hijabfashion #tudungcantik #tudungviral #instanttudung #tudungpremium #hijabaddict #hijabcommunity #tudungraya #shoptudung',
    createdAtDays: 38,
  },
  {
    id: 'lst-016',
    title: 'Fashion Thumbnail PSD Pack — 15 Designs',
    description:
      '15 PSD thumbnail templates untuk fashion videos. Raya-themed, daily outfit, haul format. Editable text + image slots.',
    category: 'thumbnail_designs',
    platform: 'all',
    niche: 'fashion',
    price: 47.9,
    sellerId: 'seller-03',
    downloads: 71,
    rating: 4.9,
    reviewCount: 16,
    tags: ['thumbnail', 'psd', 'fashion', 'raya'],
    previewSnippet:
      '🖼️ PACK CONTENTS (15 designs)\n\n[WATERMARKED PREVIEW]\n1. "RAYA LOOKBOOK" gold\n2. "HAUL TIME" pink bold...',
    features: [
      '15 layered PSD files',
      'Raya + daily themes',
      'Smart object for outfit photos',
      'Manglish text overlays',
      'TikTok + Shopee sizes',
      'Font + color guide',
    ],
    contentBody:
      '🖼️ PACK CONTENTS\n\n1. "RAYA LOOKBOOK" gold gradient — TikTok 9:16\n2. "HAUL TIME" pink bold — TikTok 9:16\n3. "STYLE TIPS" minimal white — YouTube 16:9\n4. "TUDUNG REVIEW" shopee 1:1\n5-15. [Additional designs...]\n\n📁 DOWNLOAD LINKS:\n• PSD pack (1.5 GB): [DOWNLOAD_URL]',
    createdAtDays: 14,
  },
  {
    id: 'lst-017',
    title: 'Fashion Live Shopping Scripts (6 templates)',
    description:
      '6 Manglish live shopping scripts untuk fashion on Shopee Live. Cover baju kurung launch, tudung bundle, Raya collection, flash sale, giveaway.',
    category: 'live_scripts',
    platform: 'shopee',
    niche: 'fashion',
    price: 42.9,
    sellerId: 'seller-03',
    downloads: 63,
    rating: 4.8,
    reviewCount: 14,
    tags: ['shopee live', 'fashion', 'manglish', 'raya'],
    previewSnippet:
      '📡 LIVE SCRIPT 1: Baju Kurung Raya Launch (25 min)\n\n[WATERMARKED PREVIEW]\nOpening: "Selamat datang! Saya [NAME]...',
    features: [
      '6 full live scripts',
      'Raya-themed + daily',
      '20-30 min each',
      'Try-on segment flow',
      'Audience Q&A prompts',
      'Flash sale timing guide',
    ],
    contentBody:
      '📡 LIVE SCRIPT 1: Baju Kurung Raya Launch (25 min)\n\nOpening (0-3 min):\n"Selamat datang! Saya [NAME], founder [BRAND]. Hari ni kita launch baju kurung Raya koleksi baru. Trust me, korang takkan nampak design macam ni kat tempat lain. Tap heart sampai 300 — saya bagi extra 5% off!"',
    createdAtDays: 19,
  },

  // ── RumahKita DIY (seller-04) ───────────────────────────────────────────
  {
    id: 'lst-018',
    title: 'Home Living TikTok Scripts — 10 Templates',
    description:
      '10 video scripts untuk home + living products. Cover organization, decor, kitchen hacks, cleaning, smart home. Manglish + BM. 30-60s each.',
    category: 'video_scripts',
    platform: 'tiktok',
    niche: 'home',
    price: 24.9,
    sellerId: 'seller-04',
    downloads: 124,
    rating: 4.7,
    reviewCount: 28,
    tags: ['tiktok', 'home', 'living', 'organization', 'decor'],
    previewSnippet:
      '🎬 SCRIPT 1: Kitchen Organization (60s)\n\n[WATERMARKED PREVIEW]\nHook: "Dapur korang macam ni ke? Penuh sesak?',
    features: [
      '10 home living scripts',
      'Organization + decor + smart home',
      'Manglish + BM natural',
      'Before/after demo flow',
      'Affiliate CTA templates',
      'Filming setup tips',
    ],
    contentBody:
      '🎬 SCRIPT 1: Kitchen Organization (60s)\n\nHook (0-3s): "Dapur korang macam ni ke? Penuh sesak? Ni satu trick yang confirm buat korang rasa tenang tengok dapur."\n\nProblem (3-10s): [Show messy kitchen] "Macam ni la kan? Saya pun pernah macam ni."\n\nSolution (10-40s): [Show organizer] "Ni [PRODUCT]. Letak semua barang dapur — sudu, garpu, seasoning. Lihat hasil!" [Demo transformation]\n\nCTA (40-60s): "Link dekat bio. Beli sebelum sold out. Confirm rumah korang jadi macam kat magazine."',
    createdAtDays: 21,
  },
  {
    id: 'lst-019',
    title: 'Home Living Captions Pack — 35 Templates',
    description:
      '35 caption templates untuk home + living products. Cover organization, decor, kitchen, bathroom, smart home. BM + English mix.',
    category: 'captions',
    platform: 'all',
    niche: 'home',
    price: 16.9,
    sellerId: 'seller-04',
    downloads: 167,
    rating: 4.6,
    reviewCount: 35,
    tags: ['caption', 'home', 'living', 'organization'],
    previewSnippet:
      '✍️ CAPTION 1: Kitchen Organizer\n\n[WATERMARKED PREVIEW]\n"Dapur kecil tapi nak kemas? [PRODUCT] ni jawabannya...',
    features: [
      '35 caption templates',
      '5 home sub-niches',
      'BM + English mix',
      'Before/after description flow',
      'Affiliate link placeholder',
      'Emoji combos included',
    ],
    contentBody:
      '✍️ CAPTION 1: Kitchen Organizer\n\n"Dapur kecil tapi nak kemas? [PRODUCT] ni jawabannya. Compact + banyak compartment. Buat dapur korang nampak macam chef punya rumah. 🏠✨\n\n👉 Link: [AFFILIATE_LINK]\n\n#homeorganization #dapurcantik #malaysiahome"',
    createdAtDays: 33,
  },
  {
    id: 'lst-020',
    title: 'Home Hashtag Bundle — 120+ Malaysian Market Tags',
    description:
      '120+ hashtag马来西亚 home + living market. Cover organization, decor, kitchen, smart home, plants. Trending + evergreen mix.',
    category: 'hashtag_sets',
    platform: 'all',
    niche: 'home',
    price: 11.9,
    sellerId: 'seller-04',
    downloads: 213,
    rating: 4.5,
    reviewCount: 44,
    tags: ['hashtag', 'home', 'living', 'malaysia', 'decor'],
    previewSnippet:
      '#️⃣ KITCHEN HASHTAGS (30)\n\n[WATERMARKED PREVIEW]\n#dapurcantik #kitchenorganization #homeorganization #malaysiahome...',
    features: [
      '120+ organized hashtags',
      '5 home sub-niches',
      'Trending tags flagged',
      'Copy-paste blocks',
      'Malaysian context',
      'Monthly refresh guide',
    ],
    contentBody:
      '#️⃣ KITCHEN HASHTAGS (30)\n\n#dapurcantik #kitchenorganization #homeorganization #malaysiahome #rumahcantik #homedecormalaysia #dapurmalaysia #homeliving #organizationtips #declutter #tidyhome #homereno #rumahku #malaysiareno #kitchenhacks',
    createdAtDays: 42,
  },
  {
    id: 'lst-021',
    title: 'Home Live Shopping Scripts (5 templates)',
    description:
      '5 Manglish live shopping scripts untuk home + living on Shopee Live. Cover organization bundle, decor launch, smart home, flash sale.',
    category: 'live_scripts',
    platform: 'shopee',
    niche: 'home',
    price: 38.9,
    sellerId: 'seller-04',
    downloads: 48,
    rating: 4.7,
    reviewCount: 11,
    tags: ['shopee live', 'home', 'manglish', 'live script'],
    previewSnippet:
      '📡 LIVE SCRIPT 1: Home Bundle Launch (20 min)\n\n[WATERMARKED PREVIEW]\nOpening: "Welcome korang! Hari ni kita ada home bundle...',
    features: [
      '5 full live scripts',
      'Manglish + BM natural',
      '20-30 min each',
      'Bundle deal flow',
      'Demo + before/after segment',
      'Flash sale countdown',
    ],
    contentBody:
      '📡 LIVE SCRIPT 1: Home Bundle Launch (20 min)\n\nOpening (0-3 min):\n"Welcome korang! Hari ni kita ada home bundle — sampai 40% off. Saya [NAME] dari [SHOP]. Bundle ni perfect untuk yang baru pindah rumah atau nak revamp dapur. Tap heart untuk extra free gift!"',
    createdAtDays: 26,
  },

  // ── MakanKaki Foodie (seller-05) ────────────────────────────────────────
  {
    id: 'lst-022',
    title: 'Food TikTok Video Scripts — 12 Templates',
    description:
      '12 video scripts untuk food content. Cover makanan review, recipe, food haul, restaurant promo, Raya kuih. Manglish + BM. 30-60s each.',
    category: 'video_scripts',
    platform: 'tiktok',
    niche: 'food',
    price: 22.9,
    sellerId: 'seller-05',
    downloads: 134,
    rating: 4.8,
    reviewCount: 31,
    tags: ['tiktok', 'food', 'recipe', 'review', 'manglish'],
    previewSnippet:
      '🎬 SCRIPT 1: Food Review (45s)\n\n[WATERMARKED PREVIEW]\nHook: "Mee goreng ni confirmed paling sedap...',
    features: [
      '12 food video scripts',
      'Review + recipe + haul formats',
      'Manglish + BM natural',
      'Food close-up filming tips',
      'Affiliate CTA templates',
      'Raya kuih special edition',
    ],
    contentBody:
      '🎬 SCRIPT 1: Food Review (45s)\n\nHook (0-3s): "Mee goreng ni confirmed paling sedap kat [STATE]. Korang kena try."\n\nVisual (3-25s): [Show food close-up, steam, sauce dripping] "Lihat ni — aroma dia je dah buat air liur menggelegak."\n\nTaste Test (25-40s): [Eat + react] "Sedap gila! Bumbu dia kaw. Texture mee pun cantik."\n\nCTA (40-45s): "Kalau nak beli, link dekat bio. Beli sebelum sold out."',
    createdAtDays: 17,
  },
  {
    id: 'lst-023',
    title: 'Food Caption Pack — 30 Templates',
    description:
      '30 caption templates untuk food products on Shopee + TikTok. Cover snacks, instant food, kitchen ingredients, Raya kuih. BM + English mix.',
    category: 'captions',
    platform: 'all',
    niche: 'food',
    price: 14.9,
    sellerId: 'seller-05',
    downloads: 178,
    rating: 4.7,
    reviewCount: 37,
    tags: ['caption', 'food', 'shopee', 'tiktok', 'raya'],
    previewSnippet:
      '✍️ CAPTION 1: Snack Promo\n\n[WATERMARKED PREVIEW]\n"Snack attack? [PRODUCT] ni memang...',
    features: [
      '30 caption templates',
      'Snacks + instant + ingredients + kuih',
      'BM + English mix',
      'Emoji combos that convert',
      'Affiliate link placeholder',
      'Raya kuih edition',
    ],
    contentBody:
      '✍️ CAPTION 1: Snack Promo\n\n"Snack attack? [PRODUCT] ni memang jawab. Sedap + takde perasaan tiruan. Family pack [QTY] dalam RM[PRICE] je — murah gila! 🍜\n\n👉 Link: [AFFILIATE_LINK]\n\n#malaysiafood #snackaddict #shopeefood"',
    createdAtDays: 24,
  },
  {
    id: 'lst-024',
    title: 'Food Hashtag Set — 100+ Malaysian F&B Tags',
    description:
      '100+ hashtag马来西亚 food + beverage market. Cover snacks, instant food, recipe, restaurant, Raya kuih. Trending + evergreen.',
    category: 'hashtag_sets',
    platform: 'all',
    niche: 'food',
    price: 10.9,
    sellerId: 'seller-05',
    downloads: 245,
    rating: 4.6,
    reviewCount: 52,
    tags: ['hashtag', 'food', 'malaysia', 'shopeefood', 'recipe'],
    previewSnippet:
      '#️⃣ SNACK HASHTAGS (25)\n\n[WATERMARKED PREVIEW]\n#malaysiasnack #snackaddict #shopeefood #foodtiktok...',
    features: [
      '100+ organized hashtags',
      '5 food sub-niches',
      'Raya kuih seasonal tags',
      'Copy-paste blocks',
      'Malaysian food context',
      'Trending tags flagged',
    ],
    contentBody:
      '#️⃣ SNACK HASHTAGS (25)\n\n#malaysiasnack #snackaddict #shopeefood #foodtiktok #malaysiafood #snackreview #kuihraya #foodiemalaysia #makanmalaysia #sedap #makanarea #foodtiktokmy #snackviral #keropok #snackmurah',
    createdAtDays: 36,
  },
  {
    id: 'lst-025',
    title: 'Food Email Newsletter Templates (6 pack)',
    description:
      '6 email templates untuk F&B e-commerce: new product, recipe blog, flash sale, bundle, Raya promo, review request. Mailchimp + Klaviyo ready.',
    category: 'email_templates',
    platform: 'all',
    niche: 'food',
    price: 28.9,
    sellerId: 'seller-05',
    downloads: 39,
    rating: 4.5,
    reviewCount: 8,
    tags: ['email', 'food', 'newsletter', 'f&b', 'raya'],
    previewSnippet:
      '📧 NEW PRODUCT EMAIL\n\n[WATERMARKED PREVIEW]\nSubject: [PRODUCT] dah available! 🍜...',
    features: [
      '6 full email templates',
      'New product + sale + recipe + review',
      'Mailchimp + Klaviyo ready',
      'Mobile-optimized HTML',
      'BM + English A/B subject',
      'Raya promo edition',
    ],
    contentBody:
      '📧 NEW PRODUCT EMAIL\n\nSubject: [PRODUCT] dah available! 🍜\n\nHi [FIRST_NAME],\n\n[PRODUCT] officially in stock! Snack yang viral kat TikTok sekarang available di [SHOP].\n\nHarga: RM[PRICE]\nBundle: [BUNDLE_DEAL]\n\n[SHOP NOW BUTTON]',
    createdAtDays: 29,
  },

  // ── DesignerDanial (seller-06) ──────────────────────────────────────────
  {
    id: 'lst-026',
    title: 'Mega Thumbnail PSD Bundle — 20 Designs (All Niches)',
    description:
      '20 PSD thumbnail templates covering all 5 niches (beauty, tech, fashion, home, food). Universal design system. Editable layers + smart objects. Best value pack.',
    category: 'thumbnail_designs',
    platform: 'all',
    niche: 'beauty',
    price: 79.9,
    originalPrice: 129.9,
    sellerId: 'seller-06',
    downloads: 156,
    rating: 5.0,
    reviewCount: 38,
    tags: ['thumbnail', 'psd', 'bundle', 'all niches', 'best value'],
    previewSnippet:
      '🖼️ MEGA BUNDLE — 20 DESIGNS\n\n[WATERMARKED PREVIEW]\n1. Beauty — "GLOW UP" pastel\n2. Tech — "BEST PICK?" bold...',
    features: [
      '20 layered PSD files',
      'Covers all 5 niches',
      'TikTok + YouTube + Shopee sizes',
      'Smart object product slot',
      'Universal color system',
      'Manglish + BM overlays',
      'Font pack included',
    ],
    contentBody:
      '🖼️ MEGA BUNDLE — 20 DESIGNS\n\n1. Beauty — "GLOW UP" pastel — TikTok 9:16\n2. Tech — "BEST PICK?" bold yellow — YouTube 16:9\n3. Fashion — "RAYA LOOK" gold — TikTok 9:16\n4. Home — "MAKEOVER" minimal — YouTube 16:9\n5. Food — "SEDAP!" red bold — TikTok 9:16\n6-20. [Additional designs across all niches]\n\n📁 DOWNLOAD LINKS:\n• PSD pack (3.2 GB): [DOWNLOAD_URL_1]\n• Font pack (200 MB): [DOWNLOAD_URL_2]\n• Color guide PDF: [DOWNLOAD_URL_3]\n\n📝 USAGE:\nSmart object layer = product photo slot. Edit text layers as needed.',
    createdAtDays: 11,
  },
  {
    id: 'lst-027',
    title: 'Canva Thumbnail Templates — 25 Editable Designs',
    description:
      '25 Canva-editable thumbnail templates. No Photoshop needed. All niches covered. Direct Canva link, customize + download in minutes.',
    category: 'thumbnail_designs',
    platform: 'all',
    niche: 'tech',
    price: 34.9,
    sellerId: 'seller-06',
    downloads: 89,
    rating: 4.9,
    reviewCount: 21,
    tags: ['canva', 'thumbnail', 'editable', 'no photoshop'],
    previewSnippet:
      '🖼️ CANVA TEMPLATES — 25 DESIGNS\n\n[WATERMARKED PREVIEW]\nDirect Canva link + video tutorial included...',
    features: [
      '25 Canva templates',
      'No Photoshop needed',
      'Direct Canva link',
      'Video tutorial included',
      'All niches covered',
      'Mobile + desktop edit friendly',
    ],
    contentBody:
      '🖼️ CANVA TEMPLATES — 25 DESIGNS\n\nYou will receive a Canva template link (click → duplicate to your account). Then edit text, swap images, download.\n\n📁 ACCESS:\n• Canva link: [CANVA_URL]\n• Video tutorial: [TUTORIAL_URL]\n• Bonus font list: [FONT_URL]\n\n📝 NOTES:\nFree Canva account works. Some premium elements may require Canva Pro.',
    createdAtDays: 7,
  },
  {
    id: 'lst-028',
    title: 'Live Stream Overlay PSD Pack (10 designs)',
    description:
      '10 PSD overlay designs for Shopee Live / TikTok Live. Include price banner, flash sale countdown, "Sold Out" badge, giveaway banner. Editable.',
    category: 'thumbnail_designs',
    platform: 'all',
    niche: 'fashion',
    price: 54.9,
    sellerId: 'seller-06',
    downloads: 47,
    rating: 4.8,
    reviewCount: 9,
    tags: ['overlay', 'psd', 'shopee live', 'tiktok live'],
    previewSnippet:
      '🖼️ OVERLAY PACK — 10 DESIGNS\n\n[WATERMARKED PREVIEW]\n1. Price banner (animated)\n2. Flash sale countdown...',
    features: [
      '10 PSD overlay files',
      'Price banner + countdown + sold out',
      'PNG transparent exports',
      'Animated GIF versions',
      'Transparent backgrounds',
      'Universal size (1080x1920)',
    ],
    contentBody:
      '🖼️ OVERLAY PACK — 10 DESIGNS\n\n1. Price banner (animated) — bottom strip\n2. Flash sale countdown — top corner\n3. "SOLD OUT" badge\n4. Giveaway banner\n5. "Coming Up" tease\n6-10. [Additional overlays]\n\n📁 DOWNLOAD LINKS:\n• PSD pack (800 MB): [DOWNLOAD_URL_1]\n• PNG exports (transparent): [DOWNLOAD_URL_2]\n• Animated GIFs: [DOWNLOAD_URL_3]',
    createdAtDays: 13,
  },

  // ── LiveQueen Nadia (seller-07) ─────────────────────────────────────────
  {
    id: 'lst-029',
    title: 'Mega Live Shopping Script Bundle (20 scripts)',
    description:
      '20 proven Manglish live shopping scripts. Cover all niches + all occasions (Raya, 11.11, 12.12, payday, flash sale). 15-45 min each. Best value for live hosts.',
    category: 'live_scripts',
    platform: 'shopee',
    niche: 'food',
    price: 89.9,
    originalPrice: 149.9,
    sellerId: 'seller-07',
    downloads: 124,
    rating: 4.9,
    reviewCount: 31,
    tags: ['shopee live', 'mega bundle', 'manglish', 'all niches'],
    previewSnippet:
      '📡 MEGA LIVE BUNDLE — 20 SCRIPTS\n\n[WATERMARKED PREVIEW]\n1. Raya Beauty Launch (25 min)\n2. 11.11 Tech Flash Sale (40 min)...',
    features: [
      '20 full live shopping scripts',
      'All 5 niches covered',
      'All major sale occasions',
      '15-45 min each',
      'Manglish + BM natural',
      'Audience interaction prompts',
      'Conversion framework included',
    ],
    contentBody:
      '📡 MEGA LIVE BUNDLE — 20 SCRIPTS\n\n1. Raya Beauty Launch (25 min)\n2. 11.11 Tech Flash Sale (40 min)\n3. 12.12 Fashion Mega Sale (35 min)\n4. Payday Home Bundle (20 min)\n5. Food Festival Live (30 min)\n6-20. [Additional scripts across all niches + occasions]\n\nEach script includes: opening hook, product reveal, demo, flash sale pitch, Q&A, closing CTA.',
    createdAtDays: 9,
  },
  {
    id: 'lst-030',
    title: 'Live Shopping Masterclass Email Templates (8 pack)',
    description:
      '8 email templates untuk promote live shopping events. Pre-live hype, live reminder, post-live replay, flash sale alert, VIP early access.',
    category: 'email_templates',
    platform: 'all',
    niche: 'home',
    price: 32.9,
    sellerId: 'seller-07',
    downloads: 52,
    rating: 4.7,
    reviewCount: 11,
    tags: ['email', 'live shopping', 'newsletter', 'shopee live'],
    previewSnippet:
      '📧 PRE-LIVE HYPE EMAIL\n\n[WATERMARKED PREVIEW]\nSubject: LIVE dekat [SHOP] malam ni! 📡 Join sekarang...',
    features: [
      '8 email templates',
      'Pre-live + reminder + post-live',
      'VIP early access sequence',
      'Mobile-optimized HTML',
      'BM + English A/B subject lines',
      'Klaviyo + Mailchimp ready',
    ],
    contentBody:
      '📧 PRE-LIVE HYPE EMAIL\n\nSubject: LIVE dekat [SHOP] malam ni! 📡 Join sekarang\n\nHi [FIRST_NAME],\n\nMalas nak miss deals? Live shopping [SHOP] malam ni [TIME]!\n\nYang akan saya showcase:\n• [PRODUCT_1]\n• [PRODUCT_2]\n• [PRODUCT_3]\n\nFlash sale harga special untuk yang join live je.\n\n[SET REMINDER BUTTON]',
    createdAtDays: 23,
  },

  // ── EmailPro MY (seller-08) ─────────────────────────────────────────────
  {
    id: 'lst-031',
    title: 'E-commerce Email Sequence Master Pack (15 templates)',
    description:
      '15 email templates covering full e-commerce lifecycle: welcome, browse abandon, cart abandon, purchase, post-purchase, review request, win-back, VIP. All niches.',
    category: 'email_templates',
    platform: 'all',
    niche: 'fashion',
    price: 59.9,
    sellerId: 'seller-08',
    downloads: 87,
    rating: 4.6,
    reviewCount: 19,
    tags: ['email', 'sequence', 'ecommerce', 'klaviyo', 'lifecycle'],
    previewSnippet:
      '📧 WELCOME SEQUENCE (3 emails)\n\n[WATERMARKED PREVIEW]\nEmail 1: Welcome + 10% off\nEmail 2: Brand story...',
    features: [
      '15 email templates',
      'Full e-commerce lifecycle',
      '7 sequences (welcome, browse, cart, etc.)',
      'HTML + plain text',
      'Klaviyo + Mailchimp ready',
      'Conversion copywriting framework',
      'Subject line A/B suggestions',
    ],
    contentBody:
      '📧 WELCOME SEQUENCE (3 emails)\n\nEmail 1: Welcome + 10% off\nSubject: Welcome to [BRAND]! 🎉 10% off inside\n\nHi [FIRST_NAME],\nWelcome to [BRAND] family! Gunakan code WELCOME10 untuk 10% off first order.\n\n[SHOP NOW]\n\nEmail 2: Brand story\nSubject: Kami mula dari [STORY]...\n\nEmail 3: Best sellers\nSubject: Yang orang paling suka dari kami...\n\n[...continues for all 15 templates...]',
    createdAtDays: 20,
  },
  {
    id: 'lst-032',
    title: 'Raya Mega Email Templates Bundle (10 templates)',
    description:
      '10 Raya-themed email templates untuk e-commerce. Pre-Raya hype, Raya launch, flash sale, last chance, Raya collection spotlight, post-Raya thank you.',
    category: 'email_templates',
    platform: 'all',
    niche: 'food',
    price: 42.9,
    sellerId: 'seller-08',
    downloads: 64,
    rating: 4.8,
    reviewCount: 14,
    tags: ['email', 'raya', 'ecommerce', 'newsletter', 'bundle'],
    previewSnippet:
      '📧 PRE-RAYA HYPE EMAIL\n\n[WATERMARKED PREVIEW]\nSubject: Raya [YEAR] incoming! 🌙 Special collection inside...',
    features: [
      '10 Raya-themed templates',
      'Pre + during + post Raya sequence',
      'Mobile-optimized HTML',
      'BM + English A/B subject lines',
      'Raya visual design system',
      'Klaviyo + Mailchimp ready',
    ],
    contentBody:
      '📧 PRE-RAYA HYPE EMAIL\n\nSubject: Raya [YEAR] incoming! 🌙 Special collection inside\n\nHi [FIRST_NAME],\n\nRaya makin dekat! Kalau korang still tak sure nak pakai apa, jangan risau — koleksi Raya [BRAND] dah land.\n\nFeatured:\n• [PRODUCT_1] — RM[PRICE]\n• [PRODUCT_2] — RM[PRICE]\n• [PRODUCT_3] — RM[PRICE]\n\nEarly bird: [DISCOUNT]% off until [DATE].\n\n[SHOP RAYA COLLECTION]',
    createdAtDays: 6,
  },
]

// ─── Reviews (12) ───────────────────────────────────────────────────────────

export const MOCK_REVIEWS: ListingReview[] = [
  {
    id: 'rev-001',
    listingId: 'lst-001',
    reviewerName: 'Aisyah B.',
    reviewerAvatar: avatar('reviewer-aisyah'),
    rating: 5,
    comment: 'Sumpah best gila! Pakai script tu untuk serum Raya — video saya viral 80k views. Confirm worth every sen.',
    createdAt: daysAgo(8),
  },
  {
    id: 'rev-002',
    listingId: 'lst-001',
    reviewerName: 'Farah K.',
    reviewerAvatar: avatar('reviewer-farah'),
    rating: 5,
    comment: 'Scripts dia natural, tak del fake. Manglish spot on. Layan!',
    createdAt: daysAgo(12),
  },
  {
    id: 'rev-003',
    listingId: 'lst-002',
    reviewerName: 'Nadia R.',
    reviewerAvatar: avatar('reviewer-nadia'),
    rating: 5,
    comment: '50 caption tu semua siap pakai. Edit sikit je untuk produk saya. Save masa gila.',
    createdAt: daysAgo(5),
  },
  {
    id: 'rev-004',
    listingId: 'lst-003',
    reviewerName: 'Huda M.',
    reviewerAvatar: avatar('reviewer-huda'),
    rating: 4,
    comment: 'Hashtag memang banyak + organized. Tapi harap update lagi untuk 2025 trending.',
    createdAt: daysAgo(15),
  },
  {
    id: 'rev-005',
    listingId: 'lst-004',
    reviewerName: 'Siti A.',
    reviewerAvatar: avatar('reviewer-siti'),
    rating: 5,
    comment: 'Live script dia very detail. Pakai masa Shopee Live Raya — sales naik 3x! Recommended.',
    createdAt: daysAgo(4),
  },
  {
    id: 'rev-006',
    listingId: 'lst-007',
    reviewerName: 'Daniel L.',
    reviewerAvatar: avatar('reviewer-daniel'),
    rating: 5,
    comment: 'Tech review scripts dia pro level. Hook-nya memang catchy. Worth beli.',
    createdAt: daysAgo(9),
  },
  {
    id: 'rev-007',
    listingId: 'lst-009',
    reviewerName: 'Ariff K.',
    reviewerAvatar: avatar('reviewer-ariff'),
    rating: 4,
    comment: 'Hashtag bundle bagus, tapi some tags macam tak relevant untuk Malaysia. Otherwise solid.',
    createdAt: daysAgo(18),
  },
  {
    id: 'rev-008',
    listingId: 'lst-013',
    reviewerName: 'Hanis Z.',
    reviewerAvatar: avatar('reviewer-hanis'),
    rating: 5,
    comment: 'Hijab styling scripts dia creative. Tudung bawal tutorial tu paling banyak view dalam account saya.',
    createdAt: daysAgo(7),
  },
  {
    id: 'rev-009',
    listingId: 'lst-026',
    reviewerName: 'Jun T.',
    reviewerAvatar: avatar('reviewer-jun'),
    rating: 5,
    comment: 'Mega bundle PSD memang value for money. 20 designs for RM79? Steal! Quality designer level.',
    createdAt: daysAgo(3),
  },
  {
    id: 'rev-010',
    listingId: 'lst-029',
    reviewerName: 'Ling W.',
    reviewerAvatar: avatar('reviewer-ling'),
    rating: 5,
    comment: 'Mega live bundle ni game-changer untuk Shopee Live host. Sales saya naik 2.5x selepas pakai scripts ni.',
    createdAt: daysAgo(6),
  },
  {
    id: 'rev-011',
    listingId: 'lst-031',
    reviewerName: 'Mei Y.',
    reviewerAvatar: avatar('reviewer-mei'),
    rating: 4,
    comment: 'Email templates bagus, conversion-focused. BM subject lines perlu tweak sikit untuk natural flow.',
    createdAt: daysAgo(11),
  },
  {
    id: 'rev-012',
    listingId: 'lst-006',
    reviewerName: 'Carmen T.',
    reviewerAvatar: avatar('reviewer-carmen'),
    rating: 5,
    comment: 'Beauty thumbnail PSD pack — cantik gila. Edit text je, ready untuk post. Highly recommend.',
    createdAt: daysAgo(2),
  },
]

// ─── Build MarketplaceListing objects ───────────────────────────────────────

function buildListing(seed: ListingSeed): MarketplaceListing {
  const seller = MOCK_SELLERS.find((s) => s.id === seed.sellerId)!
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    category: seed.category,
    platform: seed.platform,
    niche: seed.niche,
    price: seed.price,
    originalPrice: seed.originalPrice,
    sellerId: seed.sellerId,
    sellerName: seller.name,
    sellerAvatar: seller.avatar,
    downloads: seed.downloads,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    previewUrl: thumbnail(seed.id),
    tags: seed.tags,
    previewSnippet: seed.previewSnippet,
    features: seed.features,
    content: {
      body: seed.contentBody,
      usageNotes:
        'Replace [PRODUCT], [PRICE], [BRAND], [AFFILIATE_LINK] with your own. Ganti [NAME] dengan nama sendiri untuk personal touch.',
    },
    isActive: true,
    createdAt: daysAgo(seed.createdAtDays),
    updatedAt: daysAgo(Math.max(1, seed.createdAtDays - 1)),
  }
}

export const MOCK_LISTINGS: MarketplaceListing[] = LISTING_SEEDS.map(buildListing)

// ─── Lookup helpers ─────────────────────────────────────────────────────────

export function getListingById(id: string): MarketplaceListing | undefined {
  return MOCK_LISTINGS.find((l) => l.id === id)
}

export function getReviewsForListing(listingId: string): ListingReview[] {
  return MOCK_REVIEWS.filter((r) => r.listingId === listingId)
}

export function getSellerById(id: string): SellerProfile | undefined {
  return MOCK_SELLERS.find((s) => s.id === id)
}

export function getListingsBySeller(sellerId: string): MarketplaceListing[] {
  return MOCK_LISTINGS.filter((l) => l.sellerId === sellerId)
}

export function getFeaturedListings(limit = 5): MarketplaceListing[] {
  return [...MOCK_LISTINGS]
    .sort((a, b) => b.downloads * b.rating - a.downloads * a.rating)
    .slice(0, limit)
}

export function getRelatedListings(listing: MarketplaceListing, limit = 4): MarketplaceListing[] {
  return MOCK_LISTINGS
    .filter(
      (l) =>
        l.id !== listing.id &&
        (l.category === listing.category || l.niche === listing.niche),
    )
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, limit)
}

/**
 * Build a seller dashboard aggregate from listings + a synthetic monthly
 * sales history. The "current user" seller starts with zero everything.
 */
export function buildSellerDashboard(sellerId: string): {
  profile: SellerProfile
  listings: MarketplaceListing[]
  recentSales: import('./types').Purchase[]
  monthly: import('./types').SellerSalesPoint[]
  totalEarnings: number
  totalSales: number
  avgRating: number
  pendingPayout: number
} {
  const profile = getSellerById(sellerId) ?? MOCK_SELLERS[0]
  const listings = getListingsBySeller(sellerId)

  // For non-current-user sellers, derive monthly stats from listing downloads.
  // For the current user, returns zeros.
  const isCurrentUser = sellerId === CURRENT_SELLER_ID

  const monthly = isCurrentUser
    ? [
        { month: 'Jan', sales: 0, revenue: 0 },
        { month: 'Feb', sales: 0, revenue: 0 },
        { month: 'Mar', sales: 0, revenue: 0 },
        { month: 'Apr', sales: 0, revenue: 0 },
        { month: 'May', sales: 0, revenue: 0 },
        { month: 'Jun', sales: 0, revenue: 0 },
      ]
    : [
        { month: 'Jan', sales: 42, revenue: 1180 },
        { month: 'Feb', sales: 38, revenue: 1020 },
        { month: 'Mar', sales: 51, revenue: 1450 },
        { month: 'Apr', sales: 67, revenue: 1980 },
        { month: 'May', sales: 89, revenue: 2670 },
        { month: 'Jun', sales: 124, revenue: 3720 },
      ]

  const totalSales = isCurrentUser ? 0 : profile.totalSales
  const totalEarnings = isCurrentUser ? 0 : profile.totalRevenue
  const avgRating = isCurrentUser ? 0 : profile.rating
  const pendingPayout = isCurrentUser ? 0 : Math.round(totalEarnings * 0.15 * 100) / 100

  return {
    profile,
    listings,
    recentSales: [],
    monthly,
    totalEarnings,
    totalSales,
    avgRating,
    pendingPayout,
  }
}

// ─── User-created listings (runtime store) ─────────────────────────────────
//
// Shared in-memory store for listings created at runtime via POST.
// Both the listings collection route and the [id] detail route read/write
// this map. In production this would be the `MarketplaceListing` Prisma
// model (CHECKLIST 4.2.1).
export const userCreatedListings = new Map<string, MarketplaceListing>()

/** Returns all listings (seed + user-created) for browse/seller dashboard. */
export function getAllListings(): MarketplaceListing[] {
  return [...MOCK_LISTINGS, ...userCreatedListings.values()]
}

/** Find a listing by id across seed + user-created stores. */
export function findListingById(id: string): MarketplaceListing | undefined {
  return MOCK_LISTINGS.find((l) => l.id === id) ?? userCreatedListings.get(id)
}

/** Find listings owned by a seller (across seed + user-created). */
export function findListingsBySeller(
  sellerId: string,
): MarketplaceListing[] {
  return getAllListings().filter((l) => l.sellerId === sellerId)
}
