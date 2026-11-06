'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Star,
  Shield,
  Award,
  BarChart3,
  Eye,
  Zap,
  Flame,
  Crown,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ─── Animation Variants ─────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

const fadeSlideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const rowSlideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

// ─── Count-Up Hook ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, startOnView = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const hasStarted = useRef(false)

  useEffect(() => {
    if (startOnView && !inView) return
    if (hasStarted.current) return
    hasStarted.current = true

    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target * 100) / 100)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, inView, startOnView])

  return { count, ref }
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const marketOverviewStats = [
  { title: 'Total Market Products', value: 22100000, display: '22.1M', icon: ShoppingBag, change: '+3.2%', up: true, color: 'text-shopee' },
  { title: 'Active Shops', value: 32000, display: '32K', icon: Crown, change: '+8.1%', up: true, color: 'text-lime-dark dark:text-lime' },
  { title: 'Average Product Rating', value: 4.7, display: '4.7', icon: Star, change: '+0.2', up: true, color: 'text-amber-500' },
  { title: 'Market Growth Rate', value: 12.5, display: '+12.5%', icon: TrendingUp, change: '+2.1%', up: true, color: 'text-profit' },
]

const categoryData = [
  { name: 'Home & Living', count: 3840000, pct: 17.4 },
  { name: 'Beauty', count: 3210000, pct: 14.5 },
  { name: "Women's Fashion", count: 2980000, pct: 13.5 },
  { name: 'Hardware', count: 2450000, pct: 11.1 },
  { name: 'Sports', count: 2120000, pct: 9.6 },
  { name: 'Electronics', count: 1890000, pct: 8.6 },
  { name: 'Food', count: 1760000, pct: 8.0 },
  { name: 'Toys', count: 1430000, pct: 6.5 },
  { name: "Men's Fashion", count: 1280000, pct: 5.8 },
  { name: 'Pet Supplies', count: 1140000, pct: 5.2 },
]

const CHART_COLORS = [
  'oklch(0.546 0.232 264)',
  'oklch(0.956 0.218 128)',
  'oklch(0.7 0.18 280)',
  'oklch(0.75 0.15 80)',
  'oklch(0.65 0.2 350)',
  'oklch(0.6 0.2 145)',
  'oklch(0.65 0.18 60)',
  'oklch(0.55 0.22 30)',
  'oklch(0.6 0.16 200)',
  'oklch(0.7 0.15 160)',
]

interface TrendingProduct {
  id: number
  name: string
  category: string
  price: number
  rating: number
  discount: number
  shop: string
  followers: number
  tab: string
}

