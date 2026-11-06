// ─── Shopee Live Mock Data (Malaysian context) ──────────────────────────────
// All amounts in RM (Ringgit Malaysia). Dates use ISO strings.
// Commission structure: base (2.5–12%) + Shopee Live bonus (up to +72%) = up to 80%.

import type {
  LiveAnalytics,
  LiveProduct,
  LiveScript,
  LiveSession,
  LiveSessionSummary,
  ScriptTemplate,
} from './types'
import { SCRIPT_TEMPLATES } from './script-templates'

// ─── Reusable product factory ────────────────────────────────────────────────
function makeProduct(
  id: string,
  name: string,
  category: string,
  originalPrice: number,
  livePrice: number,
  baseCommission: number,
  liveBonus: number,
  estimatedUnits: number,
  displayDurationSec: number,
  flash?: LiveProduct['flashSale']
): LiveProduct {
  const totalCommission = Math.min(baseCommission + liveBonus, 80)
  return {
    id,
    name,
    category,
    originalPrice,
    livePrice,
    flashPrice: flash?.flashPrice,
    baseCommission,
    liveBonusCommission: liveBonus,
    totalCommission,
    estimatedUnits,
    displayDurationSec,
    flashSale: flash,
  }
}

// ─── Product Catalogue (Malaysian products) ─────────────────────────────────
const P = {
  serumVC: makeProduct(
    'prod_serum_vc',
    'Vitamin C Brightening Serum 30ml',
    'Beauty',
    89.9,
    49.9,
    8,
    72,
    120,
    360,
    { enabled: true, durationMin: 5, firstNBuyers: 30, flashPrice: 39.9 }
  ),
  lipstick: makeProduct(
    'prod_lipstick',
    'Matte Lipstick Set Raya Edition (6 shades)',
    'Beauty',
    79.0,
    45.0,
    10,
    70,
    80,
    240,
    { enabled: true, durationMin: 3, firstNBuyers: 20, flashPrice: 35.0 }
  ),
  headset: makeProduct(
    'prod_headset',
    'Gaming Headset RGB Surround 7.1',
    'Gaming',
    159.0,
    99.0,
    6,
    72,
    45,
    420,
    { enabled: true, durationMin: 5, firstNBuyers: 15, flashPrice: 79.0 }
  ),
  keyboard: makeProduct(
    'prod_keyboard',
    'Mechanical Keyboard Hot-Swap RGB',
    'Gaming',
    249.0,
    169.0,
    5,
    72,
    30,
    360
  ),
  mouse: makeProduct(
    'prod_mouse',
    'Wireless Gaming Mouse 16000 DPI',
    'Gaming',
    119.0,
    79.0,
    6,
    72,
    50,
    240,
    { enabled: true, durationMin: 4, firstNBuyers: 25, flashPrice: 59.0 }
  ),
  airfryer: makeProduct(
    'prod_airfryer',
    'Air Fryer 5L Digital Touch Screen',
    'Kitchen',
    299.0,
    189.0,
    4,
    72,
    60,
    480,
    { enabled: true, durationMin: 5, firstNBuyers: 20, flashPrice: 159.0 }
  ),
  blender: makeProduct(
    'prod_blender',
    'Personal Blender Portable USB Rechargeable',
    'Kitchen',
    129.0,
    79.0,
    5,
    72,
    70,
    300,
    { enabled: true, durationMin: 3, firstNBuyers: 25, flashPrice: 59.0 }
  ),
  cookware: makeProduct(
    'prod_cookware',
    'Non-Stick Cookware Set 5pcs Granite Coating',
    'Kitchen',
    199.0,
    129.0,
    4,
    72,
    40,
    360
  ),
  phoneCase: makeProduct(
    'prod_phonecase',
    'iPhone 15 Premium Leather Case (Multi-color)',
    'Accessories',
    49.0,
    29.0,
    8,
    72,
    100,
    180
  ),
  powerbank: makeProduct(
    'prod_powerbank',
    'Powerbank 20000mAh Fast Charge PD30W',
    'Electronics',
    99.0,
    59.0,
    5,
    72,
    90,
    240,
    { enabled: true, durationMin: 4, firstNBuyers: 30, flashPrice: 45.0 }
  ),
  kurung: makeProduct(
    'prod_kurung',
    'Baju Kurung Moden Raya 2025 (Ready Stock)',
    'Fashion',
    159.0,
    99.0,
    9,
    71,
    75,
    300,
    { enabled: true, durationMin: 4, firstNBuyers: 25, flashPrice: 79.0 }
  ),
  telekung: makeProduct(
    'prod_telekung',
    'Telekung Sembahyang Cotton Premium Full Set',
    'Fashion',
    89.0,
    55.0,
    7,
    72,
    110,
    240
  ),
  speaker: makeProduct(
    'prod_speaker',
    'Bluetooth Speaker Waterproof 20W Bass Boom',
    'Electronics',
    139.0,
    89.0,
    5,
    72,
    65,
    300,
    { enabled: true, durationMin: 5, firstNBuyers: 20, flashPrice: 69.0 }
  ),
  smartwatch: makeProduct(
    'prod_smartwatch',
    'Smart Watch AMOLED Display SpO2 + ECG',
    'Electronics',
    299.0,
    189.0,
    5,
    72,
    35,
    360
  ),
  snackbox: makeProduct(
    'prod_snackbox',
    'Kuih Raya Mixed Jar Set (6 jars)',
    'Food',
    99.0,
    65.0,
    6,
    72,
    150,
    180,
    { enabled: true, durationMin: 3, firstNBuyers: 50, flashPrice: 49.0 }
  ),
}

