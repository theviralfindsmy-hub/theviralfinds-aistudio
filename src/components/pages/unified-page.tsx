'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  LayoutGrid,
  MousePointerClick,
  Percent,
  Target,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  EarningsPeriod,
  UnifiedEarningsResponse,
} from '@/lib/earnings/types'

// ─── Helpers ───────────────────────────────────────────────────────

const formatRM = (value: number) =>
  `RM ${value.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatCompactRM = (value: number) => {
  if (value >= 1000) {
    return `RM ${(value / 1000).toFixed(1)}k`
  }
  return `RM ${value.toFixed(0)}`
}

const formatNumber = (value: number) => value.toLocaleString('en-MY')

const formatPercent = (value: number, digits = 2) => `${value.toFixed(digits)}%`

// ─── Animation ─────────────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// ─── Sub-components ────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeUp,
  miniIcons,
}: {
  title: string
  value: string
  icon: React.ElementType
  change?: string
  changeUp?: boolean
  miniIcons?: { emoji: string; color: string }[]
}) {
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {changeUp ? (
              <ArrowUpRight className="size-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="size-3 text-red-500" />
            )}
            <span className={changeUp ? 'text-emerald-500' : 'text-red-500'}>
              {change}
            </span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
        )}
        {miniIcons && miniIcons.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {miniIcons.map((mi, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                style={{ color: mi.color, borderColor: `${mi.color}40` }}
              >
                <span>{mi.emoji}</span>
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: mi.color }}
                />
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PlatformCard({
  platform,
  sparkData,
}: {
  platform: UnifiedEarningsResponse['byPlatform'][number]
  sparkData: { i: number; v: number }[]
}) {
  const up = platform.momChange >= 0
  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex size-9 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: `${platform.color}20` }}
            >
              {platform.emoji}
            </span>
            <div>
              <CardTitle className="text-base">{platform.platformName}</CardTitle>
              <CardDescription className="text-xs">
                {formatPercent(platform.conversionRate, 1)} conversion
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={up ? 'default' : 'destructive'}
            className="gap-1"
            style={up ? { backgroundColor: platform.color, color: '#fff' } : undefined}
          >
            {up ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {formatPercent(Math.abs(platform.momChange), 1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatRM(platform.earnings)}</div>
        <p className="text-muted-foreground text-xs">Earnings this period</p>
        <div className="mt-3 h-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={platform.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: 11,
                }}
                formatter={(v: number) => [formatRM(v), 'Earnings']}
                labelFormatter={() => ''}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {formatNumber(platform.clicks)} clicks
          </span>
          <span className="text-muted-foreground">
            {formatNumber(platform.conversions)} orders
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border bg-background p-3 text-xs shadow-md">
      {label && <div className="mb-1 font-medium">{label}</div>}
      <div className="space-y-1">
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              {entry.name}
            </span>
            <span className="font-medium">{formatRM(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0]
  return (
    <div className="rounded-lg border bg-background p-3 text-xs shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: p.payload.color }}
        />
        <span className="font-medium">{p.payload.name}</span>
      </div>
      <div className="mt-1 text-muted-foreground">
        {formatRM(p.payload.value)} ({formatPercent(p.payload.share, 1)})
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 w-full lg:col-span-1" />
        <Skeleton className="h-72 w-full lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────

export function UnifiedPage() {
  const [period, setPeriod] = useState<EarningsPeriod>('12m')

  const { data, isLoading, isError, error } = useQuery<UnifiedEarningsResponse>({
    queryKey: ['unified-earnings', period],
    queryFn: async () => {
      const res = await fetch(`/api/earnings/unified?period=${period}`)
      if (!res.ok) {
        const msg = `Failed to load earnings (${res.status})`
        toast.error(msg)
        throw new Error(msg)
      }
      return res.json() as Promise<UnifiedEarningsResponse>
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  // Toast on error (only once per render where isError flips true)
  useMemo(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load earnings',
      )
    }
  }, [isError, error])

  const trendData = useMemo(() => data?.trend ?? [], [data])
  const sparkDataMap = useMemo(() => {
    const map: Record<string, { i: number; v: number }[]> = {}
    data?.byPlatform.forEach((p) => {
      map[p.platform] = p.sparkline.map((v, i) => ({ i, v }))
    })
    return map
  }, [data])

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        {...fadeIn}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
            <LayoutGrid className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Unified Earnings Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              All platforms, one view
            </p>
          </div>
        </div>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as EarningsPeriod)}
        >
          <TabsList>
            <TabsTrigger value="30d">30D</TabsTrigger>
            <TabsTrigger value="90d">90D</TabsTrigger>
            <TabsTrigger value="12m">12M</TabsTrigger>
          </TabsList>
          <TabsContent value={period} className="hidden" />
        </Tabs>
      </motion.div>

      {isLoading || !data ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Top stats cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={fadeIn}>
              <StatCard
                title="Total Earnings"
                value={formatRM(data.summary.totalEarnings)}
                icon={DollarSign}
                change="+18.4%"
                changeUp
                miniIcons={data.byPlatform.map((p) => ({
                  emoji: p.emoji,
                  color: p.color,
                }))}
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <StatCard
                title="Total Clicks"
                value={formatNumber(data.summary.totalClicks)}
                icon={MousePointerClick}
                change="+12.7%"
                changeUp
                miniIcons={data.byPlatform.map((p) => ({
                  emoji: p.emoji,
                  color: p.color,
                }))}
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <StatCard
                title="Total Conversions"
                value={formatNumber(data.summary.totalConversions)}
                icon={Target}
                change="+9.2%"
                changeUp
                miniIcons={data.byPlatform.map((p) => ({
                  emoji: p.emoji,
                  color: p.color,
                }))}
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <StatCard
                title="Avg Conversion Rate"
                value={formatPercent(data.summary.avgConversionRate, 2)}
                icon={Percent}
                change="+0.4pp"
                changeUp
                miniIcons={data.byPlatform.map((p) => ({
                  emoji: p.emoji,
                  color: p.color,
                }))}
              />
            </motion.div>
          </motion.div>

          {/* Pie breakdown + Trend chart */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Pie chart */}
            <motion.div {...fadeIn} className="lg:col-span-1">
              <Card className="card-hover h-full">
                <CardHeader>
                  <CardTitle className="text-base">
                    Platform Breakdown
                  </CardTitle>
                  <CardDescription>
                    Earnings distribution across platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.breakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {data.breakdown.map((entry) => (
                            <Cell key={entry.platform} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.breakdown.map((b) => (
                      <div
                        key={b.platform}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: b.color }}
                          />
                          {b.name}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">
                            {formatCompactRM(b.value)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatPercent(b.share, 1)}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trend chart */}
            <motion.div {...fadeIn} className="lg:col-span-2">
              <Card className="card-hover h-full">
                <CardHeader>
                  <CardTitle className="text-base">
                    Cross-Platform Earnings Trend
                  </CardTitle>
                  <CardDescription>
                    Monthly earnings by platform with combined total (12 months)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
                        margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
                      >
                        <defs>
                          <linearGradient id="totalArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-chart-5)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-chart-5)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          tickFormatter={(v: number) => formatCompactRM(v)}
                          width={70}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                          iconType="circle"
                        />
                        <Line
                          type="monotone"
                          dataKey="shopee"
                          stroke={data.byPlatform.find((p) => p.platform === 'shopee')?.color}
                          strokeWidth={2}
                          dot={false}
                          name="Shopee"
                        />
                        <Line
                          type="monotone"
                          dataKey="tiktok"
                          stroke={data.byPlatform.find((p) => p.platform === 'tiktok')?.color}
                          strokeWidth={2}
                          dot={false}
                          name="TikTok"
                        />
                        <Line
                          type="monotone"
                          dataKey="lazada"
                          stroke={data.byPlatform.find((p) => p.platform === 'lazada')?.color}
                          strokeWidth={2}
                          dot={false}
                          name="Lazada"
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="var(--color-chart-5)"
                          strokeWidth={2.5}
                          strokeDasharray="5 4"
                          dot={false}
                          name="Total"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Total area chart */}
          <motion.div {...fadeIn}>
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-base">
                  Combined Monthly Earnings
                </CardTitle>
                <CardDescription>
                  Total affiliate earnings across all platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
                    >
                      <defs>
                        <linearGradient id="totalAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-chart-5)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--color-chart-5)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        tickFormatter={(v: number) => formatCompactRM(v)}
                        width={70}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="var(--color-chart-5)"
                        strokeWidth={2}
                        fill="url(#totalAreaFill)"
                        name="Total"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Platform-specific cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {data.byPlatform.map((p) => (
              <motion.div key={p.platform} variants={fadeIn}>
                <PlatformCard
                  platform={p}
                  sparkData={sparkDataMap[p.platform] ?? []}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Comparison table */}
          <motion.div {...fadeIn}>
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="size-4" />
                  Platform Comparison
                </CardTitle>
                <CardDescription>
                  Side-by-side performance metrics for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platform</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Conversions</TableHead>
                        <TableHead className="text-right">Conv. Rate</TableHead>
                        <TableHead className="text-right">Earnings</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                        <TableHead className="text-right">MoM Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.byPlatform.map((p) => {
                        const breakdown = data.breakdown.find(
                          (b) => b.platform === p.platform,
                        )
                        const up = p.momChange >= 0
                        return (
                          <TableRow key={p.platform}>
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-2">
                                <span
                                  className="flex size-7 items-center justify-center rounded-full text-sm"
                                  style={{ backgroundColor: `${p.color}20` }}
                                >
                                  {p.emoji}
                                </span>
                                {p.platformName}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(p.clicks)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(p.conversions)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPercent(p.conversionRate, 1)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatRM(p.earnings)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">
                                {formatPercent(breakdown?.share ?? 0, 1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium ${
                                  up ? 'text-emerald-500' : 'text-red-500'
                                }`}
                              >
                                {up ? (
                                  <TrendingUp className="size-3" />
                                ) : (
                                  <ArrowDownRight className="size-3" />
                                )}
                                {formatPercent(Math.abs(p.momChange), 1)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {/* Totals row */}
                      <TableRow className="border-t-2 font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(data.summary.totalClicks)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(data.summary.totalConversions)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercent(data.summary.avgConversionRate, 2)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                          {formatRM(data.summary.totalEarnings)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge>100.0%</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          —
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer note */}
          <motion.div {...fadeIn} className="text-center">
            <p className="text-muted-foreground text-xs">
              Showing {data.period === '12m' ? '12 months' : data.period === '90d' ? '90 days' : '30 days'} of data ·
              Source: {data.source === 'mock' ? 'Sample data' : 'Live API'} ·
              Currency: RM (Malaysian Ringgit)
            </p>
          </motion.div>
        </>
      )}
    </div>
  )
}