const trendingProducts: TrendingProduct[] = [
  // Hot
  { id: 1, name: 'Xiaomi Robot Vacuum X10+', category: 'Electronics', price: 1299, rating: 4.9, discount: 25, shop: 'Xiaomi Official', followers: 520000, tab: 'hot' },
  { id: 2, name: 'SK-II Facial Treatment Essence', category: 'Beauty', price: 599, rating: 4.8, discount: 15, shop: 'SK-II Official', followers: 380000, tab: 'hot' },
  { id: 3, name: 'Dreame T30 Cordless Vacuum', category: 'Home & Living', price: 899, rating: 4.7, discount: 20, shop: 'Dreame Malaysia', followers: 210000, tab: 'hot' },
  { id: 4, name: 'Anker Soundcore Life Q30', category: 'Electronics', price: 399, rating: 4.8, discount: 30, shop: 'Anker Official', followers: 450000, tab: 'hot' },
  { id: 5, name: 'Philips Air Purifier AC3858', category: 'Home & Living', price: 1599, rating: 4.6, discount: 18, shop: 'Philips Official', followers: 620000, tab: 'hot' },
  { id: 6, name: 'Nike Air Max 90', category: "Men's Fashion", price: 549, rating: 4.7, discount: 12, shop: 'Nike Official', followers: 890000, tab: 'hot' },
  { id: 7, name: 'Kiko Milano Lipstick Set', category: 'Beauty', price: 129, rating: 4.5, discount: 35, shop: 'Kiko MY', followers: 95000, tab: 'hot' },
  // New
  { id: 8, name: 'Samsung Galaxy S24 Ultra', category: 'Electronics', price: 5299, rating: 4.9, discount: 5, shop: 'Samsung Official', followers: 1200000, tab: 'new' },
  { id: 9, name: 'Dyson Airwrap Multi-Styler', category: 'Beauty', price: 2499, rating: 4.8, discount: 8, shop: 'Dyson Official', followers: 750000, tab: 'new' },
  { id: 10, name: 'LEGO Technic Ferrari', category: 'Toys', price: 1899, rating: 4.9, discount: 10, shop: 'LEGO Official', followers: 340000, tab: 'new' },
  { id: 11, name: 'Adidas Ultraboost Light', category: "Women's Fashion", price: 799, rating: 4.6, discount: 15, shop: 'Adidas Official', followers: 670000, tab: 'new' },
  { id: 12, name: 'Instant Pot Duo Plus', category: 'Home & Living', price: 459, rating: 4.7, discount: 20, shop: 'Instant Pot MY', followers: 125000, tab: 'new' },
  { id: 13, name: 'Royal Canin Kitten Food 4kg', category: 'Pet Supplies', price: 109, rating: 4.8, discount: 12, shop: 'PetHeaven MY', followers: 85000, tab: 'new' },
  // Discounted
  { id: 14, name: 'Tefal Iron Pro Express', category: 'Home & Living', price: 299, rating: 4.5, discount: 50, shop: 'Tefal Official', followers: 195000, tab: 'discounted' },
  { id: 15, name: 'Korean Skincare 10-Step Set', category: 'Beauty', price: 189, rating: 4.6, discount: 45, shop: 'K-Beauty Hub', followers: 76000, tab: 'discounted' },
  { id: 16, name: 'Portable Bluetooth Speaker JBL', category: 'Electronics', price: 199, rating: 4.7, discount: 40, shop: 'JBL Official', followers: 410000, tab: 'discounted' },
  { id: 17, name: 'Yoga Mat Premium 8mm', category: 'Sports', price: 79, rating: 4.4, discount: 55, shop: 'FitGear MY', followers: 42000, tab: 'discounted' },
  { id: 18, name: 'Cat Scratching Post Tower', category: 'Pet Supplies', price: 149, rating: 4.5, discount: 35, shop: 'PetWorld MY', followers: 58000, tab: 'discounted' },
  { id: 19, name: 'Mechanical Keyboard RGB', category: 'Hardware', price: 259, rating: 4.6, discount: 38, shop: 'KeyTech MY', followers: 92000, tab: 'discounted' },
  { id: 20, name: 'Stainless Steel Cookware Set', category: 'Home & Living', price: 399, rating: 4.3, discount: 42, shop: 'HomeStyle MY', followers: 64000, tab: 'discounted' },
]

interface SellerData {
  id: number
  name: string
  followers: number
  isOfficial: boolean
  isVerified: boolean
  responseRate: number
  avgRating: number
  trustScore: number
}

const sellerData: SellerData[] = [
  { id: 1, name: 'Samsung Official', followers: 1200000, isOfficial: true, isVerified: true, responseRate: 98, avgRating: 4.9, trustScore: 97 },
  { id: 2, name: 'Nike Official', followers: 890000, isOfficial: true, isVerified: true, responseRate: 96, avgRating: 4.8, trustScore: 95 },
  { id: 3, name: 'Dyson Official', followers: 750000, isOfficial: true, isVerified: true, responseRate: 94, avgRating: 4.8, trustScore: 93 },
  { id: 4, name: 'Adidas Official', followers: 670000, isOfficial: true, isVerified: true, responseRate: 92, avgRating: 4.7, trustScore: 91 },
  { id: 5, name: 'Philips Official', followers: 620000, isOfficial: true, isVerified: true, responseRate: 95, avgRating: 4.6, trustScore: 90 },
  { id: 6, name: 'Anker Official', followers: 450000, isOfficial: true, isVerified: true, responseRate: 91, avgRating: 4.8, trustScore: 89 },
  { id: 7, name: 'JBL Official', followers: 410000, isOfficial: true, isVerified: true, responseRate: 89, avgRating: 4.7, trustScore: 87 },
  { id: 8, name: 'LEGO Official', followers: 340000, isOfficial: true, isVerified: true, responseRate: 93, avgRating: 4.9, trustScore: 94 },
  { id: 9, name: 'TechZone MY', followers: 210000, isOfficial: false, isVerified: true, responseRate: 85, avgRating: 4.5, trustScore: 76 },
  { id: 10, name: 'Dreame Malaysia', followers: 210000, isOfficial: false, isVerified: true, responseRate: 88, avgRating: 4.7, trustScore: 80 },
]

