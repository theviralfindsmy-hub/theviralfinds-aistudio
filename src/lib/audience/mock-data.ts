/**
 * AI Audience Analyzer — Mock data
 * Fasa 3.6 — TheViralFindsMY
 *
 * Realistic Malaysian audience profile derived from click data.
 * Audience size ~5,847 unique clickers; female-skewed; Klang Valley heavy.
 */

import type {
  AudienceProfile,
  AudienceSegment,
  AudienceTrendPoint,
  ContentSuggestion,
  DemographicsBreakdown,
  HeatmapCell,
  InterestMap,
  ActiveHoursHeatmap,
} from './types'

/** Total unique clickers underpinning every demographic slice. */
export const TOTAL_AUDIENCE_SIZE = 5_847

/** Malaysian states / territories, ranked by share of clicks. */
const LOCATION_ROWS: Array<{ key: string; label: string; pct: number }> = [
  { key: 'kuala-lumpur', label: 'Kuala Lumpur', pct: 28 },
  { key: 'selangor', label: 'Selangor', pct: 22 },
  { key: 'penang', label: 'Penang', pct: 12 },
  { key: 'johor', label: 'Johor', pct: 11 },
  { key: 'sabah', label: 'Sabah', pct: 8 },
  { key: 'sarawak', label: 'Sarawak', pct: 7 },
  { key: 'perak', label: 'Perak', pct: 5 },
  { key: 'negeri-sembilan', label: 'Negeri Sembilan', pct: 4 },
  { key: 'kedah', label: 'Kedah', pct: 3 },
]

/** Helper — turn a percentage into a rounded unique-clicker count. */
function pctToCount(pct: number): number {
  return Math.round((pct / 100) * TOTAL_AUDIENCE_SIZE)
}

/** Build the full demographics breakdown. */
export function buildDemographics(): DemographicsBreakdown {
  const ageRows = [
    { key: '18-24', label: '18-24', pct: 21 },
    { key: '25-34', label: '25-34', pct: 42 },
    { key: '35-44', label: '35-44', pct: 23 },
    { key: '45+', label: '45+', pct: 14 },
  ]

  const genderRows = [
    { key: 'female', label: 'Female', pct: 68 },
    { key: 'male', label: 'Male', pct: 30 },
    { key: 'other', label: 'Other', pct: 2 },
  ]

  const deviceRows = [
    { key: 'mobile', label: 'Mobile', pct: 78 },
    { key: 'desktop', label: 'Desktop', pct: 18 },
    { key: 'tablet', label: 'Tablet', pct: 4 },
  ]

  const map = (rows: Array<{ key: string; label: string; pct: number }>) =>
    rows.map((r) => ({
      key: r.key,
      label: r.label,
      percentage: r.pct,
      count: pctToCount(r.pct),
    }))

  return {
    ageRanges: map(ageRows),
    genders: map(genderRows),
    locations: LOCATION_ROWS.map((r) => ({
      key: r.key,
      label: r.label,
      percentage: r.pct,
      count: pctToCount(r.pct),
    })),
    devices: map(deviceRows),
  }
}

/** Build the interest affinity map. */
export function buildInterests(): InterestMap {
  const rows: Array<{
    interest: string
    affinity: number
    clicks: number
    engagementLift: number
  }> = [
    { interest: 'Beauty', affinity: 85, clicks: 2480, engagementLift: 38 },
    { interest: 'Tech', affinity: 62, clicks: 1810, engagementLift: 22 },
    { interest: 'Fashion', affinity: 54, clicks: 1580, engagementLift: 17 },
    { interest: 'Food', affinity: 47, clicks: 1370, engagementLift: 12 },
    { interest: 'Travel', affinity: 41, clicks: 1190, engagementLift: 9 },
    { interest: 'Home', affinity: 36, clicks: 1050, engagementLift: 7 },
    { interest: 'Fitness', affinity: 28, clicks: 820, engagementLift: 4 },
    { interest: 'Gaming', affinity: 22, clicks: 640, engagementLift: 2 },
  ]

  return {
    totalInterests: rows.length,
    topInterest: 'Beauty',
    entries: rows,
  }
}

/** Day-of-week labels (Sun-first to match heatmap row order). */
export const HEATMAP_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Build the 7×24 active-hours heatmap.
 *
 * Heuristic: clicks concentrate around lunch (12-14) and evening peak
 * (20-22 MYT). Weekends skew later. The evening block dominates, with
 * 20:00 (8 PM) being the global peak.
 */
