/**
 * src/app/api/trends/radar/route.ts
 * 
 * Multi-Platform Trend Radar Feed API Route (Milestone 4).
 * Supports TikTok FYP, Xiaohongshu (XHS), Twitter/X, and YouTube Shorts.
 * 
 * Features:
 * 1. Filtering: platform, query/q, velocity, category, tier, language, minScore
 * 2. Sorting: virality, views, growth, recent, engagement
 * 3. Pagination: page, limit, totalPages (gracefully clamped)
 * 4. Dynamic Virality Scoring: Computes real-time viralityScore, tier badges, and
 *    suggested angles using TypeSafe-AI System One primitive `scoreProductVirality`.
 * 5. Rich Malaysian E-Commerce Dataset: authentic TikTok MY racun Shopee,
 *    XHS bilingual reviews, Twitter viral threads, and YouTube Shorts hacks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { scoreProductVirality } from '@/lib/typesafe-ai/primitives'
import {
  TrendRadarQueryParamsSchema,
  TrendRadarFeedItemSchema,
  type TrendRadarFeedItem,
  type TrendRadarApiResponse,
  type RadarPlatform,
  type GrowthVelocity,
} from '@/types/trend-radar'

// ============================================================================
// 1. Raw Seed Dataset (16 Multi-Platform Items Across MY Market)
// ============================================================================

interface RawSeedItem extends Omit<TrendRadarFeedItem, 'productRecommendation'> {
  productRecommendation?: {
    name: string
    shopeeUrl?: string
    category: string
    estimatedPrice: number
    originalPrice?: number
    commissionRate: number
    soldCount: number
    rating: number
  }
}

const RAW_RADAR_SEEDS: RawSeedItem[] = [
  // ─── TIKTOK FYP (MY Racun Shopee) ───────────────────────────────────────────
  {
    id: 'tt-racun-01',
    platform: 'tiktok',
    creator: {
      username: 'Aiman Racun Gadget',
      handle: 'aiman_gadgetmy',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      followerCount: '340K',
      verified: true,
    },
    postUrl: 'https://www.tiktok.com/@aiman_gadgetmy/video/7345678901234567890',
    title: 'Stand Laptop Aluminium Padu Bawah RM25 Kat Shopee!',
    hookText: 'Korang yang selalu sakit leher hadap laptop tu, stop beli stand plastik rapuh!',
    summary: 'Demonstrasi unboxing laptop stand folding aluminium tahan goyang dengan silicone pad. Sesuai untuk MacBook dan gaming laptop sehingga 17 inci.',
    productRecommendation: {
      name: 'Ergonomic Folding Aluminum Laptop Stand Heavy Duty',
      shopeeUrl: 'https://shopee.com.my/product/12345678/9012345678',
      category: 'Electronics',
      estimatedPrice: 24.90,
      originalPrice: 49.00,
      commissionRate: 12.0,
      soldCount: 14200,
      rating: 4.9,
    },
    metrics: {
      views: 850000,
      likes: 64200,
      shares: 18900,
      comments: 3120,
      growthVelocity: 'SURGING',
      engagementRate: 10.1,
      velocityMultiplier: 4.2,
      publishedAt: '2026-11-04T14:30:00Z',
    },
    tags: ['racunshopee', 'gadgetviral', 'laptopstand', 'workfromhome', 'shopeemy'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
    embedId: '7345678901234567890',
  },
  {
    id: 'tt-racun-02',
    platform: 'tiktok',
    creator: {
      username: 'Bella Skincare Diary',
      handle: 'bellaskincare_my',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      followerCount: '520K',
      verified: true,
    },
    postUrl: 'https://www.tiktok.com/@bellaskincare_my/video/7345678901234567891',
    title: 'Muka Breakout Teruk Sembuh Dalam 5 Hari Je Pakai Ni?!',
    hookText: 'Skin barrier korang rosak sebab salah pakai produk peeling? Tengok miracle ni!',
    summary: 'Review jujur Skintific 5X Ceramide Barrier Moisturizer gel. Tekstur ringan macam air, cepat serap dan tak melekit dalam cuaca panas Malaysia.',
    productRecommendation: {
      name: 'Skintific 5X Ceramide Barrier Repair Moisture Gel 30g',
      shopeeUrl: 'https://shopee.com.my/product/23456789/9012345679',
      category: 'Beauty',
      estimatedPrice: 38.50,
      originalPrice: 55.00,
      commissionRate: 15.0,
      soldCount: 48500,
      rating: 4.9,
    },
    metrics: {
      views: 1240000,
      likes: 98400,
      shares: 27500,
      comments: 5400,
      growthVelocity: 'SURGING',
      engagementRate: 10.6,
      velocityMultiplier: 5.1,
      publishedAt: '2026-11-05T08:15:00Z',
    },
    tags: ['skincareviral', 'skintificmy', 'skinbarrier', 'glowing', 'racuntiktok'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
    embedId: '7345678901234567891',
  },
  {
    id: 'tt-racun-03',
    platform: 'tiktok',
    creator: {
      username: 'Haziq Tech Deals',
      handle: 'haziqtech_finds',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      followerCount: '185K',
      verified: false,
    },
    postUrl: 'https://www.tiktok.com/@haziqtech_finds/video/7345678901234567892',
    title: 'Thermal Printer Mini Tanpa Ink! Wajib Ada Untuk Student & Bisnes',
    hookText: 'Student uni wajib tengok ni kalau malas nak salin nota tebal-tebal!',
    summary: 'Tutorial cetak nota kuliah, gambar nota kaji, dan label botol bumbu guna thermal printer poket tanpa dakwat. Sambung terus ke smartphone via Bluetooth.',
    productRecommendation: {
      name: 'Pocket Mini Wireless Thermal Printer HD Bluetooth',
      shopeeUrl: 'https://shopee.com.my/product/34567890/9012345680',
      category: 'Electronics',
      estimatedPrice: 32.00,
      originalPrice: 65.00,
      commissionRate: 10.0,
      soldCount: 8900,
      rating: 4.7,
    },
    metrics: {
      views: 420000,
      likes: 31000,
      shares: 9200,
      comments: 1450,
      growthVelocity: 'HIGH',
      engagementRate: 9.9,
      velocityMultiplier: 2.8,
      publishedAt: '2026-11-03T18:00:00Z',
    },
    tags: ['studenthacks', 'thermalprinter', 'studygrammy', 'shopeefinds'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600',
    embedId: '7345678901234567892',
  },
  {
    id: 'tt-racun-04',
    platform: 'tiktok',
    creator: {
      username: 'Dapur Che Nom Fans',
      handle: 'resepiviral_my',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      followerCount: '410K',
      verified: false,
    },
    postUrl: 'https://www.tiktok.com/@resepiviral_my/video/7345678901234567893',
    title: 'Sambal Cili Garing Rangup Bilis Padu Tak Boleh Bawa Bincang!',
    hookText: 'Diet korang confirm ke laut lepas rasa sesudu sambal garing ni...',
    summary: 'Makan nasi putih panas bersama telur mata dan taburan sambal cili garing ikan bilis extra rangup. Pedas mantap dan tak berminyak.',
    productRecommendation: {
      name: "Sambal Garing Che' Nor Extra Crispy Spicy 160g",
      shopeeUrl: 'https://shopee.com.my/product/45678901/9012345681',
      category: 'Food & Beverages',
      estimatedPrice: 13.90,
      commissionRate: 8.0,
      soldCount: 35000,
      rating: 4.8,
    },
    metrics: {
      views: 610000,
      likes: 45000,
      shares: 11200,
      comments: 1890,
      growthVelocity: 'HIGH',
      engagementRate: 9.5,
      velocityMultiplier: 2.4,
      publishedAt: '2026-11-02T11:45:00Z',
    },
    tags: ['sambalviral', 'sambalgaring', 'makananviral', 'racunshopee'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    embedId: '7345678901234567893',
  },

  // ─── XIAOHONGSHU / 小红书 (Bilingual Skincare/Gadget/Lifestyle) ───────────────
  {
    id: 'xhs-review-01',
    platform: 'xhs',
    creator: {
      username: 'Chloe in KL',
      handle: 'chloe_lifestyle_kl',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      followerCount: '195K',
      verified: true,
    },
    postUrl: 'https://www.xiaohongshu.com/discovery/item/6543210987654321098',
    title: '打工人每天喝足2L水神器！磨砂渐变高颜值大容量水壶 (Shopee 2L Water Bottle)',
    hookText: '每次上班总是忘记喝水？Shopee RM16 入手的ins风渐变刻度水杯真的太香了！',
    summary: '马来西亚炎热天气打工族与健身房必备。带吸管与时间刻度提示，磨砂手感高级且防漏。附 Shopee 真实入手链接与清洁小贴士。',
    productRecommendation: {
      name: '2L Gradient Motivational Water Bottle with Straw & Time Marker',
      shopeeUrl: 'https://shopee.com.my/product/56789012/9012345682',
      category: 'Home & Living',
      estimatedPrice: 16.80,
      originalPrice: 32.00,
      commissionRate: 10.0,
      soldCount: 22000,
      rating: 4.8,
    },
    metrics: {
      views: 310000,
      likes: 28400,
      shares: 8900,
      comments: 1220,
      growthVelocity: 'SURGING',
      engagementRate: 12.4,
      velocityMultiplier: 3.8,
      publishedAt: '2026-11-04T10:00:00Z',
    },
    tags: ['小红书好物推荐', '马来西亚生活', 'shopeefinds', 'aesthetic', 'waterbottle'],
    language: 'zh',
    thumbnailUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600',
    embedId: '6543210987654321098',
  },
  {
    id: 'xhs-review-02',
    platform: 'xhs',
    creator: {
      username: 'SkinLab MY',
      handle: 'skinlab_malaysia',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      followerCount: '280K',
      verified: true,
    },
    postUrl: 'https://www.xiaohongshu.com/discovery/item/6543210987654321099',
    title: '空瓶3支良心测评！油痘肌闭口黑头救星 The Ordinary 烟酰胺精华原液',
    hookText: 'T区出油到可以煎蛋？毛孔粗大反复长闭口？百元内真正有效的成分党天花板！',
    summary: '针对马来西亚高温湿热气候，测评 The Ordinary Niacinamide 10% + Zinc 1% 的控油与提亮效果。附 Shopee 官方正品防伪辨别技巧。',
    productRecommendation: {
      name: 'The Ordinary Niacinamide 10% + Zinc 1% High-Strength Vitamin 30ml',
      shopeeUrl: 'https://shopee.com.my/product/67890123/9012345683',
      category: 'Beauty',
      estimatedPrice: 29.90,
      originalPrice: 45.00,
      commissionRate: 9.0,
      soldCount: 18500,
      rating: 4.9,
    },
    metrics: {
      views: 290000,
      likes: 21500,
      shares: 6400,
      comments: 980,
      growthVelocity: 'HIGH',
      engagementRate: 10.0,
      velocityMultiplier: 2.6,
      publishedAt: '2026-11-03T16:20:00Z',
    },
    tags: ['护肤测评', '油痘肌', 'theordinary', 'shopeemy', '小红书种草'],
    language: 'zh',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600',
    embedId: '6543210987654321099',
  },
  {
    id: 'xhs-review-03',
    platform: 'xhs',
    creator: {
      username: 'Sherry 独居日记',
      handle: 'sherry_room_deco',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      followerCount: '110K',
      verified: false,
    },
    postUrl: 'https://www.xiaohongshu.com/discovery/item/6543210987654321100',
    title: '吉隆坡租房党改造！免打孔无痕强力置物架 (Bathroom Adhesive Rack)',
    hookText: '房东严禁钻孔钉墙？RM11 的强力贴片角架挂满沐浴露完全不掉！',
    summary: '实测无痕强力胶贴在浴室瓷砖上的防水承重表现。极简哑光黑色与极简白双色可选，小空间收纳必备。',
    productRecommendation: {
      name: 'Heavy Duty Adhesive Wall Mounted Corner Rack Waterproof',
      shopeeUrl: 'https://shopee.com.my/product/78901234/9012345684',
      category: 'Home & Living',
      estimatedPrice: 11.50,
      commissionRate: 14.0,
      soldCount: 11200,
      rating: 4.7,
    },
    metrics: {
      views: 180000,
      likes: 14300,
      shares: 4100,
      comments: 630,
      growthVelocity: 'STABLE',
      engagementRate: 10.6,
      velocityMultiplier: 1.4,
      publishedAt: '2026-10-29T12:00:00Z',
    },
    tags: ['租房改造', '独居生活', '收纳好物', '家居美学'],
    language: 'zh',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
    embedId: '6543210987654321100',
  },
  {
    id: 'xhs-review-04',
    platform: 'xhs',
    creator: {
      username: 'Marcus Tech Review',
      handle: 'marcus_audio_my',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      followerCount: '160K',
      verified: true,
    },
    postUrl: 'https://www.xiaohongshu.com/discovery/item/6543210987654321101',
    title: '百元价位降噪耳机天花板：Edifier W820NB Plus 深度使用半年测评',
    hookText: '学生党自习室降噪神机，谁还要花一两千买索尼？Shopee RM149 性价比无敌！',
    summary: '测评有源主动降噪 (ANC) 深度、通话麦克风音质以及戴眼镜长时间佩戴的耳罩舒适度。支持 Hi-Res Audio 与 LDAC 高清解码。',
    productRecommendation: {
      name: 'Edifier W820NB Plus Wireless Over-Ear Active Noise Cancelling Headphones',
      shopeeUrl: 'https://shopee.com.my/product/89012345/9012345685',
      category: 'Electronics',
      estimatedPrice: 149.00,
      originalPrice: 229.00,
      commissionRate: 7.0,
      soldCount: 6400,
      rating: 4.8,
    },
    metrics: {
      views: 240000,
      likes: 19200,
      shares: 5100,
      comments: 870,
      growthVelocity: 'HIGH',
      engagementRate: 10.5,
      velocityMultiplier: 2.2,
      publishedAt: '2026-11-01T15:10:00Z',
    },
    tags: ['数码测评', '降噪耳机', 'edifier', '学生党平价好物'],
    language: 'zh',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    embedId: '6543210987654321101',
  },

  // ─── TWITTER / X (Viral Malaysian E-Commerce Threads & Flash Drops) ──────────
  {
    id: 'tw-thread-01',
    platform: 'twitter',
    creator: {
      username: 'Farhan Gadget Thread',
      handle: 'farhan_techMY',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      followerCount: '92K',
      verified: false,
    },
    postUrl: 'https://twitter.com/farhan_techMY/status/1789012345678901234',
    title: '[THREAD] 🧵 5 Gadget Shopee Bawah RM50 Yang Korang Wajib Ada Dalam Beg!',
    hookText: 'Korang yang selalu travel bawak 3 adapter charger berbeza tu stop bazir ruang beg! Benda ni charge laptop + phone serentak!',
    summary: 'Thread mendalam review Baseus GaN 65W Fast Charger 3-port. Ringan, teknologi Gallium Nitride sejuk tak panas, support PD fast charge untuk iPhone dan Type-C laptop.',
    productRecommendation: {
      name: 'Baseus GaN 65W Fast Charger Quick Charge 3-Port Type-C + USB',
      shopeeUrl: 'https://shopee.com.my/product/90123456/9012345686',
      category: 'Electronics',
      estimatedPrice: 48.90,
      originalPrice: 89.00,
      commissionRate: 11.0,
      soldCount: 19800,
      rating: 4.9,
    },
    metrics: {
      views: 780000,
      likes: 24500,
      shares: 14200,
      comments: 890,
      growthVelocity: 'SURGING',
      engagementRate: 5.1,
      velocityMultiplier: 3.5,
      publishedAt: '2026-11-05T02:30:00Z',
    },
    tags: ['thread', 'gadgetmalaysia', 'baseus', 'shopeefinds', 'racuntwitter'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600',
    embedId: '1789012345678901234',
  },
  {
    id: 'tw-thread-02',
    platform: 'twitter',
    creator: {
      username: 'Deals Hunter MY',
      handle: 'dealshunter_my',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      followerCount: '210K',
      verified: true,
    },
    postUrl: 'https://twitter.com/dealshunter_my/status/1789012345678901235',
    title: '🚨 WEH AIR FRYER RUSSELL TAYLORS 3.8L CLEAR STOCK DROP RM99 JE!',
    hookText: 'Siapa tengah cari air fryer bajet student / rumah sewa, grab voucher sekarang sebelum habis pukul 12!',
    summary: 'Drop harga rasmi payday sale Shopee Mall. Kapasiti 3.8L muat seekor ayam, non-stick basket senang cuci dan jimat elektrik dapur.',
    productRecommendation: {
      name: 'Russell Taylors Air Fryer 3.8L Matte Black Rapid Air AF-24',
      shopeeUrl: 'https://shopee.com.my/product/11223344/9012345687',
      category: 'Home & Living',
      estimatedPrice: 99.00,
      originalPrice: 189.00,
      commissionRate: 8.0,
      soldCount: 27000,
      rating: 4.8,
    },
    metrics: {
      views: 950000,
      likes: 31200,
      shares: 19800,
      comments: 1140,
      growthVelocity: 'SURGING',
      engagementRate: 5.5,
      velocityMultiplier: 4.8,
      publishedAt: '2026-11-04T18:00:00Z',
    },
    tags: ['shopeepayday', 'diskaunmy', 'airfryer', 'jualanmurah'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600',
    embedId: '1789012345678901235',
  },
  {
    id: 'tw-thread-03',
    platform: 'twitter',
    creator: {
      username: 'Scent & Lifestyle MY',
      handle: 'scentguy_my',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
      followerCount: '64K',
      verified: false,
    },
    postUrl: 'https://twitter.com/scentguy_my/status/1789012345678901236',
    title: 'Perfume Bau Expensive Tahan 8 Jam Tapi Harga RM39 Kat Shopee',
    hookText: 'Kolega office ingat aku sembur Dior Sauvage ratus-ratus... padahal beli lokal Shopee je!',
    summary: 'Ulasan De\'Xandra EDP Club Man 35ml. Sillage kuat, aroma citrus bergamot bercampur woody cedarwood maskulin. Botol kompak senang bawak travel.',
    productRecommendation: {
      name: "De'Xandra Twist EDP Men Series Long Lasting 35ml",
      shopeeUrl: 'https://shopee.com.my/product/22334455/9012345688',
      category: 'Beauty',
      estimatedPrice: 39.00,
      commissionRate: 13.0,
      soldCount: 16300,
      rating: 4.8,
    },
    metrics: {
      views: 380000,
      likes: 12800,
      shares: 7200,
      comments: 420,
      growthVelocity: 'HIGH',
      engagementRate: 5.4,
      velocityMultiplier: 2.1,
      publishedAt: '2026-11-02T09:30:00Z',
    },
    tags: ['perfumemalaysia', 'racunperfume', 'shopeemy', 'dexandra'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600',
    embedId: '1789012345678901236',
  },
  {
    id: 'tw-thread-04',
    platform: 'twitter',
    creator: {
      username: 'Deko Rumah Bajet',
      handle: 'dekorumah_bajet',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      followerCount: '135K',
      verified: false,
    },
    postUrl: 'https://twitter.com/dekorumah_bajet/status/1789012345678901237',
    title: 'DIY Dinding Bilik Muji Modal Bawah RM80 Pakai 3D Brick Foam Shopee',
    hookText: 'Dinding bilik sewa kusam bertompok? Transformasi bilik aesthetic tanpa cat kotor!',
    summary: 'Panduan step-by-step menampal foam brick 3D kalis air. Pelekat kuat tapi tak koyakkan cat dinding bila buka. Jimat modal renovate rumah sewa.',
    productRecommendation: {
      name: '3D Brick Wallpaper Foam Self-Adhesive Waterproof 70x77cm',
      shopeeUrl: 'https://shopee.com.my/product/33445566/9012345689',
      category: 'Home & Living',
      estimatedPrice: 2.80,
      commissionRate: 15.0,
      soldCount: 54000,
      rating: 4.7,
    },
    metrics: {
      views: 450000,
      likes: 16100,
      shares: 9800,
      comments: 530,
      growthVelocity: 'STABLE',
      engagementRate: 5.9,
      velocityMultiplier: 1.5,
      publishedAt: '2026-10-31T14:00:00Z',
    },
    tags: ['dekorasirumah', 'rumahsewa', 'diybiliktidur', 'shopeefinds'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
    embedId: '1789012345678901237',
  },

  // ─── YOUTUBE SHORTS (Viral DIY, Tech & Fashion Hacks) ───────────────────────
  {
    id: 'yt-shorts-01',
    platform: 'shorts',
    creator: {
      username: 'TechSmart Asia',
      handle: 'techsmart_asia',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      followerCount: '890K',
      verified: true,
    },
    postUrl: 'https://www.youtube.com/shorts/abcdef12345',
    title: 'Stop Buying RM100 Smart Bulbs! Shopee RM18 RGB WiFi Bulb Setup',
    hookText: 'Did you know you can automate your entire room lighting with voice commands for under RM20?',
    summary: '60-second setup connecting Tuya smart LED bulb to Alexa and Google Home. Infinite RGB colors, music sync mode, and scheduled sunrise wake-up alarms.',
    productRecommendation: {
      name: 'Tuya Smart WiFi RGB LED Light Bulb 9W E27 Alexa/Google Home',
      shopeeUrl: 'https://shopee.com.my/product/44556677/9012345690',
      category: 'Electronics',
      estimatedPrice: 18.90,
      originalPrice: 35.00,
      commissionRate: 12.0,
      soldCount: 24500,
      rating: 4.8,
    },
    metrics: {
      views: 1100000,
      likes: 82000,
      shares: 21400,
      comments: 3200,
      growthVelocity: 'SURGING',
      engagementRate: 9.7,
      velocityMultiplier: 4.5,
      publishedAt: '2026-11-04T05:00:00Z',
    },
    tags: ['smarthome', 'techhacks', 'shopeehaul', 'rgblighting', 'alexa'],
    language: 'en',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?w=600',
    embedId: 'abcdef12345',
  },
  {
    id: 'yt-shorts-02',
    platform: 'shorts',
    creator: {
      username: 'Hijab & Style Daily',
      handle: 'hijabstyle_daily',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      followerCount: '310K',
      verified: false,
    },
    postUrl: 'https://www.youtube.com/shorts/abcdef12346',
    title: 'How to Iron Bawal Hijab in 30 Seconds with Handheld Steamer!',
    hookText: 'Late for office and your hijab is full of wrinkles? Watch this magic cordless iron hack!',
    summary: 'Demonstrasi seterika wap mudah alih lipat untuk gosok tudung bawal dan kemeja tanpa guna papan seterika. Ringan dan cepat panas dalam masa 20 saat.',
    productRecommendation: {
      name: 'Portable Handheld Garment Steamer Foldable Iron 800W Fast Heat',
      shopeeUrl: 'https://shopee.com.my/product/55667788/9012345691',
      category: 'Home & Living',
      estimatedPrice: 27.50,
      originalPrice: 59.00,
      commissionRate: 10.0,
      soldCount: 15200,
      rating: 4.7,
    },
    metrics: {
      views: 520000,
      likes: 38400,
      shares: 12100,
      comments: 1100,
      growthVelocity: 'HIGH',
      engagementRate: 9.9,
      velocityMultiplier: 2.5,
      publishedAt: '2026-11-03T07:20:00Z',
    },
    tags: ['hijabhacks', 'garmentsteamer', 'racuntudung', 'lifehacksmalaysia'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=600',
    embedId: 'abcdef12346',
  },
  {
    id: 'yt-shorts-03',
    platform: 'shorts',
    creator: {
      username: 'Digital Nomad Gear',
      handle: 'nomadgear_asia',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      followerCount: '450K',
      verified: true,
    },
    postUrl: 'https://www.youtube.com/shorts/abcdef12347',
    title: 'Ultimate Travel Cable Organizer Bag: What’s In My Tech Pouch?',
    hookText: 'Your backpack cables look like a tangled bird nest? This RM13 Shopee pouch saved my life!',
    summary: 'Double-layer waterproof gadget pouch keeping power banks, charging cables, hard drives, SD cards, and earbuds completely organized for travel and cafes.',
    productRecommendation: {
      name: 'Waterproof Double Layer Digital Electronics Cable Organizer Bag',
      shopeeUrl: 'https://shopee.com.my/product/66778899/9012345692',
      category: 'Electronics',
      estimatedPrice: 13.50,
      originalPrice: 28.00,
      commissionRate: 14.0,
      soldCount: 31000,
      rating: 4.9,
    },
    metrics: {
      views: 740000,
      likes: 56000,
      shares: 16800,
      comments: 1950,
      growthVelocity: 'SURGING',
      engagementRate: 10.1,
      velocityMultiplier: 3.9,
      publishedAt: '2026-11-04T12:00:00Z',
    },
    tags: ['techorganizer', 'digitalnomad', 'travelgear', 'shopeefinds'],
    language: 'en',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600',
    embedId: 'abcdef12347',
  },
  {
    id: 'yt-shorts-04',
    platform: 'shorts',
    creator: {
      username: 'Amelia OOTD Hacks',
      handle: 'amelia_ootd',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      followerCount: '275K',
      verified: false,
    },
    postUrl: 'https://www.youtube.com/shorts/abcdef12348',
    title: 'Viral RM22 Shopee Knit Cardigan: 3 Outfit Ideas for Modest & Chic Look',
    hookText: 'I bought the most viral RM22 knit cardigan on Shopee to see if the fabric is actually soft...',
    summary: 'Styling cardigan rajut gaya Korea untuk gaya kasual harian, kerja di pejabat berhawa dingin, dan santai hujung minggu. Tidak panas dan berkualiti tinggi.',
    productRecommendation: {
      name: 'Korean Style V-Neck Knit Cropped Cardigan Long Sleeve',
      shopeeUrl: 'https://shopee.com.my/product/77889900/9012345693',
      category: 'Fashion',
      estimatedPrice: 22.90,
      originalPrice: 42.00,
      commissionRate: 11.0,
      soldCount: 18900,
      rating: 4.7,
    },
    metrics: {
      views: 480000,
      likes: 34200,
      shares: 9400,
      comments: 870,
      growthVelocity: 'HIGH',
      engagementRate: 9.3,
      velocityMultiplier: 2.3,
      publishedAt: '2026-11-01T10:30:00Z',
    },
    tags: ['fashionhacks', 'cardigankorea', 'ootdmalaysia', 'shopeehaul'],
    language: 'ms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
    embedId: 'abcdef12348',
  },
]

// ============================================================================
// 2. Dynamic Virality Calculation Cache / Enricher
// ============================================================================

/**
 * Enriches seed items with deterministic real-time virality calculations
 * using TypeSafe-AI System One decision primitives.
 */
