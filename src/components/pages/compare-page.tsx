'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  GitCompare,
  ShoppingBag,
  Link2,
  Loader2,
  Trophy,
  Sparkles,
  PackageSearch,
  TrendingUp,
  ArrowUpDown,
  Filter,
  Crown,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type {
  ComparisonResult,
  ComparisonRow,
  Platform,
  PlatformCommission,
  UnifiedCategory,
} from '@/lib/compare/types'

// ─── Constants ────────────────────────────────────────────────

const CATEGORIES: Array<UnifiedCategory | 'All'> = [
  'All',
  'Beauty',
  'Fashion',
  'Electronics',
  'Home',
  'Food',
  'Baby',
]

const SORT_OPTIONS = [
  { value: 'best-commission', label: 'Best Commission' },
  { value: 'lowest-price', label: 'Lowest Price' },
  { value: 'highest-rate', label: 'Highest Commission %' },
] as const

/** Platform display metadata (colours + labels). */
const PLATFORM_META: Record<
  Platform,
  { label: string; color: string; bgClass: string; textClass: string; borderClass: string }
> = {
  shopee: {
    label: 'Shopee',
    color: '#ee4d2d',
    bgClass: 'bg-shopee/10 dark:bg-shopee/20',
    textClass: 'text-shopee',
    borderClass: 'border-shopee/40',
  },
  tiktok: {
    label: 'TikTok',
    color: '#ff0050',
    bgClass: 'bg-pink-500/10 dark:bg-pink-500/20',
    textClass: 'text-pink-600 dark:text-pink-400',
    borderClass: 'border-pink-500/40',
  },
  lazada: {
    label: 'Lazada',
    color: '#0f146d',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/40',
  },
}

const PLATFORM_ORDER: Platform[] = ['shopee', 'tiktok', 'lazada']

// ─── Helpers ──────────────────────────────────────────────────

function formatRM(n: number): string {
  return `RM${(n || 0).toFixed(2)}`
}

