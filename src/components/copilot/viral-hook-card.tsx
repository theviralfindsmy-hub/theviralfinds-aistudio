'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Copy,
  Check,
  Video,
  Share2,
  Film,
  Zap,
  ArrowRight,
  Flame,
  HelpCircle,
  AlertTriangle,
  Smile,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export type ViralHookAngleKey = 'curiosity' | 'pas' | 'dialect' | 'shock'

export interface ViralHookItem {
  id: ViralHookAngleKey
  title: string
  subtitle: string
  icon: string
  platforms: Array<'TikTok' | 'Reels' | 'Shorts'>
  hookText: string
  callToAction: string
}

export function generateViralHooks(
  productName = 'Serum Brightening Vitamin C',
  category = 'Beauty & Skincare'
): Record<ViralHookAngleKey, ViralHookItem> {
  return {
    curiosity: {
      id: 'curiosity',
      title: 'Curiosity Gap',
      subtitle: 'Trik psikologi: Tarik perhatian dalam 2 saat pertama',
      icon: 'HelpCircle',
      platforms: ['TikTok', 'Reels', 'Shorts'],
      hookText: `Ramai tak tahu trick ni! Kenapa lebih 14,000 orang berebut beli ${productName} kat Shopee minggu ni je? Tengok apa jadi lepas 5 hari guna...`,
      callToAction: 'Komen "NAK" untuk link promo flash sale sebelum habis stok!',
    },
    pas: {
      id: 'pas',
      title: 'Problem-Agitate-Solve',
      subtitle: 'Sentuh masalah perit pengguna & tawarkan penyelesaian segera',
      icon: 'AlertTriangle',
      platforms: ['TikTok', 'Reels'],
      hookText: `Dah habis ratus-ratus ringgit beli produk mahal tapi parut jerawat degil masih tak hilang? Stress bila tengok cermin setiap pagi? Nah, cuba ${productName} ni — formula klinik aesthetic tapi harga student!`,
      callToAction: 'Tekan beg kuning sekarang untuk voucher diskaun 30%!',
    },
    dialect: {
      id: 'dialect',
      title: 'Local Dialect (Manglish / Loghat Santai)',
      subtitle: 'Gaya sembang santai lepak mamak yang rasa dekat di hati pembeli',
      icon: 'Smile',
      platforms: ['TikTok', 'Shorts'],
      hookText: `Korang yang kulit kusam tu tolong jangan scroll weh! Ramai gila taktahu rahsia glowing bajet bawah RM30 kat Shopee ni. Takyah bazir duit pergi spa, sapu benda ni je sebelum tidur confirm flawless teruk beb!`,
      callToAction: 'Grab cepat kat beg oren tepi ni sementara offer masih ada geng!',
    },
    shock: {
      id: 'shock',
      title: 'Shock Value',
      subtitle: 'Kenyataan berani yang buat penonton berhenti scroll serta merta',
      icon: 'Flame',
      platforms: ['TikTok', 'Reels', 'Shorts'],
      hookText: `JANGAN beli ${productName} ni melainkan korang dah sedia nak hadap kawan-kawan office tanya: "Eh kau pakai filter apa sekarang?". Serius kesan dia bukan kaleng-kaleng!`,
      callToAction: 'Cepat checkout sekarang sebelum seller naikkan harga balik!',
    },
  }
}

export interface ViralHookCardProps {
  productName?: string
  category?: string
  initialAngle?: ViralHookAngleKey
  onCopyHook?: (text: string, angle: ViralHookAngleKey) => void
  onSendToStudio?: (hookText: string, angle: ViralHookAngleKey) => void
  className?: string
}