export function buildHeatmap(): ActiveHoursHeatmap {
  const cells: HeatmapCell[] = []
  let maxClicks = 0
  let totalClicks = 0

  for (let day = 0; day < 7; day++) {
    const isWeekend = day === 0 || day === 6
    for (let hour = 0; hour < 24; hour++) {
      let weight = 0.05

      // Late-night (1-6) low
      if (hour >= 1 && hour <= 6) weight = 0.04
      // Morning wake-up (7-9) bump
      else if (hour >= 7 && hour <= 9) weight = 0.08
      // Mid-morning (10-11)
      else if (hour >= 10 && hour <= 11) weight = 0.07
      // Lunch peak (12-14)
      else if (hour >= 12 && hour <= 14) weight = 0.12
      // Afternoon dip (15-17)
      else if (hour >= 15 && hour <= 17) weight = 0.08
      // Evening ramp (18-19)
      else if (hour >= 18 && hour <= 19) weight = 0.14
      // Prime time (20-22) — the global peak
      else if (hour >= 20 && hour <= 22) weight = 0.22
      // Late wind-down (23)
      else if (hour === 23) weight = 0.1
      // Midnight (0)
      else weight = 0.05

      // Weekend lift on evening hours
      if (isWeekend && hour >= 20 && hour <= 23) weight *= 1.15
      // Weekend dip on morning hours
      if (isWeekend && hour >= 7 && hour <= 11) weight *= 0.85

      // Base click volume per slot
      const base = 420
      const clicks = Math.round(base * weight + Math.random() * 30)
      cells.push({ day, hour, clicks, density: 0 })
      totalClicks += clicks
      if (clicks > maxClicks) maxClicks = clicks
    }
  }

  // Normalise density 0-100
  for (const cell of cells) {
    cell.density = Math.round((cell.clicks / maxClicks) * 100)
  }

  // Determine peak hour/day from aggregated density
  const hourTotals = new Array(24).fill(0)
  const dayTotals = new Array(7).fill(0)
  for (const c of cells) {
    hourTotals[c.hour] += c.clicks
    dayTotals[c.day] += c.clicks
  }
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals))
  const peakDay = dayTotals.indexOf(Math.max(...dayTotals))

  return { cells, peakHour, peakDay, totalClicks }
}

/** Build the audience segments. */
export function buildSegments(): AudienceSegment[] {
  return [
    {
      id: 'seg-beauty-lovers',
      name: 'Beauty Lovers',
      description:
        'Female 25-34, Klang Valley. Click skincare & makeup deals 3.4x more than baseline.',
      size: 1986,
      sharePercentage: 34,
      avgEngagement: 6.8,
      topInterest: 'Beauty',
    },
    {
      id: 'seg-late-night-shoppers',
      name: 'Late-Night Shoppers',
      description:
        'Active 8-11 PM MYT. Convert 2.1x higher when content is posted at peak hour.',
      size: 1621,
      sharePercentage: 28,
      avgEngagement: 5.4,
      topInterest: 'Tech',
    },
    {
      id: 'seg-budget-hunters',
      name: 'Budget Hunters',
      description:
        'Price-sensitive, 18-24. Respond best to "bawah RM50" hooks and 9.9 sale drops.',
      size: 1108,
      sharePercentage: 19,
      avgEngagement: 4.6,
      topInterest: 'Fashion',
    },
    {
      id: 'seg-weekend-browsers',
      name: 'Weekend Browsers',
      description:
        'Sabah & Sarawak, weekend-heavy. Long-form reviews drive 1.7x more add-to-cart.',
      size: 732,
      sharePercentage: 12,
      avgEngagement: 4.1,
      topInterest: 'Home',
    },
    {
      id: 'seg-gadget-geeks',
      name: 'Gadget Geeks',
      description:
        'Male 25-34, high Tech affinity. Comparison carousels convert 2.4x better.',
      size: 400,
      sharePercentage: 7,
      avgEngagement: 3.9,
      topInterest: 'Tech',
    },
  ]
}

/** Format an MYT hour into a friendly label. */
function hourLabel(hour: number): string {
  const ampm = hour < 12 ? 'AM' : 'PM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${ampm}`
}

