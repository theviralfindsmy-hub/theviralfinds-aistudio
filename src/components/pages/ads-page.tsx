'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Eye,
  MousePointerClick,
  Target,
  BarChart3,
  Zap,
  Lightbulb,
  Play,
  Pause,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
} from 'lucide-react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ─── Count-Up Animation Hook ─────────────────────────────────────────────────

function useCountUp(end: number, duration = 1200, startOnView = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!startOnView || !inView) return
    let startTime: number | null = null
    let rafId: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * end * 100) / 100)
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [end, duration, startOnView, inView])

  return { count, ref }
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const overviewStats = [
  { key: 'spend', label: 'Total Ad Spend', value: 12480.5, prefix: 'RM ', icon: DollarSign, trend: 'up' as const, trendLabel: '+12.4%', color: 'text-cyan-500 dark:text-cyan-400' },
  { key: 'revenue', label: 'Total Revenue from Ads', value: 62402.5, prefix: 'RM ', icon: TrendingUp, trend: 'up' as const, trendLabel: '+23.1%', color: 'text-emerald-500 dark:text-emerald-400' },
  { key: 'roas', label: 'Average ROAS', value: 5.0, prefix: '', suffix: 'x', icon: Target, trend: 'up' as const, trendLabel: '+8.7%', color: 'text-lime-500 dark:text-lime-400' },
  { key: 'impressions', label: 'Total Impressions', value: 1245800, prefix: '', icon: Eye, trend: 'up' as const, trendLabel: '+15.3%', color: 'text-violet-500 dark:text-violet-400' },
]

const campaignChartData = [
  { day: 'Mon', spend: 1450, revenue: 8200, roas: 5.7 },
  { day: 'Tue', spend: 1680, revenue: 9100, roas: 5.4 },
  { day: 'Wed', spend: 1320, revenue: 7800, roas: 5.9 },
  { day: 'Thu', spend: 1890, revenue: 11500, roas: 6.1 },
  { day: 'Fri', spend: 2100, revenue: 12800, roas: 6.1 },
  { day: 'Sat', spend: 2450, revenue: 14200, roas: 5.8 },
  { day: 'Sun', spend: 1590, revenue: 8800, roas: 5.5 },
]

type CampaignType = 'CPC' | 'GMS'
type CampaignStatus = 'Active' | 'Paused' | 'Ended'

interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  dailyBudget: number
  totalSpent: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  roas: number
}

const mockCampaigns: Campaign[] = [
  { id: '1', name: '11.11 Mega Sale Boost', type: 'CPC', status: 'Active', dailyBudget: 500, totalSpent: 3250, impressions: 245000, clicks: 12250, ctr: 5.0, conversions: 612, roas: 5.8 },
  { id: '2', name: 'Raya Collection 2025', type: 'GMS', status: 'Active', dailyBudget: 300, totalSpent: 1800, impressions: 198000, clicks: 9900, ctr: 5.0, conversions: 495, roas: 6.2 },
  { id: '3', name: 'Tech Week Gadgets', type: 'CPC', status: 'Paused', dailyBudget: 200, totalSpent: 850, impressions: 87000, clicks: 3480, ctr: 4.0, conversions: 139, roas: 4.5 },
  { id: '4', name: 'Beauty Essentials Flash', type: 'GMS', status: 'Active', dailyBudget: 400, totalSpent: 2400, impressions: 312000, clicks: 15600, ctr: 5.0, conversions: 780, roas: 5.1 },
  { id: '5', name: 'Back to School Promo', type: 'CPC', status: 'Ended', dailyBudget: 150, totalSpent: 1050, impressions: 68000, clicks: 2720, ctr: 4.0, conversions: 109, roas: 3.8 },
  { id: '6', name: 'Home & Living Deals', type: 'GMS', status: 'Active', dailyBudget: 350, totalSpent: 2100, impressions: 176000, clicks: 8800, ctr: 5.0, conversions: 440, roas: 5.5 },
  { id: '7', name: 'Fashion Week Clearance', type: 'CPC', status: 'Paused', dailyBudget: 250, totalSpent: 750, impressions: 54000, clicks: 2160, ctr: 4.0, conversions: 86, roas: 3.2 },
  { id: '8', name: 'Sports & Outdoors Push', type: 'GMS', status: 'Active', dailyBudget: 280, totalSpent: 1680, impressions: 145000, clicks: 7250, ctr: 5.0, conversions: 363, roas: 4.9 },
]