const priceDistribution = [
  { range: 'RM 0-10', count: 1850000, pct: 8.4 },
  { range: 'RM 10-25', count: 3980000, pct: 18.0 },
  { range: 'RM 25-50', count: 4850000, pct: 22.0 },
  { range: 'RM 50-100', count: 4180000, pct: 18.9 },
  { range: 'RM 100-200', count: 3300000, pct: 14.9 },
  { range: 'RM 200-500', count: 2420000, pct: 11.0 },
  { range: 'RM 500-1K', count: 880000, pct: 4.0 },
  { range: 'RM 1K+', count: 640000, pct: 2.9 },
]

const discountAnalysis = [
  { range: '0-10%', count: 8200000, pct: 37.1 },
  { range: '10-20%', count: 5800000, pct: 26.2 },
  { range: '20-30%', count: 3900000, pct: 17.6 },
  { range: '30-50%', count: 2800000, pct: 12.7 },
  { range: '50-70%', count: 1100000, pct: 5.0 },
  { range: '70%+', count: 300000, pct: 1.4 },
]

const goldenProducts = [
  { name: 'Tefal Iron Pro Express', category: 'Home & Living', price: 299, discount: 50, rating: 4.5, reviews: 12400, score: 96 },
  { name: 'JBL Bluetooth Speaker', category: 'Electronics', price: 199, discount: 40, rating: 4.7, reviews: 8900, score: 94 },
  { name: 'Korean Skincare 10-Step', category: 'Beauty', price: 189, discount: 45, rating: 4.6, reviews: 6700, score: 92 },
  { name: 'Yoga Mat Premium 8mm', category: 'Sports', price: 79, discount: 55, rating: 4.4, reviews: 5200, score: 89 },
  { name: 'Mechanical Keyboard RGB', category: 'Hardware', price: 259, discount: 38, rating: 4.6, reviews: 4300, score: 87 },
  { name: 'Anker Soundcore Life Q30', category: 'Electronics', price: 399, discount: 30, rating: 4.8, reviews: 11200, score: 93 },
]

// Pie chart for category share (top 5 + Others)
const categoryPieData = [
  { name: 'Home & Living', value: 17.4 },
  { name: 'Beauty', value: 14.5 },
  { name: "Women's Fashion", value: 13.5 },
  { name: 'Hardware', value: 11.1 },
  { name: 'Sports', value: 9.6 },
  { name: 'Others', value: 33.9 },
]

// ─── Product Scoring Data ───────────────────────────────────────────────────

interface ScoreProduct {
  name: string
  shopFollowerCount: number
  ratingAvg: number
  responseRate: number
  isOfficial: boolean
  isVerified: boolean
  discount: number
  qualityScore: number
}