function enrichFeedItemsWithDynamicVirality(rawItems: RawSeedItem[]): TrendRadarFeedItem[] {
  return rawItems.map((raw) => {
    let productRecommendation: TrendRadarFeedItem['productRecommendation']

    if (raw.productRecommendation) {
      const p = raw.productRecommendation
      // Dynamically calculate virality score using verified mathematical primitive
      const scored = scoreProductVirality({
        title: p.name,
        price: p.estimatedPrice,
        originalPrice: p.originalPrice,
        commissionRate: p.commissionRate,
        soldCount: p.soldCount ?? 0,
        rating: p.rating ?? 4.5,
        category: p.category,
        trendKeywords: raw.tags,
      })

      productRecommendation = {
        name: p.name,
        shopeeUrl: p.shopeeUrl,
        category: p.category,
        estimatedPrice: p.estimatedPrice,
        originalPrice: p.originalPrice,
        commissionRate: p.commissionRate,
        soldCount: p.soldCount ?? 0,
        rating: p.rating ?? 4.5,
        viralityScore: scored.viralityScore,
        viralityTier: scored.tier,
        suggestedAngles: scored.suggestedAngles,
        priceImpulseScore: scored.priceImpulseScore,
        commissionRoiScore: scored.commissionRoiScore,
        socialProofScore: scored.socialProofScore,
        trendAlignmentScore: scored.trendAlignmentScore,
      }
    }

    return TrendRadarFeedItemSchema.parse({
      ...raw,
      productRecommendation,
    })
  })
}

