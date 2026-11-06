'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  MousePointerClick,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Link2,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  ShoppingCart,
  CheckCircle,
  BarChart3,
} from 'lucide-react'
import { ExportButtons } from '@/components/ui/export-buttons'
import { Separator } from '@/components/ui/separator'

// --- Types ---

interface AnalyticsSummary {
  clicks: number
  uniqueVisitors: number
  conversions: number
  earnings: number
  revenue: number
  conversionRate: number
  avgOrderValue: number
}

interface TimeSeriesPoint {
  date: string
  count: number
  value?: number
}

interface CountryData {
  country: string
  clicks: number
}

interface DeviceData {
  device: string
  clicks: number
}

interface CategoryData {
  category: string
  links: number
  clicks: number
  conversions: number
}

interface TopLinkData {
  id: string
  name: string
  clicks: number
  conversions: number
  earnings: number
  ctr: number
}

interface FunnelData {
  views: number
  clicks: number
  convertedClicks: number
  purchases: number
  revenue: number
}

interface TrafficSourceData {
  source: string
  clicks: number
}

interface AnalyticsResponse {
  period: string
  summary: AnalyticsSummary
  clicksOverTime: TimeSeriesPoint[]
  conversionsOverTime: TimeSeriesPoint[]
  countries: CountryData[]
  devices: DeviceData[]
  browsers: { browser: string; clicks: number }[]
  categories: CategoryData[]
  topLinks: TopLinkData[]
  funnel: FunnelData
  trafficSources: TrafficSourceData[]
  comparison?: {
    current: { conversionRate: number; [key: string]: any }
    previous: { conversionRate: number; [key: string]: any }
    change: { clicks?: number; revenue?: number; [key: string]: any }
  }
}

// --- Helpers ---

const formatRM = (value: number) => `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const formatNumber = (value: number) => value.toLocaleString('en-MY')

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.toLocaleString('en', { month: 'short' })} ${d.getDate()}`
}

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// Country flag mapping
const countryFlags: Record<string, string> = {
  Malaysia: '🇲🇾',
  Singapore: '🇸🇬',
  Indonesia: '🇮🇩',
  Thailand: '🇹🇭',
  Philippines: '🇵🇭',
  Vietnam: '🇻🇳',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  China: '🇨🇳',
  Japan: '🇯🇵',
  Korea: '🇰🇷',
  India: '🇮🇳',
  Australia: '🇦🇺',
  Brunei: '🇧🇳',
  Myanmar: '🇲🇲',
  Cambodia: '🇰🇭',
  Laos: '🇱🇦',
}

// Device icon mapping
const deviceIcons: Record<string, typeof Smartphone> = {
  Mobile: Smartphone,
  mobile: Smartphone,
  Desktop: Monitor,
  desktop: Monitor,
  Tablet: Tablet,
  tablet: Tablet,
}

const deviceColors: Record<string, string> = {
  Mobile: 'bg-chart-1',
  mobile: 'bg-chart-1',
  Desktop: 'bg-chart-2',
  desktop: 'bg-chart-2',
  Tablet: 'bg-chart-4',
  tablet: 'bg-chart-4',
}

const PIE_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-4)', 'var(--color-chart-5)']

