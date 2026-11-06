'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { DollarSign, Clock, TrendingUp, Zap } from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { QUERY_STALE_TIME } from '@/lib/query-config'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TickerConversion {
  id: string
  linkName: string
  amount: number
  commission: number
  status: string
  createdAt: string
}

interface EarningsData {
  recentConversions: TickerConversion[]
}

// ─── API Fetch Hook ──────────────────────────────────────────────────────────

function useEarningsData() {
  return useQuery<EarningsData>({
    queryKey: ['earnings', 'ticker'],
    queryFn: async () => {
      const res = await fetch('/api/earnings?period=7d')
      if (!res.ok) throw new Error('Failed to fetch earnings')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.earnings,
    refetchInterval: 30_000, // Refresh every 30s for live feel
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(num: number): string {
  return `RM ${num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`

  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

// ─── Marquee Item ─────────────────────────────────────────────────────────────

function TickerItem({ conversion, index }: { conversion: TickerConversion; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.08,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className="flex items-center gap-3 px-4 py-2 border-r border-border/50 last:border-r-0 whitespace-nowrap"
    >
      {/* Time */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className="text-[11px] font-medium">{formatTime(conversion.createdAt)}</span>
      </div>

      {/* Separator dot */}
      <div className="w-1 h-1 rounded-full bg-border" />

      {/* Product name */}
      <span className="text-xs font-medium truncate max-w-[140px]">
        {conversion.linkName}
      </span>

      {/* Separator dot */}
      <div className="w-1 h-1 rounded-full bg-border" />

      {/* Commission amount */}
      <div className="flex items-center gap-1">
        <DollarSign className="h-3 w-3 text-emerald-500" />
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(conversion.commission)}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LiveEarningsTickerSkeleton() {
  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="py-0">
        <div className="flex items-center gap-2 py-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-4 ml-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LiveEarningsTicker() {
  const { data, isLoading, error } = useEarningsData()

  if (isLoading) return <LiveEarningsTickerSkeleton />

  if (error || !data) {
    return (
      <Card className="card-hover overflow-hidden">
        <CardContent className="py-0">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-xs text-muted-foreground">Unable to load live earnings</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const conversions = data.recentConversions || []

  // No data placeholder
  if (conversions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="card-hover overflow-hidden border-dashed">
          <CardContent className="py-0">
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">
                  No recent earnings yet
                </span>
                <span className="text-[10px] text-muted-foreground/70 ml-2">
                  Earnings will appear here in real-time as commissions come in
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Duplicate items for seamless loop
  const tickerItems = [...conversions, ...conversions]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="card-hover overflow-hidden">
        <CardContent className="py-0">
          <div className="flex items-center">
            {/* Label */}
            <div className="flex items-center gap-2 py-3 pr-4 border-r border-border/50 shrink-0">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10"
              >
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Live
                </span>
                <span className="text-[9px] text-muted-foreground">Earnings</span>
              </div>
            </div>

            {/* Scrolling ticker */}
            <div className="flex-1 overflow-hidden">
              <motion.div
                className="flex"
                animate={{
                  x: [0, -(conversions.length * 220)],
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: 'loop',
                    duration: conversions.length * 4,
                    ease: 'linear',
                  },
                }}
              >
                {tickerItems.map((conversion, index) => (
                  <TickerItem
                    key={`${conversion.id}-${index}`}
                    conversion={conversion}
                    index={index % conversions.length}
                  />
                ))}
              </motion.div>
            </div>

            {/* Fade edges */}
            <div className="absolute left-[120px] top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default LiveEarningsTicker
