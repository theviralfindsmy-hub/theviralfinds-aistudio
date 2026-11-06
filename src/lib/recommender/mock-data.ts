/**
 * AI Product Recommender — Audience Personas & Mock Data
 *
 * 5 personas representing the most common Malaysian affiliate audiences:
 *   - Beauty Mama        — skincare & makeup enthusiasts, mostly women 25-40
 *   - Tech Bro           — gadget & gaming enthusiasts, mostly men 18-35
 *   - Fitness Guru       — gym-goers & wellness seekers, mixed 20-40
 *   - Kitchen Queen      — home cooks & mums, mostly women 28-50
 *   - Student Saver      — budget-conscious uni students, mixed 18-25
 */

import type { AudienceProfile, AudiencePersonaId } from './types'

export const AUDIENCE_PROFILES: AudienceProfile[] = [
  {
    id: 'beauty_mama',
    name: 'Beauty Mama',
    emoji: '👩',
    tagline: 'Skincare junkie & makeup lover',
    description:
      'Urban Malaysian women aged 25-40 who follow K-beauty trends, watch skincare routines on TikTok at night, and shop mostly via Shopee Beauty. They click 3x more on beauty content posted 8-10 PM.',
    topCategories: [
      { category: 'beauty', weight: 95 },
      { category: 'health', weight: 70 },
      { category: 'fashion', weight: 50 },
      { category: 'home', weight: 35 },
      { category: 'food', weight: 25 },
    ],
    peakHours: [20, 21, 22, 23],
    ageRange: '25-40',
    genderSplit: { female: 88, male: 12 },
    devices: ['mobile', 'tablet'],
    priceSensitivity: 3,
    topStates: ['Selangor', 'Kuala Lumpur', 'Penang', 'Johor'],
    clickThroughRate: 0.085,
    conversionRate: 0.045,
    languages: ['en', 'bm', 'zh'],
  },
  {
    id: 'tech_bro',
    name: 'Tech Bro',
    emoji: '💻',
    tagline: 'Gadget freak & gamer',
    description:
      'Mostly men aged 18-35 who hunt for the latest Xiaomi, Samsung, and gaming gear. They research on YouTube then buy on Lazada during 11.11 / 12.12 sales. Best converting posts are unboxing & spec-comparison videos.',
    topCategories: [
      { category: 'electronics', weight: 95 },
      { category: 'automotive', weight: 55 },
      { category: 'sports', weight: 45 },
      { category: 'home', weight: 30 },
      { category: 'beauty', weight: 10 },
    ],
    peakHours: [22, 23, 0, 1],
    ageRange: '18-35',
    genderSplit: { female: 18, male: 82 },
    devices: ['mobile', 'desktop'],
    priceSensitivity: 2,
    topStates: ['Selangor', 'Kuala Lumpur', 'Penang', 'Sarawak'],
    clickThroughRate: 0.062,
    conversionRate: 0.038,
    languages: ['en', 'bm', 'zh'],
  },
  {
    id: 'fitness_guru',
    name: 'Fitness Guru',
    emoji: '💪',
    tagline: 'Gym rat & wellness seeker',
    description:
      'Health-conscious Malaysians aged 20-40 who follow workout influencers, supplement reviews, and clean-eating content. Peak engagement 6-8 AM (pre-workout) and 8-10 PM (post-workout).',
    topCategories: [
      { category: 'sports', weight: 92 },
      { category: 'health', weight: 88 },
      { category: 'food', weight: 65 },
      { category: 'beauty', weight: 40 },
      { category: 'electronics', weight: 30 },
    ],
    peakHours: [6, 7, 8, 20, 21, 22],
    ageRange: '20-40',
    genderSplit: { female: 45, male: 55 },
    devices: ['mobile', 'tablet'],
    priceSensitivity: 2,
    topStates: ['Kuala Lumpur', 'Selangor', 'Putrajaya', 'Johor'],
    clickThroughRate: 0.078,
    conversionRate: 0.052,
    languages: ['en', 'bm'],
  },
  {
    id: 'kitchen_queen',
    name: 'Kitchen Queen',
    emoji: '👩‍🍳',
    tagline: 'Home cook & mum extraordinaire',
    description:
      'Mums aged 28-50 who love kitchen gadgets, bulk groceries, and home-organisation products. They watch recipe TikToks at 11 AM (post-school-run) and 9 PM (post-dinner). High conversion on bundle deals.',
    topCategories: [
      { category: 'home', weight: 95 },
      { category: 'food', weight: 90 },
      { category: 'baby', weight: 70 },
      { category: 'beauty', weight: 35 },
      { category: 'fashion', weight: 25 },
    ],
    peakHours: [11, 12, 21, 22],
    ageRange: '28-50',
    genderSplit: { female: 92, male: 8 },
    devices: ['mobile', 'tablet'],
    priceSensitivity: 4,
    topStates: ['Johor', 'Perak', 'Selangor', 'Kedah', 'Kelantan'],
    clickThroughRate: 0.072,
    conversionRate: 0.048,
    languages: ['bm', 'en', 'zh'],
  },
  {
    id: 'student_saver',
    name: 'Student Saver',
    emoji: '🎓',
    tagline: 'Budget-conscious uni student',
    description:
      'Uni students aged 18-25 hunting for deals under RM50. Active 12 AM-2 AM (late-night cramming). They share deals on WhatsApp & Discord groups. Best converting posts are price-reveal & comparison videos.',
    topCategories: [
      { category: 'electronics', weight: 75 },
      { category: 'fashion', weight: 70 },
      { category: 'food', weight: 60 },
      { category: 'beauty', weight: 55 },
      { category: 'home', weight: 40 },
    ],
    peakHours: [0, 1, 2, 12, 13],
    ageRange: '18-25',
    genderSplit: { female: 52, male: 48 },
    devices: ['mobile'],
    priceSensitivity: 5,
    topStates: ['Selangor', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Melaka'],
    clickThroughRate: 0.092,
    conversionRate: 0.028,
    languages: ['en', 'bm', 'zh', 'ta'],
  },
]

export const AUDIENCE_PROFILE_MAP: Record<AudiencePersonaId, AudienceProfile> =
  AUDIENCE_PROFILES.reduce(
    (acc, p) => {
      acc[p.id] = p
      return acc
    },
    {} as Record<AudiencePersonaId, AudienceProfile>,
  )

export function getAudienceProfile(id: string): AudienceProfile | null {
  return AUDIENCE_PROFILE_MAP[id as AudiencePersonaId] ?? null
}

/**
 * Mock recommendation explanations — used as fallback when AI is unavailable.
 * Indexed by audience persona id.
 */
export const MOCK_EXPLANATIONS: Record<
  AudiencePersonaId,
  (productName: string, audiencePct: number, trendPct: number, commissionPct: number) => string
> = {
  beauty_mama: (name, a, t, c) =>
    `High audience match (${a}%) — your beauty-loving mamas click 3x more on ${name} at 8-10 PM. Trending +${t}% this week. Commission XTRA ${c}% available.`,
  tech_bro: (name, a, t, c) =>
    `Strong fit (${a}%) — your tech bros love unboxing ${name}. Surge +${t}% on TikTok Shop this week. Lock in ${c}% commission before 11.11.`,
  fitness_guru: (name, a, t, c) =>
    `Perfect match (${a}%) — gym-goers bookmark ${name} for their stack. Sales velocity +${t}% week-on-week. Earn ${c}% per sale.`,
  kitchen_queen: (name, a, t, c) =>
    `Mums love this (${a}%) — ${name} is trending on Shopee Live demos. +${t}% sales this week. Bundle deals + ${c}% commission = winning combo.`,
  student_saver: (name, a, t, c) =>
    `Students budget-hunting (${a}%) — ${name} under RM50 sweet spot. +${t}% clicks from Discord shares. ${c}% commission = solid wallet boost.`,
}
