'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Medal,
  Crown,
  ArrowUpRight,
  User,
  DollarSign,
  MousePointerClick,
  ShoppingCart,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number
  name: string
  initials: string
  earnings: number
  clicks: number
  conversions: number
  isYou?: boolean
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const weeklyData: LeaderboardEntry[] = [
  { rank: 1, name: 'Sarah Tan', initials: 'ST', earnings: 1850.40, clicks: 3420, conversions: 87 },
  { rank: 2, name: 'Ahmad Razak', initials: 'AR', earnings: 1420.80, clicks: 2810, conversions: 64 },
  { rank: 3, name: 'Jessica Lim', initials: 'JL', earnings: 1210.50, clicks: 2560, conversions: 58 },
  { rank: 4, name: 'Kumar Nair', initials: 'KN', earnings: 980.20, clicks: 1950, conversions: 45 },
  { rank: 5, name: 'You', initials: 'YO', earnings: 865.30, clicks: 1820, conversions: 41, isYou: true },
  { rank: 6, name: 'Mei Chen', initials: 'MC', earnings: 720.90, clicks: 1640, conversions: 33 },
  { rank: 7, name: 'Farah Iman', initials: 'FI', earnings: 650.40, clicks: 1480, conversions: 29 },
  { rank: 8, name: 'David Wong', initials: 'DW', earnings: 540.60, clicks: 1210, conversions: 25 },
  { rank: 9, name: 'Nur Aisyah', initials: 'NA', earnings: 420.10, clicks: 980, conversions: 19 },
  { rank: 10, name: 'Lee Wei', initials: 'LW', earnings: 310.80, clicks: 720, conversions: 14 },
]

const monthlyData: LeaderboardEntry[] = [
  { rank: 1, name: 'Ahmad Razak', initials: 'AR', earnings: 6200.00, clicks: 12400, conversions: 280 },
  { rank: 2, name: 'Sarah Tan', initials: 'ST', earnings: 5680.50, clicks: 11200, conversions: 256 },
  { rank: 3, name: 'Jessica Lim', initials: 'JL', earnings: 4890.20, clicks: 9600, conversions: 210 },
  { rank: 4, name: 'You', initials: 'YO', earnings: 4280.50, clicks: 8400, conversions: 185, isYou: true },
  { rank: 5, name: 'Kumar Nair', initials: 'KN', earnings: 3920.80, clicks: 7800, conversions: 170 },
  { rank: 6, name: 'Mei Chen', initials: 'MC', earnings: 3450.00, clicks: 6800, conversions: 148 },
  { rank: 7, name: 'David Wong', initials: 'DW', earnings: 2890.30, clicks: 5600, conversions: 125 },
  { rank: 8, name: 'Farah Iman', initials: 'FI', earnings: 2340.60, clicks: 4700, conversions: 102 },
  { rank: 9, name: 'Nur Aisyah', initials: 'NA', earnings: 1890.20, clicks: 3800, conversions: 85 },
  { rank: 10, name: 'Lee Wei', initials: 'LW', earnings: 1450.80, clicks: 2900, conversions: 63 },
]

const yearlyData: LeaderboardEntry[] = [
  { rank: 1, name: 'Sarah Tan', initials: 'ST', earnings: 52000.00, clicks: 98000, conversions: 2340 },
  { rank: 2, name: 'Ahmad Razak', initials: 'AR', earnings: 48500.50, clicks: 92000, conversions: 2180 },
  { rank: 3, name: 'Jessica Lim', initials: 'JL', earnings: 41200.80, clicks: 81000, conversions: 1920 },
  { rank: 4, name: 'Kumar Nair', initials: 'KN', earnings: 36800.20, clicks: 72000, conversions: 1650 },
  { rank: 5, name: 'Mei Chen', initials: 'MC', earnings: 32400.00, clicks: 64000, conversions: 1480 },
  { rank: 6, name: 'You', initials: 'YO', earnings: 34521.90, clicks: 68000, conversions: 1540, isYou: true },
  { rank: 7, name: 'David Wong', initials: 'DW', earnings: 28900.30, clicks: 56000, conversions: 1260 },
  { rank: 8, name: 'Farah Iman', initials: 'FI', earnings: 24300.60, clicks: 48000, conversions: 1050 },
  { rank: 9, name: 'Nur Aisyah', initials: 'NA', earnings: 19800.20, clicks: 39000, conversions: 870 },
  { rank: 10, name: 'Lee Wei', initials: 'LW', earnings: 15200.80, clicks: 30000, conversions: 660 },
]

