'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Ticket,
  Percent,
  Package,
  Gift,
  Plus,
  Copy,
  Clock,
  Timer,
  Tag,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type FlashSaleStatus = 'upcoming' | 'active' | 'expired'
type VoucherStatus = 'active' | 'expired' | 'disabled'
type VoucherType = 'fixed' | 'percentage'
type DiscountStatus = 'active' | 'paused' | 'ended'
type BundleRuleType = 'buy_x_get_y' | 'buy_x_get_pct' | 'bundle_price'
type AddOnStatus = 'active' | 'paused' | 'ended'

interface FlashSale {
  id: string
  productName: string
  originalPrice: number
  salePrice: number
  discountPct: number
  stockTotal: number
  stockRemaining: number
  endTime: number // timestamp ms
  status: FlashSaleStatus
}

interface Voucher {
  id: string
  code: string
  type: VoucherType
  value: number
  minSpend: number
  usageLimit: number
  usedCount: number
  status: VoucherStatus
  expiry: string
}

interface DiscountCampaign {
  id: string
  name: string
  discountType: string
  startDate: string
  endDate: string
  productsCount: number
  status: DiscountStatus
}

interface BundleDeal {
  id: string
  name: string
  ruleType: BundleRuleType
  discountValue: number
  mainProducts: string[]
  subProducts: string[]
}

