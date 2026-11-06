'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Flame,
  Share2,
  Lock,
  Star,
  Target,
  Award,
  Zap,
  Eye,
  TrendingUp,
  Crown,
  Gift,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type AchievementCategory = 'clicks' | 'conversions' | 'earnings' | 'streaks' | 'social'

interface Achievement {
  id: string
  icon: typeof Trophy
  title: string
  description: string
  category: AchievementCategory
  earned: boolean
  earnedDate?: string
  progress?: number
  maxProgress?: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const achievements: Achievement[] = [
  // Earned (8)
  {
    id: '1',
    icon: MousePointerClick,
    title: 'First Click',
    description: 'Receive your first affiliate link click.',
    category: 'clicks',
    earned: true,
    earnedDate: '2024-12-01',
  },
  {
    id: '2',
    icon: Eye,
    title: 'Click Master',
    description: 'Accumulate 1,000 total clicks across all links.',
    category: 'clicks',
    earned: true,
    earnedDate: '2025-01-15',
  },
  {
    id: '3',
    icon: ShoppingCart,
    title: 'First Conversion',
    description: 'Earn your first successful conversion.',
    category: 'conversions',
    earned: true,
    earnedDate: '2024-12-10',
  },
  {
    id: '4',
    icon: Target,
    title: 'Conversion Pro',
    description: 'Reach 50 total conversions.',
    category: 'conversions',
    earned: true,
    earnedDate: '2025-02-20',
  },
  {
    id: '5',
    icon: DollarSign,
    title: 'First Ringgit',
    description: 'Earn your first RM 1 in commission.',
    category: 'earnings',
    earned: true,
    earnedDate: '2024-12-10',
  },
  {
    id: '6',
    icon: TrendingUp,
    title: 'RM 1K Club',
    description: 'Accumulate RM 1,000 in total earnings.',
    category: 'earnings',
    earned: true,
    earnedDate: '2025-01-28',
  },
  {
    id: '7',
    icon: Flame,
    title: '7-Day Streak',
    description: 'Generate clicks for 7 consecutive days.',
    category: 'streaks',
    earned: true,
    earnedDate: '2025-02-05',
  },
  {
    id: '8',
    icon: Share2,
    title: 'Social Butterfly',
    description: 'Share affiliate links on 3 different platforms.',
    category: 'social',
    earned: true,
    earnedDate: '2025-01-20',
  },
  // Locked (6)
  {
    id: '9',
    icon: Zap,
    title: 'Click Legend',
    description: 'Accumulate 10,000 total clicks.',
    category: 'clicks',
    earned: false,
    progress: 3240,
    maxProgress: 10000,
  },
  {
    id: '10',
    icon: Crown,
    title: 'Conversion King',
    description: 'Reach 200 total conversions.',
    category: 'conversions',
    earned: false,
    progress: 67,
    maxProgress: 200,
  },
  {
    id: '11',
    icon: Award,
    title: 'RM 10K Earner',
    description: 'Accumulate RM 10,000 in total earnings.',
    category: 'earnings',
    earned: false,
    progress: 4280,
    maxProgress: 10000,
  },
  {
    id: '12',
    icon: Star,
    title: '30-Day Streak',
    description: 'Generate clicks for 30 consecutive days.',
    category: 'streaks',
    earned: false,
    progress: 12,
    maxProgress: 30,
  },
  {
    id: '13',
    icon: Gift,
    title: 'Viral Sensation',
    description: 'Get a single link with 500+ clicks.',
    category: 'social',
    earned: false,
    progress: 189,
    maxProgress: 500,
  },
  {
    id: '14',
    icon: Trophy,
    title: 'Top Affiliate',
    description: 'Reach the top 10 on the monthly leaderboard.',
    category: 'earnings',
    earned: false,
    progress: 0,
    maxProgress: 1,
  },
]

const categoryConfig: Record<AchievementCategory, { label: string; icon: typeof MousePointerClick }> = {
  clicks: { label: 'Clicks', icon: MousePointerClick },
  conversions: { label: 'Conversions', icon: ShoppingCart },
  earnings: { label: 'Earnings', icon: DollarSign },
  streaks: { label: 'Streaks', icon: Flame },
  social: { label: 'Social', icon: Share2 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<string>('all')

  const earnedCount = achievements.filter((a) => a.earned).length
  const totalCount = achievements.length

  const filteredAchievements =
    activeTab === 'all'
      ? achievements
      : achievements.filter((a) => a.category === activeTab)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground text-sm">
          Track your milestones and unlock rewards
        </p>
      </motion.div>

      {/* Overall Progress */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-shopee/10 flex size-14 items-center justify-center rounded-full">
                  <Trophy className="text-shopee size-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {earnedCount} / {totalCount} Achievements
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Keep going! You&apos;re earning achievements fast.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-48">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium text-shopee">
                    {Math.round((earnedCount / totalCount) * 100)}%
                  </span>
                </div>
                <Progress value={(earnedCount / totalCount) * 100} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Tabs */}
      <motion.div {...fadeIn}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <TabsTrigger key={key} value={key} className="gap-1.5">
                <cfg.icon className="size-3.5" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredAchievements.map((achievement) => {
                const progressPct = achievement.maxProgress
                  ? Math.round((achievement.progress! / achievement.maxProgress) * 100)
                  : 0

                return (
                  <motion.div key={achievement.id} variants={fadeIn}>
                    <Card
                      className={cn(
                        'card-hover relative overflow-hidden',
                        achievement.earned
                          ? 'border-shopee/20'
                          : 'opacity-70 grayscale-[30%]'
                      )}
                    >
                      {achievement.earned && (
                        <div className="bg-shopee/5 absolute inset-0 pointer-events-none" />
                      )}
                      <CardContent className="relative p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'flex size-11 shrink-0 items-center justify-center rounded-xl',
                              achievement.earned
                                ? 'bg-shopee/10 text-shopee'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {achievement.earned ? (
                              <achievement.icon className="size-5" />
                            ) : (
                              <Lock className="size-5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold leading-tight">
                                {achievement.title}
                              </h3>
                              {achievement.earned && (
                                <Star className="size-3.5 fill-shopee text-shopee shrink-0" />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                              {achievement.description}
                            </p>
                          </div>
                        </div>

                        {achievement.earned ? (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Trophy className="size-3 text-shopee" />
                            Earned on {achievement.earnedDate}
                          </div>
                        ) : achievement.maxProgress ? (
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {achievement.progress!.toLocaleString()} / {achievement.maxProgress.toLocaleString()}
                              </span>
                              <span className="font-medium">{progressPct}%</span>
                            </div>
                            <Progress value={progressPct} className="h-1.5" />
                          </div>
                        ) : null}

                        {/* Category Badge */}
                        <div className="mt-2">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {categoryConfig[achievement.category].label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
