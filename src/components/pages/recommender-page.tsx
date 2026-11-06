'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  RefreshCw,
  Crown,
  Sparkles,
  Link2,
  Loader2,
  Image as ImageIcon,
  TrendingUp,
  Users,
  Wallet,
  Target,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'

import type {
  AudienceProfile,
  AudiencePersonaId,
  Recommendation,
  RecommendationResponse,
  Platform,
} from '@/lib/recommender/types'
import { AUDIENCE_PROFILES } from '@/lib/recommender/mock-data'

// ─── Constants ─────────────────────────────────────────────────

const PLATFORM_META: Record<
  Platform,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  shopee: {
    label: 'Shopee',
    bgClass: 'bg-shopee/10 dark:bg-shopee/20',
    textClass: 'text-shopee',
    borderClass: 'border-shopee/40',
  },
  tiktok: {
    label: 'TikTok',
    bgClass: 'bg-pink-500/10 dark:bg-pink-500/20',
    textClass: 'text-pink-600 dark:text-pink-400',
    borderClass: 'border-pink-500/40',
  },
  lazada: {
    label: 'Lazada',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500/40',
  },
}

const SCORE_DIMENSIONS = [
  { key: 'audience' as const, label: 'Audience', icon: Users, color: 'bg-hermes' },
  { key: 'commission' as const, label: 'Commission', icon: Wallet, color: 'bg-shopee' },
  { key: 'trend' as const, label: 'Trend', icon: TrendingUp, color: 'bg-amber-500' },
  { key: 'gap' as const, label: 'Gap', icon: Target, color: 'bg-emerald-500' },
]

function scoreColor(total: number): { text: string; bg: string; border: string } {
  if (total >= 80)
    return {
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      border: 'border-emerald-500/40',
    }
  if (total >= 60)
    return {
      text: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      border: 'border-amber-500/40',
    }
  return {
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-500/40',
  }
}

function formatRM(amount: number): string {
  return `RM ${amount.toFixed(2)}`
}

// ─── Audience Selector Card ────────────────────────────────────

