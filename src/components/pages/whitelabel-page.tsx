'use client'

/**
 * White-Label Configuration Page (Fasa 4.4)
 *
 * Two-column admin panel: left = config form, right = live preview.
 * Below: super-admin table of all white-label tenants.
 *
 * Branding is applied via inline CSS variables (`--wl-*`) on the preview
 * wrapper only — the global theme is never mutated, so the rest of the app
 * is unaffected.
 *
 * Architecture:
 *   - `WhiteLabelPage`  — fetches config + tenant list, renders skeletons.
 *   - `WhiteLabelForm`  — owns all editing state, keyed by config id so a
 *                         fresh server snapshot remounts it cleanly (no
 *                         `useEffect`-based state syncing needed).
 */

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Palette,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Upload,
  RotateCcw,
  Save,
  Monitor,
  Smartphone,
  Mail,
  Pencil,
  Ban,
  Shield,
  Globe,
  Sparkles,
  RefreshCw,
  Loader2,
  Bell,
  TrendingUp,
  LayoutDashboard,
  Package,
  Link as LinkIcon,
  BarChart3,
  Wallet,
  Settings as SettingsIcon,
  ExternalLink,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import {
  describeDomainError,
  isValidHex,
  normalizeHex,
  previewBranding,
  validateDomain,
} from '@/lib/whitelabel/applier'
import {
  COLOR_PRESETS,
  DEFAULT_BRAND_COLORS,
  DEFAULT_WHITELABEL_CONFIG,
  type BrandColors,
  type EmailTemplate,
  type EmailTemplateType,
  type WhiteLabelConfig,
  type WhiteLabelConfigResponse,
  type WhiteLabelListResponse,
  type WhiteLabelPreviewData,
} from '@/lib/whitelabel/types'
import { SHOPIJAU_CONFIG } from '@/lib/whitelabel/mock-data'

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  Package,
  Link: LinkIcon,
  BarChart3,
  Wallet,
  Settings: SettingsIcon,
}

const TEMPLATE_LABEL: Record<EmailTemplateType, string> = {
  welcome: 'Welcome Email',
  notification: 'Notification Email',
  digest: 'Daily Digest',
  promotion: 'Promotion Email',
}

const TEMPLATE_DESC: Record<EmailTemplateType, string> = {
  welcome: 'Dihantar kepada affiliate baru selepas sign-up.',
  notification: 'Dihantar bila ada event penting (commission boost, payout, dll).',
  digest: 'Ringkasan harian — clicks, conversions, earnings.',
  promotion: 'Tawaran produk viral & flash sale kepada affiliate.',
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
    case 'verified':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
    case 'suspended':
    case 'failed':
      return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'verified':
    case 'active':
      return <CheckCircle2 className="h-3.5 w-3.5" />
    case 'pending':
      return <Clock className="h-3.5 w-3.5" />
    case 'failed':
    case 'suspended':
      return <XCircle className="h-3.5 w-3.5" />
    default:
      return <AlertCircle className="h-3.5 w-3.5" />
  }
}

function buildDefaultTemplates(brandName: string): EmailTemplate[] {
  const types: EmailTemplateType[] = ['welcome', 'notification', 'digest', 'promotion']
  const vars: Record<EmailTemplateType, string[]> = {
    welcome: ['{brandName}', '{userName}', '{loginUrl}', '{supportEmail}'],
    notification: ['{brandName}', '{userName}', '{notificationTitle}', '{notificationBody}', '{ctaUrl}'],
    digest: ['{brandName}', '{userName}', '{period}', '{totalClicks}', '{totalConversions}', '{totalEarnings}', '{topProduct}'],
    promotion: ['{brandName}', '{userName}', '{productName}', '{discount}', '{promoCode}', '{expiryDate}', '{shopUrl}'],
  }
  const defaults: Record<EmailTemplateType, { subject: string; body: string }> = {
    welcome: {
      subject: `Selamat datang ke ${brandName}, {userName}! 🎉`,
      body: `Hi {userName},\n\nTerima kasih kerana menyertai ${brandName}. Platform kami membantu anda uruskan affiliate links, track earnings, dan dapatkan AI insights — semua dalam satu tempat.\n\nLog masuk di {loginUrl} untuk mula.\n\nSokongan: {supportEmail}\n\n— Pasukan ${brandName}`,
    },
    notification: {
      subject: `[${brandName}] {notificationTitle}`,
      body: `Hi {userName},\n\n{notificationTitle}\n\n{notificationBody}\n\nKlik di sini untuk lanjut: {ctaUrl}\n\n— ${brandName}`,
    },
    digest: {
      subject: `Daily Digest ${brandName} — {period}`,
      body: `Hi {userName},\n\nRingkasan {period}:\n• Klik: {totalClicks}\n• Konversi: {totalConversions}\n• Pendapatan: {totalEarnings}\n• Produk terbaik: {topProduct}\n\nTeruskan berusaha! 💪\n\n— ${brandName}`,
    },
    promotion: {
      subject: `🔥 {productName} — {discount} OFF di ${brandName}!`,
      body: `Hi {userName},\n\nTawaran terhad untuk {productName}!\n\nDiskaun: {discount}\nKod promo: {promoCode}\nBerakhir: {expiryDate}\n\nBeli sekarang: {shopUrl}\n\nJangan lepaskan!\n\n— ${brandName}`,
    },
  }
  return types.map((type) => ({
    type,
    name: TEMPLATE_LABEL[type],
    subject: defaults[type].subject,
    body: defaults[type].body,
    customized: false,
    availableVariables: vars[type],
  }))
}

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                       */
/* ------------------------------------------------------------------ */

