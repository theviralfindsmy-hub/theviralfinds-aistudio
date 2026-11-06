/**
 * HERMES Proactive Insights — Mock Data (Malaysian context)
 *
 * 15+ realistic proactive insights covering all 5 InsightTypes. Used as the
 * primary fallback when AI generation fails AND as the default seed dataset
 * for the GET /api/hermes/insights endpoint (so the UI always has content).
 *
 * All copy uses Malaysian context: RM currency, MYT timezone, Manglish phrases
 * ("syok", "naik", "jangan lambat", "cepat sikit"), local products
 * (Garnier Serum, Baju Kurung, Kopi Susu Tambun), seasonal events
 * (Hari Raya, 11.11, 12.12).
 */

import type { ProactiveInsight } from './types'

/** Helper: ISO timestamp N minutes ago. */
function ago(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString()
}

/**
 * The canonical mock insight dataset — 16 insights across all 5 types.
 * Sorted roughly by severity + recency (the API will re-sort).
 */
export const MOCK_INSIGHTS: ProactiveInsight[] = [
  // ─── 1. DAILY SUMMARY (success — good day) ────────────────────────────────
  {
    id: 'mock-daily-001',
    type: 'daily_summary',
    severity: 'success',
    title: "Today's Performance: 234 clicks, 12 conversions, RM 145.50 earnings. +18% vs yesterday — keep it up! 🔥",
    description:
      'Syok lah! Earnings naik 18% compared to yesterday, mainly from the Garnier Serum link going viral on TikTok. Conversions also up 9%. Keep the momentum going — post one more piece of content tonight to ride the wave.',
    timestamp: ago(15),
    relevance: 92,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      today: { clicks: 234, conversions: 12, earnings: 145.50, conversionRate: 5.13 },
      yesterday: { clicks: 198, conversions: 11, earnings: 123.30, conversionRate: 5.56 },
      changePct: { clicks: 18.2, conversions: 9.1, earnings: 18.0 },
    },
    action: { label: 'View Analytics', action: 'view_analytics', href: '/analytics' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 2. ANOMALY (critical — conversion collapse) ──────────────────────────
  {
    id: 'mock-anom-001',
    type: 'anomaly',
    severity: 'critical',
    title: '⚠️ Conversion rate dropped from 5.2% to 1.8% in the last 3 hours. Investigate top-performing links.',
    description:
      'Conversion rate went from 5.2% to 1.8% (−65%) over the last 3 hours. Clicks still coming in (87 in the window) but nobody buying. Likely cause: top product "Wireless Earbuds Pro" just went out of stock or price naik significantly. Better investigate cepat sikit before commission bleeds.',
    timestamp: ago(8),
    relevance: 96,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      metric: 'conversionRate',
      before: 5.2,
      after: 1.8,
      dropPct: -65.4,
      window: 'last 3 hours',
    },
    action: { label: 'Investigate', action: 'investigate', href: '/analytics' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 3. OPPORTUNITY (warning — hot trend) ─────────────────────────────────
  {
    id: 'mock-opp-001',
    type: 'opportunity',
    severity: 'warning',
    title: "🚀 Trending now: 'Garnier Serum' searches up 240% in Malaysia. 3 affiliate opportunities available.",
    description:
      'Searches for "Garnier Serum" naik 240% in Malaysia recently — likely from a viral TikTok review by @beautywithamy. 3 affiliate-ready products in this niche with average 6.5% commission. Estimated earning potential: RM 380/month if you move now. Jangan lambat — competitors also seeing this trend.',
    timestamp: ago(22),
    relevance: 90,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      productName: 'Garnier Serum',
      itemId: '16382950172',
      category: 'Beauty',
      trendPct: 240,
      opportunitiesAvailable: 3,
      commissionRate: 6.5,
      estimatedEarnings: 380,
    },
    action: {
      label: 'Generate Link',
      action: 'generate_link',
      payload: { itemId: '16382950172', productName: 'Garnier Serum' },
    },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 4. TREND ALERT (warning — seasonal Raya) ─────────────────────────────
  {
    id: 'mock-trend-001',
    type: 'trend_alert',
    severity: 'warning',
    title: "📈 'Raya Beauty' trending on TikTok. Generate content now to ride the wave before peak.",
    description:
      '"Raya Beauty" is trending on TikTok with 185% growth (seasonal — peak expected before Hari Raya in 3 weeks). Searches for baju kurung modern + makeup combos are exploding. Early content catches 60-70% more engagement than peak-time content. Best timing: now until Raya week. Suggested: "Get Ready With Me Raya Look" video featuring your beauty + fashion affiliate links.',
    timestamp: ago(45),
    relevance: 86,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      productName: 'Raya Beauty',
      trendPct: 185,
      opportunitiesAvailable: 0,
      recommendationType: 'content_format',
    },
    action: { label: 'Generate Content', action: 'generate_content', href: '/hermes' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 5. RECOMMENDATION (info — post timing) ───────────────────────────────
  {
    id: 'mock-rec-001',
    type: 'recommendation',
    severity: 'info',
    title: '💡 Your audience engages most at 8 PM. Schedule your next post for 7:45 PM for maximum reach.',
    description:
      'Berdasarkan your last 30 days of click data, peak engagement is between 8-10 PM MYT (65% of clicks come from this window). Posting 15 minutes before the peak lets the TikTok algorithm index your content while your audience is most active. Expected lift: ~23% more clicks.',
    timestamp: ago(70),
    relevance: 82,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      recommendationType: 'post_timing',
      suggestedTime: '7:45 PM MYT',
      expectedLift: 23,
    },
    action: { label: 'Schedule Post', action: 'schedule_post', href: '/campaigns' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 6. ANOMALY (success — clicks spike) ──────────────────────────────────
  {
    id: 'mock-anom-002',
    type: 'anomaly',
    severity: 'success',
    title: "🚀 Clicks spiked 145% in the last 6 hours — 'Portable Blender USB' going viral",
    description:
      'Clicks jumped from 42 to 103 (+145%) over the last 6 hours. Source: a TikTok video by @kitchenhacksmy featuring your portable blender link. Something you did is working! Identify the trigger and double down — post similar content or boost the winning link with a follow-up "5 Things You Can Blend" video.',
    timestamp: ago(120),
    relevance: 78,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      metric: 'clicks',
      before: 42,
      after: 103,
      dropPct: 145.2,
      window: 'last 6 hours',
    },
    action: { label: 'View Analytics', action: 'view_analytics', href: '/analytics' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 7. OPPORTUNITY (info — moderate trend) ───────────────────────────────
  {
    id: 'mock-opp-002',
    type: 'opportunity',
    severity: 'info',
    title: "📈 'Baju Kurung Moden' is picking up — searches up 78%. 5 products ready to promote.",
    description:
      'Searches for "Baju Kurung Moden" naik 78% ahead of Raya season. 5 affiliate-ready products in this niche with average 4.2% commission. Estimated earning potential: RM 220/month. Now is the sweet spot — trending enough to have volume, but not so saturated that you drown in competition.',
    timestamp: ago(180),
    relevance: 72,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      productName: 'Baju Kurung Moden',
      itemId: '26471038561',
      category: 'Fashion',
      trendPct: 78,
      opportunitiesAvailable: 5,
      commissionRate: 4.2,
      estimatedEarnings: 220,
    },
    action: {
      label: 'Generate Link',
      action: 'generate_link',
      payload: { itemId: '26471038561', productName: 'Baju Kurung Moden' },
    },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 8. RECOMMENDATION (warning — link audit needed) ──────────────────────
  {
    id: 'mock-rec-002',
    type: 'recommendation',
    severity: 'warning',
    title: '🔧 5 affiliate links have over 100 clicks but 0 conversions. Time for an audit.',
    description:
      '5 of your links are getting clicks but zero conversions — that\'s a leak in your funnel. Most likely causes: (1) product price naik significantly, (2) better competitor offer on the same Shopee page, (3) your landing page promise doesn\'t match the product. Review these 5 links this week — even fixing 2 could recover RM 80-150/month in lost commission.',
    timestamp: ago(240),
    relevance: 80,
    isRead: true,
    isActioned: false,
    source: 'mock',
    data: {
      recommendationType: 'link_audit',
    },
    action: { label: 'Investigate', action: 'investigate', href: '/links' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 9. TREND ALERT (info — emerging) ─────────────────────────────────────
  {
    id: 'mock-trend-002',
    type: 'trend_alert',
    severity: 'info',
    title: "📊 'Tudung Bawal Premium' is heating up on Instagram (+95%). Consider content soon.",
    description:
      '"Tudung Bawal Premium" is heating up on Instagram with 95% growth — driven by @hijabfashionmy\'s styling series. Not urgent yet but momentum building. If you have any tudung/muslimah fashion links, now\'s a good time to schedule 2-3 posts in the next 5 days to catch the wave before it peaks.',
    timestamp: ago(300),
    relevance: 70,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      productName: 'Tudung Bawal Premium',
      trendPct: 95,
      opportunitiesAvailable: 0,
      recommendationType: 'content_format',
    },
    action: { label: 'Generate Content', action: 'generate_content', href: '/hermes' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 10. ANOMALY (warning — gradual earnings decline) ─────────────────────
  {
    id: 'mock-anom-003',
    type: 'anomaly',
    severity: 'warning',
    title: '⚠️ Earnings dropped 28% over the last 7 days vs previous week. Watch this trend.',
    description:
      'Earnings went from RM 1,089 last week to RM 784 this week (−28%) over 7 days. Not a sudden crash but a gradual decline — could be audience fatigue, seasonal shift post-payday, or your top product losing steam. Check if your top 3 products still have the same commission rates and stock availability.',
    timestamp: ago(360),
    relevance: 84,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      metric: 'earnings',
      before: 1089,
      after: 784,
      dropPct: -28.0,
      window: 'last 7 days',
    },
    action: { label: 'View Earnings', action: 'view_earnings', href: '/earnings' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 11. OPPORTUNITY (warning — 11.11 prep) ───────────────────────────────
  {
    id: 'mock-opp-003',
    type: 'opportunity',
    severity: 'warning',
    title: "🛒 11.11 Super Sale prep window opens now. 24 high-commission products identified.",
    description:
      '11.11 Super Shopping Day is 2 weeks away. We identified 24 high-commission products (5%+) in your top categories that historically convert 3.2x better during sale periods. Start creating pre-sale content now to capture early search traffic. Historically, affiliates who start 2 weeks early earn 65% more than last-minute posters. Estimated extra earning: RM 450-600 over the sale week.',
    timestamp: ago(480),
    relevance: 88,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      productName: '11.11 Sale Picks',
      category: 'Mixed',
      trendPct: 320,
      opportunitiesAvailable: 24,
      commissionRate: 5.5,
      estimatedEarnings: 525,
    },
    action: { label: 'View Products', action: 'view_product', href: '/products' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 12. RECOMMENDATION (info — content format shift) ─────────────────────
  {
    id: 'mock-rec-003',
    type: 'recommendation',
    severity: 'info',
    title: '📹 Video content gets 4.7x more clicks than image posts. Shift 60% of content to short-form video.',
    description:
      'Your last 30 days: video posts average 87 clicks vs image posts at 18 clicks (4.7x difference). Yet only 28% of your content is video. Shifting 60% of your output to short-form video (TikTok/Reels) could lift total clicks by an estimated 145% without needing more products. Tools: just your phone + CapCut free version. Start with unboxing + demo formats — they perform best in your niche.',
    timestamp: ago(600),
    relevance: 76,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      recommendationType: 'content_format',
      expectedLift: 145,
    },
    action: { label: 'Generate Content', action: 'generate_content', href: '/hermes' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 13. TREND ALERT (warning — urgent seasonal) ──────────────────────────
  {
    id: 'mock-trend-003',
    type: 'trend_alert',
    severity: 'warning',
    title: "🛍️ 'Kopi Susu Tambun' viral on TikTok food scene (+210%). Affiliate window closing in 5 days.",
    description:
      '"Kopi Susu Tambun" is viral on Malaysian TikTok food review scene (+210% in 7 days). Local F&B products typically have a 2-week monetisation window before the trend cools. You\'re at day 9 — about 5 days left of peak interest. 2 affiliate-ready kopi products match. Quick win: post a "kopitiam vs cafe price comparison" video tonight.',
    timestamp: ago(720),
    relevance: 83,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      productName: 'Kopi Susu Tambun',
      trendPct: 210,
      opportunitiesAvailable: 2,
      recommendationType: 'content_format',
    },
    action: { label: 'Generate Content', action: 'generate_content', href: '/hermes' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 14. DAILY SUMMARY (info — flat day) ──────────────────────────────────
  {
    id: 'mock-daily-002',
    type: 'daily_summary',
    severity: 'info',
    title: "Yesterday's Performance: 189 clicks, 9 conversions, RM 98.40 — about the same as the day before.",
    description:
      'Yesterday closed at 189 clicks with 4.76% conversion rate (day before: 192 clicks, 4.69%). Flat performance — nothing broke but nothing popped either. Try a new content angle today: behind-the-scenes, comparison post, or "things I wish I knew before buying X" format. Small experiments often unlock 20-30% lifts.',
    timestamp: ago(1440),
    relevance: 68,
    isRead: true,
    isActioned: true,
    source: 'mock',
    data: {
      today: { clicks: 189, conversions: 9, earnings: 98.40, conversionRate: 4.76 },
      yesterday: { clicks: 192, conversions: 9, earnings: 95.10, conversionRate: 4.69 },
      changePct: { clicks: -1.6, conversions: 0, earnings: 3.5 },
    },
    action: { label: 'View Analytics', action: 'view_analytics', href: '/analytics' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 15. RECOMMENDATION (info — audience targeting) ───────────────────────
  {
    id: 'mock-rec-004',
    type: 'recommendation',
    severity: 'info',
    title: '🎯 Your audience is 65% female, age 18-34, Klang Valley. Beauty + Fashion content over-indexes 2.3x.',
    description:
      'Based on click patterns + Shopee audience data, your core audience is 65% female, age 18-34, Klang Valley area. Beauty + Fashion content performs 2.3x better than your Electronics posts (despite Electronics having higher commission). Consider rebalancing: 60% Beauty/Fashion, 30% Electronics, 10% experiments. Same effort, better conversion.',
    timestamp: ago(1800),
    relevance: 74,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      recommendationType: 'audience_targeting',
      expectedLift: 35,
    },
    action: { label: 'View Analytics', action: 'view_analytics', href: '/analytics' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },

  // ─── 16. OPPORTUNITY (success — Manglish caption insight) ─────────────────
  {
    id: 'mock-opp-004',
    type: 'opportunity',
    severity: 'success',
    title: "💬 Manglish captions perform 23% better than pure English. Apply to your next 5 posts.",
    description:
      'A/B test result from your last 30 days: posts with Manglish captions ("Wah this one syok gila", "Best value tau, jangan kedekut") averaged 23% more clicks than pure English captions. Your audience connects with local flavour. Apply this pattern to your next 5 posts — especially for Beauty + Fashion products. Quick template: "📍 [product] — [Manglish hook] → [shopee link]".',
    timestamp: ago(2880),
    relevance: 71,
    isRead: false,
    isActioned: false,
    source: 'mock',
    data: {
      productName: 'Manglish Caption Strategy',
      category: 'Content',
      trendPct: 23,
      opportunitiesAvailable: 0,
      commissionRate: 0,
      estimatedEarnings: 0,
      recommendationType: 'content_format',
      expectedLift: 23,
    },
    action: { label: 'Generate Content', action: 'generate_content', href: '/hermes' },
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  },
]

/** Convenience: get a single mock insight by id (for the API generate fallback). */
export function getMockInsightById(id: string): ProactiveInsight | undefined {
  return MOCK_INSIGHTS.find((i) => i.id === id)
}

/** Convenience: pick a random mock insight (for AI fallback variation). */
export function randomMockInsight(): ProactiveInsight {
  const idx = Math.floor(Math.random() * MOCK_INSIGHTS.length)
  return MOCK_INSIGHTS[idx]
}
