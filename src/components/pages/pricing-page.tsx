'use client'

// ─── Pricing Page (Task 4-A / Fasa 4.1) ───────────────────────────────────────
//
// Full 4-tier freemium pricing UI:
//   - 4 pricing cards (Free / Pro / Business / Enterprise)
//   - Billing cycle toggle (Monthly / Yearly −20%)
//   - Current usage card with per-feature progress bars
//   - Feature comparison matrix (15 features × 4 plans)
//   - FAQ accordion (6 questions)
//   - Upgrade dialog with Stripe/Billplz selector → /api/pricing/checkout
//
// All API responses include `source: 'mock'` per spec.

import { useState, useMemo, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Crown,
  Sparkles,
  Check,
  X,
  Zap,
  Building2,
  Rocket,
  HelpCircle,
  CreditCard,
  Shield,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Landmark,
  TrendingUp,
  Package,
  Link2,
  FileText,
  Brain,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import type {
  BillingCycle,
  FeatureKey,
  PaymentMethod,
  PricingPlan,
  PricingTier,
  Subscription,
  UsageTracking,
  CheckoutRequest,
  CheckoutSession,
  SubscriptionMutationRequest,
} from '@/lib/pricing/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRM(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Custom'
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function tierRank(t: PricingTier): number {
  return { free: 0, pro: 1, business: 2, enterprise: 3 }[t]
}

/** Accent → tailwind classes for a pricing card. NO blue/indigo. */
function accentClasses(accent: PricingPlan['accent']) {
  switch (accent) {
    case 'shopee':
      return {
        ring: 'ring-shopee/40',
        border: 'border-shopee/40',
        bg: 'bg-shopee/5',
        text: 'text-shopee',
        chip: 'bg-shopee text-white',
        glow: 'shadow-shopee/20',
      }
    case 'hermes':
      return {
        ring: 'ring-hermes/40',
        border: 'border-hermes/40',
        bg: 'bg-hermes/5',
        text: 'text-hermes',
        chip: 'bg-hermes text-white',
        glow: 'shadow-hermes/20',
      }
    case 'dark':
      return {
        ring: 'ring-slate-700/40',
        border: 'border-slate-700/40',
        bg: 'bg-slate-900/5 dark:bg-slate-900/30',
        text: 'text-slate-900 dark:text-slate-100',
        chip: 'bg-slate-900 text-white dark:bg-slate-800',
        glow: 'shadow-slate-900/20',
      }
    case 'gray':
    default:
      return {
        ring: 'ring-border',
        border: 'border-border',
        bg: 'bg-card',
        text: 'text-foreground',
        chip: 'bg-muted text-muted-foreground',
        glow: '',
      }
  }
}

// ─── Static FAQ data ──────────────────────────────────────────────────────────

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Boleh cancel anytime?',
    a: 'Confirm boleh. Cancel dalam dashboard, subscription anda akan kekal active sampai end of billing cycle. Lepas tu auto-downgrade ke Free plan. Tak ada hidden fees, tak ada cancellation charge.',
  },
  {
    q: 'What payment methods you all support?',
    a: 'Stripe untuk international cards (Visa, Mastercard, Amex). Billplz untuk Malaysian FPX — maybank2u, cimb clicks, RHB, public bank, semua bank Malaysia. Untuk Enterprise, kami accept bank transfer + invoice.',
  },
  {
    q: 'Ada free trial untuk Pro plan?',
    a: 'Yes! Pro plan dapat 7 hari free trial — no credit card required upfront. Cancel dalam trial period, tak akan kena charge. Trial include semua Pro features so you can test betul-betul.',
  },
  {
    q: 'Kalau exceeded free tier limits, apa jadi?',
    a: 'Bila you exceeded 50 produk / 20 links / 5 AI content dalam sebulan, account anda tak akan block. Cuma you tak boleh buat new ones until next month reset, or upgrade ke Pro/Business. Existing data semua still boleh access.',
  },
  {
    q: 'Boleh upgrade or downgrade tengah-tengah bulan?',
    a: 'Boleh! Upgrade immediate effective — you dapat akses semua new features terus. Pro-rated charge untuk baki bulan tu. Downgrade effective end of current billing cycle, so you still keep your current features sampai habis bulan.',
  },
  {
    q: 'Adakah harga saya boleh dapat discount?',
    a: 'Yearly billing dapat 20% off — significant savings! Untuk students & NGO, email support@theviralfindsmy.com untuk extra discount. Enterprise custom pricing available untuk volume commitments.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle
  onChange: (c: BillingCycle) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('monthly')}
        aria-pressed={cycle === 'monthly'}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
          cycle === 'monthly'
            ? 'bg-shopee text-white shadow'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        aria-pressed={cycle === 'yearly'}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5',
          cycle === 'yearly'
            ? 'bg-shopee text-white shadow'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Yearly
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] px-1.5 py-0">
          −20%
        </Badge>
      </button>
    </div>
  )
}