function formatSold(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

// ─── Sub-Components ───────────────────────────────────────────

/** Top summary card with stats + chart. */
function SummaryCard({ data }: { data: ComparisonResult | undefined }) {
  if (!data) return null
  const { summary } = data

  const chartData = PLATFORM_ORDER.map((p) => ({
    platform: PLATFORM_META[p].label,
    avgRate: Number(summary.avgRateByPlatform[p].toFixed(2)),
    avgAmount: Number(summary.avgAmountByPlatform[p].toFixed(2)),
    color: PLATFORM_META[p].color,
  }))

  const winsData = PLATFORM_ORDER.map((p) => ({
    platform: PLATFORM_META[p].label,
    wins: p === 'shopee' ? summary.shopeeWins : p === 'tiktok' ? summary.tiktokWins : summary.lazadaWins,
    color: PLATFORM_META[p].color,
  }))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-shopee" />
          Commission Comparison Summary
          <Badge variant="secondary" className="ml-auto text-xs">
            {data.total} products
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        {/* Avg commission rate per platform */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Average Commission Rate (%)
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(2)}%`, 'Avg Rate']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="avgRate" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wins per platform */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Best Commission Wins per Platform
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => [v, 'Wins']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="wins" radius={[6, 6, 0, 0]}>
                  {winsData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** A single platform column inside a row. */
function PlatformColumn({
  platform,
  commission,
  isWinner,
  onGenerateLink,
  isGenerating,
}: {
  platform: Platform
  commission: PlatformCommission | null
  isWinner: boolean
  onGenerateLink: (platform: Platform, commission: PlatformCommission) => void
  isGenerating: boolean
}) {
  const meta = PLATFORM_META[platform]

  if (!commission) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-3 text-center h-full min-h-[140px]">
        <PackageSearch className="size-5 text-muted-foreground/40 mb-1" />
        <p className="text-[10px] text-muted-foreground/60">Not available</p>
        <p className="text-[10px] text-muted-foreground/40">on {meta.label}</p>
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-lg border p-3 flex flex-col gap-1.5 h-full min-h-[140px] transition-all ${
        isWinner
          ? `${meta.bgClass} ${meta.borderClass} ring-2 ring-offset-1 ring-offset-background ring-shopee/40`
          : 'border-border bg-card'
      }`}
    >
      {isWinner && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Badge className="bg-shopee text-white border-0 gap-1 text-[10px] px-2 py-0.5 shadow-md">
            <Crown className="size-3" />
            Best
          </Badge>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className={`text-[10px] px-1.5 py-0 border-0 ${meta.bgClass} ${meta.textClass} font-semibold`}
        >
          {meta.label}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {commission.commissionRate.toFixed(1)}% comm
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-base font-bold ${meta.textClass}`}>
          {formatRM(commission.price)}
        </span>
        {commission.originalPrice && commission.originalPrice > commission.price && (
          <span className="text-[10px] text-muted-foreground line-through">
            {formatRM(commission.originalPrice)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Zap className="size-3 text-shopee" />
        <span className="text-xs font-semibold text-shopee">
          {formatRM(commission.commissionAmount)}
        </span>
        <span className="text-[10px] text-muted-foreground">commission</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto">
        <span className="truncate max-w-[70%]">{commission.shopName}</span>
        <span>{formatSold(commission.sales)} sold</span>
      </div>
      <Button
        size="sm"
        variant={isWinner ? 'default' : 'outline'}
        className={`w-full h-7 text-[11px] mt-1 ${
          isWinner ? 'bg-shopee hover:bg-shopee-dark text-white' : ''
        }`}
        onClick={() => onGenerateLink(platform, commission)}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Link2 className="size-3" />
        )}
        {isGenerating ? 'Generating...' : 'Generate Link'}
      </Button>
    </div>
  )
}

/** A comparison row rendered as a card (for Card View). */
function ComparisonCardRow({
  row,
  onGenerateLink,
  generatingKey,
}: {
  row: ComparisonRow
  onGenerateLink: (platform: Platform, commission: PlatformCommission, productName: string) => void
  generatingKey: string | null
}) {
  const byPlatform = useMemo(() => {
    const map = new Map<Platform, PlatformCommission>()
    for (const p of row.matchedOnPlatforms) map.set(p.platform, p)
    return map
  }, [row])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden py-0 gap-0">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 bg-muted/30 border-b">
          <div className="size-12 rounded-md bg-shopee/10 flex items-center justify-center shrink-0">
            {row.thumbnail ? (
              <img
                src={row.thumbnail}
                alt={row.productName}
                className="size-full object-cover rounded-md"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <ShoppingBag className="size-6 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-shopee/30 text-shopee"
              >
                {row.category}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {row.matchCount} platform{row.matchCount > 1 ? 's' : ''}
              </Badge>
            </div>
            <h3 className="text-sm font-medium line-clamp-2 leading-snug mt-1">
              {row.productName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-muted-foreground">Lowest price:</span>
              <span className="text-xs font-semibold">{formatRM(row.lowestPrice)}</span>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-[11px] text-muted-foreground">Best commission:</span>
              <span className="text-xs font-bold text-shopee">
                {formatRM(row.bestCommissionAmount)}
              </span>
            </div>
          </div>
        </div>
        {/* Platform columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3">
          {PLATFORM_ORDER.map((p) => (
            <PlatformColumn
              key={p}
              platform={p}
              commission={byPlatform.get(p) ?? null}
              isWinner={row.bestPlatform === p && row.matchCount > 1}
              onGenerateLink={(platform, commission) =>
                onGenerateLink(platform, commission, row.productName)
              }
              isGenerating={generatingKey === `${row.id}-${p}`}
            />
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

/** A comparison row rendered as a table row (for Table View). */
function ComparisonTableRow({
  row,
  onGenerateLink,
  generatingKey,
}: {
  row: ComparisonRow
  onGenerateLink: (platform: Platform, commission: PlatformCommission, productName: string) => void
  generatingKey: string | null
}) {
  const byPlatform = useMemo(() => {
    const map = new Map<Platform, PlatformCommission>()
    for (const p of row.matchedOnPlatforms) map.set(p.platform, p)
    return map
  }, [row])

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-b last:border-0 hover:bg-muted/30"
    >
      {/* Product */}
      <td className="p-3 align-top">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-md bg-shopee/10 flex items-center justify-center shrink-0">
            {row.thumbnail ? (
              <img
                src={row.thumbnail}
                alt={row.productName}
                className="size-full object-cover rounded-md"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <ShoppingBag className="size-5 text-muted-foreground/40" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium line-clamp-2">{row.productName}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {row.category}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {row.matchCount}/3 platforms
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Each platform column */}
      {PLATFORM_ORDER.map((p) => {
        const c = byPlatform.get(p) ?? null
        const isWinner = row.bestPlatform === p && row.matchCount > 1
        const meta = PLATFORM_META[p]
        return (
          <td key={p} className="p-3 align-top">
            {c ? (
              <div
                className={`rounded-md border p-2 ${
                  isWinner
                    ? `${meta.bgClass} ${meta.borderClass} ring-1 ring-shopee/30`
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge
                    variant="secondary"
                    className={`text-[9px] px-1 py-0 ${meta.bgClass} ${meta.textClass} border-0`}
                  >
                    {meta.label}
                  </Badge>
                  {isWinner && (
                    <Crown className="size-3 text-shopee" />
                  )}
                </div>
                <div className={`text-sm font-bold ${meta.textClass}`}>
                  {formatRM(c.price)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {c.commissionRate.toFixed(1)}% · {formatRM(c.commissionAmount)} comm
                </div>
                <Button
                  size="sm"
                  variant={isWinner ? 'default' : 'outline'}
                  className={`w-full h-6 text-[10px] mt-1.5 ${
                    isWinner ? 'bg-shopee hover:bg-shopee-dark text-white' : ''
                  }`}
                  onClick={() => onGenerateLink(p, c, row.productName)}
                  disabled={generatingKey === `${row.id}-${p}`}
                >
                  {generatingKey === `${row.id}-${p}` ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Link2 className="size-3" />
                  )}
                  Link
                </Button>
              </div>
            ) : (
              <div className="text-center text-[10px] text-muted-foreground/50 py-3">
                —
              </div>
            )}
          </td>
        )
      })}
    </motion.tr>
  )
}

