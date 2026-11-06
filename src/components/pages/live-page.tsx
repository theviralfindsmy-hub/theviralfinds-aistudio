'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  Plus,
  Calendar,
  Users,
  DollarSign,
  Percent,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  Copy,
  Loader2,
  Zap,
  ArrowUpRight,
  TrendingUp,
  ShoppingCart,
  Eye,
  GripVertical,
  Trash2,
  X,
  ChevronRight,
  Activity,
  ShoppingBag,
  Gift,
  Timer,
  Flame,
  Bell,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type {
  LiveAnalytics,
  LiveProduct,
  LiveScript,
  LiveSession,
  LiveSessionStatus,
  ScriptTemplate,
} from '@/lib/live/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtRM = (n: number) =>
  new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    maximumFractionDigits: 2,
  }).format(n || 0)

const fmtNum = (n: number) => new Intl.NumberFormat('en-MY').format(n || 0)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kuala_Lumpur',
  })

// ─── Countdown timer hook ────────────────────────────────────────────────────
function useCountdown(targetIso: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  return useMemo(() => {
    const target = new Date(targetIso).getTime()
    const diff = target - now
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, total: 0 }
    }
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return { days, hours, minutes, seconds, isPast: false, total: diff }
  }, [targetIso, now])
}

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LiveSessionStatus }) {
  switch (status) {
    case 'live':
      return (
        <Badge className="bg-red-500 hover:bg-red-500 text-white gap-1">
          <span className="size-1.5 rounded-full bg-white animate-pulse" />
          LIVE NOW
        </Badge>
      )
    case 'scheduled':
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" /> Scheduled
        </Badge>
      )
    case 'completed':
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
          <CheckCircle2 className="size-3" /> Completed
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="outline" className="text-muted-foreground gap-1">
          <XCircle className="size-3" /> Cancelled
        </Badge>
      )
  }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  hint?: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {label}
            </p>
            <p className="text-xl md:text-2xl font-bold truncate">{value}</p>
            {hint && (
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {hint}
              </p>
            )}
          </div>
          <div className={cn('rounded-lg p-2 shrink-0', accent)}>
            <Icon className="size-4 md:size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Countdown Display ───────────────────────────────────────────────────────
function CountdownDisplay({
  target,
  compact = false,
}: {
  target: string
  compact?: boolean
}) {
  const { days, hours, minutes, seconds, isPast } = useCountdown(target)

  if (isPast) {
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1">
        <Clock className="size-3" /> Starting soon
      </Badge>
    )
  }

  const box = (n: number, label: string) => (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'rounded-md bg-muted font-mono font-bold tabular-nums',
          compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm md:text-base'
        )}
      >
        {String(n).padStart(2, '0')}
      </div>
      {!compact && (
        <span className="text-[9px] uppercase text-muted-foreground mt-0.5">
          {label}
        </span>
      )}
    </div>
  )

  return (
    <div className="flex items-center gap-1">
      {days > 0 && box(days, 'Days')}
      {days > 0 && <span className="text-muted-foreground">:</span>}
      {box(hours, 'Hrs')}
      <span className="text-muted-foreground">:</span>
      {box(minutes, 'Min')}
      <span className="text-muted-foreground">:</span>
      {box(seconds, 'Sec')}
    </div>
  )
}

// ─── Flash Sale Timer (price reveal) ─────────────────────────────────────────
function FlashSaleTimer({ product }: { product: LiveProduct }) {
  // Hook MUST run before any early return — compute target memoized by duration.
  const target = useMemo(
    () =>
      new Date(
        Date.now() + (product.flashSale?.durationMin ?? 5) * 60_000
      ).toISOString(),
    [product.flashSale?.durationMin]
  )
  const { total } = useCountdown(target)

  if (!product.flashSale?.enabled) return null

  const durationMs = product.flashSale.durationMin * 60_000
  const progress = Math.max(
    0,
    Math.min(100, (1 - total / durationMs) * 100)
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/30 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Flame className="size-4 text-orange-600" />
          <span className="font-bold text-orange-700 dark:text-orange-400 text-sm">
            FLASH SALE
          </span>
        </div>
        <CountdownDisplay target={target} compact />
      </div>
      <Progress value={progress} className="h-1.5 mb-2" />
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground line-through">
            {fmtRM(product.livePrice)}
          </p>
          <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
            {fmtRM(product.flashSale.flashPrice)}
          </p>
        </div>
        <Badge className="bg-orange-600 hover:bg-orange-600 text-white">
          First {product.flashSale.firstNBuyers} buyers
        </Badge>
      </div>
    </motion.div>
  )
}

