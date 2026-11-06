'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  RefreshCw,
  Zap,
  Plug,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'
import { QUERY_STALE_TIME } from '@/lib/query-config'

// --- Types ---
interface Product {
  id: string
  itemId: number
  name: string
  price: number
  originalPrice?: number
  commissionRate: number
  rating: number
  soldCount: number
  shopName: string
  category: string
  isAiPick?: boolean
  color: string
  source?: 'graphql_api' | 'mock' | 'db' | 'ai_search' | 'empty'
  affiliateLink?: string | null
  deepLink?: string | null
  productLink?: string
}

const CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Living',
  'Beauty',
  'Sports',
  'Food',
] as const

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'commission', label: 'Highest Commission' },
  { value: 'rating', label: 'Best Rating' },
] as const

// Color palette for product cards
const CARD_COLORS = [
  'bg-orange-100 dark:bg-orange-900/30',
  'bg-pink-100 dark:bg-pink-900/30',
  'bg-purple-100 dark:bg-purple-900/30',
  'bg-rose-100 dark:bg-rose-900/30',
  'bg-sky-100 dark:bg-sky-900/30',
  'bg-emerald-100 dark:bg-emerald-900/30',
  'bg-lime-100 dark:bg-lime-900/30',
  'bg-amber-100 dark:bg-amber-900/30',
  'bg-teal-100 dark:bg-teal-900/30',
  'bg-fuchsia-100 dark:bg-fuchsia-900/30',
  'bg-yellow-100 dark:bg-yellow-900/30',
  'bg-cyan-100 dark:bg-cyan-900/30',
]

// --- Helpers ---
function formatSoldCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-3 ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}</span>
    </div>
  )
}

// Map API product item to our Product interface
function mapApiItem(item: Record<string, unknown>, index: number, source: string): Product {
  const priceInfo = Array.isArray(item.price_info) ? item.price_info[0] : null
  const currentPrice = priceInfo ? Number(priceInfo.current_price) / 100 : Number(item.productPrice || item.price || 0)
  const originalPrice = priceInfo ? Number(priceInfo.original_price) / 100 : Number(item.originalPrice || item.original_price || undefined)

  const commissionInfo = item.commission_info as Record<string, unknown> | null
  const commissionRate = commissionInfo
    ? Number(commissionInfo.commission_rate)
    : Number(item.commissionRate || item.commission_rate || 0)

  const imageArr = Array.isArray(item.image) ? item.image : []
  const shopInfo = item.shop_info as Record<string, unknown> | null

  return {
    id: (item.id as string) || (item.item_id as string) || `api-${index}`,
    itemId: Number(item.item_id || item.itemId || 0),
    name: (item.item_name as string) || (item.name as string) || 'Unknown Product',
    price: currentPrice,
    originalPrice: originalPrice !== currentPrice ? originalPrice : undefined,
    commissionRate,
    rating: Number(item.rating_star || item.rating || item.ratingStar || 4.5),
    soldCount: Number(item.sales || item.soldCount || item.clicks || 0),
    shopName: (shopInfo?.shop_name as string) || (item.shopName as string) || (item.shop_name as string) || 'Shopee Seller',
    category: (item.category_id as string) || (item.category as string) || 'general',
    isAiPick: source === 'ai_search',
    color: CARD_COLORS[index % CARD_COLORS.length],
    source: source as Product['source'],
    affiliateLink: (item.affiliate_url as string) || (item.affiliateUrl as string) || null,
    deepLink: (item.deepLink as string) || null,
    productLink: (item.product_link as string) || undefined,
  }
}

