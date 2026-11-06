import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { PrismaClient, type ConversionStatus } from '@prisma/client'

// Use a direct PrismaClient instance to ensure all models are available,
// even if the cached singleton from db.ts has stale model delegates.
const prisma = new PrismaClient()

// ─── Helpers ────────────────────────────────────────────────────────

function generateShortCode(): string {
  return randomBytes(4).toString('hex')
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 2): number {
  const val = min + Math.random() * (max - min)
  return Math.round(val * 10 ** decimals) / 10 ** decimals
}

// ─── GET handler ────────────────────────────────────────────────────

export async function GET() {
  const counts: Record<string, number> = {}

  // Diagnostic: verify Prisma client has all required models
  const requiredModels = ['apiKey', 'team', 'teamMember', 'teamInvitation', 'whiteLabelConfig', 'marketplaceListing', 'marketplaceReview', 'subscription', 'usageTracking', 'abTest', 'trendKeyword', 'competitorWatch', 'liveSession', 'alertPreference']
  const missingModels = requiredModels.filter(m => !(m in prisma))
  if (missingModels.length > 0) {
    return NextResponse.json({
      success: false,
      error: `Prisma client missing models: ${missingModels.join(', ')}. Run 'bun run db:push' and restart the dev server.`,
      hint: 'The db.ts PRISMA_SCHEMA_VERSION may need to be bumped again.',
    }, { status: 500 })
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. Create demo user (demo@theviralfindsmy.com / demo123)
    // ═══════════════════════════════════════════════════════════════
    const passwordHash = await bcrypt.hash('demo123', 10)
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@theviralfindsmy.com' },
      update: { passwordHash, name: 'Demo User', role: 'admin', shopeeAffId: 'SHP_AFF_DEMO', isActive: true, lastLoginAt: new Date() },
      create: {
        email: 'demo@theviralfindsmy.com',
        name: 'Demo User',
        passwordHash,
        role: 'admin',
        shopeeAffId: 'SHP_AFF_DEMO',
        isActive: true,
        lastLoginAt: new Date(),
      },
    })
    counts.users = 1

    // Also create two team-member users if they don't exist
    const member1 = await prisma.user.upsert({
      where: { email: 'ahmad@theviralfindsmy.com' },
      update: {},
      create: {
        email: 'ahmad@theviralfindsmy.com',
        name: 'Ahmad Razak',
        passwordHash: await bcrypt.hash('demo123', 10),
        role: 'affiliate',
        shopeeAffId: 'SHP_AFF_002',
        isActive: true,
        lastLoginAt: new Date(Date.now() - 3600000),
      },
    })
    const member2 = await prisma.user.upsert({
      where: { email: 'siti@theviralfindsmy.com' },
      update: {},
      create: {
        email: 'siti@theviralfindsmy.com',
        name: 'Siti Nurhaliza',
        passwordHash: await bcrypt.hash('demo123', 10),
        role: 'affiliate',
        shopeeAffId: 'SHP_AFF_003',
        isActive: true,
        lastLoginAt: new Date(Date.now() - 86400000),
      },
    })

    // ═══════════════════════════════════════════════════════════════
    // 2. Create 3 campaigns (Raya Sale, Back to School, 9.9 Mega Sale)
    // ═══════════════════════════════════════════════════════════════
    const campaignData = [
      {
        name: 'Raya Sale 2025',
        description: 'Hari Raya Aidilfitri mega sale campaign — beauty, fashion & home essentials',
        status: 'completed' as const,
        budget: 2000,
        spent: 1850.5,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-04-15'),
      },
      {
        name: 'Back to School',
        description: 'Back to school essentials — stationery, bags, uniforms, tech accessories',
        status: 'active' as const,
        budget: 800,
        spent: 456.75,
        startDate: new Date('2025-11-15'),
        endDate: new Date('2026-01-15'),
      },
      {
        name: '9.9 Mega Sale',
        description: '9.9 Super Shopping Day — biggest sale of the year across all categories',
        status: 'active' as const,
        budget: 3000,
        spent: 1234.8,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-09-15'),
      },
    ]

    const campaigns: { id: string }[] = []
    for (const cd of campaignData) {
      const existing = await prisma.campaign.findFirst({ where: { name: cd.name } })
      if (existing) {
        campaigns.push(existing)
      } else {
        const c = await prisma.campaign.create({ data: cd })
        campaigns.push(c)
      }
    }
    counts.campaigns = campaigns.length

    // ═══════════════════════════════════════════════════════════════
    // 3. Create 10 affiliate links with Malaysian products
    // ═══════════════════════════════════════════════════════════════
    const linkDefinitions = [
      {
        name: 'SK-II Facial Treatment Essence',
        productUrl: 'https://shopee.com.my/skii-facial-treatment-essence',
        productId: 'SHP_SKII_001',
        productName: 'SK-II Facial Treatment Essence 230ml',
        productPrice: 689.0,
        commissionRate: 8,
        category: 'beauty',
        clicks: 1420,
        conversions: 98,
        earnings: 5394.4,
        ctr: 6.9,
        status: 'active' as const,
        tags: 'beauty,skincare,premium',
        campaignId: campaigns[0].id,
      },
      {
        name: 'Xiaomi Smart Band 8',
        productUrl: 'https://shopee.com.my/xiaomi-smart-band-8',
        productId: 'SHP_XIAOMI_002',
        productName: 'Xiaomi Smart Band 8 Active',
        productPrice: 89.9,
        commissionRate: 5,
        category: 'tech',
        clicks: 2340,
        conversions: 186,
        earnings: 835.07,
        ctr: 7.95,
        status: 'active' as const,
        tags: 'tech,wearable,fitness',
        campaignId: campaigns[2].id,
      },
      {
        name: 'Bawal Premium Cotton',
        productUrl: 'https://shopee.com.my/bawal-premium-cotton',
        productId: 'SHP_BAWAL_003',
        productName: 'Bawal Premium Cotton 50s — Instant Hijab',
        productPrice: 35.0,
        commissionRate: 10,
        category: 'fashion',
        clicks: 3100,
        conversions: 465,
        earnings: 1627.5,
        ctr: 15.0,
        status: 'active' as const,
        tags: 'fashion,hijab,raya',
        campaignId: campaigns[0].id,
      },
      {
        name: 'Harumanis Mango Paste',
        productUrl: 'https://shopee.com.my/harumanis-mango-paste',
        productId: 'SHP_MANGO_004',
        productName: 'Harumanis Mango Paste 500g — Perlis Origin',
        productPrice: 29.9,
        commissionRate: 7,
        category: 'food',
        clicks: 870,
        conversions: 78,
        earnings: 163.17,
        ctr: 8.97,
        status: 'active' as const,
        tags: 'food,local,raya',
        campaignId: campaigns[0].id,
      },
      {
        name: 'Daiso Storage Box Set',
        productUrl: 'https://shopee.com.my/daiso-storage-box-set',
        productId: 'SHP_DAISO_005',
        productName: 'Daiso Stackable Storage Box Set of 3',
        productPrice: 19.9,
        commissionRate: 6,
        category: 'home',
        clicks: 560,
        conversions: 45,
        earnings: 53.73,
        ctr: 8.04,
        status: 'active' as const,
        tags: 'home,storage,organizer',
        campaignId: campaigns[1].id,
      },
      {
        name: 'Kincare Serum Vitamin C',
        productUrl: 'https://shopee.com.my/kincare-vitc-serum',
        productId: 'SHP_KIN_006',
        productName: 'Kincare Vitamin C Brightening Serum 30ml',
        productPrice: 49.9,
        commissionRate: 12,
        category: 'beauty',
        clicks: 1890,
        conversions: 227,
        earnings: 1359.28,
        ctr: 12.01,
        status: 'active' as const,
        tags: 'beauty,serum,brightening',
        campaignId: campaigns[2].id,
      },
      {
        name: 'Anker PowerBank 20000mAh',
        productUrl: 'https://shopee.com.my/anker-powerbank-20k',
        productId: 'SHP_ANKER_007',
        productName: 'Anker PowerCore 20000mAh Portable Charger',
        productPrice: 129.0,
        commissionRate: 5,
        category: 'tech',
        clicks: 1680,
        conversions: 134,
        earnings: 863.1,
        ctr: 7.98,
        status: 'active' as const,
        tags: 'tech,powerbank,charger',
        campaignId: campaigns[2].id,
      },
      {
        name: 'Kurta Modern Lelaki',
        productUrl: 'https://shopee.com.my/kurta-modern-lelaki',
        productId: 'SHP_KURTA_008',
        productName: 'Kurta Modern Lelaki — Premium Cotton Linen',
        productPrice: 79.0,
        commissionRate: 9,
        category: 'fashion',
        clicks: 2200,
        conversions: 264,
        earnings: 1875.84,
        ctr: 12.0,
        status: 'active' as const,
        tags: 'fashion,raya,kurta',
        campaignId: campaigns[0].id,
      },
      {
        name: 'Milo Tin 1.5kg',
        productUrl: 'https://shopee.com.my/milo-tin-1.5kg',
        productId: 'SHP_MILO_009',
        productName: 'Nestle Milo Tin 1.5kg — Made in Malaysia',
        productPrice: 32.9,
        commissionRate: 4,
        category: 'food',
        clicks: 950,
        conversions: 152,
        earnings: 200.01,
        ctr: 16.0,
        status: 'active' as const,
        tags: 'food,beverage,local',
        campaignId: campaigns[1].id,
      },
      {
        name: 'Philips Air Fryer HD9200',
        productUrl: 'https://shopee.com.my/philips-air-fryer-hd9200',
        productId: 'SHP_PHILIPS_010',
        productName: 'Philips Essential Air Fryer HD9200/90 4.1L',
        productPrice: 349.0,
        commissionRate: 5,
        category: 'home',
        clicks: 1780,
        conversions: 107,
        earnings: 1867.15,
        ctr: 6.01,
        status: 'active' as const,
        tags: 'home,kitchen,appliance',
        campaignId: campaigns[2].id,
      },
    ]

    const links: { id: string; productPrice: any; commissionRate: any }[] = []
    for (const ld of linkDefinitions) {
      const existing = await prisma.affiliateLink.findFirst({ where: { name: ld.name } })
      if (existing) {
        links.push(existing)
      } else {
        const sc = generateShortCode()
        const link = await prisma.affiliateLink.create({
          data: {
            ...ld,
            affiliateUrl: `https://shopee.com.my/aff/${sc}`,
            productImage: null,
            commission: Number(ld.productPrice) * (Number(ld.commissionRate) / 100),
            userId: demoUser.id,
            shortCode: sc,
          },
        })
        links.push(link)
      }
    }
    counts.affiliateLinks = links.length

    // ═══════════════════════════════════════════════════════════════
    // 4. Create 200+ click records spread over the last 30 days
    // ═══════════════════════════════════════════════════════════════
    const existingClicks = await prisma.clickRecord.count()
    let clicksCreated = 0
    if (existingClicks < 200) {
      const countries = ['MY', 'MY', 'MY', 'SG', 'ID', 'MY', 'MY', 'SG', 'ID', 'MY']
      const devices = ['Mobile', 'Mobile', 'Desktop', 'Mobile', 'Tablet', 'Mobile', 'Desktop']
      const browsers = ['Chrome', 'Chrome', 'Safari', 'Chrome', 'Firefox', 'Edge', 'Chrome']
      const osOptions = ['Android', 'Android', 'iOS', 'Windows', 'macOS', 'Android', 'iOS']
      const referers = ['facebook.com', 'instagram.com', 'tiktok.com', 'google.com', 'direct', 'twitter.com', 'shopee.com.my']
      const locations = ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Sabah', 'Sarawak']

      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
      const now = new Date()
      const clickBatch: {
        linkId: string
        userId: string | null
        ip: string
        country: string
        referer: string | null
        device: string
        browser: string
        os: string
        converted: boolean
        createdAt: Date
      }[] = []

      for (const link of links) {
        const linkClicks = randInt(18, 28)
        for (let i = 0; i < linkClicks; i++) {
          const country = pick(countries)
          const device = pick(devices)
          const browser = pick(browsers)
          const os = pick(osOptions)
          const location = pick(locations)
          clickBatch.push({
            linkId: link.id,
            userId: Math.random() > 0.3 ? demoUser.id : null,
            ip: `10.0.${randInt(0, 255)}.${randInt(1, 254)}`,
            country,
            referer: pick(referers),
            device,
            browser,
            os,
            converted: Math.random() < 0.08,
            createdAt: randomDate(thirtyDaysAgo, now),
          })
        }
      }

      // Create clicks in batches of 500
      const BATCH_SIZE = 500
      for (let i = 0; i < clickBatch.length; i += BATCH_SIZE) {
        const batch = clickBatch.slice(i, i + BATCH_SIZE)
        const result = await prisma.clickRecord.createMany({ data: batch })
        clicksCreated += result.count
      }
    }
    counts.clickRecords = clicksCreated

    // ═══════════════════════════════════════════════════════════════
    // 5. Create 30+ conversions with realistic RM amounts
    // ═══════════════════════════════════════════════════════════════
    const existingConversions = await prisma.conversion.count()
    let conversionsCreated = 0
    if (existingConversions < 30) {
      const conversionStatuses: ConversionStatus[] = ['pending', 'confirmed', 'paid', 'rejected']
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
      const now = new Date()
      const convBatch: { linkId: string; orderId: string; amount: number; commission: number; status: ConversionStatus; createdAt: Date }[] = []

      for (const link of links) {
        const convCount = randInt(2, 5)
        for (let i = 0; i < convCount; i++) {
          const basePrice = Number(link.productPrice) || 50
          const amount = randFloat(basePrice * 0.7, basePrice * 1.3)
          const commission = randFloat(amount * 0.04, amount * 0.12)
          const status = pick(conversionStatuses)
          convBatch.push({
            linkId: link.id,
            orderId: `ORD-${Date.now()}-${randInt(1000, 9999)}`,
            amount,
            commission,
            status,
            createdAt: randomDate(thirtyDaysAgo, now),
          })
        }
      }

      const result = await prisma.conversion.createMany({ data: convBatch })
      conversionsCreated = result.count
    }
    counts.conversions = conversionsCreated

    // ═══════════════════════════════════════════════════════════════
    // 6. Create 3 payouts (bank_transfer, completed)
    // ═══════════════════════════════════════════════════════════════
    const existingPayouts = await prisma.payout.count()
    let payoutsCreated = 0
    if (existingPayouts < 3) {
      const payoutData = [
        {
          userId: demoUser.id,
          method: 'bank_transfer',
          amount: 2150.0,
          status: 'completed' as const,
          bankName: 'Maybank',
          accountNo: '****4521',
          accountName: 'Demo User',
          requestedAt: new Date('2025-01-05'),
          processedAt: new Date('2025-01-07'),
          note: 'Monthly payout — January 2025',
        },
        {
          userId: demoUser.id,
          method: 'bank_transfer',
          amount: 3420.0,
          status: 'completed' as const,
          bankName: 'CIMB',
          accountNo: '****8832',
          accountName: 'Demo User',
          requestedAt: new Date('2025-02-05'),
          processedAt: new Date('2025-02-08'),
          note: 'Monthly payout — February 2025',
        },
        {
          userId: demoUser.id,
          method: 'bank_transfer',
          amount: 4180.0,
          status: 'completed' as const,
          bankName: 'RHB',
          accountNo: '****1107',
          accountName: 'Demo User',
          requestedAt: new Date('2025-03-05'),
          processedAt: new Date('2025-03-09'),
          note: 'Monthly payout — March 2025',
        },
      ]
      const result = await prisma.payout.createMany({ data: payoutData })
      payoutsCreated = result.count
    }
    counts.payouts = payoutsCreated

    // ═══════════════════════════════════════════════════════════════
    // 7. Create 2 earning goals
    // ═══════════════════════════════════════════════════════════════
    let earningGoalsCreated = 0
    const existingMonthlyGoal = await prisma.earningGoal.findFirst({ where: { name: 'Monthly RM5,000 Target' } })
    if (!existingMonthlyGoal) {
      await prisma.earningGoal.create({
        data: {
          name: 'Monthly RM5,000 Target',
          targetAmount: 5000,
          currentAmount: 3780.5,
          period: 'monthly',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
          status: 'active',
        },
      })
      earningGoalsCreated++
    }
    const existingWeeklyGoal = await prisma.earningGoal.findFirst({ where: { name: 'Weekly RM1,000 Target' } })
    if (!existingWeeklyGoal) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      await prisma.earningGoal.create({
        data: {
          name: 'Weekly RM1,000 Target',
          targetAmount: 1000,
          currentAmount: 645.2,
          period: 'weekly',
          startDate: weekStart,
          endDate: new Date(weekStart.getTime() + 7 * 86400000),
          status: 'active',
        },
      })
      earningGoalsCreated++
    }
    counts.earningGoals = earningGoalsCreated

    // ═══════════════════════════════════════════════════════════════
    // 8. Create 5 notifications of different types
    // ═══════════════════════════════════════════════════════════════
    const existingNotifications = await prisma.notification.count()
    let notificationsCreated = 0
    if (existingNotifications < 5) {
      const notificationData = [
        {
          type: 'conversion',
          title: 'New Commission Earned!',
          description: 'SK-II Facial Treatment Essence just earned you RM 55.12 commission',
          read: false,
          createdAt: new Date(Date.now() - 300000),
        },
        {
          type: 'alert',
          title: 'Trending Product Alert',
          description: 'Bawal Premium Cotton is trending on Shopee MY — 340% increase in searches',
          read: false,
          createdAt: new Date(Date.now() - 1800000),
        },
        {
          type: 'system',
          title: '9.9 Mega Sale Starting Soon',
          description: 'Prepare your affiliate links for the biggest sale event — 9.9 Mega Sale begins in 5 days!',
          read: false,
          createdAt: new Date(Date.now() - 7200000),
        },
        {
          type: 'achievement',
          title: 'Achievement Unlocked: RM1000 Earnings',
          description: 'Congrats! You have earned over RM 1,000 in total commissions. Keep it up!',
          read: true,
          createdAt: new Date(Date.now() - 86400000),
        },
        {
          type: 'payout',
          title: 'Payout Completed',
          description: 'RM 4,180.00 has been transferred to your RHB account ****1107',
          read: true,
          createdAt: new Date(Date.now() - 172800000),
        },
      ]
      const result = await prisma.notification.createMany({ data: notificationData })
      notificationsCreated = result.count
    }
    counts.notifications = notificationsCreated

    // ═══════════════════════════════════════════════════════════════
    // 9. Create 5 achievements
    // ═══════════════════════════════════════════════════════════════
    const achievementTypes = ['first_link', 'first_conversion', 'rm1000_earnings', '100_clicks', 'top_affiliate']
    let achievementsCreated = 0
    for (const type of achievementTypes) {
      const existing = await prisma.achievement.findFirst({ where: { userId: demoUser.id, type } })
      if (!existing) {
        const achievementDefs: Record<string, { title: string; description: string; icon: string; earnedAt: Date }> = {
          first_link: { title: 'First Link Created', description: 'You created your very first affiliate link', icon: '🔗', earnedAt: new Date('2025-01-05') },
          first_conversion: { title: 'First Conversion', description: 'You earned your first commission from a conversion', icon: '🎯', earnedAt: new Date('2025-01-12') },
          rm1000_earnings: { title: 'RM 1,000 Earner', description: 'Earned over RM 1,000 in total commissions', icon: '💰', earnedAt: new Date('2025-02-20') },
          '100_clicks': { title: '100 Clicks Milestone', description: 'Your affiliate links reached 100 total clicks', icon: '🖱️', earnedAt: new Date('2025-01-18') },
          top_affiliate: { title: 'Top Affiliate', description: 'Ranked in the top 10 affiliates this month', icon: '🏆', earnedAt: new Date('2025-03-01') },
        }
        const def = achievementDefs[type]
        await prisma.achievement.create({
          data: { userId: demoUser.id, type, title: def.title, description: def.description, icon: def.icon, earnedAt: def.earnedAt },
        })
        achievementsCreated++
      }
    }
    counts.achievements = achievementsCreated

    // ═══════════════════════════════════════════════════════════════
    // 10. Create 10 leaderboard entries for current month
    // ═══════════════════════════════════════════════════════════════
    const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const existingLeaderboard = await prisma.leaderboardEntry.count({ where: { period: currentPeriod } })
    let leaderboardCreated = 0
    if (existingLeaderboard < 10) {
      const leaderboardNames = [
        { name: 'TheViralFinds MY', earnings: 9750.0, clicks: 12450, conversions: 890 },
        { name: 'AfiqDeals', earnings: 8200.0, clicks: 10230, conversions: 756 },
        { name: 'NisaShopMY', earnings: 6900.0, clicks: 8900, conversions: 623 },
        { name: 'KedaiRoti', earnings: 5400.0, clicks: 7650, conversions: 512 },
        { name: 'MegaSavingsMY', earnings: 4800.0, clicks: 6200, conversions: 445 },
        { name: 'CikguAffiliate', earnings: 3900.0, clicks: 5800, conversions: 389 },
        { name: 'TechBuddyMY', earnings: 3200.0, clicks: 4300, conversions: 298 },
        { name: 'HijabQueenMY', earnings: 2800.0, clicks: 4100, conversions: 267 },
        { name: 'GadgetGuru KL', earnings: 2100.0, clicks: 3200, conversions: 198 },
        { name: 'Shopeholic JB', earnings: 1500.0, clicks: 2800, conversions: 156 },
      ]
      for (let i = 0; i < leaderboardNames.length; i++) {
        const entry = leaderboardNames[i]
        const userId = i === 0 ? demoUser.id : null
        // For entries with userId=null, upsert on compound unique doesn't work in SQLite
        // Use findFirst + conditional create instead
        if (userId) {
          try {
            await prisma.leaderboardEntry.upsert({
              where: { userId_period: { userId, period: currentPeriod } },
              update: {},
              create: {
                userId,
                userName: entry.name,
                totalEarnings: entry.earnings,
                totalClicks: entry.clicks,
                totalConversions: entry.conversions,
                period: currentPeriod,
                rank: i + 1,
              },
            })
            leaderboardCreated++
          } catch {
            // skip duplicate
          }
        } else {
          const existingEntry = await prisma.leaderboardEntry.findFirst({
            where: { userName: entry.name, period: currentPeriod },
          })
          if (!existingEntry) {
            await prisma.leaderboardEntry.create({
              data: {
                userId,
                userName: entry.name,
                totalEarnings: entry.earnings,
                totalClicks: entry.clicks,
                totalConversions: entry.conversions,
                period: currentPeriod,
                rank: i + 1,
              },
            })
            leaderboardCreated++
          }
        }
      }
    }
    counts.leaderboardEntries = leaderboardCreated

    // ═══════════════════════════════════════════════════════════════
    // 11. Create 3 referrals (2 accepted, 1 pending)
    // ═══════════════════════════════════════════════════════════════
    let referralsCreated = 0
    const referralDefs = [
      { email: 'farah@shopee.my', name: 'Farah Aina', status: 'accepted', commission: 150.0 },
      { email: 'dzul@shopee.my', name: 'Dzul Azham', status: 'accepted', commission: 85.0 },
      { email: 'lina@shopee.my', name: 'Noralina Binti Ismail', status: 'pending', commission: null },
    ]
    for (const rd of referralDefs) {
      const existing = await prisma.referral.findFirst({ where: { referredEmail: rd.email } })
      if (!existing) {
        await prisma.referral.create({
          data: {
            referrerId: demoUser.id,
            referredEmail: rd.email,
            referredName: rd.name,
            status: rd.status,
            commission: rd.commission,
          },
        })
        referralsCreated++
      }
    }
    counts.referrals = referralsCreated

    // ═══════════════════════════════════════════════════════════════
    // 12. Create 1 Hermes connection (active, connected)
    // ═══════════════════════════════════════════════════════════════
    const existingConnection = await prisma.hermesConnection.findFirst({ where: { name: 'Hermes AI — Production' } })
    let hermesConnectionCreated = 0
    if (!existingConnection) {
      await prisma.hermesConnection.create({
        data: {
          name: 'Hermes AI — Production',
          endpoint: 'https://hermes.theviralfindsmy.com/api',
          apiKey: 'hrm_prod_' + generateShortCode() + generateShortCode(),
          model: 'hermes-3',
          isActive: true,
          lastConnected: new Date(),
          status: 'connected',
        },
      })
      hermesConnectionCreated++
    }
    counts.hermesConnections = hermesConnectionCreated

    // ═══════════════════════════════════════════════════════════════
    // 13. Create 1 Hermes conversation with 4 messages
    // ═══════════════════════════════════════════════════════════════
    const connection = await prisma.hermesConnection.findFirst({ where: { name: 'Hermes AI — Production' } })
    let hermesConvCreated = 0
    let hermesMsgCreated = 0
    if (connection) {
      const existingConv = await prisma.hermesConversation.findFirst({ where: { connectionId: connection.id, title: 'Raya Campaign Strategy' } })
      if (!existingConv) {
        const conv = await prisma.hermesConversation.create({
          data: {
            connectionId: connection.id,
            title: 'Raya Campaign Strategy',
            summary: 'Planning the Hari Raya 2025 affiliate campaign with beauty and fashion focus',
            messageCount: 4,
            isActive: true,
          },
        })
        hermesConvCreated++

        const messages = [
          {
            conversationId: conv.id,
            role: 'user',
            content: 'Can you help me plan an affiliate strategy for the upcoming Raya sale? I want to focus on beauty and fashion categories.',
            tokens: 28,
            metadata: null,
            createdAt: new Date(Date.now() - 3600000),
          },
          {
            conversationId: conv.id,
            role: 'assistant',
            content: 'Sure! For Raya 2025, I recommend focusing on these high-converting niches:\n\n1. **Bawal & Hijab** — Always top performers during Raya. The Bawal Premium Cotton line has a 15% conversion rate.\n2. **Kurta Modern** — Men\'s fashion peaks during Raya. Target the 25-40 age group.\n3. **SK-II & Premium Beauty** — Gift sets convert well. Bundle them with free gift wrapping.\n\nShall I create a campaign plan with budget allocation?',
            tokens: 95,
            metadata: JSON.stringify({ model: 'hermes-3', latency: 1200 }),
            createdAt: new Date(Date.now() - 3500000),
          },
          {
            conversationId: conv.id,
            role: 'user',
            content: 'Yes, please create a campaign plan. Budget is RM 2,000 across all channels.',
            tokens: 16,
            metadata: null,
            createdAt: new Date(Date.now() - 3000000),
          },
          {
            conversationId: conv.id,
            role: 'assistant',
            content: 'Here\'s the Raya Campaign Plan (RM 2,000 budget):\n\n| Channel | Allocation | Focus |\n|---------|-----------|-------|\n| TikTok | RM 800 | Bawal & Kurta short videos |\n| Instagram | RM 600 | Beauty skincare reels |\n| Facebook | RM 400 | Family bundle promotions |\n| Shopee Live | RM 200 | Flash sale sessions |\n\n**Key dates:**\n- Week 1-2: Teaser content\n- Week 3-4: Full promotion\n- Last 3 days: Flash sale + urgency posts\n\nEstimated ROI: 3.5x based on last year\'s data. Want me to schedule the content?',
            tokens: 145,
            metadata: JSON.stringify({ model: 'hermes-3', latency: 2100 }),
            createdAt: new Date(Date.now() - 2800000),
          },
        ]

        for (const msg of messages) {
          await prisma.hermesMessage.create({ data: msg })
          hermesMsgCreated++
        }
      }
    }
    counts.hermesConversations = hermesConvCreated
    counts.hermesMessages = hermesMsgCreated

    // ═══════════════════════════════════════════════════════════════
    // 14. Create 3 Hermes skills
    // ═══════════════════════════════════════════════════════════════
    const skillDefs = [
      {
        name: 'product_finder',
        description: 'Automatically discovers trending products on Shopee MY based on category, price range, and commission rates',
        category: 'research',
        code: 'async function findProducts(category, priceRange) {\n  const products = await shopee.search({ category, priceRange, sort: "top_sales" });\n  return products.filter(p => p.commissionRate >= 5);\n}',
        trigger: 'find_trending_products',
        status: 'active' as const,
        usageCount: 47,
        successRate: 89.3,
        version: 3,
        learnedFrom: 'User search patterns & manual product selections',
      },
      {
        name: 'content_writer',
        description: 'Generates Manglish and Bahasa Malaysia captions for social media posts about affiliate products',
        category: 'content',
        code: 'async function writeCaption(product, platform, tone) {\n  const prompt = buildPrompt(product, platform, tone);\n  return await hermes.generate(prompt, { language: "manglish" });\n}',
        trigger: 'generate_social_caption',
        status: 'active' as const,
        usageCount: 132,
        successRate: 94.7,
        version: 5,
        learnedFrom: 'Top-performing captions from last 6 months',
      },
      {
        name: 'trend_analyzer',
        description: 'Analyzes Shopee MY search trends and identifies emerging product opportunities for affiliates',
        category: 'analytics',
        code: 'async function analyzeTrends(period, category) {\n  const trends = await shopee.getTrends({ period, category });\n  return trends.filter(t => t.growthRate > 20).sort((a, b) => b.growthRate - a.growthRate);\n}',
        trigger: 'analyze_market_trends',
        status: 'active' as const,
        usageCount: 28,
        successRate: 82.1,
        version: 2,
        learnedFrom: 'Historical trend data & conversion correlations',
      },
    ]

    let skillsCreated = 0
    for (const sd of skillDefs) {
      const existing = await prisma.hermesSkill.findFirst({ where: { name: sd.name } })
      if (!existing) {
        await prisma.hermesSkill.create({ data: sd })
        skillsCreated++
      }
    }
    counts.hermesSkills = skillsCreated

    // ═══════════════════════════════════════════════════════════════
    // 15. Create 5 Hermes insights across different types
    // ═══════════════════════════════════════════════════════════════
    const insightDefs = [
      {
        type: 'trend',
        title: 'Bawal Hijab Searches Surging',
        description: 'Search volume for "bawal premium" increased 340% in the last 7 days. Raya season is driving this trend — recommend increasing bid on Bawal Premium Cotton link.',
        severity: 'info',
        data: JSON.stringify({ keyword: 'bawal premium', growthRate: 340, period: '7d' }),
      },
      {
        type: 'opportunity',
        title: 'Untapped Niche: Korean Skincare',
        description: 'Korean skincare products (COSRX, Some By Mi) have high search volume but low affiliate competition on Shopee MY. Estimated RM 500/week opportunity.',
        severity: 'info',
        data: JSON.stringify({ niche: 'korean_skincare', estWeeklyEarnings: 500, competition: 'low' }),
      },
      {
        type: 'alert',
        title: 'SK-II Link CTR Dropping',
        description: 'Your SK-II Facial Treatment Essence link CTR dropped from 8.2% to 4.1% over the past 14 days. Consider refreshing the caption or targeting a different audience segment.',
        severity: 'warning',
        data: JSON.stringify({ linkName: 'SK-II Facial Treatment Essence', ctrBefore: 8.2, ctrAfter: 4.1, period: '14d' }),
      },
      {
        type: 'recommendation',
        title: 'Optimal Posting Time: 8-10 PM MYT',
        description: 'Analysis of 2,400 click records shows 38% of conversions happen between 8-10 PM Malaysian Time. Schedule your social posts accordingly.',
        severity: 'info',
        data: JSON.stringify({ optimalHour: '20:00-22:00', conversionShare: 38, sampleSize: 2400 }),
      },
      {
        type: 'trend',
        title: 'Air Fryer Demand Spiking',
        description: 'Philips Air Fryer search volume up 180% — likely due to Hari Raya cooking content. Link CTR at 6.01% — there is room to improve with recipe-style content.',
        severity: 'info',
        data: JSON.stringify({ keyword: 'philips air fryer', growthRate: 180, currentCtr: 6.01 }),
      },
    ]

    let insightsCreated = 0
    for (const id of insightDefs) {
      const existing = await prisma.hermesInsight.findFirst({ where: { title: id.title } })
      if (!existing) {
        await prisma.hermesInsight.create({ data: id })
        insightsCreated++
      }
    }
    counts.hermesInsights = insightsCreated

    // ═══════════════════════════════════════════════════════════════
    // 16. Create 2 Hermes tasks (daily_summary, weekly_report)
    // ═══════════════════════════════════════════════════════════════
    let tasksCreated = 0
    const taskDefs = [
      {
        name: 'daily_summary',
        description: 'Generates a daily summary of clicks, conversions, and earnings for all active affiliate links',
        schedule: '0 9 * * *',
        status: 'scheduled',
        lastRunAt: new Date(Date.now() - 86400000),
        nextRunAt: new Date(Date.now() + 86400000 - Date.now() % 86400000 + 9 * 3600000),
        runCount: 45,
        lastResult: JSON.stringify({ clicks: 87, conversions: 6, earnings: 234.5 }),
      },
      {
        name: 'weekly_report',
        description: 'Compiles a weekly performance report with trend analysis and recommendations',
        schedule: '0 10 * * 1',
        status: 'scheduled',
        lastRunAt: new Date(Date.now() - 7 * 86400000),
        nextRunAt: new Date(Date.now() + 7 * 86400000),
        runCount: 12,
        lastResult: JSON.stringify({ totalClicks: 623, totalConversions: 45, totalEarnings: 1876.3, topLink: 'Bawal Premium Cotton' }),
      },
    ]

    for (const td of taskDefs) {
      const existing = await prisma.hermesTask.findFirst({ where: { name: td.name } })
      if (!existing) {
        await prisma.hermesTask.create({ data: td })
        tasksCreated++
      }
    }
    counts.hermesTasks = tasksCreated

    // ═══════════════════════════════════════════════════════════════
    // 17. Create 5 content library items
    // ═══════════════════════════════════════════════════════════════
    const contentDefs = [
      {
        type: 'caption',
        platform: 'tiktok',
        niche: 'beauty',
        product: 'SK-II Facial Treatment Essence',
        content: 'Wah best gila! SK-II ni memang miracle water 😭✨ Pakai seminggu dah nampak glow! Link dekat bio tau 🛒 #SK2 #SkincareMalaysia #GlowUp',
        language: 'manglish',
        tone: 'excited',
        usageCount: 23,
        isFavorite: true,
      },
      {
        type: 'caption',
        platform: 'instagram',
        niche: 'fashion',
        product: 'Bawal Premium Cotton',
        content: 'Raya confirmation slay dengan bawal premium ni 🥰❤️ Cotton 50s, tak mudah berkedut! Grab sebelum sold out! Link in bio 🛍️ #BawalPremium #HijabMalaysia #Raya2025',
        language: 'manglish',
        tone: 'casual',
        usageCount: 18,
        isFavorite: true,
      },
      {
        type: 'script',
        platform: 'shopee_live',
        niche: 'tech',
        product: 'Xiaomi Smart Band 8',
        content: 'Hey korang! Hari ni aku nak review Xiaomi Smart Band 8 Active. Untuk harga bawah RM90, ni antara fitness tracker terbaik tau! Ada 140+ sport modes, battery tahan 14 hari, dan water resistant 50m. Korang tengok ni... *tunjuk*... dia punya display sangat clear! Nak? Click link dekat bawah! Promo hari ni saja!',
        language: 'manglish',
        tone: 'excited',
        usageCount: 7,
        isFavorite: false,
      },
      {
        type: 'hashtags',
        platform: 'tiktok',
        niche: 'food',
        product: 'Harumanis Mango Paste',
        content: '#Harumanis #MangoPaste #Perlis #MakananMalaysia #ShopeeMY #RayaDish #KuihRaya #MangoLover #LocalDelights #Raya2025',
        language: 'english',
        tone: 'casual',
        usageCount: 5,
        isFavorite: false,
      },
      {
        type: 'caption',
        platform: 'facebook',
        niche: 'home',
        product: 'Philips Air Fryer HD9200',
        content: 'Masak goreng tanpa minyak? Boleh punya dengan Philips Air Fryer ni! 😍 Rendah lemak, tapi rasa still puas! Kat rumah memang wajib ada. Bawah RM350 je hari ni. Jangan terlepas promo! #PhilipsAirFryer #HealthyCooking #KitchenMustHave',
        language: 'manglish',
        tone: 'casual',
        usageCount: 12,
        isFavorite: true,
      },
    ]

    let contentCreated = 0
    for (const cd of contentDefs) {
      const existing = await prisma.contentLibrary.findFirst({ where: { type: cd.type, product: cd.product, platform: cd.platform } })
      if (!existing) {
        await prisma.contentLibrary.create({ data: cd })
        contentCreated++
      }
    }
    counts.contentLibrary = contentCreated

    // ═══════════════════════════════════════════════════════════════
    // 18. Create 2 scheduled posts (1 published, 1 scheduled)
    // ═══════════════════════════════════════════════════════════════
    let scheduledPostsCreated = 0
    const existingPublishedPost = await prisma.scheduledPost.findFirst({ where: { caption: 'Wah best gila! SK-II ni memang miracle water 😭✨' } })
    if (!existingPublishedPost) {
      await prisma.scheduledPost.create({
        data: {
          caption: 'Wah best gila! SK-II ni memang miracle water 😭✨ Pakai seminggu dah nampak glow! Link dekat bio tau 🛒',
          platforms: JSON.stringify(['tiktok', 'instagram']),
          productUrl: 'https://shopee.com.my/skii-facial-treatment-essence',
          affiliateLink: links[0] ? `https://shopee.com.my/aff/${links[0].id}` : null,
          imageUrl: null,
          hashtags: JSON.stringify(['#SK2', '#SkincareMalaysia', '#GlowUp']),
          status: 'published',
          scheduledAt: new Date(Date.now() - 86400000),
          publishedAt: new Date(Date.now() - 86400000),
          result: JSON.stringify({ tiktok: { views: 12400, likes: 890 }, instagram: { views: 5600, likes: 340 } }),
          retryCount: 0,
        },
      })
      scheduledPostsCreated++
    }
    const existingScheduledPost = await prisma.scheduledPost.findFirst({ where: { caption: 'Raya confirmation slay dengan bawal premium ni 🥰❤️' } })
    if (!existingScheduledPost) {
      await prisma.scheduledPost.create({
        data: {
          caption: 'Raya confirmation slay dengan bawal premium ni 🥰❤️ Cotton 50s, tak mudah berkedut! Grab sebelum sold out!',
          platforms: JSON.stringify(['tiktok', 'instagram', 'facebook']),
          productUrl: 'https://shopee.com.my/bawal-premium-cotton',
          affiliateLink: links[2] ? `https://shopee.com.my/aff/${links[2].id}` : null,
          imageUrl: null,
          hashtags: JSON.stringify(['#BawalPremium', '#HijabMalaysia', '#Raya2025']),
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + 2 * 86400000),
          retryCount: 0,
        },
      })
      scheduledPostsCreated++
    }
    counts.scheduledPosts = scheduledPostsCreated

    // ═══════════════════════════════════════════════════════════════
    // 19. Create 1 social account (Facebook, demo mode)
    // ═══════════════════════════════════════════════════════════════
    const existingSocial = await prisma.socialAccount.findFirst({ where: { userId: demoUser.id, platform: 'facebook' } })
    let socialAccountsCreated = 0
    if (!existingSocial) {
      await prisma.socialAccount.create({
        data: {
          userId: demoUser.id,
          platform: 'facebook',
          platformUserId: 'fb_demo_001',
          platformUsername: 'TheViralFindsMY',
          accessToken: 'demo_token_' + generateShortCode(),
          refreshToken: 'demo_refresh_' + generateShortCode(),
          expiresAt: new Date(Date.now() + 90 * 86400000),
          isConnected: true,
          isDemo: true,
          lastUsedAt: new Date(Date.now() - 86400000),
        },
      })
      socialAccountsCreated++
    }
    counts.socialAccounts = socialAccountsCreated

    // ═══════════════════════════════════════════════════════════════
    // 20. Create 1 post log for the published post
    // ═══════════════════════════════════════════════════════════════
    const publishedPost = await prisma.scheduledPost.findFirst({ where: { status: 'published' } })
    let postLogsCreated = 0
    if (publishedPost) {
      const existingLog = await prisma.postLog.findFirst({ where: { scheduledPostId: publishedPost.id, platform: 'facebook' } })
      if (!existingLog) {
        await prisma.postLog.create({
          data: {
            scheduledPostId: publishedPost.id,
            platform: 'facebook',
            status: 'published',
            attempt: 1,
            maxAttempts: 3,
            platformPostId: 'fb_post_' + generateShortCode(),
            platformUrl: 'https://facebook.com/theviralfindsmy/posts/demo',
            publishedAt: new Date(Date.now() - 86400000),
          },
        })
        postLogsCreated++
      }
    }
    counts.postLogs = postLogsCreated

    // ═══════════════════════════════════════════════════════════════
    // 21. Create 2 API keys (read-only, read-write)
    // ═══════════════════════════════════════════════════════════════
    let apiKeysCreated = 0
    const existingReadOnly = await prisma.apiKey.findFirst({ where: { name: 'Read-Only API Key' } })
    if (!existingReadOnly) {
      await prisma.apiKey.create({
        data: {
          name: 'Read-Only API Key',
          key: 'tvf_ro_' + generateShortCode() + generateShortCode(),
          secret: generateShortCode() + generateShortCode() + generateShortCode(),
          userId: demoUser.id,
          permissions: JSON.stringify(['read']),
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 86400000),
        },
      })
      apiKeysCreated++
    }
    const existingReadWrite = await prisma.apiKey.findFirst({ where: { name: 'Read-Write API Key' } })
    if (!existingReadWrite) {
      await prisma.apiKey.create({
        data: {
          name: 'Read-Write API Key',
          key: 'tvf_rw_' + generateShortCode() + generateShortCode(),
          secret: generateShortCode() + generateShortCode() + generateShortCode(),
          userId: demoUser.id,
          permissions: JSON.stringify(['read', 'write']),
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 86400000),
        },
      })
      apiKeysCreated++
    }
    counts.apiKeys = apiKeysCreated

    // ═══════════════════════════════════════════════════════════════
    // 22. Create 1 team with demo user as owner + 2 members
    // ═══════════════════════════════════════════════════════════════
    const existingTeam = await prisma.team.findFirst({ where: { name: 'TheViralFinds Crew' } })
    let teamsCreated = 0
    let teamMembersCreated = 0
    if (!existingTeam) {
      const team = await prisma.team.create({
        data: {
          name: 'TheViralFinds Crew',
          description: 'Main affiliate team for TheViralFinds MY — managing beauty, fashion, and tech campaigns',
          ownerId: demoUser.id,
          plan: 'pro',
          maxMembers: 10,
        },
      })
      teamsCreated++

      // Owner member
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: demoUser.id,
          role: 'owner',
          status: 'active',
        },
      })
      teamMembersCreated++

      // Member 1
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: member1.id,
          role: 'member',
          status: 'active',
        },
      })
      teamMembersCreated++

      // Member 2
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: member2.id,
          role: 'member',
          status: 'active',
        },
      })
      teamMembersCreated++

      // ═════════════════════════════════════════════════════════════
      // 23. Create 1 team invitation (pending)
      // ═════════════════════════════════════════════════════════════
      const existingInvitation = await prisma.teamInvitation.findFirst({ where: { teamId: team.id, email: 'hafiz@shopee.my' } })
      let teamInvitationsCreated = 0
      if (!existingInvitation) {
        await prisma.teamInvitation.create({
          data: {
            teamId: team.id,
            email: 'hafiz@shopee.my',
            role: 'member',
            token: 'inv_' + generateShortCode() + generateShortCode(),
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 86400000),
          },
        })
        teamInvitationsCreated++
      }
      counts.teamInvitations = teamInvitationsCreated
    }
    counts.teams = teamsCreated
    counts.teamMembers = teamMembersCreated

    // ═══════════════════════════════════════════════════════════════
    // 24. Create 1 white-label config (draft)
    // ═══════════════════════════════════════════════════════════════
    const existingWL = await prisma.whiteLabelConfig.findFirst({ where: { domain: 'affiliate.mybrands.com.my' } })
    let whitelabelCreated = 0
    if (!existingWL) {
      await prisma.whiteLabelConfig.create({
        data: {
          name: 'MyBrands Affiliate Portal',
          domain: 'affiliate.mybrands.com.my',
          logoUrl: null,
          primaryColor: '#E85D04',
          accentColor: '#DC2F02',
          companyName: 'MyBrands Sdn Bhd',
          supportEmail: 'support@mybrands.com.my',
          headTitle: 'MyBrands Affiliate Dashboard',
          customCss: null,
          emailTemplate: null,
          status: 'draft',
        },
      })
      whitelabelCreated++
    }
    counts.whiteLabelConfigs = whitelabelCreated

    // ═══════════════════════════════════════════════════════════════
    // 25. Create 3 marketplace listings with reviews
    // ═══════════════════════════════════════════════════════════════
    const listingDefs = [
      {
        title: 'Raya Campaign Template Pack',
        description: 'Complete set of social media templates for Raya affiliate campaigns — TikTok, Instagram & Facebook ready',
        category: 'templates',
        niche: 'fashion',
        platform: 'shopee',
        price: 49.9,
        rating: 4.8,
        downloadCount: 156,
        content: JSON.stringify({ files: 12, formats: ['canva', 'psd', 'png'], platforms: ['tiktok', 'instagram', 'facebook'] }),
        tags: JSON.stringify(['raya', 'templates', 'fashion', 'beauty']),
        status: 'active',
      },
      {
        title: 'Shopee Live Script — Beauty Edition',
        description: 'Professional live streaming scripts for beauty product promotions on Shopee Live with Manglish and Bahasa versions',
        category: 'scripts',
        niche: 'beauty',
        platform: 'shopee',
        price: 29.9,
        rating: 4.5,
        downloadCount: 89,
        content: JSON.stringify({ scripts: 8, languages: ['manglish', 'bahasa'], duration: ['15min', '30min', '60min'] }),
        tags: JSON.stringify(['live', 'scripts', 'beauty', 'shopee']),
        status: 'active',
      },
      {
        title: 'Affiliate Hashtag Research — Malaysian Market',
        description: 'Researched and tested hashtags for Malaysian affiliate marketing — 500+ tags across 10 niches',
        category: 'research',
        niche: null,
        platform: null,
        price: 19.9,
        rating: 4.2,
        downloadCount: 234,
        content: JSON.stringify({ hashtags: 520, niches: 10, platforms: ['tiktok', 'instagram', 'facebook', 'shopee'] }),
        tags: JSON.stringify(['hashtags', 'research', 'malaysia', 'seo']),
        status: 'active',
      },
    ]

    let listingsCreated = 0
    let reviewsCreated = 0
    for (const ld of listingDefs) {
      const existing = await prisma.marketplaceListing.findFirst({ where: { title: ld.title } })
      if (!existing) {
        const listing = await prisma.marketplaceListing.create({
          data: { sellerId: demoUser.id, ...ld },
        })
        listingsCreated++

        // Create a review for each listing
        const reviewNames = ['AfiqDeals', 'NisaShopMY', 'KedaiRoti']
        const reviewComments = [
          'Very helpful! Saved me hours of work. Worth every sen.',
          'Good quality templates. The Manglish scripts are especially useful for Malaysian audience.',
          'Great value for money. Already seeing better engagement with these hashtags.',
        ]
        const existingReview = await prisma.marketplaceReview.findFirst({ where: { listingId: listing.id, userName: reviewNames[listingsCreated - 1] || reviewNames[0] } })
        if (!existingReview) {
          await prisma.marketplaceReview.create({
            data: {
              listingId: listing.id,
              userId: null,
              userName: reviewNames[listingsCreated - 1] || reviewNames[0],
              rating: [5, 4, 4][listingsCreated - 1] || 4,
              comment: reviewComments[listingsCreated - 1] || reviewComments[0],
            },
          })
          reviewsCreated++
        }
      }
    }
    counts.marketplaceListings = listingsCreated
    counts.marketplaceReviews = reviewsCreated

    // ═══════════════════════════════════════════════════════════════
    // 26. Create 1 subscription (pro plan, active)
    // ═══════════════════════════════════════════════════════════════
    const existingSub = await prisma.subscription.findFirst({ where: { userId: demoUser.id } })
    let subscriptionsCreated = 0
    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          userId: demoUser.id,
          plan: 'pro',
          status: 'active',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          cancelAtPeriodEnd: false,
        },
      })
      subscriptionsCreated++
    }
    counts.subscriptions = subscriptionsCreated

    // ═══════════════════════════════════════════════════════════════
    // 27. Create 1 usage tracking record for current month
    // ═══════════════════════════════════════════════════════════════
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    let usageTrackingCreated = 0
    try {
      await prisma.usageTracking.upsert({
        where: { userId_period: { userId: demoUser.id, period: currentMonth } },
        update: {},
        create: {
          userId: demoUser.id,
          period: currentMonth,
          productsSearched: 87,
          linksCreated: 12,
          contentGenerated: 34,
          postsPublished: 8,
          aiQueries: 56,
        },
      })
      usageTrackingCreated++
    } catch {
      // already exists
    }
    counts.usageTracking = usageTrackingCreated

    // ═══════════════════════════════════════════════════════════════
    // 28. Create 2 A/B tests (1 running, 1 completed)
    // ═══════════════════════════════════════════════════════════════
    let abTestsCreated = 0
    const existingRunningAB = await prisma.abTest.findFirst({ where: { name: 'Bawal Caption A/B Test' } })
    if (!existingRunningAB) {
      await prisma.abTest.create({
        data: {
          name: 'Bawal Caption A/B Test',
          linkId: links[2]?.id || null,
          variants: JSON.stringify([
            { name: 'A — Manglish casual', content: 'Wah bawal ni lembut gila! 😍', clicks: 245, conversions: 22 },
            { name: 'B — Bahasa formal', content: 'Bawal premium kualiti terbaik untuk Hari Raya', clicks: 189, conversions: 15 },
          ]),
          status: 'running',
          startDate: new Date(Date.now() - 7 * 86400000),
        },
      })
      abTestsCreated++
    }
    const existingCompletedAB = await prisma.abTest.findFirst({ where: { name: 'SK-II Price Point Test' } })
    if (!existingCompletedAB) {
      await prisma.abTest.create({
        data: {
          name: 'SK-II Price Point Test',
          linkId: links[0]?.id || null,
          variants: JSON.stringify([
            { name: 'A — Full price RM 689', content: 'SK-II Facial Treatment Essence RM 689', clicks: 420, conversions: 28 },
            { name: 'B — Discounted RM 559', content: 'SK-II Facial Treatment Essence WAS RM 689 NOW RM 559', clicks: 580, conversions: 52 },
          ]),
          status: 'completed',
          winnerIndex: 1,
          startDate: new Date(Date.now() - 30 * 86400000),
          endDate: new Date(Date.now() - 14 * 86400000),
        },
      })
      abTestsCreated++
    }
    counts.abTests = abTestsCreated

    // ═══════════════════════════════════════════════════════════════
    // 29. Create 10 trend keywords across categories
    // ═══════════════════════════════════════════════════════════════
    const currentWeek = `${new Date().getFullYear()}-W${String(Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7)).padStart(2, '0')}`
    const trendDefs = [
      { keyword: 'bawal premium', category: 'fashion', platform: 'shopee', searchVolume: 45200, growthRate: 340, trend: 'rising' as const },
      { keyword: 'skincare korea', category: 'beauty', platform: 'shopee', searchVolume: 38100, growthRate: 125, trend: 'rising' as const },
      { keyword: 'air fryer philips', category: 'home', platform: 'shopee', searchVolume: 29800, growthRate: 180, trend: 'rising' as const },
      { keyword: 'xiaomi smart band', category: 'tech', platform: 'shopee', searchVolume: 22400, growthRate: 45, trend: 'stable' as const },
      { keyword: 'kurta modern', category: 'fashion', platform: 'shopee', searchVolume: 31600, growthRate: 290, trend: 'rising' as const },
      { keyword: 'milo 1.5kg', category: 'food', platform: 'shopee', searchVolume: 18900, growthRate: 15, trend: 'stable' as const },
      { keyword: 'portable blender', category: 'home', platform: 'shopee', searchVolume: 15600, growthRate: -12, trend: 'declining' as const },
      { keyword: 'serum vitamin c', category: 'beauty', platform: 'shopee', searchVolume: 27300, growthRate: 88, trend: 'rising' as const },
      { keyword: 'wireless earbuds', category: 'tech', platform: 'shopee', searchVolume: 34200, growthRate: 22, trend: 'stable' as const },
      { keyword: 'harumanis mango', category: 'food', platform: 'shopee', searchVolume: 12100, growthRate: 520, trend: 'rising' as const },
    ]

    let trendsCreated = 0
    for (const td of trendDefs) {
      try {
        await prisma.trendKeyword.upsert({
          where: { keyword_platform_period: { keyword: td.keyword, platform: td.platform, period: currentWeek } },
          update: {},
          create: { ...td, period: currentWeek },
        })
        trendsCreated++
      } catch {
        // skip duplicate
      }
    }
    counts.trendKeywords = trendsCreated

    // ═══════════════════════════════════════════════════════════════
    // 30. Create 2 competitor watches
    // ═══════════════════════════════════════════════════════════════
    let competitorWatchesCreated = 0
    const competitorDefs = [
      {
        shopName: 'BeautyHaus Official',
        platform: 'shopee',
        shopUrl: 'https://shopee.com.my/beautyhausofficial',
        topProduct: 'COSRX Advanced Snail 96 Mucin Power Essence',
        avgPrice: 55.0,
        followerCount: 125000,
        lastChecked: new Date(Date.now() - 86400000),
      },
      {
        shopName: 'TechZone MY',
        platform: 'shopee',
        shopUrl: 'https://shopee.com.my/techzonemy',
        topProduct: 'Anker Soundcore Life P2 Pro',
        avgPrice: 89.0,
        followerCount: 89000,
        lastChecked: new Date(Date.now() - 2 * 86400000),
      },
    ]

    for (const cd of competitorDefs) {
      const existing = await prisma.competitorWatch.findFirst({ where: { shopName: cd.shopName } })
      if (!existing) {
        await prisma.competitorWatch.create({
          data: { userId: demoUser.id, ...cd },
        })
        competitorWatchesCreated++
      }
    }
    counts.competitorWatches = competitorWatchesCreated

    // ═══════════════════════════════════════════════════════════════
    // 31. Create 3 live sessions (1 scheduled, 1 completed, 1 cancelled)
    // ═══════════════════════════════════════════════════════════════
    let liveSessionsCreated = 0
    const liveSessionDefs = [
      {
        title: 'Raya Beauty Haul Live 🎉',
        status: 'completed',
        scheduledAt: new Date(Date.now() - 7 * 86400000),
        startedAt: new Date(Date.now() - 7 * 86400000),
        endedAt: new Date(Date.now() - 7 * 86400000 + 7200000),
        viewers: 1240,
        peakViewers: 890,
        likes: 3450,
        comments: 267,
        shares: 89,
        revenue: 2340.0,
        products: JSON.stringify(['SHP_SKII_001', 'SHP_KIN_006']),
        script: JSON.stringify({ intro: 'Hey korang! Hari ni Raya Beauty Haul!', segments: 5, duration: '2h' }),
        notes: 'Great session! High engagement on SK-II segment.',
      },
      {
        title: '9.9 Mega Sale Preview — Tech Edition 📱',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 3 * 86400000),
        viewers: 0,
        peakViewers: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        revenue: 0,
        products: JSON.stringify(['SHP_XIAOMI_002', 'SHP_ANKER_007', 'SHP_PHILIPS_010']),
        script: JSON.stringify({ intro: 'Preview 9.9 tech deals!', segments: 4, duration: '1.5h' }),
        notes: 'Need to prepare product demos. Check with supplier for special pricing.',
      },
      {
        title: 'Kitchen Essentials Live Cook-Along 🍳',
        status: 'cancelled',
        scheduledAt: new Date(Date.now() - 3 * 86400000),
        viewers: 0,
        peakViewers: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        revenue: 0,
        products: JSON.stringify(['SHP_PHILIPS_010', 'SHP_DAISO_005']),
        script: null,
        notes: 'Cancelled due to supplier delay on Air Fryer stock.',
      },
    ]

    for (const ld of liveSessionDefs) {
      const existing = await prisma.liveSession.findFirst({ where: { title: ld.title } })
      if (!existing) {
        await prisma.liveSession.create({ data: ld })
        liveSessionsCreated++
      }
    }
    counts.liveSessions = liveSessionsCreated

    // ═══════════════════════════════════════════════════════════════
    // 32. Create 2 alert preferences (commission_xtra, trending)
    // ═══════════════════════════════════════════════════════════════
    let alertPrefsCreated = 0
    const alertDefs = [
      {
        alertType: 'commission_xtra',
        enabled: true,
        threshold: JSON.stringify({ minCommissionRate: 8, categories: ['beauty', 'fashion'] }),
      },
      {
        alertType: 'trending',
        enabled: true,
        threshold: JSON.stringify({ minGrowthRate: 100, minSearchVolume: 10000 }),
      },
    ]

    for (const ad of alertDefs) {
      try {
        await prisma.alertPreference.upsert({
          where: { userId_alertType: { userId: demoUser.id, alertType: ad.alertType } },
          update: {},
          create: { userId: demoUser.id, ...ad },
        })
        alertPrefsCreated++
      } catch {
        // skip duplicate
      }
    }
    counts.alertPreferences = alertPrefsCreated

    // ─── Done ─────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: 'Database seeded with Malaysian market data',
      counts,
      summary: {
        totalItems: Object.values(counts).reduce((a, b) => a + b, 0),
        categories: Object.keys(counts).length,
      },
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: error.message, counts },
      { status: 500 }
    )
  }
}