// ─── Helper: average commission + potential earnings ────────────────────────
function computeStats(products: LiveProduct[]): {
  averageCommission: number
  potentialEarnings: number
} {
  if (products.length === 0) return { averageCommission: 0, potentialEarnings: 0 }
  const avgComm =
    products.reduce((sum, p) => sum + p.totalCommission, 0) / products.length
  const earnings = products.reduce(
    (sum, p) => sum + (p.livePrice * p.totalCommission) / 100 * p.estimatedUnits,
    0
  )
  return {
    averageCommission: Math.round(avgComm * 10) / 10,
    potentialEarnings: Math.round(earnings * 100) / 100,
  }
}

// ─── Mock scripts ────────────────────────────────────────────────────────────
const mockScripts: LiveScript[] = [
  {
    id: 'script_1',
    sessionId: 'session_3',
    productId: 'prod_airfryer',
    templateId: 'full_session',
    language: 'mix',
    tone: 'excited',
    generatedBy: 'ai',
    generatedAt: '2025-02-28T10:00:00.000Z',
    content:
      '[OPENING — 2 min]\n"Wassup everyone! Welcome to Kitchen Essentials Live Cook-Along! 🔥 Saya Kak Amy...',
  },
  {
    id: 'script_2',
    sessionId: 'session_3',
    templateId: 'flash_sale',
    language: 'mix',
    tone: 'excited',
    generatedBy: 'template',
    generatedAt: '2025-02-28T10:15:00.000Z',
    content:
      '[FLASH SALE — 2 min]\n"OK GUYS! FLASH SALE MULA SEKARANG! ⚡⚡⚡ Hanya 5 minit je!...',
  },
]

