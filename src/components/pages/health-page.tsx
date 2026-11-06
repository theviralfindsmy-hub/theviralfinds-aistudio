'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  AlertTriangle,
  AlertCircle,
  Clock,
  Shield,
  Activity,
  TrendingDown,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Info,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const HEALTH_SCORE = 78

const keyMetrics = [
  {
    label: 'Order Cancellation Rate',
    value: 3.2,
    target: 5,
    unit: '%',
    trend: 'down' as const,
    trendLabel: '-0.4% vs last week',
  },
  {
    label: 'Late Shipment Rate',
    value: 2.1,
    target: 3,
    unit: '%',
    trend: 'down' as const,
    trendLabel: '-0.2% vs last week',
  },
  {
    label: 'Non-fulfillment Rate',
    value: 1.4,
    target: 2,
    unit: '%',
    trend: 'up' as const,
    trendLabel: '+0.1% vs last week',
  },
  {
    label: 'Response Rate',
    value: 87,
    target: 80,
    unit: '%',
    trend: 'up' as const,
    trendLabel: '+2% vs last week',
  },
]

const penaltyTimeline = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  const dayLabel = `${date.getDate()}/${date.getMonth() + 1}`
  const base = Math.sin(i / 5) * 3 + 4
  return {
    name: dayLabel,
    points: Math.round((base + Math.random() * 2) * 10) / 10,
  }
})

type IssueSeverity = 'Critical' | 'Warning' | 'Info'

const listingsWithIssues: {
  id: string
  productName: string
  issueType: string
  severity: IssueSeverity
  actionRequired: string
  dateDetected: string
}[] = [
  {
    id: 'LI-001',
    productName: 'Wireless Bluetooth Earbuds Pro',
    issueType: 'Prohibited Item',
    severity: 'Critical',
    actionRequired: 'Remove listing immediately',
    dateDetected: '2025-03-01',
  },
  {
    id: 'LI-002',
    productName: 'Organic Face Serum 30ml',
    issueType: 'Missing Certification',
    severity: 'Critical',
    actionRequired: 'Upload required certifications',
    dateDetected: '2025-03-02',
  },
  {
    id: 'LI-003',
    productName: 'Kids Toy Building Blocks Set',
    issueType: 'Safety Label Missing',
    severity: 'Warning',
    actionRequired: 'Add safety warning label',
    dateDetected: '2025-03-03',
  },
  {
    id: 'LI-004',
    productName: 'USB-C Fast Charging Cable 2m',
    issueType: 'Incorrect Specs',
    severity: 'Warning',
    actionRequired: 'Update product specifications',
    dateDetected: '2025-03-04',
  },
  {
    id: 'LI-005',
    productName: 'Portable Blender 400ml',
    issueType: 'Image Quality',
    severity: 'Info',
    actionRequired: 'Upload higher resolution images',
    dateDetected: '2025-03-05',
  },
  {
    id: 'LI-006',
    productName: 'Leather Wallet RFID Block',
    issueType: 'Category Mismatch',
    severity: 'Info',
    actionRequired: 'Update product category',
    dateDetected: '2025-03-05',
  },
  {
    id: 'LI-007',
    productName: 'Smart Watch Fitness Tracker',
    issueType: 'Trademark Infringement',
    severity: 'Critical',
    actionRequired: 'Remove brand references',
    dateDetected: '2025-03-06',
  },
]

const lateOrders: {
  orderId: string
  daysLate: number
  expectedShipDate: string
  buyerInfo: string
}[] = [
  {
    orderId: 'ORD-20250301-4521',
    daysLate: 4,
    expectedShipDate: '2025-02-28',
    buyerInfo: 'Ahmad R.',
  },
  {
    orderId: 'ORD-20250302-7832',
    daysLate: 3,
    expectedShipDate: '2025-03-01',
    buyerInfo: 'Siti N.',
  },
  {
    orderId: 'ORD-20250303-1190',
    daysLate: 2,
    expectedShipDate: '2025-03-02',
    buyerInfo: 'Lim W.',
  },
  {
    orderId: 'ORD-20250304-3345',
    daysLate: 1,
    expectedShipDate: '2025-03-03',
    buyerInfo: 'Kumar S.',
  },
  {
    orderId: 'ORD-20250305-8877',
    daysLate: 1,
    expectedShipDate: '2025-03-04',
    buyerInfo: 'Nurul A.',
  },
]

