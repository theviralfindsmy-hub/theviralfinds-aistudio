'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingBag,
  Star,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Link2,
  SlidersHorizontal,
  Package,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  Plug,
  Unplug,
  RefreshCw,
  Play,
  Music2,
  Flame,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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

// ─── Types ─────────────────────────────────────────────────────

interface TikTokProduct {
  id: string
  productId: string
  title: string
  description: string
  price: number
  originalPrice?: number
  currency: 'MYR'
  commissionRate: number
  commissionAmount: number
  imageUrl: string
  videoUrl?: string
  shopName: string
  shopId: string
  category: string
  sales: number
  rating: number
  reviewCount: number
  stock: number
  productLink: string
  deepLink?: string
  platform: 'tiktok'
  hashtags: string[]
  trendScore: number
  // Client-side augmented fields (set by the generate-link mutation)
  affiliateLink?: string | null
  source?: 'api' | 'mock'
}

interface SearchResult {
  products: TikTokProduct[]
  total: number
  source: 'api' | 'mock'
  connected: boolean
}

interface GenerateLinkResponse {
  link: {
    shortUrl: string
    longUrl: string
    deepLink: string
    generateUrl: string
    trackingId: string
    expiresAt?: string
  }
  saved: boolean
  dbLinkId: string | null
  source: 'api' | 'mock'
}

interface ConnectStatus {
  connected: boolean
  appKey: string | null
  region: string
  shopId: string | null
  lastConnected: string | null
  source: 'api' | 'mock'
}

interface CommissionSummary {
  totalCommission: number
  pendingCommission: number
  confirmedCommission: number
  rejectedCommission: number
  paidCommission: number
  totalOrders: number
  conversionRate: number
  clickCount: number
}

interface CommissionsResponse {
  orders: unknown[]
  summary: CommissionSummary
  total: number
  source: 'api' | 'mock'
  connected: boolean
}

// ─── Constants ─────────────────────────────────────────────────

const CATEGORIES = [
  'All',
  'Beauty',
  'Fashion',
  'Electronics',
  'Home',
  'Food',
  'Health',
  'Kids',
  'Sports',
  'Automotive',
] as const