// --- Product Card ---
function ProductCard({
  product,
  onGenerateLink,
  generatingLinkId,
}: {
  product: Product
  onGenerateLink: (product: Product) => void
  generatingLinkId: string | null
}) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const [copied, setCopied] = useState(false)
  const commission = product.price * product.commissionRate / 100

  const handleCopyLink = () => {
    if (product.affiliateLink) {
      navigator.clipboard?.writeText(product.affiliateLink).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isGenerating = generatingLinkId === product.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="card-hover overflow-hidden py-0 gap-0">
        {/* Image placeholder */}
        <div
          className={`${product.color} flex items-center justify-center h-44 relative`}
        >
          <ShoppingBag className="size-12 text-muted-foreground/40" />
          {product.isAiPick && (
            <Badge className="absolute top-2 left-2 bg-hermes text-white border-0 text-[10px] px-1.5 py-0.5 gap-1">
              <Sparkles className="size-3" />
              AI Pick
            </Badge>
          )}
          {product.source === 'graphql_api' && (
            <Badge className="absolute top-2 left-2 bg-emerald-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-1">
              <Zap className="size-3" />
              Live
            </Badge>
          )}
          {product.source === 'db' && (
            <Badge className="absolute top-2 left-2 bg-violet-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-1">
              <Package className="size-3" />
              DB
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-destructive text-white border-0 text-[10px] px-1.5 py-0.5">
              -{discount}%
            </Badge>
          )}
        </div>

        <CardContent className="p-4 flex flex-col gap-2">
          <h3 className="text-sm font-medium line-clamp-2 leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-shopee">
              RM{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                RM{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-shopee/10 text-shopee border-0 font-semibold"
              >
                RM{commission.toFixed(2)}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {product.commissionRate}% comm
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <StarRating rating={product.rating} />
            <span className="text-xs text-muted-foreground">
              {formatSoldCount(product.soldCount)} sold
            </span>
          </div>

          <p className="text-xs text-muted-foreground truncate">
            {product.shopName}
          </p>

          {product.affiliateLink ? (
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                className="flex-1 bg-shopee hover:bg-shopee-dark text-white"
                onClick={handleCopyLink}
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
                  <Link2 className="size-3.5" />
                )}
                Regenerate
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full mt-1 bg-shopee hover:bg-shopee-dark text-white"
              onClick={() => onGenerateLink(product)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Link2 className="size-3.5" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Link'}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Product Card Skeleton ---
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0 gap-0">
      <Skeleton className="h-44" />
      <CardContent className="p-4 flex flex-col gap-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-20" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full mt-1" />
      </CardContent>
    </Card>
  )
}

// --- Main Component ---
export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [sortBy, setSortBy] = useState<string>('popular')
  const [visibleCount, setVisibleCount] = useState(8)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // API integration state
  const { setShopeeConnected, setShopeeDataSource } = useAppStore()
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch recommended/featured products (no keyword search - uses DB links)
  const {
    data: featuredData,
    isLoading: isLoadingFeatured,
  } = useQuery({
    queryKey: ['shopee-featured-products'],
    queryFn: async () => {
      const res = await fetch('/api/shopee/products?page_size=8')
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.products,
  })

  // Map featured products
  const featuredProducts = useMemo(() => {
    if (!featuredData?.data?.items) return []
    return (featuredData.data.items as Record<string, unknown>[]).map((item, i) =>
      mapApiItem(item, i, featuredData.meta?.source || 'db')
    )
  }, [featuredData])

  const featuredSource = featuredData?.meta?.source || null

  // Fetch search results
  const {
    data: searchData,
    isLoading: isSearching,
  } = useQuery({
    queryKey: ['shopee-products-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null
      const res = await fetch(`/api/shopee/products?keyword=${encodeURIComponent(searchQuery)}&page_size=20`)
      if (!res.ok) throw new Error('Search failed')
      return res.json()
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: QUERY_STALE_TIME.products,
  })

  // Check connection status
  const { data: statusData } = useQuery({
    queryKey: ['shopee-status'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/shopee/status')
        if (!res.ok) return { connected: false, source: 'mock' }
        return res.json()
      } catch {
        return { connected: false, source: 'mock' }
      }
    },
    staleTime: QUERY_STALE_TIME.marketplace,
  })

  // Update store on status change
  useEffect(() => {
    if (statusData) {
      setShopeeConnected(statusData.connected === true)
      setShopeeDataSource(statusData.source || 'mock')
    }
  }, [statusData, setShopeeConnected, setShopeeDataSource])

  const shopeeConnected = statusData?.connected === true

  // Map search results
  const searchProducts = useMemo(() => {
    if (!searchData?.data?.items) return []
    return (searchData.data.items as Record<string, unknown>[]).map((item, i) =>
      mapApiItem(item, i, searchData.meta?.source || 'db')
    )
  }, [searchData])

  const searchSource = searchData?.meta?.source || null

  // Use search results if searching, otherwise use featured products
  const apiProducts = searchQuery.trim() ? searchProducts : featuredProducts
  const apiSource = searchQuery.trim() ? searchSource : featuredSource
  const hasSearched = searchQuery.trim().length > 0

  // Generate affiliate link for a product
  const handleGenerateLink = async (product: Product) => {
    setGeneratingLinkId(product.id)

    try {
      const res = await fetch('/api/shopee/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: product.itemId || undefined,
          productUrl: product.productLink || undefined,
        }),
      })

      const data = await res.json()

      if (data.link) {
        toast.success('Affiliate link generated!')
        // Refetch to get updated data
      }
    } catch (error) {
      console.error('Generate link error:', error)
      toast.error('Failed to generate affiliate link')
    } finally {
      setGeneratingLinkId(null)
    }
  }

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setVisibleCount(8)
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = apiProducts

    if (activeCategory !== 'All') {
      result = result.filter(
        (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
      )
    }

    switch (sortBy) {
      case 'newest':
        result = [...result].reverse()
        break
      case 'commission':
        result = [...result].sort((a, b) => b.commissionRate - a.commissionRate)
        break
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating)
        break
      default:
        result = [...result].sort((a, b) => b.soldCount - a.soldCount)
    }

    return result
  }, [apiProducts, activeCategory, sortBy])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => prev + 4)
      setIsLoadingMore(false)
    }, 600)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Discover products and generate affiliate links
        </p>
      </div>

      {/* API Not Connected Banner */}
      {!shopeeConnected && (
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
                  Shopee API not connected
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  Connect your Shopee Affiliate API in{' '}
                  <span className="font-semibold">Settings</span> for real affiliate links and commission data. Showing products from your database.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-amber-600 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }))
                }}
              >
                <Plug className="size-3.5 mr-1" />
                Connect
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Source indicator when results are loaded */}
      {apiSource && (
        <div className="flex items-center gap-2">
          {apiSource === 'graphql_api' || apiSource === 'shopee_open_api' ? (
            <Badge className="bg-emerald-500 text-white border-0 gap-1 text-[10px]">
              <Zap className="size-3" />
              Live from Shopee API
            </Badge>
          ) : apiSource === 'db' ? (
            <Badge variant="outline" className="text-violet-600 border-violet-300 dark:border-violet-700 gap-1 text-[10px]">
              <Package className="size-3" />
              From Your Database
            </Badge>
          ) : apiSource === 'ai_search' ? (
            <Badge variant="outline" className="text-hermes border-hermes/30 gap-1 text-[10px]">
              <Sparkles className="size-3" />
              AI-Discovered
            </Badge>
          ) : apiSource === 'empty' ? null : (
            <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-700 gap-1 text-[10px]">
              <Package className="size-3" />
              Demo Data
            </Badge>
          )}
        </div>
      )}

      {/* AI / Featured Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-hermes/20 bg-hermes/5 dark:bg-hermes/10 py-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-hermes text-white rounded-md px-2.5 py-1 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                {shopeeConnected ? 'Live Products' : 'Your Products'}
              </div>
              <Badge variant="outline" className="text-[10px] text-hermes border-hermes/30">
                <TrendingUp className="size-3" />
                From Database
              </Badge>
            </div>
            {isLoadingFeatured ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="py-0 gap-0">
                    <Skeleton className="h-28 rounded-t-xl" />
                    <div className="p-3 flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="size-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">No products in database yet</p>
                <p className="text-xs mt-1">Create affiliate links or connect Shopee API to see products here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredProducts.slice(0, 4).map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Card className="card-hover py-0 gap-0 cursor-pointer">
                      <div
                        className={`${product.color} flex items-center justify-center h-28 relative rounded-t-xl`}
                      >
                        <ShoppingBag className="size-8 text-muted-foreground/40" />
                        <Badge className="absolute top-1.5 left-1.5 bg-hermes text-white border-0 text-[9px] px-1.5 py-0.5 gap-0.5">
                          <Sparkles className="size-2.5" />
                          {shopeeConnected ? 'LIVE' : 'DB'}
                        </Badge>
                      </div>
                      <div className="p-3 flex flex-col gap-1.5">
                        <h4 className="text-xs font-medium line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-shopee">
                            RM{product.price.toFixed(2)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              RM{product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className="text-[9px] px-1.5 py-0 bg-shopee/10 text-shopee border-0 font-semibold">
                            +RM{(product.price * product.commissionRate / 100).toFixed(2)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {product.commissionRate}%
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search Shopee products..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Select
          value={sortBy}
          onValueChange={(val) => {
            setSortBy(val)
            setVisibleCount(8)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10">
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
          setActiveCategory(val)
          setVisibleCount(8)
        }}
      >
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* We only need one TabsContent since we filter manually */}
        <TabsContent value={activeCategory} className="mt-4">
          {!hasSearched && isLoadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : !hasSearched ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <Search className="size-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">Search for products</p>
              <p className="text-xs mt-1">Enter a keyword to search Shopee products</p>
            </motion.div>
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-shopee mb-3" />
              <p className="text-sm text-muted-foreground">Searching Shopee...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <Package className="size-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs mt-1">Try a different search or category</p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onGenerateLink={handleGenerateLink}
                      generatingLinkId={generatingLinkId}
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
                    disabled={isLoadingMore}
                    className="min-w-[200px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-4" />
                        Load More Products
                      </>
                    )}
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