const dataMap: Record<string, LeaderboardEntry[]> = {
  weekly: weeklyData,
  monthly: monthlyData,
  yearly: yearlyData,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRM = (value: number) =>
  `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatNumber = (value: number) => value.toLocaleString('en-MY')

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const medalColors = ['text-amber-500', 'text-slate-400', 'text-amber-700']
const podiumOrder = [1, 0, 2] // 2nd, 1st, 3rd for visual layout

// ─── Component ────────────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const [period, setPeriod] = useState<string>('weekly')
  const data = dataMap[period] || weeklyData
  const top3 = data.slice(0, 3)
  const rest = data.slice(3)
  const yourEntry = data.find((e) => e.isYou)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground text-sm">
          See how you rank against other Shopee affiliates
        </p>
      </motion.div>

      {/* Period Tabs */}
      <motion.div {...fadeIn}>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          {['weekly', 'monthly', 'yearly'].map((p) => (
            <TabsContent key={p} value={p} className="mt-6 space-y-6">
              {/* Podium - Top 3 */}
              <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4">
                {podiumOrder.map((idx) => {
                  const entry = top3[idx]
                  if (!entry) return null
                  const isFirst = idx === 0
                  const podiumHeight = isFirst ? 'h-32' : 'h-24'
                  const avatarSize = isFirst ? 'size-16' : 'size-12'
                  const badgeClass = idx === 0
                    ? 'bg-amber-500 text-white'
                    : idx === 1
                    ? 'bg-slate-400 text-white'
                    : 'bg-amber-700 text-white'

                  return (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.15, duration: 0.4 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative">
                        <Avatar className={cn(avatarSize, 'border-2 border-background shadow-md')}>
                          <AvatarFallback className={cn('text-sm font-bold', isFirst ? 'bg-shopee/10 text-shopee' : 'bg-muted')}>
                            {entry.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn('absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full text-xs font-bold', badgeClass)}>
                          {entry.rank}
                        </div>
                      </div>
                      <p className={cn('mt-2 text-sm font-semibold text-center', entry.isYou && 'text-shopee')}>
                        {entry.name}
                      </p>
                      <p className="text-xs font-bold text-shopee">{formatRM(entry.earnings)}</p>
                      <div className={cn('mt-2 w-20 sm:w-28 rounded-t-lg bg-shopee/10 flex items-end justify-center', podiumHeight)}>
                        <div className={cn('w-full rounded-t-lg', isFirst ? 'bg-shopee/30' : 'bg-shopee/15')} style={{ height: isFirst ? '100%' : '75%' }} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Your Position Highlight */}
              {yourEntry && (
                <Card className="border-shopee/20 bg-shopee/5 card-hover">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="bg-shopee/10 flex size-10 items-center justify-center rounded-full">
                      <span className="text-sm font-bold text-shopee">#{yourEntry.rank}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Your Position</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRM(yourEntry.earnings)} earned &middot; {formatNumber(yourEntry.clicks)} clicks &middot; {formatNumber(yourEntry.conversions)} conversions
                      </p>
                    </div>
                    <ArrowUpRight className="size-4 text-shopee" />
                  </CardContent>
                </Card>
              )}

              {/* Full Leaderboard Table */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-base">Full Rankings</CardTitle>
                  <CardDescription>Complete leaderboard for the {p} period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Earnings</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">Clicks</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">Conversions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((entry) => (
                          <TableRow
                            key={entry.rank}
                            className={cn(entry.isYou && 'bg-shopee/5 font-medium')}
                          >
                            <TableCell>
                              {entry.rank <= 3 ? (
                                <div className={cn('flex size-7 items-center justify-center rounded-full text-xs font-bold', 
                                  entry.rank === 1 ? 'bg-amber-500/10 text-amber-600' :
                                  entry.rank === 2 ? 'bg-slate-400/10 text-slate-500' :
                                  'bg-amber-700/10 text-amber-700'
                                )}>
                                  {entry.rank}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">{entry.rank}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="size-7">
                                  <AvatarFallback className={cn('text-xs', entry.isYou ? 'bg-shopee/10 text-shopee' : 'bg-muted')}>
                                    {entry.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={cn('text-sm', entry.isYou && 'font-semibold text-shopee')}>
                                  {entry.name}
                                </span>
                                {entry.isYou && (
                                  <Badge variant="default" className="text-[10px] h-4 px-1.5">
                                    You
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatRM(entry.earnings)}
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                              {formatNumber(entry.clicks)}
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                              {formatNumber(entry.conversions)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  )
}
