'use client'

import { useState, useMemo, useCallback, type KeyboardEvent } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Hash,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Copy,
  Check,
  Loader2,
  Trash2,
  Wand2,
  BarChart3,
  Trophy,
  Eye,
  Swords,
  Target,
  Lightbulb,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

// ─── Types (mirror src/lib/hashtags/types.ts) ────────────────────────
type HashtagPlatform = 'tiktok' | 'instagram' | 'facebook'
type HashtagNiche = 'beauty' | 'tech' | 'fashion' | 'food' | 'home'
type TrendDirection = 'up' | 'down' | 'stable'

interface HashtagSuggestion {
  tag: string
  platform: HashtagPlatform
  niche: HashtagNiche
  impressions: number
  avgClicks: number
  competition: number
  trendDirection: TrendDirection
  trendPercent: number
  reach: number
  competitionScore: number
  relevance: number
  overall: number
  explanation: string
}

interface OptimizeResponse {
  niche: HashtagNiche
  platform: HashtagPlatform
  contentKeywords: string[]
  suggestions: HashtagSuggestion[]
  source: 'ai' | 'mock'
  aiTip?: string
}

interface AnalyticsResponse {
  performanceOverTime: Array<{
    week: string
    impressions: number
    clicks: number
    ctr: number
  }>
  topPerforming: Array<{
    tag: string
    platform: HashtagPlatform
    totalImpressions: number
    totalClicks: number
    avgCtr: number
    uses: number
  }>
  scatter: Array<{
    tag: string
    competition: number
    impressions: number
    niche: HashtagNiche
  }>
  source: 'mock' | 'api'
}

// ─── Constants ────────────────────────────────────────────────────────
const NICHES: Array<{ value: HashtagNiche; label: string; emoji: string }> = [
  { value: 'beauty', label: 'Beauty', emoji: '💄' },
  { value: 'tech', label: 'Tech', emoji: '📱' },
  { value: 'fashion', label: 'Fashion', emoji: '👗' },
  { value: 'food', label: 'Food', emoji: '🍜' },
  { value: 'home', label: 'Home', emoji: '🛋️' },
]

const PLATFORMS: Array<{ value: HashtagPlatform; label: string; emoji: string }> = [
  { value: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'facebook', label: 'Facebook', emoji: '👍' },
]

const PLATFORM_BADGE: Record<HashtagPlatform, string> = {
  tiktok: 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900',
  instagram: 'bg-pink-500 text-white',
  facebook: 'bg-blue-600 text-white',
}

const NICHE_COLORS: Record<HashtagNiche, string> = {
  beauty: '#ec4899',
  tech: '#10b981',
  fashion: '#f59e0b',
  food: '#ef4444',
  home: '#8b5cf6',
}

type SortMode = 'score' | 'reach' | 'competition'

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: 'score', label: 'Overall Score' },
  { value: 'reach', label: 'Reach' },
  { value: 'competition', label: 'Low Competition' },
]

const MAX_SELECTION = 10

// ─── Helpers ──────────────────────────────────────────────────────────
function scoreColor(s: number): string {
  if (s >= 80) return 'text-green-600'
  if (s >= 60) return 'text-yellow-600'
  if (s >= 40) return 'text-orange-500'
  return 'text-red-600'
}