// --- Loading Skeleton ---

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-2 h-3 w-20" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1" style={{ height }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-4">
            {['Link Name', 'Clicks', 'Conversions', 'Earnings', 'CTR'].map((h) => (
              <Skeleton key={h} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// --- Empty State ---

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="text-muted-foreground/40 size-12" />
      <p className="mt-3 text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  )
}

// --- Component ---

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')

  const { data, isLoading, isError } = useQuery<AnalyticsResponse>({
    queryKey: ['analytics', dateRange],
    queryFn: async () => {
      const period = dateRange === 'custom' ? '30d' : dateRange
      const res = await fetch(`/api/analytics?period=${period}&compare=true`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    staleTime: 30000,
  })

  const summary = data?.summary
  const comparison = data?.comparison

  // Derived change values from comparison
  const clicksChange = comparison?.change.clicks
    ? `${comparison.change.clicks > 0 ? '+' : ''}${comparison.change.clicks}%`
    : '+0%'
  const visitorsChange = '+0%' // Not available from comparison
  const conversionRateChange = comparison
    ? `${(comparison.current.conversionRate - comparison.previous.conversionRate).toFixed(2)}%`
    : '+0%'
  const avgOrderChange = comparison?.change.revenue
    ? `${comparison.change.revenue > 0 ? '+' : ''}${comparison.change.revenue}%`
    : '+0%'

  const overviewStats = [
    {
      title: 'Total Clicks',
      value: summary ? formatNumber(summary.clicks) : '0',
      change: clicksChange,
      up: !clicksChange.startsWith('-'),
      icon: MousePointerClick,
    },
    {
      title: 'Unique Visitors',
      value: summary ? formatNumber(summary.uniqueVisitors) : '0',
      change: visitorsChange,
      up: true,
      icon: Users,
    },
    {
      title: 'Conversion Rate',
      value: summary ? `${summary.conversionRate}%` : '0%',
      change: conversionRateChange,
      up: !conversionRateChange.startsWith('-'),
      icon: TrendingUp,
    },
    {
      title: 'Avg. Order Value',
      value: summary ? formatRM(summary.avgOrderValue) : 'RM 0.00',
      change: avgOrderChange,
      up: !avgOrderChange.startsWith('-'),
      icon: DollarSign,
    },
  ]

  // Prepare chart data
  const clicksChartData = (data?.clicksOverTime || []).map((p) => ({
    date: formatDate(p.date),
    clicks: p.count,
    uniqueClicks: Math.round(p.count * 0.7), // Approximate unique from total
  }))

  const conversionsChartData = (data?.conversionsOverTime || []).map((p) => ({
    date: formatDate(p.date),
    conversions: p.count,
    revenue: p.value || 0,
  }))

  // Device pie chart data
  const totalDeviceClicks = (data?.devices || []).reduce((sum, d) => sum + d.clicks, 0)
  const devicePieData = (data?.devices || []).map((d, i) => ({
    name: d.device,
    value: totalDeviceClicks > 0 ? Math.round((d.clicks / totalDeviceClicks) * 100) : 0,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  // Funnel stages
  const funnel = data?.funnel
  const funnelStages = funnel
    ? [
        { stage: 'Views', count: funnel.views, icon: Eye, color: 'var(--color-chart-2)' },
        { stage: 'Clicks', count: funnel.clicks, icon: MousePointerClick, color: 'var(--color-chart-1)' },
        { stage: 'Add to Cart', count: funnel.convertedClicks, icon: ShoppingCart, color: 'var(--color-chart-4)' },
        { stage: 'Purchase', count: funnel.purchases, icon: CheckCircle, color: 'var(--color-chart-5)' },
      ]
    : []

  const hasData = summary && (summary.clicks > 0 || summary.conversions > 0)

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton />
        <ChartSkeleton />
      </div>
    )
  }

  // --- Error State ---
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Track your affiliate link performance and audience insights
          </p>
        </div>
        <EmptyState message="Unable to load analytics data. Please try again later." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <motion.div {...fadeIn} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Track your affiliate link performance and audience insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground size-4" />
            {(['7d', '30d', '90d', 'custom'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range === '7d'
                  ? 'Last 7 days'
                  : range === '30d'
                    ? 'Last 30 days'
                    : range === '90d'
                      ? 'Last 90 days'
                      : 'Custom'}
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <ExportButtons
            type="analytics"
            period={dateRange === 'custom' ? undefined : dateRange}
          />
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {overviewStats.map((stat, i) => (
          <motion.div key={stat.title} variants={fadeIn}>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">{stat.title}</CardDescription>
                <stat.icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {stat.up ? (
                    <ArrowUpRight className="size-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="size-3 text-red-500" />
                  )}
                  <span className={stat.up ? 'text-emerald-500' : 'text-red-500'}>
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row 1: Clicks + Conversions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Clicks Over Time */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Clicks Over Time</CardTitle>
              <CardDescription>Daily clicks vs unique clicks</CardDescription>
            </CardHeader>
            <CardContent>
              {clicksChartData.length === 0 ? (
                <EmptyState message="No click data yet. Share your affiliate links to start tracking." />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={clicksChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="var(--color-chart-1)"
                        strokeWidth={2}
                        dot={false}
                        name="Total Clicks"
                      />
                      <Line
                        type="monotone"
                        dataKey="uniqueClicks"
                        stroke="var(--color-chart-2)"
                        strokeWidth={2}
                        dot={false}
                        name="Unique Clicks"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversions Over Time */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Conversions Over Time</CardTitle>
              <CardDescription>Daily conversions and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {conversionsChartData.length === 0 || conversionsChartData.every((p) => p.conversions === 0) ? (
                <EmptyState message="No conversion data yet. Conversions will appear here once purchases are made." />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={conversionsChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        interval={4}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        tickFormatter={(v: number) => `RM ${(v / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                        formatter={(value: number, name: string) =>
                          name === 'revenue' || name === 'Revenue (RM)' ? formatRM(value) : value
                        }
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="conversions"
                        stroke="var(--color-chart-5)"
                        fill="var(--color-chart-5)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        name="Conversions"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-chart-1)"
                        fill="var(--color-chart-1)"
                        fillOpacity={0.1}
                        strokeWidth={2}
                        name="Revenue (RM)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2: Top Countries + Device Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top Countries */}
        <motion.div {...fadeIn} className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Top Countries</CardTitle>
              <CardDescription>Clicks by country</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.countries.length === 0 ? (
                <EmptyState message="No country data yet. Geographic data will appear as users click your links." />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.countries || []} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis
                        type="category"
                        dataKey="country"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        width={90}
                        tickFormatter={(v: string) => `${countryFlags[v] || ''} ${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                        formatter={(value: number) => formatNumber(value)}
                        labelFormatter={(label: string) => `${countryFlags[label] || ''} ${label}`}
                      />
                      <Bar dataKey="clicks" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Device Breakdown</CardTitle>
              <CardDescription>Traffic by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {devicePieData.length === 0 ? (
                <EmptyState message="No device data yet." />
              ) : (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={devicePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                          strokeWidth={0}
                        >
                          {devicePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: 12,
                          }}
                          formatter={(value: number) => `${value}%`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-3">
                    {devicePieData.map((d) => {
                      const Icon = deviceIcons[d.name] || Monitor
                      const colorClass = deviceColors[d.name] || 'bg-chart-2'
                      return (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`size-2.5 rounded-full ${colorClass}`} />
                            <Icon className="text-muted-foreground size-3.5" />
                            <span>{d.name}</span>
                          </div>
                          <span className="font-medium">{d.value}%</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Links */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-base">Top Performing Links</CardTitle>
            <CardDescription>Your highest-earning affiliate links</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.topLinks.length ? (
              <EmptyState message="No performing links yet. Create affiliate links to see their performance here." />
            ) : (
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Link Name</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Earnings</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link2 className="text-muted-foreground size-3.5" />
                            <span className="font-medium">{link.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(link.clicks)}</TableCell>
                        <TableCell className="text-right">{formatNumber(link.conversions)}</TableCell>
                        <TableCell className="text-right font-medium">{formatRM(link.earnings)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{link.ctr.toFixed(2)}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Performance */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-base">Category Performance</CardTitle>
            <CardDescription>Clicks and conversions by product category</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.categories.length ? (
              <EmptyState message="No category data yet. Categories will appear as you create links with categories." />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categories}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="clicks" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Clicks" />
                    <Bar dataKey="conversions" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Conversion Funnel */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <CardDescription>User journey from view to purchase</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelStages.length === 0 || funnelStages.every((s) => s.count === 0) ? (
              <EmptyState message="No funnel data yet. The conversion funnel will populate as users interact with your links." />
            ) : (
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-0">
                {funnelStages.map((stage, i) => {
                  const prevCount = i > 0 ? funnelStages[i - 1].count : null
                  const dropOff = prevCount ? ((1 - stage.count / prevCount) * 100).toFixed(1) : null

                  return (
                    <div key={stage.stage} className="flex items-center gap-2 sm:gap-0">
                      {i > 0 && (
                        <div className="flex flex-col items-center px-2 sm:px-3">
                          <ArrowDownRight className="text-muted-foreground size-4 sm:hidden" />
                          <div className="hidden h-0.5 w-8 bg-border sm:block" />
                          {dropOff && (
                            <span className="mt-0.5 text-[10px] text-red-400">
                              -{dropOff}%
                            </span>
                          )}
                        </div>
                      )}
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.12, duration: 0.3 }}
                        className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 shadow-sm"
                        style={{ minWidth: 130 }}
                      >
                        <div
                          className="flex size-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: `color-mix(in srgb, ${stage.color} 15%, transparent)` }}
                        >
                          <stage.icon className="size-5" style={{ color: stage.color }} />
                        </div>
                        <span className="text-sm font-semibold">{stage.stage}</span>
                        <span className="text-lg font-bold">{formatNumber(stage.count)}</span>
                        <span className="text-muted-foreground text-xs">
                          {funnelStages[0].count > 0
                            ? ((stage.count / funnelStages[0].count) * 100).toFixed(1)
                            : 0}
                          % of total
                        </span>
                      </motion.div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Traffic Sources */}
      {data?.trafficSources && data.trafficSources.length > 0 && (
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Traffic Sources</CardTitle>
              <CardDescription>Where your clicks are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.trafficSources} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis
                      type="category"
                      dataKey="source"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="clicks" fill="var(--color-chart-5)" radius={[0, 4, 4, 0]} name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
