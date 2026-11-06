'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Sparkles,
  Zap,
  Package,
  Loader2,
  ExternalLink,
  ShoppingBag,
  Star,
  TrendingUp,
  Award,
  Copy,
  Check,
  ArrowRight,
  Layers,
  Filter,
  XCircle,
  Lightbulb,
  Store,
  Music2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

// ─── Types (mirrors /src/lib/matcher/types.ts) ────────────────

type Platform = 'shopee' | 'tiktok' | 'lazada'

interface MatchedPlatformProduct {
  platform: Platform
  productId: string
  title: string
  image: string
  price: number
  originalPrice?: number
  commissionRate: number
  commissionAmount: number
  sales: number
  rating: number
  shopName: string
  category: string
  productLink: string
  deepLink?: string
  isLazMall?: boolean
  isFreeShipping?: boolean
  trendScore?: number
}

interface MatchResult {
  id: string
  name: string
  category: string
  image: string
  relevanceScore: number
  listings: MatchedPlatformProduct[]
  bestPlatform: Platform
  bestCommissionAmount: number
  lowestPrice: number
  highestPrice: number
}

interface MatchSearchResponse {
  query: string
  results: MatchResult[]
  total: number
  platformsSearched: Platform[]
  bestCommissionAmount: number | null
  source: 'mock' | 'api'
}

interface AutoPickResult {
  matchId: string
  productName: string
  platform: Platform
  listing: MatchedPlatformProduct
  commissionAmount: number
  commissionRate: number
  affiliateLink: {
    shortUrl: string
    longUrl: string
    deepLink?: string
    trackingUrl?: string
    trackingId?: string
    expiresAt?: string
  }
  reason: string
  source: 'mock' | 'api'
}

interface AutoPickResponse {
  result: AutoPickResult
  source: 'mock' | 'api'
}

// ─── Constants ────────────────────────────────────────────────

const RECENT_SEARCHES = ['iPhone case', 'Hair dryer', 'Skincare set', 'Earbuds', 'Powerbank', 'Tudung bawal']

const PLATFORM_META: Record<Platform, {
  label: string
  short: string
  icon: typeof Store
  dot: string
  badgeBg: string
  badgeText: string
  ring: string
  avatarBg: string
}> = {
  shopee: {
    label: 'Shopee',
    short: 'S',
    icon: ShoppingBag,
    dot: 'bg-orange-500',
    badgeBg: 'bg-orange-500',
    badgeText: 'text-white',
    ring: 'ring-orange-500',
    avatarBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  },
  tiktok: {
    label: 'TikTok Shop',
    short: 'TT',
    icon: Music2,
    dot: 'bg-neutral-900 dark:bg-neutral-100',
    badgeBg: 'bg-neutral-900 dark:bg-neutral-100',
    badgeText: 'text-white dark:text-neutral-900',
    ring: 'ring-neutral-900 dark:ring-neutral-100',
    avatarBg: 'bg-neutral-900/10 text-neutral-900 dark:bg-neutral-100/10 dark:text-neutral-100',
  },
  lazada: {
    label: 'Lazada',
    short: 'L',
    icon: Store,
    dot: 'bg-purple-600',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    ring: 'ring-purple-600',
    avatarBg: 'bg-purple-600/15 text-purple-600 dark:text-purple-400',
  },
}

// ─── Helpers ──────────────────────────────────────────────────

function formatRM(amount: number): string {
  return `RM ${amount.toFixed(2)}`
}