const scoreProducts: ScoreProduct[] = [
  { name: 'Samsung Galaxy S24 Ultra', shopFollowerCount: 1200000, ratingAvg: 4.9, responseRate: 98, isOfficial: true, isVerified: true, discount: 5, qualityScore: 94 },
  { name: 'Nike Air Max 90', shopFollowerCount: 890000, ratingAvg: 4.7, responseRate: 96, isOfficial: true, isVerified: true, discount: 12, qualityScore: 91 },
  { name: 'Tefal Iron Pro Express', shopFollowerCount: 195000, ratingAvg: 4.5, responseRate: 88, isOfficial: true, isVerified: true, discount: 50, qualityScore: 88 },
  { name: 'JBL Bluetooth Speaker', shopFollowerCount: 410000, ratingAvg: 4.7, responseRate: 89, isOfficial: true, isVerified: true, discount: 40, qualityScore: 86 },
  { name: 'Dreame T30 Vacuum', shopFollowerCount: 210000, ratingAvg: 4.7, responseRate: 88, isOfficial: false, isVerified: true, discount: 20, qualityScore: 78 },
  { name: 'Korean Skincare Set', shopFollowerCount: 76000, ratingAvg: 4.6, responseRate: 82, isOfficial: false, isVerified: true, discount: 45, qualityScore: 75 },
]

// ─── Gauge Component ────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (!inView) return
    const startTime = performance.now()
    const duration = 1000
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [score, inView])

  const radius = (size - 16) / 2
  const circumference = Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference
  const center = size / 2

  const getColor = (s: number) => {
    if (s >= 90) return 'oklch(0.75 0.22 145)'
    if (s >= 75) return 'oklch(0.956 0.218 128)'
    if (s >= 60) return 'oklch(0.75 0.15 80)'
    return 'oklch(0.6 0.2 25)'
  }

  return (
    <svg ref={ref} width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
      {/* Background arc */}
      <path
        d={`M ${center - radius} ${size / 2} A ${radius} ${radius} 0 0 1 ${center + radius} ${size / 2}`}
        fill="none"
        stroke="oklch(0.9 0.01 264 / 30%)"
        strokeWidth={10}
        strokeLinecap="butt"
        className="dark:stroke-white/10"
      />
      {/* Score arc */}
      <path
        d={`M ${center - radius} ${size / 2} A ${radius} ${radius} 0 0 1 ${center + radius} ${size / 2}`}
        fill="none"
        stroke={getColor(score)}
        strokeWidth={10}
        strokeLinecap="butt"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      {/* Score text */}
      <text
        x={center}
        y={size / 2 - 8}
        textAnchor="middle"
        className="fill-foreground text-2xl font-black"
        style={{ fontSize: size * 0.2 }}
      >
        {animatedScore}
      </text>
      <text
        x={center}
        y={size / 2 + 8}
        textAnchor="middle"
        className="fill-muted-foreground"
        style={{ fontSize: size * 0.09 }}
      >
        /100
      </text>
    </svg>
  )
}

// ─── Custom Tooltip for Recharts ────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border-2 border-border px-3 py-2 text-xs shadow-[3px_3px_0_0_rgba(0,0,0,0.1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)]">
      <p className="font-bold text-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Format helpers ─────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toLocaleString()
}

function formatRM(n: number): string {
  return 'RM ' + n.toLocaleString()
}

// ─── Section 1: Market Overview Cards ───────────────────────────────────────

function StatCard({ stat }: { stat: typeof marketOverviewStats[number] }) {
  const { count, ref: countRef } = useCountUp(
    stat.value >= 1_000_000
      ? parseFloat(stat.display.replace(/[^0-9.]/g, ''))
      : stat.value,
    1400,
  )
  const Icon = stat.icon

  return (
    <motion.div variants={staggerItem}>
      <Card className="border-2 border-border rounded-lg hover:shadow-[4px_4px_0_0_rgba(0,102,255,0.2)] dark:hover:shadow-[4px_4px_0_0_rgba(204,255,0,0.15)] transition-shadow duration-150">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={cn('p-2 rounded border-2 border-border bg-muted/50', stat.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] font-bold border-2 rounded-none',
                stat.up
                  ? 'border-profit/30 bg-profit/10 text-profit-dark dark:text-profit'
                  : 'border-destructive/30 bg-destructive/10 text-destructive',
              )}
            >
              {stat.up ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {stat.change}
            </Badge>
          </div>
          <div className="space-y-1">
            <span
              ref={countRef}
              className={cn('text-3xl font-black tracking-tight', stat.color)}
            >
              {stat.value >= 1_000_000
                ? `${count.toFixed(1)}M`
                : stat.value >= 1_000
                  ? `${Math.round(count).toLocaleString()}`
                  : stat.value < 100
                    ? count.toFixed(1)
                    : Math.round(count).toLocaleString()}
            </span>
            <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MarketOverviewCards() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {marketOverviewStats.map((stat) => (
        <StatCard key={stat.title} stat={stat} />
      ))}
    </motion.div>
  )
}

