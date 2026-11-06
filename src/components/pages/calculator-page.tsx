'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Lightbulb,
  Plus,
  ArrowUpRight,
  ShoppingBag,
  Target,
  Zap,
  Info,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRM = (value: number) =>
  `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalculatorPage() {
  const [productPrice, setProductPrice] = useState<string>('100')
  const [commissionRate, setCommissionRate] = useState<number>(8)
  const [estimatedSales, setEstimatedSales] = useState<string>('30')

  const presetRates = [3, 5, 8, 10, 15]

  const price = parseFloat(productPrice) || 0
  const sales = parseInt(estimatedSales) || 0

  const earningsPerSale = useMemo(() => (price * commissionRate) / 100, [price, commissionRate])
  const monthlyEarnings = useMemo(() => earningsPerSale * sales, [earningsPerSale, sales])

  // Comparison table data
  const rates = [3, 5, 8, 10, 15]
  const salesVolumes = [10, 30, 50, 100]

  const tips = [
    {
      icon: Target,
      title: 'Focus on High-Commission Categories',
      description: 'Electronics and beauty products often offer 8-15% commission rates, maximizing your per-sale earnings.',
    },
    {
      icon: TrendingUp,
      title: 'Promote During Sale Events',
      description: '11.11, 12.12, and Payday sales drive 3-5x normal traffic. Prepare your links in advance.',
    },
    {
      icon: Zap,
      title: 'Use Short-Form Video Content',
      description: 'TikTok and Reels generate the highest click-through rates for affiliate products.',
    },
    {
      icon: ShoppingBag,
      title: 'Bundle Related Products',
      description: 'Create curated collections (e.g., "Skincare Routine") to increase average order value.',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold tracking-tight">Commission Calculator</h1>
        <p className="text-muted-foreground text-sm">
          Estimate your affiliate earnings and plan your strategy
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calculator Panel */}
        <motion.div {...fadeIn} className="lg:col-span-2 space-y-6">
          {/* Main Calculator */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="size-4 text-shopee" />
                Commission Calculator
              </CardTitle>
              <CardDescription>Enter product details to estimate your earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Price */}
              <div className="grid gap-3">
                <Label htmlFor="product-price" className="text-sm font-medium">
                  Product Price (RM)
                </Label>
                <div className="relative">
                  <DollarSign className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="product-price"
                    type="number"
                    placeholder="e.g. 299.90"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Commission Rate Slider */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Commission Rate</Label>
                  <Badge variant="secondary" className="text-sm font-bold">
                    {commissionRate}%
                  </Badge>
                </div>
                <Slider
                  value={[commissionRate]}
                  onValueChange={(v) => setCommissionRate(v[0])}
                  min={1}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {presetRates.map((rate) => (
                    <Button
                      key={rate}
                      variant={commissionRate === rate ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-3 text-xs"
                      onClick={() => setCommissionRate(rate)}
                    >
                      {rate}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* Estimated Sales */}
              <div className="grid gap-3">
                <Label htmlFor="est-sales" className="text-sm font-medium">
                  Estimated Monthly Sales
                </Label>
                <Input
                  id="est-sales"
                  type="number"
                  placeholder="e.g. 30"
                  value={estimatedSales}
                  onChange={(e) => setEstimatedSales(e.target.value)}
                />
              </div>

              <Separator />

              {/* Results */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-shopee/5 p-4 text-center">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Per Sale
                  </p>
                  <p className="mt-1 text-xl font-bold text-shopee">
                    {formatRM(earningsPerSale)}
                  </p>
                </div>
                <div className="rounded-lg border bg-shopee/10 p-4 text-center">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Monthly Projection
                  </p>
                  <p className="mt-1 text-2xl font-bold text-shopee">
                    {formatRM(monthlyEarnings)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Yearly Projection
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {formatRM(monthlyEarnings * 12)}
                  </p>
                </div>
              </div>

              {/* Add to Links Button */}
              <Button className="w-full gap-2">
                <Plus className="size-4" />
                Add to My Links
              </Button>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowUpRight className="size-4 text-shopee" />
                Earnings Comparison
              </CardTitle>
              <CardDescription>
                Compare earnings across different rates and sales volumes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Rate \ Sales</TableHead>
                      {salesVolumes.map((vol) => (
                        <TableHead key={vol} className="text-center">
                          {vol} sales
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((rate) => (
                      <TableRow key={rate}>
                        <TableCell className="font-medium">{rate}%</TableCell>
                        {salesVolumes.map((vol) => {
                          const earning = (price * rate) / 100 * vol
                          const isHighlighted = rate === commissionRate
                          return (
                            <TableCell
                              key={vol}
                              className={`text-center ${
                                isHighlighted
                                  ? 'font-bold text-shopee bg-shopee/5'
                                  : ''
                              }`}
                            >
                              {formatRM(earning)}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div {...fadeIn} className="space-y-6">
          {/* Quick Stats */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Product Price</span>
                <span className="font-medium">{formatRM(price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Commission Rate</span>
                <span className="font-medium">{commissionRate}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Earnings / Sale</span>
                <span className="font-bold text-shopee">{formatRM(earningsPerSale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Break-even Sales</span>
                <span className="font-medium">
                  {earningsPerSale > 0 ? Math.ceil(price / earningsPerSale) : '∞'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="size-4 text-amber-500" />
                Maximize Commissions
              </CardTitle>
              <CardDescription>Tips to boost your affiliate earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tips.map((tip) => (
                <div key={tip.title} className="flex gap-3">
                  <div className="bg-shopee/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <tip.icon className="text-shopee size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{tip.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-shopee/10 bg-shopee/5">
            <CardContent className="flex gap-3 p-4">
              <Info className="text-shopee size-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-shopee">Commission Rates Vary</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shopee commission rates differ by category. Electronics typically offer 3-6%, while beauty and fashion can reach 10-15%.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
