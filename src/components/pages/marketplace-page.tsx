'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Store,
  Sparkles,
  Star,
  Download,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Eye,
  Tag,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  X,
  Check,
  CreditCard,
  Upload,
  ArrowRight,
  ArrowLeft,
  Crown,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { toast } from 'sonner'

import {
  CATEGORY_META,
  getCategoryMeta,
  NICHE_META,
  PLATFORM_META,
  type CreateListingRequest,
  type ListingCategory,
  type ListingNiche,
  type ListingPlatform,
  type ListingSort,
  type MarketplaceListing,
  type MarketplaceListingDetailResponse,
  type MarketplaceListingsResponse,
  type PaymentMethod,
  type Purchase,
  type PurchaseResponse,
  type SellerDashboard,
} from '@/lib/marketplace/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRM(value: number): string {
  return `RM ${value.toFixed(2)}`
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function platformBadgeClass(platform: ListingPlatform): string {
  return PLATFORM_META[platform].color
}

// ─── Filter state ───────────────────────────────────────────────────────────

interface FilterState {
  categories: ListingCategory[]
  platform: ListingPlatform | 'all'
  niche: ListingNiche | 'all'
  priceRange: [number, number]
  sort: ListingSort
  query: string
}

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  platform: 'all',
  niche: 'all',
  priceRange: [0, 500],
  sort: 'popular',
  query: '',
}

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as ListingCategory[]
const ALL_NICHES = Object.keys(NICHE_META) as ListingNiche[]
const ALL_PLATFORMS: (ListingPlatform | 'all')[] = [
  'all',
  'shopee',
  'tiktok',
  'lazada',
]

// ─── Page Component ─────────────────────────────────────────────────────────