// ─── Mock Live Sessions (8 total) ──────────────────────────────────────────
// Mix of upcoming, live now, and past — Malaysian context, Raya + gaming themes.
export const MOCK_SESSIONS: LiveSession[] = [
  // 1 — Upcoming Raya Beauty Live (future date)
  {
    id: 'session_1',
    title: 'Raya Beauty Haul Live 🌙',
    description:
      'Sesi live Raya khas — beauty, skincare & makeup. Semua produk ada DISKAUN RAYA + flash sale setiap 15 minit!',
    scheduledAt: '2025-03-15T20:00:00+08:00',
    durationMin: 90,
    status: 'scheduled',
    hostName: 'Kak Amy',
    products: [P.serumVC, P.lipstick, P.telekung, P.kurung],
    tags: ['Raya', 'Beauty', 'Fashion'],
    coverImage: undefined,
    createdAt: '2025-02-20T09:00:00.000Z',
    updatedAt: '2025-03-01T11:30:00.000Z',
    scripts: [],
    ...computeStats([P.serumVC, P.lipstick, P.telekung, P.kurung]),
  },

  // 2 — Upcoming Gaming Flash Sale
  {
    id: 'session_2',
    title: 'Gaming Gear Flash Sale 🔥',
    description:
      'All-in gaming gear — headset, keyboard, mouse. Flash sale setiap produk, slot terhad!',
    scheduledAt: '2025-03-20T21:00:00+08:00',
    durationMin: 60,
    status: 'scheduled',
    hostName: 'Abang Din',
    products: [P.headset, P.keyboard, P.mouse, P.speaker, P.smartwatch],
    tags: ['Gaming', 'Electronics', 'Flash Sale'],
    createdAt: '2025-02-25T14:00:00.000Z',
    updatedAt: '2025-03-02T10:00:00.000Z',
    scripts: [],
    ...computeStats([P.headset, P.keyboard, P.mouse, P.speaker, P.smartwatch]),
  },

  // 3 — Completed (past) Kitchen Cook-Along — has analytics
  {
    id: 'session_3',
    title: 'Kitchen Essentials Live Cook-Along 🍳',
    description:
      'Live masak-masak sambil jual barang dapur. Demo air fryer + blender, masak 3 menu Raya.',
    scheduledAt: '2025-02-28T20:00:00+08:00',
    durationMin: 120,
    status: 'completed',
    hostName: 'Chef Aida',
    products: [
      P.airfryer,
      P.blender,
      P.cookware,
      P.snackbox,
      P.powerbank,
      P.phoneCase,
    ],
    tags: ['Kitchen', 'Food', 'Cook-Along'],
    createdAt: '2025-02-10T09:00:00.000Z',
    updatedAt: '2025-03-01T08:00:00.000Z',
    startedAt: '2025-02-28T20:00:00+08:00',
    endedAt: '2025-02-28T22:00:00+08:00',
    viewerCount: 1234,
    peakViewerCount: 891,
    actualEarnings: 4567.5,
    scripts: mockScripts,
    ...computeStats([P.airfryer, P.blender, P.cookware, P.snackbox, P.powerbank, P.phoneCase]),
  },

  // 4 — Live NOW
  {
    id: 'session_4',
    title: 'Gadget Madness Live — Sunday Special ⚡',
    description:
      'Live sekarang! Powerbank, smartwatch, speaker — flash sale 5 minit je setiap produk!',
    scheduledAt: '2025-03-08T20:30:00+08:00',
    durationMin: 75,
    status: 'live',
    hostName: 'Farah Tech',
    products: [P.powerbank, P.speaker, P.smartwatch, P.phoneCase],
    tags: ['Electronics', 'Live Now', 'Gadgets'],
    createdAt: '2025-02-15T09:00:00.000Z',
    updatedAt: '2025-03-08T20:31:00.000Z',
    startedAt: '2025-03-08T20:30:00+08:00',
    viewerCount: 487,
    peakViewerCount: 612,
    scripts: [],
    ...computeStats([P.powerbank, P.speaker, P.smartwatch, P.phoneCase]),
  },

  // 5 — Completed Beauty Live
  {
    id: 'session_5',
    title: 'Glam Up Raya — Beauty Edition 💄',
    description:
      'Tutorial makeup Raya + jual set produk. Demo lipstick + serum VC.',
    scheduledAt: '2025-02-22T20:00:00+08:00',
    durationMin: 90,
    status: 'completed',
    hostName: 'Kak Amy',
    products: [P.serumVC, P.lipstick, P.telekung, P.kurung, P.phoneCase],
    tags: ['Beauty', 'Raya', 'Fashion'],
    createdAt: '2025-02-05T09:00:00.000Z',
    updatedAt: '2025-02-23T08:00:00.000Z',
    startedAt: '2025-02-22T20:00:00+08:00',
    endedAt: '2025-02-22T21:30:00+08:00',
    viewerCount: 2156,
    peakViewerCount: 1543,
    actualEarnings: 7821.0,
    scripts: [],
    ...computeStats([P.serumVC, P.lipstick, P.telekung, P.kurung, P.phoneCase]),
  },

  // 6 — Completed Gaming Live
  {
    id: 'session_6',
    title: 'Gaming Setup Build — Pro Edition 🎮',
    description:
      'Build gaming setup complete — keyboard + mouse + headset. Demo gameplay sambil jual.',
    scheduledAt: '2025-02-15T21:00:00+08:00',
    durationMin: 105,
    status: 'completed',
    hostName: 'Abang Din',
    products: [P.headset, P.keyboard, P.mouse, P.speaker, P.smartwatch],
    tags: ['Gaming', 'Electronics'],
    createdAt: '2025-01-28T09:00:00.000Z',
    updatedAt: '2025-02-16T08:00:00.000Z',
    startedAt: '2025-02-15T21:00:00+08:00',
    endedAt: '2025-02-15T22:45:00+08:00',
    viewerCount: 3489,
    peakViewerCount: 2310,
    actualEarnings: 11234.75,
    scripts: [],
    ...computeStats([P.headset, P.keyboard, P.mouse, P.speaker, P.smartwatch]),
  },

  // 7 — Upcoming Raya Kuih & Food
  {
    id: 'session_7',
    title: 'Kuih Raya Festival Live 🍪',
    description:
      'Tasting kuih raya 6 jars, demo baking + flash sale setiap 20 minit. Sempurnakan meja raya korang!',
    scheduledAt: '2025-03-25T15:00:00+08:00',
    durationMin: 60,
    status: 'scheduled',
    hostName: 'Mak Cik Nora',
    products: [P.snackbox, P.cookware, P.blender],
    tags: ['Food', 'Raya', 'Cook-Along'],
    createdAt: '2025-03-01T09:00:00.000Z',
    updatedAt: '2025-03-03T14:00:00.000Z',
    scripts: [],
    ...computeStats([P.snackbox, P.cookware, P.blender]),
  },

  // 8 — Cancelled
  {
    id: 'session_8',
    title: 'Back to School Tech Live 📚',
    description:
      'Sesi live dibatalkan kerana masalah teknikal. Akan dijadualkan semula.',
    scheduledAt: '2025-03-05T20:00:00+08:00',
    durationMin: 60,
    status: 'cancelled',
    hostName: 'Farah Tech',
    products: [P.powerbank, P.phoneCase, P.smartwatch],
    tags: ['Electronics', 'Cancelled'],
    createdAt: '2025-02-18T09:00:00.000Z',
    updatedAt: '2025-03-04T18:00:00.000Z',
    scripts: [],
    ...computeStats([P.powerbank, P.phoneCase, P.smartwatch]),
  },
]

