/**
 * Fasa 4.3 — Team/Agency Multi-User Dashboard
 *
 * In-memory mock data store for the team module. Provides:
 *   - 3 teams (2, 5, 12 members)
 *   - 19 team members across all teams
 *   - 6 pending invitations
 *   - 8 shared affiliate links + 6 shared content pieces
 *   - 12 months of trend data per team
 *   - Recent activity feed entries
 *
 * The store is intentionally mutable — the API routes update this state in
 * memory so the GET/POST round-trips within the same dev server process.
 *
 * NOTE: Module state is reset whenever the dev server hot-reloads this file.
 */

import type {
  Team,
  TeamMember,
  TeamInvitation,
  SharedResource,
  TeamActivity,
  TeamStats,
  TeamAnalytics,
  TeamRole,
  TeamPlan,
} from './types'
import { PLAN_MEMBER_LIMITS } from './types'

// ─── Avatar color palette (avoid blue/indigo) ───────────────────────────────
const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-lime-600',
  'bg-red-500',
  'bg-green-600',
]

function colorFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ─── Teams ──────────────────────────────────────────────────────────────────

export const TEAMS: Team[] = [
  {
    id: 'team_beauty_bosses',
    name: 'Beauty Bosses Agency',
    description:
      'Kolektif affiliate beauty & fashion Malaysia. Kami fokus pada skincare, makeup, dan trend fashion modest.',
    ownerId: 'user_aisyah',
    ownerName: 'Aisyah Rahman',
    memberCount: 5,
    memberLimit: PLAN_MEMBER_LIMITS.agency,
    plan: 'agency' as TeamPlan,
    niches: ['Beauty', 'Fashion', 'Skincare'],
    avatarColor: 'bg-rose-500',
    createdAt: '2024-08-12T03:00:00.000Z',
    defaultRole: 'member' as TeamRole,
  },
  {
    id: 'team_tech_review_my',
    name: 'Tech Review MY',
    description:
      'Team reviewer teknologi terbesar di Malaysia. Gadgets, gaming gear, dan smart home reviews.',
    ownerId: 'user_raj',
    ownerName: 'Raj Kumar',
    memberCount: 12,
    memberLimit: PLAN_MEMBER_LIMITS.enterprise,
    plan: 'enterprise' as TeamPlan,
    niches: ['Tech', 'Gaming', 'Smart Home'],
    avatarColor: 'bg-emerald-500',
    createdAt: '2024-03-22T03:00:00.000Z',
    defaultRole: 'member' as TeamRole,
  },
  {
    id: 'team_home_living',
    name: 'Home & Living Co',
    description:
      'Pasangan affiliate yang fokus pada home improvement, kitchenware, dan dekorasi rumah.',
    ownerId: 'user_mei_ling',
    ownerName: 'Mei Ling Tan',
    memberCount: 2,
    memberLimit: PLAN_MEMBER_LIMITS.free,
    plan: 'free' as TeamPlan,
    niches: ['Home', 'Kitchen', 'Decor'],
    avatarColor: 'bg-amber-500',
    createdAt: '2025-01-05T03:00:00.000Z',
    defaultRole: 'member' as TeamRole,
  },
]

// ─── Team Members ───────────────────────────────────────────────────────────

