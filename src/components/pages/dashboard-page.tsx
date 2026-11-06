'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Percent,
  Plus,
  BarChart3,
  Megaphone,
  Link2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ShoppingBag,
  Eye,
  Inbox,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { QUERY_STALE_TIME } from '@/lib/query-config'
import { EarningStreaks } from '@/components/dashboard/earning-streaks'
import { AchievementBadges } from '@/components/dashboard/achievement-badges'
import { LiveEarningsTicker } from '@/components/dashboard/live-earnings-ticker'
import { useAppStore } from '@/store/app-store'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  conversionRate: number
  activeLinks: number
  totalLinks: number
  activeCampaigns: number
  totalCampaigns: number
}

interface DashboardTrends {
  clicks: number
  conversions: number
  earnings: number
  conversionRate: number
}

interface ClickActivity {
  id: string
  type: 'click'
  linkName: string
  shortCode: string
  country: string | null
  device: string | null
  timestamp: string
}

interface ConversionActivity {
  id: string
  type: 'conversion'
  linkName: string
  shortCode: string
  amount: number
  commission: number
  status: string
  timestamp: string
}

type ActivityItem = ClickActivity | ConversionActivity

interface TopProduct {
  id: string
  productName: string | null
  productImage: string | null
  productPrice: number | null
  commission: number | null
  clicks: number
  conversions: number
  earnings: number
  rate: number
}

interface ChartDataPoint {
  date: string
  name: string
  value: number
}

interface ClicksChartDataPoint {
  date: string
  name: string
  clicks: number
}

interface DashboardData {
  stats: DashboardStats
  trends: DashboardTrends
  recentActivity: ActivityItem[]
  topProducts: TopProduct[]
  earningsChart: ChartDataPoint[]
  clicksChart: ClicksChartDataPoint[]
}

// ─── API Fetch Hook ──────────────────────────────────────────────────────────

function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.dashboard,
  })
}

// ─── Quick Actions (static) ──────────────────────────────────────────────────

