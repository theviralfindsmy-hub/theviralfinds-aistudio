'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { QUERY_STALE_TIME } from '@/lib/query-config'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeatmapDay {
  date: string
  day: number
  month: number
  dayOfWeek: number
  amount: number
  hasEarnings: boolean
  isToday: boolean
}

interface StreaksData {
  currentStreak: number
  longestStreak: number
  todayEarnings: number
  heatmap: HeatmapDay[]
  totalDaysWithEarnings: number
}

// ─── API Fetch Hook ──────────────────────────────────────────────────────────

function useStreaksData() {
  return useQuery<StreaksData>({
    queryKey: ['earnings', 'streaks'],
    queryFn: async () => {
      const res = await fetch('/api/earnings/streaks')
      if (!res.ok) throw new Error('Failed to fetch streaks data')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.earnings,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(num: number): string {
  return `RM ${num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StreakCounter({ current, longest }: { current: number; longest: number }) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <motion.div
          key={current}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center gap-2"
        >
          <Flame className={cn('h-8 w-8', current > 0 ? 'text-orange-500' : 'text-muted-foreground/40')} />
          <span className={cn(
            'text-4xl font-black tabular-nums',
            current > 0 ? 'text-foreground' : 'text-muted-foreground/40'
          )}>
            {current}
          </span>
        </motion.div>
        <span className="text-xs text-muted-foreground mt-1">Current Streak</span>
        <AnimatePresence>
          {current > 0 && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[10px] text-orange-500 font-medium"
            >
              day{current !== 1 ? 's' : ''}!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px bg-border" />

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <span className="text-2xl font-bold tabular-nums">{longest}</span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">Longest Streak</span>
      </div>
    </div>
  )
}

function HeatmapGrid({ heatmap }: { heatmap: HeatmapDay[] }) {
  // Organize into weeks (columns) for a GitHub-style grid
  // We'll show 30 days as a simple 6x5 grid (6 rows = days of week, 5 cols ≈ weeks)
  // Actually, let's do a simpler approach: show rows of 7 days each

  if (heatmap.length === 0) return null

  // Group by week rows
  const weeks: HeatmapDay[][] = []
  let currentWeek: HeatmapDay[] = []

  // Pad the first week to start on Sunday
  const firstDay = heatmap[0]
  if (firstDay) {
    for (let i = 0; i < firstDay.dayOfWeek; i++) {
      currentWeek.push({
        date: '',
        day: 0,
        month: 0,
        dayOfWeek: i,
        amount: 0,
        hasEarnings: false,
        isToday: false,
      })
    }
  }

  for (const day of heatmap) {
    currentWeek.push(day)
    if (day.dayOfWeek === 6 || day === heatmap[heatmap.length - 1]) {
      // Pad end of week
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          day: 0,
          month: 0,
          dayOfWeek: currentWeek.length,
          amount: 0,
          hasEarnings: false,
          isToday: false,
        })
      }
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Get unique months for header labels
  const monthLabels: { label: string; colIndex: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, colIdx) => {
    const firstRealDay = week.find(d => d.date !== '')
    if (firstRealDay && firstRealDay.month !== lastMonth) {
      monthLabels.push({ label: MONTH_NAMES[firstRealDay.month], colIndex: colIdx })
      lastMonth = firstRealDay.month
    }
  })

  return (
    <div className="space-y-1.5">
      {/* Month labels */}
      <div className="flex gap-1 pl-8">
        {weeks.map((_, colIdx) => {
          const monthLabel = monthLabels.find(m => m.colIndex === colIdx)
          return (
            <div key={colIdx} className="w-[22px] text-center">
              {monthLabel ? (
                <span className="text-[9px] text-muted-foreground font-medium">{monthLabel.label}</span>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Grid with day labels */}
      {DAY_LABELS.map((dayLabel, rowIdx) => (
        <div key={rowIdx} className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground w-7 text-right pr-1">
            {rowIdx % 2 === 1 ? dayLabel : ''}
          </span>
          {weeks.map((week, colIdx) => {
            const day = week[rowIdx]
            if (!day || day.date === '') {
              return <div key={`${colIdx}-${rowIdx}`} className="w-[22px] h-[22px]" />
            }

            return (
              <motion.div
                key={day.date}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: (colIdx * 7 + rowIdx) * 0.01,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                className={cn(
                  'w-[22px] h-[22px] rounded-[4px] transition-colors cursor-default relative group',
                  day.isToday && day.hasEarnings && 'ring-2 ring-[#CCFF00] ring-offset-1 ring-offset-background',
                  day.isToday && !day.hasEarnings && 'ring-2 ring-[#CCFF00]/50 ring-offset-1 ring-offset-background',
                  day.hasEarnings && !day.isToday && 'bg-[#0066FF]',
                  !day.hasEarnings && !day.isToday && 'bg-muted/60',
                  day.isToday && day.hasEarnings && 'bg-[#CCFF00]',
                  day.isToday && !day.hasEarnings && 'bg-[#CCFF00]/20',
                )}
                title={`${day.date}: ${day.hasEarnings ? formatCurrency(day.amount) : 'No earnings'}`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-popover border text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-md">
                  <div className="font-medium">{day.date}</div>
                  <div className={cn(day.hasEarnings ? 'text-emerald-500' : 'text-muted-foreground')}>
                    {day.hasEarnings ? formatCurrency(day.amount) : 'No earnings'}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function EarningStreaksSkeleton() {
  return (
    <Card className="card-hover">
      <CardHeader>
        <Skeleton className="h-5 w-36 mb-1" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-10 w-16" />
          </div>
          <Skeleton className="h-px w-4 self-stretch" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EarningStreaks() {
  const { data, isLoading, error } = useStreaksData()

  if (isLoading) return <EarningStreaksSkeleton />

  if (error || !data) {
    return (
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Earning Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load streak data</p>
        </CardContent>
      </Card>
    )
  }

  const { currentStreak, longestStreak, todayEarnings, heatmap, totalDaysWithEarnings } = data

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Earning Streaks
              </CardTitle>
              <CardDescription>Keep the momentum going!</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                {totalDaysWithEarnings} active days
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Streak Counters */}
          <div className="flex items-center justify-between">
            <StreakCounter current={currentStreak} longest={longestStreak} />

            {todayEarnings > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-right"
              >
                <div className="flex items-center gap-1 text-emerald-500">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-sm font-semibold">{formatCurrency(todayEarnings)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">today</span>
              </motion.div>
            )}
          </div>

          {/* Heatmap */}
          <div className="pt-2">
            <HeatmapGrid heatmap={heatmap} />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-muted/60" />
              <span className="text-[10px] text-muted-foreground">No earnings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#0066FF]" />
              <span className="text-[10px] text-muted-foreground">Earnings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#CCFF00] ring-1 ring-[#CCFF00]/50" />
              <span className="text-[10px] text-muted-foreground">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default EarningStreaks