export const TEAM_MEMBERS: TeamMember[] = [
  // Beauty Bosses Agency (5 members)
  {
    id: 'tm_aisyah',
    teamId: 'team_beauty_bosses',
    userId: 'user_aisyah',
    name: 'Aisyah Rahman',
    email: 'aisyah@beautybosses.my',
    avatarColor: 'bg-rose-500',
    initials: 'AR',
    role: 'owner' as TeamRole,
    joinedAt: '2024-08-12T03:00:00.000Z',
    lastActiveAt: '2025-06-14T08:30:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 28,
      contentCreated: 42,
      clicksGenerated: 18420,
      conversionsGenerated: 892,
      earningsGenerated: 18960.5,
    },
  },
  {
    id: 'tm_nurul',
    teamId: 'team_beauty_bosses',
    userId: 'user_nurul',
    name: 'Nurul Huda',
    email: 'nurul@beautybosses.my',
    avatarColor: 'bg-pink-500',
    initials: 'NH',
    role: 'admin' as TeamRole,
    joinedAt: '2024-08-20T03:00:00.000Z',
    lastActiveAt: '2025-06-14T06:15:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 22,
      contentCreated: 35,
      clicksGenerated: 14200,
      conversionsGenerated: 678,
      earningsGenerated: 13420.0,
    },
  },
  {
    id: 'tm_farah',
    teamId: 'team_beauty_bosses',
    userId: 'user_farah',
    name: 'Farah Diyanah',
    email: 'farah@beautybosses.my',
    avatarColor: 'bg-fuchsia-500',
    initials: 'FD',
    role: 'member' as TeamRole,
    joinedAt: '2024-09-05T03:00:00.000Z',
    lastActiveAt: '2025-06-13T22:00:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 18,
      contentCreated: 28,
      clicksGenerated: 10850,
      conversionsGenerated: 412,
      earningsGenerated: 8530.75,
    },
  },
  {
    id: 'tm_siti',
    teamId: 'team_beauty_bosses',
    userId: 'user_siti',
    name: 'Siti Khadijah',
    email: 'siti@beautybosses.my',
    avatarColor: 'bg-purple-500',
    initials: 'SK',
    role: 'member' as TeamRole,
    joinedAt: '2024-10-12T03:00:00.000Z',
    lastActiveAt: '2025-06-12T18:45:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 12,
      contentCreated: 19,
      clicksGenerated: 7320,
      conversionsGenerated: 285,
      earningsGenerated: 4768.5,
    },
  },
  {
    id: 'tm_layla',
    teamId: 'team_beauty_bosses',
    userId: 'user_layla',
    name: 'Layla Aminah',
    email: 'layla@beautybosses.my',
    avatarColor: 'bg-orange-500',
    initials: 'LA',
    role: 'viewer' as TeamRole,
    joinedAt: '2025-05-01T03:00:00.000Z',
    lastActiveAt: '2025-06-10T12:00:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 0,
      contentCreated: 0,
      clicksGenerated: 0,
      conversionsGenerated: 0,
      earningsGenerated: 0,
    },
  },

  // Tech Review MY (12 members)
  {
    id: 'tm_raj',
    teamId: 'team_tech_review_my',
    userId: 'user_raj',
    name: 'Raj Kumar',
    email: 'raj@techreview.my',
    avatarColor: 'bg-emerald-500',
    initials: 'RK',
    role: 'owner' as TeamRole,
    joinedAt: '2024-03-22T03:00:00.000Z',
    lastActiveAt: '2025-06-14T09:00:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 64,
      contentCreated: 89,
      clicksGenerated: 42100,
      conversionsGenerated: 1840,
      earningsGenerated: 28640.0,
    },
  },
  {
    id: 'tm_arjun',
    teamId: 'team_tech_review_my',
    userId: 'user_arjun',
    name: 'Arjun Pillai',
    email: 'arjun@techreview.my',
    avatarColor: 'bg-teal-500',
    initials: 'AP',
    role: 'admin' as TeamRole,
    joinedAt: '2024-04-02T03:00:00.000Z',
    lastActiveAt: '2025-06-14T07:30:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 52,
      contentCreated: 78,
      clicksGenerated: 38400,
      conversionsGenerated: 1620,
      earningsGenerated: 22180.5,
    },
  },
  {
    id: 'tm_daniel',
    teamId: 'team_tech_review_my',
    userId: 'user_daniel',
    name: 'Daniel Wong',
    email: 'daniel@techreview.my',
    avatarColor: 'bg-cyan-500',
    initials: 'DW',
    role: 'admin' as TeamRole,
    joinedAt: '2024-04-15T03:00:00.000Z',
    lastActiveAt: '2025-06-13T23:45:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 45,
      contentCreated: 65,
      clicksGenerated: 32100,
      conversionsGenerated: 1340,
      earningsGenerated: 18920.75,
    },
  },
  {
    id: 'tm_hafiz',
    teamId: 'team_tech_review_my',
    userId: 'user_hafiz',
    name: 'Hafiz Ibrahim',
    email: 'hafiz@techreview.my',
    avatarColor: 'bg-green-600',
    initials: 'HI',
    role: 'member' as TeamRole,
    joinedAt: '2024-05-10T03:00:00.000Z',
    lastActiveAt: '2025-06-14T05:00:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 38,
      contentCreated: 54,
      clicksGenerated: 26800,
      conversionsGenerated: 1120,
      earningsGenerated: 14580.0,
    },
  },
  {
    id: 'tm_jason',
    teamId: 'team_tech_review_my',
    userId: 'user_jason',
    name: 'Jason Lim',
    email: 'jason@techreview.my',
    avatarColor: 'bg-lime-600',
    initials: 'JL',
    role: 'member' as TeamRole,
    joinedAt: '2024-06-01T03:00:00.000Z',
    lastActiveAt: '2025-06-13T20:15:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 32,
      contentCreated: 48,
      clicksGenerated: 21400,
      conversionsGenerated: 890,
      earningsGenerated: 11420.0,
    },
  },
  {
    id: 'tm_kevin',
    teamId: 'team_tech_review_my',
    userId: 'user_kevin',
    name: 'Kevin Tan',
    email: 'kevin@techreview.my',
    avatarColor: 'bg-amber-500',
    initials: 'KT',
    role: 'member' as TeamRole,
    joinedAt: '2024-07-08T03:00:00.000Z',
    lastActiveAt: '2025-06-12T16:30:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 28,
      contentCreated: 41,
      clicksGenerated: 18200,
      conversionsGenerated: 760,
      earningsGenerated: 9840.5,
    },
  },
  {
    id: 'tm_priya',
    teamId: 'team_tech_review_my',
    userId: 'user_priya',
    name: 'Priya Devi',
    email: 'priya@techreview.my',
    avatarColor: 'bg-rose-500',
    initials: 'PD',
    role: 'member' as TeamRole,
    joinedAt: '2024-08-19T03:00:00.000Z',
    lastActiveAt: '2025-06-13T19:00:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 24,
      contentCreated: 36,
      clicksGenerated: 15600,
      conversionsGenerated: 645,
      earningsGenerated: 8240.25,
    },
  },
  {
    id: 'tm_marcus',
    teamId: 'team_tech_review_my',
    userId: 'user_marcus',
    name: 'Marcus Lee',
    email: 'marcus@techreview.my',
    avatarColor: 'bg-orange-500',
    initials: 'ML',
    role: 'member' as TeamRole,
    joinedAt: '2024-09-25T03:00:00.000Z',
    lastActiveAt: '2025-06-13T14:20:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 19,
      contentCreated: 28,
      clicksGenerated: 12800,
      conversionsGenerated: 520,
      earningsGenerated: 6680.0,
    },
  },
  {
    id: 'tm_zhi_hao',
    teamId: 'team_tech_review_my',
    userId: 'user_zhi_hao',
    name: 'Zhi Hao Chen',
    email: 'zhihao@techreview.my',
    avatarColor: 'bg-red-500',
    initials: 'ZC',
    role: 'member' as TeamRole,
    joinedAt: '2024-10-30T03:00:00.000Z',
    lastActiveAt: '2025-06-12T22:00:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 16,
      contentCreated: 22,
      clicksGenerated: 9800,
      conversionsGenerated: 385,
      earningsGenerated: 4920.0,
    },
  },
  {
    id: 'tm_sarah',
    teamId: 'team_tech_review_my',
    userId: 'user_sarah',
    name: 'Sarah Yusof',
    email: 'sarah@techreview.my',
    avatarColor: 'bg-fuchsia-500',
    initials: 'SY',
    role: 'member' as TeamRole,
    joinedAt: '2024-12-05T03:00:00.000Z',
    lastActiveAt: '2025-06-11T17:30:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 12,
      contentCreated: 18,
      clicksGenerated: 7200,
      conversionsGenerated: 280,
      earningsGenerated: 3580.0,
    },
  },
  {
    id: 'tm_aaron',
    teamId: 'team_tech_review_my',
    userId: 'user_aaron',
    name: 'Aaron Goh',
    email: 'aaron@techreview.my',
    avatarColor: 'bg-purple-500',
    initials: 'AG',
    role: 'member' as TeamRole,
    joinedAt: '2025-02-14T03:00:00.000Z',
    lastActiveAt: '2025-06-10T11:45:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 8,
      contentCreated: 12,
      clicksGenerated: 4800,
      conversionsGenerated: 165,
      earningsGenerated: 2120.0,
    },
  },
  {
    id: 'tm_nicole',
    teamId: 'team_tech_review_my',
    userId: 'user_nicole',
    name: ' Nicole Tan',
    email: 'nicole@techreview.my',
    avatarColor: 'bg-pink-500',
    initials: 'NT',
    role: 'viewer' as TeamRole,
    joinedAt: '2025-04-20T03:00:00.000Z',
    lastActiveAt: '2025-06-09T09:00:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 0,
      contentCreated: 0,
      clicksGenerated: 0,
      conversionsGenerated: 0,
      earningsGenerated: 0,
    },
  },

  // Home & Living Co (2 members)
  {
    id: 'tm_mei_ling',
    teamId: 'team_home_living',
    userId: 'user_mei_ling',
    name: 'Mei Ling Tan',
    email: 'meiling@homeliving.my',
    avatarColor: 'bg-amber-500',
    initials: 'MT',
    role: 'owner' as TeamRole,
    joinedAt: '2025-01-05T03:00:00.000Z',
    lastActiveAt: '2025-06-14T07:00:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 14,
      contentCreated: 20,
      clicksGenerated: 8600,
      conversionsGenerated: 320,
      earningsGenerated: 7820.0,
    },
  },
  {
    id: 'tm_chong',
    teamId: 'team_home_living',
    userId: 'user_chong',
    name: 'Chong Wei',
    email: 'chong@homeliving.my',
    avatarColor: 'bg-teal-500',
    initials: 'CW',
    role: 'member' as TeamRole,
    joinedAt: '2025-01-08T03:00:00.000Z',
    lastActiveAt: '2025-06-13T16:30:00.000Z',
    status: 'active',
    contribution: {
      linksShared: 9,
      contentCreated: 14,
      clicksGenerated: 5400,
      conversionsGenerated: 198,
      earningsGenerated: 4630.0,
    },
  },
]