interface ColorFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  const valid = isValidHex(value)
  const safe = valid ? normalizeHex(value) : '#000000'
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-input">
          <input
            type="color"
            value={safe}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} color picker`}
          />
          <div
            className="h-full w-full"
            style={{ backgroundColor: safe }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="#EE4D2D"
          className={cn('h-9 flex-1 font-mono text-xs', !valid && 'border-rose-400')}
          maxLength={7}
        />
      </div>
      {!valid && (
        <p className="text-[11px] text-rose-500">
          Format hex tak sah (cth: #EE4D2D)
        </p>
      )}
    </div>
  )
}

function DomainStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('gap-1 text-[10px] uppercase', statusBadgeClass(status))}
    >
      <StatusIcon status={status} />
      {status === 'not_configured' ? 'Not set' : status}
    </Badge>
  )
}

/* ------------------------------------------------------------------ */
/* Live preview pane                                                    */
/* ------------------------------------------------------------------ */

function LivePreview({
  config,
  loading,
}: {
  config: WhiteLabelConfig | null
  loading: boolean
}) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  const preview: WhiteLabelPreviewData = useMemo(
    () => previewBranding(config),
    [config],
  )

  const cssVars = preview.cssVars as React.CSSProperties
  const isMobile = device === 'mobile'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-shopee" />
              Live Preview
            </CardTitle>
            <CardDescription className="text-xs">
              Branding dikemas kini secara real-time
            </CardDescription>
          </div>
          <div className="flex rounded-md border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={cn(
                'flex items-center gap-1 rounded px-2 py-1 text-xs transition',
                device === 'desktop'
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={device === 'desktop'}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={cn(
                'flex items-center gap-1 rounded px-2 py-1 text-xs transition',
                device === 'mobile'
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={device === 'mobile'}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          style={{
            ...cssVars,
            width: isMobile ? 360 : '100%',
            maxWidth: '100%',
            margin: '0 auto',
          }}
          className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-zinc-950"
        >
          {/* Top bar with brand logo + name */}
          <div
            className="flex items-center justify-between gap-2 border-b px-3 py-2"
            style={{ borderColor: 'var(--wl-primary-20)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md text-[10px] font-bold"
                style={{
                  backgroundColor: 'var(--wl-primary)',
                  color: 'var(--wl-primary-fg)',
                }}
              >
                <img
                  src={preview.sampleDashboard.logoUrl}
                  alt={`${preview.sampleDashboard.brandName} logo`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <div className="leading-tight">
                <div className="text-[11px] font-semibold text-foreground">
                  {preview.sampleDashboard.brandName}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  {preview.sampleDashboard.tagline}
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
              style={{
                backgroundColor: 'var(--wl-accent-20)',
                color: 'var(--wl-secondary)',
              }}
            >
              <Bell className="h-2.5 w-2.5" />
              <span>3</span>
            </div>
          </div>

          <div className={cn('flex', isMobile ? 'flex-col' : 'flex-row')}>
            {/* Sidebar */}
            <nav
              className={cn(
                'shrink-0 space-y-1 border-r p-2',
                isMobile
                  ? 'flex flex-row gap-1 overflow-x-auto border-b border-r-0'
                  : 'w-36',
              )}
              style={{
                backgroundColor: 'var(--wl-primary-10)',
                borderColor: 'var(--wl-primary-20)',
              }}
            >
              {preview.sampleDashboard.sidebarItems.map((item) => {
                const Icon = ICON_MAP[item.icon] ?? LayoutDashboard
                return (
                  <div
                    key={item.label}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-2 py-1.5 text-[10px] font-medium',
                      item.active
                        ? 'shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                      isMobile && 'shrink-0',
                    )}
                    style={
                      item.active
                        ? {
                            backgroundColor: 'var(--wl-primary)',
                            color: 'var(--wl-primary-fg)',
                          }
                        : undefined
                    }
                  >
                    <Icon className="h-3 w-3" />
                    <span className="truncate">{item.label}</span>
                  </div>
                )
              })}
            </nav>

            {/* Main content */}
            <div className="flex-1 space-y-3 p-3">
              {/* Sample stat */}
              <motion.div
                layout
                className="rounded-md border p-2.5"
                style={{
                  borderColor: 'var(--wl-primary-20)',
                  background:
                    'linear-gradient(135deg, var(--wl-primary-10) 0%, transparent 100%)',
                }}
              >
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  {preview.sampleDashboard.sampleStat.label}
                </div>
                <div className="mt-0.5 flex items-end justify-between gap-2">
                  <div className="text-lg font-bold text-foreground">
                    {preview.sampleDashboard.sampleStat.value}
                  </div>
                  <div
                    className="flex items-center gap-0.5 text-[10px] font-semibold"
                    style={{ color: 'var(--wl-secondary)' }}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {preview.sampleDashboard.sampleStat.delta}
                  </div>
                </div>
              </motion.div>

              {/* Sample product card */}
              <div
                className="rounded-md border p-2.5"
                style={{ borderColor: 'var(--wl-primary-20)' }}
              >
                <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Produk Trending
                </div>
                <div className="flex items-center gap-2.5">
                  <img
                    src={preview.sampleDashboard.sampleProduct.thumbnail}
                    alt={preview.sampleDashboard.sampleProduct.name}
                    className="h-12 w-12 shrink-0 rounded border object-cover"
                    style={{ borderColor: 'var(--wl-primary-20)' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-semibold text-foreground">
                      {preview.sampleDashboard.sampleProduct.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {preview.sampleDashboard.sampleProduct.price}
                    </div>
                    <div
                      className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold"
                      style={{
                        backgroundColor: 'var(--wl-accent-20)',
                        color: 'var(--wl-secondary)',
                      }}
                    >
                      {preview.sampleDashboard.sampleProduct.commission}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-md py-2 text-[11px] font-semibold shadow-sm transition"
                style={{
                  backgroundColor: 'var(--wl-primary)',
                  color: 'var(--wl-primary-fg)',
                }}
              >
                Generate Affiliate Link
              </motion.button>

              {/* Sample notification toast */}
              <motion.div
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-md border-l-4 bg-muted/40 p-2.5"
                style={{
                  borderLeftColor: 'var(--wl-primary)',
                }}
              >
                <div
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: 'var(--wl-accent-20)',
                    color: 'var(--wl-secondary)',
                  }}
                >
                  <Bell className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold text-foreground">
                    {preview.sampleDashboard.sampleNotification.title}
                  </div>
                  <div className="mt-0.5 text-[9px] leading-snug text-muted-foreground">
                    {preview.sampleDashboard.sampleNotification.message}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Domain validation hint */}
        <div className="mt-3 flex items-center gap-2 text-[11px]">
          {preview.domainValid ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">
                Domain configuration valid
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-rose-500">
                Domain tidak sah — sila semak format
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Email template editor dialog                                        */
/* ------------------------------------------------------------------ */

interface EmailTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: EmailTemplate[]
  brandName: string
  onSave: (templates: EmailTemplate[]) => void
}

function EmailTemplateDialog({
  open,
  onOpenChange,
  templates,
  brandName,
  onSave,
}: EmailTemplateDialogProps) {
  const [selectedType, setSelectedType] = useState<EmailTemplateType>('welcome')
  const [drafts, setDrafts] = useState<Record<EmailTemplateType, EmailTemplate>>(
    () =>
      Object.fromEntries(templates.map((t) => [t.type, t])) as Record<
        EmailTemplateType,
        EmailTemplate
      >,
  )

  const current = drafts[selectedType]

  const updateField = (field: 'subject' | 'body', value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [selectedType]: {
        ...prev[selectedType],
        [field]: value,
        customized: true,
      },
    }))
  }

  const insertVariable = (variable: string) => {
    setDrafts((prev) => ({
      ...prev,
      [selectedType]: {
        ...prev[selectedType],
        body: `${prev[selectedType].body}${variable}`,
        customized: true,
      },
    }))
  }

  const handleSave = () => {
    onSave(Object.values(drafts))
    toast.success('Email template disimpan', {
      description: `Template "${TEMPLATE_LABEL[selectedType]}" berjaya dikemas kini.`,
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    const fresh = buildDefaultTemplates(brandName).find(
      (t) => t.type === selectedType,
    )
    if (fresh) {
      setDrafts((prev) => ({ ...prev, [selectedType]: fresh }))
      toast.info('Template dikembalikan ke default')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-shopee" />
            Customize Email Templates
          </DialogTitle>
          <DialogDescription>
            Edit subjek dan body setiap template. Guna{' '}
            <code className="rounded bg-muted px-1 text-[10px]">{'{variables}'}</code>{' '}
            untuk data dinamik.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Template</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as EmailTemplateType)}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TEMPLATE_LABEL) as EmailTemplateType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TEMPLATE_LABEL[t]}
                    {drafts[t]?.customized && (
                      <Badge
                        className="ml-2 bg-shopee/10 text-shopee"
                        variant="outline"
                      >
                        Customized
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {TEMPLATE_DESC[selectedType]}
            </p>
          </div>

          {current && (
            <>
              <div>
                <Label htmlFor="tpl-subject" className="text-xs">
                  Subject
                </Label>
                <Input
                  id="tpl-subject"
                  value={current.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tpl-body" className="text-xs">
                  Body
                </Label>
                <Textarea
                  id="tpl-body"
                  value={current.body}
                  onChange={(e) => updateField('body', e.target.value)}
                  className="mt-1 min-h-[180px] font-mono text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Available Variables</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {current.availableVariables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] transition hover:bg-shopee/10 hover:text-shopee"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Klik variable untuk masukkan ke body.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset to Default
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-shopee text-white hover:bg-shopee-dark"
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Form (owns editing state — keyed remount on config change)          */
/* ------------------------------------------------------------------ */

interface WhiteLabelFormProps {
  initialConfig: WhiteLabelConfig
  onSave: (payload: Partial<WhiteLabelConfig>) => void
  saving: boolean
}

function WhiteLabelForm({ initialConfig, onSave, saving }: WhiteLabelFormProps) {
  // useState initialisers run once per mount — the parent passes a fresh
  // `key` whenever the server snapshot changes, so we never need an effect
  // to sync local state with props (avoids set-state-in-effect lint error).
  const [brandName, setBrandName] = useState(initialConfig.brandName)
  const [logoUrl, setLogoUrl] = useState(initialConfig.logoUrl)
  const [colors, setColors] = useState<BrandColors>(initialConfig.colors)
  const [customDomain, setCustomDomain] = useState(initialConfig.domain.domain)
  const [domainStatus, setDomainStatus] = useState<string>(
    initialConfig.domain.status,
  )
  const [tagline, setTagline] = useState(initialConfig.tagline ?? '')
  const [contactEmail, setContactEmail] = useState(initialConfig.contactEmail)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(
    initialConfig.emailTemplates.length > 0
      ? initialConfig.emailTemplates
      : buildDefaultTemplates(initialConfig.brandName),
  )
  const [tplDialogOpen, setTplDialogOpen] = useState(false)
  const [tplDialogKey, setTplDialogKey] = useState(0)
  const [activeTplTab, setActiveTplTab] = useState<EmailTemplateType>('welcome')

  // Live config for preview (pure derivation — no effect needed).
  const liveConfig: WhiteLabelConfig = useMemo(
    () => ({
      ...initialConfig,
      brandName,
      logoUrl,
      colors,
      tagline,
      domain: {
        ...initialConfig.domain,
        domain: customDomain,
        status: domainStatus as WhiteLabelConfig['domain']['status'],
      },
      emailTemplates,
    }),
    [
      initialConfig,
      brandName,
      logoUrl,
      colors,
      tagline,
      customDomain,
      domainStatus,
      emailTemplates,
    ],
  )

  const handleSave = () => {
    if (!brandName.trim()) {
      toast.error('Brand name diperlukan')
      return
    }
    if (customDomain && !validateDomain(customDomain)) {
      toast.error('Domain tidak sah', {
        description: describeDomainError(customDomain) || 'Sila semak format domain.',
      })
      return
    }
    onSave({
      brandName: brandName.trim(),
      logoUrl: logoUrl.trim(),
      colors,
      tagline: tagline.trim(),
      contactEmail: contactEmail.trim(),
      domain: {
        ...initialConfig.domain,
        domain: customDomain.trim(),
      },
      emailTemplates,
    })
  }

  const handleReset = () => {
    setBrandName(DEFAULT_WHITELABEL_CONFIG.brandName)
    setLogoUrl(DEFAULT_WHITELABEL_CONFIG.logoUrl)
    setColors({ ...DEFAULT_BRAND_COLORS })
    setCustomDomain('')
    setDomainStatus('not_configured')
    setTagline(DEFAULT_WHITELABEL_CONFIG.tagline ?? '')
    setContactEmail(DEFAULT_WHITELABEL_CONFIG.contactEmail)
    setEmailTemplates(buildDefaultTemplates(DEFAULT_WHITELABEL_CONFIG.brandName))
    toast.info('Dikembalikan ke default TheViralFindsMY')
  }

  const applyPreset = (presetColors: BrandColors) => {
    setColors(presetColors)
  }

  const openTplDialog = () => {
    setTplDialogKey((k) => k + 1)
    setTplDialogOpen(true)
  }

  const domainErr = customDomain ? describeDomainError(customDomain) : ''

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — Configuration form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
            <CardDescription className="text-xs">
              Kemaskini branding anda. Perubahan akan dipratinjau secara langsung di sebelah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Brand name */}
            <div className="space-y-1.5">
              <Label htmlFor="brand-name" className="text-xs font-medium">
                Brand Name
              </Label>
              <Input
                id="brand-name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="TheViralFindsMY"
                className="h-9"
              />
              <p className="text-[11px] text-muted-foreground">
                Nama yang dipaparkan di header, email, dan dashboard.
              </p>
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <Label htmlFor="tagline" className="text-xs font-medium">
                Tagline
              </Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="AI-Powered Affiliate Manager"
                className="h-9"
              />
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <Label htmlFor="logo-url" className="text-xs font-medium">
                Logo URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="logo-url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={() => toast.info('Upload logo — guna URL buat sementara')}
                >
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  Upload
                </Button>
              </div>
              {logoUrl && (
                <div className="mt-1.5 flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-8 max-w-[160px] object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.opacity = '0.3'
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">Preview</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Colors */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Brand Colors
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Pilih dari preset atau guna color picker.
                </p>
              </div>

              {/* Preset palettes */}
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const isActive =
                    colors.primary.toUpperCase() ===
                      preset.colors.primary.toUpperCase() &&
                    colors.secondary.toUpperCase() ===
                      preset.colors.secondary.toUpperCase()
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.colors)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition',
                        isActive
                          ? 'border-foreground bg-foreground/5'
                          : 'border-border hover:border-foreground/40',
                      )}
                      title={preset.label}
                    >
                      <span className="flex">
                        <span
                          className="h-3 w-3 rounded-l-full"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <span
                          className="h-3 w-3"
                          style={{ backgroundColor: preset.colors.secondary }}
                        />
                        <span
                          className="h-3 w-3 rounded-r-full"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                      </span>
                      {preset.label}
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ColorField
                  label="Primary"
                  value={colors.primary}
                  onChange={(v) => setColors((c) => ({ ...c, primary: v }))}
                />
                <ColorField
                  label="Secondary"
                  value={colors.secondary}
                  onChange={(v) => setColors((c) => ({ ...c, secondary: v }))}
                />
                <ColorField
                  label="Accent"
                  value={colors.accent}
                  onChange={(v) => setColors((c) => ({ ...c, accent: v }))}
                />
              </div>
            </div>

            <Separator />

            {/* Custom domain */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-domain" className="text-xs font-medium">
                  Custom Domain
                </Label>
                <DomainStatusBadge status={domainStatus} />
              </div>
              <div className="flex gap-2">
                <Globe className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  id="custom-domain"
                  value={customDomain}
                  onChange={(e) => {
                    setCustomDomain(e.target.value)
                    if (e.target.value && validateDomain(e.target.value)) {
                      setDomainStatus('pending')
                    } else if (!e.target.value) {
                      setDomainStatus('not_configured')
                    }
                  }}
                  placeholder="affiliate.yourbrand.com"
                  className={cn(
                    'h-9 flex-1',
                    domainErr && 'border-rose-400',
                  )}
                />
              </div>
              {domainErr ? (
                <p className="text-[11px] text-rose-500">{domainErr}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  CNAME record:{' '}
                  <code className="rounded bg-muted px-1 font-mono text-[10px]">
                    {initialConfig.domain.cnameTarget}
                  </code>
                </p>
              )}
            </div>

            <Separator />

            {/* Email templates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide">
                    Email Templates
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    4 templates boleh di-customize.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={openTplDialog}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Customize
                </Button>
              </div>
              <Tabs
                value={activeTplTab}
                onValueChange={(v) => setActiveTplTab(v as EmailTemplateType)}
              >
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                  {(Object.keys(TEMPLATE_LABEL) as EmailTemplateType[]).map(
                    (t) => {
                      const tpl = emailTemplates.find((x) => x.type === t)
                      return (
                        <TabsTrigger
                          key={t}
                          value={t}
                          className="text-[10px] gap-1"
                        >
                          {TEMPLATE_LABEL[t].split(' ')[0]}
                          {tpl?.customized && (
                            <span className="h-1.5 w-1.5 rounded-full bg-shopee" />
                          )}
                        </TabsTrigger>
                      )
                    },
                  )}
                </TabsList>
                {(Object.keys(TEMPLATE_LABEL) as EmailTemplateType[]).map(
                  (t) => {
                    const tpl = emailTemplates.find((x) => x.type === t)
                    return (
                      <TabsContent key={t} value={t} className="mt-2">
                        <div className="rounded-md border bg-muted/30 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold">
                              {tpl?.subject ?? ''}
                            </span>
                            {tpl?.customized && (
                              <Badge
                                variant="outline"
                                className="bg-shopee/10 text-shopee text-[9px]"
                              >
                                Customized
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-[10px] text-muted-foreground">
                            {tpl?.body ?? ''}
                          </p>
                        </div>
                      </TabsContent>
                    )
                  },
                )}
              </Tabs>
            </div>

            <Separator />

            {/* Contact email + plan */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-email" className="text-xs font-medium">
                  Contact Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Plan</Label>
                <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/30 px-3">
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <Shield className="h-3 w-3" />
                    Enterprise
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Full white-label access
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={saving}
                className="h-9"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset to Default
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-9 bg-shopee text-white hover:bg-shopee-dark"
              >
                {saving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT — Live preview */}
        <LivePreview config={liveConfig} loading={false} />
      </div>

      {/* Email template dialog (keyed so it resets drafts each open) */}
      <EmailTemplateDialog
        key={tplDialogKey}
        open={tplDialogOpen}
        onOpenChange={setTplDialogOpen}
        templates={emailTemplates}
        brandName={brandName}
        onSave={(updated) => setEmailTemplates(updated)}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Main page (data fetching shell)                                      */
/* ------------------------------------------------------------------ */

export function WhiteLabelPage() {
  const queryClient = useQueryClient()
  const [isSuperAdmin] = useState(true)

  /* -------------------- Fetch current org config -------------------- */
  const {
    data: configResp,
    isLoading: configLoading,
    isError: configError,
  } = useQuery<WhiteLabelConfigResponse>({
    queryKey: ['whitelabel-config'],
    queryFn: async () => {
      const r = await fetch('/api/whitelabel/config', { credentials: 'include' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return (await r.json()) as WhiteLabelConfigResponse
    },
  })

  /* -------------------- Fetch super-admin list -------------------- */
  const { data: listResp, isLoading: listLoading } = useQuery<WhiteLabelListResponse>({
    queryKey: ['whitelabel-list'],
    queryFn: async () => {
      const r = await fetch('/api/whitelabel/config?list=1', {
        credentials: 'include',
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return (await r.json()) as WhiteLabelListResponse
    },
    enabled: isSuperAdmin,
  })

  /* -------------------- Save mutation -------------------- */
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<WhiteLabelConfig>) => {
      const r = await fetch('/api/whitelabel/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ config: payload }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error ?? `HTTP ${r.status}`)
      }
      return r.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelabel-config'] })
      queryClient.invalidateQueries({ queryKey: ['whitelabel-list'] })
      toast.success('Branding saved', {
        description: 'Konfigurasi white-label berjaya disimpan.',
      })
    },
    onError: (err: Error) => {
      toast.error('Gagal menyimpan branding', { description: err.message })
    },
  })

  /* -------------------- Loading skeleton for the form -------------------- */
  const formLoadingSkeleton = (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-shopee to-shopee-dark text-white shadow-sm">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight md:text-2xl">
              White-Label Configuration
              <Badge
                variant="outline"
                className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <Shield className="h-3 w-3" />
                Enterprise Only
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              Brand it as your own — logo, nama, warna, dan custom domain.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'gap-1',
              statusBadgeClass(configResp?.config?.status ?? 'pending'),
            )}
          >
            <StatusIcon status={configResp?.config?.status ?? 'pending'} />
            {configResp?.config?.status ?? '...'}
          </Badge>
          <Badge variant="outline" className="gap-1 uppercase">
            <Building2 className="h-3 w-3" />
            {configResp?.config?.plan ?? 'enterprise'}
          </Badge>
        </div>
      </motion.div>

      {configError && (
        <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4" />
          Gagal memuatkan konfigurasi. Sila refresh halaman.
        </div>
      )}

      {/* Two-column layout (form + preview) — form is keyed to remount on
          server snapshot change, so the form's useState initialisers always
          start from the latest server data. */}
      {configLoading || !configResp?.config ? (
        formLoadingSkeleton
      ) : (
        <WhiteLabelForm
          key={`${configResp.config.id}-${configResp.config.updatedAt}`}
          initialConfig={configResp.config}
          onSave={(payload) => saveMutation.mutate(payload)}
          saving={saveMutation.isPending}
        />
      )}

      {/* Bottom — Active White-Labels table (super-admin only) */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-shopee" />
                  Active White-Labels
                </CardTitle>
                <CardDescription className="text-xs">
                  Semua tenant white-label di platform ini.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ['whitelabel-list'],
                    })
                  }
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Refresh
                </Button>
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Shield className="h-3 w-3" />
                  Super Admin
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead className="text-xs">Brand</TableHead>
                      <TableHead className="text-xs">Domain</TableHead>
                      <TableHead className="text-xs">Plan</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-right text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {(listResp?.configs ?? []).map((c) => (
                        <motion.tr
                          key={c.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b transition hover:bg-muted/40"
                        >
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={c.logoUrl}
                                alt={c.brandName}
                                className="h-7 w-7 rounded border object-cover"
                                onError={(e) => {
                                  ;(e.currentTarget as HTMLImageElement).style.opacity = '0.3'
                                }}
                              />
                              <div className="min-w-0">
                                <div className="truncate text-xs font-semibold">
                                  {c.brandName}
                                </div>
                                <div className="truncate text-[10px] text-muted-foreground">
                                  {c.contactEmail}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {c.domain.domain ? (
                              <a
                                href={`https://${c.domain.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-shopee hover:underline"
                              >
                                {c.domain.domain}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                —
                              </span>
                            )}
                            <div className="mt-0.5">
                              <DomainStatusBadge status={c.domain.status} />
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {c.plan}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'gap-1 text-[10px] uppercase',
                                statusBadgeClass(c.status),
                              )}
                            >
                              <StatusIcon status={c.status} />
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 text-[11px] text-muted-foreground">
                            {formatDate(c.createdAt)}
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px]"
                                onClick={() =>
                                  toast.info(`Edit ${c.brandName}`, {
                                    description: 'Akan membuka editor branding.',
                                  })
                                }
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                                onClick={() =>
                                  toast.warning(`Suspend ${c.brandName}?`, {
                                    description:
                                      'Tenant akan kehilangan akses serta-merta.',
                                    action: {
                                      label: 'Suspend',
                                      onClick: () =>
                                        toast.success(`${c.brandName} suspended`),
                                    },
                                  })
                                }
                              >
                                <Ban className="mr-1 h-3 w-3" />
                                Suspend
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
