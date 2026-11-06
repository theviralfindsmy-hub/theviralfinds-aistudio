'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Package,
  Percent,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export type VelocityTier = 'Starter' | 'Rising' | 'Viral' | 'Super Affiliate'

export interface CommissionMathResult {
  price: number
  units: number
  commissionRate: number
  grossSales: number
  netEarnings: number
  earningsPerUnit: number
  velocityTier: VelocityTier
}

/**
 * Pure calculation helper for commission and velocity tier
 */
export function calculateCommissionMath(
  price: number,
  units: number,
  commissionRate: number
): CommissionMathResult {
  const safePrice = Math.max(5, Math.min(500, Number(price) || 5))
  const safeUnits = Math.max(10, Math.min(2000, Number(units) || 10))
  const safeRate = Math.max(1, Math.min(25, Number(commissionRate) || 1))

  const grossSales = Math.round(safePrice * safeUnits * 100) / 100
  const netEarnings = Math.round(grossSales * (safeRate / 100) * 100) / 100
  const earningsPerUnit = Math.round(safePrice * (safeRate / 100) * 100) / 100

  let velocityTier: VelocityTier = 'Starter'
  if (netEarnings >= 5000) {
    velocityTier = 'Super Affiliate'
  } else if (netEarnings >= 1500) {
    velocityTier = 'Viral'
  } else if (netEarnings >= 300) {
    velocityTier = 'Rising'
  } else {
    velocityTier = 'Starter'
  }

  return {
    price: safePrice,
    units: safeUnits,
    commissionRate: safeRate,
    grossSales,
    netEarnings,
    earningsPerUnit,
    velocityTier,
  }
}

export interface CommissionSimulatorCardProps {
  initialPrice?: number
  initialUnits?: number
  initialCommissionRate?: number
  productName?: string
  onApplyToCampaign?: (result: CommissionMathResult) => void
  className?: string
}

export function CommissionSimulatorCard({
  initialPrice = 45,
  initialUnits = 150,
  initialCommissionRate = 12,
  productName = 'Serum Brightening Vitamin C 30ml',
  onApplyToCampaign,
  className,
}: CommissionSimulatorCardProps) {
  const [price, setPrice] = useState<number>(initialPrice)
  const [units, setUnits] = useState<number>(initialUnits)
  const [commissionRate, setCommissionRate] = useState<number>(initialCommissionRate)
  const [isApplied, setIsApplied] = useState(false)

  const math = useMemo(
    () => calculateCommissionMath(price, units, commissionRate),
    [price, units, commissionRate]
  )

  const handleApply = () => {
    setIsApplied(true)
    if (onApplyToCampaign) {
      onApplyToCampaign(math)
    }
    toast.success('Simulasi Berjaya Diaplikasi!', {
      description: `Sasaran RM${math.netEarnings.toLocaleString('ms-MY', {
        minimumFractionDigits: 2,
      })} (${math.velocityTier}) telah dikunci untuk kempen ini.`,
    })
    setTimeout(() => setIsApplied(false), 3000)
  }

  const getTierBadgeClass = (tier: VelocityTier) => {
    switch (tier) {
      case 'Super Affiliate':
        return 'bg-amber-500/15 text-amber-500 border-amber-500/40'
      case 'Viral':
        return 'bg-shopee/15 text-shopee border-shopee/40'
      case 'Rising':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
      default:
        return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/40'
    }
  }

  return (
    <div
      data-testid="commission-simulator-card"
      className={cn(
        'p-3.5 sm:p-4 rounded-xl bg-card border-2 border-shopee/40 shadow-lg text-card-foreground space-y-3 font-sans transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-shopee/15 text-shopee flex items-center justify-center border border-shopee/30">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Interactive Commission Simulator</h4>
            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
              {productName}
            </p>
          </div>
        </div>
        <Badge
          data-testid="velocity-tier-badge"
          variant="outline"
          className={cn('text-[10px] font-mono px-2 py-0.5 border', getTierBadgeClass(math.velocityTier))}
        >
          {math.velocityTier}
        </Badge>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-2.5 text-xs">
        {/* Slider 1: Product Price */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-shopee" />
              Harga Produk
            </span>
            <span data-testid="price-readout" className="font-mono font-bold text-foreground">
              RM {price.toFixed(2)}
            </span>
          </div>
          <input
            data-testid="slider-price"
            type="range"
            min={5}
            max={500}
            step={1}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-shopee h-1.5 bg-muted rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span>RM 5</span>
            <span>RM 500</span>
          </div>
        </div>

        {/* Slider 2: Monthly Units */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <Package className="w-3 h-3 text-emerald-500" />
              Unit Jualan Sebulan
            </span>
            <span data-testid="units-readout" className="font-mono font-bold text-foreground">
              {units.toLocaleString()} unit
            </span>
          </div>
          <input
            data-testid="slider-units"
            type="range"
            min={10}
            max={2000}
            step={10}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-muted rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span>10</span>
            <span>2,000 unit</span>
          </div>
        </div>

        {/* Slider 3: Commission Tier */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <Percent className="w-3 h-3 text-amber-500" />
              Kadar Komisen
            </span>
            <span data-testid="rate-readout" className="font-mono font-bold text-foreground">
              {commissionRate.toFixed(1)}%
            </span>
          </div>
          <input
            data-testid="slider-commission"
            type="range"
            min={1}
            max={25}
            step={0.5}
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-muted rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span>1%</span>
            <span>25%</span>
          </div>
        </div>
      </div>

      {/* Cyber-Brutalist Calculations Monospace Panel */}
      <div className="p-2.5 rounded-lg bg-muted/60 border border-border/80 font-mono space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[11px]">Gross Sales:</span>
          <span data-testid="gross-sales-value" className="font-bold text-foreground">
            RM {math.grossSales.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[11px]">Untung Seunit:</span>
          <span data-testid="unit-earnings-value" className="text-emerald-500 font-bold">
            +RM {math.earningsPerUnit.toFixed(2)}
          </span>
        </div>
        <div className="border-t border-border/60 pt-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-shopee uppercase tracking-wider">
            Net Komisen Bulanan:
          </span>
          <span data-testid="net-earnings-value" className="text-sm font-black text-shopee">
            RM {math.netEarnings.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Apply to Campaign CTA Button */}
      <Button
        data-testid="apply-campaign-btn"
        size="sm"
        onClick={handleApply}
        className={cn(
          'w-full h-8 text-xs font-bold transition-all shadow-md',
          isApplied
            ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
            : 'bg-shopee hover:bg-shopee/90 text-white'
        )}
      >
        {isApplied ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" />
            Kempen Terkunci!
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 mr-1 text-lime" />
            Apply to Campaign
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </>
        )}
      </Button>
    </div>
  )
}