// ─── Invitations ────────────────────────────────────────────────────────────

export const TEAM_INVITATIONS: TeamInvitation[] = [
  {
    id: 'inv_001',
    teamId: 'team_beauty_bosses',
    teamName: 'Beauty Bosses Agency',
    email: 'honey.lee@gmail.com',
    role: 'member',
    invitedBy: 'Aisyah Rahman',
    message: 'Hi Honey! Jom join team kita. You memang talented dalam beauty reviews!',
    createdAt: '2025-06-10T03:00:00.000Z',
    status: 'pending',
    expiresAt: '2025-06-24T03:00:00.000Z',
  },
  {
    id: 'inv_002',
    teamId: 'team_beauty_bosses',
    teamName: 'Beauty Bosses Agency',
    email: 'alya.zainudin@gmail.com',
    role: 'viewer',
    invitedBy: 'Nurul Huda',
    message: 'Salam Alya, kami nak you observe dulu sebelum join full-time.',
    createdAt: '2025-06-12T03:00:00.000Z',
    status: 'pending',
    expiresAt: '2025-06-26T03:00:00.000Z',
  },
  {
    id: 'inv_003',
    teamId: 'team_tech_review_my',
    teamName: 'Tech Review MY',
    email: 'victor.ong@gmail.com',
    role: 'member',
    invitedBy: 'Raj Kumar',
    message: 'Bro Victor, your GPU reviews terbaik. Join la team kita.',
    createdAt: '2025-06-08T03:00:00.000Z',
    status: 'pending',
    expiresAt: '2025-06-22T03:00:00.000Z',
  },
  {
    id: 'inv_004',
    teamId: 'team_tech_review_my',
    teamName: 'Tech Review MY',
    email: 'nadia.aziz@gmail.com',
    role: 'member',
    invitedBy: 'Arjun Pillai',
    message: 'Hi Nadia, join our team. Kami memerlukan someone yang expert dalam smart home.',
    createdAt: '2025-06-11T03:00:00.000Z',
    status: 'pending',
    expiresAt: '2025-06-25T03:00:00.000Z',
  },
  {
    id: 'inv_005',
    teamId: 'team_tech_review_my',
    teamName: 'Tech Review MY',
    email: 'bryan.chan@gmail.com',
    role: 'admin',
    invitedBy: 'Raj Kumar',
    message: 'Bryan, kami nak you jadi admin sebab you paling konsisten.',
    createdAt: '2025-06-13T03:00:00.000Z',
    status: 'pending',
    expiresAt: '2025-06-27T03:00:00.000Z',
  },
  {
    id: 'inv_006',
    teamId: 'team_home_living',
    teamName: 'Home & Living Co',
    email: 'grace.yap@gmail.com',
    role: 'member',
    invitedBy: 'Mei Ling Tan',
    message: 'Hi Grace, jom join! We need help dengan kitchenware niche.',
    createdAt: '2025-06-09T03:00:00.000Z',
    status: 'pending',
    expiresAt: '2025-06-23T03:00:00.000Z',
  },
]