export function ViralHookCard({
  productName = 'Serum Brightening Vitamin C',
  category = 'Skincare',
  initialAngle = 'dialect',
  onCopyHook,
  onSendToStudio,
  className,
}: ViralHookCardProps) {
  const [selectedAngle, setSelectedAngle] = useState<ViralHookAngleKey>(initialAngle)
  const [copied, setCopied] = useState(false)

  const hooks = generateViralHooks(productName, category)
  const activeHook = hooks[selectedAngle]

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeHook.hookText)
      }
      setCopied(true)
      if (onCopyHook) {
        onCopyHook(activeHook.hookText, selectedAngle)
      }
      toast.success('Viral Hook Disalin!', {
        description: `Sudah disalin ke clipboard untuk video ${activeHook.title}.`,
      })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
      setCopied(true)
      if (onCopyHook) onCopyHook(activeHook.hookText, selectedAngle)
      toast.success('Viral Hook Disalin!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleSendToStudio = () => {
    if (onSendToStudio) {
      onSendToStudio(activeHook.hookText, selectedAngle)
    }
    toast.success('Dihantar ke Video Studio!', {
      description: `Hook "${activeHook.title}" dimuatkan ke editor skrip.`,
    })
  }

  return (
    <div
      data-testid="viral-hook-card"
      className={cn(
        'p-3.5 sm:p-4 rounded-xl bg-card border-2 border-emerald-500/40 shadow-lg text-card-foreground space-y-3 font-sans transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Viral Video Hook Generator</h4>
            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
              {productName}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono px-2 py-0.5 border border-emerald-500/40 text-emerald-500"
        >
          4 Proven Angles
        </Badge>
      </div>

      {/* Angle Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-muted/60 rounded-lg text-[10px] font-mono">
        <button
          type="button"
          data-testid="angle-tab-curiosity"
          onClick={() => setSelectedAngle('curiosity')}
          className={cn(
            'px-2 py-1.5 rounded-md font-bold transition-all text-center truncate',
            selectedAngle === 'curiosity'
              ? 'bg-shopee text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Curiosity
        </button>
        <button
          type="button"
          data-testid="angle-tab-pas"
          onClick={() => setSelectedAngle('pas')}
          className={cn(
            'px-2 py-1.5 rounded-md font-bold transition-all text-center truncate',
            selectedAngle === 'pas'
              ? 'bg-shopee text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          PAS Angle
        </button>
        <button
          type="button"
          data-testid="angle-tab-dialect"
          onClick={() => setSelectedAngle('dialect')}
          className={cn(
            'px-2 py-1.5 rounded-md font-bold transition-all text-center truncate',
            selectedAngle === 'dialect'
              ? 'bg-shopee text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Loghat Santai
        </button>
        <button
          type="button"
          data-testid="angle-tab-shock"
          onClick={() => setSelectedAngle('shock')}
          className={cn(
            'px-2 py-1.5 rounded-md font-bold transition-all text-center truncate',
            selectedAngle === 'shock'
              ? 'bg-shopee text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Shock Value
        </button>
      </div>

      {/* Active Hook Body Display */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground text-[11px] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-shopee" />
            {activeHook.title}
          </span>
          {/* Platform Badges */}
          <div className="flex items-center gap-1" data-testid="platform-badges">
            {activeHook.platforms.map((platform) => (
              <Badge
                key={platform}
                variant="secondary"
                className="text-[9px] px-1.5 py-0 h-4 font-mono bg-background/80"
              >
                {platform}
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          {activeHook.subtitle}
        </p>

        {/* Hook Script Box */}
        <div
          data-testid="hook-text-box"
          className="p-2.5 rounded bg-background border border-border/70 text-foreground font-mono text-[11px] leading-relaxed select-all"
        >
          "{activeHook.hookText}"
        </div>

        <div className="text-[10px] text-muted-foreground font-mono">
          <span className="font-bold text-emerald-500">CTA: </span>
          {activeHook.callToAction}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          data-testid="copy-hook-btn"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-8 text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              Disalin!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1" />
              1-Click Copy
            </>
          )}
        </Button>

        <Button
          data-testid="send-studio-btn"
          size="sm"
          onClick={handleSendToStudio}
          className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Video className="w-3.5 h-3.5 mr-1" />
          Send to Studio
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  )
}
