'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Lock, CheckCircle2, Sparkles } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { QUERY_STALE_TIME } from '@/lib/query-config'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementBadge {
  type: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedAt: string | null
}

interface AchievementsData {
  achievements: AchievementBadge[]
  totalEarned: number
  totalPossible: number
}

// ─── API Fetch Hook ──────────────────────────────────────────────────────────

function useAchievementsData() {
  return useQuery<AchievementsData>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await fetch('/api/achievements')
      if (!res.ok) throw new Error('Failed to fetch achievements')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.dashboard,
  })
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function BadgeCard({ badge, index }: { badge: AchievementBadge; index: number }) {
  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.06,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileHover={badge.earned ? {
        scale: 1.05,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      } : {
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      }}
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
        badge.earned
          ? 'bg-gradient-to-b from-shopee/5 to-transparent border-shopee/20 shadow-sm'
          : 'bg-muted/30 border-border/50 opacity-60',
      )}
    >
      {/* Badge Icon */}
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full text-2xl',
          badge.earned
            ? 'bg-shopee/10 ring-2 ring-shopee/20'
            : 'bg-muted/60',
        )}
      >
        {badge.earned ? (
          <motion.span
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: index * 0.06 }}
          >
            {badge.icon}
          </motion.span>
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>

      {/* Title */}
      <h4 className={cn(
        'text-xs font-semibold leading-tight',
        badge.earned ? 'text-foreground' : 'text-muted-foreground',
      )}>
        {badge.title}
      </h4>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground leading-snug">
        {badge.description}
      </p>

      {/* Earned indicator */}
      <AnimatePresence>
        {badge.earned && earnedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{earnedDate}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sparkle effect for earned badges */}
      {badge.earned && (
        <motion.div
          className="absolute -top-1 -right-1"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.06 + 0.2, type: 'spring', stiffness: 300 }}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function AchievementBadgesSkeleton() {
  return (
    <Card className="card-hover">
      <CardHeader>
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-xl border p-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AchievementBadges() {
  const { data, isLoading, error } = useAchievementsData()

  if (isLoading) return <AchievementBadgesSkeleton />

  if (error || !data) {
    return (
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load achievements</p>
        </CardContent>
      </Card>
    )
  }

  const { achievements, totalEarned, totalPossible } = data
  const progressPercent = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Achievement Badges
              </CardTitle>
              <CardDescription>
                {totalEarned} of {totalPossible} badges earned
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs font-bold">
              {progressPercent}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{totalEarned} earned</span>
              <span>{totalPossible - totalEarned} to unlock</span>
            </div>
          </div>

          {/* Badge Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {achievements.map((badge, index) => (
              <BadgeCard key={badge.type} badge={badge} index={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default AchievementBadges