// ─── Shared Resources ───────────────────────────────────────────────────────

export const SHARED_RESOURCES: SharedResource[] = [
  // Shared Affiliate Links (8)
  {
    id: 'res_link_001',
    teamId: 'team_beauty_bosses',
    type: 'affiliate_link',
    title: 'LANEIGE Lip Sleeping Mask — Berry',
    description: 'Top-performing affiliate link untuk LANEIGE Lip Mask. Convert tinggi untuk female audience 18-34.',
    product: 'LANEIGE Lip Sleeping Mask Berry 20g',
    platform: 'shopee',
    affiliateUrl: 'https://shopee.my/aff/laneige-lip-mask?ref=team-bb',
    clicks: 4210,
    conversions: 312,
    earnings: 4243.2,
    ownerId: 'user_aisyah',
    ownerName: 'Aisyah Rahman',
    createdAt: '2025-02-01T03:00:00.000Z',
    tags: ['beauty', 'skincare', 'lipcare'],
  },
  {
    id: 'res_link_002',
    teamId: 'team_beauty_bosses',
    type: 'affiliate_link',
    title: 'SOMETHINC Niacinamide Serum',
    description: 'Local brand serum, sangat popular untuk acne-prone skin.',
    product: 'SOMETHINC Niacinamide 10% + Zinc 1% Serum',
    platform: 'shopee',
    affiliateUrl: 'https://shopee.my/aff/somethinc-niacinamide?ref=team-bb',
    clicks: 3180,
    conversions: 245,
    earnings: 2128.5,
    ownerId: 'user_nurul',
    ownerName: 'Nurul Huda',
    createdAt: '2025-03-15T03:00:00.000Z',
    tags: ['beauty', 'skincare', 'local'],
  },
  {
    id: 'res_link_003',
    teamId: 'team_beauty_bosses',
    type: 'affiliate_link',
    title: 'Baju Kurung Moden — Raya Collection',
    description: 'Fashion link terbaik untuk musim Raya. Clicks meningkat 3x bulan Ramadhan.',
    product: 'Baju Kurung Moden Songket Premium',
    platform: 'shopee',
    affiliateUrl: 'https://shopee.my/aff/baju-kurung-moden?ref=team-bb',
    clicks: 5420,
    conversions: 189,
    earnings: 3742.0,
    ownerId: 'user_farah',
    ownerName: 'Farah Diyanah',
    createdAt: '2025-03-01T03:00:00.000Z',
    tags: ['fashion', 'raya', 'baju-kurung'],
  },
  {
    id: 'res_link_004',
    teamId: 'team_tech_review_my',
    type: 'affiliate_link',
    title: 'Xiaomi Redmi Note 13 Pro 5G',
    description: 'Best value smartphone 2025. Convert rate tinggi sebab harga masyhur.',
    product: 'Xiaomi Redmi Note 13 Pro 5G 256GB',
    platform: 'shopee',
    affiliateUrl: 'https://shopee.my/aff/redmi-note-13-pro?ref=team-trm',
    clicks: 8920,
    conversions: 412,
    earnings: 9824.5,
    ownerId: 'user_raj',
    ownerName: 'Raj Kumar',
    createdAt: '2025-01-20T03:00:00.000Z',
    tags: ['tech', 'smartphone', 'xiaomi'],
  },
  {
    id: 'res_link_005',
    teamId: 'team_tech_review_my',
    type: 'affiliate_link',
    title: 'Logitech G Pro X Superlight',
    description: 'Gaming mouse premium. Review kami paling viral di TikTok.',
    product: 'Logitech G Pro X Superlight Wireless Gaming Mouse',
    platform: 'shopee',
    affiliateUrl: 'https://shopee.my/aff/logitech-gpx-superlight?ref=team-trm',
    clicks: 6240,
    conversions: 268,
    earnings: 7420.0,
    ownerId: 'user_arjun',
    ownerName: 'Arjun Pillai',
    createdAt: '2025-02-10T03:00:00.000Z',
    tags: ['gaming', 'mouse', 'logitech'],
  },
  {
    id: 'res_link_006',
    teamId: 'team_tech_review_my',
    type: 'affiliate_link',
    title: 'Samsung 27" Odyssey G5 Monitor',
    description: 'Curved gaming monitor 144Hz. Best untuk gaming setup reviews.',
    product: 'Samsung Odyssey G5 27" Curved 144Hz',
    platform: 'shopee',
    affiliateUrl: 'https://shopee.my/aff/samsung-odyssey-g5?ref=team-trm',
    clicks: 4850,
    conversions: 142,
    earnings: 6240.0,
    ownerId: 'user_daniel',
    ownerName: 'Daniel Wong',
    createdAt: '2025-03-22T03:00:00.000Z',
    tags: ['gaming', 'monitor', 'samsung'],
  },
  {
    id: 'res_link_007',
    teamId: 'team_home_living',
    type: 'affiliate_link',
    title: 'Philips Air Fryer XXL',
    description: 'Air fryer paling laris di Malaysia. Perfect untuk health-conscious audience.',
    product: 'Philips Air Fryer XXL HD9867/90',
    platform: 'shopee',
    affiliateUrl: 'https://shopee.my/aff/philips-air-fryer-xxl?ref=team-hlc',
    clicks: 3200,
    conversions: 184,
    earnings: 4150.0,
    ownerId: 'user_mei_ling',
    ownerName: 'Mei Ling Tan',
    createdAt: '2025-02-15T03:00:00.000Z',
    tags: ['home', 'kitchen', 'air-fryer'],
  },
  {
    id: 'res_link_008',
    teamId: 'team_home_living',
    type: 'affiliate_link',
    title: 'Dyson V12 Detect Slim Vacuum',
    description: 'Premium vacuum. Tinggi commission per sale.',
    product: 'Dyson V12 Detect Slim Cordless Vacuum',
    platform: 'shopee',
    affiliateUrl: 'https://shopee.my/aff/dyson-v12-detect?ref=team-hlc',
    clicks: 1820,
    conversions: 48,
    earnings: 5057.7,
    ownerId: 'user_chong',
    ownerName: 'Chong Wei',
    createdAt: '2025-01-30T03:00:00.000Z',
    tags: ['home', 'appliance', 'dyson'],
  },

  // Shared Content Library (6)
  {
    id: 'res_content_001',
    teamId: 'team_beauty_bosses',
    type: 'content',
    title: 'TikTok Skincare Routine Caption',
    description: 'Caption template untuk skincare routine video. Include CTA untuk affiliate link.',
    contentType: 'caption',
    niche: 'Beauty',
    usageCount: 28,
    ownerId: 'user_aisyah',
    ownerName: 'Aisyah Rahman',
    createdAt: '2025-04-10T03:00:00.000Z',
    tags: ['caption', 'skincare', 'tiktok'],
  },
  {
    id: 'res_content_002',
    teamId: 'team_beauty_bosses',
    type: 'content',
    title: 'Raya Haul Video Script',
    description: 'Script lengkap untuk Raya haul video. 3 minit duration, include 5 product placements.',
    contentType: 'video_script',
    niche: 'Fashion',
    usageCount: 16,
    ownerId: 'user_nurul',
    ownerName: 'Nurul Huda',
    createdAt: '2025-03-25T03:00:00.000Z',
    tags: ['script', 'raya', 'fashion'],
  },
  {
    id: 'res_content_003',
    teamId: 'team_tech_review_my',
    type: 'content',
    title: 'Smartphone Review Image Prompt',
    description: 'Midjourney prompt untuk generate high-quality smartphone product images.',
    contentType: 'image_prompt',
    niche: 'Tech',
    usageCount: 42,
    ownerId: 'user_raj',
    ownerName: 'Raj Kumar',
    createdAt: '2025-02-08T03:00:00.000Z',
    tags: ['prompt', 'ai', 'smartphone'],
  },
  {
    id: 'res_content_004',
    teamId: 'team_tech_review_my',
    type: 'content',
    title: 'Gaming Setup Review Template',
    description: 'Review template untuk gaming gear. Include benchmark sections dan pros/cons format.',
    contentType: 'review',
    niche: 'Gaming',
    usageCount: 35,
    ownerId: 'user_arjun',
    ownerName: 'Arjun Pillai',
    createdAt: '2025-03-12T03:00:00.000Z',
    tags: ['review', 'gaming', 'template'],
  },
  {
    id: 'res_content_005',
    teamId: 'team_tech_review_my',
    type: 'content',
    title: 'Smart Home Tutorial Script',
    description: 'Step-by-step tutorial untuk setup smart home devices. YouTube format.',
    contentType: 'tutorial',
    niche: 'Smart Home',
    usageCount: 21,
    ownerId: 'user_daniel',
    ownerName: 'Daniel Wong',
    createdAt: '2025-04-05T03:00:00.000Z',
    tags: ['tutorial', 'smart-home', 'youtube'],
  },
  {
    id: 'res_content_006',
    teamId: 'team_home_living',
    type: 'content',
    title: 'Kitchen Makeover Caption Pack',
    description: 'Pack of 10 captions untuk kitchen makeover content. Ready to use.',
    contentType: 'caption',
    niche: 'Kitchen',
    usageCount: 12,
    ownerId: 'user_mei_ling',
    ownerName: 'Mei Ling Tan',
    createdAt: '2025-03-30T03:00:00.000Z',
    tags: ['caption', 'kitchen', 'makeover'],
  },
]

