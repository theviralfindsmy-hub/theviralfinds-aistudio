'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FlaskConical,
  Sparkles,
  Copy,
  Trophy,
  Loader2,
  Hash,
  TrendingUp,
  Target,
  History,
  Eye,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type {
  AbNiche,
  AbPlatform,
  AbTone,
  ContentVariant,
  GenerateResponse,
  ListResponse,
  TrackResponse,
} from '@/lib/abtesting/types'

// ─── Static option sets ────────────────────────────────────────────────────

const PLATFORMS: { value: AbPlatform; label: string }[] = [
  { value: 'shopee', label: 'Shopee' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'lazada', label: 'Lazada' },
]
const NICHES: AbNiche[] = ['Beauty', 'Tech', 'Fashion', 'Home', 'Food']
const TONES: AbTone[] = ['Casual', 'Professional', 'Hype', 'Educational']

// ─── Score band → color tokens ─────────────────────────────────────────────

function scoreBand(score: number): { label: string; text: string; bg: string; ring: string; bar: string } {
  if (score >= 80)
    return { label: 'Excellent', text: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-950/40', ring: 'ring-emerald-300', bar: 'bg-emerald-500' }
  if (score >= 65)
    return { label: 'Good', text: 'text-lime-700', bg: 'bg-lime-100 dark:bg-lime-950/40', ring: 'ring-lime-300', bar: 'bg-lime-500' }
  if (score >= 50)
    return { label: 'Average', text: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-950/40', ring: 'ring-amber-300', bar: 'bg-amber-500' }
  if (score >= 35)
    return { label: 'Weak', text: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-950/40', ring: 'ring-orange-300', bar: 'bg-orange-500' }
  return { label: 'Poor', text: 'text-red-700', bg: 'bg-red-100 dark:bg-red-950/40', ring: 'ring-red-300', bar: 'bg-red-500' }
}

// ─── Variant card ──────────────────────────────────────────────────────────

interface VariantCardProps {
  variant: ContentVariant
  isPicked: boolean
  onPick: () => void
  onTrack: (clicks: number, conversions: number) => void
  tracking: boolean
}

function VariantCard({ variant, isPicked, onPick, onTrack, tracking }: VariantCardProps) {
  const [clicks, setClicks] = useState('')
  const [conversions, setConversions] = useState('')
  const band = scoreBand(variant.predictedScore)

  const breakdown = [
    { key: 'hook', label: 'Hook', value: variant.scoreBreakdown.hook },
    { key: 'cta', label: 'CTA', value: variant.scoreBreakdown.cta },
    { key: 'hashtags', label: 'Hashtags', value: variant.scoreBreakdown.hashtags },
    { key: 'emotion', label: 'Emotion', value: variant.scoreBreakdown.emotion },
  ]

  const copyContent = () => {
    navigator.clipboard.writeText(variant.content)
    toast.success('Content copied to clipboard!')
  }

  const submitTrack = () => {
    const c = Number(clicks)
    const v = Number(conversions)
    if (Number.isNaN(c) || c < 0 || Number.isNaN(v) || v < 0) {
      toast.error('Please enter valid numbers')
      return
    }
    onTrack(c, v)
    setClicks('')
    setConversions('')
  }

  return (
    <Card
      className={`h-full flex flex-col overflow-hidden ring-1 transition-all ${
        isPicked ? `ring-2 ${band.ring} shadow-lg` : 'ring-border hover:shadow-md'
      }`}
    >
        {/* Header — label + predicted score badge */}
        <CardHeader className={`pb-3 ${band.bg}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-bold">
                  Variant {variant.label}
                </Badge>
                {variant.isWinner && (
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                    <Trophy className="w-3 h-3 mr-1" /> Winner
                  </Badge>
                )}
                {variant.source === 'ai' ? (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" /> AI
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Template</Badge>
                )}
              </div>
              <CardTitle className="text-base leading-tight">{variant.styleName}</CardTitle>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-3xl font-extrabold ${band.text}`}>{variant.predictedScore}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">predicted</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4 pt-4">
          {/* Score breakdown — 4 mini-bars */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> Score Breakdown
            </div>
            {breakdown.map((b) => {
              const subBand = scoreBand(b.value)
              return (
                <div key={b.key} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className={`font-semibold ${subBand.text}`}>{b.value}</span>
                  </div>
                  <Progress value={b.value} className={`h-1.5 [&>div]:${subBand.bar}`} />
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Content quote block */}
          <div className="bg-muted/50 border-l-4 border-violet-400 rounded-r-md p-3 text-sm leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
            {variant.content}
          </div>

          {/* Hashtag chips */}
          {variant.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {variant.hashtags.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                >
                  <Hash className="w-2.5 h-2.5 mr-0.5 opacity-60" />
                  {h.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-auto">
            <Button size="sm" variant="outline" className="flex-1" onClick={copyContent}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
            </Button>
            <Button
              size="sm"
              className={`flex-1 ${isPicked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'}`}
              onClick={onPick}
              variant={isPicked ? 'default' : 'default'}
            >
              {isPicked ? (
                <>
                  <Trophy className="w-3.5 h-3.5 mr-1.5" /> Picked
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5 mr-1.5" /> Use This
                </>
              )}
            </Button>
          </div>

          {/* Actual performance tracker */}
          {variant.actual ? (
            <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Actual Performance
                </span>
                {variant.actual.loggedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(variant.actual.loggedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{variant.actual.clicks}</div>
                  <div className="text-[10px] text-muted-foreground">Clicks</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{variant.actual.conversions}</div>
                  <div className="text-[10px] text-muted-foreground">Conv.</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{variant.actual.ctr}%</div>
                  <div className="text-[10px] text-muted-foreground">CTR</div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Logged {variant.actual.loggedAt ? new Date(variant.actual.loggedAt).toLocaleString() : ''}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-muted-foreground/30 p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Log Actual Results
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`clicks-${variant.id}`} className="text-[10px] text-muted-foreground">Clicks</Label>
                  <Input
                    id={`clicks-${variant.id}`}
                    type="number"
                    min="0"
                    value={clicks}
                    onChange={(e) => setClicks(e.target.value)}
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor={`conv-${variant.id}`} className="text-[10px] text-muted-foreground">Conv.</Label>
                  <Input
                    id={`conv-${variant.id}`}
                    type="number"
                    min="0"
                    value={conversions}
                    onChange={(e) => setConversions(e.target.value)}
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={submitTrack} disabled={tracking}>
                {tracking ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                Log Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
  )
}

// ─── Past test row ─────────────────────────────────────────────────────────

interface PastTestRowProps {
  test: ListResponse['tests'][number]
}

function PastTestRow({ test }: PastTestRowProps) {
  const winner = test.variants.find((v) => v.id === test.winnerVariantId) || test.variants[0]
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{test.product}</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] capitalize">{test.platform}</Badge>
              <Badge variant="secondary" className="text-[10px]">{test.niche}</Badge>
              {test.tone && <Badge variant="outline" className="text-[10px]">{test.tone}</Badge>}
              <Badge variant="outline" className="text-[10px] capitalize">
                {test.source === 'ai' ? 'AI' : 'Template'}
              </Badge>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">{new Date(test.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Variant comparison row */}
        <div className="grid grid-cols-3 gap-2">
          {test.variants.map((v) => {
            const band = scoreBand(v.predictedScore)
            const isWinner = v.id === winner?.id
            const actualScore =
              v.actual && v.actual.clicks > 0
                ? Math.min(100, Math.round(v.actual.ctr * 4 + Math.log10(v.actual.clicks + 1) * 6))
                : null
            return (
              <div
                key={v.id}
                className={`rounded-md border p-2 text-center space-y-1 ${
                  isWinner ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] font-semibold">{v.label}</span>
                  {isWinner && <Trophy className="w-3 h-3 text-amber-500" />}
                </div>
                <div className={`text-base font-bold ${band.text}`}>{v.predictedScore}</div>
                <div className="text-[9px] text-muted-foreground">predicted</div>
                {actualScore !== null ? (
                  <>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{actualScore}</div>
                    <div className="text-[9px] text-muted-foreground">actual</div>
                    <div className="text-[9px] text-muted-foreground">
                      {v.actual!.clicks}c · {v.actual!.conversions}v
                    </div>
                  </>
                ) : (
                  <div className="text-[9px] text-muted-foreground italic">no data</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Winner summary */}
        {winner && winner.actual && (
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-amber-700 dark:text-amber-400">Winner:</span>{' '}
            Variant {winner.label} ({winner.styleName}) — {winner.actual.ctr}% CTR from {winner.actual.clicks} clicks.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function AbTestingPage() {
  const qc = useQueryClient()
  const [product, setProduct] = useState('')
  const [platform, setPlatform] = useState<AbPlatform>('shopee')
  const [niche, setNiche] = useState<AbNiche>('Beauty')
  const [tone, setTone] = useState<AbTone>('Casual')
  const [useTone, setUseTone] = useState(false)
  const [currentTest, setCurrentTest] = useState<GenerateResponse | null>(null)
  const [trackingVariantId, setTrackingVariantId] = useState<string | null>(null)

  // Fetch past tests
  const pastQuery = useQuery<ListResponse>({
    queryKey: ['abtesting', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/abtesting/track')
      if (!res.ok) throw new Error('Failed to load past tests')
      return res.json()
    },
  })

  // Generate mutation
  const generateMut = useMutation({
    mutationFn: async (): Promise<GenerateResponse> => {
      const body: Record<string, unknown> = { product, platform, niche }
      if (useTone) body.tone = tone
      const res = await fetch('/api/abtesting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to generate variants')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setCurrentTest(data)
      toast.success(
        data.source === 'ai'
          ? '3 AI variants generated!'
          : '3 variants generated (template fallback)',
        { description: `Test ID: ${data.testId.slice(0, 12)}…` }
      )
      qc.invalidateQueries({ queryKey: ['abtesting', 'list'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Generation failed')
    },
  })

  // Track mutation
  const trackMut = useMutation({
    mutationFn: async (args: { variantId: string; clicks: number; conversions: number }): Promise<TrackResponse> => {
      const res = await fetch('/api/abtesting/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: args.variantId,
          actualClicks: args.clicks,
          actualConversions: args.conversions,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to log results')
      }
      return res.json()
    },
    onSuccess: (data, vars) => {
      // Update currentTest if it matches
      if (currentTest && currentTest.testId === data.test.id) {
        setCurrentTest({
          ...currentTest,
          variants: data.test.variants,
        })
      }
      toast.success(`Variant ${data.variant.label} results logged!`, {
        description: `${vars.clicks} clicks · ${vars.conversions} conversions · ${data.variant.actual?.ctr}% CTR`,
      })
      qc.invalidateQueries({ queryKey: ['abtesting', 'list'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to log results')
    },
  })

  const handlePick = (variantId: string) => {
    if (!currentTest) return
    setCurrentTest({
      ...currentTest,
      variants: currentTest.variants.map((v) => ({
        ...v,
        isWinner: v.id === variantId,
      })),
    })
    toast.info(`Variant ${currentTest.variants.find((v) => v.id === variantId)?.label} marked as your pick`)
  }

  const handleTrack = (variantId: string, clicks: number, conversions: number) => {
    setTrackingVariantId(variantId)
    trackMut.mutate(
      { variantId, clicks, conversions },
      { onSettled: () => setTrackingVariantId(null) }
    )
  }

  const handleGenerate = () => {
    if (!product.trim()) {
      toast.error('Enter a product name first')
      return
    }
    generateMut.mutate()
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-violet-600" />
            AI A/B Content Testing
          </h1>
          <Badge variant="outline" className="text-violet-700 border-violet-300 bg-violet-50 dark:bg-violet-950/40">
            Fasa 3.4
          </Badge>
        </div>
        <p className="text-muted-foreground">
          3 variants. AI-predicted winners. Track real performance.
        </p>
      </motion.div>

      {/* New A/B Test generator card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-violet-600" /> New A/B Test
          </CardTitle>
          <CardDescription>
            Generate 3 distinct content variants — Direct & Punchy, Story-Driven, and Urgency-Focused.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="ab-product">Product Name</Label>
              <Input
                id="ab-product"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g. Garnier Vitamin C Serum 30ml"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as AbPlatform)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Niche</Label>
              <Select value={niche} onValueChange={(v) => setNiche(v as AbNiche)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NICHES.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex items-center gap-2 space-y-0">
              <input
                id="use-tone"
                type="checkbox"
                checked={useTone}
                onChange={(e) => setUseTone(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-violet-600"
              />
              <Label htmlFor="use-tone" className="text-sm cursor-pointer">Override tone (optional)</Label>
            </div>
            {useTone && (
              <div className="flex-1 w-full sm:w-48">
                <Select value={tone} onValueChange={(v) => setTone(v as AbTone)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={handleGenerate}
              disabled={generateMut.isPending}
              className="w-full sm:w-auto sm:ml-auto bg-violet-600 hover:bg-violet-700"
            >
              {generateMut.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating 3 variants...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Generate 3 Variants
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">
            <Eye className="w-4 h-4 mr-1.5" /> Current Test
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-1.5" /> Past Tests
          </TabsTrigger>
        </TabsList>

        {/* Results tab */}
        <TabsContent value="results" className="space-y-4">
          {generateMut.isPending && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-16 w-full" /></CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!generateMut.isPending && currentTest && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-violet-600" />
                    Results for “{currentTest.product}”
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Test ID: <code className="px-1 py-0.5 rounded bg-muted">{currentTest.testId}</code> ·{' '}
                    Source: <span className="font-medium">{currentTest.source === 'ai' ? 'AI-generated' : 'Template fallback'}</span> ·{' '}
                    {currentTest.variants.length} variants
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">{currentTest.platform}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentTest.variants.map((v, idx) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.12, ease: 'easeOut' }}
                  >
                    <VariantCard
                      variant={v}
                      isPicked={!!v.isWinner}
                      onPick={() => handlePick(v.id)}
                      onTrack={(c, conv) => handleTrack(v.id, c, conv)}
                      tracking={trackingVariantId === v.id && trackMut.isPending}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {!generateMut.isPending && !currentTest && (
            <Card className="border-dashed border-2">
              <CardContent className="p-12 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-violet-50 dark:bg-violet-950/40">
                    <FlaskConical className="w-10 h-10 text-violet-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">No active A/B test yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Fill in the product details above and click <strong>Generate 3 Variants</strong> to create
                  your first A/B test. You'll get 3 distinct content variants with AI-predicted scores.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-violet-600" /> Past A/B Tests
            </h2>
            {pastQuery.data && (
              <Badge variant="outline">{pastQuery.data.total} tests</Badge>
            )}
          </div>

          {pastQuery.isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}

          {pastQuery.data && pastQuery.data.tests.length === 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center text-muted-foreground">
                No past A/B tests yet. Generate one to see it here.
              </CardContent>
            </Card>
          )}

          {pastQuery.data && pastQuery.data.tests.length > 0 && (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1
                            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent
                            [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
              {pastQuery.data.tests.map((t) => (
                <PastTestRow key={t.id} test={t} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