// ─── Section 2: Category Distribution ───────────────────────────────────────

function CategoryDistribution() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })

  return (
    <motion.div
      ref={ref}
      variants={fadeSlideUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <Card className="border-2 border-border rounded-lg hover:shadow-[4px_4px_0_0_rgba(0,102,255,0.2)] dark:hover:shadow-[4px_4px_0_0_rgba(204,255,0,0.15)] transition-shadow duration-150">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-shopee" />
            <CardTitle className="text-lg font-black">Category Distribution</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Top 10 categories by product count</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart */}
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <XAxis type="number" tickFormatter={(v: number) => formatCount(v)} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Products" radius={[0, 4, 4, 0]}>
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Pie Chart */}
            <div className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryPieData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                {categoryPieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className="w-2.5 h-2.5 rounded-none flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                    <span className="font-bold text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Section 3: Trending Products Table ─────────────────────────────────────

function TrendingProductsTable() {
  const [activeTab, setActiveTab] = useState('hot')
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })

  const filteredProducts = trendingProducts.filter((p) => p.tab === activeTab)

  return (
    <motion.div
      ref={ref}
      variants={fadeSlideUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <Card className="border-2 border-border rounded-lg hover:shadow-[4px_4px_0_0_rgba(0,102,255,0.2)] dark:hover:shadow-[4px_4px_0_0_rgba(204,255,0,0.15)] transition-shadow duration-150">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-shopee" />
            <CardTitle className="text-lg font-black">Trending Products</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 border-2 border-border rounded">
              <TabsTrigger value="hot" className="gap-1.5 text-xs data-[state=active]:bg-shopee data-[state=active]:text-white rounded-none">
                <Flame className="w-3.5 h-3.5" /> Hot
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-1.5 text-xs data-[state=active]:bg-shopee data-[state=active]:text-white rounded-none">
                <Zap className="w-3.5 h-3.5" /> New
              </TabsTrigger>
              <TabsTrigger value="discounted" className="gap-1.5 text-xs data-[state=active]:bg-shopee data-[state=active]:text-white rounded-none">
                <TrendingDown className="w-3.5 h-3.5" /> Discounted
              </TabsTrigger>
            </TabsList>

            {['hot', 'new', 'discounted'].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-border hover:bg-transparent">
                        <TableHead className="text-xs font-bold">Product</TableHead>
                        <TableHead className="text-xs font-bold">Category</TableHead>
                        <TableHead className="text-xs font-bold text-right">Price</TableHead>
                        <TableHead className="text-xs font-bold text-center">Rating</TableHead>
                        <TableHead className="text-xs font-bold text-center">Discount</TableHead>
                        <TableHead className="text-xs font-bold">Shop</TableHead>
                        <TableHead className="text-xs font-bold text-right">Followers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {trendingProducts
                          .filter((p) => p.tab === tab)
                          .map((product, idx) => (
                            <motion.tr
                              key={product.id}
                              custom={idx}
                              variants={rowSlideIn}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              className={cn(
                                'border-b border-border transition-colors',
                                product.discount >= 30
                                  ? 'bg-lime-light/40 dark:bg-lime/5'
                                  : 'hover:bg-muted/50',
                              )}
                            >
                              <TableCell className="text-xs font-semibold max-w-[180px] truncate py-2.5">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-xs py-2.5">
                                <Badge variant="outline" className="text-[10px] rounded-none border-2 font-medium">
                                  {product.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs font-bold text-right py-2.5">
                                {formatRM(product.price)}
                              </TableCell>
                              <TableCell className="text-xs text-center py-2.5">
                                <span className="inline-flex items-center gap-0.5">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  {product.rating}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-center py-2.5">
                                <Badge
                                  className={cn(
                                    'text-[10px] font-bold rounded-none border-2',
                                    product.discount >= 40
                                      ? 'bg-profit/15 text-profit-dark dark:text-profit border-profit/30'
                                      : product.discount >= 25
                                        ? 'bg-lime/15 text-lime-dark dark:text-lime border-lime/30'
                                        : 'bg-muted text-muted-foreground border-border',
                                  )}
                                >
                                  -{product.discount}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2.5 max-w-[120px] truncate">
                                {product.shop}
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono py-2.5">
                                {formatCount(product.followers)}
                              </TableCell>
                            </motion.tr>
                          ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Section 4: Seller Intelligence Panel ───────────────────────────────────

function SellerIntelligencePanel() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })

  return (
    <motion.div
      ref={ref}
      variants={fadeSlideUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <Card className="border-2 border-border rounded-lg hover:shadow-[4px_4px_0_0_rgba(0,102,255,0.2)] dark:hover:shadow-[4px_4px_0_0_rgba(204,255,0,0.15)] transition-shadow duration-150">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-shopee" />
            <CardTitle className="text-lg font-black">Seller Intelligence</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Top verified shops by followers &amp; trust score</p>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border hover:bg-transparent">
                  <TableHead className="text-xs font-bold">#</TableHead>
                  <TableHead className="text-xs font-bold">Shop</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold text-right">Followers</TableHead>
                  <TableHead className="text-xs font-bold text-center">Response</TableHead>
                  <TableHead className="text-xs font-bold text-center">Rating</TableHead>
                  <TableHead className="text-xs font-bold text-center">Trust</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerData.map((seller, idx) => (
                  <motion.tr
                    key={seller.id}
                    custom={idx}
                    variants={rowSlideIn}
                    initial="hidden"
                    animate="visible"
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="text-xs font-bold py-2.5">
                      {idx < 3 ? (
                        <span className="text-amber-500">
                          <Crown className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{idx + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-semibold py-2.5">{seller.name}</TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1">
                        {seller.isOfficial && (
                          <Badge className="text-[9px] font-bold rounded-none border-2 bg-shopee/10 text-shopee border-shopee/30 px-1.5 py-0">
                            OFFICIAL
                          </Badge>
                        )}
                        {seller.isVerified && (
                          <Badge className="text-[9px] font-bold rounded-none border-2 bg-profit/10 text-profit-dark dark:text-profit border-profit/30 px-1.5 py-0">
                            <Shield className="w-2.5 h-2.5 mr-0.5" />
                            VERIFIED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono py-2.5">
                      {formatCount(seller.followers)}
                    </TableCell>
                    <TableCell className="text-xs text-center py-2.5">
                      <span className={cn('font-bold', seller.responseRate >= 90 ? 'text-profit-dark dark:text-profit' : 'text-amber-500')}>
                        {seller.responseRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-center py-2.5">
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {seller.avgRating}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={seller.trustScore}
                          className="h-2 w-16 rounded-none [&>[data-slot=indicator]]:rounded-none"
                        />
                        <span
                          className={cn(
                            'text-xs font-black',
                            seller.trustScore >= 90
                              ? 'text-profit-dark dark:text-profit'
                              : seller.trustScore >= 75
                                ? 'text-lime-dark dark:text-lime'
                                : 'text-amber-500',
                          )}
                        >
                          {seller.trustScore}
                        </span>
                      </div>
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

// ─── Section 5: Price Intelligence ──────────────────────────────────────────

function PriceIntelligence() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })

  return (
    <motion.div
      ref={ref}
      variants={fadeSlideUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
    >
      {/* Price Distribution */}
      <Card className="border-2 border-border rounded-lg lg:col-span-2 hover:shadow-[4px_4px_0_0_rgba(0,102,255,0.2)] dark:hover:shadow-[4px_4px_0_0_rgba(204,255,0,0.15)] transition-shadow duration-150">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-shopee" />
            <CardTitle className="text-lg font-black">Price Distribution</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Product count by price range</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priceDistribution} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v: number) => formatCount(v)} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Products" radius={[4, 4, 0, 0]}>
                {priceDistribution.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Discount Analysis + Golden Products */}
      <div className="flex flex-col gap-4">
        <Card className="border-2 border-border rounded-lg hover:shadow-[4px_4px_0_0_rgba(0,102,255,0.2)] dark:hover:shadow-[4px_4px_0_0_rgba(204,255,0,0.15)] transition-shadow duration-150">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-shopee" />
              <CardTitle className="text-sm font-black">Discount Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={discountAnalysis} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
                <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                <YAxis tickFormatter={(v: number) => formatCount(v)} tick={{ fontSize: 9 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Products" radius={[3, 3, 0, 0]}>
                  {discountAnalysis.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        idx >= 3
                          ? 'oklch(0.75 0.22 145)'
                          : 'oklch(0.546 0.232 264)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-2">
              <span className="inline-block w-2.5 h-2.5 bg-profit mr-1 align-middle" />
              30%+ discount highlighted ({((2800000 + 1100000 + 300000) / 22100000 * 100).toFixed(1)}% of catalog)
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border rounded-lg hover:shadow-[4px_4px_0_0_rgba(0,102,255,0.2)] dark:hover:shadow-[4px_4px_0_0_rgba(204,255,0,0.15)] transition-shadow duration-150 flex-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-lime-dark dark:text-lime" />
              <CardTitle className="text-sm font-black">Golden Products</CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground">High discount + high rating + many reviews</p>
          </CardHeader>
          <CardContent>
            <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-2">
              {goldenProducts.map((gp) => (
                <div
                  key={gp.name}
                  className="flex items-center justify-between p-2 border border-border rounded bg-lime-light/20 dark:bg-lime/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{gp.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{gp.category}</span>
                      <span className="text-[10px] font-bold text-profit-dark dark:text-profit">-{gp.discount}%</span>
                      <span className="text-[10px] text-amber-500">
                        ★ {gp.rating}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formatCount(gp.reviews)} reviews</span>
                    </div>
                  </div>
                  <Badge className="text-[10px] font-black rounded-none border-2 bg-lime/15 text-lime-dark dark:text-lime border-lime/30 ml-2 flex-shrink-0">
                    {gp.score}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

// ─── Section 6: Product Scoring Widget ──────────────────────────────────────

function ProductScoringWidget() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = scoreProducts[selectedIdx]

  const scoreBreakdown = useCallback((p: ScoreProduct) => {
    const followerScore = Math.min(p.shopFollowerCount / 100000, 10) * 2
    const ratingScore = (p.ratingAvg / 5) * 30
    const responseScore = (p.responseRate / 100) * 20
    const officialScore = p.isOfficial ? 10 : 0
    const verifiedScore = p.isVerified ? 8 : 0
    const discountScore = Math.min(p.discount / 50, 1) * 10
    return {
      followerScore: Math.round(followerScore * 10) / 10,
      ratingScore: Math.round(ratingScore * 10) / 10,
      responseScore: Math.round(responseScore * 10) / 10,
      officialScore,
      verifiedScore,
      discountScore: Math.round(discountScore * 10) / 10,
      total: Math.round(followerScore + ratingScore + responseScore + officialScore + verifiedScore + discountScore),
    }
  }, [])

  const breakdown = scoreBreakdown(selected)

  return (
    <motion.div
      ref={ref}
      variants={fadeSlideUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <Card className="border-2 border-border rounded-lg hover:shadow-[4px_4px_0_0_rgba(0,102,255,0.2)] dark:hover:shadow-[4px_4px_0_0_rgba(204,255,0,0.15)] transition-shadow duration-150">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-lime-dark dark:text-lime" />
            <CardTitle className="text-lg font-black">Product Scoring Widget</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">AI-driven quality score based on shop metrics, ratings &amp; verification</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product selector + Gauge */}
            <div className="flex flex-col items-center gap-4">
              {/* Gauge */}
              <ScoreGauge score={selected.qualityScore} size={200} />

              {/* Product selector */}
              <div className="w-full max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                {scoreProducts.map((p, idx) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedIdx(idx)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 border-2 rounded text-xs transition-all duration-150 text-left',
                      idx === selectedIdx
                        ? 'border-shopee bg-shopee/5 dark:bg-shopee/10'
                        : 'border-border hover:border-shopee/40 hover:bg-muted/50',
                    )}
                  >
                    <span className="font-semibold truncate">{p.name}</span>
                    <span
                      className={cn(
                        'font-black ml-2 flex-shrink-0',
                        p.qualityScore >= 90
                          ? 'text-profit-dark dark:text-profit'
                          : p.qualityScore >= 75
                            ? 'text-lime-dark dark:text-lime'
                            : 'text-amber-500',
                      )}
                    >
                      {p.qualityScore}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-foreground">Score Breakdown</h4>
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-bold text-foreground">{selected.name}</span>
              </p>

              <div className="space-y-2.5">
                {[
                  { label: 'Shop Followers', value: breakdown.followerScore, max: 20, detail: formatCount(selected.shopFollowerCount) },
                  { label: 'Average Rating', value: breakdown.ratingScore, max: 30, detail: `${selected.ratingAvg} / 5` },
                  { label: 'Response Rate', value: breakdown.responseScore, max: 20, detail: `${selected.responseRate}%` },
                  { label: 'Official Shop', value: breakdown.officialScore, max: 10, detail: selected.isOfficial ? 'Yes' : 'No' },
                  { label: 'Verified Shop', value: breakdown.verifiedScore, max: 8, detail: selected.isVerified ? 'Yes' : 'No' },
                  { label: 'Discount Appeal', value: breakdown.discountScore, max: 10, detail: `${selected.discount}% off` },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-bold text-foreground">
                        {item.value} / {item.max}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-none overflow-hidden">
                        <motion.div
                          className="h-full rounded-none"
                          style={{ backgroundColor: 'oklch(0.546 0.232 264)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / item.max) * 100}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono w-20 text-right">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t-2 border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black">Total Score</span>
                  <span className={cn(
                    'text-2xl font-black',
                    breakdown.total >= 90
                      ? 'text-profit-dark dark:text-profit'
                      : breakdown.total >= 75
                        ? 'text-lime-dark dark:text-lime'
                        : 'text-amber-500',
                  )}>
                    {breakdown.total}
                  </span>
                </div>
                <Progress value={breakdown.total} className="h-3 mt-2 rounded-none [&>[data-slot=indicator]]:rounded-none" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function IntelligencePage() {
  const sectionRef = useRef(null)
  const sectionInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 border-2 border-shopee rounded bg-shopee/10">
            <BarChart3 className="w-6 h-6 text-shopee" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Market Intelligence</h1>
            <p className="text-xs text-muted-foreground">
              Powered by 22M product records with 52 data fields per product
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className="text-[10px] font-bold rounded-none border-2 bg-shopee/10 text-shopee border-shopee/30">
            <Eye className="w-3 h-3 mr-1" />
            LIVE DATA
          </Badge>
          <Badge className="text-[10px] font-bold rounded-none border-2 bg-lime/15 text-lime-dark dark:text-lime border-lime/30">
            <Zap className="w-3 h-3 mr-1" />
            AI-POWERED
          </Badge>
          <Badge className="text-[10px] font-bold rounded-none border-2 bg-hermes/10 text-hermes border-hermes/30">
            <Shield className="w-3 h-3 mr-1" />
            52 FIELDS
          </Badge>
        </div>
      </motion.div>

      {/* Section 1: Market Overview Cards */}
      <MarketOverviewCards />

      {/* Section 2: Category Distribution */}
      <CategoryDistribution />

      {/* Section 3: Trending Products Table */}
      <TrendingProductsTable />

      {/* Section 4: Seller Intelligence */}
      <SellerIntelligencePanel />

      {/* Section 5: Price Intelligence */}
      <PriceIntelligence />

      {/* Section 6: Product Scoring Widget */}
      <div ref={sectionRef}>
        <ProductScoringWidget />
      </div>
    </div>
  )
}