interface KeywordData {
  keyword: string
  qualityScore: number
  searchVolume: number
  suggestedBid: number
  currentBid: number
  impressions: number
  clicks: number
}

const mockKeywords: KeywordData[] = [
  { keyword: 'wireless earbuds', qualityScore: 9, searchVolume: 24500, suggestedBid: 1.85, currentBid: 1.50, impressions: 34200, clicks: 1710 },
  { keyword: 'phone case cute', qualityScore: 8, searchVolume: 31200, suggestedBid: 1.20, currentBid: 1.00, impressions: 41500, clicks: 2075 },
  { keyword: 'skincare set', qualityScore: 7, searchVolume: 18700, suggestedBid: 2.10, currentBid: 1.80, impressions: 22300, clicks: 1115 },
  { keyword: 'laptop gaming', qualityScore: 9, searchVolume: 15800, suggestedBid: 3.50, currentBid: 3.20, impressions: 18900, clicks: 945 },
  { keyword: 'baju kurung moden', qualityScore: 8, searchVolume: 22100, suggestedBid: 0.95, currentBid: 0.80, impressions: 28700, clicks: 1435 },
  { keyword: 'kasut running', qualityScore: 6, searchVolume: 14300, suggestedBid: 1.65, currentBid: 1.40, impressions: 16800, clicks: 672 },
  { keyword: 'mouse wireless', qualityScore: 7, searchVolume: 19600, suggestedBid: 1.30, currentBid: 1.10, impressions: 23400, clicks: 1170 },
  { keyword: 'tudung bawal', qualityScore: 8, searchVolume: 28900, suggestedBid: 0.75, currentBid: 0.65, impressions: 35200, clicks: 1760 },
  { keyword: 'fan portable', qualityScore: 5, searchVolume: 9800, suggestedBid: 1.45, currentBid: 1.20, impressions: 11400, clicks: 342 },
  { keyword: 'kopi susu', qualityScore: 6, searchVolume: 12400, suggestedBid: 0.60, currentBid: 0.50, impressions: 14800, clicks: 592 },
]

interface BudgetRec {
  campaignId: string
  campaignName: string
  currentBudget: number
  recommendedBudget: number
  reason: string
  potentialRoas: number
}

const mockBudgetRecs: BudgetRec[] = [
  { campaignId: '1', campaignName: '11.11 Mega Sale Boost', currentBudget: 500, recommendedBudget: 680, reason: 'High ROAS with room to scale — increase budget to capture peak traffic', potentialRoas: 6.4 },
  { campaignId: '2', campaignName: 'Raya Collection 2025', currentBudget: 300, recommendedBudget: 420, reason: 'Consistent performance — seasonal demand expected to rise 40%', potentialRoas: 6.8 },
  { campaignId: '4', campaignName: 'Beauty Essentials Flash', currentBudget: 400, recommendedBudget: 550, reason: 'Strong conversion rate — scaling budget could yield 37% more conversions', potentialRoas: 5.8 },
  { campaignId: '6', campaignName: 'Home & Living Deals', currentBudget: 350, recommendedBudget: 310, reason: 'ROAS declining — reduce budget and reallocate to top performers', potentialRoas: 5.2 },
  { campaignId: '8', campaignName: 'Sports & Outdoors Push', currentBudget: 280, recommendedBudget: 380, reason: 'Underspent daily — increasing budget matches rising search volume', potentialRoas: 5.5 },
]

