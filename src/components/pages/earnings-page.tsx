'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Wallet,
  CircleCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Target,
  Banknote,
  BarChart3,
} from 'lucide-react'
import { ExportButtons } from '@/components/ui/export-buttons'
import { toast } from 'sonner'

// --- Types ---

interface EarningsSummary {
  totalEarnings: number
  periodEarnings: number
  todayEarnings: number
  weekEarnings: number
  totalRevenue: number
  pendingPayout: number
  completedPayout: number
  conversionCount: number
  avgCommission: number
}

interface EarningsByStatus {
  pending: number
  confirmed: number
  rejected: number
  paid: number
}

interface ChartPoint {
  date: string
  value: number
}

interface RecentConversion {
  id: string
  linkName: string
  amount: number
  commission: number
  status: string
  createdAt: string
}

interface PayoutEntry {
  id: string
  amount: number
  method: string
  bankName: string | null
  status: string
  requestedAt: string
  processedAt: string | null
  note: string | null
}

interface EarningGoalEntry {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  period: string
  status: string
  progress: number
}

interface CategoryBreakdown {
  category: string
  commission: number
}

interface EarningsResponse {
  period: string
  summary: EarningsSummary
  earningsByStatus: EarningsByStatus
  chart: ChartPoint[]
  recentConversions: RecentConversion[]
  payouts: PayoutEntry[]
  goals: EarningGoalEntry[]
  categoryBreakdown: CategoryBreakdown[]
}

// --- Helpers ---

const formatRM = (value: number) =>
  `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatNumber = (value: number) => value.toLocaleString('en-MY')

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.toLocaleString('en', { month: 'short' })} ${d.getDate()}`
}

const formatISODate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

const statusColor: Record<string, string> = {
  confirmed: 'text-emerald-500',
  approved: 'text-emerald-500',
  paid: 'text-emerald-500',
  pending: 'text-amber-500',
  processing: 'text-amber-500',
  rejected: 'text-red-500',
  failed: 'text-red-500',
  completed: 'text-emerald-500',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  approved: 'default',
  paid: 'default',
  pending: 'secondary',
  processing: 'secondary',
  rejected: 'destructive',
  failed: 'destructive',
  completed: 'default',
}