// ─── Activity Feed ──────────────────────────────────────────────────────────

export const TEAM_ACTIVITIES: TeamActivity[] = [
  {
    id: 'act_001',
    teamId: 'team_beauty_bosses',
    type: 'link_shared',
    actorId: 'user_aisyah',
    actorName: 'Aisyah Rahman',
    targetName: 'LANEIGE Lip Sleeping Mask',
    description: 'shared a new affiliate link',
    createdAt: '2025-06-14T08:30:00.000Z',
  },
  {
    id: 'act_002',
    teamId: 'team_beauty_bosses',
    type: 'content_created',
    actorId: 'user_nurul',
    actorName: 'Nurul Huda',
    targetName: 'Raya Haul Video Script',
    description: 'created a new content piece',
    createdAt: '2025-06-13T22:00:00.000Z',
  },
  {
    id: 'act_003',
    teamId: 'team_beauty_bosses',
    type: 'member_invited',
    actorId: 'user_aisyah',
    actorName: 'Aisyah Rahman',
    targetName: 'honey.lee@gmail.com',
    description: 'invited a new member',
    createdAt: '2025-06-10T03:00:00.000Z',
  },
  {
    id: 'act_004',
    teamId: 'team_beauty_bosses',
    type: 'member_joined',
    actorId: 'user_layla',
    actorName: 'Layla Aminah',
    description: 'joined the team',
    createdAt: '2025-05-01T03:00:00.000Z',
  },
  {
    id: 'act_005',
    teamId: 'team_tech_review_my',
    type: 'link_shared',
    actorId: 'user_raj',
    actorName: 'Raj Kumar',
    targetName: 'Xiaomi Redmi Note 13 Pro 5G',
    description: 'shared a viral affiliate link',
    createdAt: '2025-06-14T09:00:00.000Z',
  },
  {
    id: 'act_006',
    teamId: 'team_tech_review_my',
    type: 'member_invited',
    actorId: 'user_raj',
    actorName: 'Raj Kumar',
    targetName: 'bryan.chan@gmail.com',
    description: 'invited Bryan as admin',
    createdAt: '2025-06-13T03:00:00.000Z',
  },
  {
    id: 'act_007',
    teamId: 'team_tech_review_my',
    type: 'content_created',
    actorId: 'user_arjun',
    actorName: 'Arjun Pillai',
    targetName: 'Gaming Setup Review Template',
    description: 'added a review template to the library',
    createdAt: '2025-06-12T15:30:00.000Z',
  },
  {
    id: 'act_008',
    teamId: 'team_tech_review_my',
    type: 'role_changed',
    actorId: 'user_raj',
    actorName: 'Raj Kumar',
    targetName: 'Daniel Wong',
    description: 'promoted Daniel to admin',
    createdAt: '2025-06-08T10:00:00.000Z',
  },
  {
    id: 'act_009',
    teamId: 'team_home_living',
    type: 'link_shared',
    actorId: 'user_mei_ling',
    actorName: 'Mei Ling Tan',
    targetName: 'Philips Air Fryer XXL',
    description: 'shared a top-converting link',
    createdAt: '2025-06-13T16:30:00.000Z',
  },
  {
    id: 'act_010',
    teamId: 'team_home_living',
    type: 'member_invited',
    actorId: 'user_mei_ling',
    actorName: 'Mei Ling Tan',
    targetName: 'grace.yap@gmail.com',
    description: 'invited a new member',
    createdAt: '2025-06-09T03:00:00.000Z',
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getTeamsForUser(_userId: string): Team[] {
  // Demo: return all teams — every logged-in user is part of all 3 teams.
  void _userId
  return TEAMS
}

export function getTeamById(teamId: string): Team | undefined {
  return TEAMS.find((t) => t.id === teamId)
}

export function getMembersByTeam(teamId: string): TeamMember[] {
  return TEAM_MEMBERS.filter((m) => m.teamId === teamId)
}

export function getInvitationsByTeam(teamId: string): TeamInvitation[] {
  return TEAM_INVITATIONS.filter((i) => i.teamId === teamId && i.status === 'pending')
}

export function getResourcesByTeam(teamId: string): SharedResource[] {
  return SHARED_RESOURCES.filter((r) => r.teamId === teamId)
}

export function getActivitiesByTeam(teamId: string, limit = 10): TeamActivity[] {
  return TEAM_ACTIVITIES.filter((a) => a.teamId === teamId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

/** Compute aggregated team stats from members + shared resources. */
export function computeTeamStats(teamId: string): TeamStats {
  const team = getTeamById(teamId)
  const members = getMembersByTeam(teamId)
  const invitations = getInvitationsByTeam(teamId)
  const resources = getResourcesByTeam(teamId)

  const activeMembers = members.filter((m) => m.status === 'active').length
  const combinedClicks = members.reduce((s, m) => s + m.contribution.clicksGenerated, 0)
  const combinedConversions = members.reduce(
    (s, m) => s + m.contribution.conversionsGenerated,
    0,
  )
  const combinedEarnings = members.reduce(
    (s, m) => s + m.contribution.earningsGenerated,
    0,
  )
  const combinedLinksShared = members.reduce(
    (s, m) => s + m.contribution.linksShared,
    0,
  )
  const combinedContentCreated = members.reduce(
    (s, m) => s + m.contribution.contentCreated,
    0,
  )

  return {
    teamId,
    totalMembers: members.length,
    activeMembers,
    pendingInvitations: invitations.length,
    combinedClicks,
    combinedConversions,
    combinedEarnings,
    combinedLinksShared,
    combinedContentCreated,
    avgConversionRate: combinedClicks > 0 ? (combinedConversions / combinedClicks) * 100 : 0,
    earningsGrowth: 18.5,
    clicksGrowth: 24.3,
  }
}

/** Build per-team analytics with 12 months of trend data. */
export function computeTeamAnalytics(teamId: string): TeamAnalytics {
  const team = getTeamById(teamId)
  const members = getMembersByTeam(teamId)
  const resources = getResourcesByTeam(teamId).filter((r) => r.type === 'affiliate_link')

  const totalClicks = members.reduce((s, m) => s + m.contribution.clicksGenerated, 0)
  const totalConversions = members.reduce(
    (s, m) => s + m.contribution.conversionsGenerated,
    0,
  )
  const totalEarnings = members.reduce(
    (s, m) => s + m.contribution.earningsGenerated,
    0,
  )

  // 12-month trend — distribute the team's total across months with seasonal noise
  const trend = buildTrendData(totalClicks, totalConversions, totalEarnings)

  // Per-member contributions (sorted by earnings desc)
  const perMember = members
    .filter((m) => m.contribution.clicksGenerated > 0)
    .map((m) => ({
      memberId: m.id,
      name: m.name.trim(),
      initials: m.initials,
      avatarColor: m.avatarColor,
      clicks: m.contribution.clicksGenerated,
      conversions: m.contribution.conversionsGenerated,
      earnings: m.contribution.earningsGenerated,
    }))
    .sort((a, b) => b.earnings - a.earnings)

  // Platform distribution
  const platformMap: Record<string, { clicks: number; conversions: number; earnings: number }> = {
    shopee: { clicks: 0, conversions: 0, earnings: 0 },
    tiktok: { clicks: 0, conversions: 0, earnings: 0 },
    lazada: { clicks: 0, conversions: 0, earnings: 0 },
  }
  for (const r of resources) {
    const p = r.platform || 'shopee'
    if (!platformMap[p]) platformMap[p] = { clicks: 0, conversions: 0, earnings: 0 }
    platformMap[p].clicks += r.clicks || 0
    platformMap[p].conversions += r.conversions || 0
    platformMap[p].earnings += r.earnings || 0
  }
  // Add a baseline from members if no shared links yet
  if (resources.length === 0) {
    platformMap.shopee = {
      clicks: totalClicks * 0.6,
      conversions: totalConversions * 0.6,
      earnings: totalEarnings * 0.6,
    }
    platformMap.tiktok = {
      clicks: totalClicks * 0.3,
      conversions: totalConversions * 0.3,
      earnings: totalEarnings * 0.3,
    }
    platformMap.lazada = {
      clicks: totalClicks * 0.1,
      conversions: totalConversions * 0.1,
      earnings: totalEarnings * 0.1,
    }
  }
  const platformDistribution = Object.entries(platformMap).map(([platform, v]) => ({
    platform,
    ...v,
  }))

  // Top shared links
  const topSharedLinks = resources
    .slice()
    .sort((a, b) => (b.earnings || 0) - (a.earnings || 0))
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.title,
      product: r.product || r.title,
      platform: r.platform || 'shopee',
      clicks: r.clicks || 0,
      conversions: r.conversions || 0,
      earnings: r.earnings || 0,
      ownerName: r.ownerName,
    }))

  void team

  return {
    teamId,
    summary: {
      totalClicks,
      totalConversions,
      totalEarnings,
      avgConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    },
    trend,
    perMember,
    platformDistribution,
    topSharedLinks,
  }
}

/** Build a deterministic 12-month trend by distributing the totals with seasonal weights. */
function buildTrendData(
  totalClicks: number,
  totalConversions: number,
  totalEarnings: number,
): Array<{ date: string; clicks: number; conversions: number; earnings: number }> {
  const months = [
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  ]
  // Seasonal weights — higher during Mega Campaign (Nov-Dec) and Raya (Mar-Apr)
  const weights = [0.07, 0.08, 0.085, 0.09, 0.11, 0.12, 0.075, 0.075, 0.1, 0.1, 0.085, 0.07]
  const sum = weights.reduce((a, b) => a + b, 0)
  const year = new Date().getFullYear()

  return months.map((m, i) => ({
    date: `${m} ${year - (i < 6 ? 0 : 1)}`,
    clicks: Math.round(totalClicks * (weights[i] / sum)),
    conversions: Math.round(totalConversions * (weights[i] / sum)),
    earnings: Math.round(totalEarnings * (weights[i] / sum) * 100) / 100,
  }))
}

// ─── Mutation helpers (used by API routes) ──────────────────────────────────

let nextTeamId = 100
let nextMemberId = 100
let nextInvitationId = 100
let nextResourceId = 100

export function createTeam(input: {
  name: string
  description?: string
  niches?: string[]
  ownerId?: string
  ownerName?: string
}): Team {
  const id = `team_custom_${nextTeamId++}`
  const ownerName = input.ownerName || 'You'
  const team: Team = {
    id,
    name: input.name,
    description: input.description || '',
    ownerId: input.ownerId || 'user_current',
    ownerName,
    memberCount: 1,
    memberLimit: PLAN_MEMBER_LIMITS.free,
    plan: 'free',
    niches: input.niches && input.niches.length > 0 ? input.niches : ['General'],
    avatarColor: colorFor(id),
    createdAt: new Date().toISOString(),
    defaultRole: 'member',
  }
  TEAMS.push(team)

  // Create the owner member entry
  const ownerMember: TeamMember = {
    id: `tm_${nextMemberId++}`,
    teamId: id,
    userId: team.ownerId,
    name: ownerName,
    email: 'you@example.com',
    avatarColor: team.avatarColor,
    initials: initials(ownerName),
    role: 'owner',
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: 'active',
    contribution: {
      linksShared: 0,
      contentCreated: 0,
      clicksGenerated: 0,
      conversionsGenerated: 0,
      earningsGenerated: 0,
    },
  }
  TEAM_MEMBERS.push(ownerMember)

  return team
}

export function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, 'name' | 'description' | 'defaultRole' | 'niches'>>,
): Team | undefined {
  const team = TEAMS.find((t) => t.id === teamId)
  if (!team) return undefined
  if (updates.name) team.name = updates.name
  if (updates.description !== undefined) team.description = updates.description
  if (updates.defaultRole) team.defaultRole = updates.defaultRole
  if (updates.niches) team.niches = updates.niches
  return team
}