// ─── Session Card ────────────────────────────────────────────────────────────
function SessionCard({
  session,
  onOpen,
  onOpenAnalytics,
}: {
  session: LiveSession
  onOpen: () => void
  onOpenAnalytics: () => void
}) {
  const isLive = session.status === 'live'
  const isPast = session.status === 'completed'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'overflow-hidden transition-shadow hover:shadow-md cursor-pointer h-full',
          isLive && 'border-red-500/40 ring-1 ring-red-500/30'
        )}
        onClick={onOpen}
      >
        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base md:text-lg line-clamp-2 leading-tight">
              {session.title}
            </CardTitle>
            <StatusBadge status={session.status} />
          </div>
          <CardDescription className="flex items-center gap-1.5 text-xs">
            <Calendar className="size-3" />
            {fmtDate(session.scheduledAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Countdown for scheduled sessions */}
          {session.status === 'scheduled' && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Timer className="size-4 text-orange-600 shrink-0" />
              <CountdownDisplay target={session.scheduledAt} compact />
            </div>
          )}

          {/* Live now — viewer count */}
          {isLive && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-950/30">
              <Radio className="size-4 text-red-600 shrink-0 animate-pulse" />
              <span className="text-sm">
                <span className="font-bold">{fmtNum(session.viewerCount ?? 0)}</span>{' '}
                <span className="text-muted-foreground">watching now</span>
              </span>
            </div>
          )}

          {/* Past session — earnings */}
          {isPast && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
              <DollarSign className="size-4 text-emerald-600 shrink-0" />
              <span className="text-sm">
                <span className="font-bold">{fmtRM(session.actualEarnings ?? 0)}</span>{' '}
                <span className="text-muted-foreground">
                  earned · {fmtNum(session.viewerCount ?? 0)} viewers
                </span>
              </span>
            </div>
          )}

          {/* Product + commission summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">
                Products
              </p>
              <p className="font-bold text-sm">{(session.products ?? []).length}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">
                Avg Commission
              </p>
              <p className="font-bold text-sm text-orange-600">
                {session.averageCommission}%
              </p>
            </div>
          </div>

          {/* Tags */}
          {(session.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(session.tags ?? []).slice(0, 4).map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="text-[10px] py-0 px-1.5"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
          >
            {isLive ? (
              <>
                <Play className="size-3 mr-1" /> Join Live
              </>
            ) : isPast ? (
              <>
                <Eye className="size-3 mr-1" /> View Details
              </>
            ) : (
              <>
                <ShoppingBag className="size-3 mr-1" /> Manage Queue
              </>
            )}
          </Button>
          {isPast && (
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={(e) => {
                e.stopPropagation()
                onOpenAnalytics()
              }}
            >
              <TrendingUp className="size-3 mr-1" /> Analytics
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// ─── Sortable Product Item ───────────────────────────────────────────────────
function SortableProduct({
  product,
  index,
  onRemove,
}: {
  product: LiveProduct
  index: number
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2.5 rounded-md border bg-card',
        isDragging && 'shadow-lg border-orange-500/50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>
      <Badge variant="outline" className="font-mono text-xs">
        #{index + 1}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="line-through">{fmtRM(product.originalPrice)}</span>
          <span className="font-semibold text-foreground">
            {fmtRM(product.livePrice)}
          </span>
          <span className="text-orange-600">{product.totalCommission}%</span>
          <span className="flex items-center gap-0.5">
            <Clock className="size-3" />
            {Math.floor(product.displayDurationSec / 60)}m
          </span>
        </div>
      </div>
      {product.flashSale?.enabled && (
        <Badge
          variant="outline"
          className="text-orange-600 border-orange-600/40 text-[10px]"
        >
          <Flame className="size-2.5 mr-0.5" /> Flash
        </Badge>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-muted-foreground hover:text-red-600"
        onClick={onRemove}
        aria-label="Remove product from queue"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

// ─── Session Detail Modal ────────────────────────────────────────────────────
function SessionDetailModal({
  session,
  open,
  onOpenChange,
}: {
  session: LiveSession | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  // Initialise local state from the session prop. The parent passes
  // key={session.id} so this component remounts (resetting all useState)
  // whenever a different session is opened.
  const [queue, setQueue] = useState<LiveProduct[]>(
    () => session?.products ?? []
  )
  const [scripts, setScripts] = useState<LiveScript[]>(
    () => session?.scripts ?? []
  )
  const [selectedTemplate, setSelectedTemplate] = useState('full_session')
  const [selectedProductId, setSelectedProductId] = useState<string>(
    () => session?.products[0]?.id ?? 'all'
  )
  const [generating, setGenerating] = useState(false)
  const [activeScript, setActiveScript] = useState<LiveScript | null>(
    () => session?.scripts?.[0] ?? null
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      setQueue((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      toast.success('Product queue reordered')
    },
    []
  )

  const generateScriptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/live/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.id,
          productId: selectedProductId === 'all' ? undefined : selectedProductId,
          templateId: selectedTemplate,
          language: 'mix',
          tone: 'excited',
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to generate script')
      }
      return res.json()
    },
    onMutate: () => setGenerating(true),
    onSuccess: (data) => {
      const newScript: LiveScript = data.script
      setScripts((s) => [newScript, ...s])
      setActiveScript(newScript)
      toast.success(
        `Script generated via ${data.source === 'ai' ? 'AI' : 'template'}!`
      )
      // Invalidate the session query so the parent refetches
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] })
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setGenerating(false),
  })

  if (!session) return null

  const totalPotential = queue.reduce(
    (sum, p) =>
      sum + ((p.livePrice * p.totalCommission) / 100) * p.estimatedUnits,
    0
  )
  const baseTotal = queue.reduce(
    (sum, p) =>
      sum + ((p.livePrice * p.baseCommission) / 100) * p.estimatedUnits,
    0
  )
  const bonusTotal = totalPotential - baseTotal

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 pr-6">
            <Radio className="size-5 text-orange-600 mt-0.5 shrink-0" />
            <span className="flex-1">{session.title}</span>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <StatusBadge status={session.status} />
            <span className="flex items-center gap-1 text-xs">
              <Calendar className="size-3" /> {fmtDate(session.scheduledAt)}
            </span>
            <span className="text-xs">·</span>
            <span className="text-xs">Host: {session.hostName}</span>
            <span className="text-xs">·</span>
            <span className="text-xs">{session.durationMin} min</span>
          </DialogDescription>
        </DialogHeader>

        {/* Commission breakdown banner */}
        <div className="rounded-lg border border-orange-500/30 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Percent className="size-4 text-orange-600" />
              <span className="font-semibold text-sm">Commission Structure</span>
            </div>
            <Badge className="bg-orange-600 hover:bg-orange-600 text-white">
              Up to 80% total
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-background p-2">
              <p className="text-[10px] uppercase text-muted-foreground">
                Base
              </p>
              <p className="font-bold text-sm">
                {session.products[0]?.baseCommission ?? 8}%
              </p>
            </div>
            <div className="rounded-md bg-background p-2">
              <p className="text-[10px] uppercase text-muted-foreground">
                + Live Bonus
              </p>
              <p className="font-bold text-sm text-orange-600">
                +{session.products[0]?.liveBonusCommission ?? 72}%
              </p>
            </div>
            <div className="rounded-md bg-orange-600 p-2 text-white">
              <p className="text-[10px] uppercase opacity-90">= Total</p>
              <p className="font-bold text-sm">
                {session.products[0]?.totalCommission ?? 80}%
              </p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Potential earnings: <strong>{fmtRM(totalPotential)}</strong>{' '}
            <span className="text-orange-600">
              ({fmtRM(baseTotal)} base + {fmtRM(bonusTotal)} live bonus)
            </span>
          </p>
        </div>

        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="queue">
              <ShoppingBag className="size-3.5 mr-1" /> Product Queue
            </TabsTrigger>
            <TabsTrigger value="script">
              <Sparkles className="size-3.5 mr-1" /> AI Script
            </TabsTrigger>
            <TabsTrigger value="info">
              <Activity className="size-3.5 mr-1" /> Info
            </TabsTrigger>
          </TabsList>

          {/* ─── Product Queue Tab ────────────────────────────────────────── */}
          <TabsContent value="queue" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Drag to reorder — the host will feature products in this order.
              </p>
              <Badge variant="outline">{queue.length} items</Badge>
            </div>

            {queue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No products in queue yet. Add products when scheduling the session.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={queue.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {queue.map((p, i) => (
                      <SortableProduct
                        key={p.id}
                        product={p}
                        index={i}
                        onRemove={() => {
                          setQueue((q) => q.filter((x) => x.id !== p.id))
                          toast.success(`${p.name} removed from queue`)
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Flash sale preview for first product with flash enabled */}
            {queue.find((p) => p.flashSale?.enabled) && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Next Flash Sale
                </p>
                <FlashSaleTimer
                  product={queue.find((p) => p.flashSale?.enabled)!}
                />
              </div>
            )}
          </TabsContent>

          {/* ─── AI Script Tab ────────────────────────────────────────────── */}
          <TabsContent value="script" className="space-y-3 mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Template</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_session">
                      Full Session (30 min)
                    </SelectItem>
                    <SelectItem value="opening">Opening Hook (2 min)</SelectItem>
                    <SelectItem value="demo">Product Demo (5 min)</SelectItem>
                    <SelectItem value="qa">Q&A Segment (3 min)</SelectItem>
                    <SelectItem value="flash_sale">
                      Flash Sale CTA (2 min)
                    </SelectItem>
                    <SelectItem value="closing">
                      Closing & Teaser (1 min)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">For Product (optional)</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products (general)</SelectItem>
                    {(session.products ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => generateScriptMutation.mutate()}
              disabled={generating}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-2" /> Generate Live Script
                </>
              )}
            </Button>

            {/* Generated script list + preview */}
            {scripts.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Generated Scripts ({scripts.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {scripts.map((s) => (
                    <Button
                      key={s.id}
                      size="sm"
                      variant={
                        activeScript?.id === s.id ? 'default' : 'outline'
                      }
                      className="h-7 text-xs"
                      onClick={() => setActiveScript(s)}
                    >
                      {s.generatedBy === 'ai' ? (
                        <Sparkles className="size-3 mr-1" />
                      ) : (
                        <Copy className="size-3 mr-1" />
                      )}
                      {s.templateId} ({s.language})
                    </Button>
                  ))}
                </div>

                {activeScript && (
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 h-7 z-10"
                      onClick={() => {
                        navigator.clipboard.writeText(activeScript.content)
                        toast.success('Script copied to clipboard!')
                      }}
                    >
                      <Copy className="size-3 mr-1" /> Copy
                    </Button>
                    <div className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg max-h-80 overflow-y-auto pr-20 font-mono">
                      {activeScript.content}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ─── Info Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="info" className="space-y-3 mt-3">
            {session.description && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm">{session.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Host</p>
                <p className="font-semibold">{session.hostName}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold">{session.durationMin} minutes</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Potential Earnings
                </p>
                <p className="font-semibold text-orange-600">
                  {fmtRM(session.potentialEarnings)}
                </p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Avg Commission</p>
                <p className="font-semibold">{session.averageCommission}%</p>
              </div>
            </div>
            {(session.tags ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(session.tags ?? []).map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          {session.status === 'scheduled' && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={async () => {
                try {
                  const res = await fetch(
                    `/api/live/sessions/${session.id}`,
                    { method: 'DELETE' }
                  )
                  if (res.ok) {
                    toast.success('Session cancelled')
                    onOpenChange(false)
                    queryClient.invalidateQueries({
                      queryKey: ['live-sessions'],
                    })
                  } else {
                    toast.error('Failed to cancel')
                  }
                } catch {
                  toast.error('Network error')
                }
              }}
            >
              <XCircle className="size-4 mr-2" /> Cancel Session
            </Button>
          )}
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Analytics Modal ─────────────────────────────────────────────────────────
function AnalyticsModal({
  sessionId,
  sessionTitle,
  open,
  onOpenChange,
}: {
  sessionId: string | null
  sessionTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['live-analytics', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/live/analytics?sessionId=${sessionId}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const json = await res.json()
      return json.analytics as LiveAnalytics
    },
    enabled: !!sessionId && open,
  })

  const funnel = useMemo(() => {
    if (!data) return []
    const { impressions, clicks, addToCart, purchases } = data.funnel
    return [
      { stage: 'Impressions', value: impressions, fill: '#94a3b8' },
      { stage: 'Clicks', value: clicks, fill: '#f59e0b' },
      { stage: 'Add to Cart', value: addToCart, fill: '#fb923c' },
      { stage: 'Purchases', value: purchases, fill: '#ea580c' },
    ]
  }, [data])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-orange-600" />
            Post-Live Analytics
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            {sessionTitle}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-600">
            Failed to load analytics. Please try again.
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Top stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="size-3" /> Viewers
                  </div>
                  <p className="text-lg font-bold">{fmtNum(data.viewers)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Peak: {fmtNum(data.peakViewers)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MousePointer /> Clicks
                  </div>
                  <p className="text-lg font-bold">{fmtNum(data.clicks)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {data.avgViewDurationSec}s avg view
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Percent className="size-3" /> Conv. Rate
                  </div>
                  <p className="text-lg font-bold text-orange-600">
                    {data.conversionRate}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {fmtNum(data.conversions)} purchases
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DollarSign className="size-3" /> Earnings
                  </div>
                  <p className="text-lg font-bold text-emerald-600">
                    {fmtRM(data.earnings)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Potential: {fmtRM(data.potentialCommission)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Viewer timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Activity className="size-4 text-orange-600" /> Viewer Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.viewerTimeline}>
                    <defs>
                      <linearGradient id="viewerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="viewers"
                      stroke="#ea580c"
                      strokeWidth={2}
                      fill="url(#viewerGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion funnel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <ShoppingCart className="size-4 text-orange-600" />{' '}
                  Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={funnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {funnel.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top products + earnings breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Gift className="size-4 text-orange-600" /> Top Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                  {data.topProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No product data available
                    </p>
                  ) : (
                    data.topProducts.map((p, i) => (
                      <div
                        key={p.productId}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/40"
                      >
                        <Badge variant="outline" className="font-mono">
                          #{i + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.unitsSold} units · {p.conversionRate}% conv
                          </p>
                        </div>
                        <p className="text-sm font-bold text-emerald-600">
                          {fmtRM(p.earnings)}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <DollarSign className="size-4 text-orange-600" /> Earnings
                    Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Base Commission</span>
                      <span className="font-medium">
                        {fmtRM(data.earningsBreakdown.baseCommission)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Shopee Live Bonus
                      </span>
                      <span className="font-medium text-orange-600">
                        + {fmtRM(data.earningsBreakdown.liveBonus)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Earnings</span>
                      <span className="font-bold text-emerald-600">
                        {fmtRM(data.earningsBreakdown.total)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Bonus share</span>
                      <span>
                        {Math.round(
                          (data.earningsBreakdown.liveBonus /
                            (data.earningsBreakdown.total || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (data.earningsBreakdown.liveBonus /
                          (data.earningsBreakdown.total || 1)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Inline MousePointer icon (lucide doesn't export it cleanly here)
function MousePointer({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  )
}

// ─── Create Session Dialog ───────────────────────────────────────────────────
function CreateSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [hostName, setHostName] = useState('Kak Amy')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('60')
  const [tags, setTags] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/live/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          hostName,
          description,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMin: parseInt(duration),
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to create session')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Live session scheduled!')
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] })
      // Reset form
      setTitle('')
      setDescription('')
      setScheduledAt('')
      setTags('')
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-orange-600" /> Schedule New Session
          </DialogTitle>
          <DialogDescription>
            Schedule a new Shopee Live session. You can add products to the queue
            afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Raya Beauty Haul Live 🌙"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="host">Host Name</Label>
            <Input
              id="host"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the session..."
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sched">Scheduled At *</Label>
              <Input
                id="sched"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dur">Duration (min)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">120 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Raya, Beauty, Flash Sale"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title || !scheduledAt || createMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" /> Scheduling...
              </>
            ) : (
              <>
                <Calendar className="size-4 mr-2" /> Schedule Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export function LivePage() {
  const [tab, setTab] = useState<'upcoming' | 'live' | 'past'>('upcoming')
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [analyticsSession, setAnalyticsSession] = useState<{
    id: string
    title: string
  } | null>(null)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  // Fetch sessions (with summary)
  const { data, isLoading } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/live/sessions?summary=true')
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const json = await res.json()
      return {
        sessions: json.sessions as LiveSession[],
        summary: json.summary,
      }
    },
    refetchInterval: 30_000, // refresh every 30s for live countdowns
  })

  const sessions = data?.sessions ?? []
  const summary = data?.summary

  // Filter by tab
  const filteredSessions = useMemo(() => {
    if (tab === 'upcoming') {
      return sessions.filter(
        (s) => s.status === 'scheduled' || s.status === 'cancelled'
      )
    }
    if (tab === 'live') return sessions.filter((s) => s.status === 'live')
    return sessions.filter((s) => s.status === 'completed')
  }, [sessions, tab])

  const openSession = (session: LiveSession) => {
    setSelectedSession(session)
    setDetailOpen(true)
  }

  const openAnalytics = (session: LiveSession) => {
    setAnalyticsSession({ id: session.id, title: session.title })
    setAnalyticsOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto p-4 md:p-6 space-y-6"
    >
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-lg bg-orange-600 p-1.5">
              <Radio className="size-5 md:size-6 text-white" />
            </span>
            Shopee Live Studio
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Schedule live sessions, manage product queues, and earn up to{' '}
            <span className="font-semibold text-orange-600">80% commission</span>{' '}
            (base + Live bonus).
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 shrink-0"
          size="lg"
        >
          <Plus className="size-4 mr-2" /> Schedule New Session
        </Button>
      </header>

      {/* ─── Stats Cards ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading || !summary ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Sessions"
              value={fmtNum(summary.totalSessions)}
              icon={Radio}
              accent="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
              hint={`${summary.completed} completed · ${summary.upcoming} upcoming`}
            />
            <StatCard
              label="Total Viewers"
              value={fmtNum(summary.totalViewers)}
              icon={Users}
              accent="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
              hint={`${summary.liveNow} live now`}
            />
            <StatCard
              label="Total Earnings"
              value={fmtRM(summary.totalEarnings)}
              icon={DollarSign}
              accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              hint="From completed sessions"
            />
            <StatCard
              label="Avg Conversion"
              value={`${summary.avgConversionRate}%`}
              icon={TrendingUp}
              accent="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
              hint={`Avg commission: ${summary.avgCommission}%`}
            />
          </>
        )}
      </section>

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="upcoming" className="gap-1">
            <Calendar className="size-3.5" />
            <span className="hidden sm:inline">Upcoming</span>
            {summary && summary.upcoming > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 px-1 text-[10px]"
              >
                {summary.upcoming}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-1">
            <Radio className="size-3.5" />
            <span className="hidden sm:inline">Live Now</span>
            {summary && summary.liveNow > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[10px] bg-red-500">
                {summary.liveNow}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1">
            <CheckCircle2 className="size-3.5" />
            <span className="hidden sm:inline">Past Sessions</span>
            {summary && summary.completed > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 px-1 text-[10px]"
              >
                {summary.completed}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-72 w-full" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Radio className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {tab === 'live'
                    ? 'No live sessions right now. Check upcoming sessions!'
                    : tab === 'past'
                      ? 'No past sessions yet. Start your first live to see analytics here.'
                      : 'No upcoming sessions. Schedule one to get started!'}
                </p>
                {tab === 'upcoming' && (
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className="mt-4 bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="size-4 mr-2" /> Schedule Session
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onOpen={() => openSession(session)}
                    onOpenAnalytics={() => openAnalytics(session)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Modals ───────────────────────────────────────────────────────── */}
      <SessionDetailModal
        key={selectedSession?.id ?? 'none'}
        session={selectedSession}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <AnalyticsModal
        sessionId={analyticsSession?.id ?? null}
        sessionTitle={analyticsSession?.title ?? ''}
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
      />
      <CreateSessionDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* ─── Footer info ──────────────────────────────────────────────────── */}
      <Card className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/10">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="rounded-lg bg-orange-600/10 p-2">
            <Zap className="size-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              Shopee Live commission boost: up to 80%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Base commission (2.5–12%) + Shopee Live bonus (up to +72%) =
              maximum 80% commission. Host live sessions to unlock the bonus
              tier.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-orange-500/40 text-orange-700 hover:bg-orange-100 dark:text-orange-400"
            onClick={() => toast.info('Live commission guide coming soon!')}
          >
            Learn more <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default LivePage