function scoreBg(s: number): string {
  if (s >= 80) return 'bg-green-500'
  if (s >= 60) return 'bg-yellow-500'
  if (s >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function formatImpressions(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

/** Small colored chip that visually encodes the overall score band. */
function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={`inline-flex size-2 rounded-full ${scoreBg(score)}`}
      aria-hidden
    />
  )
}

function TrendIcon({ dir }: { dir: TrendDirection }) {
  if (dir === 'up') return <TrendingUp className="size-3.5 text-green-600" />
  if (dir === 'down') return <TrendingDown className="size-3.5 text-red-600" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

function MiniBar({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string
  value: number
  color: string
  icon: typeof Eye
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="text-[10px] font-semibold tabular-nums">{value}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-0.5">
          <motion.div
            className={color}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Multi-tag Keyword Input ──────────────────────────────────────────
function KeywordInput({
  keywords,
  onChange,
}: {
  keywords: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  const addKeyword = useCallback(() => {
    const v = draft.trim()
    if (!v) return
    if (keywords.includes(v)) {
      toast.warning(`"${v}" already added`)
      return
    }
    if (keywords.length >= 10) {
      toast.warning('Max 10 keywords')
      return
    }
    onChange([...keywords, v])
    setDraft('')
  }, [draft, keywords, onChange])

  const removeKeyword = (k: string) => {
    onChange(keywords.filter((x) => x !== k))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    } else if (e.key === 'Backspace' && !draft && keywords.length > 0) {
      onChange(keywords.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-9 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:border-ring">
      <AnimatePresence mode="popLayout">
        {keywords.map((k) => (
          <motion.span
            key={k}
            layout
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="inline-flex items-center gap-1 rounded-full bg-shopee/15 text-shopee-dark dark:text-shopee px-2 py-0.5 text-xs font-medium border border-shopee/30"
          >
            {k}
            <button
              type="button"
              onClick={() => removeKeyword(k)}
              className="hover:bg-shopee/20 rounded-full p-0.5"
              aria-label={`Remove ${k}`}
            >
              <X className="size-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={addKeyword}
        placeholder={keywords.length === 0 ? 'Type a keyword and press Enter (e.g. skincare, garnier, vitamin c)' : 'Add another…'}
        className="flex-1 min-w-[200px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />
    </div>
  )
}

// ─── Charts ───────────────────────────────────────────────────────────
function PerformanceChart({ data }: { data: AnalyticsResponse['performanceOverTime'] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
          tickFormatter={(v) => formatImpressions(Number(v))}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => {
            if (name === 'ctr') return [`${value}%`, 'CTR']
            return [formatImpressions(Number(value)), name === 'impressions' ? 'Impressions' : 'Clicks']
          }}
        />
        <Line
          type="monotone"
          dataKey="impressions"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function CompetitionReachScatter({ data }: { data: AnalyticsResponse['scatter'] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          type="number"
          dataKey="competition"
          name="Competition"
          domain={[0, 10]}
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
          label={{ value: 'Competition (1-10)', position: 'insideBottom', offset: -4, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="impressions"
          name="Reach"
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
          tickFormatter={(v) => formatImpressions(Number(v))}
        />
        <ZAxis range={[60, 60]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => {
            if (name === 'Reach') return [formatImpressions(Number(value)), name]
            return [value, name]
          }}
          labelFormatter={() => ''}
        />
        {(['beauty', 'tech', 'fashion', 'food', 'home'] as HashtagNiche[]).map((n) => (
          <Scatter
            key={n}
            name={n}
            data={data.filter((d) => d.niche === n)}
            fill={NICHE_COLORS[n]}
            fillOpacity={0.7}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────
export function HashtagsPage() {
  const [niche, setNiche] = useState<HashtagNiche>('beauty')
  const [platform, setPlatform] = useState<HashtagPlatform>('tiktok')
  const [keywords, setKeywords] = useState<string[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('score')
  const [selection, setSelection] = useState<HashtagSuggestion[]>([])
  const [copied, setCopied] = useState(false)

  // ── Optimization mutation ─────────────────────────────────────────
  const optimizeMutation = useMutation({
    mutationFn: async (): Promise<OptimizeResponse> => {
      const res = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche,
          contentKeywords: keywords,
          platform,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to optimize hashtags')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(
        data.source === 'ai'
          ? 'AI-refined suggestions ready!'
          : 'Suggestions ready (algorithmic fallback)',
        { description: `${data.suggestions.length} hashtags ranked for ${niche} on ${platform}` }
      )
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Optimization failed')
    },
  })

  // ── Analytics query ───────────────────────────────────────────────
  const analyticsQuery = useQuery<AnalyticsResponse>({
    queryKey: ['hashtag-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/ai/hashtags')
      if (!res.ok) throw new Error('Failed to load analytics')
      return res.json()
    },
    staleTime: 60_000,
  })

  // ── Selection helpers ─────────────────────────────────────────────
  const toggleSelection = useCallback((s: HashtagSuggestion) => {
    setSelection((prev) => {
      const exists = prev.find((x) => x.tag === s.tag && x.platform === s.platform)
      if (exists) {
        return prev.filter((x) => !(x.tag === s.tag && x.platform === s.platform))
      }
      if (prev.length >= MAX_SELECTION) {
        toast.warning(`Max ${MAX_SELECTION} hashtags in selection`)
        return prev
      }
      return [...prev, s]
    })
  }, [])

  const removeSelection = (tag: string, platform: HashtagPlatform) => {
    setSelection((prev) =>
      prev.filter((x) => !(x.tag === tag && x.platform === platform))
    )
  }

  const clearSelection = () => {
    setSelection([])
    toast.info('Selection cleared')
  }

  const totalReach = useMemo(
    () => selection.reduce((sum, s) => sum + s.impressions, 0),
    [selection]
  )

  const totalClicks = useMemo(
    () => selection.reduce((sum, s) => sum + s.avgClicks, 0),
    [selection]
  )

  // ── Copy all (top 10) ─────────────────────────────────────────────
  const copyAll = async () => {
    const suggestions = optimizeMutation.data?.suggestions ?? []
    if (suggestions.length === 0) {
      toast.warning('No suggestions to copy yet')
      return
    }
    const top10 = suggestions.slice(0, 10).map((s) => `#${s.tag}`).join(' ')
    try {
      await navigator.clipboard.writeText(top10)
      setCopied(true)
      toast.success('Top 10 hashtags copied to clipboard', {
        description: top10,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy — clipboard not available')
    }
  }

  // ── Sorted suggestions ───────────────────────────────────────────
  const sortedSuggestions = useMemo(() => {
    const suggestions = optimizeMutation.data?.suggestions ?? []
    const copy = [...suggestions]
    if (sortMode === 'score') {
      copy.sort((a, b) => b.overall - a.overall)
    } else if (sortMode === 'reach') {
      copy.sort((a, b) => b.reach - a.reach)
    } else if (sortMode === 'competition') {
      copy.sort((a, b) => b.competitionScore - a.competitionScore)
    }
    return copy
  }, [optimizeMutation.data, sortMode])

  const handleOptimize = () => {
    optimizeMutation.mutate()
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-shopee/15 p-2.5 border border-shopee/30">
            <Hash className="size-6 text-shopee" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Auto-Hashtag Optimizer
            </h1>
            <p className="text-sm text-muted-foreground">
              Hashtags that actually perform — scored on reach, competition &amp; relevance.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-xs px-3 py-1.5 border-shopee/40 text-shopee-dark dark:text-shopee"
        >
          <Sparkles className="size-3" />
          Fasa 3.7
        </Badge>
      </header>

      {/* ── Optimizer Input ────────────────────────────────────────── */}
      <Card className="border-shopee/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wand2 className="size-5 text-shopee" />
            Optimize Hashtags
          </CardTitle>
          <CardDescription>
            Pick a niche, type your content keywords, choose a platform — get top 15 AI-ranked hashtag suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="niche-select" className="text-xs font-medium">
                Niche
              </Label>
              <Select value={niche} onValueChange={(v) => setNiche(v as HashtagNiche)}>
                <SelectTrigger id="niche-select" className="w-full">
                  <SelectValue placeholder="Select niche" />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      <span className="mr-2">{n.emoji}</span>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform-select" className="text-xs font-medium">
                Platform
              </Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as HashtagPlatform)}>
                <SelectTrigger id="platform-select" className="w-full">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="mr-2">{p.emoji}</span>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Content Keywords{' '}
              <span className="text-muted-foreground font-normal">
                (optional — type and press Enter)
              </span>
            </Label>
            <KeywordInput keywords={keywords} onChange={setKeywords} />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              onClick={handleOptimize}
              disabled={optimizeMutation.isPending}
              className="bg-shopee hover:bg-shopee-dark text-white"
            >
              {optimizeMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Optimizing…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Get Hashtag Suggestions
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setKeywords([])
                toast.info('Keywords cleared')
              }}
              disabled={keywords.length === 0}
            >
              <Trash2 className="size-4" />
              Clear Keywords
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── My Selection ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="size-5 text-shopee" />
              My Selection
              <Badge variant="secondary" className="ml-1">
                {selection.length} / {MAX_SELECTION}
              </Badge>
            </CardTitle>
            {selection.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <Trash2 className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {selection.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Click on a hashtag in the suggestions below to add it here. Max {MAX_SELECTION}{' '}
              hashtags.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {selection.map((s) => (
                    <motion.span
                      key={`${s.tag}-${s.platform}`}
                      layout
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-shopee/15 text-shopee-dark dark:text-shopee px-3 py-1 text-sm font-medium border border-shopee/30"
                    >
                      <span>#{s.tag}</span>
                      <Badge className={`${PLATFORM_BADGE[s.platform]} text-[9px] px-1 py-0`}>
                        {s.platform.slice(0, 2)}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => removeSelection(s.tag, s.platform)}
                        className="hover:bg-shopee/20 rounded-full p-0.5"
                        aria-label={`Remove ${s.tag}`}
                      >
                        <X className="size-3" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Total Predicted Reach
                  </div>
                  <div className="text-xl font-bold tabular-nums text-shopee">
                    {formatImpressions(totalReach)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">impressions / 30 days</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Est. Clicks
                  </div>
                  <div className="text-xl font-bold tabular-nums">{formatImpressions(totalClicks)}</div>
                  <div className="text-[10px] text-muted-foreground">avg per post cycle</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Avg. Score
                  </div>
                  <div className="text-xl font-bold tabular-nums">
                    {selection.length > 0
                      ? Math.round(
                          selection.reduce((s, x) => s + x.overall, 0) / selection.length
                        )
                      : 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">across selection</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Suggestions Results ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="size-5 text-shopee" />
                Hashtag Suggestions
              </CardTitle>
              <CardDescription>
                {optimizeMutation.data
                  ? `${optimizeMutation.data.suggestions.length} suggestions • Source: ${optimizeMutation.data.source === 'ai' ? 'AI-refined' : 'Algorithmic'}`
                  : 'Run the optimizer to see scored suggestions.'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs text-muted-foreground">Sort by:</Label>
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger size="sm" className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAll}
                disabled={!optimizeMutation.data}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" /> Copy Top 10
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Tip */}
          {optimizeMutation.data?.aiTip && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-start gap-2 rounded-lg bg-shopee/10 border border-shopee/30 px-3 py-2"
            >
              <Lightbulb className="size-4 text-shopee shrink-0 mt-0.5" />
              <p className="text-xs text-shopee-dark dark:text-shopee">
                <span className="font-semibold">AI Strategy Tip:</span>{' '}
                {optimizeMutation.data.aiTip}
              </p>
            </motion.div>
          )}
        </CardHeader>
        <CardContent>
          {optimizeMutation.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : optimizeMutation.data ? (
            <>
              {/* Source badge row */}
              <div className="mb-3 flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className={
                    optimizeMutation.data.source === 'ai'
                      ? 'border-shopee/40 text-shopee-dark dark:text-shopee'
                      : 'border-muted-foreground/40 text-muted-foreground'
                  }
                >
                  <Sparkles className="size-3" />
                  {optimizeMutation.data.source === 'ai' ? 'AI-Refined' : 'Algorithmic Fallback'}
                </Badge>
                <span className="text-muted-foreground">
                  Niche: <strong>{NICHES.find((n) => n.value === niche)?.label}</strong> • Platform:{' '}
                  <strong>{PLATFORMS.find((p) => p.value === platform)?.label}</strong>
                  {keywords.length > 0 && (
                    <>
                      {' '}• Keywords: <strong>{keywords.join(', ')}</strong>
                    </>
                  )}
                </span>
              </div>

              {/* Desktop: Table view */}
              <div className="hidden md:block overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hashtag</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead>Breakdown</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Why</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {sortedSuggestions.map((s) => (
                        <motion.tr
                          key={`${s.tag}-${s.platform}`}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`border-t cursor-pointer transition-colors hover:bg-shopee/5 ${
                            selection.find((x) => x.tag === s.tag && x.platform === s.platform)
                              ? 'bg-shopee/10'
                              : ''
                          }`}
                          onClick={() => toggleSelection(s)}
                        >
                          {/* Note: motion.tr renders as a real <tr>; we style cells manually here */}
                          <td className="p-4 font-medium align-middle">
                            <div className="flex items-center gap-2">
                              <span className="text-shopee-dark dark:text-shopee">#{s.tag}</span>
                              {selection.find((x) => x.tag === s.tag && x.platform === s.platform) && (
                                <Check className="size-3.5 text-green-600" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge className={`${PLATFORM_BADGE[s.platform]} text-[10px]`}>
                              {s.platform}
                            </Badge>
                          </td>
                          <td className="p-4 text-right align-middle">
                            <div className="flex items-center justify-end gap-1.5">
                              <ScoreBadge score={s.overall} />
                              <span className={`text-2xl font-bold tabular-nums ${scoreColor(s.overall)}`}>
                                {s.overall}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex flex-col gap-1.5 min-w-[160px]">
                              <MiniBar label="Reach" value={s.reach} color="bg-blue-500" icon={Eye} />
                              <MiniBar
                                label="Low Comp"
                                value={s.competitionScore}
                                color="bg-emerald-500"
                                icon={Swords}
                              />
                              <MiniBar
                                label="Rel."
                                value={s.relevance}
                                color="bg-purple-500"
                                icon={Target}
                              />
                            </div>
                          </td>
                          <td className="p-4 text-right tabular-nums align-middle">
                            {formatImpressions(s.impressions)}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <TrendIcon dir={s.trendDirection} />
                              <span
                                className={`text-xs font-medium ${
                                  s.trendDirection === 'up'
                                    ? 'text-green-600'
                                    : s.trendDirection === 'down'
                                      ? 'text-red-600'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {s.trendDirection === 'up' ? '+' : s.trendDirection === 'down' ? '-' : ''}
                                {s.trendPercent}%
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground max-w-[260px] align-middle">
                            <span className="line-clamp-2">{s.explanation}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: Card view */}
              <div className="md:hidden space-y-3">
                <AnimatePresence mode="popLayout">
                  {sortedSuggestions.map((s) => {
                    const isSelected = !!selection.find(
                      (x) => x.tag === s.tag && x.platform === s.platform
                    )
                    return (
                      <motion.div
                        key={`${s.tag}-${s.platform}`}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={() => toggleSelection(s)}
                        className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                          isSelected ? 'border-shopee bg-shopee/10' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-shopee-dark dark:text-shopee">
                              #{s.tag}
                            </span>
                            <Badge className={`${PLATFORM_BADGE[s.platform]} text-[10px]`}>
                              {s.platform}
                            </Badge>
                            {isSelected && <Check className="size-4 text-green-600" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ScoreBadge score={s.overall} />
                            <span className={`text-2xl font-bold tabular-nums ${scoreColor(s.overall)}`}>
                              {s.overall}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 mb-2">
                          <MiniBar label="Reach" value={s.reach} color="bg-blue-500" icon={Eye} />
                          <MiniBar
                            label="Low Comp"
                            value={s.competitionScore}
                            color="bg-emerald-500"
                            icon={Swords}
                          />
                          <MiniBar
                            label="Rel."
                            value={s.relevance}
                            color="bg-purple-500"
                            icon={Target}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {formatImpressions(s.impressions)} impressions
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendIcon dir={s.trendDirection} />
                            {s.trendDirection === 'up' ? '+' : s.trendDirection === 'down' ? '-' : ''}
                            {s.trendPercent}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {s.explanation}
                        </p>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Hash className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No suggestions yet. Configure your niche, keywords and platform above, then hit{' '}
                <strong>Get Hashtag Suggestions</strong>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Analytics Dashboard ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="size-5 text-shopee" />
            Hashtag Analytics
          </CardTitle>
          <CardDescription>
            Performance of your past hashtag usage — impressions, clicks, and competition landscape.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {analyticsQuery.isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-[260px] w-full" />
              <Skeleton className="h-[260px] w-full" />
            </div>
          ) : analyticsQuery.data ? (
            <>
              {/* Performance over time + Scatter */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <TrendingUp className="size-3.5 text-shopee" />
                      Performance Over Time
                    </h3>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-orange-500" /> Impressions
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-emerald-500" /> Clicks
                      </span>
                    </div>
                  </div>
                  <PerformanceChart data={analyticsQuery.data.performanceOverTime} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Swords className="size-3.5 text-shopee" />
                      Competition vs Reach
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] flex-wrap">
                      {(['beauty', 'tech', 'fashion', 'food', 'home'] as HashtagNiche[]).map((n) => (
                        <span key={n} className="flex items-center gap-1">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: NICHE_COLORS[n] }}
                          />
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <CompetitionReachScatter data={analyticsQuery.data.scatter} />
                </div>
              </div>

              <Separator />

              {/* Top Performing List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Trophy className="size-3.5 text-shopee" />
                  Top Performing Hashtags (Your History)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analyticsQuery.data.topPerforming.map((t, i) => (
                    <motion.div
                      key={`${t.tag}-${t.platform}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0
                              ? 'bg-yellow-500 text-white'
                              : i === 1
                                ? 'bg-gray-400 text-white'
                                : i === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">#{t.tag}</span>
                            <Badge className={`${PLATFORM_BADGE[t.platform]} text-[9px] px-1 py-0`}>
                              {t.platform.slice(0, 2)}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {t.uses} uses • {t.avgCtr.toFixed(2)}% avg CTR
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold tabular-nums text-shopee">
                          {formatImpressions(t.totalImpressions)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatImpressions(t.totalClicks)} clicks
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Failed to load analytics.{' '}
              <Button variant="link" size="sm" onClick={() => analyticsQuery.refetch()}>
                Retry
              </Button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