export function deleteTeam(teamId: string): boolean {
  const idx = TEAMS.findIndex((t) => t.id === teamId)
  if (idx === -1) return false
  TEAMS.splice(idx, 1)
  // Cascade delete
  for (let i = TEAM_MEMBERS.length - 1; i >= 0; i--) {
    if (TEAM_MEMBERS[i].teamId === teamId) TEAM_MEMBERS.splice(i, 1)
  }
  for (let i = SHARED_RESOURCES.length - 1; i >= 0; i--) {
    if (SHARED_RESOURCES[i].teamId === teamId) SHARED_RESOURCES.splice(i, 1)
  }
  for (let i = TEAM_INVITATIONS.length - 1; i >= 0; i--) {
    if (TEAM_INVITATIONS[i].teamId === teamId) TEAM_INVITATIONS.splice(i, 1)
  }
  return true
}

export function inviteMember(
  teamId: string,
  input: { email: string; role: TeamRole; message?: string; invitedBy: string },
): TeamInvitation | undefined {
  const team = getTeamById(teamId)
  if (!team) return undefined
  const invitation: TeamInvitation = {
    id: `inv_${nextInvitationId++}`,
    teamId,
    teamName: team.name,
    email: input.email,
    role: input.role,
    invitedBy: input.invitedBy,
    message: input.message,
    createdAt: new Date().toISOString(),
    status: 'pending',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  }
  TEAM_INVITATIONS.push(invitation)
  return invitation
}