function AudienceCard({
  profile,
  active,
  onClick,
}: {
  profile: AudienceProfile
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Select audience: ${profile.name}`}
      className={`text-left transition-all rounded-xl border p-4 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-hermes/50 ${
        active
          ? 'border-hermes bg-hermes/5 ring-2 ring-hermes/30'
          : 'border-border bg-card hover:border-hermes/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-11 rounded-lg bg-hermes/10 border border-hermes/20">
          <AvatarFallback className="bg-transparent text-xl">
            {profile.emoji}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{profile.name}</h3>
            {active && (
              <CheckCircle2 className="size-4 text-hermes shrink-0" aria-hidden />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {profile.tagline}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
              {profile.ageRange}
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
              CTR {(profile.clickThroughRate * 100).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Score Breakdown Mini-Bars ─────────────────────────────────

function ScoreBreakdown({ rec }: { rec: Recommendation }) {
  return (
    <div className="space-y-1.5">
      {SCORE_DIMENSIONS.map((dim) => {
        const value = rec.score[dim.key]
        const Icon = dim.icon
        return (
          <div key={dim.key} className="flex items-center gap-2">
            <Icon className="size-3.5 text-muted-foreground shrink-0" aria-hidden />
            <span className="text-[10px] text-muted-foreground w-16 shrink-0">
              {dim.label}
            </span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${dim.color} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                aria-hidden
              />
            </div>
            <span className="text-[10px] font-medium tabular-nums w-7 text-right shrink-0">
              {Math.round(value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Recommendation Card ───────────────────────────────────────

function RecommendationCard({
  rec,
  onGenerateLink,
  generating,
}: {
  rec: Recommendation
  onGenerateLink: (rec: Recommendation) => void
  generating: boolean
}) {
  const platform = PLATFORM_META[rec.product.platform]
  const colors = scoreColor(rec.score.total)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: rec.rank * 0.05 }}
    >
      <Card
        className={`overflow-hidden h-full flex flex-col ${
          rec.isTopPick ? 'border-hermes/50 ring-1 ring-hermes/20' : ''
        }`}
      >
        {/* Top pick crown banner */}
        {rec.isTopPick && (
          <div className="bg-gradient-to-r from-hermes to-hermes-dark text-white text-[10px] font-semibold py-1 px-3 flex items-center gap-1.5">
            <Crown className="size-3" aria-hidden />
            TOP PICK #{rec.rank}
          </div>
        )}

        <CardContent className="p-4 flex flex-col flex-1 gap-3">
          {/* Image + name + platform */}
          <div className="flex gap-3">
            <div className="size-16 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden border">
              <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {rec.product.name}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                {rec.product.shopName}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 px-1.5 h-4 ${platform.bgClass} ${platform.textClass} ${platform.borderClass}`}
                >
                  {platform.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                  {rec.product.category}
                </Badge>
              </div>
            </div>
          </div>

          {/* Score badge + price */}
          <div className="flex items-center justify-between gap-2">
            <div
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 ${colors.bg} ${colors.border}`}
            >
              <span className={`text-base font-bold tabular-nums ${colors.text}`}>
                {Math.round(rec.score.total)}
              </span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{formatRM(rec.product.price)}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {rec.product.commissionRate}% · {formatRM(rec.product.commissionAmount)}
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <ScoreBreakdown rec={rec} />

          <Separator />

          {/* Explanation */}
          <div className="space-y-1.5">
            <p className="text-[11px] italic text-muted-foreground leading-relaxed line-clamp-3">
              &ldquo;{rec.explanation.summary}&rdquo;
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Target className="size-3 text-hermes" aria-hidden />
              <span>Best post: {rec.explanation.suggestedPostTime}</span>
              <span aria-hidden>·</span>
              <span>{rec.product.sales.toLocaleString()} sold</span>
            </div>
          </div>

          {/* Generate link button */}
          <Button
            onClick={() => onGenerateLink(rec)}
            disabled={generating}
            className="mt-auto w-full bg-shopee hover:bg-shopee-dark text-white"
            size="sm"
          >
            {generating ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Link2 className="size-3.5" aria-hidden />
            )}
            {generating ? 'Generating...' : 'Generate Link'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Recommendation Skeleton ───────────────────────────────────

function RecommendationSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-3">
          <Skeleton className="size-16 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-1.5">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        </div>
        <Skeleton className="h-8 w-full" />
        <div className="space-y-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-3.5" />
              <Skeleton className="h-2 flex-1" />
            </div>
          ))}
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────

export function RecommenderPage() {
  const [selectedAudience, setSelectedAudience] = useState<AudiencePersonaId>(
    'beauty_mama',
  )
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [view, setView] = useState<'all' | 'top'>('all')

  const { data, isLoading, isFetching, refetch } = useQuery<RecommendationResponse>({
    queryKey: ['ai-recommend', selectedAudience],
    queryFn: async () => {
      const res = await fetch(
        `/api/ai/recommend?audience=${selectedAudience}&limit=12`,
        { cache: 'no-store' },
      )
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || 'Failed to load recommendations')
      }
      return res.json() as Promise<RecommendationResponse>
    },
    staleTime: 5 * 60 * 1000,
  })

  const handleRefresh = () => {
    refetch()
    toast.success('Refreshing recommendations...', {
      description: `Re-scoring catalog for ${data?.audience.name ?? 'audience'}`,
    })
  }

  const handleGenerateLink = async (rec: Recommendation) => {
    setGeneratingId(rec.id)
    try {
      const endpoint =
        rec.product.platform === 'shopee'
          ? '/api/shopee/generate-link'
          : rec.product.platform === 'tiktok'
            ? '/api/tiktok/generate-link'
            : '/api/lazada/generate-link'

      const body =
        rec.product.platform === 'shopee'
          ? { itemId: Number(rec.product.nativeId) }
          : { productId: rec.product.nativeId, productUrl: rec.product.productLink }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || `Failed to generate ${rec.product.platform} link`)
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
        rec.product.productLink

      await navigator.clipboard?.writeText(url).catch(() => {})
      toast.success(`${PLATFORM_META[rec.product.platform].label} link generated!`, {
        description: `Copied: ${url.slice(0, 60)}${url.length > 60 ? '...' : ''}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Failed to generate link', { description: message })
    } finally {
      setGeneratingId(null)
    }
  }

  const audience = data?.audience
  const recommendations = data?.recommendations ?? []
  const visibleRecs =
    view === 'top' ? recommendations.filter((r) => r.isTopPick) : recommendations

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-lg bg-hermes/10 flex items-center justify-center">
            <Lightbulb className="size-5 text-hermes" aria-hidden />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            AI Product Recommender
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Personalized picks for your audience · Scored by audience match (40%) + commission (30%) + trend (20%) + gap analysis (10%)
        </p>
      </div>

      {/* Audience selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="size-4 text-hermes" aria-hidden />
            Choose Your Audience Persona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {AUDIENCE_PROFILES.map((profile) => (
              <AudienceCard
                key={profile.id}
                profile={profile}
                active={selectedAudience === profile.id}
                onClick={() => setSelectedAudience(profile.id)}
              />
            ))}
          </div>

          {audience && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">{audience.name}</span>{' '}
                {audience.emoji} — {audience.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {audience.topCategories.slice(0, 3).map((c) => (
                  <Badge
                    key={c.category}
                    variant="outline"
                    className="text-[10px] bg-hermes/5 text-hermes border-hermes/30"
                  >
                    {c.category} · {c.weight}%
                  </Badge>
                ))}
                <Badge variant="outline" className="text-[10px]">
                  Conv {(audience.conversionRate * 100).toFixed(1)}%
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {audience.topStates[0]} +{audience.topStates.length - 1}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={view} onValueChange={(v) => setView(v as 'all' | 'top')}>
          <TabsList>
            <TabsTrigger value="all" className="text-xs">
              All Picks
              {recommendations.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 text-[10px] px-1">
                  {recommendations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="top" className="text-xs">
              <Crown className="size-3 mr-1" aria-hidden />
              Top 3
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {data && (
            <Badge
              variant="outline"
              className={`text-[10px] ${
                data.source === 'ai'
                  ? 'bg-hermes/10 text-hermes border-hermes/30'
                  : 'bg-muted'
              }`}
            >
              <Sparkles className="size-3 mr-1" aria-hidden />
              {data.source === 'ai' ? 'AI-enhanced' : 'Algorithmic'}
            </Badge>
          )}
          <Button
            onClick={handleRefresh}
            disabled={isFetching}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`size-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`}
              aria-hidden
            />
            {isFetching ? 'Loading...' : 'Refresh Recommendations'}
          </Button>
        </div>
      </div>

      {/* Top picks highlighted banner */}
      <AnimatePresence mode="wait">
        {view === 'all' && recommendations.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-hermes/30 bg-gradient-to-r from-hermes/5 to-transparent p-3 flex items-center gap-3"
          >
            <Crown className="size-5 text-hermes shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Top 3 Picks for {audience?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Highest-scoring products — crown badges mark the winners
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <RecommendationSkeleton key={i} />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Lightbulb
              className="size-10 text-muted-foreground mx-auto"
              aria-hidden
            />
            <p className="text-sm font-medium">No recommendations yet</p>
            <p className="text-xs text-muted-foreground">
              Try refreshing or selecting a different audience.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {visibleRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onGenerateLink={handleGenerateLink}
                generating={generatingId === rec.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Algorithm explanation footer */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground flex items-center gap-1.5">
            <Target className="size-3.5 text-hermes" aria-hidden />
            How the score is calculated
          </p>
          <p>
            <span className="font-medium text-hermes">Audience match (40%)</span> —
            category affinity + price sensitivity fit + rating + shop reliability.
          </p>
          <p>
            <span className="font-medium text-shopee">Commission (30%)</span> —
            commission rate % + absolute RM amount.
          </p>
          <p>
            <span className="font-medium text-amber-600">Trend (20%)</span> — sales
            velocity + optional trend score.
          </p>
          <p>
            <span className="font-medium text-emerald-600">Gap analysis (10%)</span> —
            undersaturated niche opportunities.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
