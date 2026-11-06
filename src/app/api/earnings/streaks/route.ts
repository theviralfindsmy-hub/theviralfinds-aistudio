import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/earnings/streaks
 *
 * Calculates earning streaks from Conversion records.
 * Returns: currentStreak, longestStreak, heatmap data for last 30 days, today's earnings.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined

    const conversionWhere = userId
      ? { affiliateLink: { userId } }
      : {}

    // ── Get all conversion dates for the last 60 days (need extra for longest streak) ──
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000)
    const conversions = await db.conversion.findMany({
      where: {
        ...conversionWhere,
        createdAt: { gte: sixtyDaysAgo },
      },
      select: { createdAt: true, commission: true },
    })

    // ── Build a map of date -> total commission ──
    const dayEarnings = new Map<string, number>()
    for (const c of conversions) {
      const dayKey = new Date(c.createdAt).toISOString().split('T')[0]
      dayEarnings.set(dayKey, (dayEarnings.get(dayKey) || 0) + Number(c.commission))
    }

    // ── Calculate streaks ──
    const today = new Date()
    const todayKey = today.toISOString().split('T')[0]
    const yesterday = new Date(today.getTime() - 86400000)
    const yesterdayKey = yesterday.toISOString().split('T')[0]

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Start from today and go backwards for current streak
    let checkDate = new Date(today)
    // If today has earnings, count it; otherwise start from yesterday
    if (dayEarnings.has(todayKey) && (dayEarnings.get(todayKey) || 0) > 0) {
      currentStreak = 1
      checkDate = new Date(today.getTime() - 86400000)
    } else if (dayEarnings.has(yesterdayKey) && (dayEarnings.get(yesterdayKey) || 0) > 0) {
      // Today has no earnings yet, check from yesterday
      currentStreak = 0
      checkDate = new Date(yesterday)
    } else {
      currentStreak = 0
    }

    // Continue counting backwards for current streak
    if (currentStreak > 0 || (dayEarnings.has(yesterdayKey) && (dayEarnings.get(yesterdayKey) || 0) > 0)) {
      if (currentStreak === 0) {
        currentStreak = 1
      }
      while (true) {
        const checkKey = checkDate.toISOString().split('T')[0]
        if (dayEarnings.has(checkKey) && (dayEarnings.get(checkKey) || 0) > 0) {
          currentStreak++
          checkDate = new Date(checkDate.getTime() - 86400000)
        } else {
          break
        }
      }
    }

    // Calculate longest streak from all data in the 60-day window
    const allDays: string[] = []
    for (let i = 59; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      allDays.push(d.toISOString().split('T')[0])
    }

    for (const day of allDays) {
      if (dayEarnings.has(day) && (dayEarnings.get(day) || 0) > 0) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // ── Heatmap data for last 30 days ──
    const heatmap: Array<{
      date: string
      day: number
      month: number
      dayOfWeek: number
      amount: number
      hasEarnings: boolean
      isToday: boolean
    }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().split('T')[0]
      const amount = dayEarnings.get(key) || 0
      heatmap.push({
        date: key,
        day: d.getDate(),
        month: d.getMonth(),
        dayOfWeek: d.getDay(),
        amount: Math.round(amount * 100) / 100,
        hasEarnings: amount > 0,
        isToday: key === todayKey,
      })
    }

    // ── Today's earnings ──
    const todayEarnings = dayEarnings.get(todayKey) || 0

    return NextResponse.json({
      currentStreak,
      longestStreak,
      todayEarnings: Math.round(todayEarnings * 100) / 100,
      heatmap,
      totalDaysWithEarnings: Array.from(dayEarnings.values()).filter(v => v > 0).length,
    })
  } catch (error) {
    console.error('Earnings streaks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earning streaks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