const shopPerformance = {
  preparing: 23,
  shipped: 187,
  delivered: 1429,
  cancelled: 14,
  returnRefund: 8,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHealthColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  return '#ef4444'
}

function getHealthStatus(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Attention'
  return 'Critical'
}

function getHealthStatusColor(score: number): string {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-yellow-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

function severityBadgeClasses(severity: IssueSeverity): string {
  switch (severity) {
    case 'Critical':
      return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
    case 'Warning':
      return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
    case 'Info':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
  }
}

function getMetricProgress(metric: (typeof keyMetrics)[number]): number {
  if (metric.label === 'Response Rate') {
    return Math.min((metric.value / 100) * 100, 100)
  }
  return Math.min((metric.value / metric.target) * 100, 100)
}

function getMetricColor(metric: (typeof keyMetrics)[number]): string {
  if (metric.label === 'Response Rate') {
    return metric.value >= metric.target ? 'bg-emerald-500' : 'bg-red-500'
  }
  return metric.value <= metric.target ? 'bg-emerald-500' : 'bg-red-500'
}

function getMetricTrackColor(metric: (typeof keyMetrics)[number]): string {
  if (metric.label === 'Response Rate') {
    return metric.value >= metric.target ? 'bg-emerald-500/20' : 'bg-red-500/20'
  }
  return metric.value <= metric.target ? 'bg-emerald-500/20' : 'bg-red-500/20'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const scoreStep = score / steps
    const progressStep = score / steps
    let current = 0

    const interval = setInterval(() => {
      current += 1
      if (current >= steps) {
        setAnimatedScore(score)
        setAnimatedProgress(score)
        clearInterval(interval)
      } else {
        setAnimatedScore(Math.round(scoreStep * current))
        setAnimatedProgress(progressStep * current)
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [score])

  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference
  const color = getHealthColor(score)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center"
    >
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-muted/30"
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeLinecap="butt"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tabular-nums text-foreground">
            {animatedScore}
          </span>
          <span className={cn('text-sm font-bold mt-1', getHealthStatusColor(score))}>
            {getHealthStatus(score)}
          </span>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
        <Clock className="w-3 h-3" />
        Last updated: {new Date().toLocaleString()}
      </div>
    </motion.div>
  )
}

function MetricCard({
  metric,
  index,
}: {
  metric: (typeof keyMetrics)[number]
  index: number
}) {
  const progressValue = getMetricProgress(metric)
  const barColor = getMetricColor(metric)
  const trackColor = getMetricTrackColor(metric)
  const isGood =
    metric.label === 'Response Rate'
      ? metric.value >= metric.target
      : metric.value <= metric.target

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="border-border card-hover rounded-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">{metric.label}</p>
            {isGood ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-black text-foreground">
              {metric.value}
              {metric.unit}
            </span>
            <span className="text-xs text-muted-foreground">
              / {metric.label === 'Response Rate' ? '>' : '<'} {metric.target}{metric.unit}
            </span>
          </div>
          <div className={cn('w-full h-2 rounded-none overflow-hidden', trackColor)}>
            <motion.div
              className={cn('h-full rounded-none', barColor)}
              initial={{ width: 0 }}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {metric.trend === 'down' ? (
              <TrendingDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Activity className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-[11px] text-muted-foreground">{metric.trendLabel}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PenaltyTimelineChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="border-border card-hover rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Penalty Points Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={penaltyTimeline}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  interval={4}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '2px solid hsl(var(--border))',
                    borderRadius: 0,
                    fontSize: 12,
                    boxShadow: '4px 4px 0 hsl(var(--border))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
                />
                <ReferenceLine
                  y={5}
                  stroke="#eab308"
                  strokeDasharray="4 4"
                  label={{ value: 'Warning', fontSize: 10, fill: '#eab308', position: 'right' }}
                />
                <ReferenceLine
                  y={8}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Critical', fontSize: 10, fill: '#ef4444', position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-500" />
              <span className="text-[10px] text-muted-foreground">Penalty Points</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-yellow-500 border-t border-dashed border-yellow-500" />
              <span className="text-[10px] text-muted-foreground">Warning (5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-red-500 border-t border-dashed border-red-500" />
              <span className="text-[10px] text-muted-foreground">Critical (8)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ListingsWithIssuesTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="border-border card-hover rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Listings with Issues
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-none border-border">
              {listingsWithIssues.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Product</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Issue</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Severity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell">Action</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider hidden md:table-cell">Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listingsWithIssues.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
                    className="border-border group"
                  >
                    <TableCell className="py-2.5">
                      <span className="text-sm font-medium text-foreground group-hover:text-blue-500 transition-colors">
                        {item.productName}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-xs text-muted-foreground">{item.issueType}</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <motion.span
                        animate={
                          item.severity === 'Critical'
                            ? { opacity: [1, 0.6, 1] }
                            : item.severity === 'Warning'
                            ? { opacity: [1, 0.7, 1] }
                            : {}
                        }
                        transition={
                          item.severity !== 'Info'
                            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                            : {}
                        }
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 rounded-none border',
                            severityBadgeClasses(item.severity)
                          )}
                        >
                          {item.severity}
                        </Badge>
                      </motion.span>
                    </TableCell>
                    <TableCell className="py-2.5 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">{item.actionRequired}</span>
                    </TableCell>
                    <TableCell className="py-2.5 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.dateDetected}
                      </span>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function LateOrdersAlert() {
  const [isOpen, setIsOpen] = useState(true)
  const criticalCount = lateOrders.filter((o) => o.daysLate > 2).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="border-border card-hover rounded-none">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer select-none group">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                Late Orders Alert
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-none border-red-500/30 text-red-500">
                  {lateOrders.length}
                </Badge>
                {criticalCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-none border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
                    {criticalCount} Critical
                  </Badge>
                )}
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-auto"
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-0">
                {lateOrders.map((order, i) => (
                  <motion.div
                    key={order.orderId}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-between py-3 px-3 -mx-3',
                        order.daysLate > 2
                          ? 'bg-red-500/5 border-l-2 border-red-500'
                          : 'border-l-2 border-transparent',
                        i < lateOrders.length - 1 && 'border-b border-border'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-8 h-8 flex items-center justify-center text-xs font-black rounded-none',
                            order.daysLate > 2
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                              : 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'
                          )}
                        >
                          +{order.daysLate}d
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {order.orderId}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Buyer: {order.buyerInfo} &middot; Expected: {order.expectedShipDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {order.daysLate > 2 ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}

function ShopPerformanceSummary() {
  const items = [
    { label: 'Preparing', value: shopPerformance.preparing, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Shipped', value: shopPerformance.shipped, icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Delivered', value: shopPerformance.delivered, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Cancelled', value: shopPerformance.cancelled, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Return/Refund', value: shopPerformance.returnRefund, icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ]

  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    >
      <Card className="border-border card-hover rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Shop Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-5 gap-0 rounded-none overflow-hidden border border-border">
            {items.map((item, i) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + i * 0.06 }}
                  className={cn(
                    'flex flex-col items-center justify-center p-4',
                    i < items.length - 1 && 'border-r border-border'
                  )}
                >
                  <div className={cn('w-9 h-9 flex items-center justify-center rounded-none mb-2', item.bg)}>
                    <item.icon className={cn('w-4 h-4', item.color)} />
                  </div>
                  <span className="text-xl font-black text-foreground tabular-nums">{item.value}</span>
                  <span className="text-[10px] text-muted-foreground font-medium mt-0.5 text-center">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {percentage.toFixed(1)}%
                  </span>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export function HealthPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-blue-500/10 text-blue-500">
            <Heart className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Account Health Monitor</h2>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-none border-lime-500/30 text-lime-600 dark:text-lime-400">
                Live
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor your shop health score, penalty points, and listing issues
            </p>
          </div>
        </div>
      </motion.div>

      {/* Health Score + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-border card-hover rounded-none h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Health Score
                </span>
              </div>
              <HealthScoreGauge score={HEALTH_SCORE} />
              <Separator className="my-4 w-full" />
              <Alert className="rounded-none border-border">
                <Info className="w-4 h-4 text-blue-500" />
                <AlertDescription className="text-xs text-muted-foreground">
                  Your account health is <strong className="text-yellow-500">Good</strong>. 
                  Improve your late shipment rate to reach Excellent status.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {keyMetrics.map((metric, i) => (
            <MetricCard key={metric.label} metric={metric} index={i} />
          ))}
        </div>
      </div>

      {/* Penalty Points Timeline */}
      <PenaltyTimelineChart />

      {/* Listings with Issues + Late Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListingsWithIssuesTable />
        <div className="space-y-6">
          <LateOrdersAlert />
          <ShopPerformanceSummary />
        </div>
      </div>
    </div>
  )
}
