/**
 * Mock data for Trust, Social Proof & Community features (P2-e)
 * ───────────────────────────────────────────────────────────────────────────
 * - 100 leaderboard entries (deterministic, realistic Malaysian distribution)
 * - 8 testimonials with Manglish quotes
 * - 3 detailed case studies
 * - 20+ changelog entries
 * - 30+ live ticker phrases
 *
 * NO indigo or blue colors used anywhere. Gold = amber-500, Silver = slate-400,
 * Bronze = orange-700, Verified = emerald.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Niche = 'Electronics' | 'Beauty' | 'Fashion' | 'Home' | 'Food'

export type LeaderboardPeriod = 'week' | 'month' | 'all'

export type AffiliateBadge =
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'hot_streak'
  | 'rising_star'
  | 'niche_master'
  | 'power_user'

export interface LeaderboardEntry {
  rank: number
  anonymousName: string
  affiliateId: string
  niche: Niche
  earningsRange: string
  earningsValue: number
  clicks: number
  conversions: number
  conversionRate: number
  streakDays: number
  joinedDaysAgo: number
  activeLinks: number
  badges: AffiliateBadge[]
  rankChange: number // positive = moved up, negative = moved down, 0 = same
  isYou?: boolean
}

export interface Testimonial {
  id: string
  name: string
  initials: string
  avatarColor: string
  location: string
  quote: string
  earningsStat: string
  rating: number
  verifiedSeller: boolean
  niche: Niche
}

export interface CaseStudySection {
  heading: string
  body: string
}

export interface CaseStudy {
  id: string
  title: string
  author: string
  authorInitials: string
  authorAvatarColor: string
  verified: boolean
  duration: string
  earnings: string
  heroStat: string
  heroStatLabel: string
  heroGradient: string
  summary: string
  strategies: string[]
  challenge: CaseStudySection
  strategy: CaseStudySection
  execution: CaseStudySection
  results: CaseStudySection
  tips: CaseStudySection
}

export type ChangelogCategory = 'Feature' | 'Fix' | 'Improvement' | 'Security'

export interface ChangelogEntry {
  version: string
  date: string
  title: string
  description: string
  category: ChangelogCategory
}

export interface TickerEntry {
  id: string
  template: 'earned' | 'commission' | 'payout' | 'milestone' | 'sale'
  amount: number
  subject: string
  platform: 'Shopee' | 'TikTok Shop' | 'Lazada'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NICHES: Niche[] = ['Electronics', 'Beauty', 'Fashion', 'Home', 'Food']

const AVATAR_COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-fuchsia-100 text-fuchsia-700',
]

// Deterministic pseudo-random generator so SSR matches client
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(20250315)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]

function rangeFromEarnings(value: number): string {
  if (value >= 25000) return 'RM 25K+'
  if (value >= 10000) return 'RM 10K-25K'
  if (value >= 5000) return 'RM 5K-10K'
  if (value >= 1000) return 'RM 1K-5K'
  if (value >= 500) return 'RM 500-1K'
  return '< RM 500'
}

// ─── Leaderboard: 100 entries ─────────────────────────────────────────────────

function buildLeaderboard(period: LeaderboardPeriod): LeaderboardEntry[] {
  // Period multiplier scales earnings; weekly is smallest, all-time is largest
  const multiplier = period === 'week' ? 1 : period === 'month' ? 4.3 : 52

  // Anchored top 5 (realistic shape, Ahmad/Siti/etc as anonymous IDs)
  const topAnchors = [
    { niche: 'Electronics' as Niche, base: 6200, streak: 28, joined: 420, links: 184 },
    { niche: 'Beauty' as Niche, base: 5680, streak: 21, joined: 380, links: 156 },
    { niche: 'Fashion' as Niche, base: 4890, streak: 14, joined: 250, links: 132 },
    { niche: 'Electronics' as Niche, base: 3920, streak: 9, joined: 195, links: 118 },
    { niche: 'Home' as Niche, base: 3450, streak: 12, joined: 165, links: 104 },
  ]

  const entries: LeaderboardEntry[] = []
  // Highest rank per niche for "niche_master" badge
  const firstInNiche: Record<Niche, boolean> = {
    Electronics: false,
    Beauty: false,
    Fashion: false,
    Home: false,
    Food: false,
  }

  for (let i = 1; i <= 100; i++) {
    let niche: Niche
    let base: number
    let streak: number
    let joined: number
    let links: number

    if (i <= topAnchors.length) {
      const anchor = topAnchors[i - 1]
      niche = anchor.niche
      base = anchor.base
      streak = anchor.streak
      joined = anchor.joined
      links = anchor.links
    } else {
      // Decay curve: earnings drop roughly with rank
      niche = pick(NICHES)
      const decay = Math.pow(i / 5, -0.85)
      base = Math.max(60, 6200 * decay * (0.7 + rng() * 0.6))
      streak = Math.floor(rng() * 22)
      joined = Math.floor(rng() * 600) + 5
      links = Math.floor(rng() * 180) + 4
    }

    const earningsValue = Math.round(base * multiplier * 100) / 100
    const clicks = Math.floor(earningsValue * (1.4 + rng() * 1.2))
    const conversions = Math.max(
      1,
      Math.floor(earningsValue / (4 + rng() * 6)),
    )
    const conversionRate = Math.round((conversions / Math.max(1, clicks)) * 1000) / 10

    const badges: AffiliateBadge[] = []
    if (i === 1) badges.push('gold')
    if (i === 2) badges.push('silver')
    if (i === 3) badges.push('bronze')
    if (streak >= 7) badges.push('hot_streak')
    if (joined <= 30 && i <= 50) badges.push('rising_star')
    if (!firstInNiche[niche]) {
      badges.push('niche_master')
      firstInNiche[niche] = true
    }
    if (links >= 100) badges.push('power_user')

    // Rank change: top ranks tend to be stable, mid-table fluctuates more
    let rankChange = 0
    if (i > 3) {
      const magnitude = Math.floor(rng() * 6) // 0..5
      const sign = rng() > 0.45 ? 1 : -1
      rankChange = sign * magnitude
      if (i <= 10 && Math.abs(rankChange) > 3) rankChange = Math.sign(rankChange) * 3
    } else {
      rankChange = 0 // podium stays stable
    }

    // Insert "You" at rank 17 (mid-table, decent performer)
    const isYou = i === 17

    const affiliateId = String(2000 + Math.floor(rng() * 8000))

    entries.push({
      rank: i,
      anonymousName: isYou ? 'You (Ahmad F.)' : `Affiliate #${affiliateId}`,
      affiliateId,
      niche,
      earningsRange: rangeFromEarnings(earningsValue),
      earningsValue,
      clicks,
      conversions,
      conversionRate,
      streakDays: streak,
      joinedDaysAgo: joined,
      activeLinks: links,
      badges,
      rankChange,
      isYou,
    })
  }

  // Ensure "You" entry gets a hot streak to feel rewarding
  const youEntry = entries.find((e) => e.isYou)
  if (youEntry && !youEntry.badges.includes('hot_streak')) {
    youEntry.streakDays = 9
    youEntry.badges.push('hot_streak')
  }
  if (youEntry) {
    youEntry.rankChange = 3 // user moved up 3 spots this period
  }

  return entries
}

export const leaderboardData: Record<LeaderboardPeriod, LeaderboardEntry[]> = {
  week: buildLeaderboard('week'),
  month: buildLeaderboard('month'),
  all: buildLeaderboard('all'),
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Ahmad Faiz',
    initials: 'AF',
    avatarColor: AVATAR_COLORS[0],
    location: 'Shah Alam, Selangor',
    quote:
      'I went from RM 200/month to RM 2,400 after using the AI Content generator. Sumpah best gila! Now my Shopee posts all auto-generated one.',
    earningsStat: 'RM 2,400/mo',
    rating: 5,
    verifiedSeller: true,
    niche: 'Electronics',
  },
  {
    id: 't2',
    name: 'Siti Nurhaliza',
    initials: 'SN',
    avatarColor: AVATAR_COLORS[1],
    location: 'Johor Bahru, Johor',
    quote:
      'Trend Spy is a game-changer. Found products I never knew were trending in Malaysia. My commission naik 3x in two months. Terbaik!',
    earningsStat: 'RM 8,500 in 30 days',
    rating: 5,
    verifiedSeller: true,
    niche: 'Beauty',
  },
  {
    id: 't3',
    name: 'Lim Wei Jie',
    initials: 'LW',
    avatarColor: AVATAR_COLORS[2],
    location: 'Georgetown, Penang',
    quote:
      'Multi-platform feature saved me so much time. I post one link, it goes to Shopee, TikTok Shop, and Lazada all at once. Crazy efficient lah.',
    earningsStat: 'RM 15K/mo',
    rating: 5,
    verifiedSeller: true,
    niche: 'Fashion',
  },
  {
    id: 't4',
    name: 'Priya Devi',
    initials: 'PD',
    avatarColor: AVATAR_COLORS[3],
    location: 'Klang, Selangor',
    quote:
      'The HERMES AI is like having a personal assistant 24/7. Ask anything, get answer straight away. Last time I check competitor also use this kind of tool, now I got same advantage.',
    earningsStat: 'RM 4,200/mo',
    rating: 5,
    verifiedSeller: false,
    niche: 'Home',
  },
  {
    id: 't5',
    name: 'Kumar Nair',
    initials: 'KN',
    avatarColor: AVATAR_COLORS[4],
    location: 'Ipoh, Perak',
    quote:
      'Abit skeptical at first lah, but after one week I close 12 sales using their trending products list. Now I everyday check Trend Spy before I post anything.',
    earningsStat: 'RM 6,300 in 30 days',
    rating: 5,
    verifiedSeller: true,
    niche: 'Electronics',
  },
  {
    id: 't6',
    name: 'Nur Aisyah',
    initials: 'NA',
    avatarColor: AVATAR_COLORS[5],
    location: 'Kota Bharu, Kelantan',
    quote:
      'As a mom with two kids, I really appreciate the Auto Post feature. Set everything at night, wake up got sales already. Best part-time income ever!',
    earningsStat: 'RM 3,100/mo',
    rating: 5,
    verifiedSeller: true,
    niche: 'Food',
  },
  {
    id: 't7',
    name: 'David Wong',
    initials: 'DW',
    avatarColor: AVATAR_COLORS[6],
    location: 'Kuala Lumpur',
    quote:
      'The analytics dashboard is next level. I can see exactly which product is converting, which one is wasting my time. Cut my dead links from 40 to 8 in one week.',
    earningsStat: 'RM 9,800/mo',
    rating: 5,
    verifiedSeller: true,
    niche: 'Home',
  },
  {
    id: 't8',
    name: 'Farah Iman',
    initials: 'FI',
    avatarColor: AVATAR_COLORS[7],
    location: 'Putrajaya',
    quote:
      'I joined as a beginner with zero knowledge about affiliate marketing. Three months later, I make more than my day job salary. The community here also very supportive!',
    earningsStat: 'RM 5,600/mo',
    rating: 5,
    verifiedSeller: true,
    niche: 'Beauty',
  },
]

// ─── Case Studies ─────────────────────────────────────────────────────────────

export const caseStudies: CaseStudy[] = [
  {
    id: 'cs1',
    title: 'How Ahmad Made RM 8,500 in 30 Days Using Trend Spy',
    author: 'Ahmad Faiz',
    authorInitials: 'AF',
    authorAvatarColor: AVATAR_COLORS[0],
    verified: true,
    duration: '30 days',
    earnings: 'RM 8,500',
    heroStat: 'RM 8,500',
    heroStatLabel: 'Total earnings in 30 days',
    heroGradient: 'from-amber-500 via-orange-500 to-rose-500',
    summary:
      'Ahmad used Trend Spy to identify 5 trending electronics products before competitors, then generated Manglish-flavoured content with HERMES AI to drive 312% engagement lift.',
    strategies: [
      'Checked Trend Spy daily at 9 AM for fresh trending products',
      'Generated AI Content with Manglish personality for authentic local feel',
      'Posted across 3 platforms simultaneously using Multi-Platform feature',
    ],
    challenge: {
      heading: 'The Challenge',
      body: 'Ahmad was earning only RM 200-400 per month as a Shopee affiliate. He spent hours browsing Shopee manually looking for trending products, with no real way to know which ones were actually gaining momentum. His content was generic English that did not resonate with Malaysian buyers. Conversion rate was stuck at 1.2%.',
    },
    strategy: {
      heading: 'The Strategy',
      body: 'Ahmad subscribed to TheViralFindsMY Pro plan and committed to a daily routine: check Trend Spy every morning, pick 2-3 trending products with low competition but high velocity, generate Manglish content with HERMES AI, and post across Shopee, TikTok Shop, and Lazada simultaneously.',
    },
    execution: {
      heading: 'The Execution',
      body: 'Each morning at 9 AM, Ahmad reviewed the Trend Spy heat map. He focused on products with competition level "Low" or "Medium" and velocity trending upward. He then used the AI Content Generator with platform previews to create three tailored captions (one per platform). The Multi-Platform feature auto-published everything in one click.',
    },
    results: {
      heading: 'The Results',
      body: 'In 30 days, Ahmad earned RM 8,500 in commission — a 42x increase from his previous monthly average. His conversion rate jumped from 1.2% to 4.8%, and his best-performing product (a RM 89 wireless earbuds) drove RM 2,100 alone. Three of his TikTok Shop videos went viral with 50K+ views.',
    },
    tips: {
      heading: 'Ahmad\'s Tips for New Affiliates',
      body: '1) Consistency beats intensity. Post daily, even if just one product. 2) Always check Trend Spy before posting — never guess what is trending. 3) Use Manglish in your captions, not formal English. Malaysian buyers relate better to local flavour. 4) Don\'t ignore TikTok Shop — it is the fastest growing platform in Malaysia right now.',
    },
  },
  {
    id: 'cs2',
    title: "Siti's Strategy: 23% Conversion Rate with AI Content",
    author: 'Siti Nurhaliza',
    authorInitials: 'SN',
    authorAvatarColor: AVATAR_COLORS[1],
    verified: true,
    duration: '45 days',
    earnings: 'RM 12,300',
    heroStat: '23%',
    heroStatLabel: 'Conversion rate (industry avg: 2-5%)',
    heroGradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    summary:
      'Siti cracked the conversion code by combining AI Content Generator with platform-specific previews and A/B testing different caption styles.',
    strategies: [
      'A/B tested 3 caption styles per product (Urgency vs Curiosity vs Direct)',
      'Used platform preview mock to see exactly how the post looks',
      'Saved winning captions to Library for reuse on similar products',
    ],
    challenge: {
      heading: 'The Challenge',
      body: 'Siti was getting plenty of clicks but very few conversions. Her old conversion rate hovered around 1.8%, which is below the Shopee affiliate average. She had no idea why some of her posts converted and others did not. Her content was generic and templated.',
    },
    strategy: {
      heading: 'The Strategy',
      body: 'Siti decided to treat content like a science experiment. For every product, she generated three different caption styles using the AI Content Generator: Urgency ("Last 5 units!"), Curiosity ("You won\'t believe what this gadget does"), and Direct ("RM 89 wireless earbuds, free shipping"). She then A/B tested them using the built-in A/B Testing module.',
    },
    execution: {
      heading: 'The Execution',
      body: 'Siti spent 90 minutes daily generating content and queuing up A/B tests. She used the platform preview feature to ensure her captions displayed correctly on each platform (especially TikTok Shop where character limits matter). Winning captions were saved to her Library with tags for niche and style.',
    },
    results: {
      heading: 'The Results',
      body: 'After 45 days of disciplined A/B testing, Siti\'s conversion rate skyrocketed to 23% — nearly 5x the industry average. Her Curiosity-style captions outperformed Urgency by 47% on Beauty products. She earned RM 12,300 in commission and was invited to join Shopee\'s Top Affiliate Program.',
    },
    tips: {
      heading: 'Siti\'s Tips for Higher Conversions',
      body: '1) Never post a caption you have not A/B tested. Always have a control. 2) Curiosity hooks work best for Beauty and Fashion. Urgency works best for Electronics. 3) Save your winning captions — they are gold. Build a Library of proven templates. 4) Use platform previews — what looks good on Shopee may look terrible on TikTok.',
    },
  },
  {
    id: 'cs3',
    title: 'Lim Wei Jie Scaled to RM 15K/mo with Multi-Platform',
    author: 'Lim Wei Jie',
    authorInitials: 'LW',
    authorAvatarColor: AVATAR_COLORS[2],
    verified: true,
    duration: '60 days',
    earnings: 'RM 30,000',
    heroStat: 'RM 15K',
    heroStatLabel: 'Monthly recurring earnings',
    heroGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    summary:
      'Lim Wei Jie scaled his affiliate business from a single Shopee account to a 3-platform operation by leveraging Multi-Platform publishing and Unified Earnings analytics.',
    strategies: [
      'Connected Shopee, TikTok Shop, and Lazada accounts on Day 1',
      'Used Unified Earnings dashboard to identify which platform paid highest commission per product',
      'Auto-posted to all 3 platforms with one click using Multi-Platform feature',
    ],
    challenge: {
      heading: 'The Challenge',
      body: 'Lim was making RM 4,000-5,000 per month on Shopee alone but felt plateaued. He wanted to expand to TikTok Shop and Lazada but dreaded the manual work of cross-posting and tracking earnings separately across three platforms. He was also losing sales because some products converted better on TikTok than Shopee.',
    },
    strategy: {
      heading: 'The Strategy',
      body: 'Lim connected all three platforms (Shopee, TikTok Shop, Lazada) to TheViralFindsMY on Day 1. He committed to a "post once, publish everywhere" workflow using the Multi-Platform feature. He used the Unified Earnings dashboard daily to identify which platform was paying the highest commission for each product category.',
    },
    execution: {
      heading: 'The Execution',
      body: 'Lim spent 2 hours each morning generating one piece of AI content per trending product and clicking "Publish to All". The Multi-Platform feature handled platform-specific formatting, hashtags, and character limits automatically. He reviewed his Unified Earnings dashboard weekly and doubled down on whichever platform was winning for each product category.',
    },
    results: {
      heading: 'The Results',
      body: 'Within 60 days, Lim hit RM 15,000/month recurring earnings — 3x his previous income. TikTok Shop became his biggest earner (40% of total), followed by Shopee (35%) and Lazada (25%). He discovered that TikTok Shop outperformed Shopee by 2.5x on Beauty and Fashion products, while Electronics sold better on Lazada.',
    },
    tips: {
      heading: 'Lim\'s Tips for Multi-Platform Success',
      body: '1) Connect all your platforms on Day 1. Do not wait until you "have time". 2) Always check Unified Earnings before deciding which platform to push harder on. 3) Multi-Platform publishing is not just convenience — it is essential for not missing sales. 4) Each platform has its own audience. Do not assume one size fits all.',
    },
  },
]

// ─── Changelog ────────────────────────────────────────────────────────────────

export const changelogEntries: ChangelogEntry[] = [
  {
    version: 'v8.1',
    date: '2025-03-12',
    title: 'HERMES AI gets Manglish personality 🤖',
    description:
      'HERMES now responds with authentic Malaysian Manglish flair. Try asking "Why my sales drop ah?" and feel the local touch.',
    category: 'Feature',
  },
  {
    version: 'v8.0',
    date: '2025-03-05',
    title: 'Multi-platform: TikTok Shop + Lazada now live!',
    description:
      'Connect your TikTok Shop and Lazada affiliate accounts. Publish once, reach all three platforms simultaneously.',
    category: 'Feature',
  },
  {
    version: 'v7.9',
    date: '2025-02-24',
    title: 'AI Content Generator with platform previews',
    description:
      'See exactly how your post will look on Shopee, TikTok Shop, or Lazada before publishing. No more ugly truncation.',
    category: 'Feature',
  },
  {
    version: 'v7.8',
    date: '2025-02-15',
    title: 'Trend Spy heat map + competitor watch',
    description:
      'Visual heat map of trending products by category. See which competitors are promoting the same products.',
    category: 'Feature',
  },
  {
    version: 'v7.7',
    date: '2025-02-08',
    title: 'A/B Testing module released',
    description:
      'Test up to 6 caption variations per product. Auto-pick the winner based on conversion rate after 24 hours.',
    category: 'Feature',
  },
  {
    version: 'v7.6',
    date: '2025-01-30',
    title: 'Live earnings ticker + real-time notifications',
    description:
      'See your earnings update live as conversions happen. New socket.io-powered notification system delivers alerts in <100ms.',
    category: 'Feature',
  },
  {
    version: 'v7.5',
    date: '2025-01-22',
    title: 'Performance score now includes consistency',
    description:
      'Your Performance Score now factors in posting consistency. Post daily for a 15% boost to your score.',
    category: 'Improvement',
  },
  {
    version: 'v7.4',
    date: '2025-01-15',
    title: 'Mobile bottom navigation + swipe gestures',
    description:
      'New mobile-first design with bottom nav bar and swipe gestures between dashboard sections. Pull-to-refresh enhanced.',
    category: 'Improvement',
  },
  {
    version: 'v7.3',
    date: '2025-01-08',
    title: 'Critical security patch: API key rotation',
    description:
      'Fixed an issue where API keys were not properly rotated every 90 days. All keys now auto-rotate on schedule.',
    category: 'Security',
  },
  {
    version: 'v7.2',
    date: '2024-12-28',
    title: 'Achievements system with 24 unlockable badges',
    description:
      'Gamify your affiliate journey. Earn badges for milestones like "First RM 100", "100 Links", "7-Day Streak".',
    category: 'Feature',
  },
  {
    version: 'v7.1',
    date: '2024-12-15',
    title: 'Fixed: TikTok preview cut off captions',
    description:
      'Captions on TikTok Shop previews were being cut off at character 140. Now properly respects platform character limits.',
    category: 'Fix',
  },
  {
    version: 'v7.0',
    date: '2024-12-01',
    title: 'Major: White-label mode for agencies',
    description:
      'Run your own branded affiliate platform. Custom domain, logo, color scheme. Perfect for agencies managing multiple clients.',
    category: 'Feature',
  },
  {
    version: 'v6.9',
    date: '2024-11-22',
    title: 'GDPR compliance improvements',
    description:
      'Enhanced data export and delete features. Users can now download all their data in JSON format with one click.',
    category: 'Security',
  },
  {
    version: 'v6.8',
    date: '2024-11-10',
    title: 'Referral program: 5% commission for 6 months',
    description:
      'Earn 5% of your referrals\' commission for the first 6 months after they join. No cap on earnings.',
    category: 'Feature',
  },
  {
    version: 'v6.7',
    date: '2024-10-28',
    title: 'Calendar AI: optimal posting schedule',
    description:
      'AI now suggests the best time to post based on your audience activity patterns. Raya season auto-detected.',
    category: 'Feature',
  },
  {
    version: 'v6.6',
    date: '2024-10-15',
    title: 'Hashtag AI: 25+ hashtag suggestions per post',
    description:
      'Get up to 25 trending hashtag suggestions per product. Auto-filtered to avoid banned tags.',
    category: 'Feature',
  },
  {
    version: 'v6.5',
    date: '2024-10-02',
    title: 'Improved: dashboard loads 40% faster',
    description:
      'Optimized data fetching and caching. Dashboard now renders in under 800ms even with 1000+ active links.',
    category: 'Improvement',
  },
  {
    version: 'v6.4',
    date: '2024-09-20',
    title: 'Fixed: leaderboard not updating weekly',
    description:
      'Weekly leaderboard was showing stale data from previous week. Now refreshes every Monday 9 AM MYT.',
    category: 'Fix',
  },
  {
    version: 'v6.3',
    date: '2024-09-08',
    title: 'Marketplace: buy/sell content templates',
    description:
      'Buy proven content templates from top affiliates. Or sell your own templates to earn passive income.',
    category: 'Feature',
  },
  {
    version: 'v6.2',
    date: '2024-08-25',
    title: 'Team Dashboard: collaborate with up to 10 members',
    description:
      'Invite team members to manage your affiliate business together. Role-based access control included.',
    category: 'Feature',
  },
  {
    version: 'v6.1',
    date: '2024-08-12',
    title: 'Security: 2FA now mandatory for Pro plans',
    description:
      'Two-factor authentication is now required for all Pro and Business plan accounts. Use Google Authenticator or SMS.',
    category: 'Security',
  },
]

// ─── Live Ticker Phrases ──────────────────────────────────────────────────────

export const tickerTemplates: Array<{
  template: TickerEntry['template']
  platform: TickerEntry['platform']
  subjectFn: () => string
  amountRange: [number, number]
}> = [
  {
    template: 'earned',
    platform: 'Shopee',
    subjectFn: () => `Affiliate #${2000 + Math.floor(rng() * 8000)}`,
    amountRange: [12, 480],
  },
  {
    template: 'commission',
    platform: 'TikTok Shop',
    subjectFn: () => {
      const names = ['Siti N.', 'Ahmad F.', 'Lim W.', 'Priya D.', 'Kumar N.', 'Nur A.', 'David W.', 'Farah I.']
      return pick(names)
    },
    amountRange: [4, 95],
  },
  {
    template: 'payout',
    platform: 'Shopee',
    subjectFn: () => `Affiliate #${2000 + Math.floor(rng() * 8000)}`,
    amountRange: [120, 1850],
  },
  {
    template: 'sale',
    platform: 'Lazada',
    subjectFn: () => `Affiliate #${2000 + Math.floor(rng() * 8000)}`,
    amountRange: [8, 240],
  },
  {
    template: 'milestone',
    platform: 'TikTok Shop',
    subjectFn: () => {
      const names = ['Siti N.', 'Ahmad F.', 'Lim W.', 'Priya D.']
      return pick(names)
    },
    amountRange: [1000, 15000],
  },
]

const TICKER_VERBS: Record<TickerEntry['template'], string> = {
  earned: 'just earned',
  commission: 'commission for',
  payout: 'payout to',
  sale: 'sale by',
  milestone: 'milestone reached by',
}

const TICKER_PLATFORM_LABEL: Record<TickerEntry['platform'], string> = {
  Shopee: 'Shopee',
  'TikTok Shop': 'TikTok Shop',
  Lazada: 'Lazada',
}

export function buildTickerEntry(): TickerEntry {
  const tpl = tickerTemplates[Math.floor(Math.random() * tickerTemplates.length)]
  const amount =
    Math.round(
      (tpl.amountRange[0] +
        Math.random() * (tpl.amountRange[1] - tpl.amountRange[0])) * 100,
    ) / 100
  return {
    id: `tick_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    template: tpl.template,
    amount,
    subject: tpl.subjectFn(),
    platform: tpl.platform,
  }
}

export function formatTickerEntry(entry: TickerEntry): string {
  const verb = TICKER_VERBS[entry.template]
  const platform = TICKER_PLATFORM_LABEL[entry.platform]
  const formattedAmount = `RM ${entry.amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
  switch (entry.template) {
    case 'earned':
      return `${formattedAmount} ${verb} ${entry.subject} on ${platform}`
    case 'commission':
      return `${formattedAmount} ${verb} ${entry.subject} on ${platform}`
    case 'payout':
      return `${formattedAmount} ${verb} ${entry.subject} on ${platform}`
    case 'sale':
      return `${formattedAmount} ${verb} ${entry.subject} on ${platform}`
    case 'milestone':
      return `${formattedAmount} ${verb} ${entry.subject} on ${platform}`
    default:
      return `${formattedAmount} ${verb} ${entry.subject}`
  }
}

// ─── Security Badges ──────────────────────────────────────────────────────────

export interface SecurityBadge {
  id: string
  label: string
  icon: 'lock' | 'badge-check' | 'shield' | 'key'
  tooltip: string
  detail: string
}

export const securityBadges: SecurityBadge[] = [
  {
    id: 'ssl',
    label: 'Secured by SSL',
    icon: 'lock',
    tooltip: '256-bit SSL encryption',
    detail:
      'All traffic between your browser and our servers is encrypted with industry-standard 256-bit SSL/TLS 1.3. Look for the padlock icon in your address bar.',
  },
  {
    id: 'shopee-partner',
    label: 'Official Shopee Partner',
    icon: 'badge-check',
    tooltip: 'Verified Shopee Affiliate API partner',
    detail:
      'We are an official registered partner of the Shopee Affiliate Program. Our API integration is reviewed and approved by Shopee Malaysia.',
  },
  {
    id: 'gdpr',
    label: 'GDPR Compliant',
    icon: 'shield',
    tooltip: 'PDPA + GDPR data protection',
    detail:
      'We comply with both Malaysia\'s PDPA (Personal Data Protection Act 2010) and the EU GDPR. Export or delete your data anytime in Settings → Privacy.',
  },
  {
    id: 'encryption',
    label: 'Bank-grade Encryption',
    icon: 'key',
    tooltip: 'AES-256 at rest + in transit',
    detail:
      'Your API keys and personal data are encrypted at rest with AES-256 — the same standard used by major banks. Keys are rotated every 90 days automatically.',
  },
]

// ─── Badge metadata for leaderboard rendering ─────────────────────────────────

export const badgeMetadata: Record<
  AffiliateBadge,
  { label: string; emoji: string; className: string; tooltip: string }
> = {
  gold: {
    label: 'Gold',
    emoji: '🥇',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    tooltip: '#1 affiliate this period',
  },
  silver: {
    label: 'Silver',
    emoji: '🥈',
    className: 'bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30',
    tooltip: '#2 affiliate this period',
  },
  bronze: {
    label: 'Bronze',
    emoji: '🥉',
    className: 'bg-orange-700/15 text-orange-700 dark:text-orange-300 border-orange-700/30',
    tooltip: '#3 affiliate this period',
  },
  hot_streak: {
    label: 'Hot Streak',
    emoji: '🔥',
    className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    tooltip: '7+ day posting streak',
  },
  rising_star: {
    label: 'Rising Star',
    emoji: '📈',
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    tooltip: 'Newcomer in top 50',
  },
  niche_master: {
    label: 'Niche Master',
    emoji: '🎯',
    className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    tooltip: 'Highest earner in their niche',
  },
  power_user: {
    label: 'Power User',
    emoji: '⚡',
    className: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
    tooltip: '100+ active affiliate links',
  },
}