/** Default algorithmic content suggestions (used as fallback). */
export function buildContentSuggestions(niche?: string): ContentSuggestion[] {
  const n = (niche || '').trim().toLowerCase()
  const nicheTag = n || 'beauty'

  const base: ContentSuggestion[] = [
    {
      id: 'sug-peak-beauty',
      title: 'Your audience likes beauty content at 8 PM',
      explanation:
        'Beauty clicks spike 38% between 8-10 PM MYT. Posting skincare tutorials in this window lifts engagement 3x vs daytime.',
      format: 'short_video',
      bestTime: '8 PM MYT',
      expectedLift: 38,
      tags: ['beauty', 'skincare', 'peak-hour'],
    },
    {
      id: 'sug-weekday-tutorials',
      title: 'Try posting skincare tutorials on weekdays — audience engages 3x more',
      explanation:
        'Weekday 8 PM slots outperform weekends by 3.1x for skincare. Monday-Wednesday convert best for tutorial formats.',
      format: 'carousel',
      bestTime: 'Mon-Wed, 8 PM',
      expectedLift: 31,
      tags: ['skincare', 'tutorials', 'weekday'],
    },
    {
      id: 'sug-kl-flash-deals',
      title: 'Klang Valley loves flash deals — push limited-time hooks',
      explanation:
        '50% of your audience is in KL + Selangor. "Stok terhad" urgency hooks lift CTR by 22% in this segment.',
      format: 'story',
      bestTime: '12 PM & 8 PM',
      expectedLift: 22,
      tags: ['klang-valley', 'flash-deal', 'urgency'],
    },
    {
      id: 'sug-mobile-first',
      title: 'Optimise for mobile — 78% of clicks come from phones',
      explanation:
        'Mobile-first verticals (9:16, big CTAs, sub-3s hooks) match your audience. Desktop-only creatives underperform by 41%.',
      format: 'short_video',
      bestTime: 'Anytime',
      expectedLift: 41,
      tags: ['mobile', 'vertical', 'cta'],
    },
    {
      id: 'sug-tech-comparison',
      title: 'Gadget geeks want comparison carousels',
      explanation:
        'Male 25-34 with Tech affinity convert 2.4x better on side-by-side spec carousels than single-product posts.',
      format: 'carousel',
      bestTime: 'Tue & Thu, 9 PM',
      expectedLift: 24,
      tags: ['tech', 'comparison', 'gadgets'],
    },
    {
      id: 'sug-budget-50',
      title: 'Use "bawah RM50" hooks for budget hunters',
      explanation:
        '18-24 budget segment responds to price-first hooks ("Bawah RM50 je!"). Average CTR lift: 18%.',
      format: 'short_video',
      bestTime: '8 PM MYT',
      expectedLift: 18,
      tags: ['budget', 'price-first', 'under-50'],
    },
    {
      id: 'sug-live-evening',
      title: 'Go live at 9 PM — your peak window for conversions',
      explanation:
        'Live sessions during 9-10 PM MYT convert 2.1x higher than afternoon slots. Beauty & Tech perform best.',
      format: 'live_stream',
      bestTime: '9 PM MYT',
      expectedLift: 27,
      tags: ['live', 'peak-hour', 'conversions'],
    },
    {
      id: 'sug-east-my-weekend',
      title: 'Target East-MY buyers with weekend long-form reviews',
      explanation:
        'Sabah & Sarawak audience browses on weekends. Long-form reviews drive 1.7x more add-to-cart for this segment.',
      format: 'blog_post',
      bestTime: 'Sat-Sun, 11 AM',
      expectedLift: 17,
      tags: ['east-my', 'weekend', 'long-form'],
    },
  ]

  // If a niche is provided, surface matching suggestions first.
  if (n) {
    const matched = base.filter((s) =>
      s.tags.some((t) => t.includes(n) || n.includes(t))
    )
    const rest = base.filter((s) => !matched.includes(s))
    return [...matched, ...rest].map((s) => ({
      ...s,
      tags: [...new Set([...s.tags, nicheTag])],
    }))
  }

  return base
}

/** Build the month-over-month audience growth trend (last 8 months). */
export function buildAudienceTrend(): AudienceTrendPoint[] {
  const months = [
    { month: '2025-02', label: 'Feb' },
    { month: '2025-03', label: 'Mar' },
    { month: '2025-04', label: 'Apr' },
    { month: '2025-05', label: 'May' },
    { month: '2025-06', label: 'Jun' },
    { month: '2025-07', label: 'Jul' },
    { month: '2025-08', label: 'Aug' },
    { month: '2025-09', label: 'Sep' },
  ]

  const sizes = [3120, 3580, 3940, 4210, 4520, 4890, 5230, 5847]
  const engagement = [3.9, 4.1, 4.0, 4.3, 4.4, 4.6, 4.5, 4.7]

  return months.map((m, i) => ({
    month: m.month,
    label: m.label,
    audienceSize: sizes[i],
    newMembers: i === 0 ? sizes[0] : sizes[i] - sizes[i - 1],
    engagementRate: engagement[i],
  }))
}

/**
 * Build the full mock audience profile.
 * Optionally accepts a `niche` to bias content suggestions.
 */
export function buildMockAudienceProfile(niche?: string): AudienceProfile {
  const demographics = buildDemographics()
  const interests = buildInterests()
  const heatmap = buildHeatmap()
  const segments = buildSegments()
  const suggestions = buildContentSuggestions(niche)
  const trend = buildAudienceTrend()

  const monthOverMonthGrowth = (() => {
    if (trend.length < 2) return 0
    const last = trend[trend.length - 1].audienceSize
    const prev = trend[trend.length - 2].audienceSize
    return prev > 0 ? Math.round(((last - prev) / prev) * 1000) / 10 : 0
  })()

  return {
    summary: {
      totalAudienceSize: TOTAL_AUDIENCE_SIZE,
      avgEngagementRate: 4.7,
      topInterest: interests.topInterest,
      peakHour: heatmap.peakHour,
      peakHourLabel: hourLabel(heatmap.peakHour),
      activeSegments: segments.length,
      monthOverMonthGrowth,
    },
    demographics,
    interests,
    heatmap,
    segments,
    suggestions,
    trend,
    generatedAt: new Date().toISOString(),
    niche,
  }
}