const goalColorMap = ['bg-chart-1', 'bg-chart-2', 'bg-chart-5', 'bg-chart-4', 'bg-chart-3']

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// --- Loading Skeleton ---

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-3 w-20" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1" style={{ height }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${20 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// --- Empty State ---

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="text-muted-foreground/40 size-12" />
      <p className="mt-3 text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  )
}

// --- Component ---

export function EarningsPage() {
  const [calcPrice, setCalcPrice] = useState<string>('')
  const [calcRate, setCalcRate] = useState<string>('')
  const [payoutOpen, setPayoutOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery<EarningsResponse>({
    queryKey: ['earnings', '30d'],
    queryFn: async () => {
      const res = await fetch('/api/earnings?period=30d')
      if (!res.ok) throw new Error('Failed to fetch earnings')
      return res.json()
    },
    staleTime: 30000,
  })

  // Payout request mutation
  const payoutMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        body: JSON.stringify({
          bankName: formData.get('bankName'),
          accountNo: formData.get('accountNo'),
          accountName: formData.get('accountName'),
          amount: parseFloat(formData.get('amount') as string),
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to request payout')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payout request submitted successfully!')
      setPayoutOpen(false)
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: () => {
      toast.error('Failed to submit payout request. Please try again.')
    },
  })

  const handlePayoutSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    payoutMutation.mutate(formData)
  }

  const calcEarning = useMemo(() => {
    const price = parseFloat(calcPrice)
    const rate = parseFloat(calcRate)
    if (isNaN(price) || isNaN(rate)) return null
    return (price * rate) / 100
  }, [calcPrice, calcRate])

  const summary = data?.summary

  const summaryCards = [
    {
      title: "Today's Earnings",
      value: formatRM(summary?.todayEarnings || 0),
      change: '',
      up: true,
      icon: DollarSign,
    },
    {
      title: 'This Week',
      value: formatRM(summary?.weekEarnings || 0),
      change: '',
      up: true,
      icon: TrendingUp,
    },
    {
      title: 'This Month',
      value: formatRM(summary?.periodEarnings || 0),
      change: '',
      up: true,
      icon: Calendar,
    },
    {
      title: 'Total Earnings',
      value: formatRM(summary?.totalEarnings || 0),
      change: '',
      up: true,
      icon: Wallet,
    },
    {
      title: 'Pending Payout',
      value: formatRM(summary?.pendingPayout || 0),
      change: '',
      up: true,
      icon: Clock,
    },
    {
      title: 'Completed Payout',
      value: formatRM(summary?.completedPayout || 0),
      change: '',
      up: true,
      icon: CircleCheck,
    },
  ]

  // Chart data
  const chartData = (data?.chart || []).map((p) => ({
    date: formatDate(p.date),
    earnings: p.value,
  }))

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="mt-2 h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TableSkeleton className="lg:col-span-2" />
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TableSkeleton className="lg:col-span-2" />
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // --- Error State ---
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground text-sm">
            Track your commissions, payouts, and earning goals
          </p>
        </div>
        <EmptyState message="Unable to load earnings data. Please try again later." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground text-sm">
            Track your commissions, payouts, and earning goals
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons type="earnings" period="30d" />
          <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Banknote className="size-4" />
                Request Payout
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Enter your bank details and the amount you wish to withdraw.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayoutSubmit}>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Select name="bankName">
                    <SelectTrigger id="bank-name" className="w-full">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maybank">Maybank</SelectItem>
                      <SelectItem value="cimb">CIMB</SelectItem>
                      <SelectItem value="rhb">RHB</SelectItem>
                      <SelectItem value="public">Public Bank</SelectItem>
                      <SelectItem value="hong-leong">Hong Leong Bank</SelectItem>
                      <SelectItem value="ambank">AmBank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input id="account-number" name="accountNo" placeholder="e.g. 123456789012" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input id="account-name" name="accountName" placeholder="e.g. Ahmad bin Ali" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payout-amount">Amount (RM)</Label>
                  <Input
                    id="payout-amount"
                    name="amount"
                    type="number"
                    placeholder="e.g. 500.00"
                    min={50}
                  />
                  <p className="text-muted-foreground text-xs">
                    Minimum payout amount is RM 50.00
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setPayoutOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={payoutMutation.isPending}>
                  {payoutMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {summaryCards.map((stat) => (
          <motion.div key={stat.title} variants={fadeIn}>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">{stat.title}</CardDescription>
                <stat.icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    {stat.up ? (
                      <ArrowUpRight className="size-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="size-3 text-red-500" />
                    )}
                    <span className={stat.up ? 'text-emerald-500' : 'text-red-500'}>
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Earnings Chart */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-base">Earnings Over Time</CardTitle>
            <CardDescription>Daily commission earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 || chartData.every((p) => p.earnings === 0) ? (
              <EmptyState message="No earnings data yet. Earnings will appear here once conversions are recorded." />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      interval={4}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      tickFormatter={(v: number) => `RM ${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                      formatter={(value: number) => formatRM(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="var(--color-chart-1)"
                      fill="url(#earningsGradient)"
                      strokeWidth={2}
                      name="Earnings"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Conversions + Commission Calculator */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Conversions */}
        <motion.div {...fadeIn} className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Recent Conversions</CardTitle>
              <CardDescription>Latest affiliate commission entries</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.recentConversions.length ? (
                <EmptyState message="No conversions yet. Conversions will appear here once purchases are made through your links." />
              ) : (
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentConversions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.linkName}</TableCell>
                          <TableCell className="text-right">{formatRM(c.amount)}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {formatRM(c.commission)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[c.status] || 'secondary'} className="capitalize">
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatISODate(c.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Commission Calculator */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="size-4" />
                Commission Calculator
              </CardTitle>
              <CardDescription>Estimate your earnings quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="calc-price">Product Price (RM)</Label>
                <Input
                  id="calc-price"
                  type="number"
                  placeholder="e.g. 299.90"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="calc-rate">Commission Rate (%)</Label>
                <Input
                  id="calc-rate"
                  type="number"
                  placeholder="e.g. 10"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value)}
                />
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Estimated Earnings
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {calcEarning !== null ? formatRM(calcEarning) : 'RM 0.00'}
                </p>
              </div>
              <div className="text-muted-foreground text-xs">
                <p>Common rates:</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {['5%', '8%', '10%', '12%', '15%'].map((rate) => (
                    <Button
                      key={rate}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setCalcRate(rate.replace('%', ''))}
                    >
                      {rate}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payout History + Earning Goals */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Payout History */}
        <motion.div {...fadeIn} className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Payout History</CardTitle>
              <CardDescription>Record of your withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.payouts.length ? (
                <EmptyState message="No payout history yet. Request a payout to see it here." />
              ) : (
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Requested</TableHead>
                        <TableHead className="text-right">Processed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.payouts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.bankName || p.method}</TableCell>
                          <TableCell className="text-right">{formatRM(p.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[p.status] || 'secondary'} className="capitalize">
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatISODate(p.requestedAt)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {p.processedAt ? formatISODate(p.processedAt) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Earning Goals */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4" />
                Earning Goals
              </CardTitle>
              <CardDescription>Track progress towards your targets</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.goals.length ? (
                <EmptyState message="No earning goals set. Create goals to track your progress." />
              ) : (
                <div className="space-y-6">
                  {data.goals.map((goal, i) => {
                    const pct = goal.progress
                    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-muted-foreground">
                            {formatRM(goal.currentAmount)} / {formatRM(goal.targetAmount)}
                          </span>
                        </div>
                        <Progress value={pct} className="h-2.5" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{pct}% achieved</span>
                          <span className="font-medium">
                            {formatRM(remaining)} remaining
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      {data?.categoryBreakdown && data.categoryBreakdown.length > 0 && (
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Commission by Category</CardTitle>
              <CardDescription>Earnings breakdown across product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      tickFormatter={(v: number) => `RM ${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                      formatter={(value: number) => formatRM(value)}
                    />
                    <Bar dataKey="commission" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Commission" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