// ─── Analytics for completed sessions ────────────────────────────────────────
function buildAnalytics(
  sessionId: string,
  viewers: number,
  peakViewers: number,
  earnings: number,
  products: LiveProduct[]
): LiveAnalytics {
  const totalEstimatedUnits = products.reduce((s, p) => s + p.estimatedUnits, 0)
  const totalClicks = Math.round(viewers * 0.42) // 42% of viewers click
  const conversions = Math.round(totalClicks * 0.18) // 18% click→purchase
  const conversionRate = Math.round((conversions / totalClicks) * 1000) / 10
  const baseCommissionTotal = Math.round(
    products.reduce(
      (s, p) => s + (p.livePrice * p.baseCommission) / 100 * p.estimatedUnits,
      0
    ) * 100
  ) / 100
  const liveBonusTotal = Math.round((earnings - baseCommissionTotal) * 100) / 100

  // Generate viewer timeline (every 10 min)
  const timelinePoints = 12
  const viewerTimeline = Array.from({ length: timelinePoints }, (_, i) => {
    // bell-ish curve, peak at middle
    const factor = Math.sin((i / (timelinePoints - 1)) * Math.PI)
    return {
      time: `${String(Math.floor((i * 10) / 60)).padStart(2, '0')}:${String((i * 10) % 60).padStart(2, '0')}`,
      viewers: Math.round(viewers * 0.4 + (peakViewers - viewers * 0.4) * factor),
    }
  })

  return {
    sessionId,
    viewers,
    peakViewers,
    avgViewDurationSec: 540 + Math.round(Math.random() * 300),
    clicks: totalClicks,
    conversions,
    conversionRate,
    earnings: Math.round(earnings * 100) / 100,
    potentialCommission: Math.round(
      products.reduce(
        (s, p) => s + (p.livePrice * p.totalCommission) / 100 * p.estimatedUnits,
        0
      ) * 100
    ) / 100,
    topProducts: products.slice(0, 3).map((p) => ({
      productId: p.id,
      name: p.name,
      unitsSold: Math.round(p.estimatedUnits * 0.65),
      earnings: Math.round(
        ((p.livePrice * p.totalCommission) / 100 * p.estimatedUnits * 0.65) * 100
      ) / 100,
      conversionRate: 18 + Math.round(Math.random() * 12),
    })),
    viewerTimeline,
    funnel: {
      impressions: viewers * 3,
      clicks: totalClicks,
      addToCart: Math.round(totalClicks * 0.45),
      purchases: conversions,
    },
    earningsBreakdown: {
      baseCommission: Math.max(0, baseCommissionTotal),
      liveBonus: Math.max(0, liveBonusTotal),
      total: Math.round(earnings * 100) / 100,
    },
  }
}