function formatSold(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

function platformLabel(p: Platform): string {
  return PLATFORM_META[p].label
}

// ─── Recent Searches Chips ────────────────────────────────────

function RecentSearches({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Lightbulb className="size-3" /> Recent:
      </span>
      {RECENT_SEARCHES.map((term) => (
        <button
          key={term}
          type="button"
          onClick={() => onPick(term)}
          className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-shopee/15 hover:text-shopee text-muted-foreground transition-colors border border-transparent hover:border-shopee/30 cursor-pointer"
        >
          {term}
        </button>
      ))}
    </div>
  )
}

// ─── Match Card ───────────────────────────────────────────────

interface MatchCardProps {
  match: MatchResult
  onAutoPick: (match: MatchResult) => void
  onOpenDetail: (match: MatchResult) => void
  isAutoPicking: boolean
  autoPickedId: string | null
}

function MatchCard({
  match,
  onAutoPick,
  onOpenDetail,
  isAutoPicking,
  autoPickedId,
}: MatchCardProps) {
  const best = match.listings[0]
  const platforms = match.listings.map((l) => l.platform)
  const isPicked = autoPickedId === match.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28 }}
    >
      <Card className="h-full flex flex-col overflow-hidden py-0 gap-0">
        {/* Image placeholder */}
        <div className="bg-gradient-to-br from-shopee/10 via-purple-500/5 to-neutral-500/10 flex items-center justify-center h-40 relative">
          <Package className="size-12 text-shopee/40" />

          {/* Relevance score badge */}
          <Badge className="absolute top-2 left-2 bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 border-0 text-[10px] px-1.5 py-0.5 gap-1 backdrop-blur">
            <Sparkles className="size-3 text-shopee" />
            {match.relevanceScore}% match
          </Badge>

          {/* Best platform badge */}
          <Badge className={`absolute top-2 right-2 ${PLATFORM_META[best.platform].badgeBg} ${PLATFORM_META[best.platform].badgeText} border-0 text-[10px] px-1.5 py-0.5 gap-1`}>
            <Award className="size-3" />
            Best
          </Badge>
        </div>

        <CardHeader className="p-4 pb-2 gap-1">
          <CardTitle className="text-sm font-medium line-clamp-2 leading-snug min-h-[2.5rem]">
            {match.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{match.category}</p>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-3">
          {/* Platform badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['shopee', 'tiktok', 'lazada'] as Platform[]).map((p) => {
              const isAvailable = platforms.includes(p)
              const meta = PLATFORM_META[p]
              const Icon = meta.icon
              if (isAvailable) {
                return (
                  <Badge
                    key={p}
                    className={`text-[10px] px-1.5 py-0.5 gap-1 border-0 ${meta.badgeBg} ${meta.badgeText}`}
                  >
                    <Icon className="size-3" />
                    {meta.label}
                  </Badge>
                )
              }
              return (
                <Badge
                  key={p}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0.5 gap-1 text-muted-foreground/60 line-through"
                >
                  <Icon className="size-3" />
                  {meta.label}
                </Badge>
              )
            })}
          </div>

          {/* Best commission highlighted */}
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold">
                Highest Commission
              </span>
              <span className="text-[10px] text-muted-foreground">
                {platformLabel(best.platform)}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {formatRM(best.commissionAmount)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({best.commissionRate}% @ {formatRM(best.price)})
              </span>
            </div>
          </div>

          {/* Price range */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Price range</span>
            <span className="font-medium">
              {formatRM(match.lowestPrice)} – {formatRM(match.highestPrice)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-auto pt-1 flex flex-col gap-2">
            <Button
              size="sm"
              className="w-full bg-shopee hover:bg-shopee-dark text-white"
              onClick={() => onAutoPick(match)}
              disabled={isAutoPicking && isPicked}
            >
              {isAutoPicking && isPicked ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isPicked ? (
                <Check className="size-3.5" />
              ) : (
                <Zap className="size-3.5" />
              )}
              {isAutoPicking && isPicked
                ? 'Picking...'
                : isPicked
                  ? 'Picked!'
                  : 'Auto-Pick Best'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onOpenDetail(match)}
            >
              <Layers className="size-3.5" />
              View on All Platforms
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Match Card Skeleton ──────────────────────────────────────

function MatchCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden py-0 gap-0">
      <Skeleton className="h-40 w-full rounded-none" />
      <CardHeader className="p-4 pb-2 gap-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col gap-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-8 w-full mt-1" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

// ─── Detail Dialog: 3-column platform comparison ──────────────

interface DetailDialogProps {
  match: MatchResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGeneratePlatformLink: (match: MatchResult, listing: MatchedPlatformProduct) => void
  generatingPlatform: Platform | null
}

function DetailDialog({
  match,
  open,
  onOpenChange,
  onGeneratePlatformLink,
  generatingPlatform,
}: DetailDialogProps) {
  if (!match) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Layers className="size-5 text-shopee" />
            {match.name}
          </DialogTitle>
          <DialogDescription>
            Cross-platform comparison · {match.listings.length} platforms · Category: {match.category}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {(['shopee', 'tiktok', 'lazada'] as Platform[]).map((p) => {
            const listing = match.listings.find((l) => l.platform === p)
            const meta = PLATFORM_META[p]
            const Icon = meta.icon
            const isBest = match.bestPlatform === p
            const isGenerating = generatingPlatform === p

            return (
              <Card
                key={p}
                className={`flex flex-col py-0 gap-0 overflow-hidden ${
                  isBest ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <CardHeader className="p-3 gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className={meta.avatarBg}>
                          <Icon className="size-3.5" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold">{meta.label}</span>
                    </div>
                    {isBest && (
                      <Badge className="bg-emerald-500 text-white border-0 text-[9px] px-1.5 py-0 gap-0.5">
                        <Award className="size-2.5" /> Best
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-3 pt-0 flex-1 flex flex-col gap-2">
                  {listing ? (
                    <>
                      <div className="bg-muted/40 rounded-md h-24 flex items-center justify-center">
                        <Package className="size-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs font-medium line-clamp-2 min-h-[2rem]">
                        {listing.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate" title={listing.shopName}>
                        by {listing.shopName}
                      </p>

                      <Separator />

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-semibold">{formatRM(listing.price)}</span>
                        </div>
                        {listing.originalPrice && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Was</span>
                            <span className="text-muted-foreground line-through">
                              {formatRM(listing.originalPrice)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Commission</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatRM(listing.commissionAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Rate</span>
                          <span className="font-medium">{listing.commissionRate}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Rating</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{listing.rating.toFixed(1)}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Sold</span>
                          <span className="font-medium">{formatSold(listing.sales)}</span>
                        </div>
                        {listing.isLazMall && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">LazMall</span>
                            <Badge className="bg-purple-600 text-white border-0 text-[9px] px-1.5 py-0">
                              Yes
                            </Badge>
                          </div>
                        )}
                        {listing.isFreeShipping && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Free Ship</span>
                            <Badge className="bg-emerald-600 text-white border-0 text-[9px] px-1.5 py-0">
                              Yes
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="w-full mt-2 bg-shopee hover:bg-shopee-dark text-white"
                        onClick={() => onGeneratePlatformLink(match, listing)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Zap className="size-3.5" />
                        )}
                        {isGenerating ? 'Generating...' : `Generate Link on ${meta.label}`}
                      </Button>

                      <a
                        href={listing.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-shopee hover:underline text-center mt-1 flex items-center justify-center gap-1"
                      >
                        View product page
                        <ExternalLink className="size-2.5" />
                      </a>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
                      <XCircle className="size-8 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">
                        Not available on {meta.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        Try another platform.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom summary */}
        <div className="mt-3 rounded-lg bg-muted/40 p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="size-4 text-shopee" />
            <span>
              Best commission:{' '}
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {formatRM(match.bestCommissionAmount)}
              </span>{' '}
              on {platformLabel(match.bestPlatform)}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Relevance: {match.relevanceScore}%
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Empty State ──────────────────────────────────────────────

function EmptyState() {
  return (
    <Card className="border-dashed py-12">
      <CardContent className="p-6 sm:p-10 flex flex-col items-center text-center gap-4">
        <div className="relative size-28">
          <div className="absolute inset-0 bg-shopee/10 rounded-full blur-2xl" />
          <div className="relative size-28 rounded-full bg-gradient-to-br from-shopee/15 via-purple-500/10 to-neutral-500/10 flex items-center justify-center">
            <Search className="size-12 text-shopee/60" />
          </div>
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg font-semibold">Search Once. Find Everywhere.</h3>
          <p className="text-sm text-muted-foreground">
            Type a product name above and we&apos;ll search Shopee, TikTok Shop and Lazada
            in one go. Jumpa produk yang sama di semua platform, then auto-pick the one
            that pays you the most commission.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {(['shopee', 'tiktok', 'lazada'] as Platform[]).map((p) => {
            const meta = PLATFORM_META[p]
            const Icon = meta.icon
            return (
              <Badge
                key={p}
                className={`text-[10px] px-2 py-1 gap-1 border-0 ${meta.badgeBg} ${meta.badgeText}`}
              >
                <Icon className="size-3" />
                {meta.label}
              </Badge>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────

function StatsBar({
  results,
  bestCommission,
  isLoading,
}: {
  results: MatchResult[] | undefined
  bestCommission: number | null | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const totalListings = (results ?? []).reduce((sum, r) => sum + r.listings.length, 0)
  const platformCount = new Set<Platform>()
    ;(results ?? []).forEach((r) => r.listings.forEach((l) => platformCount.add(l.platform)))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card className="py-3">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-shopee/10 flex items-center justify-center shrink-0">
            <Package className="size-5 text-shopee" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Products matched</p>
            <p className="text-lg font-bold leading-tight">{results?.length ?? 0}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-purple-600/10 flex items-center justify-center shrink-0">
            <Layers className="size-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Platforms covered</p>
            <p className="text-lg font-bold leading-tight">
              {platformCount.size} <span className="text-xs font-normal text-muted-foreground">/ 3</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">({totalListings} listings)</span>
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Award className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Best commission</p>
            <p className="text-lg font-bold leading-tight text-emerald-700 dark:text-emerald-400">
              {bestCommission != null ? formatRM(bestCommission) : '—'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export function MatcherPage() {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [detailMatch, setDetailMatch] = useState<MatchResult | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [autoPickedId, setAutoPickedId] = useState<string | null>(null)
  const [generatingPlatform, setGeneratingPlatform] = useState<Platform | null>(null)
  const [copiedLinks, setCopiedLinks] = useState<Record<string, boolean>>({})

  // TanStack Query: search across platforms
  const {
    data: search,
    isLoading,
    isFetching,
  } = useQuery<MatchSearchResponse>({
    queryKey: ['matcher', 'search', submittedQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/match?q=${encodeURIComponent(submittedQuery)}&limit=20`,
        { headers: { Accept: 'application/json' } }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Search failed (HTTP ${res.status})`)
      }
      return res.json() as Promise<MatchSearchResponse>
    },
    enabled: submittedQuery.length > 0,
    staleTime: 60_000,
  })

  // Auto-pick mutation (one-click from card)
  const autoPickMutation = useMutation({
    mutationFn: async (match: MatchResult) => {
      const res = await fetch('/api/match/auto-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: match.id,
          productName: match.name,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Auto-pick failed (HTTP ${res.status})`)
      }
      return (await res.json()) as AutoPickResponse
    },
    onMutate: (match) => {
      setAutoPickedId(match.id)
    },
    onSuccess: (data) => {
      const { result } = data
      toast.success(`Auto-picked ${platformLabel(result.platform)}!`, {
        description: `${result.reason}`,
        duration: 5000,
        action: {
          label: 'Copy Link',
          onClick: () => {
            navigator.clipboard?.writeText(result.affiliateLink.shortUrl).catch(() => {})
            toast.success('Affiliate link copied!', {
              description: result.affiliateLink.shortUrl,
            })
          },
        },
      })
    },
    onError: (err: unknown) => {
      toast.error('Auto-pick failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
      setAutoPickedId(null)
    },
    onSettled: () => {
      // Keep the picked highlight for a moment then clear
      setTimeout(() => setAutoPickedId(null), 1500)
      qc.invalidateQueries({ queryKey: ['matcher', 'search'] })
    },
  })

  // Per-platform link generation (from detail dialog)
  const generatePlatformLinkMutation = useMutation({
    mutationFn: async ({
      match,
      listing,
    }: {
      match: MatchResult
      listing: MatchedPlatformProduct
    }) => {
      setGeneratingPlatform(listing.platform)
      const res = await fetch('/api/match/auto-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: match.id,
          productName: match.name,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Generate failed (HTTP ${res.status})`)
      }
      return (await res.json()) as AutoPickResponse
    },
    onSuccess: (data, variables) => {
      const { result } = data
      const linkKey = `${variables.match.id}-${variables.listing.platform}`
      toast.success(`${platformLabel(variables.listing.platform)} link generated!`, {
        description: result.affiliateLink.shortUrl,
        duration: 6000,
        action: {
          label: 'Copy',
          onClick: () => {
            navigator.clipboard?.writeText(result.affiliateLink.shortUrl).catch(() => {})
            setCopiedLinks((prev) => ({ ...prev, [linkKey]: true }))
            setTimeout(() => setCopiedLinks((prev) => ({ ...prev, [linkKey]: false })), 2000)
            toast.success('Copied to clipboard')
          },
        },
      })
    },
    onError: (err: unknown) => {
      toast.error('Failed to generate link', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    },
    onSettled: () => {
      setGeneratingPlatform(null)
    },
  })

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) {
      toast.error('Sila taip sesuatu', { description: 'Type a product name to search.' })
      return
    }
    setSubmittedQuery(q)
  }, [query])

  const handlePickRecent = useCallback((term: string) => {
    setQuery(term)
    setSubmittedQuery(term)
  }, [])

  const handleAutoPick = useCallback(
    (match: MatchResult) => {
      autoPickMutation.mutate(match)
    },
    [autoPickMutation]
  )

  const handleOpenDetail = useCallback((match: MatchResult) => {
    setDetailMatch(match)
    setDetailOpen(true)
  }, [])

  const handleGeneratePlatformLink = useCallback(
    (match: MatchResult, listing: MatchedPlatformProduct) => {
      generatePlatformLinkMutation.mutate({ match, listing })
    },
    [generatePlatformLinkMutation]
  )

  const results = search?.results
  const hasSearched = submittedQuery.length > 0
  const showSkeletons = (isLoading || isFetching) && !results

  const headerCopy = useMemo(
    () => ({
      title: 'Search Once. Find Everywhere.',
      subtitle: 'Cari produk sekali, jumpa di semua platform',
    }),
    []
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Hero header */}
      <Card className="overflow-hidden py-0 gap-0 border-shopee/20">
        <div className="bg-gradient-to-br from-shopee/10 via-purple-500/5 to-transparent p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {headerCopy.title}
                </h1>
                <Badge className="bg-shopee text-white border-0 text-[10px] gap-1">
                  <Sparkles className="size-3" />
                  Cross-Platform
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {headerCopy.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {(['shopee', 'tiktok', 'lazada'] as Platform[]).map((p) => {
                const meta = PLATFORM_META[p]
                const Icon = meta.icon
                return (
                  <div
                    key={p}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${meta.avatarBg}`}
                    title={meta.label}
                  >
                    <Icon className="size-3.5" />
                    <span className="text-xs font-medium hidden sm:inline">{meta.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Search bar */}
      <Card className="py-4">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk... e.g. iPhone case, hair dryer, skincare set"
                className="pl-9 h-12 text-base"
                aria-label="Search products across Shopee, TikTok and Lazada"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 bg-shopee hover:bg-shopee-dark text-white px-6"
              disabled={showSkeletons}
            >
              {showSkeletons ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Search
            </Button>
          </form>

          <RecentSearches onPick={handlePickRecent} />
        </CardContent>
      </Card>

      {/* Stats bar (only after a search) */}
      {hasSearched && (
        <StatsBar
          results={results}
          bestCommission={search?.bestCommissionAmount}
          isLoading={showSkeletons}
        />
      )}

      {/* Results section */}
      {showSkeletons ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      ) : hasSearched && results && results.length > 0 ? (
        <>
          {/* Result meta */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{results.length}</span> match
              {results.length === 1 ? '' : 'es'} for{' '}
              <span className="font-semibold text-shopee">&ldquo;{search?.query}&rdquo;</span>
            </p>
            <Badge
              variant="outline"
              className="text-[10px] gap-1 border-amber-300 text-amber-700 dark:text-amber-400 dark:border-amber-700"
            >
              <Filter className="size-3" />
              {search?.source === 'mock' ? 'Demo data' : 'Live data'}
            </Badge>
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {results.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onAutoPick={handleAutoPick}
                  onOpenDetail={handleOpenDetail}
                  isAutoPicking={autoPickMutation.isPending}
                  autoPickedId={autoPickedId}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Footer stats line */}
          <Card className="py-3 border-dashed bg-muted/30">
            <CardContent className="p-3 sm:p-4 text-center text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> products matched across{' '}
              <span className="font-semibold text-foreground">
                {new Set(results.flatMap((r) => r.listings.map((l) => l.platform))).size}
              </span>{' '}
              platforms. Best commission:{' '}
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {search?.bestCommissionAmount != null
                  ? formatRM(search.bestCommissionAmount)
                  : '—'}
              </span>
            </CardContent>
          </Card>
        </>
      ) : hasSearched && results && results.length === 0 ? (
        <Card className="border-dashed py-12">
          <CardContent className="p-6 sm:p-10 flex flex-col items-center text-center gap-4">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center">
              <XCircle className="size-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Tak jumpa match untuk &ldquo;{search?.query}&rdquo;</h3>
              <p className="text-sm text-muted-foreground">
                Cuba keyword lain, atau try one of the recent searches above.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState />
      )}

      {/* Detail dialog */}
      <DetailDialog
        match={detailMatch}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onGeneratePlatformLink={handleGeneratePlatformLink}
        generatingPlatform={generatingPlatform}
      />
    </div>
  )
}