const SORT_OPTIONS = [
  { value: 'trend', label: 'Trending Now 🔥' },
  { value: 'commission', label: 'Highest Commission' },
  { value: 'sales', label: 'Most Sold' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price', label: 'Price: Low to High' },
] as const

// ─── Helpers ───────────────────────────────────────────────────

function formatSoldCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

function formatRM(amount: number): string {
  return `RM${amount.toFixed(2)}`
}

// ─── Product Card (TikTok-style vertical 9:16-ish) ─────────────

function TikTokProductCard({
  product,
  onGenerateLink,
  isGenerating,
}: {
  product: TikTokProduct
  onGenerateLink: (product: TikTokProduct) => void
  isGenerating: boolean
}) {
  const [copied, setCopied] = useState(false)
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0

  const handleCopy = () => {
    if (product.affiliateLink) {
      navigator.clipboard?.writeText(product.affiliateLink).catch(() => {})
      setCopied(true)
      toast.success('TikTok affiliate link copied!', {
        description: 'Paste it on your TikTok video, bio, or live stream.',
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Affiliate link (added by mutation onSuccess to the cached query data)
  const affiliateLink = product.affiliateLink

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="card-hover overflow-hidden py-0 gap-0 h-full flex flex-col">
        {/* Vertical TikTok-style thumbnail (4:5 portrait) */}
        <div className="bg-gradient-to-br from-pink-500/15 via-shopee/10 to-rose-500/15 flex items-center justify-center aspect-[4/5] relative">
          <ShoppingBag className="size-12 text-shopee/50" />

          {/* Play icon overlay (TikTok video aesthetic) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Play className="size-4 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Trend badge (TikTok aesthetic) */}
          {product.trendScore >= 95 && (
            <Badge className="absolute top-2 left-2 bg-rose-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-0.5">
              <Flame className="size-3" />
              Viral
            </Badge>
          )}

          {/* Live API badge */}
          {product.source === 'api' && (
            <Badge className="absolute top-2 right-2 bg-emerald-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-1">
              <Zap className="size-3" />
              Live
            </Badge>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <Badge className="absolute bottom-2 right-2 bg-destructive text-white border-0 text-[10px] px-1.5 py-0.5">
              -{discount}%
            </Badge>
          )}

          {/* Sales counter bottom-left (TikTok aesthetic) */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5">
            <Play className="size-2.5 text-white fill-white" />
            <span className="text-[10px] text-white font-medium">
              {formatSoldCount(product.sales)}
            </span>
          </div>
        </div>

        <CardContent className="p-3 flex flex-col gap-2 flex-1">
          <h3 className="text-sm font-medium line-clamp-2 leading-snug min-h-[2.5rem]">
            {product.title}
          </h3>

          {/* Hashtags */}
          {product.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.hashtags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-shopee/80 bg-shopee/5 rounded px-1 py-0.5 flex items-center gap-0.5"
                >
                  <Music2 className="size-2" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-shopee">
              {formatRM(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatRM(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Commission badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-shopee/10 text-shopee border-0 font-semibold"
              >
                +{formatRM(product.commissionAmount)}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {product.commissionRate}% comm
              </span>
            </div>
          </div>

          {/* Rating + sold count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({formatSoldCount(product.reviewCount)})
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatSoldCount(product.sales)} sold
            </span>
          </div>

          <p
            className="text-xs text-muted-foreground truncate"
            title={product.shopName}
          >
            {product.shopName}
          </p>

          <div className="mt-auto pt-1">
            {affiliateLink ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-shopee hover:bg-shopee-dark text-white"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onGenerateLink(product)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  Refresh
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="w-full bg-shopee hover:bg-shopee-dark text-white"
                onClick={() => onGenerateLink(product)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Link2 className="size-3.5" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Affiliate Link'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Card Skeleton ─────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0 gap-0">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <CardContent className="p-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-8 w-full mt-2" />
      </CardContent>
    </Card>
  )
}

// ─── Connection Card ───────────────────────────────────────────

function ConnectionCard({ status }: { status: ConnectStatus | undefined }) {
  const qc = useQueryClient()
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      if (status?.connected) {
        const res = await fetch('/api/tiktok/connect', { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to disconnect')
        toast.success('TikTok Shop disconnected', {
          description: 'You are now using demo data.',
        })
      } else {
        // Stub: real OAuth dance will be wired up in a follow-up task.
        toast.info('TikTok OAuth coming soon', {
          description:
            'Real TikTok Shop OAuth will be wired up in a follow-up task. Currently using demo data.',
        })
      }
      await qc.invalidateQueries({ queryKey: ['tiktok', 'connect-status'] })
    } catch (err) {
      toast.error('Failed to toggle connection', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsToggling(false)
    }
  }

  const connected = status?.connected ?? false
  const source = status?.source ?? 'mock'

  return (
    <Card className="py-4">
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className={`flex size-12 items-center justify-center rounded-xl shrink-0 ${
            connected
              ? 'bg-shopee/10 text-shopee'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {connected ? (
            <Plug className="size-6" />
          ) : (
            <Unplug className="size-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">TikTok Shop Affiliate</h3>
            <Badge
              className={
                connected
                  ? 'bg-emerald-500 text-white border-0 gap-1 text-[10px]'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-0 gap-1 text-[10px]'
              }
            >
              {connected ? (
                <>
                  <Zap className="size-3" />
                  Connected · {source === 'api' ? 'Live API' : 'Mock'}
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3" />
                  Demo Mode
                </>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {connected
              ? `App key: ${status?.appKey ?? '****'} · Region: ${
                  status?.region?.toUpperCase() ?? 'MY'
                }`
              : 'Connect your TikTok Shop Affiliate account to fetch real products, commissions, and orders.'}
          </p>
          {status?.lastConnected && (
            <p className="text-xs text-muted-foreground mt-1">
              Last connected:{' '}
              {new Date(status.lastConnected).toLocaleString('en-MY')}
            </p>
          )}
        </div>
        <Button
          variant={connected ? 'outline' : 'default'}
          className={
            connected
              ? 'shrink-0'
              : 'shrink-0 bg-shopee hover:bg-shopee-dark text-white'
          }
          onClick={handleToggle}
          disabled={isToggling}
        >
          {isToggling ? (
            <Loader2 className="size-4 animate-spin" />
          ) : connected ? (
            <Unplug className="size-4" />
          ) : (
            <Plug className="size-4" />
          )}
          {connected ? 'Disconnect' : 'Connect TikTok'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Earnings Summary Card ─────────────────────────────────────

function EarningsSummaryCard({
  summary,
  isLoading,
  source,
}: {
  summary: CommissionSummary | undefined
  isLoading: boolean
  source: 'api' | 'mock' | null
}) {
  const stats = [
    {
      label: 'Total Commission',
      value: summary?.totalCommission ?? 0,
      color: 'text-shopee',
    },
    {
      label: 'Pending',
      value: summary?.pendingCommission ?? 0,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Confirmed',
      value: summary?.confirmedCommission ?? 0,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Paid Out',
      value: summary?.paidCommission ?? 0,
      color: 'text-primary',
    },
  ]

  return (
    <Card className="py-4">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-shopee" />
            <h3 className="font-semibold">TikTok Earnings (30 days)</h3>
          </div>
          {source && (
            <Badge
              variant="outline"
              className={
                source === 'api'
                  ? 'text-[10px] border-emerald-300 text-emerald-700 dark:text-emerald-400 dark:border-emerald-700 gap-1'
                  : 'text-[10px] border-amber-300 text-amber-700 dark:text-amber-400 dark:border-amber-700 gap-1'
              }
            >
              {source === 'api' ? (
                <>
                  <Zap className="size-3" />
                  Live from TikTok API
                </>
              ) : (
                <>
                  <Package className="size-3" />
                  Demo Data
                </>
              )}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              {isLoading ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <p className={`text-lg font-bold ${stat.color}`}>
                  {formatRM(stat.value)}
                </p>
              )}
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">Conversion rate: </span>
              <span className="font-medium">
                {isLoading ? '...' : `${(summary?.conversionRate ?? 0).toFixed(1)}%`}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total orders: </span>
              <span className="font-medium">
                {isLoading ? '...' : (summary?.totalOrders ?? 0).toLocaleString('en-MY')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Clicks: </span>
              <span className="font-medium">
                {isLoading ? '...' : (summary?.clickCount ?? 0).toLocaleString('en-MY')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ────────────────────────────────────────────

export function TikTokPage() {
  const qc = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [sortBy, setSortBy] = useState<string>('trend')
  const [visibleCount, setVisibleCount] = useState(12)

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 500)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setVisibleCount(12)
  }

  const handleCategoryChange = (value: string) => {
    setActiveCategory(value)
    setVisibleCount(12)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setVisibleCount(12)
  }

  // ─── Queries ────────────────────────────────────────────────

  // Connection status
  const { data: connectStatus, isLoading: connectLoading } = useQuery({
    queryKey: ['tiktok', 'connect-status'],
    queryFn: async (): Promise<ConnectStatus> => {
      const res = await fetch('/api/tiktok/connect', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load connection status')
      return res.json()
    },
    staleTime: 30_000,
  })

  // Product search
  const {
    data: searchResult,
    isLoading: isSearching,
    isError: searchError,
  } = useQuery({
    queryKey: ['tiktok', 'products', debouncedQuery, sortBy],
    queryFn: async (): Promise<SearchResult> => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        sort: sortBy,
        page: '1',
        limit: '60',
      })
      const res = await fetch(`/api/tiktok/products?${params.toString()}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Failed to search TikTok products')
      return res.json()
    },
    staleTime: 60_000,
  })

  // Commissions summary
  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['tiktok', 'commissions', 'summary'],
    queryFn: async (): Promise<CommissionsResponse> => {
      const res = await fetch('/api/tiktok/commissions?limit=1', {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Failed to load commissions')
      return res.json()
    },
    staleTime: 60_000,
  })

  // ─── Mutations ──────────────────────────────────────────────

  const generateLinkMutation = useMutation({
    mutationFn: async (
      product: TikTokProduct
    ): Promise<GenerateLinkResponse & { productId: string }> => {
      const res = await fetch('/api/tiktok/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.productId,
          productUrl: product.productLink,
          productName: product.title,
          productImage: product.imageUrl,
          productPrice: product.price,
          commissionRate: product.commissionRate,
          category: product.category,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to generate link')
      }
      const data = (await res.json()) as GenerateLinkResponse
      return { ...data, productId: product.productId }
    },
    onSuccess: (data) => {
      // Patch the cached search results so the card flips to "Copy Link"
      qc.setQueryData<SearchResult>(
        ['tiktok', 'products', debouncedQuery, sortBy],
        (old) => {
          if (!old) return old
          return {
            ...old,
            products: old.products.map((p) =>
              p.productId === data.productId
                ? {
                    ...p,
                    affiliateLink: data.link.shortUrl,
                    source: data.source === 'api' ? 'api' : p.source,
                  }
                : p
            ),
          }
        }
      )
      toast.success('TikTok affiliate link generated!', {
        description: `Source: ${data.source === 'api' ? 'Live API' : 'Demo'} · Tracking ID: ${data.link.trackingId.slice(0, 12)}…`,
      })
    },
    onError: (err) => {
      toast.error('Failed to generate affiliate link', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    },
  })

  const handleGenerateLink = useCallback(
    (product: TikTokProduct) => {
      generateLinkMutation.mutate(product)
    },
    [generateLinkMutation]
  )

  // ─── Derived state ──────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    if (!searchResult?.products) return []
    let result = searchResult.products
    if (activeCategory !== 'All') {
      result = result.filter(
        (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
      )
    }
    return result
  }, [searchResult, activeCategory])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  const handleLoadMore = () => setVisibleCount((p) => p + 8)

  const apiSource = searchResult?.source ?? null
  const generatingProductId = generateLinkMutation.variables?.productId ?? null

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">TikTok Shop Affiliate</h1>
          <Badge className="bg-shopee/10 text-shopee border-0 gap-1 text-[10px]">
            <Music2 className="size-3" />
            MY Market
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Search viral TikTok Shop products, generate affiliate links, and track
          your Malaysian commissions — semua dalam satu tempat.
        </p>
      </div>

      {/* Connection Card */}
      <ConnectionCard status={connectStatus} />

      {/* Earnings Summary */}
      <EarningsSummaryCard
        summary={commissions?.summary}
        isLoading={commissionsLoading}
        source={commissions?.source ?? null}
      />

      {/* Demo Mode Banner */}
      {!connectLoading && !connectStatus?.connected && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 py-3">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  TikTok Shop API not connected
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  You are viewing demo data with 45 realistic Malaysian TikTok
                  Shop products. Connect your TikTok Shop Affiliate API for real
                  affiliate links and live commission data.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Source indicator when results are loaded */}
      {apiSource && !isSearching && (
        <div className="flex items-center gap-2">
          {apiSource === 'api' ? (
            <Badge className="bg-emerald-500 text-white border-0 gap-1 text-[10px]">
              <Zap className="size-3" />
              Live from TikTok Shop API
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-300 dark:border-amber-700 gap-1 text-[10px]"
            >
              <Package className="size-3" />
              Demo Data
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {searchResult?.total ?? 0} products found
          </span>
        </div>
      )}

      {/* AI / Trending Picks Banner (TikTok aesthetic) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-hermes/20 bg-hermes/5 dark:bg-hermes/10 py-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-hermes text-white rounded-md px-2.5 py-1 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                Hermes AI · TikTok Trending
              </div>
              <Badge
                variant="outline"
                className="text-[10px] text-hermes border-hermes/30 gap-1"
              >
                <Flame className="size-3" />
                Hot Right Now
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Discover viral Malaysian TikTok Shop products with high commission
              rates. Search below to explore the full catalogue of 45+ products.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search TikTok Shop — e.g. Garnier, Tudung, Xiaomi, Maggi..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search TikTok Shop products"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-shopee" />
          )}
        </div>
        <Select
          value={sortBy}
          onValueChange={(val) => {
            handleSortChange(val)
          }}
        >
          <SelectTrigger
            className="w-full sm:w-[220px] h-10"
            aria-label="Sort by"
          >
            <SlidersHorizontal className="size-4" />
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

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={(val) => {
          handleCategoryChange(val)
        }}
      >
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {searchError ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <AlertTriangle className="size-12 mb-3 text-amber-500" />
              <p className="text-sm font-medium">
                Failed to load TikTok Shop products
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() =>
                  qc.invalidateQueries({ queryKey: ['tiktok', 'products'] })
                }
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </motion.div>
          ) : isSearching ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <Package className="size-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs mt-1">
                Try a different search term or category.
              </p>
            </motion.div>
          ) : (
            <>
              {/* TikTok-style 5-column grid on XL screens (vertical video aesthetic) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                <AnimatePresence mode="popLayout">
                  {visibleProducts.map((product) => (
                    <TikTokProductCard
                      key={product.id}
                      product={product}
                      onGenerateLink={handleGenerateLink}
                      isGenerating={
                        generatingProductId === product.productId
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    className="min-w-[200px]"
                  >
                    <ChevronDown className="size-4" />
                    Load More Products
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