export function MarketplacePage() {
  const [tab, setTab] = useState<'browse' | 'seller'>('browse')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [detailListing, setDetailListing] = useState<MarketplaceListing | null>(null)
  const [sellDialogOpen, setSellDialogOpen] = useState(false)
  const [purchaseTarget, setPurchaseTarget] = useState<MarketplaceListing | null>(null)

  const queryClient = useQueryClient()

  // ─── Listings query ────────────────────────────────────────────────────
  const listingsQuery = useQuery<MarketplaceListingsResponse>({
    queryKey: ['marketplace', 'listings', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.categories.length > 0) {
        params.set('category', filters.categories.join(','))
      }
      params.set('platform', filters.platform)
      params.set('niche', filters.niche)
      params.set('sort', filters.sort)
      params.set('minPrice', String(filters.priceRange[0]))
      params.set('maxPrice', String(filters.priceRange[1]))
      if (filters.query.trim()) params.set('q', filters.query.trim())

      const res = await fetch(`/api/marketplace/listings?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch listings')
      return res.json()
    },
    staleTime: 30_000,
  })

  // ─── Listing detail query (opened on card click) ──────────────────────
  const detailQuery = useQuery<MarketplaceListingDetailResponse>({
    queryKey: ['marketplace', 'listing', detailListing?.id],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/listings/${detailListing!.id}`)
      if (!res.ok) throw new Error('Failed to fetch listing detail')
      return res.json()
    },
    enabled: !!detailListing,
    staleTime: 60_000,
  })

  // ─── Seller dashboard query ───────────────────────────────────────────
  const sellerQuery = useQuery<SellerDashboard>({
    queryKey: ['marketplace', 'seller'],
    queryFn: async () => {
      const res = await fetch('/api/marketplace/seller')
      if (!res.ok) throw new Error('Failed to fetch seller dashboard')
      return res.json()
    },
    staleTime: 30_000,
  })

  // ─── Purchase mutation ────────────────────────────────────────────────
  const purchaseMutation = useMutation<PurchaseResponse, Error, { listingId: string; paymentMethod: PaymentMethod }>({
    mutationFn: async ({ listingId, paymentMethod }) => {
      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, paymentMethod }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Purchase failed')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success('Purchase successful! Download link ready.', {
        description: `${data.listing.title} — ${formatRM(data.purchase.amount)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['marketplace'] })
    },
    onError: (err) => {
      toast.error(err.message || 'Purchase failed')
    },
  })

  // ─── Sell (create listing) mutation ───────────────────────────────────
  const sellMutation = useMutation<
    { success: boolean; listing: MarketplaceListing },
    Error,
    CreateListingRequest
  >({
    mutationFn: async (body) => {
      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to list content')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success('Listing published!', {
        description: `${data.listing.title} is now live on the marketplace.`,
      })
      setSellDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['marketplace'] })
      setTab('seller')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to publish listing')
    },
  })

  // ─── Filter handlers ──────────────────────────────────────────────────
  const toggleCategory = (cat: ListingCategory) => {
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }))
  }

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.categories.length > 0) n += filters.categories.length
    if (filters.platform !== 'all') n++
    if (filters.niche !== 'all') n++
    if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 500) n++
    if (filters.query.trim()) n++
    return n
  }, [filters])

  const listings = listingsQuery.data?.listings ?? []
  const featured = listingsQuery.data?.featured ?? []
  const total = listingsQuery.data?.total ?? 0

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3">
            <Store className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Affiliate Content Marketplace
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Beli & jual content templates — scripts, captions, hashtags, designs.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setSellDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Sell Your Content
        </Button>
      </motion.div>

      {/* ─── Tabs: Browse | Seller Dashboard ──────────────────────── */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'browse' | 'seller')}>
        <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-grid">
          <TabsTrigger value="browse">
            <Store className="h-4 w-4 mr-2" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="seller">
            <TrendingUp className="h-4 w-4 mr-2" />
            Seller Dashboard
          </TabsTrigger>
        </TabsList>

        {/* ─── Browse Tab ─────────────────────────────────────────── */}
        <TabsContent value="browse" className="space-y-6 mt-4">
          {/* Featured carousel */}
          {featured.length > 0 && (
            <Card className="overflow-hidden border-emerald-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Featured Trending
                </CardTitle>
                <CardDescription>Top 5 hottest templates right now</CardDescription>
              </CardHeader>
              <CardContent>
                <Carousel
                  opts={{ align: 'start', loop: false }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {featured.map((listing, idx) => (
                      <CarouselItem
                        key={listing.id}
                        className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                      >
                        <FeaturedCard
                          listing={listing}
                          rank={idx + 1}
                          onClick={() => setDetailListing(listing)}
                          onBuy={() => setPurchaseTarget(listing)}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-1" />
                  <CarouselNext className="right-1" />
                </Carousel>
              </CardContent>
            </Card>
          )}

          {/* Search + mobile filter toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates, sellers, tags..."
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.sort}
                onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as ListingSort }))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setMobileFiltersOpen((v) => !v)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Main layout: sidebar + grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filter sidebar — desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <FilterSidebar
                filters={filters}
                onToggleCategory={toggleCategory}
                onPlatformChange={(p) => setFilters((f) => ({ ...f, platform: p }))}
                onNicheChange={(n) => setFilters((f) => ({ ...f, niche: n }))}
                onPriceChange={(range) => setFilters((f) => ({ ...f, priceRange: range as [number, number] }))}
                onReset={resetFilters}
                activeCount={activeFilterCount}
              />
            </aside>

            {/* Filter sidebar — mobile (collapsible) */}
            {mobileFiltersOpen && (
              <div className="lg:hidden">
                <FilterSidebar
                  filters={filters}
                  onToggleCategory={toggleCategory}
                  onPlatformChange={(p) => setFilters((f) => ({ ...f, platform: p }))}
                  onNicheChange={(n) => setFilters((f) => ({ ...f, niche: n }))}
                  onPriceChange={(range) => setFilters((f) => ({ ...f, priceRange: range as [number, number] }))}
                  onReset={() => {
                    resetFilters()
                    setMobileFiltersOpen(false)
                  }}
                  activeCount={activeFilterCount}
                />
              </div>
            )}

            {/* Main grid */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {listingsQuery.isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-pulse">Loading templates...</span>
                    </span>
                  ) : (
                    <span>
                      <span className="font-semibold text-foreground">{total}</span>{' '}
                      {total === 1 ? 'template' : 'templates'} found
                    </span>
                  )}
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <X className="h-3 w-3 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>

              {listingsQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ListingCardSkeleton key={i} />
                  ))}
                </div>
              ) : listingsQuery.isError ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-destructive mb-3">
                      Failed to load marketplace listings.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => listingsQuery.refetch()}
                    >
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : listings.length === 0 ? (
                <EmptyState onReset={resetFilters} />
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                  {listings.map((listing, idx) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      index={idx}
                      onClick={() => setDetailListing(listing)}
                      onBuy={() => setPurchaseTarget(listing)}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── Seller Dashboard Tab ─────────────────────────────── */}
        <TabsContent value="seller" className="mt-4">
          <SellerDashboardSection query={sellerQuery} />
        </TabsContent>
      </Tabs>

      {/* ─── Listing Detail Dialog ──────────────────────────────── */}
      <ListingDetailDialog
        listing={detailListing}
        detail={detailQuery.data}
        isLoading={detailQuery.isLoading}
        isOpen={!!detailListing}
        onClose={() => setDetailListing(null)}
        onBuy={(l) => {
          setDetailListing(null)
          setPurchaseTarget(l)
        }}
        onSelectRelated={(l) => setDetailListing(l)}
      />

      {/* ─── Purchase Confirmation Dialog ──────────────────────── */}
      <PurchaseDialog
        listing={purchaseTarget}
        isOpen={!!purchaseTarget}
        onClose={() => setPurchaseTarget(null)}
        onConfirm={async (method) => {
          if (!purchaseTarget) return
          await purchaseMutation.mutateAsync({
            listingId: purchaseTarget.id,
            paymentMethod: method,
          })
          setPurchaseTarget(null)
        }}
        isProcessing={purchaseMutation.isPending}
        purchaseResult={purchaseMutation.data ?? null}
      />

      {/* ─── Sell Dialog ────────────────────────────────────────── */}
      <SellDialog
        isOpen={sellDialogOpen}
        onClose={() => setSellDialogOpen(false)}
        onSubmit={(body) => sellMutation.mutate(body)}
        isSubmitting={sellMutation.isPending}
      />
    </div>
  )
}

// ─── Filter Sidebar ─────────────────────────────────────────────────────────

interface FilterSidebarProps {
  filters: FilterState
  onToggleCategory: (c: ListingCategory) => void
  onPlatformChange: (p: ListingPlatform | 'all') => void
  onNicheChange: (n: ListingNiche | 'all') => void
  onPriceChange: (range: number[]) => void
  onReset: () => void
  activeCount: number
}

function FilterSidebar({
  filters,
  onToggleCategory,
  onPlatformChange,
  onNicheChange,
  onPriceChange,
  onReset,
  activeCount,
}: FilterSidebarProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-xs">{activeCount}</Badge>
            )}
          </CardTitle>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs">
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Categories */}
        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
            Category
          </Label>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {ALL_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 cursor-pointer text-sm hover:text-foreground"
              >
                <Checkbox
                  checked={filters.categories.includes(cat)}
                  onCheckedChange={() => onToggleCategory(cat)}
                />
                <span className="text-base mr-1">{getCategoryMeta(cat).emoji}</span>
                <span>{getCategoryMeta(cat).label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Platform */}
        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
            Platform
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_PLATFORMS.map((p) => (
              <Button
                key={p}
                variant={filters.platform === p ? 'default' : 'outline'}
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => onPlatformChange(p)}
              >
                {p === 'all' ? '🌐 All' : PLATFORM_META[p as ListingPlatform].label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Niche */}
        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
            Niche
          </Label>
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={filters.niche === 'all' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => onNicheChange('all')}
            >
              All
            </Button>
            {ALL_NICHES.map((n) => (
              <Button
                key={n}
                variant={filters.niche === n ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => onNicheChange(n)}
              >
                {NICHE_META[n].emoji} {NICHE_META[n].label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price range */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Price Range
            </Label>
            <span className="text-xs font-medium">
              {formatRM(filters.priceRange[0])} — {formatRM(filters.priceRange[1])}
            </span>
          </div>
          <Slider
            min={0}
            max={500}
            step={10}
            value={filters.priceRange}
            onValueChange={onPriceChange}
            className="mt-3"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Featured Card ──────────────────────────────────────────────────────────

interface FeaturedCardProps {
  listing: MarketplaceListing
  rank: number
  onClick: () => void
  onBuy: () => void
}

function FeaturedCard({ listing, rank, onClick, onBuy }: FeaturedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-emerald-500/40 transition-all h-full"
        onClick={onClick}
      >
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={listing.previewUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <Crown className="h-3 w-3" />
            #{rank}
          </div>
          <div className="absolute top-2 right-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-700">
              {formatRM(listing.price)}
            </Badge>
          </div>
        </div>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
            {listing.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs">
            <Badge variant="outline" className="text-xs">
              {getCategoryMeta(listing.category).emoji} {getCategoryMeta(listing.category).label}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="font-medium">{listing.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({listing.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Download className="h-3 w-3" />
              {formatNumber(listing.downloads)}
            </div>
          </div>
          <Button
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={(e) => {
              e.stopPropagation()
              onBuy()
            }}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Buy Now
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Listing Card ───────────────────────────────────────────────────────────

interface ListingCardProps {
  listing: MarketplaceListing
  index: number
  onClick: () => void
  onBuy: () => void
}

function ListingCard({ listing, index, onClick, onBuy }: ListingCardProps) {
  const discount = listing.originalPrice
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -4 }}
    >
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-emerald-500/40 transition-all h-full flex flex-col group"
        onClick={onClick}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={listing.previewUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge className="bg-background/95 text-foreground hover:bg-background/95 backdrop-blur">
              {getCategoryMeta(listing.category).emoji} {getCategoryMeta(listing.category).label}
            </Badge>
            {discount > 0 && (
              <Badge className="bg-rose-600 hover:bg-rose-600">-{discount}%</Badge>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${platformBadgeClass(
                listing.platform,
              )}`}
            >
              {PLATFORM_META[listing.platform].label}
            </span>
          </div>
          {/* Hover quick preview */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
            <div className="text-white text-xs line-clamp-3 w-full">
              {listing.previewSnippet.replace(/\[WATERMARKED PREVIEW\]/g, '').trim()}
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1 flex flex-col gap-2">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
            {listing.title}
          </h3>

          {/* Seller */}
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={listing.sellerAvatar} alt={listing.sellerName} />
              <AvatarFallback className="text-[10px]">
                {getInitials(listing.sellerName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {listing.sellerName}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="font-medium">{listing.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({listing.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Download className="h-3 w-3" />
              {formatNumber(listing.downloads)}
            </div>
          </div>

          {/* Niche tag */}
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              {NICHE_META[listing.niche].emoji} {NICHE_META[listing.niche].label}
            </Badge>
            {listing.tags.slice(0, 1).map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>

          <Separator />

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <div>
              <div className="text-lg font-bold text-emerald-600">
                {formatRM(listing.price)}
              </div>
              {listing.originalPrice && (
                <div className="text-xs text-muted-foreground line-through">
                  {formatRM(listing.originalPrice)}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onClick() }}>
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={(e) => {
                  e.stopPropagation()
                  onBuy()
                }}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Buy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Listing Card Skeleton ──────────────────────────────────────────────────

function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <Card>
      <CardContent className="p-12 text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg">No templates found</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Try adjusting your filters or search query. Maybe broaden the price range
          or remove some category filters.
        </p>
        <Button onClick={onReset} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Clear all filters
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Listing Detail Dialog ──────────────────────────────────────────────────

interface ListingDetailDialogProps {
  listing: MarketplaceListing | null
  detail: MarketplaceListingDetailResponse | undefined
  isLoading: boolean
  isOpen: boolean
  onClose: () => void
  onBuy: (listing: MarketplaceListing) => void
  onSelectRelated: (listing: MarketplaceListing) => void
}

function ListingDetailDialog({
  listing,
  detail,
  isLoading,
  isOpen,
  onClose,
  onBuy,
  onSelectRelated,
}: ListingDetailDialogProps) {
  if (!listing) return null

  // Use detail data if available, fall back to listing
  const current = detail?.listing ?? listing
  const reviews = detail?.reviews ?? []
  const related = detail?.related ?? []
  const discount = current.originalPrice
    ? Math.round(((current.originalPrice - current.price) / current.originalPrice) * 100)
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh]">
          {/* Left: preview (watermarked) */}
          <div className="relative bg-muted aspect-square md:aspect-auto md:max-h-[90vh] overflow-hidden">
            <img
              src={current.previewUrl}
              alt={current.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/30 text-white/70 text-5xl font-bold rotate-[-30deg] select-none">
                PREVIEW
              </div>
            </div>
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <Badge className="bg-background/95 text-foreground backdrop-blur">
                {getCategoryMeta(current.category).emoji} {getCategoryMeta(current.category).label}
              </Badge>
              {discount > 0 && (
                <Badge className="bg-rose-600">-{discount}% OFF</Badge>
              )}
            </div>
          </div>

          {/* Right: details */}
          <div className="flex flex-col max-h-[90vh] overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                <DialogHeader className="space-y-2 text-left">
                  <DialogTitle className="text-xl leading-tight">
                    {current.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    {current.description}
                  </DialogDescription>
                </DialogHeader>

                {/* Seller + stats row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={current.sellerAvatar} alt={current.sellerName} />
                      <AvatarFallback className="text-xs">
                        {getInitials(current.sellerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{current.sellerName}</div>
                      <div className="text-xs text-muted-foreground">Seller</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span className="font-medium">{current.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({current.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Download className="h-3 w-3" />
                      {formatNumber(current.downloads)}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white ${platformBadgeClass(
                      current.platform,
                    )}`}
                  >
                    {PLATFORM_META[current.platform].label}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {NICHE_META[current.niche].emoji} {NICHE_META[current.niche].label}
                  </Badge>
                  {current.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">What you get</h4>
                  <ul className="space-y-1.5">
                    {current.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Preview snippet (watermarked) */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Watermarked Preview
                  </h4>
                  <div className="relative bg-muted/50 rounded-lg p-3 text-xs whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {current.previewSnippet}
                    <div className="absolute top-2 right-2 text-[10px] text-muted-foreground/60 font-bold">
                      PREVIEW
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    🔒 Full content unlocked after purchase.
                  </p>
                </div>

                <Separator />

                {/* Reviews */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Reviews ({reviews.length})
                  </h4>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviews yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {reviews.map((r) => (
                        <div key={r.id} className="border-l-2 border-muted pl-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={r.reviewerAvatar} alt={r.reviewerName} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(r.reviewerName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{r.reviewerName}</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < r.rating
                                      ? 'fill-amber-500 text-amber-500'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {relativeTime(r.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Related */}
                {related.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Related templates</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {related.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => onSelectRelated(r)}
                            className="text-left rounded-lg border border-border hover:border-emerald-500/40 hover:bg-muted/50 transition-colors overflow-hidden"
                          >
                            <div className="aspect-[4/3] bg-muted">
                              <img
                                src={r.previewUrl}
                                alt={r.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="p-2">
                              <div className="text-xs font-medium line-clamp-1">{r.title}</div>
                              <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                                {formatRM(r.price)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Sticky buy bar */}
            <div className="border-t bg-background p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatRM(current.price)}
                </div>
                {current.originalPrice && (
                  <div className="text-xs text-muted-foreground line-through">
                    {formatRM(current.originalPrice)}
                  </div>
                )}
              </div>
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 flex-1 max-w-xs"
                onClick={() => onBuy(current)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Now {formatRM(current.price)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Purchase Dialog ────────────────────────────────────────────────────────

interface PurchaseDialogProps {
  listing: MarketplaceListing | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (method: PaymentMethod) => Promise<void>
  isProcessing: boolean
  purchaseResult: PurchaseResponse | null
}

function PurchaseDialog({
  listing,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  purchaseResult,
}: PurchaseDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>('billplz')

  if (!listing) return null

  const isComplete = !!purchaseResult && purchaseResult.purchase.listingId === listing.id

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o && !isProcessing) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        {isComplete && purchaseResult ? (
          // Success state
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl">Purchase Successful! 🎉</DialogTitle>
              <DialogDescription>
                You now own <span className="font-semibold text-foreground">{purchaseResult.listing.title}</span>.
                Download your content below.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-lg p-3 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-medium">{formatRM(purchaseResult.purchase.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium uppercase">{purchaseResult.purchase.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase ID</span>
                <span className="font-medium font-mono text-[10px]">{purchaseResult.purchase.id}</span>
              </div>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                toast.success('Download started! Check your files.')
                navigator.clipboard?.writeText(purchaseResult.purchase.downloadUrl)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Content
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          // Checkout state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Complete Your Purchase
              </DialogTitle>
              <DialogDescription>
                You are about to buy this template from {listing.sellerName}.
              </DialogDescription>
            </DialogHeader>

            {/* Listing summary */}
            <div className="flex items-center gap-3 border rounded-lg p-3">
              <img
                src={listing.previewUrl}
                alt={listing.title}
                className="w-16 h-16 rounded-md object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-1">{listing.title}</div>
                <div className="text-xs text-muted-foreground">
                  {getCategoryMeta(listing.category).emoji} {getCategoryMeta(listing.category).label}
                </div>
                <div className="text-lg font-bold text-emerald-600 mt-1">
                  {formatRM(listing.price)}
                </div>
              </div>
            </div>

            {/* Payment method selector */}
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                Payment Method
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMethod('billplz')}
                  className={`flex flex-col items-center gap-1 p-3 border-2 rounded-lg transition-colors ${
                    method === 'billplz'
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs font-medium">Billplz</span>
                  <span className="text-[10px] text-muted-foreground">FPX / Cards</span>
                </button>
                <button
                  onClick={() => setMethod('stripe')}
                  className={`flex flex-col items-center gap-1 p-3 border-2 rounded-lg transition-colors ${
                    method === 'stripe'
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs font-medium">Stripe</span>
                  <span className="text-[10px] text-muted-foreground">International</span>
                </button>
              </div>
            </div>

            {/* Fee breakdown */}
            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listing Price</span>
                <span>{formatRM(listing.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marketplace Fee (15%)</span>
                <span>{formatRM(listing.price * 0.15)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="text-emerald-600">{formatRM(listing.price)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={() => onConfirm(method)}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-pulse">Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm & Pay {formatRM(listing.price)}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Sell Dialog ────────────────────────────────────────────────────────────

interface SellDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (body: CreateListingRequest) => void
  isSubmitting: boolean
}

function SellDialog({ isOpen, onClose, onSubmit, isSubmitting }: SellDialogProps) {
  const [form, setForm] = useState<CreateListingRequest>({
    title: '',
    description: '',
    category: 'video_scripts',
    platform: 'all',
    niche: 'beauty',
    price: 19.9,
    originalPrice: undefined,
    previewSnippet: '',
    contentBody: '',
    features: [],
    tags: [],
  })
  const [featureInput, setFeatureInput] = useState('')
  const [tagInput, setTagInput] = useState('')

  const update = <K extends keyof CreateListingRequest>(
    key: K,
    value: CreateListingRequest[K],
  ) => setForm((f) => ({ ...f, [key]: value }))

  const addFeature = () => {
    const v = featureInput.trim()
    if (!v) return
    update('features', [...(form.features ?? []), v])
    setFeatureInput('')
  }

  const removeFeature = (i: number) => {
    update('features', (form.features ?? []).filter((_, idx) => idx !== i))
  }

  const addTag = () => {
    const v = tagInput.trim().toLowerCase()
    if (!v) return
    if ((form.tags ?? []).includes(v)) return
    update('tags', [...(form.tags ?? []), v])
    setTagInput('')
  }

  const removeTag = (i: number) => {
    update('tags', (form.tags ?? []).filter((_, idx) => idx !== i))
  }

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error('Title is required')
    if (form.title.length < 5) return toast.error('Title must be at least 5 characters')
    if (!form.description.trim() || form.description.length < 20)
      return toast.error('Description must be at least 20 characters')
    if (!form.previewSnippet.trim() || form.previewSnippet.length < 10)
      return toast.error('Preview snippet must be at least 10 characters')
    if (!form.contentBody.trim() || form.contentBody.length < 20)
      return toast.error('Content body must be at least 20 characters')
    if (form.price <= 0) return toast.error('Price must be greater than 0')

    onSubmit({
      ...form,
      features: form.features ?? [],
      tags: form.tags ?? [],
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            List Your Content Template
          </DialogTitle>
          <DialogDescription>
            Publish a template for sale. Buyers will get instant access after purchase.
            You earn 85% of every sale (15% marketplace fee).
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4 p-1">
            {/* Title */}
            <div>
              <Label htmlFor="sell-title">Title *</Label>
              <Input
                id="sell-title"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. 10 TikTok Beauty Video Scripts (Raya Edition)"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="sell-desc">Description *</Label>
              <Textarea
                id="sell-desc"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Describe what buyers will get. Include format, length, niche, language..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.description.length}/500 characters
              </p>
            </div>

            {/* Category + Platform + Niche */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => update('category', v as ListingCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {getCategoryMeta(c).emoji} {getCategoryMeta(c).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Platform *</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => update('platform', v as ListingPlatform)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌐 All Platforms</SelectItem>
                    <SelectItem value="shopee">Shopee</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="lazada">Lazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Niche *</Label>
                <Select
                  value={form.niche}
                  onValueChange={(v) => update('niche', v as ListingNiche)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_NICHES.map((n) => (
                      <SelectItem key={n} value={n}>
                        {NICHE_META[n].emoji} {NICHE_META[n].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sell-price">Price (RM) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    RM
                  </span>
                  <Input
                    id="sell-price"
                    type="number"
                    min={0}
                    step={0.1}
                    value={form.price}
                    onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sell-original">Original Price (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    RM
                  </span>
                  <Input
                    id="sell-original"
                    type="number"
                    min={0}
                    step={0.1}
                    value={form.originalPrice ?? ''}
                    onChange={(e) =>
                      update(
                        'originalPrice',
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    className="pl-9"
                    placeholder="For discount display"
                  />
                </div>
              </div>
            </div>

            {/* Preview snippet */}
            <div>
              <Label htmlFor="sell-preview">Preview Snippet *</Label>
              <Textarea
                id="sell-preview"
                value={form.previewSnippet}
                onChange={(e) => update('previewSnippet', e.target.value)}
                placeholder="A short watermarked preview buyers see before purchasing..."
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Shown to buyers as a teaser. Full content locked until purchase.
              </p>
            </div>

            {/* Content body */}
            <div>
              <Label htmlFor="sell-content">Full Content Body *</Label>
              <Textarea
                id="sell-content"
                value={form.contentBody}
                onChange={(e) => update('contentBody', e.target.value)}
                placeholder="Paste the full template here. Buyers will download this after purchase."
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use [PRODUCT], [PRICE], [AFFILIATE_LINK] as placeholders for buyers to replace.
              </p>
            </div>

            {/* Features */}
            <div>
              <Label>Features (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                  placeholder="e.g. 10 ready-to-shoot scripts"
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  Add
                </Button>
              </div>
              {(form.features ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(form.features ?? []).map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {f}
                      <button
                        onClick={() => removeFeature(i)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label>Tags (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="e.g. tiktok, beauty, raya"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {(form.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(form.tags ?? []).map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <Tag className="h-2.5 w-2.5 mr-1" />
                      {t}
                      <button
                        onClick={() => removeTag(i)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Preview upload (mock) */}
            <div>
              <Label>Preview Image (optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground">
                <Upload className="h-6 w-6 mx-auto mb-1" />
                Click to upload preview image (mock — auto-generated for demo)
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t pt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            You earn{' '}
            <span className="font-semibold text-emerald-600">
              {formatRM(form.price * 0.85)}
            </span>{' '}
            per sale (after 15% fee)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Publishing...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Publish Listing
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Seller Dashboard Section ───────────────────────────────────────────────

function SellerDashboardSection({
  query,
}: {
  query: ReturnType<typeof useQuery<SellerDashboard>>
}) {
  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (query.isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive mb-3">Failed to load seller dashboard.</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const dashboard = query.data!
  const { profile, listings, recentSales, monthly, totalEarnings, totalSales, avgRating, pendingPayout } = dashboard
  const isEmpty = profile.isCurrentUser && listings.length === 0

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="text-lg">{getInitials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{profile.name}</h2>
                {profile.isCurrentUser && (
                  <Badge className="bg-emerald-600">You</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span>📅 Joined {new Date(profile.joinedAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'long' })}</span>
                <span>📦 {profile.listingCount} listings</span>
                <span>⭐ {profile.rating > 0 ? profile.rating.toFixed(1) : '—'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Earnings"
          value={formatRM(totalEarnings)}
          color="text-emerald-600"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Total Sales"
          value={formatNumber(totalSales)}
          color="text-violet-600"
          bgColor="bg-violet-500/10"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Avg Rating"
          value={avgRating > 0 ? avgRating.toFixed(2) : '—'}
          color="text-amber-600"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Pending Payout"
          value={formatRM(pendingPayout)}
          color="text-rose-600"
          bgColor="bg-rose-500/10"
        />
      </div>

      {isEmpty ? (
        // Empty seller state
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-lg">Start selling today!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You haven&apos;t listed any content templates yet. Click &quot;Sell Your Content&quot;
              to publish your first template and start earning passive income.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sales chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Sales — Last 6 Months
              </CardTitle>
              <CardDescription>Monthly sales volume across all your listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue') return [formatRM(value), 'Revenue']
                        return [value, 'Sales']
                      }}
                    />
                    <Bar dataKey="sales" fill="#10b981" radius={[6, 6, 0, 0]} name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Your listings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Your Listings ({listings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {listings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No active listings yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {listings.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <img
                        src={l.previewUrl}
                        alt={l.title}
                        className="w-12 h-12 rounded-md object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">{l.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{getCategoryMeta(l.category).emoji} {getCategoryMeta(l.category).label}</span>
                          <span>·</span>
                          <span>{formatRM(l.price)}</span>
                          <span>·</span>
                          <span>{formatNumber(l.downloads)} downloads</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        ⭐ {l.rating > 0 ? l.rating.toFixed(1) : '—'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent sales */}
          {recentSales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingCart className="h-4 w-4" />
                  Recent Sales ({recentSales.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentSales.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">{s.listingTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {relativeTime(s.purchasedAt)} · {s.paymentMethod.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600">
                        +{formatRM(s.sellerPayout)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bgColor: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${bgColor} ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
