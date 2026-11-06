'use client'

import { useState, useCallback, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  RefreshCw,
  Wand2,
  CheckCircle2,
  History,
  Loader2,
  Copy,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'

import { THUMBNAIL_TEMPLATE_LIST, getTemplate } from '@/lib/thumbnails/templates'
import { THUMBNAIL_SIZE_LIST, getSize } from '@/lib/thumbnails/sizes'
import type {
  ThumbnailPlatform,
  ThumbnailResult,
  ThumbnailTemplateId,
  ThumbnailHistoryEntry,
} from '@/lib/thumbnails/types'

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function classNames(...c: Array<string | false | undefined | null>): string {
  return c.filter(Boolean).join(' ')
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** Trigger a client-side image download via a transient <a> element. */
function downloadImage(url: string, filename: string) {
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Download bermula')
  } catch {
    toast.error('Tak boleh download — cuba right-click → Save Image As')
  }
}

/** Stub "alternative size" download options shown under the generated image. */
const DOWNLOAD_PRESETS: Array<{ id: string; label: string; suffix: string }> = [
  { id: 'original', label: 'Original Size', suffix: 'orig' },
  { id: 'square', label: 'Square (1080²)', suffix: '1080' },
  { id: 'vertical', label: 'Vertical (1080×1920)', suffix: 'vert' },
]

/* -------------------------------------------------------------------------- */
/*  Template preview — a faithful CSS mock of each thumbnail style             */
/* -------------------------------------------------------------------------- */

interface PreviewProps {
  templateId: ThumbnailTemplateId
  platform: ThumbnailPlatform
  productName: string
  price: number
  commissionRate: number
  customText?: string
  className?: string
  compact?: boolean
}

function TemplatePreview({
  templateId,
  platform,
  productName,
  price,
  commissionRate,
  customText,
  className,
  compact = false,
}: PreviewProps) {
  const tpl = getTemplate(templateId)
  const size = getSize(platform)
  const headline = (customText?.trim() || tpl.sampleText).toUpperCase()
  const rm = `RM ${price.toFixed(2)}`
  const commission = `${commissionRate.toFixed(1)}% Komisen`
  const name = productName.trim() || 'Nama Produk Anda'
  const aspectStyle = { aspectRatio: size.aspectRatio } as React.CSSProperties
  const headSize = compact ? 'text-base' : 'text-3xl'
  const nameSize = compact ? 'text-[10px]' : 'text-sm'
  const subSize = compact ? 'text-[9px]' : 'text-xs'

  return (
    <div
      className={classNames(
        'relative w-full overflow-hidden rounded-lg bg-gradient-to-br shadow-inner',
        tpl.bgGradient,
        className
      )}
      style={aspectStyle}
    >
      {/* Unboxing / Tutorial: top accent ribbon */}
      {(templateId === 'unboxing' || templateId === 'tutorial') && (
        <div
          className="absolute left-0 top-0 inline-flex items-center rounded-br-xl px-2 py-1 text-[10px] font-extrabold sm:text-xs"
          style={{ backgroundColor: tpl.accentColor, color: '#0f172a' }}
        >
          <span className="mr-1">{tpl.icon}</span>
          {tpl.sampleText}
        </div>
      )}

      {/* Comparison: split divider */}
      {templateId === 'comparison' && (
        <>
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-cyan-300" />
          <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-extrabold text-white/80 sm:text-base">
            BEFORE
          </div>
          <div className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-extrabold text-cyan-300 sm:text-base">
            AFTER
          </div>
        </>
      )}

      {/* Testimonial: stars */}
      {templateId === 'testimonial' && (
        <div className={classNames('absolute inset-x-0 top-[28%] text-center font-extrabold text-amber-900', compact ? 'text-base' : 'text-3xl')}>
          ★★★★★
        </div>
      )}

      {/* Headline */}
      <div
        className={classNames(
          'absolute inset-x-0 px-2 text-center font-black drop-shadow-md',
          headSize,
          tpl.textPosition === 'top' && 'top-[14%]',
          tpl.textPosition === 'center' && 'top-[42%]',
          tpl.textPosition === 'bottom' && 'top-[58%]'
        )}
        style={{
          color:
            templateId === 'product_demo' || templateId === 'testimonial'
              ? '#0f172a'
              : '#ffffff',
        }}
      >
        {headline}
      </div>

      {/* Subtext */}
      <div
        className={classNames(
          'absolute inset-x-0 px-2 text-center font-semibold',
          subSize,
          tpl.textPosition === 'top' && 'top-[24%]',
          tpl.textPosition === 'center' && 'top-[52%]',
          tpl.textPosition === 'bottom' && 'top-[68%]'
        )}
        style={{
          color:
            templateId === 'product_demo' || templateId === 'testimonial'
              ? 'rgba(15,23,42,0.7)'
              : 'rgba(255,255,255,0.85)',
        }}
      >
        {tpl.sampleSubtext}
      </div>

      {/* Product name + price strip */}
      <div className="absolute inset-x-0 bottom-0 bg-black/35 px-2 py-1.5 backdrop-blur-sm">
        <div
          className={classNames(
            'truncate text-center font-bold text-white',
            nameSize
          )}
        >
          {name}
        </div>
        <div className={classNames('truncate text-center font-semibold', subSize)} style={{ color: tpl.accentColor }}>
          {rm} · {commission}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Platform badge colours                                                     */
/* -------------------------------------------------------------------------- */

const PLATFORM_META: Record<
  ThumbnailPlatform,
  { label: string; short: string; color: string }
> = {
  tiktok: { label: 'TikTok', short: 'TT', color: 'bg-black text-white' },
  instagram_square: { label: 'IG Square', short: 'IG', color: 'bg-pink-500 text-white' },
  instagram_story: { label: 'IG Story', short: 'IG', color: 'bg-fuchsia-600 text-white' },
  facebook: { label: 'Facebook', short: 'FB', color: 'bg-blue-600 text-white' },
  youtube: { label: 'YouTube', short: 'YT', color: 'bg-red-600 text-white' },
}

/* -------------------------------------------------------------------------- */
/*  Main page component                                                        */
/* -------------------------------------------------------------------------- */

export function ThumbnailsPage() {
  // Form state ------------------------------------------------------------------
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('29.90')
  const [commissionRate, setCommissionRate] = useState('10')
  const [template, setTemplate] = useState<ThumbnailTemplateId>('flash_sale')
  const [platform, setPlatform] = useState<ThumbnailPlatform>('tiktok')
  const [customText, setCustomText] = useState('')

  // Result state ----------------------------------------------------------------
  const [result, setResult] = useState<ThumbnailResult | null>(null)
  const [history, setHistory] = useState<ThumbnailHistoryEntry[]>([])

  const size = useMemo(() => getSize(platform), [platform])

  // API mutation ----------------------------------------------------------------
  const generateMutation = useMutation({
    mutationFn: async (): Promise<ThumbnailResult> => {
      const res = await fetch('/api/ai/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim() || 'Nama Produk',
          price: Number(price) || 0,
          commissionRate: Number(commissionRate) || 0,
          template,
          platform,
          customText: customText.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Gagal jana thumbnail')
      }
      return (await res.json()) as ThumbnailResult
    },
    onSuccess: (data) => {
      setResult(data)
      const entry: ThumbnailHistoryEntry = {
        id: uid(),
        imageUrl: data.imageUrl,
        template: data.template,
        platform: data.platform,
        productName: productName.trim() || 'Nama Produk',
        createdAt: new Date().toISOString(),
        source: data.source,
      }
      setHistory((h) => [entry, ...h].slice(0, 5))
      toast.success(
        data.source === 'ai'
          ? 'Thumbnail AI siap! 🎉'
          : 'Thumbnail mock siap (AI quota limit)'
      )
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleGenerate = useCallback(() => {
    if (!productName.trim()) {
      toast.error('Sila masukkan nama produk')
      return
    }
    const p = Number(price)
    if (Number.isNaN(p) || p < 0) {
      toast.error('Harga tak sah')
      return
    }
    generateMutation.mutate()
  }, [productName, price, generateMutation])

  const handleRegenerate = useCallback(() => {
    generateMutation.mutate()
  }, [generateMutation])

  const handleTryDifferentTemplate = useCallback(() => {
    const ids = THUMBNAIL_TEMPLATE_LIST.map((t) => t.id)
    const idx = ids.indexOf(template)
    const next = ids[(idx + 1) % ids.length]
    setTemplate(next)
    toast.info(`Template ditukar ke "${getTemplate(next).name}"`)
  }, [template])

  const handleDownload = useCallback(
    (preset: (typeof DOWNLOAD_PRESETS)[number]) => {
      if (!result) return
      const safeName = (productName.trim() || 'thumbnail')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 30)
      downloadImage(
        result.imageUrl,
        `${safeName}-${result.template}-${preset.suffix}.png`
      )
    },
    [result, productName]
  )

  const handleCopyPrompt = useCallback(() => {
    if (!result?.prompt) return
    navigator.clipboard.writeText(result.prompt)
    toast.success('Prompt disalin ke clipboard')
  }, [result])

  const isGenerating = generateMutation.isPending
  const selectedTpl = getTemplate(template)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ImageIcon className="h-7 w-7 text-shopee" />
          AI Video Thumbnail Generator
        </h1>
        <p className="text-muted-foreground">
          Create click-worthy thumbnails in seconds — pilih template, masukkan
          produk, dan biar AI buat kerja. 💥
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Left panel: Input form ───────────────────────────────────── */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-shopee" />
              Thumbnail Details
            </CardTitle>
            <CardDescription>
              Isi butikan produk, pilih template & platform untuk mula.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Product name */}
            <div className="space-y-1.5">
              <Label htmlFor="t-product">Product Name</Label>
              <Input
                id="t-product"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Serum Vitamin C Brightening"
                maxLength={120}
              />
            </div>

            {/* Price + commission */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    RM
                  </span>
                  <Input
                    id="t-price"
                    type="number"
                    step="0.10"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-commission">Commission Rate</Label>
                <div className="relative">
                  <Input
                    id="t-commission"
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Template selector */}
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THUMBNAIL_TEMPLATE_LIST.map((t) => {
                  const active = t.id === template
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      aria-pressed={active}
                      className={classNames(
                        'relative text-left rounded-lg border p-2 transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-shopee',
                        active
                          ? 'border-shopee bg-shopee/5 ring-1 ring-shopee'
                          : 'border-border bg-card'
                      )}
                    >
                      <div
                        className={classNames(
                          'mb-1.5 h-10 w-full rounded bg-gradient-to-br',
                          t.bgGradient
                        )}
                      >
                        <div className="flex h-full items-center justify-center text-base font-black text-white drop-shadow">
                          {t.icon}
                        </div>
                      </div>
                      <div className="text-xs font-semibold leading-tight">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-2">
                        {t.description}
                      </div>
                      {active && (
                        <CheckCircle2 className="absolute right-1 top-1 h-4 w-4 text-shopee" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Platform selector */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <RadioGroup
                value={platform}
                onValueChange={(v) => setPlatform(v as ThumbnailPlatform)}
                className="grid grid-cols-2 sm:grid-cols-5 gap-2"
              >
                {THUMBNAIL_SIZE_LIST.map((s) => {
                  const meta = PLATFORM_META[s.platform]
                  const active = s.platform === platform
                  return (
                    <label
                      key={s.platform}
                      htmlFor={`plat-${s.platform}`}
                      className={classNames(
                        'relative flex flex-col items-center gap-1 rounded-lg border p-2 cursor-pointer transition-all hover:shadow-md',
                        active
                          ? 'border-shopee bg-shopee/5 ring-1 ring-shopee'
                          : 'border-border bg-card'
                      )}
                    >
                      <RadioGroupItem
                        id={`plat-${s.platform}`}
                        value={s.platform}
                        className="sr-only"
                      />
                      <span
                        className={classNames(
                          'inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold',
                          meta.color
                        )}
                      >
                        {meta.short}
                      </span>
                      <span className="text-[11px] font-medium leading-tight text-center">
                        {meta.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {s.width}×{s.height}
                      </span>
                    </label>
                  )
                })}
              </RadioGroup>
            </div>

            {/* Custom text override */}
            <div className="space-y-1.5">
              <Label htmlFor="t-custom">
                Custom Headline{' '}
                <span className="text-xs text-muted-foreground">
                  (optional — defaults to "{selectedTpl.sampleText}")
                </span>
              </Label>
              <Input
                id="t-custom"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={selectedTpl.sampleText}
                maxLength={60}
              />
            </div>

            <Separator />

            {/* Generate button */}
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-shopee hover:bg-shopee-dark text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menjana thumbnail...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Thumbnail
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ─── Right panel: Result display ─────────────────────────────── */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-shopee" />
                Result Preview
              </span>
              {result && (
                <Badge
                  variant={result.source === 'ai' ? 'default' : 'secondary'}
                  className={
                    result.source === 'ai'
                      ? 'bg-shopee text-white'
                      : 'bg-amber-100 text-amber-900'
                  }
                >
                  {result.source === 'ai' ? 'AI Generated' : 'Mock Preview'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {size.label} • {size.width}×{size.height} ({size.orientation})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview area */}
            <div className="flex justify-center rounded-lg bg-muted/40 p-4">
              <div
                className="w-full max-w-[260px]"
                style={{ aspectRatio: size.aspectRatio }}
              >
                {isGenerating ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : result ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={result.imageUrl}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35 }}
                      className="h-full w-full"
                    >
                      <img
                        src={result.imageUrl}
                        alt={`Thumbnail: ${productName}`}
                        className="h-full w-full rounded-lg border object-cover shadow-md"
                      />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <TemplatePreview
                    templateId={template}
                    platform={platform}
                    productName={productName}
                    price={Number(price) || 0}
                    commissionRate={Number(commissionRate) || 0}
                    customText={customText}
                    className="border"
                  />
                )}
              </div>
            </div>

            {/* Empty / non-empty hint */}
            {!result && !isGenerating && (
              <div className="flex items-start gap-2 rounded-md border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Ini adalah preview template (mock). Klik{' '}
                  <strong>Generate Thumbnail</strong> untuk hasilkan versi AI
                  sebenar dengan z-ai-web-dev-sdk.
                </p>
              </div>
            )}

            {/* Action buttons */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTryDifferentTemplate}
                    disabled={isGenerating}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Try Different Template
                  </Button>
                </div>

                <Separator />

                {/* Downloads */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Download (multiple sizes)
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DOWNLOAD_PRESETS.map((p) => (
                      <Button
                        key={p.id}
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownload(p)}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Prompt (AI only) */}
                {result.source === 'ai' && result.prompt && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      AI Prompt
                    </Label>
                    <div className="flex items-start gap-2 rounded-md bg-muted/60 p-2 text-xs">
                      <p className="flex-1 line-clamp-3 text-muted-foreground">
                        {result.prompt}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyPrompt}
                        className="h-6 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Meta */}
                {result.meta && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="outline">
                      {new Date(result.meta.generatedAt).toLocaleTimeString(
                        'en-MY'
                      )}
                    </Badge>
                    {result.meta.durationMs != null && (
                      <Badge variant="outline">
                        {(result.meta.durationMs / 1000).toFixed(1)}s
                      </Badge>
                    )}
                    {result.meta.model && (
                      <Badge variant="outline">{result.meta.model}</Badge>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Generation history (last 5) ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-shopee" />
            Generation History
            <Badge variant="secondary" className="ml-1">
              {history.length} / 5
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada thumbnail dijana. Hasil terkini anda akan muncul di sini.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {history.map((h) => {
                const meta = PLATFORM_META[h.platform]
                const hSize = getSize(h.platform)
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setTemplate(h.template)
                      setPlatform(h.platform)
                      setProductName(h.productName)
                      setResult({
                        imageUrl: h.imageUrl,
                        template: h.template,
                        platform: h.platform,
                        size: hSize,
                        source: h.source,
                      })
                      toast.info('Thumbnail dipilih dari history')
                    }}
                    className="group shrink-0 rounded-lg border bg-card p-2 text-left transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-shopee"
                    style={{ width: 96 }}
                  >
                    <div
                      className="relative w-full overflow-hidden rounded"
                      style={{ aspectRatio: hSize.aspectRatio }}
                    >
                      <img
                        src={h.imageUrl}
                        alt={h.productName}
                        className="h-full w-full object-cover"
                      />
                      <span
                        className={classNames(
                          'absolute right-0.5 top-0.5 inline-flex h-4 items-center rounded px-1 text-[8px] font-bold',
                          meta.color
                        )}
                      >
                        {meta.short}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[10px] font-medium">
                      {h.productName}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                      <span>{getTemplate(h.template).name}</span>
                      <span>{h.source === 'ai' ? 'AI' : 'Mock'}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
