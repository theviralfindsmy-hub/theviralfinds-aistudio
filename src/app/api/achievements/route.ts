import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/achievements
 *
 * Fetches all achievements for the user, checking conditions against DB data.
 * Returns: array of badge objects with earned status.
 */

// ── Achievement Definitions ──
const ACHIEVEMENT_DEFINITIONS = [
  {
    type: 'first_link',
    title: 'First Link Created',
    description: 'Created your first affiliate link',
    icon: '🔗',
  },
  {
    type: '100_clicks',
    title: '100 Clicks',
    description: 'Got 100 total clicks on your links',
    icon: '👆',
  },
  {
    type: 'first_commission',
    title: 'First Commission',
    description: 'Earned your first commission',
    icon: '💰',
  },
  {
    type: '7_day_streak',
    title: '7-Day Streak',
    description: 'Earnings for 7 consecutive days',
    icon: '🔥',
  },
  {
    type: 'rm1000_earned',
    title: 'RM 1,000 Earned',
    description: 'Total earnings reached RM 1,000',
    icon: '🏆',
  },
  {
    type: 'social_connected',
    title: 'Social Connected',
    description: 'Connected your first social account',
    icon: '📱',
  },
  {
    type: 'ai_powered',
    title: 'AI Powered',
    description: 'Generated your first AI content',
    icon: '🤖',
  },
  {
    type: 'team_player',
    title: 'Team Player',
    description: 'Joined a team',
    icon: '👥',
  },
] as const

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined

    // ── Fetch existing achievements from DB ──
    const earnedAchievements = await db.achievement.findMany({
      where: userId ? { userId } : {},
    })

    const earnedMap = new Map(earnedAchievements.map(a => [a.type, a]))

    // ── Check conditions for each achievement ──
    const results = await Promise.all(
      ACHIEVEMENT_DEFINITIONS.map(async (def) => {
        const earned = earnedMap.get(def.type)

        // If already earned, return immediately
        if (earned) {
          return {
            type: def.type,
            title: def.title,
            description: def.description,
            icon: def.icon,
            earned: true,
            earnedAt: earned.earnedAt.toISOString(),
          }
        }

        // Check condition against DB
        const conditionMet = await checkCondition(def.type, userId)

        // If condition is met, create the achievement in DB
        if (conditionMet) {
          try {
            const newAchievement = await db.achievement.create({
              data: {
                userId: userId || null,
                type: def.type,
                title: def.title,
                description: def.description,
                icon: def.icon,
                earnedAt: new Date(),
              },
            })
            return {
              type: def.type,
              title: def.title,
              description: def.description,
              icon: def.icon,
              earned: true,
              earnedAt: newAchievement.earnedAt.toISOString(),
            }
          } catch {
            // If creation fails (e.g. duplicate), still return as earned
            return {
              type: def.type,
              title: def.title,
              description: def.description,
              icon: def.icon,
              earned: true,
              earnedAt: new Date().toISOString(),
            }
          }
        }

        // Not earned yet
        return {
          type: def.type,
          title: def.title,
          description: def.description,
          icon: def.icon,
          earned: false,
          earnedAt: null,
        }
      })
    )

    return NextResponse.json({
      achievements: results,
      totalEarned: results.filter(a => a.earned).length,
      totalPossible: results.length,
    })
  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// ── Condition Checkers ──

async function checkCondition(type: string, userId?: string): Promise<boolean> {
  const linkWhere = userId ? { userId } : {}
  const conversionWhere = userId ? { affiliateLink: { userId } } : {}

  switch (type) {
    case 'first_link': {
      const linkCount = await db.affiliateLink.count({ where: linkWhere })
      return linkCount > 0
    }

    case '100_clicks': {
      const result = await db.affiliateLink.aggregate({
        _sum: { clicks: true },
        where: linkWhere,
      })
      return (result._sum.clicks || 0) >= 100
    }

    case 'first_commission': {
      const commissionCount = await db.conversion.count({
        where: conversionWhere,
      })
      return commissionCount > 0
    }

    case '7_day_streak': {
      // Check if there are 7 consecutive days with conversions in the last 60 days
      const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000)
      const conversions = await db.conversion.findMany({
        where: {
          ...conversionWhere,
          createdAt: { gte: sixtyDaysAgo },
        },
        select: { createdAt: true },
      })

      const daysWithEarnings = new Set<string>()
      for (const c of conversions) {
        daysWithEarnings.add(new Date(c.createdAt).toISOString().split('T')[0])
      }

      // Check for any 7-day consecutive streak
      let streak = 0
      let maxStreak = 0
      for (let i = 59; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        const key = d.toISOString().split('T')[0]
        if (daysWithEarnings.has(key)) {
          streak++
          maxStreak = Math.max(maxStreak, streak)
        } else {
          streak = 0
        }
      }
      return maxStreak >= 7
    }

    case 'rm1000_earned': {
      const result = await db.conversion.aggregate({
        _sum: { commission: true },
        where: conversionWhere,
      })
      return (result._sum.commission ? Number(result._sum.commission) : 0) >= 1000
    }

    case 'social_connected': {
      const socialCount = await db.socialAccount.count({
        where: userId ? { userId, isConnected: true } : { isConnected: true },
      })
      return socialCount > 0
    }

    case 'ai_powered': {
      const contentCount = await db.contentLibrary.count()
      return contentCount > 0
    }

    case 'team_player': {
      const teamCount = await db.teamMember.count({
        where: userId ? { userId } : {},
      })
      return teamCount > 0
    }

    default:
      return false
  }
}