const quickActions = [
  { label: 'Create Link', icon: Link2, color: 'bg-shopee/10 text-shopee' },
  { label: 'New Campaign', icon: Megaphone, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { label: 'View Analytics', icon: BarChart3, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  { label: 'Quick Boost', icon: Zap, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return num.toLocaleString()
  return num.toString()
}

function formatCurrency(num: number): string {
  return `RM ${num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function WelcomeBanner({ stats }: { stats: DashboardStats }) {
  const user = useAppStore((s) => s.user)
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const hour = now.getHours()
  let greeting = 'Good Morning'
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon'
  if (hour >= 17) greeting = 'Good Evening'

  const displayName = user?.name || 'there'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="card-hover border-shopee/20 bg-gradient-to-r from-shopee/5 via-shopee/10 to-transparent overflow-hidden">
        <CardContent className="flex items-center gap-4 py-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-shopee/15 animate-float">
            <LayoutDashboard className="h-6 w-6 text-shopee" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              {greeting}, {displayName}! 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Eye className="mr-1 h-3 w-3" />
                {formatNumber(stats.totalClicks)} total views
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <ShoppingBag className="mr-1 h-3 w-3" />
                {formatNumber(stats.totalConversions)} total orders
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function WelcomeBannerSkeleton() {
  return (
    <Card className="border-shopee/20">
      <CardContent className="flex items-center gap-4 py-2">
        <Skeleton className="h-12 w-12 rounded-xl animate-float" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardItem {
  title: string
  value: string
  trend: number
  trendUp: boolean
  icon: React.ElementType
  color: string
}

function StatCard({ stat, index }: { stat: StatCardItem; index: number }) {
  const Icon = stat.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardDescription className="text-sm font-medium">
            {stat.title}
          </CardDescription>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', stat.color)}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stat.value}</div>
          <div className="flex items-center gap-1 mt-1">
            {stat.trendUp ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                stat.trendUp ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {Math.abs(stat.trend)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last week</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-3 w-36" />
      </CardContent>
    </Card>
  )
}

function EarningsChart({ data }: { data: ChartDataPoint[] }) {
  const hasData = data.some(d => d.value > 0)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Earnings Overview</CardTitle>
          <CardDescription>Last 30 days performance</CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--shopee)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--shopee)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `RM${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`RM ${value.toFixed(2)}`, 'Earnings']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--shopee)"
                  strokeWidth={2}
                  fill="url(#earningsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState message="No earnings data yet" hint="Conversions will appear here once you start earning commissions" />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ClicksChart({ data }: { data: ClicksChartDataPoint[] }) {
  const hasData = data.some(d => d.clicks > 0)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Clicks Overview</CardTitle>
          <CardDescription>Last 30 days click data</CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [value, 'Clicks']}
                />
                <Bar
                  dataKey="clicks"
                  fill="var(--shopee)"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState message="No clicks data yet" hint="Click data will appear here once your affiliate links are visited" />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function EmptyChartState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[250px] text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
        <BarChart3 className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-1 max-w-[260px]">{hint}</p>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36 mb-1" />
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

function TopProducts({ products }: { products: TopProduct[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Top Products</CardTitle>
          <CardDescription>Best performing affiliate products</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-shopee/10 text-shopee text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.productName || 'Unnamed Product'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <MousePointer className="h-3 w-3" />
                        {product.clicks.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ShoppingCart className="h-3 w-3" />
                        {product.conversions}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Percent className="h-3 w-3" />
                        {product.rate}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-shopee">
                      RM {product.earnings.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyListState
              message="No top products yet"
              hint="Create your first affiliate link to see top performing products here"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TopProductsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28 mb-1" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentActivityList({ activities }: { activities: ActivityItem[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    conversion: <ShoppingCart className="h-3.5 w-3.5 text-emerald-500" />,
    click: <MousePointer className="h-3.5 w-3.5 text-shopee" />,
  }

  const colorMap: Record<string, string> = {
    conversion: 'bg-emerald-500/10 border-emerald-500/20',
    click: 'bg-shopee/10 border-shopee/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest affiliate events</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
                >
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border mt-0.5',
                      colorMap[activity.type] || 'bg-muted border-border'
                    )}
                  >
                    {iconMap[activity.type] || <Activity className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      {activity.type === 'conversion'
                        ? `Conversion from ${activity.linkName}`
                        : `Click on ${activity.linkName}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</span>
                      {activity.type === 'conversion' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          RM {activity.commission.toFixed(2)}
                        </Badge>
                      )}
                      {activity.type === 'click' && activity.device && (
                        <span className="text-[10px] text-muted-foreground">{activity.device}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyListState
              message="No recent activity"
              hint="Activity will appear here when users click on your affiliate links"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function EmptyListState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
        <Inbox className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-1 max-w-[260px]">{hint}</p>
    </div>
  )
}

function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common tasks at your fingertips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 hover:scale-[1.02] transition-transform"
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', action.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function QuickActionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28 mb-1" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PerformanceScore({ stats }: { stats: DashboardStats }) {
  // Calculate performance score based on real data
  const clickRate = stats.totalLinks > 0 ? Math.min((stats.activeLinks / stats.totalLinks) * 100, 100) : 0
  const convRateScore = Math.min(stats.conversionRate * 10, 100) // Scale: 10% conv rate = 100 score
  const earningsScore = stats.totalEarnings > 0 ? Math.min(50 + Math.log10(stats.totalEarnings + 1) * 20, 100) : 0

  const score = Math.round((clickRate * 0.3 + convRateScore * 0.4 + earningsScore * 0.3))
  const hasData = stats.totalLinks > 0 || stats.totalClicks > 0

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Average'
    return 'Needs Work'
  }

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500'
    if (s >= 60) return 'text-shopee'
    if (s >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-base">Performance Score</CardTitle>
            <CardDescription>Overall affiliate health</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyListState
              message="No performance data"
              hint="Create affiliate links and generate clicks to see your performance score"
            />
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Performance Score</CardTitle>
          <CardDescription>Overall affiliate health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-36 w-36">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="var(--shopee)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{score}</span>
                <span className="text-xs text-muted-foreground">out of 100</span>
              </div>
            </div>
            <div className="text-center">
              <Badge
                variant="secondary"
                className={cn('text-sm font-semibold', getScoreColor(score))}
              >
                {getScoreLabel(score)}
              </Badge>
              <div className="mt-3 w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active Links</span>
                  <span className="font-medium">{Math.round(clickRate)}%</span>
                </div>
                <Progress value={clickRate} className="h-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Conversion Rate</span>
                  <span className="font-medium">{Math.round(convRateScore)}%</span>
                </div>
                <Progress value={convRateScore} className="h-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Earnings Growth</span>
                  <span className="font-medium">{Math.round(earningsScore)}%</span>
                </div>
                <Progress value={earningsScore} className="h-1.5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PerformanceScoreSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36 mb-1" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Skeleton className="h-36 w-36 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="w-full space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardData()

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <WelcomeBannerSkeleton />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TopProductsSkeleton />
          <div className="space-y-4">
            <QuickActionsSkeleton />
            <PerformanceScoreSkeleton />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <WelcomeBannerSkeleton />
        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
              <Activity className="h-7 w-7 text-red-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Failed to load dashboard data</p>
            <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { stats, trends, recentActivity, topProducts, earningsChart, clicksChart } = data

  // Build stat cards from real data
  const statCards: StatCardItem[] = [
    {
      title: 'Total Clicks',
      value: formatNumber(stats.totalClicks),
      trend: trends.clicks,
      trendUp: trends.clicks >= 0,
      icon: MousePointer,
      color: 'bg-shopee/10 text-shopee',
    },
    {
      title: 'Total Conversions',
      value: formatNumber(stats.totalConversions),
      trend: trends.conversions,
      trendUp: trends.conversions >= 0,
      icon: ShoppingCart,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(stats.totalEarnings),
      trend: trends.earnings,
      trendUp: trends.earnings >= 0,
      icon: DollarSign,
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(2)}%`,
      trend: trends.conversionRate,
      trendUp: trends.conversionRate >= 0,
      icon: Percent,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Banner */}
      <WelcomeBanner stats={stats} />

      {/* Live Earnings Ticker */}
      <LiveEarningsTicker />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <StatCard key={stat.title} stat={stat} index={idx} />
        ))}
      </div>

      {/* Gamification Row: Earning Streaks + Achievement Badges */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EarningStreaks />
        <AchievementBadges />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EarningsChart data={earningsChart} />
        <ClicksChart data={clicksChart} />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <TopProducts products={topProducts} />

        {/* Right Column: Quick Actions + Performance */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <QuickActions />
          <PerformanceScore stats={stats} />
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <RecentActivityList activities={recentActivity} />
    </div>
  )
}

export default DashboardPage