// ============================================================================
// 3. API Route Handler (GET)
// ============================================================================

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(request: Request | NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters with fallbacks
    const rawQueryParams = {
      platform: searchParams.get('platform') || 'all',
      query: searchParams.get('query') || searchParams.get('q') || undefined,
      velocity: searchParams.get('velocity') || 'all',
      category: searchParams.get('category') || undefined,
      tier: searchParams.get('tier') || 'all',
      language: searchParams.get('language') || 'all',
      minScore: searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      sortBy: searchParams.get('sortBy') || 'virality',
    }

    // Validate parameters with Zod schema
    const parseResult = TrendRadarQueryParamsSchema.safeParse(rawQueryParams)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: parseResult.error.flatten(),
        },
        {
          status: 400,
          headers: CORS_HEADERS,
        }
      )
    }

    const {
      platform,
      query,
      velocity,
      category,
      tier,
      language,
      minScore,
      limit,
      page,
      sortBy,
    } = parseResult.data

    // 1. Enrich raw seed items dynamically with TypeSafe-AI virality engine
    const allEnrichedItems = enrichFeedItemsWithDynamicVirality(RAW_RADAR_SEEDS)

    // 2. Multi-Platform & Attribute Filtering
    let filtered = allEnrichedItems.filter((item) => {
      // Platform filter
      if (platform !== 'all' && item.platform !== platform) {
        return false
      }

      // Velocity filter
      if (velocity !== 'all' && item.metrics.growthVelocity !== velocity) {
        return false
      }

      // Category filter
      if (category && category !== 'all') {
        const itemCat = item.productRecommendation?.category?.toLowerCase() || ''
        if (itemCat !== category.toLowerCase()) {
          return false
        }
      }

      // Virality Tier filter
      if (tier !== 'all') {
        const itemTier = item.productRecommendation?.viralityTier
        if (itemTier !== tier) {
          return false
        }
      }

      // Language filter
      if (language !== 'all' && item.language !== language) {
        return false
      }

      // Minimum Virality Score filter
      if (minScore !== undefined) {
        const score = item.productRecommendation?.viralityScore ?? 0
        if (score < minScore) {
          return false
        }
      }

      // Search query filter (matches title, hook, summary, tags, creator, product)
      if (query && query.trim().length > 0) {
        const q = query.trim().toLowerCase()
        const matchesTitle = item.title.toLowerCase().includes(q)
        const matchesHook = item.hookText.toLowerCase().includes(q)
        const matchesSummary = item.summary.toLowerCase().includes(q)
        const matchesCreator =
          item.creator.username.toLowerCase().includes(q) ||
          item.creator.handle.toLowerCase().includes(q)
        const matchesTags = item.tags.some((tag) => tag.toLowerCase().includes(q))
        const matchesProduct =
          item.productRecommendation?.name.toLowerCase().includes(q) ||
          item.productRecommendation?.category.toLowerCase().includes(q)

        if (!matchesTitle && !matchesHook && !matchesSummary && !matchesCreator && !matchesTags && !matchesProduct) {
          return false
        }
      }

      return true
    })

    // 3. Sorting Engine
    filtered.sort((a, b) => {
      if (sortBy === 'virality') {
        const scoreA = a.productRecommendation?.viralityScore ?? 0
        const scoreB = b.productRecommendation?.viralityScore ?? 0
        return scoreB - scoreA
      }
      if (sortBy === 'views') {
        return b.metrics.views - a.metrics.views
      }
      if (sortBy === 'growth') {
        const velocityWeight: Record<GrowthVelocity, number> = {
          SURGING: 3,
          HIGH: 2,
          STABLE: 1,
        }
        const weightDiff = velocityWeight[b.metrics.growthVelocity] - velocityWeight[a.metrics.growthVelocity]
        if (weightDiff !== 0) return weightDiff
        return b.metrics.views - a.metrics.views
      }
      if (sortBy === 'engagement') {
        const rateA = a.metrics.engagementRate ?? 0
        const rateB = b.metrics.engagementRate ?? 0
        return rateB - rateA
      }
      if (sortBy === 'recent') {
        const dateA = a.metrics.publishedAt ? new Date(a.metrics.publishedAt).getTime() : 0
        const dateB = b.metrics.publishedAt ? new Date(b.metrics.publishedAt).getTime() : 0
        return dateB - dateA
      }
      return 0
    })

    // 4. Pagination
    const total = filtered.length
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedItems = filtered.slice(offset, offset + limit)

    // 5. Aggregate Metadata
    const totalSurging = filtered.filter((i) => i.metrics.growthVelocity === 'SURGING').length
    const scoreSum = filtered.reduce((acc, i) => acc + (i.productRecommendation?.viralityScore ?? 0), 0)
    const avgViralityScore = total > 0 ? Math.round((scoreSum / total) * 10) / 10 : 0

    // Compute top category
    const categoryCounts: Record<string, number> = {}
    for (const item of filtered) {
      const cat = item.productRecommendation?.category || 'General'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    }
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'All'

    // Compute platform distribution
    const platformDistribution: Record<RadarPlatform, number> = {
      tiktok: 0,
      xhs: 0,
      twitter: 0,
      shorts: 0,
    }
    for (const item of filtered) {
      if (platformDistribution[item.platform] !== undefined) {
        platformDistribution[item.platform]++
      }
    }

    const responsePayload: TrendRadarApiResponse = {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages,
      activeFilters: {
        platform,
        velocity,
        category,
        query,
        tier,
        sortBy,
      },
      meta: {
        totalSurging,
        avgViralityScore,
        topCategory,
        platformDistribution,
        generatedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        ...CORS_HEADERS,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to process Trend Radar feed request',
        message: error?.message || 'Internal server error',
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    )
  }
}

// ============================================================================
// 4. CORS Preflight Support (OPTIONS)
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}
