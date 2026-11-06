/**
 * Malaysian Seasonal Events Database — Fasa 3.8 (Task 3-H)
 *
 * Sales events, public holidays, and cultural festivals that drive
 * affiliate engagement in Malaysia. Each event includes a commission
 * multiplier, recommended niches, content themes, and hashtags.
 *
 * Variable-date events (Ramadan/Raya, Deepavali) use approximate
 * fixed dates per year for the current generation cycle. The AI
 * prompt builder uses the `activeFor` helper to determine relevance.
 */

import type { SeasonalEvent } from './types'

// ─── Master Event Catalog ────────────────────────────────────────────────────

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'cny',
    name: 'Chinese New Year',
    emoji: '🧧',
    description: 'Lunar New Year shopping rush — angpow deals, reunion dinner essentials, fashion & gifting.',
    month: 2,
    day: 10,
    leadInDays: 14,
    commissionMultiplier: 1.3,
    recommendedNiches: ['fashion', 'home', 'food', 'beauty'],
    contentThemes: [
      'CNY outfit haul',
      'Reunion dinner must-haves',
      'Angpow-ready gifting picks',
      'Festive home makeover',
      'CNY beauty look tutorial',
    ],
    hashtags: ['#CNY', '#ChineseNewYear', '#Angpow', '#CNY2025', '#FestiveHaul', '#GongXiFaCai'],
  },
  {
    id: 'ramadan-raya',
    name: 'Ramadan & Hari Raya Aidilfitri',
    emoji: '🌙',
    description: 'Holy month of Ramadan leading into Raya — baju raya, kuih raya, hampers, decor, and gifting peak.',
    month: 3,
    day: 11,
    leadInDays: 21,
    commissionMultiplier: 1.5,
    recommendedNiches: ['fashion', 'food', 'home', 'beauty'],
    contentThemes: [
      'Baju Raya lookbook',
      'Kuih Raya recipes & ready-to-buy picks',
      'Raya hampers gifting guide',
      'Raya home decor makeover',
      'Sahur & iftar quick meal kits',
      'Raya skincare glow-up routine',
    ],
    hashtags: ['#Ramadan', '#HariRaya', '#Raya2025', '#BajuRaya', '#KuihRaya', '#RayaHampers', '#SelamatHariRaya'],
  },
  {
    id: '99-sale',
    name: '9.9 Super Sale',
    emoji: '🛒',
    description: 'September 9 mega sale on Shopee/Lazada — electronics, vouchers, and free shipping bonanza.',
    month: 9,
    day: 9,
    leadInDays: 7,
    commissionMultiplier: 1.4,
    recommendedNiches: ['tech', 'home', 'beauty', 'mixed'],
    contentThemes: [
      '9.9 flash deals roundup',
      'Tech gadget steals under RM100',
      'Voucher stacking tutorial',
      'Free shipping hack guide',
      '9.9 wishlist reveal',
    ],
    hashtags: ['#99Sale', '#Shopee99', '#Lazada99', '#MegaSale', '#FlashDeal', '#Budol'],
  },
  {
    id: '1010-sale',
    name: '10.10 Sale',
    emoji: '🏷️',
    description: 'October 10 mid-month mega sale — back-to-school restocks and beauty hauls.',
    month: 10,
    day: 10,
    leadInDays: 7,
    commissionMultiplier: 1.35,
    recommendedNiches: ['beauty', 'fashion', 'home', 'mixed'],
    contentThemes: [
      '10.10 beauty restock list',
      'Back-to-school essentials',
      'Fashion refresh for year-end',
      'Coupon code megathread',
    ],
    hashtags: ['#1010Sale', '#Shopee1010', '#Lazada1010', '#MegaSale', '#SaleAlert'],
  },
  {
    id: '1111-sale',
    name: '11.11 Mega Sale',
    emoji: '🎉',
    description: 'BIGGEST sale day of the year — Singles Day. Everything from premium tech to daily essentials on deep discount.',
    month: 11,
    day: 11,
    leadInDays: 14,
    commissionMultiplier: 1.8,
    recommendedNiches: ['tech', 'beauty', 'fashion', 'home', 'food', 'mixed'],
    contentThemes: [
      '11.11 ultimate wishlist',
      'Premium tech splurge picks',
      'Beauty haul: skincare, makeup, hair',
      'Home appliance upgrades',
      '11.11 vs 12.12 strategy',
      'Cart-building livestream',
      'Voucher hunting masterclass',
      'Pre-11.11 prep checklist',
    ],
    hashtags: ['#1111Sale', '#SinglesDay', '#Shopee1111', '#Lazada1111', '#MegaSale', '#Budol', '#RacunShopee'],
  },
  {
    id: '1212-sale',
    name: '12.12 Sale',
    emoji: '🎄',
    description: 'December 12 year-end sale — last-chance gifting and Christmas-adjacent deals.',
    month: 12,
    day: 12,
    leadInDays: 7,
    commissionMultiplier: 1.45,
    recommendedNiches: ['fashion', 'beauty', 'home', 'mixed'],
    contentThemes: [
      '12.12 last-minute gifts',
      'Year-end fashion clearance',
      'Christmas stocking fillers',
      'New Year home refresh',
      '12.12 voucher stack guide',
    ],
    hashtags: ['#1212Sale', '#Shopee1212', '#Lazada1212', '#YearEndSale', '#ChristmasSale'],
  },
  {
    id: 'merdeka',
    name: 'Hari Merdeka',
    emoji: '🇲🇾',
    description: 'National Day (Independence Day) — patriotic content, local brand spotlights, Merdeka-themed sales.',
    month: 8,
    day: 31,
    leadInDays: 7,
    commissionMultiplier: 1.2,
    recommendedNiches: ['fashion', 'home', 'food', 'mixed'],
    contentThemes: [
      'Local Malaysian brand spotlight',
      'Merdeka-themed outfit ideas',
      'Patriotic home decor',
      'Made-in-Malaysia product picks',
      'Merdeka sale deals roundup',
    ],
    hashtags: ['#Merdeka', '#MerdekaDay', '#SayangiMalaysia', '#MalaysiaBoleh', '#BeliMalaysia'],
  },
  {
    id: 'malaysia-day',
    name: 'Malaysia Day',
    emoji: '🇲🇾',
    description: 'Formation of Malaysia — East Malaysian brand spotlights and unity-themed content.',
    month: 9,
    day: 16,
    leadInDays: 5,
    commissionMultiplier: 1.15,
    recommendedNiches: ['food', 'fashion', 'home', 'mixed'],
    contentThemes: [
      'Sabah & Sarawak brand spotlight',
      'Malaysian food heritage picks',
      'Unity in diversity product roundup',
      'East Malaysian artisanal finds',
    ],
    hashtags: ['#MalaysiaDay', '#SabahSarawak', '#SayangiMalaysia', '#MalaysiaBoleh'],
  },
  {
    id: 'deepavali',
    name: 'Deepavali',
    emoji: '🪔',
    description: 'Festival of Lights — Indian heritage fashion, festive sweets, decor, and gifting.',
    month: 10,
    day: 31,
    leadInDays: 14,
    commissionMultiplier: 1.3,
    recommendedNiches: ['fashion', 'food', 'home', 'beauty'],
    contentThemes: [
      'Deepavali outfit lookbook',
      'Festive sweets & treats picks',
      'Kolam & decor essentials',
      'Deepavali gifting guide',
      'Festive beauty & makeup tutorial',
    ],
    hashtags: ['#Deepavali', '#FestivalOfLights', '#Diwali', '#HappyDeepavali', '#FestiveHaul'],
  },
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    description: 'Christmas gifting peak — decor, hampers, toys, and festive fashion.',
    month: 12,
    day: 25,
    leadInDays: 14,
    commissionMultiplier: 1.35,
    recommendedNiches: ['home', 'fashion', 'beauty', 'mixed'],
    contentThemes: [
      'Christmas gift guide by recipient',
      'Festive decor haul',
      'Secret Santa picks under RM50',
      'Christmas dinner essentials',
      'Holiday party outfit ideas',
    ],
    hashtags: ['#Christmas', '#MerryChristmas', '#ChristmasSale', '#GiftGuide', '#FestiveHaul'],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns all events whose active window overlaps with the given date.
 * An event is "active" if the date falls within [eventDate - leadInDays, eventDate + 3].
 */