interface AddOnDeal {
  id: string
  name: string
  mainItems: string[]
  subItems: string[]
  discountType: string
  discountValue: number
  status: AddOnStatus
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const now = Date.now()

const mockFlashSales: FlashSale[] = [
  {
    id: 'fs1',
    productName: 'Wireless Earbuds Pro X3',
    originalPrice: 189.0,
    salePrice: 79.0,
    discountPct: 58,
    stockTotal: 500,
    stockRemaining: 127,
    endTime: now + 2 * 3600000 + 15 * 60000,
    status: 'active',
  },
  {
    id: 'fs2',
    productName: 'RGB Mechanical Keyboard MK750',
    originalPrice: 349.0,
    salePrice: 159.0,
    discountPct: 54,
    stockTotal: 200,
    stockRemaining: 43,
    endTime: now + 1 * 3600000 + 42 * 60000,
    status: 'active',
  },
  {
    id: 'fs3',
    productName: 'Smart Watch Fit Ultra',
    originalPrice: 459.0,
    salePrice: 199.0,
    discountPct: 57,
    stockTotal: 300,
    stockRemaining: 88,
    endTime: now + 5 * 3600000,
    status: 'active',
  },
  {
    id: 'fs4',
    productName: 'Portable Blender 400ml',
    originalPrice: 89.0,
    salePrice: 29.0,
    discountPct: 67,
    stockTotal: 1000,
    stockRemaining: 0,
    endTime: now - 3600000,
    status: 'expired',
  },
  {
    id: 'fs5',
    productName: 'USB-C Hub 10-in-1',
    originalPrice: 159.0,
    salePrice: 69.0,
    discountPct: 57,
    stockTotal: 350,
    stockRemaining: 350,
    endTime: now + 48 * 3600000,
    status: 'upcoming',
  },
  {
    id: 'fs6',
    productName: 'Noise Cancelling Headphones',
    originalPrice: 599.0,
    salePrice: 249.0,
    discountPct: 58,
    stockTotal: 150,
    stockRemaining: 150,
    endTime: now + 72 * 3600000,
    status: 'upcoming',
  },
]

const mockVouchers: Voucher[] = [
  { id: 'v1', code: 'RAYA2025', type: 'percentage', value: 15, minSpend: 100, usageLimit: 5000, usedCount: 3421, status: 'active', expiry: '2025-04-30' },
  { id: 'v2', code: 'SAVE10RM', type: 'fixed', value: 10, minSpend: 50, usageLimit: 10000, usedCount: 7823, status: 'active', expiry: '2025-05-15' },
  { id: 'v3', code: 'MEGA25', type: 'percentage', value: 25, minSpend: 200, usageLimit: 2000, usedCount: 2000, status: 'expired', expiry: '2025-02-28' },
  { id: 'v4', code: 'FIRST5', type: 'fixed', value: 5, minSpend: 0, usageLimit: 50000, usedCount: 28910, status: 'active', expiry: '2025-12-31' },
  { id: 'v5', code: 'FREEDELIVERY', type: 'fixed', value: 8, minSpend: 30, usageLimit: 30000, usedCount: 15670, status: 'active', expiry: '2025-06-30' },
  { id: 'v6', code: 'VIP30', type: 'percentage', value: 30, minSpend: 300, usageLimit: 500, usedCount: 312, status: 'active', expiry: '2025-03-31' },
  { id: 'v7', code: 'OLDDEAL', type: 'percentage', value: 10, minSpend: 80, usageLimit: 8000, usedCount: 8010, status: 'disabled', expiry: '2025-01-15' },
]

const mockDiscountCampaigns: DiscountCampaign[] = [
  { id: 'd1', name: '11.11 Super Sale', discountType: 'Percentage Off', startDate: '2025-11-01', endDate: '2025-11-12', productsCount: 245, status: 'active' },
  { id: 'd2', name: 'Raya Collection', discountType: 'Fixed Amount Off', startDate: '2025-03-01', endDate: '2025-03-31', productsCount: 128, status: 'active' },
  { id: 'd3', name: 'Tech Week Specials', discountType: 'Tiered Discount', startDate: '2025-02-15', endDate: '2025-02-22', productsCount: 87, status: 'paused' },
  { id: 'd4', name: 'Back to School', discountType: 'Buy 2 Get 1', startDate: '2025-01-05', endDate: '2025-01-31', productsCount: 156, status: 'ended' },
  { id: 'd5', name: 'Beauty Glow Up', discountType: 'Percentage Off', startDate: '2025-03-10', endDate: '2025-04-10', productsCount: 93, status: 'active' },
  { id: 'd6', name: 'Home & Living Sale', discountType: 'Fixed Amount Off', startDate: '2025-04-01', endDate: '2025-04-30', productsCount: 174, status: 'paused' },
]

const mockBundleDeals: BundleDeal[] = [
  { id: 'b1', name: 'Buy 2 Get 1 Free - Skincare', ruleType: 'buy_x_get_y', discountValue: 100, mainProducts: ['Face Serum', 'Moisturizer', 'Cleanser'], subProducts: ['Free Eye Cream'] },
  { id: 'b2', name: 'Phone + Case Bundle', ruleType: 'bundle_price', discountValue: 45, mainProducts: ['Smartphone X15'], subProducts: ['Premium Case', 'Screen Protector'] },
  { id: 'b3', name: 'Buy 3 Get 20% Off', ruleType: 'buy_x_get_pct', discountValue: 20, mainProducts: ['T-Shirt', 'Jeans', 'Hoodie'], subProducts: ['Any 3rd Item'] },
  { id: 'b4', name: 'Laptop Starter Pack', ruleType: 'bundle_price', discountValue: 89, mainProducts: ['Laptop Pro 15"'], subProducts: ['Wireless Mouse', 'Laptop Sleeve', 'USB Hub'] },
  { id: 'b5', name: 'Gaming Setup Bundle', ruleType: 'bundle_price', discountValue: 129, mainProducts: ['Gaming Monitor 27"'], subProducts: ['Mechanical Keyboard', 'Gaming Mouse'] },
]

const mockAddOnDeals: AddOnDeal[] = [
  { id: 'a1', name: 'Earbuds Add-On', mainItems: ['Smartphone X15', 'Tablet Pro'], subItems: ['Wireless Earbuds', 'Charging Cable'], discountType: 'Fixed Off', discountValue: 25, status: 'active' },
  { id: 'a2', name: 'Screen Protector Deal', mainItems: ['Smartphone X15'], subItems: ['Tempered Glass x2'], discountType: 'Percentage Off', discountValue: 50, status: 'active' },
  { id: 'a3', name: 'Kitchen Bundle Add-On', mainItems: ['Air Fryer XL', 'Rice Cooker'], subItems: ['Silicone Utensil Set', 'Cutting Board'], discountType: 'Fixed Off', discountValue: 15, status: 'paused' },
  { id: 'a4', name: 'Fitness Accessory Pack', mainItems: ['Smart Watch Fit Ultra'], subItems: ['Extra Strap', 'Screen Protector', 'Wireless Charger'], discountType: 'Percentage Off', discountValue: 30, status: 'active' },
  { id: 'a5', name: 'Camera Lens Add-On', mainItems: ['DSLR Camera Kit'], subItems: ['50mm Lens', 'Camera Bag'], discountType: 'Fixed Off', discountValue: 99, status: 'ended' },
  { id: 'a6', name: 'Printer Paper Deal', mainItems: ['Laser Printer Pro'], subItems: ['A4 Paper 5-Ream', 'Toner Cartridge'], discountType: 'Percentage Off', discountValue: 20, status: 'active' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRM = (value: number) =>
  `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function formatTimeRemaining(endTime: number): string {
  const diff = endTime - Date.now()
  if (diff <= 0) return '00:00:00'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
}

const tabContentVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.25 },
}

// ─── Status Config ────────────────────────────────────────────────────────────

const flashSaleStatusConfig: Record<FlashSaleStatus, { label: string; className: string; icon: typeof Play }> = {
  upcoming: { label: 'Upcoming', className: 'bg-sky-500/10 text-sky-500 border-sky-500/30', icon: Clock },
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', icon: Zap },
  expired: { label: 'Expired', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', icon: XCircle },
}

const discountStatusConfig: Record<DiscountStatus, { label: string; className: string; icon: typeof Play }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', icon: Play },
  paused: { label: 'Paused', className: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: Pause },
  ended: { label: 'Ended', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', icon: XCircle },
}

const addOnStatusConfig: Record<AddOnStatus, { label: string; className: string; icon: typeof Play }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', icon: Play },
  paused: { label: 'Paused', className: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: Pause },
  ended: { label: 'Ended', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', icon: XCircle },
}

const voucherStatusConfig: Record<VoucherStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  expired: { label: 'Expired', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
  disabled: { label: 'Disabled', className: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function CountdownTimer({ endTime, status }: { endTime: number; status: FlashSaleStatus }) {
  const [timeStr, setTimeStr] = useState(formatTimeRemaining(endTime))

  useEffect(() => {
    if (status !== 'active') return
    const interval = setInterval(() => {
      setTimeStr(formatTimeRemaining(endTime))
    }, 1000)
    return () => clearInterval(interval)
  }, [endTime, status])

  if (status === 'upcoming') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-sky-500">
        <Clock className="w-3.5 h-3.5" />
        <span>Starts soon</span>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <XCircle className="w-3.5 h-3.5" />
        <span>Ended</span>
      </div>
    )
  }

  return (
    <motion.div
      className="flex items-center gap-1.5"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Timer className="w-3.5 h-3.5 text-acid-lime" />
      <span className="text-sm font-mono font-bold text-acid-lime tracking-wider">{timeStr}</span>
    </motion.div>
  )
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  return (
    <motion.div whileTap={{ scale: 0.9 }}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1 h-7 text-xs border-border"
        onClick={handleCopy}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-1 text-emerald-500"
            >
              <CheckCircle2 className="w-3 h-3" />
              Copied
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  )
}

function VoucherCodeReveal({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(true)

  return (
    <motion.button
      onClick={() => setRevealed(!revealed)}
      className="font-mono text-xs tracking-widest px-2 py-1 border border-dashed border-border hover:border-acid-lime/50 transition-colors cursor-pointer bg-muted/30"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatePresence mode="wait">
        {revealed ? (
          <motion.span
            key="revealed"
            initial={{ filter: 'blur(4px)', opacity: 0 }}
            animate={{ filter: 'blur(0px)', opacity: 1 }}
            exit={{ filter: 'blur(4px)', opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-foreground font-semibold"
          >
            {code}
          </motion.span>
        ) : (
          <motion.span
            key="hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-muted-foreground"
          >
            {'•'.repeat(code.length)}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// ─── Overview Stat Card ───────────────────────────────────────────────────────

function OverviewStatCard({
  icon: Icon,
  label,
  value,
  accent,
  index = 0,
}: {
  icon: React.ElementType
  label: string
  value: string
  accent: 'blue' | 'lime' | 'emerald' | 'amber'
  index?: number
}) {
  const accentClasses = {
    blue: 'bg-[#0099FF]/10 text-[#0099FF]',
    lime: 'bg-acid-lime/15 text-acid-lime-dark',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
  }

  const hoverShadow = {
    blue: 'hover:shadow-[0_0_20px_rgba(0,153,255,0.15)]',
    lime: 'hover:shadow-[0_0_20px_rgba(204,255,0,0.15)]',
    emerald: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    amber: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  }

  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      transition={{ ...staggerItem.transition, delay: index * 0.08 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <Card className={cn(
        'p-4 border-border rounded-none transition-shadow duration-300',
        hoverShadow[accent]
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2.5 rounded-none', accentClasses[accent])}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </Card>
    </motion.div>
  )
}

// ─── Flash Sale Card ──────────────────────────────────────────────────────────

function FlashSaleCard({ sale, index }: { sale: FlashSale; index: number }) {
  const statusCfg = flashSaleStatusConfig[sale.status]
  const stockPct = Math.round(((sale.stockTotal - sale.stockRemaining) / sale.stockTotal) * 100)

  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      transition={{ ...staggerItem.transition, delay: index * 0.06 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className={cn(
        'border-border rounded-none overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(0,153,255,0.12)]',
        sale.status === 'active' && 'border-l-2 border-l-[#0099FF]',
        sale.status === 'expired' && 'opacity-60',
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
              {sale.productName}
            </CardTitle>
            <Badge variant="outline" className={cn('shrink-0 text-[10px] px-1.5 py-0 border rounded-none', statusCfg.className)}>
              <statusCfg.icon className="w-3 h-3 mr-1" />
              {statusCfg.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Prices */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#0099FF]">{formatRM(sale.salePrice)}</span>
            <span className="text-xs text-muted-foreground line-through">{formatRM(sale.originalPrice)}</span>
            <Badge className="rounded-none bg-acid-lime/15 text-acid-lime-dark border-0 text-[10px] px-1.5 font-bold">
              -{sale.discountPct}%
            </Badge>
          </div>

          {/* Countdown */}
          <CountdownTimer endTime={sale.endTime} status={sale.status} />

          {/* Stock */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                <ShoppingBag className="w-3 h-3 inline mr-1" />
                Stock
              </span>
              <span className="font-medium">
                {sale.stockRemaining} / {sale.stockTotal}
              </span>
            </div>
            <Progress
              value={stockPct}
              className={cn(
                'h-1.5 rounded-none',
                stockPct > 80 ? '[&>div]:bg-red-500' : stockPct > 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-[#0099FF]'
              )}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PromotionsPage() {
  const [activeTab, setActiveTab] = useState('flash-sales')
  const [flashSales] = useState<FlashSale[]>(mockFlashSales)
  const [vouchers] = useState<Voucher[]>(mockVouchers)
  const [discountCampaigns] = useState<DiscountCampaign[]>(mockDiscountCampaigns)
  const [bundleDeals] = useState<BundleDeal[]>(mockBundleDeals)
  const [addOnDeals] = useState<AddOnDeal[]>(mockAddOnDeals)

  // Create dialog states
  const [createVoucherOpen, setCreateVoucherOpen] = useState(false)
  const [createFlashSaleOpen, setCreateFlashSaleOpen] = useState(false)
  const [createBundleOpen, setCreateBundleOpen] = useState(false)

  // Form states
  const [voucherFormType, setVoucherFormType] = useState<VoucherType>('percentage')
  const [voucherFormCode, setVoucherFormCode] = useState('')
  const [voucherFormValue, setVoucherFormValue] = useState('')
  const [voucherFormMinSpend, setVoucherFormMinSpend] = useState('0')
  const [voucherFormUsageLimit, setVoucherFormUsageLimit] = useState('')
  const [voucherFormExpiry, setVoucherFormExpiry] = useState('')

  const [fsFormProduct, setFsFormProduct] = useState('')
  const [fsFormOriginalPrice, setFsFormOriginalPrice] = useState('')
  const [fsFormSalePrice, setFsFormSalePrice] = useState('')
  const [fsFormStock, setFsFormStock] = useState('')
  const [fsFormDuration, setFsFormDuration] = useState('6')

  const [bundleFormName, setBundleFormName] = useState('')
  const [bundleFormRuleType, setBundleFormRuleType] = useState<BundleRuleType>('buy_x_get_y')
  const [bundleFormDiscountValue, setBundleFormDiscountValue] = useState('')

  // Force re-render for countdown
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // ─── Computed Stats ────────────────────────────────────────────────────────

  const overviewStats = useMemo(() => {
    const activePromotions =
      flashSales.filter((f) => f.status === 'active').length +
      vouchers.filter((v) => v.status === 'active').length +
      discountCampaigns.filter((d) => d.status === 'active').length

    const totalDiscountedProducts = discountCampaigns.reduce((acc, d) => acc + d.productsCount, 0) + flashSales.length

    const allDiscounts = [
      ...flashSales.map((f) => f.discountPct),
      ...vouchers.filter((v) => v.type === 'percentage').map((v) => v.value),
    ]
    const avgDiscount = allDiscounts.length > 0 ? Math.round(allDiscounts.reduce((a, b) => a + b, 0) / allDiscounts.length) : 0

    const revenueFromPromotions = 48750

    return [
      { icon: Zap, label: 'Active Promotions', value: String(activePromotions), accent: 'blue' as const },
      { icon: Tag, label: 'Total Discounted Products', value: String(totalDiscountedProducts), accent: 'lime' as const },
      { icon: Percent, label: 'Average Discount Rate', value: `${avgDiscount}%`, accent: 'emerald' as const },
      { icon: Gift, label: 'Revenue from Promotions', value: formatRM(revenueFromPromotions), accent: 'amber' as const },
    ]
  }, [flashSales, vouchers, discountCampaigns])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateVoucher = () => {
    if (!voucherFormCode || !voucherFormValue) return
    setCreateVoucherOpen(false)
    setVoucherFormCode('')
    setVoucherFormValue('')
    setVoucherFormMinSpend('0')
    setVoucherFormUsageLimit('')
    setVoucherFormExpiry('')
  }

  const handleCreateFlashSale = () => {
    if (!fsFormProduct || !fsFormSalePrice) return
    setCreateFlashSaleOpen(false)
    setFsFormProduct('')
    setFsFormOriginalPrice('')
    setFsFormSalePrice('')
    setFsFormStock('')
    setFsFormDuration('6')
  }

  const handleCreateBundle = () => {
    if (!bundleFormName || !bundleFormDiscountValue) return
    setCreateBundleOpen(false)
    setBundleFormName('')
    setBundleFormRuleType('buy_x_get_y')
    setBundleFormDiscountValue('')
  }

  const ruleTypeLabels: Record<BundleRuleType, string> = {
    buy_x_get_y: 'Buy X Get Y Free',
    buy_x_get_pct: 'Buy X Get % Off',
    bundle_price: 'Bundle Price',
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <motion.div {...fadeIn} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-[#0099FF]/10 text-[#0099FF]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Promotion Hub</h1>
            <p className="text-sm text-muted-foreground">
              Manage flash sales, vouchers, discounts, bundles & add-on deals
            </p>
          </div>
        </div>
        <Badge variant="outline" className="rounded-none border-acid-lime/40 text-acid-lime-dark bg-acid-lime/10 text-xs">
          <Zap className="w-3 h-3 mr-1" />
          6 Promotion Managers
        </Badge>
      </motion.div>

      {/* ─── Overview Cards ──────────────────────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {overviewStats.map((stat, i) => (
          <OverviewStatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            accent={stat.accent}
            index={i}
          />
        ))}
      </motion.div>

      {/* ─── Tabbed Interface ────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full flex h-auto p-1 bg-muted/50 rounded-none border border-border overflow-x-auto">
          {[
            { value: 'flash-sales', label: 'Flash Sales', icon: Zap },
            { value: 'vouchers', label: 'Vouchers', icon: Ticket },
            { value: 'discounts', label: 'Discounts', icon: Percent },
            { value: 'bundle-deals', label: 'Bundle Deals', icon: Package },
            { value: 'addon-deals', label: 'Add-on Deals', icon: Gift },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 gap-1.5 data-[state=active]:bg-[#0099FF] data-[state=active]:text-white data-[state=active]:shadow-none rounded-none text-xs sm:text-sm"
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Flash Sales Tab ──────────────────────────────────────────── */}
        <TabsContent value="flash-sales">
          <AnimatePresence mode="wait">
            <motion.div
              key="flash-sales"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              {/* Header + Create */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Current Flash Sales</h3>
                  <Badge variant="outline" className="rounded-none text-[10px]">
                    {flashSales.filter((f) => f.status === 'active').length} active
                  </Badge>
                </div>
                <Dialog open={createFlashSaleOpen} onOpenChange={setCreateFlashSaleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5 rounded-none bg-[#0099FF] hover:bg-[#0080DD]">
                      <Plus className="w-3.5 h-3.5" />
                      Create Flash Sale
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-none">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#0099FF]" />
                        Create Flash Sale
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Product Name</label>
                        <Input
                          placeholder="e.g. Wireless Earbuds Pro"
                          value={fsFormProduct}
                          onChange={(e) => setFsFormProduct(e.target.value)}
                          className="rounded-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Original Price (RM)</label>
                          <Input
                            type="number"
                            placeholder="189.00"
                            value={fsFormOriginalPrice}
                            onChange={(e) => setFsFormOriginalPrice(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Sale Price (RM)</label>
                          <Input
                            type="number"
                            placeholder="79.00"
                            value={fsFormSalePrice}
                            onChange={(e) => setFsFormSalePrice(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Stock Quantity</label>
                          <Input
                            type="number"
                            placeholder="500"
                            value={fsFormStock}
                            onChange={(e) => setFsFormStock(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Duration (hours)</label>
                          <Select value={fsFormDuration} onValueChange={setFsFormDuration}>
                            <SelectTrigger className="rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 Hours</SelectItem>
                              <SelectItem value="6">6 Hours</SelectItem>
                              <SelectItem value="12">12 Hours</SelectItem>
                              <SelectItem value="24">24 Hours</SelectItem>
                              <SelectItem value="48">48 Hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" className="rounded-none" onClick={() => setCreateFlashSaleOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="rounded-none bg-[#0099FF] hover:bg-[#0080DD]"
                        onClick={handleCreateFlashSale}
                        disabled={!fsFormProduct || !fsFormSalePrice}
                      >
                        Create
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Flash Sales Grid */}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {flashSales.map((sale, i) => (
                  <FlashSaleCard key={sale.id} sale={sale} index={i} />
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── Vouchers Tab ─────────────────────────────────────────────── */}
        <TabsContent value="vouchers">
          <AnimatePresence mode="wait">
            <motion.div
              key="vouchers"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              {/* Header + Create */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Voucher Management</h3>
                  <Badge variant="outline" className="rounded-none text-[10px]">
                    {vouchers.filter((v) => v.status === 'active').length} active
                  </Badge>
                </div>
                <Dialog open={createVoucherOpen} onOpenChange={setCreateVoucherOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5 rounded-none bg-[#0099FF] hover:bg-[#0080DD]">
                      <Plus className="w-3.5 h-3.5" />
                      Create Voucher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-none">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-[#0099FF]" />
                        Create Voucher
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Voucher Code</label>
                        <Input
                          placeholder="e.g. SUMMER25"
                          value={voucherFormCode}
                          onChange={(e) => setVoucherFormCode(e.target.value.toUpperCase())}
                          className="rounded-none font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Type</label>
                          <Select value={voucherFormType} onValueChange={(v: VoucherType) => setVoucherFormType(v)}>
                            <SelectTrigger className="rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed Amount (RM)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">
                            Value {voucherFormType === 'percentage' ? '(%)' : '(RM)'}
                          </label>
                          <Input
                            type="number"
                            placeholder={voucherFormType === 'percentage' ? '15' : '10'}
                            value={voucherFormValue}
                            onChange={(e) => setVoucherFormValue(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Min Spend (RM)</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={voucherFormMinSpend}
                            onChange={(e) => setVoucherFormMinSpend(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Usage Limit</label>
                          <Input
                            type="number"
                            placeholder="5000"
                            value={voucherFormUsageLimit}
                            onChange={(e) => setVoucherFormUsageLimit(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Expiry Date</label>
                        <Input
                          type="date"
                          value={voucherFormExpiry}
                          onChange={(e) => setVoucherFormExpiry(e.target.value)}
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" className="rounded-none" onClick={() => setCreateVoucherOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="rounded-none bg-[#0099FF] hover:bg-[#0080DD]"
                        onClick={handleCreateVoucher}
                        disabled={!voucherFormCode || !voucherFormValue}
                      >
                        Create
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Voucher Table */}
              <Card className="border-border rounded-none overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-xs font-semibold">Code</TableHead>
                        <TableHead className="text-xs font-semibold">Type</TableHead>
                        <TableHead className="text-xs font-semibold">Value</TableHead>
                        <TableHead className="text-xs font-semibold">Min Spend</TableHead>
                        <TableHead className="text-xs font-semibold">Usage</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Expiry</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((voucher, i) => {
                        const vCfg = voucherStatusConfig[voucher.status]
                        const usagePct = Math.round((voucher.usedCount / voucher.usageLimit) * 100)
                        return (
                          <motion.tr
                            key={voucher.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            className="border-border hover:bg-muted/30"
                          >
                            <TableCell>
                              <VoucherCodeReveal code={voucher.code} />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="rounded-none text-[10px] px-1.5">
                                {voucher.type === 'percentage' ? (
                                  <span className="flex items-center gap-1">
                                    <Percent className="w-2.5 h-2.5" /> Pct
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Tag className="w-2.5 h-2.5" /> Fixed
                                  </span>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-sm">
                              {voucher.type === 'percentage' ? `${voucher.value}%` : formatRM(voucher.value)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatRM(voucher.minSpend)}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-xs font-medium">
                                  {voucher.usedCount.toLocaleString()} / {voucher.usageLimit.toLocaleString()}
                                </div>
                                <Progress
                                  value={usagePct}
                                  className={cn(
                                    'h-1 rounded-none',
                                    usagePct > 90 ? '[&>div]:bg-red-500' : usagePct > 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-[#0099FF]'
                                  )}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('rounded-none text-[10px] px-1.5 py-0', vCfg.className)}>
                                {vCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{voucher.expiry}</TableCell>
                            <TableCell className="text-right">
                              <CopyButton code={voucher.code} />
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── Discounts Tab ────────────────────────────────────────────── */}
        <TabsContent value="discounts">
          <AnimatePresence mode="wait">
            <motion.div
              key="discounts"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Discount Campaigns</h3>
                <Badge variant="outline" className="rounded-none text-[10px]">
                  {discountCampaigns.filter((d) => d.status === 'active').length} active
                </Badge>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {discountCampaigns.map((campaign, i) => {
                  const dCfg = discountStatusConfig[campaign.status]
                  return (
                    <motion.div
                      key={campaign.id}
                      variants={staggerItem}
                      transition={{ ...staggerItem.transition, delay: i * 0.06 }}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    >
                      <Card className={cn(
                        'border-border rounded-none transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(0,153,255,0.1)]',
                        campaign.status === 'active' && 'border-l-2 border-l-emerald-500',
                        campaign.status === 'paused' && 'border-l-2 border-l-amber-500',
                        campaign.status === 'ended' && 'opacity-50',
                      )}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-semibold leading-tight">
                              {campaign.name}
                            </CardTitle>
                            <Badge variant="outline" className={cn('shrink-0 text-[10px] px-1.5 py-0 border rounded-none', dCfg.className)}>
                              <dCfg.icon className="w-3 h-3 mr-1" />
                              {dCfg.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Tag className="w-3 h-3" />
                            {campaign.discountType}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {campaign.startDate} → {campaign.endDate}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <ShoppingBag className="w-3 h-3 text-[#0099FF]" />
                            <span className="font-medium text-foreground">{campaign.productsCount}</span>
                            <span className="text-muted-foreground">products</span>
                          </div>
                          {campaign.status !== 'ended' && (
                            <div className="flex gap-2 pt-1">
                              <Button variant="outline" size="sm" className="rounded-none text-xs h-7 gap-1">
                                <Percent className="w-3 h-3" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  'rounded-none text-xs h-7 gap-1',
                                  campaign.status === 'paused'
                                    ? 'text-emerald-500 hover:text-emerald-600'
                                    : 'text-amber-500 hover:text-amber-600'
                                )}
                              >
                                {campaign.status === 'paused' ? (
                                  <><Play className="w-3 h-3" /> Resume</>
                                ) : (
                                  <><Pause className="w-3 h-3" /> Pause</>
                                )}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── Bundle Deals Tab ─────────────────────────────────────────── */}
        <TabsContent value="bundle-deals">
          <AnimatePresence mode="wait">
            <motion.div
              key="bundle-deals"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Bundle Deals</h3>
                  <Badge variant="outline" className="rounded-none text-[10px]">
                    {bundleDeals.length} bundles
                  </Badge>
                </div>
                <Dialog open={createBundleOpen} onOpenChange={setCreateBundleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5 rounded-none bg-[#0099FF] hover:bg-[#0080DD]">
                      <Plus className="w-3.5 h-3.5" />
                      Create Bundle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-none">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#0099FF]" />
                        Create Bundle Deal
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Bundle Name</label>
                        <Input
                          placeholder="e.g. Buy 2 Get 1 Free - Skincare"
                          value={bundleFormName}
                          onChange={(e) => setBundleFormName(e.target.value)}
                          className="rounded-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Rule Type</label>
                          <Select value={bundleFormRuleType} onValueChange={(v: BundleRuleType) => setBundleFormRuleType(v)}>
                            <SelectTrigger className="rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buy_x_get_y">Buy X Get Y Free</SelectItem>
                              <SelectItem value="buy_x_get_pct">Buy X Get % Off</SelectItem>
                              <SelectItem value="bundle_price">Bundle Price</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">
                            Discount Value {bundleFormRuleType === 'buy_x_get_pct' ? '(%)' : bundleFormRuleType === 'bundle_price' ? '(RM)' : ''}
                          </label>
                          <Input
                            type="number"
                            placeholder={bundleFormRuleType === 'buy_x_get_pct' ? '20' : bundleFormRuleType === 'bundle_price' ? '99' : '100'}
                            value={bundleFormDiscountValue}
                            onChange={(e) => setBundleFormDiscountValue(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" className="rounded-none" onClick={() => setCreateBundleOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="rounded-none bg-[#0099FF] hover:bg-[#0080DD]"
                        onClick={handleCreateBundle}
                        disabled={!bundleFormName || !bundleFormDiscountValue}
                      >
                        Create
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {bundleDeals.map((bundle, i) => (
                  <motion.div
                    key={bundle.id}
                    variants={staggerItem}
                    transition={{ ...staggerItem.transition, delay: i * 0.06 }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    <Card className="border-border rounded-none transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(0,153,255,0.1)] border-t-2 border-t-acid-lime">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold leading-tight">
                            {bundle.name}
                          </CardTitle>
                          <Badge variant="outline" className="shrink-0 rounded-none text-[10px] px-1.5 bg-acid-lime/10 text-acid-lime-dark border-acid-lime/30">
                            {ruleTypeLabels[bundle.ruleType]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Discount: </span>
                          <span className="font-bold text-[#0099FF]">
                            {bundle.ruleType === 'buy_x_get_pct'
                              ? `${bundle.discountValue}%`
                              : bundle.ruleType === 'buy_x_get_y'
                                ? '100% (Free)'
                                : formatRM(bundle.discountValue)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                              Main Products
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {bundle.mainProducts.map((p) => (
                                <Badge key={p} variant="secondary" className="rounded-none text-[10px] px-1.5 py-0">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                              Sub Products
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {bundle.subProducts.map((p) => (
                                <Badge key={p} variant="outline" className="rounded-none text-[10px] px-1.5 py-0 border-acid-lime/30 text-acid-lime-dark">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-none text-xs h-7 w-full gap-1">
                          <Package className="w-3 h-3" />
                          Edit Bundle
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── Add-on Deals Tab ─────────────────────────────────────────── */}
        <TabsContent value="addon-deals">
          <AnimatePresence mode="wait">
            <motion.div
              key="addon-deals"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Add-on Deals</h3>
                <Badge variant="outline" className="rounded-none text-[10px]">
                  {addOnDeals.filter((a) => a.status === 'active').length} active
                </Badge>
              </div>

              <Card className="border-border rounded-none overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-xs font-semibold">Deal Name</TableHead>
                        <TableHead className="text-xs font-semibold">Main Items</TableHead>
                        <TableHead className="text-xs font-semibold">Sub Items</TableHead>
                        <TableHead className="text-xs font-semibold">Discount</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addOnDeals.map((deal, i) => {
                        const aCfg = addOnStatusConfig[deal.status]
                        return (
                          <motion.tr
                            key={deal.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            className="border-border hover:bg-muted/30"
                          >
                            <TableCell className="font-medium text-sm">{deal.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {deal.mainItems.map((item) => (
                                  <Badge key={item} variant="secondary" className="rounded-none text-[10px] px-1.5 py-0">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {deal.subItems.map((item) => (
                                  <Badge key={item} variant="outline" className="rounded-none text-[10px] px-1.5 py-0 border-acid-lime/30 text-acid-lime-dark">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-semibold text-[#0099FF]">
                                {deal.discountType === 'Percentage Off'
                                  ? `${deal.discountValue}%`
                                  : formatRM(deal.discountValue)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">{deal.discountType}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('rounded-none text-[10px] px-1.5 py-0', aCfg.className)}>
                                <aCfg.icon className="w-3 h-3 mr-1" />
                                {aCfg.label}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  )
}
