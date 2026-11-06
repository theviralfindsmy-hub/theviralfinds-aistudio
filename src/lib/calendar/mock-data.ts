/**
 * Mock data for the AI Content Calendar — Fasa 3.8 (Task 3-H)
 *
 * Provides:
 *  - `MOCK_CALENDAR_PREFERENCES`: default preferences for the UI form.
 *  - `MOCK_PAST_CALENDARS`: 3 past weekly calendars for the "history" panel.
 *  - `MOCK_GENERATED_CALENDAR`: a fully-formed example calendar returned
 *    by the algorithmic fallback when the AI is unavailable.
 *
 * All data uses Malaysian context (RM, Manglish tone, MYT timezone,
 * Shopee/TikTok/Lazada platforms).
 */

import type {
  CalendarEntry,
  CalendarPreferences,
  ContentCalendar,
  DayOfWeek,
  TimeSlot,
} from './types'
import { TIME_SLOTS, DAYS_OF_WEEK } from './types'
import { SEASONAL_EVENTS } from './seasonal-events'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeLabel(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`
}

function entryFromTemplate(
  id: string,
  day: DayOfWeek,
  timeSlot: TimeSlot,
  platform: CalendarEntry['platform'],
  product: string,
  contentBrief: string,
  hashtags: string[],
  scores: { engagement: number; conversion: number; virality: number; seasonal: number },
  seasonalEventId?: string,
): CalendarEntry {
  const meta = TIME_SLOTS.find((t) => t.id === timeSlot)!
  const overall = Math.round(
    (scores.engagement * 0.3 +
      scores.conversion * 0.35 +
      scores.virality * 0.25 +
      scores.seasonal * 0.1),
  )
  return {
    id,
    day,
    timeSlot,
    hour: meta.hour,
    minute: meta.minute,
    timeLabel: formatTimeLabel(meta.hour, meta.minute),
    platform,
    product,
    contentBrief,
    hashtags,
    predictedScore: { ...scores, overall },
    seasonalEventId,
  }
}

function isoForWeeksAgo(weeks: number, mondayOffset = 0): string {
  const now = new Date()
  // Find Monday of current week
  const day = now.getDay() // 0=Sun ... 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday - weeks * 7 + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

function isoForNextMonday(): string {
  return isoForWeeksAgo(0, 7)
}

// ─── Default Preferences ──────────────────────────────────────────────────────

export const MOCK_CALENDAR_PREFERENCES: CalendarPreferences = {
  niche: 'beauty',
  platforms: ['shopee', 'tiktok'],
  postsPerDay: 2,
  tone: 'casual',
  seasonalBoost: true,
  featuredProducts: [
    'Garnier Vitamin C Serum',
    'Xiaomi Redmi Buds 5',
    'Philips Air Fryer',
  ],
}

// ─── Past Calendar #1 (3 weeks ago — Beauty / Raya theme) ────────────────────

const pastCalendar1: ContentCalendar = {
  id: 'past-cal-1',
  weekStartDate: isoForWeeksAgo(3),
  weekEndDate: isoForWeeksAgo(3, 6),
  label: 'Week of ' + isoForWeeksAgo(3) + ' (Raya prep)',
  preferences: { ...MOCK_CALENDAR_PREFERENCES, niche: 'beauty' },
  seasonalEvents: [SEASONAL_EVENTS.find((e) => e.id === 'ramadan-raya')!],
  source: 'ai',
  generatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  entries: [
    entryFromTemplate(
      'p1-mon-peak', 'Mon', 'peak', 'tiktok',
      'Garnier Vitamin C Serum',
      'Raya glow-up — share a 5-step skincare routine featuring the serum. Show before/after on cheek.',
      ['#RayaGlow', '#SkincareRoutine', '#GarnierMalaysia', '#ad'],
      { engagement: 82, conversion: 71, virality: 88, seasonal: 90 },
      'ramadan-raya',
    ),
    entryFromTemplate(
      'p1-tue-lunch', 'Tue', 'lunch', 'shopee',
      'Baju Raya Set — Kurung Modern',
      'Quick try-on haul of 3 baju raya picks under RM120. Show how each looks + comfort test.',
      ['#BajuRaya', '#Raya2025', '#FashionHaul', '#promosi'],
      { engagement: 75, conversion: 84, virality: 70, seasonal: 92 },
      'ramadan-raya',
    ),
    entryFromTemplate(
      'p1-wed-evening', 'Wed', 'evening', 'lazada',
      'Kuih Raya Assorted Jar',
      'Kuih raya jar unboxing + taste test. Compare 3 brands for the best gifting value.',
      ['#KuihRaya', '#RayaHampers', '#TasteTest', '#ad'],
      { engagement: 70, conversion: 79, virality: 60, seasonal: 88 },
      'ramadan-raya',
    ),
    entryFromTemplate(
      'p1-thu-peak', 'Thu', 'peak', 'tiktok',
      'Somethinc Niacinamide Serum',
      'Pimple-before-Raya rescue routine. Quick demo: niacinamide + spot treatment before bed.',
      ['#SkincareRoutine', '#Somethinc', '#RayaGlow', '#promosi'],
      { engagement: 85, conversion: 73, virality: 80, seasonal: 85 },
      'ramadan-raya',
    ),
    entryFromTemplate(
      'p1-fri-peak', 'Fri', 'peak', 'tiktok',
      'Raya Makeup Look — Wardah',
      'Soft glam Raya look tutorial in 60s. Use shopee link for the full makeup set.',
      ['#RayaMakeup', '#WardahBeauty', '#MakeupTutorial', '#ad'],
      { engagement: 90, conversion: 76, virality: 92, seasonal: 91 },
      'ramadan-raya',
    ),
    entryFromTemplate(
      'p1-sat-lunch', 'Sat', 'lunch', 'shopee',
      'Raya Hamper Bundle',
      'Raya hamper pickup — show what’s inside each tier (RM50 / RM100 / RM200). Best for whom.',
      ['#RayaHampers', '#RayaGifting', '#ShopeeMY', '#promosi'],
      { engagement: 73, conversion: 88, virality: 65, seasonal: 90 },
      'ramadan-raya',
    ),
    entryFromTemplate(
      'p1-sun-night', 'Sun', 'night', 'tiktok',
      'Cetaphil Gentle Cleanser',
      'Post-Raya-event skincare reset. Double cleanse demo to remove makeup gently.',
      ['#SkincareReset', '#Cetaphil', '#RayaGlow', '#ad'],
      { engagement: 76, conversion: 70, virality: 72, seasonal: 80 },
      'ramadan-raya',
    ),
  ],
}

// ─── Past Calendar #2 (2 weeks ago — Tech / 9.9 sale theme) ──────────────────

const pastCalendar2: ContentCalendar = {
  id: 'past-cal-2',
  weekStartDate: isoForWeeksAgo(2),
  weekEndDate: isoForWeeksAgo(2, 6),
  label: 'Week of ' + isoForWeeksAgo(2) + ' (9.9 build-up)',
  preferences: { ...MOCK_CALENDAR_PREFERENCES, niche: 'tech', platforms: ['shopee', 'tiktok', 'lazada'] },
  seasonalEvents: [SEASONAL_EVENTS.find((e) => e.id === '99-sale')!],
  source: 'ai',
  generatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  entries: [
    entryFromTemplate(
      'p2-mon-peak', 'Mon', 'peak', 'tiktok',
      'Xiaomi Redmi Buds 5',
      'Unboxing + ANC test in a noisy mamak. Show the price drop vs retail.',
      ['#99Sale', '#XiaomiRedmiBuds', '#GadgetReview', '#ad'],
      { engagement: 88, conversion: 82, virality: 86, seasonal: 78 },
      '99-sale',
    ),
    entryFromTemplate(
      'p2-tue-lunch', 'Tue', 'lunch', 'shopee',
      'Anker PowerCore 10000',
      'Quick lunch-break deal alert — powerbank under RM70 with free shipping voucher.',
      ['#99Sale', '#AnkerMY', '#Powerbank', '#promosi'],
      { engagement: 70, conversion: 85, virality: 60, seasonal: 80 },
      '99-sale',
    ),
    entryFromTemplate(
      'p2-wed-evening', 'Wed', 'evening', 'lazada',
      'Philips Air Fryer 4.1L',
      'Live demo: 3 quick air-fryer recipes (fries, chicken wings, banana fritters).',
      ['#AirFryerRecipes', '#99Sale', '#PhilipsMY', '#ad'],
      { engagement: 80, conversion: 84, virality: 78, seasonal: 75 },
      '99-sale',
    ),
    entryFromTemplate(
      'p2-thu-peak', 'Thu', 'peak', 'tiktok',
      'Realme Note 50',
      'Budget phone showdown — Realme Note 50 vs Redmi 13C. Show camera samples side-by-side.',
      ['#PhoneReview', '#99Sale', '#RealmeMY', '#promosi'],
      { engagement: 92, conversion: 80, virality: 90, seasonal: 82 },
      '99-sale',
    ),
    entryFromTemplate(
      'p2-fri-peak', 'Fri', 'peak', 'shopee',
      'Logitech MX Master 3S',
      'WFH upgrade — full review of MX Master 3S. Show silent click + multi-device switching.',
      ['#WFHSetup', '#99Sale', '#LogitechMY', '#ad'],
      { engagement: 84, conversion: 78, virality: 72, seasonal: 70 },
      '99-sale',
    ),
    entryFromTemplate(
      'p2-sat-peak', 'Sat', 'peak', 'tiktok',
      'Roborock Q7 Max+ Robot Vacuum',
      'Live robot vacuum demo — let it clean the studio while we talk features. Best 9.9 splurge.',
      ['#RobotVacuum', '#99Sale', '#SmartHome', '#promosi'],
      { engagement: 90, conversion: 88, virality: 85, seasonal: 78 },
      '99-sale',
    ),
    entryFromTemplate(
      'p2-sun-night', 'Sun', 'night', 'shopee',
      'USB-C Fast Charger 65W GaN',
      '9.9 last-day deals roundup — chargers, cables, accessories under RM50.',
      ['#99Sale', '#LastDaySale', '#GadgetDeals', '#ad'],
      { engagement: 72, conversion: 80, virality: 65, seasonal: 85 },
      '99-sale',
    ),
  ],
}

// ─── Past Calendar #3 (1 week ago — Home / mixed) ────────────────────────────

const pastCalendar3: ContentCalendar = {
  id: 'past-cal-3',
  weekStartDate: isoForWeeksAgo(1),
  weekEndDate: isoForWeeksAgo(1, 6),
  label: 'Week of ' + isoForWeeksAgo(1) + ' (Home refresh)',
  preferences: { ...MOCK_CALENDAR_PREFERENCES, niche: 'home', platforms: ['shopee', 'lazada'] },
  seasonalEvents: [],
  source: 'mock',
  generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  entries: [
    entryFromTemplate(
      'p3-mon-peak', 'Mon', 'peak', 'shopee',
      'Dyson V8 Vacuum',
      'Used Dyson V8 for 6 months — honest review. Show how it handles pet hair on carpet.',
      ['#DysonV8', '#HomeEssentials', '#VacuumReview', '#ad'],
      { engagement: 85, conversion: 76, virality: 80, seasonal: 50 },
    ),
    entryFromTemplate(
      'p3-tue-lunch', 'Tue', 'lunch', 'lazada',
      'IKEA Storage Boxes (set of 3)',
      'Quick decluttering before/after — pantry reorg using 3 storage box types.',
      ['#HomeOrganize', '#IKEAhacks', '#Declutter', '#promosi'],
      { engagement: 70, conversion: 75, virality: 60, seasonal: 50 },
    ),
    entryFromTemplate(
      'p3-wed-evening', 'Wed', 'evening', 'shopee',
      'Xiaomi Smart Air Purifier 4 Lite',
      'Hazy season prep — air purifier demo with smoke test. Show PM2.5 reading drop.',
      ['#AirPurifier', '#HazeSeason', '#XiaomiSmartHome', '#ad'],
      { engagement: 78, conversion: 80, virality: 70, seasonal: 60 },
    ),
    entryFromTemplate(
      'p3-thu-peak', 'Thu', 'peak', 'shopee',
      'Tefal Rice Cooker 1.8L',
      'Cooking demo: 3 things you can make in a rice cooker besides rice (cake, soup, oatmeal).',
      ['#RiceCookerHacks', '#TefalMY', '#KitchenHaul', '#promosi'],
      { engagement: 82, conversion: 84, virality: 75, seasonal: 55 },
    ),
    entryFromTemplate(
      'p3-fri-peak', 'Fri', 'peak', 'lazada',
      'Dekko Memory Foam Pillow',
      'Sleep better tonight — pillow review with my honest take after 1 month of use.',
      ['#SleepEssentials', '#MemoryFoamPillow', '#HomeFinds', '#ad'],
      { engagement: 75, conversion: 78, virality: 65, seasonal: 50 },
    ),
    entryFromTemplate(
      'p3-sat-lunch', 'Sat', 'lunch', 'shopee',
      'Kitchen Essentials Bundle',
      'Weekend roundup — top 5 kitchen finds this week, all under RM60.',
      ['#KitchenHaul', '#ShopeeFinds', '#WeekendDeals', '#promosi'],
      { engagement: 78, conversion: 82, virality: 70, seasonal: 55 },
    ),
    entryFromTemplate(
      'p3-sun-night', 'Sun', 'night', 'lazada',
      'Philips Wake-Up Light Alarm',
      'Sunday self-care — wake-up light review. Show simulated sunrise demo.',
      ['#SleepTech', '#PhilipsMY', '#SelfCare', '#ad'],
      { engagement: 72, conversion: 74, virality: 68, seasonal: 50 },
    ),
  ],
}

export const MOCK_PAST_CALENDARS: ContentCalendar[] = [pastCalendar3, pastCalendar2, pastCalendar1]

// ─── Generated Example Calendar (next week) ───────────────────────────────────
// Returned by the algorithmic fallback when AI is unavailable.

const nextMonday = isoForNextMonday()
const nextSunday = (() => {
  const d = new Date(nextMonday)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
})()

const nextWeekLabel = `Week of ${nextMonday} — ${nextSunday}`

export const MOCK_GENERATED_CALENDAR: ContentCalendar = {
  id: 'gen-cal-' + nextMonday,
  weekStartDate: nextMonday,
  weekEndDate: nextSunday,
  label: nextWeekLabel,
  preferences: { ...MOCK_CALENDAR_PREFERENCES },
  seasonalEvents: [],
  source: 'mock',
  generatedAt: new Date().toISOString(),
  entries: [
    entryFromTemplate(
      'gen-mon-peak', 'Mon', 'peak', 'tiktok',
      'Garnier Vitamin C Serum',
      'Monday motivation — start the week with a skincare review. Focus on before/after photos.',
      ['#SkincareReview', '#GarnierMY', '#MondayMotivation', '#ad'],
      { engagement: 80, conversion: 72, virality: 82, seasonal: 50 },
    ),
    entryFromTemplate(
      'gen-tue-lunch', 'Tue', 'lunch', 'shopee',
      'Xiaomi Redmi Buds 5',
      'Lunch break deals — quick unboxing of budget earbuds. Show pairing + sound test.',
      ['#LunchDeals', '#XiaomiRedmiBuds', '#BudgetTech', '#promosi'],
      { engagement: 75, conversion: 80, virality: 70, seasonal: 50 },
    ),
    entryFromTemplate(
      'gen-wed-evening', 'Wed', 'evening', 'lazada',
      'Philips Air Fryer 4.1L',
      'Mid-week dinner prep — 3 quick air-fryer recipes in 60s. Show crispy results.',
      ['#AirFryerRecipes', '#PhilipsMY', '#QuickDinner', '#ad'],
      { engagement: 82, conversion: 84, virality: 75, seasonal: 55 },
    ),
    entryFromTemplate(
      'gen-thu-peak', 'Thu', 'peak', 'tiktok',
      'Somethinc Niacinamide Serum',
      'Throwback Thursday — share your skincare journey. Demo the serum on camera.',
      ['#SkincareJourney', '#Somethinc', '#TBT', '#promosi'],
      { engagement: 78, conversion: 75, virality: 78, seasonal: 50 },
    ),
    entryFromTemplate(
      'gen-fri-peak', 'Fri', 'peak', 'tiktok',
      'Dyson V8 Vacuum',
      'Weekend flash sale alert — Dyson V8 unboxing + carpet test. Limited-time voucher hint.',
      ['#WeekendSale', '#DysonV8', '#HomeUpgrade', '#ad'],
      { engagement: 88, conversion: 82, virality: 86, seasonal: 60 },
    ),
    entryFromTemplate(
      'gen-sat-lunch', 'Sat', 'lunch', 'shopee',
      'Top 5 Deals This Week',
      'Weekend roundup — top 5 deals across Shopee/TikTok/Lazada this week. Show price drops.',
      ['#WeekendRoundup', '#Top5Deals', '#ShopeeFinds', '#promosi'],
      { engagement: 80, conversion: 86, virality: 70, seasonal: 55 },
    ),
    entryFromTemplate(
      'gen-sun-night', 'Sun', 'night', 'tiktok',
      'Cetaphil Gentle Cleanser',
      'Sunday self-care — wind-down skincare routine. Show double-cleanse to start the week fresh.',
      ['#SelfCare', '#SkincareRoutine', '#Cetaphil', '#ad'],
      { engagement: 76, conversion: 72, virality: 75, seasonal: 50 },
    ),
  ],
}

// ─── Convenience: All Days & Slots (used by the UI grid) ──────────────────────

export { DAYS_OF_WEEK, TIME_SLOTS }