export function removeMember(teamId: string, memberId: string): boolean {
  const idx = TEAM_MEMBERS.findIndex((m) => m.id === memberId && m.teamId === teamId)
  if (idx === -1) return false
  if (TEAM_MEMBERS[idx].role === 'owner') return false // Cannot remove owner
  TEAM_MEMBERS.splice(idx, 1)
  // Update team member count
  const team = getTeamById(teamId)
  if (team) team.memberCount = Math.max(0, team.memberCount - 1)
  return true
}

export function updateMemberRole(
  teamId: string,
  memberId: string,
  role: TeamRole,
): TeamMember | undefined {
  const member = TEAM_MEMBERS.find((m) => m.id === memberId && m.teamId === teamId)
  if (!member) return undefined
  if (member.role === 'owner') return undefined // Cannot change owner's role
  member.role = role
  return member
}

export function addSharedResource(
  teamId: string,
  input: {
    type: 'affiliate_link' | 'content'
    title: string
    description?: string
    product?: string
    platform?: 'shopee' | 'tiktok' | 'lazada'
    affiliateUrl?: string
    contentType?: 'caption' | 'video_script' | 'image_prompt' | 'review' | 'tutorial'
    niche?: string
    tags?: string[]
    ownerId?: string
    ownerName?: string
  },
): SharedResource | undefined {
  const team = getTeamById(teamId)
  if (!team) return undefined
  const resource: SharedResource = {
    id: `res_new_${nextResourceId++}`,
    teamId,
    type: input.type,
    title: input.title,
    description: input.description,
    product: input.product,
    platform: input.platform,
    affiliateUrl: input.affiliateUrl,
    clicks: 0,
    conversions: 0,
    earnings: 0,
    contentType: input.contentType,
    niche: input.niche,
    usageCount: 0,
    ownerId: input.ownerId || 'user_current',
    ownerName: input.ownerName || 'You',
    createdAt: new Date().toISOString(),
    tags: input.tags || [],
  }
  SHARED_RESOURCES.push(resource)
  return resource
}

/** Used by the page to determine the current user's role within a team. */
export function getCurrentUserRole(teamId: string): TeamRole {
  // Demo: the current user is the owner of every team.
  // In production this would come from the session.
  void teamId
  return 'owner'
}