const adTypeCards = [
  {
    title: 'CPC Ads',
    subtitle: 'Pay Per Click',
    description: 'Best for driving targeted traffic to your listings. You only pay when shoppers click your ad, giving you full control over cost.',
    icon: MousePointerClick,
    features: ['Keyword targeting', 'Bid control', 'Real-time optimization'],
    accent: 'border-cyan-500 dark:border-cyan-400',
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    iconColor: 'text-cyan-500 dark:text-cyan-400',
  },
  {
    title: 'GMS Ads',
    subtitle: 'Shopee-Managed',
    description: 'Best for conversions. Shopee\'s algorithm auto-optimizes your ads for maximum orders with minimal effort.',
    icon: Zap,
    features: ['Auto-optimization', 'Smart bidding', 'Broad reach'],
    accent: 'border-lime-500 dark:border-lime-400',
    iconBg: 'bg-lime-500/10 dark:bg-lime-400/10',
    iconColor: 'text-lime-600 dark:text-lime-400',
  },
  {
    title: 'Product Discovery',
    subtitle: 'New Launches',
    description: 'Best for new product launches. Get your new listings discovered by shoppers browsing similar categories.',
    icon: Lightbulb,
    features: ['Category placement', 'Discovery feed', 'New item boost'],
    accent: 'border-violet-500 dark:border-violet-400',
    iconBg: 'bg-violet-500/10 dark:bg-violet-400/10',
    iconColor: 'text-violet-500 dark:text-violet-400',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toFixed(n % 1 === 0 ? 0 : 2)
}

function formatCurrency(n: number): string {
  return `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusColor(status: CampaignStatus) {
  switch (status) {
    case 'Active': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
    case 'Paused': return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
    case 'Ended': return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
  }
}

function typeColor(type: CampaignType) {
  switch (type) {
    case 'CPC': return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'
    case 'GMS': return 'bg-lime-500/15 text-lime-700 dark:text-lime-400 border-lime-500/30'
  }
}

function qualityScoreColor(score: number) {
  if (score >= 8) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 6) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

// ─── Stagger Container ────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const tableRowVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
}

// ─── Overview Card Component ──────────────────────────────────────────────────

function OverviewCard({ stat, index }: { stat: typeof overviewStats[number]; index: number }) {
  const isRoas = stat.key === 'roas'
  const isImpressions = stat.key === 'impressions'
  const rawEnd = stat.value
  const { count, ref } = useCountUp(rawEnd, 1400)

  const displayValue = isImpressions
    ? formatNumber(count)
    : isRoas
      ? `${count.toFixed(1)}${stat.suffix ?? ''}`
      : `${stat.prefix}${count.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card
        className={cn(
          'border-2 border-foreground/10 rounded-none',
          'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)]',
          'hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.2)]',
          'transition-shadow duration-200',
          'bg-card'
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className={cn('p-2.5 border-2 border-foreground/10 rounded-none', stat.key === 'roas' ? 'bg-lime-500/10' : stat.key === 'spend' ? 'bg-cyan-500/10' : stat.key === 'revenue' ? 'bg-emerald-500/10' : 'bg-violet-500/10')}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <span className={cn(
              'text-xs font-bold flex items-center gap-0.5',
              stat.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            )}>
              {stat.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {stat.trendLabel}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-black text-foreground tracking-tight">
            <span ref={ref}>{displayValue}</span>
          </p>
          <p className="text-sm text-muted-foreground font-medium mt-1">{stat.label}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Campaign Performance Chart ───────────────────────────────────────────────

function CampaignChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className={cn(
        'border-2 border-foreground/10 rounded-none',
        'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)]',
        'hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.2)]',
        'transition-shadow duration-200'
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 border-2 border-foreground/10 rounded-none bg-cyan-500/10">
                <BarChart3 className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              </div>
              <CardTitle className="text-base font-bold">Campaign Performance</CardTitle>
            </div>
            <Badge variant="outline" className="rounded-none border-2 border-lime-500/40 text-lime-600 dark:text-lime-400 text-[10px]">
              7 DAYS
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={campaignChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  domain={[0, 8]}
                  tickFormatter={(v: number) => `${v}x`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '2px solid hsl(var(--border))',
                    borderRadius: 0,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Ad Spend') return [`RM ${value.toLocaleString()}`, name]
                    if (name === 'Revenue') return [`RM ${value.toLocaleString()}`, name]
                    if (name === 'ROAS') return [`${value}x`, name]
                    return [value, name]
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }}
                />
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                >
                  <Bar
                    yAxisId="right"
                    dataKey="roas"
                    name="ROAS"
                    fill="hsl(84, 80%, 55%)"
                    fillOpacity={0.25}
                    stroke="hsl(84, 80%, 55%)"
                    strokeWidth={1}
                    barSize={32}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    name="Ad Spend"
                    stroke="hsl(195, 100%, 45%)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(195, 100%, 45%)', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="hsl(160, 84%, 39%)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(160, 84%, 39%)', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </motion.g>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Campaign Management Table ────────────────────────────────────────────────

function CampaignTable() {
  const [campaigns, setCampaigns] = useState(mockCampaigns)
  const [filter, setFilter] = useState<'all' | 'Active' | 'Paused' | 'Ended'>('all')

  const toggleStatus = (id: string) => {
    setCampaigns(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: c.status === 'Active' ? 'Paused' : c.status === 'Paused' ? 'Active' : c.status }
          : c
      )
    )
  }

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className={cn(
        'border-2 border-foreground/10 rounded-none',
        'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)]',
        'hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.2)]',
        'transition-shadow duration-200'
      )}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 border-2 border-foreground/10 rounded-none bg-emerald-500/10">
                <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-base font-bold">Campaign Management</CardTitle>
            </div>
            <div className="flex gap-1">
              {(['all', 'Active', 'Paused', 'Ended'] as const).map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'rounded-none border-2 text-xs font-bold h-7 px-3',
                    filter === f
                      ? 'bg-foreground text-background hover:bg-foreground/90'
                      : 'border-foreground/15 hover:border-foreground/30'
                  )}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-y-2 border-foreground/10 hover:bg-transparent">
                  <TableHead className="text-xs font-bold">Campaign</TableHead>
                  <TableHead className="text-xs font-bold">Type</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold text-right">Daily Budget</TableHead>
                  <TableHead className="text-xs font-bold text-right">Total Spent</TableHead>
                  <TableHead className="text-xs font-bold text-right">Impressions</TableHead>
                  <TableHead className="text-xs font-bold text-right">Clicks</TableHead>
                  <TableHead className="text-xs font-bold text-right">CTR</TableHead>
                  <TableHead className="text-xs font-bold text-right">Conv.</TableHead>
                  <TableHead className="text-xs font-bold text-right">ROAS</TableHead>
                  <TableHead className="text-xs font-bold text-center">Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((campaign, i) => (
                    <motion.tr
                      key={campaign.id}
                      variants={tableRowVariant}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-foreground/5 hover:bg-muted/30"
                    >
                      <TableCell className="font-semibold text-sm max-w-[180px] truncate">
                        {campaign.name}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('rounded-none border text-[10px] font-bold px-1.5', typeColor(campaign.type))}>
                          {campaign.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('rounded-none border text-[10px] font-bold px-1.5', statusColor(campaign.status))}>
                          {campaign.status === 'Active' && <Play className="w-2.5 h-2.5 mr-0.5" />}
                          {campaign.status === 'Paused' && <Pause className="w-2.5 h-2.5 mr-0.5" />}
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(campaign.dailyBudget)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(campaign.totalSpent)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(campaign.impressions)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(campaign.clicks)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {campaign.ctr.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {campaign.conversions}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        <span className={campaign.roas >= 5 ? 'text-emerald-600 dark:text-emerald-400' : campaign.roas >= 4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}>
                          {campaign.roas.toFixed(1)}x
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={campaign.status === 'Active'}
                          disabled={campaign.status === 'Ended'}
                          onCheckedChange={() => toggleStatus(campaign.id)}
                          className={cn(
                            'data-[state=checked]:bg-emerald-500',
                            campaign.status === 'Ended' && 'opacity-40'
                          )}
                        />
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Keyword Performance Panel ────────────────────────────────────────────────

function KeywordPanel() {
  const [sortBy, setSortBy] = useState<'qualityScore' | 'searchVolume' | 'suggestedBid'>('qualityScore')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const sorted = [...mockKeywords].sort((a, b) => {
    const diff = a[sortBy] - b[sortBy]
    return sortDir === 'desc' ? -diff : diff
  })

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className={cn(
        'border-2 border-foreground/10 rounded-none',
        'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)]',
        'hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.2)]',
        'transition-shadow duration-200'
      )}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 border-2 border-foreground/10 rounded-none bg-amber-500/10">
                <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-base font-bold">Keyword Performance</CardTitle>
            </div>
            <div className="flex gap-1 text-xs">
              {[
                { key: 'qualityScore' as const, label: 'Quality' },
                { key: 'searchVolume' as const, label: 'Volume' },
                { key: 'suggestedBid' as const, label: 'Bid' },
              ].map(s => (
                <Button
                  key={s.key}
                  variant={sortBy === s.key ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'rounded-none border-2 text-xs font-bold h-7 px-2.5',
                    sortBy === s.key
                      ? 'bg-foreground text-background hover:bg-foreground/90'
                      : 'border-foreground/15 hover:border-foreground/30'
                  )}
                  onClick={() => handleSort(s.key)}
                >
                  {s.label}
                  {sortBy === s.key && (
                    <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[380px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-y-2 border-foreground/10 hover:bg-transparent">
                  <TableHead className="text-xs font-bold">Keyword</TableHead>
                  <TableHead className="text-xs font-bold text-center">Q. Score</TableHead>
                  <TableHead className="text-xs font-bold text-right">Search Vol.</TableHead>
                  <TableHead className="text-xs font-bold text-right">Suggest. Bid</TableHead>
                  <TableHead className="text-xs font-bold text-right">Current Bid</TableHead>
                  <TableHead className="text-xs font-bold text-right">Impressions</TableHead>
                  <TableHead className="text-xs font-bold text-right">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((kw, i) => (
                  <motion.tr
                    key={kw.keyword}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="border-b border-foreground/5 hover:bg-muted/30"
                  >
                    <TableCell className="font-semibold text-sm">
                      {kw.keyword}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn('text-sm font-black', qualityScoreColor(kw.qualityScore))}>
                        {kw.qualityScore}
                      </span>
                      <span className="text-muted-foreground text-[10px]">/10</span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(kw.searchVolume)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-cyan-600 dark:text-cyan-400">
                      RM {kw.suggestedBid.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      RM {kw.currentBid.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(kw.impressions)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(kw.clicks)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Budget Recommendations ───────────────────────────────────────────────────

function BudgetRecommendations() {
  const [applied, setApplied] = useState<Record<string, boolean>>({})

  const handleApply = (id: string) => {
    setApplied(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setApplied(prev => ({ ...prev, [id]: false }))
    }, 2500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className={cn(
        'border-2 border-foreground/10 rounded-none',
        'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)]',
        'hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.2)]',
        'transition-shadow duration-200'
      )}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="p-2 border-2 border-lime-500/30 rounded-none bg-lime-500/10"
            >
              <Lightbulb className="w-4 h-4 text-lime-600 dark:text-lime-400" />
            </motion.div>
            <CardTitle className="text-base font-bold">Budget Recommendations</CardTitle>
            <Badge className="rounded-none border-2 border-lime-500/40 bg-lime-500/10 text-lime-600 dark:text-lime-400 text-[10px] font-bold">
              AI-POWERED
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockBudgetRecs.map((rec, i) => {
            const budgetDiff = rec.recommendedBudget - rec.currentBudget
            const isIncrease = budgetDiff > 0
            const progressPercent = Math.min((rec.recommendedBudget / (rec.currentBudget * 1.5)) * 100, 100)

            return (
              <motion.div
                key={rec.campaignId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
                className="border-2 border-foreground/8 rounded-none p-4 hover:border-foreground/15 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="font-bold text-sm text-foreground truncate">{rec.campaignName}</h4>
                      <Badge className={cn(
                        'rounded-none border text-[10px] font-bold px-1.5',
                        isIncrease
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      )}>
                        {isIncrease ? 'SCALE UP' : 'REDUCE'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{rec.reason}</p>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Current</p>
                        <p className="text-lg font-black text-foreground">{formatCurrency(rec.currentBudget)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Recommended</p>
                        <p className={cn(
                          'text-lg font-black',
                          isIncrease ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        )}>
                          {formatCurrency(rec.recommendedBudget)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Progress
                        value={progressPercent}
                        className={cn(
                          'h-2 rounded-none',
                          isIncrease
                            ? '[&>[data-slot=progress-indicator]]:bg-emerald-500'
                            : '[&>[data-slot=progress-indicator]]:bg-amber-500'
                        )}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                        {isIncrease ? '+' : ''}{budgetDiff} RM/day
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-lime-500" />
                      <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
                        Potential ROAS: {rec.potentialRoas}x
                      </span>
                    </div>
                  </div>

                  <div className="sm:ml-4 flex-shrink-0">
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="sm"
                        className={cn(
                          'rounded-none border-2 font-bold text-xs h-8 px-4',
                          applied[rec.campaignId]
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : isIncrease
                              ? 'bg-lime-500 hover:bg-lime-600 text-black border-lime-600'
                              : 'bg-amber-500 hover:bg-amber-600 text-black border-amber-600'
                        )}
                        onClick={() => handleApply(rec.campaignId)}
                        disabled={applied[rec.campaignId]}
                      >
                        {applied[rec.campaignId] ? '✓ Applied' : 'Apply'}
                      </Button>
                    </motion.div>
                  </div>
                </div>
                {i < mockBudgetRecs.length - 1 && <Separator className="mt-4" />}
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Ad Types Info Cards ──────────────────────────────────────────────────────

function AdTypesCards() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {adTypeCards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
          whileHover={{ y: -6, transition: { duration: 0.2 } }}
        >
          <Card className={cn(
            'border-2 rounded-none h-full',
            card.accent,
            'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)]',
            'hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.2)]',
            'transition-shadow duration-200'
          )}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 border-2 border-foreground/10 rounded-none', card.iconBg)}>
                  <card.icon className={cn('w-5 h-5', card.iconColor)} />
                </div>
                <div>
                  <CardTitle className="text-base font-black">{card.title}</CardTitle>
                  <p className="text-xs text-muted-foreground font-medium">{card.subtitle}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              <Separator />
              <div className="flex flex-wrap gap-1.5">
                {card.features.map(f => (
                  <Badge
                    key={f}
                    variant="outline"
                    className={cn('rounded-none border text-[10px] font-bold', card.accent, card.iconColor)}
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Main Ads Page ────────────────────────────────────────────────────────────

export function AdsPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 border-2 border-foreground/10 rounded-none bg-cyan-500/10">
            <BarChart3 className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-foreground">Shopee Ads Dashboard</h2>
              <Badge className="rounded-none border-2 border-lime-500/40 bg-lime-500/10 text-lime-600 dark:text-lime-400 text-[10px] font-bold">
                BETA
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage CPC & GMS campaigns, optimize keywords, and track ad performance
            </p>
          </div>
        </div>
      </motion.div>

      {/* Section 1: Ads Overview Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {overviewStats.map((stat, i) => (
          <OverviewCard key={stat.key} stat={stat} index={i} />
        ))}
      </motion.div>

      {/* Section 2: Campaign Performance Chart */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList className="rounded-none border-2 border-foreground/10 bg-muted/50">
          <TabsTrigger value="chart" className="rounded-none text-xs font-bold data-[state=active]:bg-foreground data-[state=active]:text-background">
            Performance
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-none text-xs font-bold data-[state=active]:bg-foreground data-[state=active]:text-background">
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="keywords" className="rounded-none text-xs font-bold data-[state=active]:bg-foreground data-[state=active]:text-background">
            Keywords
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <CampaignChart />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignTable />
        </TabsContent>

        <TabsContent value="keywords">
          <KeywordPanel />
        </TabsContent>
      </Tabs>

      {/* Section 5: Budget Recommendations */}
      <BudgetRecommendations />

      {/* Section 6: Ad Types Info Cards */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex items-center gap-2 mb-4"
        >
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Ad Types</h3>
          <Separator className="flex-1" />
        </motion.div>
        <AdTypesCards />
      </div>
    </div>
  )
}