export function activeEventsForDate(date: Date, events: SeasonalEvent[] = SEASONAL_EVENTS): SeasonalEvent[] {
  const result: SeasonalEvent[] = []
  for (const ev of events) {
    const eventDate = new Date(date.getFullYear(), ev.month - 1, ev.day)
    // If event already passed this year by more than 3 days, check next year's instance
    let candidate = eventDate
    const diffDays = (date.getTime() - candidate.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays > 3) {
      candidate = new Date(date.getFullYear() + 1, ev.month - 1, ev.day)
    }
    const leadIn = ev.leadInDays ?? 7
    const startWindow = new Date(candidate.getTime() - leadIn * 24 * 60 * 60 * 1000)
    const endWindow = new Date(candidate.getTime() + 3 * 24 * 60 * 60 * 1000)
    if (date >= startWindow && date <= endWindow) {
      result.push(ev)
    }
  }
  return result
}

/**
 * Returns events whose peak date is within `daysAhead` days from the given date.
 * Used to show the "upcoming within 7 days" banner.
 */
export function upcomingEvents(date: Date, daysAhead: number = 7, events: SeasonalEvent[] = SEASONAL_EVENTS): SeasonalEvent[] {
  const result: SeasonalEvent[] = []
  for (const ev of events) {
    const eventDate = new Date(date.getFullYear(), ev.month - 1, ev.day)
    let candidate = eventDate
    if (candidate.getTime() < date.getTime()) {
      candidate = new Date(date.getFullYear() + 1, ev.month - 1, ev.day)
    }
    const daysUntil = (candidate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    if (daysUntil >= 0 && daysUntil <= daysAhead) {
      result.push({ ...ev, /* keep original */ })
    }
  }
  return result.sort((a, b) => {
    const aDate = new Date(date.getFullYear(), a.month - 1, a.day)
    const bDate = new Date(date.getFullYear(), b.month - 1, b.day)
    let aCand = aDate; if (aCand.getTime() < date.getTime()) aCand = new Date(date.getFullYear() + 1, a.month - 1, a.day)
    let bCand = bDate; if (bCand.getTime() < date.getTime()) bCand = new Date(date.getFullYear() + 1, b.month - 1, b.day)
    return aCand.getTime() - bCand.getTime()
  })
}

/**
 * Returns the next upcoming event (or null), and the number of days until it.
 */
export function nextEvent(date: Date, events: SeasonalEvent[] = SEASONAL_EVENTS): { event: SeasonalEvent; daysUntil: number } | null {
  let best: { event: SeasonalEvent; daysUntil: number } | null = null
  for (const ev of events) {
    const eventDate = new Date(date.getFullYear(), ev.month - 1, ev.day)
    let candidate = eventDate
    if (candidate.getTime() < date.getTime()) {
      candidate = new Date(date.getFullYear() + 1, ev.month - 1, ev.day)
    }
    const daysUntil = Math.ceil((candidate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil >= 0 && (!best || daysUntil < best.daysUntil)) {
      best = { event: ev, daysUntil }
    }
  }
  return best
}

/** Lookup an event by its stable ID. */
export function getEventById(id: string, events: SeasonalEvent[] = SEASONAL_EVENTS): SeasonalEvent | undefined {
  return events.find((e) => e.id === id)
}

/** Total number of seasonal events in the catalog. */
export const SEASONAL_EVENT_COUNT = SEASONAL_EVENTS.length