/** Loading skeletons. */
function CompareSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="overflow-hidden py-0 gap-0">
          <div className="p-4 bg-muted/30 border-b flex items-center gap-3">
            <Skeleton className="size-12 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2 w-1/3" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-32 rounded-lg" />
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

/** Empty state. */
function EmptyState({ query }: { query: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <PackageSearch className="size-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold">No matches found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {query
            ? `We couldn't find any cross-platform matches for "${query}". Try a broader keyword like "serum", "hoodie", or "earbuds".`
            : 'Start by searching for a product to compare commissions across Shopee, TikTok Shop, and Lazada.'}
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export function ComparePage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState<UnifiedCategory | 'All'>('All')
  const [sort, setSort] = useState<string>('best-commission')
  const [view, setView] = useState<'table' | 'card'>('card')
  const [generatingKey, setGeneratingKey] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading, isError, refetch } = useQuery<ComparisonResult>({
    queryKey: ['compare', debouncedQuery, category, sort],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedQuery) params.set('q', debouncedQuery)
      params.set('category', category)
      params.set('sort', sort)
      const res = await fetch(`/api/compare?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch comparison data')
      return res.json() as Promise<ComparisonResult>
    },
    staleTime: 30_000,
  })

  const handleGenerateLink = async (
    platform: Platform,
    commission: PlatformCommission,
    productName: string
  ) => {
    // Build the key for the row containing this product
    const row = data?.rows.find((r) =>
      r.matchedOnPlatforms.some((m) => m.productId === commission.productId)
    )
    const key = `${row?.id ?? 'x'}-${platform}`
    setGeneratingKey(key)
    try {
      // Call the appropriate platform's generate-link endpoint
      const endpoint =
        platform === 'shopee'
          ? '/api/shopee/generate-link'
          : platform === 'tiktok'
            ? '/api/tiktok/generate-link'
            : '/api/lazada/generate-link'
      const body =
        platform === 'shopee'
          ? { itemId: Number(commission.productId) }
          : { productId: commission.productId, productUrl: commission.affiliateUrl }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || `Failed to generate ${platform} link`)
      }

      const result = (await res.json()) as {
        link?: { shortUrl?: string; longUrl?: string; trackingUrl?: string }
        shortUrl?: string
      }
      const url =
        result.link?.shortUrl ||
        result.link?.longUrl ||
        result.link?.trackingUrl ||
        result.shortUrl ||
        commission.affiliateUrl

      await navigator.clipboard?.writeText(url).catch(() => {})
      toast.success(`${PLATFORM_META[platform].label} link generated`, {
        description: `Copied to clipboard: ${url.slice(0, 50)}${url.length > 50 ? '...' : ''}`,
      })
      void productName
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to generate ${PLATFORM_META[platform].label} link`, {
        description: message,
      })
    } finally {
      setGeneratingKey(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-lg bg-shopee/10 flex items-center justify-center">
            <GitCompare className="size-5 text-shopee" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Multi-Platform Commission Comparison
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Bandingkan komisen untuk produk yang sama di Shopee, TikTok Shop, dan
              Lazada — jumpa platform yang bayar paling tinggi untuk setiap produk.
            </p>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Sparkles className="size-3 text-shopee" />
              Avg best commission: {formatRM(data.summary.avgBestCommission)}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              <Trophy className="size-3 text-shopee mr-1" />
              Shopee: {data.summary.shopeeWins}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              <Trophy className="size-3 text-pink-500 mr-1" />
              TikTok: {data.summary.tiktokWins}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              <Trophy className="size-3 text-blue-500 mr-1" />
              Lazada: {data.summary.lazadaWins}
            </Badge>
          </div>
        )}
      </div>

      {/* Search + filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search across all platforms — e.g. 'serum', 'hoodie', 'earbuds'..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full md:w-[200px]">
                <ArrowUpDown className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="size-3.5 text-muted-foreground" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  category === cat
                    ? 'bg-shopee text-white border-shopee shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-shopee/40 hover:text-shopee'
                }`}
                aria-pressed={category === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary chart */}
      {!isLoading && data && data.total > 0 && <SummaryCard data={data} />}

      {/* View toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'card')}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-shopee" />
              {data ? `${data.total} matched products` : 'Loading matches...'}
            </h2>
          </div>
          <TabsList>
            <TabsTrigger value="card">Card View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="card" className="mt-4 space-y-3">
          {isLoading ? (
            <CompareSkeleton />
          ) : isError ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-destructive">
                Failed to load comparison data.{' '}
                <Button variant="link" onClick={() => refetch()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : !data || data.total === 0 ? (
            <EmptyState query={debouncedQuery} />
          ) : (
            <AnimatePresence mode="popLayout">
              {data.rows.map((row) => (
                <ComparisonCardRow
                  key={row.id}
                  row={row}
                  onGenerateLink={handleGenerateLink}
                  generatingKey={generatingKey}
                />
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          {isLoading ? (
            <CompareSkeleton />
          ) : isError ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-destructive">
                Failed to load comparison data.{' '}
                <Button variant="link" onClick={() => refetch()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : !data || data.total === 0 ? (
            <EmptyState query={debouncedQuery} />
          ) : (
            <Card className="overflow-hidden py-0 gap-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b">
                      <th className="p-3 text-left font-medium text-xs text-muted-foreground w-[28%]">
                        Product
                      </th>
                      {PLATFORM_ORDER.map((p) => (
                        <th
                          key={p}
                          className="p-3 text-left font-medium text-xs text-muted-foreground"
                        >
                          <span className={`inline-flex items-center gap-1 ${PLATFORM_META[p].textClass}`}>
                            <span
                              className={`size-2 rounded-full`}
                              style={{ backgroundColor: PLATFORM_META[p].color }}
                            />
                            {PLATFORM_META[p].label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {data.rows.map((row) => (
                        <ComparisonTableRow
                          key={row.id}
                          row={row}
                          onGenerateLink={handleGenerateLink}
                          generatingKey={generatingKey}
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