export const MOCK_ANALYTICS: Record<string, LiveAnalytics> = {
  session_3: buildAnalytics('session_3', 1234, 891, 4567.5, [
    P.airfryer,
    P.blender,
    P.cookware,
    P.snackbox,
    P.powerbank,
    P.phoneCase,
  ]),
  session_5: buildAnalytics('session_5', 2156, 1543, 7821.0, [
    P.serumVC,
    P.lipstick,
    P.telekung,
    P.kurung,
    P.phoneCase,
  ]),
  session_6: buildAnalytics('session_6', 3489, 2310, 11234.75, [
    P.headset,
    P.keyboard,
    P.mouse,
    P.speaker,
    P.smartwatch,
  ]),
  // Live-now analytics (partial — session still ongoing)
  session_4: buildAnalytics('session_4', 487, 612, 1289.5, [
    P.powerbank,
    P.speaker,
    P.smartwatch,
    P.phoneCase,
  ]),
}

// ─── Summary across all sessions ────────────────────────────────────────────
export function getMockSummary(): LiveSessionSummary {
  const sessions = MOCK_SESSIONS
  const completed = sessions.filter((s) => s.status === 'completed')
  const liveNow = sessions.filter((s) => s.status === 'live')
  const upcoming = sessions.filter((s) => s.status === 'scheduled')
  const totalViewers = completed.reduce((s, x) => s + (x.viewerCount ?? 0), 0) +
    liveNow.reduce((s, x) => s + (x.viewerCount ?? 0), 0)
  const totalEarnings = completed.reduce((s, x) => s + (x.actualEarnings ?? 0), 0)
  const avgConversionRate = 18.4 // from analytics
  const avgCommission =
    sessions.reduce((s, x) => s + x.averageCommission, 0) / sessions.length

  return {
    totalSessions: sessions.length,
    liveNow: liveNow.length,
    liveNowIds: liveNow.map((s) => s.id),
    upcoming: upcoming.length,
    completed: completed.length,
    totalViewers,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    avgConversionRate,
    avgCommission: Math.round(avgCommission * 10) / 10,
  }
}

// ─── Sample script templates exposed via the data module ─────────────────────
export const SAMPLE_TEMPLATES: ScriptTemplate[] = SCRIPT_TEMPLATES