function PlanIcon({ tier }: { tier: PricingTier }) {
  const cls = 'w-5 h-5'
  switch (tier) {
    case 'free':
      return <Rocket className={cls} />
    case 'pro':
      return <Zap className={cls} />
    case 'business':
      return <Building2 className={cls} />
    case 'enterprise':
      return <Crown className={cls} />
  }
}

function PricingCard({
  plan,
  cycle,
  currentTier,
  isCurrent,
  onUpgrade,
}: {
  plan: PricingPlan
  cycle: BillingCycle
  currentTier: PricingTier
  isCurrent: boolean
  onUpgrade: (tier: PricingTier) => void
}) {
  const accent = accentClasses(plan.accent)
  const isEnterprise = plan.tier === 'enterprise'
  const isFree = plan.tier === 'free'

  const price =
    cycle === 'monthly' ? plan.priceMonthly : plan.priceYearly
  const periodLabel = isEnterprise
    ? '/ custom'
    : cycle === 'monthly'
    ? '/ month'
    : '/ year'

  // CTA logic
  const ctaLabel = isCurrent
    ? 'Current Plan'
    : tierRank(plan.tier) < tierRank(currentTier)
    ? `Downgrade to ${plan.name}`
    : plan.cta

  const ctaDisabled = isCurrent

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: tierRank(plan.tier) * 0.07 }}
      className={cn(
        'relative h-full rounded-xl border-2 bg-card shadow-sm transition-shadow hover:shadow-md',
        accent.border,
        plan.highlight && `ring-2 ${accent.ring} ${accent.glow} shadow-lg`,
      )}
    >
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-shopee px-3 py-1 text-xs font-semibold text-white shadow-md">
            <Sparkles className="w-3 h-3" /> MOST POPULAR
          </span>
        </div>
      )}

      <CardHeader className={cn('pb-2 rounded-t-xl', accent.bg)}>
        <div className="flex items-center justify-between">
          <div className={cn('p-2 rounded-lg', accent.chip)}>
            <PlanIcon tier={plan.tier} />
          </div>
          {isCurrent && (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
              Current
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl mt-2">{plan.name}</CardTitle>
        <CardDescription className="text-xs">{plan.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="pt-4 pb-6 space-y-4">
        {/* Price */}
        <div className="space-y-1">
          {isEnterprise ? (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">Custom</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">
                {formatRM(price)}
              </span>
              <span className="text-sm text-muted-foreground">{periodLabel}</span>
            </div>
          )}
          {cycle === 'yearly' && !isEnterprise && !isFree && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Save {formatRM((plan.priceMonthly ?? 0) * 12 - (plan.priceYearly ?? 0))} / year
            </p>
          )}
          {isFree && (
            <p className="text-xs text-muted-foreground">Free selamanya, no card needed</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed min-h-[2.5rem]">
          {plan.description}
        </p>

        <Separator />

        {/* Feature bullets */}
        <ul className="space-y-2">
          {plan.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className={cn('w-4 h-4 mt-0.5 flex-shrink-0', accent.text)} />
              <span className="text-foreground/90">{bullet}</span>
            </li>
          ))}
        </ul>

        <Button
          className={cn('w-full', plan.highlight && 'bg-shopee hover:bg-shopee-dark text-white')}
          variant={plan.highlight ? 'default' : isCurrent ? 'outline' : 'default'}
          disabled={ctaDisabled}
          onClick={() => onUpgrade(plan.tier)}
        >
          {ctaLabel}
          {!isCurrent && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>
      </CardContent>
    </motion.div>
  )
}

function UsageCard({
  usage,
  subscription,
  onUpgrade,
}: {
  usage: UsageTracking
  subscription: Subscription
  onUpgrade: (tier: PricingTier) => void
}) {
  // Only show metered features (have a numeric limit).
  const metered = usage.metrics.filter(
    (m) => m.limit !== null && m.limit > 0,
  )

  if (metered.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Unlimited usage on {subscription.tier} plan</p>
            <p className="text-sm text-muted-foreground">
              You're on a tier with unlimited metered features — go ahead and scale!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-shopee" />
            <CardTitle className="text-lg">Usage this month</CardTitle>
          </div>
          <Badge variant="outline" className="capitalize">
            {subscription.tier} plan · {usage.period}
          </Badge>
        </div>
        <CardDescription>
          Reset setiap 1hb. Upgrade bila dah nak jam lebih.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metered.map((m) => {
          const pct = m.limit ? Math.min(100, (m.count / m.limit) * 100) : 0
          const isFull = m.limit !== null && m.count >= m.limit
          const isNear = m.limit !== null && pct >= 80 && !isFull
          return (
            <div key={m.feature} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium capitalize">
                  <FeatureIcon feature={m.feature} />
                  {m.label}
                </span>
                <span
                  className={cn(
                    'font-mono text-xs tabular-nums',
                    isFull && 'text-rose-600 dark:text-rose-400',
                    isNear && 'text-amber-600 dark:text-amber-400',
                    !isFull && !isNear && 'text-muted-foreground',
                  )}
                >
                  {m.count} / {m.limit}
                </span>
              </div>
              <Progress
                value={pct}
                className={cn(
                  'h-2',
                  isFull && '[&>[data-slot=progress-indicator]]:bg-rose-500',
                  isNear && '[&>[data-slot=progress-indicator]]:bg-amber-500',
                )}
              />
              {isFull && (
                <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Limit habis — upgrade untuk continue
                </p>
              )}
              {isNear && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Hampir sampai limit — pertimbangkan untuk upgrade
                </p>
              )}
            </div>
          )
        })}

        {metered.some((m) => m.limit !== null && m.count >= m.limit) && (
          <Button
            className="w-full bg-shopee hover:bg-shopee-dark text-white"
            onClick={() => onUpgrade(subscription.tier === 'free' ? 'pro' : 'business')}
          >
            <Zap className="w-4 h-4 mr-1.5" /> Upgrade untuk continue
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function FeatureIcon({ feature }: { feature: FeatureKey }) {
  const cls = 'w-3.5 h-3.5'
  switch (feature) {
    case 'products':
      return <Package className={cls} />
    case 'links':
      return <Link2 className={cls} />
    case 'content':
    case 'ai_content':
      return <FileText className={cls} />
    default:
      return <Brain className={cls} />
  }
}

function FeatureCell({
  plan,
  feature,
}: {
  plan: PricingPlan
  feature: FeatureKey
}) {
  const cap = plan.features.find((f) => f.key === feature)
  if (!cap || !cap.enabled) {
    return (
      <TableCell className="text-center">
        <X className="w-4 h-4 text-muted-foreground/40 mx-auto" aria-label="Not included" />
      </TableCell>
    )
  }
  // For metered features with a numeric limit, show the display text.
  if (cap.limit !== null && cap.limit > 0) {
    return <TableCell className="text-center text-xs font-medium">{cap.display}</TableCell>
  }
  return (
    <TableCell className="text-center">
      <Check
        className={cn(
          'w-4 h-4 mx-auto',
          plan.accent === 'shopee' && 'text-shopee',
          plan.accent === 'hermes' && 'text-hermes',
          plan.accent === 'dark' && 'text-emerald-500',
          plan.accent === 'gray' && 'text-emerald-500',
        )}
        aria-label="Included"
      />
      <span className="sr-only">{cap.display}</span>
    </TableCell>
  )
}

function FeatureComparisonTable({ plans }: { plans: PricingPlan[] }) {
  // Group features by category.
  const categories = useMemo(() => {
    const groups: Record<string, FeatureKey[]> = {
      core: [],
      ai: [],
      team: [],
      support: [],
      enterprise: [],
    }
    const allFeatures = plans[0].features
    for (const f of allFeatures) {
      groups[f.category].push(f.key)
    }
    return groups
  }, [plans])

  const categoryLabels: Record<string, string> = {
    core: 'Core Limits',
    ai: 'AI & Smart Features',
    team: 'Team & API',
    support: 'Support',
    enterprise: 'Enterprise',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="w-5 h-5 text-hermes" />
          Full feature comparison
        </CardTitle>
        <CardDescription>
          Compare semua features side-by-side. Pick the plan yang paling kena dengan you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[40%] font-semibold">Feature</TableHead>
                {plans.map((p) => (
                  <TableHead key={p.tier} className="text-center font-semibold">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{p.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {p.priceMonthly === null
                          ? 'Custom'
                          : p.priceMonthly === 0
                          ? 'Free'
                          : `RM${p.priceMonthly}/mo`}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(categories).map(([cat, features]) => (
                <Fragment key={cat}>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell
                      colSpan={5}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2"
                    >
                      {categoryLabels[cat]}
                    </TableCell>
                  </TableRow>
                  {features.map((feature) => (
                    <TableRow key={feature}>
                      <TableCell className="font-medium">
                        {plans[0].features.find((f) => f.key === feature)?.label ?? feature}
                      </TableCell>
                      {plans.map((p) => (
                        <FeatureCell key={`${p.tier}-${feature}`} plan={p} feature={feature} />
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function FAQSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="w-5 h-5 text-hermes" />
          Soalan lazim (FAQ)
        </CardTitle>
        <CardDescription>
          Soalan paling common pasal pricing & subscription.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-sm font-medium text-left">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: PricingPlan | null
  cycle: BillingCycle
  currentTier: PricingTier
  onCheckoutSuccess: () => void
}

function UpgradeDialog({
  open,
  onOpenChange,
  plan,
  cycle,
  currentTier,
  onCheckoutSuccess,
}: UpgradeDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')
  const queryClient = useQueryClient()

  const checkoutMutation = useMutation({
    mutationFn: async (req: CheckoutRequest) => {
      const res = await fetch('/api/pricing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Checkout failed')
      return data as { checkout: CheckoutSession; message: string; source: 'mock' }
    },
    onSuccess: (data) => {
      toast.success(`Redirecting to ${paymentMethod === 'stripe' ? 'Stripe' : 'Billplz'} checkout…`, {
        description: data.message,
      })
      // Also optimistically update the subscription so the UI reflects the new tier.
      // In production the webhook would handle this; for the demo we just simulate it.
      onCheckoutSuccess()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast.error('Checkout failed', { description: err.message })
    },
  })

  const subscriptionMutation = useMutation({
    mutationFn: async (req: SubscriptionMutationRequest) => {
      const res = await fetch('/api/pricing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Subscription update failed')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-subscription'] })
      queryClient.invalidateQueries({ queryKey: ['pricing-usage'] })
    },
  })

  if (!plan) return null

  const isUpgrade = tierRank(plan.tier) > tierRank(currentTier)
  const isDowngrade = tierRank(plan.tier) < tierRank(currentTier)
  const isFree = plan.tier === 'free'
  const isEnterprise = plan.tier === 'enterprise'

  const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceYearly

  const handleConfirm = () => {
    if (isFree) {
      // Downgrade to free — no checkout needed, just mutate the subscription.
      subscriptionMutation.mutate(
        { action: 'downgrade', targetTier: 'free' },
        {
          onSuccess: () => {
            toast.success(`Downgraded to ${plan.name}`, {
              description: 'Your subscription will switch to Free at the end of the billing cycle.',
            })
            onOpenChange(false)
          },
          onError: (err: Error) => toast.error('Downgrade failed', { description: err.message }),
        },
      )
      return
    }

    if (isEnterprise) {
      toast.info('Contacting sales…', {
        description: 'Email sales@theviralfindsmy.com — our team akan reply dalam 24 jam.',
      })
      onOpenChange(false)
      return
    }

    checkoutMutation.mutate({
      tier: plan.tier,
      billingCycle: cycle,
      paymentMethod,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpgrade && <ArrowRight className="w-5 h-5 text-shopee" />}
            {isDowngrade && <ArrowRight className="w-5 h-5 rotate-180 text-muted-foreground" />}
            {isUpgrade ? 'Upgrade' : 'Downgrade'} to {plan.name}
          </DialogTitle>
          <DialogDescription>
            {plan.tagline}. {plan.description}
          </DialogDescription>
        </DialogHeader>

        {/* Plan summary */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold">{plan.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Billing cycle</span>
            <span className="font-semibold capitalize">{cycle}</span>
          </div>
          {!isFree && !isEnterprise && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono font-semibold">
                {formatRM(price)} {cycle === 'monthly' ? '/ month' : '/ year'}
              </span>
            </div>
          )}
          {isEnterprise && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pricing</span>
              <span className="font-semibold text-amber-600">Custom — contact sales</span>
            </div>
          )}
        </div>

        {/* Payment method selector — only for paid non-enterprise tiers */}
        {!isFree && !isEnterprise && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="grid gap-2"
            >
              <Label
                htmlFor="pay-stripe"
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  paymentMethod === 'stripe'
                    ? 'border-shopee bg-shopee/5 ring-1 ring-shopee/30'
                    : 'border-border hover:border-shopee/40',
                )}
              >
                <RadioGroupItem value="stripe" id="pay-stripe" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-shopee" />
                    <span className="font-medium text-sm">Stripe</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">International</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Visa, Mastercard, Amex. Best untuk international affiliates.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="pay-billplz"
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  paymentMethod === 'billplz'
                    ? 'border-hermes bg-hermes/5 ring-1 ring-hermes/30'
                    : 'border-border hover:border-hermes/40',
                )}
              >
                <RadioGroupItem value="billplz" id="pay-billplz" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-hermes" />
                    <span className="font-medium text-sm">Billplz (FPX)</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">🇲🇾 Malaysia</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    FPX online banking — Maybank2u, CIMB Clicks, RHB, semua bank MY.
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>
        )}

        {/* Trial notice for upgrades */}
        {isUpgrade && !isEnterprise && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              7-day free trial included. No charge for 7 days — cancel anytime dalam trial period.
            </span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={checkoutMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={checkoutMutation.isPending || subscriptionMutation.isPending}
            className={plan.highlight ? 'bg-shopee hover:bg-shopee-dark text-white' : ''}
          >
            {checkoutMutation.isPending || subscriptionMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Processing…
              </>
            ) : isEnterprise ? (
              'Contact Sales'
            ) : isFree ? (
              'Confirm Downgrade'
            ) : (
              `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PricingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-5 w-20 mt-2" />
            <Skeleton className="h-3 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [upgradeTarget, setUpgradeTarget] = useState<PricingTier | null>(null)
  const queryClient = useQueryClient()

  // ─── Queries ──────────────────────────────────────────────────────────
  const plansQuery = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const res = await fetch('/api/pricing/plans')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load plans')
      return data as {
        plans: PricingPlan[]
        features: { key: FeatureKey; label: string; category: string }[]
        yearlyDiscountPct: number
        source: 'mock'
      }
    },
    staleTime: 5 * 60 * 1000, // plans rarely change
  })

  const subscriptionQuery = useQuery({
    queryKey: ['pricing-subscription'],
    queryFn: async () => {
      const res = await fetch('/api/pricing/subscription')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load subscription')
      return data as { subscription: Subscription; source: 'mock' }
    },
    staleTime: 60 * 1000,
  })

  const usageQuery = useQuery({
    queryKey: ['pricing-usage'],
    queryFn: async () => {
      const res = await fetch('/api/pricing/usage')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load usage')
      return data as { usage: UsageTracking; tier: PricingTier; source: 'mock' }
    },
    staleTime: 30 * 1000,
    // Don't error out — usage is only relevant when signed in.
    retry: false,
  })

  const currentTier = subscriptionQuery.data?.subscription.tier ?? 'free'
  const currentSub = subscriptionQuery.data?.subscription
  const usage = usageQuery.data?.usage

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleUpgradeClick = (tier: PricingTier) => {
    if (tier === currentTier) {
      toast.info("You're already on this plan")
      return
    }
    setUpgradeTarget(tier)
  }

  const handleCheckoutSuccess = () => {
    // Optimistically invalidate so the page refetches after the dialog closes.
    queryClient.invalidateQueries({ queryKey: ['pricing-subscription'] })
    queryClient.invalidateQueries({ queryKey: ['pricing-usage'] })
  }

  const targetPlan = useMemo(
    () => plansQuery.data?.plans.find((p) => p.tier === upgradeTarget) ?? null,
    [plansQuery.data, upgradeTarget],
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2 rounded-xl bg-shopee/10 text-shopee">
                <Crown className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pricing Plans</h1>
              <Badge variant="outline" className="border-shopee/30 text-shopee bg-shopee/5">
                Fasa 4.1
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Pilih plan yang sesuai untuk anda. Cancel anytime, no hidden fees, confirm berbaloi.
            </p>
          </div>
          <BillingToggle cycle={cycle} onChange={setCycle} />
        </div>

        {cycle === 'yearly' && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            You're saving 20% dengan yearly billing. Best value!
          </div>
        )}
      </motion.div>

      {/* ─── Pricing cards ───────────────────────────────────────────── */}
      {plansQuery.isLoading ? (
        <PricingSkeleton />
      ) : plansQuery.isError ? (
        <Card className="border-rose-500/30">
          <CardContent className="p-6 text-center text-sm text-rose-600 dark:text-rose-400">
            Failed to load pricing plans.{' '}
            <Button
              variant="link"
              className="px-1"
              onClick={() => plansQuery.refetch()}
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </CardContent>
        </Card>
      ) : plansQuery.data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {plansQuery.data.plans.map((plan) => (
            <PricingCard
              key={plan.tier}
              plan={plan}
              cycle={cycle}
              currentTier={currentTier}
              isCurrent={currentTier === plan.tier}
              onUpgrade={handleUpgradeClick}
            />
          ))}
        </div>
      ) : null}

      {/* ─── Current usage card ──────────────────────────────────────── */}
      {currentSub && usage && (
        <UsageCard
          usage={usage}
          subscription={currentSub}
          onUpgrade={handleUpgradeClick}
        />
      )}

      {/* ─── Feature comparison table ────────────────────────────────── */}
      {plansQuery.data && (
        <FeatureComparisonTable plans={plansQuery.data.plans} />
      )}

      {/* ─── FAQ ─────────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ─── Footer trust badges ─────────────────────────────────────── */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <Shield className="w-5 h-5 text-emerald-500 mx-auto" />
            <p className="text-sm font-medium">Secure payments</p>
            <p className="text-xs text-muted-foreground">Stripe + Billplz encrypted</p>
          </div>
          <div className="space-y-1">
            <RefreshCw className="w-5 h-5 text-shopee mx-auto" />
            <p className="text-sm font-medium">Cancel anytime</p>
            <p className="text-xs text-muted-foreground">No lock-in, no penalty</p>
          </div>
          <div className="space-y-1">
            <CreditCard className="w-5 h-5 text-hermes mx-auto" />
            <p className="text-sm font-medium">Local + international</p>
            <p className="text-xs text-muted-foreground">FPX, Visa, Mastercard, Amex</p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Upgrade dialog ──────────────────────────────────────────── */}
      <UpgradeDialog
        open={upgradeTarget !== null}
        onOpenChange={(o) => !o && setUpgradeTarget(null)}
        plan={targetPlan}
        cycle={cycle}
        currentTier={currentTier}
        onCheckoutSuccess={handleCheckoutSuccess}
      />
    </div>
  )
}
