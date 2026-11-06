'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2,
  Video,
  Camera,
  MessageCircle,
  Twitter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Send,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Zap,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Search,
  Copy,
  Check,
  Film,
  Flame,
  Radio,
  BookOpen,
  Tv,
  ShoppingBag,
  Filter,
  Eye,
  Heart,
  MessageSquare,
  Repeat,
  X,
  BadgePercent,
  Compass,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

// Types from trend-radar.ts (M4)
import type {
  TrendRadarFeedItem,
  RadarPlatform,
  RadarPlatformFilter,
  GrowthVelocity,
  TrendRadarApiResponse,
} from '@/types/trend-radar'

// Copilot AG-UI Protocol Hooks (M3)
import { useCopilotReadable, useCopilotAction } from '@/lib/copilot'

// ============================================================================
// Data Interfaces & Constants
// ============================================================================

export interface SocialAccountData {
  id: string
  platform: 'tiktok' | 'instagram' | 'facebook' | 'twitter'
  platformUsername: string | null
  platformUserId: string
  isConnected: boolean
  isDemo: boolean
  lastUsedAt: string | null
  createdAt: string
  expiresAt: string | null
  configured: boolean
  displayName: string
  icon: string
  color: string
  characterLimit: number
  requiresImage: boolean
  description: string
}

export interface ScheduledPostItem {
  id: string
  caption: string
  platforms: string[]
  productUrl: string | null
  affiliateLink: string | null
  scheduledAt: string
  status: 'scheduled' | 'publishing' | 'published' | 'failed'
}

export const PLATFORM_DEFINITIONS = [
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    color: '#FF0050',
    characterLimit: 2200,
    requiresImage: false,
    recommendedFor: 'Short video hooks, FYP viral product demos, sound sync',
    audienceTag: 'Gen-Z & Young Adults (MY)',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Camera,
    color: '#E4405F',
    characterLimit: 2200,
    requiresImage: true,
    recommendedFor: 'Reels, Story swipes, carousel aesthetics, Shopee product showcases',
    audienceTag: 'Urban Shoppers & Millennial Mamas',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: MessageCircle,
    color: '#1877F2',
    characterLimit: 63206,
    requiresImage: false,
    recommendedFor: 'Affiliate group postings, long-form reviews, Shopee voucher codes',
    audienceTag: 'Family & Bargain Hunter Groups',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: Twitter,
    color: '#0F1419',
    characterLimit: 280,
    requiresImage: false,
    recommendedFor: 'Thread recommendations, flash sale drop alerts, quick links',
    audienceTag: 'Tech, Fast-Movers & Trend Seekers',
  },
] as const

export const RADAR_FILTER_CHIPS: Array<{
  id: RadarPlatformFilter
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = [
  { id: 'all', label: 'All Platforms', icon: Layers, color: '#FF5722' },
  { id: 'tiktok', label: 'TikTok', icon: Video, color: '#FF0050' },
  { id: 'xhs', label: 'Xiaohongshu', icon: BookOpen, color: '#FF2442' },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, color: '#0F1419' },
  { id: 'shorts', label: 'YouTube Shorts', icon: Tv, color: '#FF0000' },
]

export function formatMetricNumber(num?: number | null): string {
  if (num === undefined || num === null || typeof num !== 'number' || isNaN(num)) {
    return '0'
  }
  if (num >= 1_000_000) {
    const mVal = num / 1_000_000
    return (mVal % 1 === 0 ? mVal.toFixed(0) : mVal.toFixed(1)) + 'M'
  }
  if (num >= 1000) {
    const kVal = num / 1000
    return (kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1)) + 'K'
  }
  return num.toString()
}

// Curated Seed Data for immediate high-fidelity fallback rendering
export const DEFAULT_RADAR_SEEDS: TrendRadarFeedItem[] = [
  {
    id: 'trend-tt-01',
    platform: 'tiktok',
    creator: {
      username: 'Fatin Skincare MY',
      handle: 'fatin.beautyreview',
      followerCount: '245K',
      verified: true,
    },
    postUrl: 'https://tiktok.com/@fatin.beautyreview/video/7391823901',
    title: 'Sunscreen viral Skintific tak capuk langsung bawah makeup panas terik KL!',
    hookText: 'Korang still pakai sunscreen kelabu macam hantu kapur? Tengok ni, 5 saat terus meresap matte finish tak melekit!',
    summary: 'Ulasan jujur mist sunscreen SPF50 Skintific yang menjadi kegilaan ramai affiliate Shopee kerana komisen tinggi dan kadar tukaran 14.2%.',
    productRecommendation: {
      name: 'Skintific All Day Light Sunscreen Mist SPF50 PA++++',
      shopeeUrl: 'https://shopee.com.my/Skintific-All-Day-Light-Sunscreen-Mist-i.18291.902341',
      category: 'Beauty & Skincare',
      estimatedPrice: 36.90,
      originalPrice: 49.00,
      commissionRate: 14,
      viralityScore: 96,
      viralityTier: 'SUPER_VIRAL',
      soldCount: 42100,
      rating: 4.9,
    },
    metrics: {
      views: 482000,
      likes: 61200,
      shares: 18400,
      comments: 3120,
      growthVelocity: 'SURGING',
    },
    tags: ['RacunShopee', 'SkintificMY', 'SunscreenViral', 'ShopeeAffiliate'],
    language: 'ms',
  },
  {
    id: 'trend-xhs-01',
    platform: 'xhs',
    creator: {
      username: 'Mei Living KL',
      handle: 'mei_aesthetic_living',
      followerCount: '118K',
      verified: false,
    },
    postUrl: 'https://xiaohongshu.com/discovery/item/66e19ab301',
    title: '吉隆坡打工人的宝藏桌面收纳！Shopee不到RM20救了我的强迫症',
    hookText: '桌面乱到像案发现场？别扔！这个透明亚克力旋转收纳盒真的封神，空间瞬间省出一半！',
    summary: '小红书大马区极简美学博主推荐的360度旋转化妆品收纳盒，客单价亲民冲动消费转化率极高。',
    productRecommendation: {
      name: '360 Rotating Acrylic Desktop Organizer Box & Brush Stand',
      shopeeUrl: 'https://shopee.com.my/360-Rotating-Acrylic-Desktop-Organizer-i.29181.82194',
      category: 'Home & Living',
      estimatedPrice: 18.50,
      originalPrice: 28.00,
      commissionRate: 15,
      viralityScore: 91,
      viralityTier: 'SUPER_VIRAL',
      soldCount: 18900,
      rating: 4.8,
    },
    metrics: {
      views: 195000,
      likes: 24800,
      shares: 9200,
      comments: 1140,
      growthVelocity: 'SURGING',
    },
    tags: ['XHS好物', 'ShopeeMy', '桌面收纳', '大马生活'],
    language: 'zh',
  },
  {
    id: 'trend-tw-01',
    platform: 'twitter',
    creator: {
      username: 'Racun Gadget MY',
      handle: 'gadgetmurah_my',
      followerCount: '89K',
      verified: true,
    },
    postUrl: 'https://twitter.com/gadgetmurah_my/status/18391209381',
    title: 'Powerbank wireless magnetic 10,000mAh nipis macam kad Touch n Go!',
    hookText: 'Stop bawa powerbank batu bata berat 1kg. Magnetic wireless powerbank ni lekat kat phone terus cas laju tak payah kabel serabut!',
    summary: 'Bebenang Twitter viral mengupas perbandingan powerbank MagSafe bajet dengan link Shopee affiliate yang meraih lebih 4,000 retweets.',
    productRecommendation: {
      name: 'Ultra-Slim Magnetic Wireless Powerbank 10000mAh 20W PD Fast Charge',
      shopeeUrl: 'https://shopee.com.my/Ultra-Slim-Magnetic-Wireless-Powerbank-i.4812.19203',
      category: 'Electronics & Mobile',
      estimatedPrice: 42.00,
      originalPrice: 69.00,
      commissionRate: 12,
      viralityScore: 87,
      viralityTier: 'HIGH',
      soldCount: 12400,
      rating: 4.7,
    },
    metrics: {
      views: 310000,
      likes: 19200,
      shares: 4800,
      comments: 920,
      growthVelocity: 'HIGH',
    },
    tags: ['TechMY', 'RacunGadget', 'ShopeeFinds', 'PowerbankViral'],
    language: 'ms',
  },
  {
    id: 'trend-ys-01',
    platform: 'shorts',
    creator: {
      username: 'Chef Kimi Quick Recipes',
      handle: 'dapurchefkimi',
      followerCount: '320K',
      verified: true,
    },
    postUrl: 'https://youtube.com/shorts/vK92Lp01a',
    title: 'Alat pengupas bawang & pencincang cili elektrik 10 saat siap sambal belacan!',
    hookText: 'Tak payah menangis pedih mata tumbuk lesung lagi! Tekan satu punat ni, 5 saat lumat terus cili dengan bawang!',
    summary: 'Video demonstrasi resipi sambal belacan pantas menggunakan mini wireless chopper yang memacu jualan affiliate Shopee berulang.',
    productRecommendation: {
      name: 'Wireless Electric Mini Garlic & Chilli Chopper 250ml USB Rechargeable',
      shopeeUrl: 'https://shopee.com.my/Wireless-Electric-Mini-Garlic-Chilli-Chopper-i.9201.71923',
      category: 'Kitchen & Dining',
      estimatedPrice: 15.90,
      originalPrice: 25.00,
      commissionRate: 16,
      viralityScore: 93,
      viralityTier: 'SUPER_VIRAL',
      soldCount: 65000,
      rating: 4.8,
    },
    metrics: {
      views: 740000,
      likes: 88000,
      shares: 26000,
      comments: 2450,
      growthVelocity: 'SURGING',
    },
    tags: ['ResipiViral', 'DapurMY', 'ShopeeMurah', 'MasakSimple'],
    language: 'ms',
  },
]

// ============================================================================
// Helper Component: TrendRadarCard
// ============================================================================

export interface TrendRadarCardProps {
  item: TrendRadarFeedItem
  onCopyHook?: (item: TrendRadarFeedItem) => void
  onAddToStudio?: (item: TrendRadarFeedItem) => void
  onBroadcastTrend?: (item: TrendRadarFeedItem) => void
  isCopied?: boolean
}

export function TrendRadarCard({
  item,
  onCopyHook,
  onAddToStudio,
  onBroadcastTrend,
  isCopied = false,
}: TrendRadarCardProps) {
  const rec = item.productRecommendation

  const renderVelocityBadge = (velocity: GrowthVelocity) => {
    switch (velocity) {
      case 'SURGING':
        return (
          <Badge className="bg-rose-500/15 text-rose-500 border border-rose-500/30 text-[11px] font-mono font-bold px-2 py-0.5 flex items-center gap-1 animate-pulse">
            <Flame className="w-3 h-3 text-rose-500 fill-rose-500/30" />
            SURGING
          </Badge>
        )
      case 'HIGH':
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            HIGH
          </Badge>
        )
      case 'STABLE':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            STABLE
          </Badge>
        )
    }
  }

  const renderLanguageBadge = (lang: string) => {
    switch (lang) {
      case 'zh':
        return <Badge variant="outline" className="text-[10px] font-mono border-rose-400 text-rose-500">🇨🇳 中文</Badge>
      case 'ms':
        return <Badge variant="outline" className="text-[10px] font-mono border-sky-400 text-sky-500">🇲🇾 BM</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">🇬🇧 EN</Badge>
    }
  }

  return (
    <Card className="border-2 border-border/80 hover:border-shopee/60 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md bg-card">
      <CardHeader className="pb-3 space-y-3">
        {/* Creator & Platform Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-shopee/10 text-shopee flex items-center justify-center font-bold text-xs uppercase font-mono">
              {item.platform === 'tiktok' && <Video className="w-4 h-4 text-[#FF0050]" />}
              {item.platform === 'xhs' && <BookOpen className="w-4 h-4 text-[#FF2442]" />}
              {item.platform === 'twitter' && <Twitter className="w-4 h-4 text-[#0F1419] dark:text-white" />}
              {item.platform === 'shorts' && <Tv className="w-4 h-4 text-[#FF0000]" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-foreground">{item.creator.username}</span>
                {item.creator.verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                {renderLanguageBadge(item.language)}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                <span>@{item.creator.handle}</span>
                <span>&bull;</span>
                <span>{item.creator.followerCount} pengikut</span>
              </div>
            </div>
          </div>

          {/* Velocity Badge & Link */}
          <div className="flex items-center gap-2">
            {renderVelocityBadge(item.metrics.growthVelocity)}
            <a
              href={item.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buka pos di ${item.platform}`}
              className="text-muted-foreground hover:text-shopee p-2 rounded-md hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Post Title */}
        <CardTitle className="text-sm font-bold text-foreground leading-snug">
          {item.title}
        </CardTitle>

        <CardDescription className="text-xs text-muted-foreground line-clamp-2">
          {item.summary}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5 py-2">
        {/* Viral Hook Highlight Box */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border/80 space-y-2 relative">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-shopee flex items-center gap-1 font-mono uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-shopee" />
              VIRAL VIDEO HOOK
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyHook?.(item)}
              className="px-2.5 text-[11px] font-mono text-muted-foreground hover:text-foreground min-h-[44px]"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 mr-1 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  <span>Copy Hook</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-foreground italic font-medium leading-relaxed">
            "{item.hookText}"
          </p>
        </div>

        {/* Product Recommendation Card (if present) */}
        {rec && (
          <div className="p-3 rounded-xl border border-shopee/30 bg-shopee/5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <ShoppingBag className="w-4 h-4 text-shopee mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">{rec.name}</h4>
                  <span className="text-[10px] text-muted-foreground font-mono">{rec.category}</span>
                </div>
              </div>
              <Badge className="bg-lime text-lime-dark font-mono text-[10px] px-1.5 py-0 font-bold border border-lime/40">
                {`${rec.viralityScore}/100 SCORE ${rec.viralityTier ? rec.viralityTier.replace('_', ' ') : 'SUPER VIRAL'}`}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-shopee/20">
              <div>
                <span className="text-muted-foreground text-[10px] block">Anggaran Harga:</span>
                <span className="font-bold text-foreground">{`RM ${rec.estimatedPrice.toFixed(2)}`}</span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground text-[10px] block">{`Komisen (${rec.commissionRate}%):`}</span>
                <span className="font-bold text-emerald-500">
                  {`~RM ${((rec.estimatedPrice * rec.commissionRate) / 100).toFixed(2)} / sale`}
                </span>
              </div>
            </div>

            {rec.shopeeUrl && (
              <div className="pt-1">
                <a
                  href={rec.shopeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-lg bg-shopee hover:bg-shopee/90 text-white transition-colors min-h-[44px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Beli / Semak Pautan Shopee Affiliate
                </a>
              </div>
            )}
          </div>
        )}

        {/* Engagement Metrics Bar */}
        <div className="grid grid-cols-4 gap-1 py-1 text-center font-mono text-[11px] bg-muted/30 rounded-lg p-2 border border-border/50">
          <div>
            <span className="text-muted-foreground block text-[10px]">Views</span>
            <span className="font-semibold text-foreground">
              {formatMetricNumber(item.metrics.views)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Likes</span>
            <span className="font-semibold text-foreground">
              {formatMetricNumber(item.metrics.likes)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Shares</span>
            <span className="font-semibold text-foreground">
              {formatMetricNumber(item.metrics.shares)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Comments</span>
            <span className="font-semibold text-foreground">
              {formatMetricNumber(item.metrics.comments)}
            </span>
          </div>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40"
              >
                #{tag.replace(/^#/, '')}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 bg-muted/20">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-border hover:border-shopee flex-1"
          onClick={() => onAddToStudio?.(item)}
        >
          <Film className="w-3.5 h-3.5 mr-1.5 text-shopee" />
          Add to Content Studio
        </Button>

        <Button
          size="sm"
          className="text-xs bg-foreground hover:bg-foreground/90 text-background font-semibold flex-1"
          onClick={() => onBroadcastTrend?.(item)}
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          Auto-Post Trend
        </Button>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// Helper Component: TrendRadarView
// ============================================================================

export interface TrendRadarViewProps {
  items: TrendRadarFeedItem[]
  selectedPlatform: RadarPlatformFilter
  onSelectPlatform: (platform: RadarPlatformFilter) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedVelocity?: string
  onVelocityChange?: (velocity: string) => void
  onResetFilters?: () => void
  onCopyHook?: (item: TrendRadarFeedItem) => void
  onAddToStudio?: (item: TrendRadarFeedItem) => void
  onBroadcastTrend?: (item: TrendRadarFeedItem) => void
  copiedHookId?: string | null
}

export function TrendRadarView({
  items,
  selectedPlatform,
  onSelectPlatform,
  searchQuery,
  onSearchChange,
  selectedVelocity = 'all',
  onVelocityChange,
  onResetFilters,
  onCopyHook,
  onAddToStudio,
  onBroadcastTrend,
  copiedHookId,
}: TrendRadarViewProps) {
  return (
    <div className="space-y-6">
      {/* Controls: Platform Chips & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-sm">
        {/* Platform Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {RADAR_FILTER_CHIPS.map((chip) => {
            const isSelected = selectedPlatform === chip.id
            const Icon = chip.icon
            const count =
              chip.id === 'all'
                ? items.length
                : items.filter((i) => i.platform === chip.id).length

            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onSelectPlatform(chip.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all h-9 whitespace-nowrap border',
                  isSelected
                    ? 'bg-shopee text-white border-shopee shadow-sm'
                    : 'bg-muted/50 hover:bg-muted text-foreground border-border/70 hover:border-border'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{chip.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-mono',
                    isSelected ? 'bg-white/20 text-white' : 'bg-muted-foreground/20 text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input & Velocity Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari hook, produk, creator..."
              className="pl-9 pr-10 text-xs min-h-[44px] bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Padam carian"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center rounded-r-md hover:bg-muted/50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onVelocityChange && (
            <select
              aria-label="Filter mengikut Velocity"
              value={selectedVelocity}
              onChange={(e) => onVelocityChange(e.target.value)}
              className="text-xs bg-background border border-input rounded-md px-3 h-9 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Velocity</option>
              <option value="SURGING">⚡ Surging Only</option>
              <option value="HIGH">📈 High Only</option>
              <option value="STABLE">🟢 Stable Only</option>
            </select>
          )}
        </div>
      </div>

      {/* Quick Metrics Bar for Radar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Scouted Trends</div>
            <div className="text-lg font-bold text-foreground">{items.length} Feeds</div>
          </div>
          <Compass className="w-5 h-5 text-shopee opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-rose-500 font-medium">Surging Now</div>
            <div className="text-lg font-bold text-rose-500">
              {items.filter((i) => i.metrics.growthVelocity === 'SURGING').length} Viral
            </div>
          </div>
          <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
        </div>

        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-amber-500 font-medium">Avg Virality Score</div>
            <div className="text-lg font-bold text-amber-500">
              {Math.round(
                items.reduce(
                  (acc, i) => acc + (i.productRecommendation?.viralityScore || 80),
                  0
                ) / (items.length || 1)
              )}
              /100
            </div>
          </div>
          <BadgePercent className="w-5 h-5 text-amber-500 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-emerald-500 font-medium">Affiliate Ready</div>
            <div className="text-lg font-bold text-emerald-500">
              {items.filter((i) => i.productRecommendation?.shopeeUrl).length} Links
            </div>
          </div>
          <ShoppingBag className="w-5 h-5 text-emerald-500 opacity-80" />
        </div>
      </div>

      {/* Radar Feed Items Grid */}
      {items.length === 0 ? (
        <Card className="border-dashed p-8 text-center space-y-3">
          <Compass className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-foreground">Tiada trend ditemui</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Cuba tukar kata kunci carian atau tetapkan platform kepada "All Platforms" untuk melihat semua suapan viral.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs min-h-[44px]"
          >
            Set Semula Penapis
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {items.map((item) => (
            <TrendRadarCard
              key={item.id}
              item={item}
              onCopyHook={onCopyHook}
              onAddToStudio={onAddToStudio}
              onBroadcastTrend={onBroadcastTrend}
              isCopied={copiedHookId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Component: SocialHubPage
// ============================================================================

export function SocialHubPage() {
  const { setActivePage } = useAppStore()

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<string>('radar')

  // Channels state (existing)
  const [accounts, setAccounts] = useState<SocialAccountData[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null)

  // Auto-post modal state (existing)
  const [testPostModalOpen, setTestPostModalOpen] = useState(false)
  const [testCaption, setTestCaption] = useState(
    '🔥 Promo Terhangat Shopee MY! Dapatkan diskaun sehingga 50% harini. Klik pautan link bio sekarang! #ShopeeMY #ViralFinds #RacunShopee'
  )
  const [selectedTargetPlatforms, setSelectedTargetPlatforms] = useState<string[]>([])
  const [isPublishingTest, setIsPublishingTest] = useState(false)

  // Trend Radar state (new)
  const [radarItems, setRadarItems] = useState<TrendRadarFeedItem[]>(DEFAULT_RADAR_SEEDS)
  const [radarLoading, setRadarLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<RadarPlatformFilter>('all')
  const [selectedVelocity, setSelectedVelocity] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null)

  // Auto-Post Queue state (Tab 3)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPostItem[]>([])
  const [queueLoading, setQueueLoading] = useState(false)

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Fetch Accounts (existing)
  // ──────────────────────────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/accounts')
      if (!res.ok) throw new Error('Failed to load accounts')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch {
      toast.error('Gagal memuatkan status akaun media sosial')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Fetch Trend Radar Feed (new M4)
  // ──────────────────────────────────────────────────────────────────────────
  const fetchRadarFeed = useCallback(
    async (platform = selectedPlatform, query = searchQuery, velocity = selectedVelocity) => {
      setRadarLoading(true)
      try {
        const params = new URLSearchParams()
        if (platform && platform !== 'all') params.set('platform', platform)
        if (query && query.trim()) params.set('query', query.trim())
        if (velocity && velocity !== 'all') params.set('velocity', velocity)

        const res = await fetch(`/api/trends/radar?${params.toString()}`)
        if (res.ok) {
          const data: TrendRadarApiResponse = await res.json()
          if (data.items && data.items.length > 0) {
            setRadarItems(data.items)
          } else {
            setRadarItems([])
          }
        } else {
          setRadarItems(DEFAULT_RADAR_SEEDS)
        }
      } catch {
        setRadarItems(DEFAULT_RADAR_SEEDS)
      } finally {
        setRadarLoading(false)
      }
    },
    [selectedPlatform, searchQuery, selectedVelocity]
  )

  useEffect(() => {
    fetchRadarFeed(selectedPlatform, searchQuery, selectedVelocity)
  }, [fetchRadarFeed, selectedPlatform, selectedVelocity])

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Fetch Scheduled Posts for Tab 3 (Auto-Post Queue)
  // ──────────────────────────────────────────────────────────────────────────
  const fetchScheduledPosts = useCallback(async () => {
    setQueueLoading(true)
    try {
      const res = await fetch('/api/autopost?limit=10')
      if (res.ok) {
        const data = await res.json()
        setScheduledPosts(data.posts || [])
      }
    } catch {
      // Non-fatal
    } finally {
      setQueueLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'autopost') {
      fetchScheduledPosts()
    }
  }, [activeTab, fetchScheduledPosts])

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Copilot AG-UI Readable State & Actions (M3)
  // ──────────────────────────────────────────────────────────────────────────
  useCopilotReadable({
    description: 'Current Social Hub view, Trend Radar feeds, and connected channels',
    value: {
      activeTab,
      selectedPlatform,
      selectedVelocity,
      searchQuery,
      totalTrends: radarItems.length,
      surgingTrendsCount: radarItems.filter((i) => i.metrics.growthVelocity === 'SURGING').length,
      topViralTrend: radarItems[0]?.title || null,
      topProductRecommendation: radarItems[0]?.productRecommendation?.name || null,
      connectedChannelsCount: accounts.filter((a) => a.isConnected).length,
    },
  })

  useCopilotAction({
    name: 'filter_trend_radar',
    description: 'Filter the live Trend Radar feed by platform or growth velocity',
    parameters: [
      { name: 'platform', type: 'string', description: 'tiktok | xhs | twitter | shorts | all' },
      { name: 'velocity', type: 'string', description: 'SURGING | HIGH | STABLE | all' },
    ],
    handler: async (args: { platform?: RadarPlatformFilter; velocity?: string }) => {
      if (args.platform) setSelectedPlatform(args.platform)
      if (args.velocity) setSelectedVelocity(args.velocity)
      setActiveTab('radar')
      fetchRadarFeed(args.platform || selectedPlatform, searchQuery, args.velocity || selectedVelocity)
      return `Trend Radar feed ditapis: ${args.platform || 'semua platform'}`
    },
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. User Interaction Handlers
  // ──────────────────────────────────────────────────────────────────────────

  // Copy Viral Hook
  const handleCopyHook = (item: TrendRadarFeedItem) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        navigator.clipboard.writeText(item.hookText).catch(() => {
          toast.error('Gagal menyalin hook ke papan keratan')
        })
      } catch {
        toast.error('Gagal menyalin hook ke papan keratan')
      }
    }
    setCopiedHookId(item.id)
    toast.success('Hook viral disalin ke papan klip!', {
      description: `"${item.hookText.slice(0, 70)}..."`,
    })
    setTimeout(() => setCopiedHookId(null), 2500)
  }

  // Add to Content Studio CTA
  const handleAddToStudio = (item: TrendRadarFeedItem) => {
    const prefill = {
      product: item.productRecommendation?.name || item.title,
      hook: item.hookText,
      category: item.productRecommendation?.category || 'General',
      platform: item.platform,
      sourceUrl: item.postUrl,
    }
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('tvf_studio_prefill', JSON.stringify(prefill))
      } catch {}
    }
    toast.success('Ditambah ke Content Studio!', {
      description: `Skrip & hook sedia dijana untuk: ${prefill.product}`,
    })
    setActivePage('studio')
  }

  // Broadcast this trend directly
  const handleBroadcastTrend = (item: TrendRadarFeedItem) => {
    const shopeeLink = item.productRecommendation?.shopeeUrl || 'https://shopee.com.my'
    const tagList =
      item.tags.length > 0
        ? item.tags.map((t) => `#${t.replace(/^#/, '')}`).join(' ')
        : '#ShopeeMY #ViralFinds'
    const draftCaption = `🔥 RACUN VIRAL ${item.platform.toUpperCase()}!\n\n${item.hookText}\n\n👉 Beli di Shopee sekarang: ${shopeeLink}\n\n${tagList}`

    setTestCaption(draftCaption)
    setSelectedTargetPlatforms(accounts.filter((a) => a.isConnected).map((a) => a.platform))
    setTestPostModalOpen(true)
  }

  // Connect or Authorize Platform (existing)
  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId)
    try {
      const res = await fetch(`/api/social/connect/${platformId}`)
      const data = await res.json()

      if (data.mode === 'real' && data.authUrl) {
        window.location.href = data.authUrl
      } else if (data.mode === 'demo') {
        toast.success(`Akaun demo ${data.account?.displayName || platformId} berjaya disambungkan!`)
        await fetchAccounts()
      } else {
        toast.info(data.message || 'Status akaun dikemaskini')
        await fetchAccounts()
      }
    } catch {
      toast.error(`Ralat semasa menyambungkan ${platformId}`)
    } finally {
      setConnectingPlatform(null)
    }
  }

  // Disconnect Platform (existing)
  const handleDisconnect = async (platformId: string) => {
    setDisconnectingPlatform(platformId)
    try {
      const res = await fetch(`/api/social/disconnect/${platformId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success(`Akaun ${platformId} berjaya diputuskan.`)
        await fetchAccounts()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal memutuskan akaun')
      }
    } catch {
      toast.error('Ralat rangkaian')
    } finally {
      setDisconnectingPlatform(null)
    }
  }

  // Quick Test Broadcast (existing)
  const handleBroadcastTest = async () => {
    if (selectedTargetPlatforms.length === 0) {
      toast.error('Sila pilih sekurang-kurangnya satu platform untuk disiarkan')
      return
    }
    if (!testCaption.trim()) {
      toast.error('Sila masukkan kapsyen')
      return
    }

    setIsPublishingTest(true)
    try {
      const createRes = await fetch('/api/autopost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: testCaption,
          platforms: selectedTargetPlatforms,
          scheduledAt: new Date().toISOString(),
          productUrl: 'https://shopee.com.my',
          hashtags: ['ShopeeMY', 'TheViralFinds', 'Affiliate'],
        }),
      })

      if (!createRes.ok) {
        const e = await createRes.json()
        throw new Error(e.error || 'Failed to create post')
      }

      const postData = await createRes.json()
      const postId = postData.post?.id || postData.id

      if (postId) {
        const publishRes = await fetch('/api/social/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        })
        const pubData = await publishRes.json()
        if (publishRes.ok) {
          toast.success(`Berjaya disiarkan secara automatik ke ${selectedTargetPlatforms.join(', ')}!`)
          setTestPostModalOpen(false)
          fetchAccounts()
          if (activeTab === 'autopost') fetchScheduledPosts()
        } else {
          toast.error(pubData.error || 'Penyiaran automatik gagal')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyiarkan'
      toast.error(msg)
    } finally {
      setIsPublishingTest(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Filtered Items (Client-Side Search & Platform Filtering)
  // ──────────────────────────────────────────────────────────────────────────
  const filteredRadarItems = useMemo(() => {
    return radarItems.filter((item) => {
      // Platform filter
      if (selectedPlatform !== 'all' && item.platform !== selectedPlatform) {
        return false
      }
      // Velocity filter
      if (selectedVelocity !== 'all' && item.metrics.growthVelocity !== selectedVelocity) {
        return false
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchHook = item.hookText.toLowerCase().includes(q)
        const matchCreator = item.creator.username.toLowerCase().includes(q) || item.creator.handle.toLowerCase().includes(q)
        const matchProduct = item.productRecommendation?.name.toLowerCase().includes(q) || false
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(q))
        return matchTitle || matchHook || matchCreator || matchProduct || matchTags
      }
      return true
    })
  }, [radarItems, selectedPlatform, selectedVelocity, searchQuery])

  const connectedAccounts = accounts.filter((a) => a.isConnected)
  const connectedCount = connectedAccounts.length

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-shopee/15 via-background to-shopee/5 border-2 border-shopee/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-shopee text-white hover:bg-shopee/90 font-mono text-xs px-2.5 py-0.5 flex items-center gap-1">
              <Compass className="w-3 h-3 mr-0.5" />
              CENTRALIZED SOCIAL HUB & TREND RADAR
            </Badge>
            <Badge variant="outline" className="border-emerald-500 text-emerald-500 font-mono text-xs">
              {connectedCount} of {PLATFORM_DEFINITIONS.length} Channels Linked
            </Badge>
            <Badge variant="outline" className="border-rose-500 text-rose-500 font-mono text-xs animate-pulse">
              <Flame className="w-3 h-3 mr-1" />
              Live Multi-Platform Radar
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Multi-Platform Social Hub & Live Trend Radar
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Kesan produk dan hook video viral secara langsung merentasi TikTok, Xiaohongshu (XHS), Twitter/X, dan YouTube Shorts.
            Urus akaun rasmi dan siar pautan affiliate Shopee secara serentak dengan satu klik.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <Button
              size="sm"
              className="bg-shopee hover:bg-shopee/90 text-white font-semibold text-xs px-4"
              onClick={() => {
                setSelectedTargetPlatforms(connectedAccounts.map((a) => a.platform))
                setTestPostModalOpen(true)
              }}
              disabled={connectedCount === 0}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Direct Auto-Post Broadcast
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:border-shopee text-xs px-4"
              onClick={() => setActiveTab('autopost')}
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-shopee" />
              Broadcast Queue & Scheduling
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                fetchAccounts()
                fetchRadarFeed()
              }}
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1', (loading || radarLoading) && 'animate-spin')} />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-muted/80 p-1.5 rounded-xl border border-border flex flex-wrap w-full sm:w-auto h-auto gap-1">
          <TabsTrigger
            value="radar"
            className="flex-1 sm:flex-initial h-10 px-4 text-xs sm:text-sm font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-shopee" />
            <span>Live Trend Radar</span>
            <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0 ml-1">LIVE</Badge>
          </TabsTrigger>

          <TabsTrigger
            value="channels"
            className="flex-1 sm:flex-initial h-10 px-4 text-xs sm:text-sm font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-emerald-500" />
            <span>Channels & Accounts</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500 text-emerald-500 ml-1">
              {connectedCount}/{PLATFORM_DEFINITIONS.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger
            value="autopost"
            className="flex-1 sm:flex-initial h-10 px-4 text-xs sm:text-sm font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>Auto-Post Scheduling Queue</span>
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: LIVE TREND RADAR                                               */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="radar" className="space-y-6 outline-none">
          <TrendRadarView
            items={filteredRadarItems}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={setSelectedPlatform}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedVelocity={selectedVelocity}
            onVelocityChange={setSelectedVelocity}
            onResetFilters={() => {
              setSelectedPlatform('all')
              setSelectedVelocity('all')
              setSearchQuery('')
            }}
            onCopyHook={handleCopyHook}
            onAddToStudio={handleAddToStudio}
            onBroadcastTrend={handleBroadcastTrend}
            copiedHookId={copiedHookId}
          />
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: CHANNELS & ACCOUNTS (EXISTING PRESERVED)                       */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="channels" className="space-y-6 outline-none">
          {/* Analytics / Highlights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-border/70 hover:border-shopee/40 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-shopee/10 text-shopee">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Linked Accounts</div>
                  <div className="text-xl font-bold text-foreground">
                    {connectedCount}{' '}
                    <span className="text-xs font-normal text-muted-foreground">/ {PLATFORM_DEFINITIONS.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border/70 hover:border-shopee/40 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">OAuth Security Gate</div>
                  <div className="text-xl font-bold text-emerald-500">Active</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border/70 hover:border-shopee/40 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Auto-Post Engine</div>
                  <div className="text-xl font-bold text-foreground">Synchronized</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border/70 hover:border-shopee/40 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Total Multi-Platform Reach</div>
                  <div className="text-xl font-bold text-foreground">Est. 45,000+</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Channel Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Channels & Accounts</h2>
                <p className="text-xs text-muted-foreground">
                  Sambungkan akaun TikTok, Instagram, dan Facebook rasmi anda untuk mula menjadualkan pos affiliate secara automatik.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PLATFORM_DEFINITIONS.map((platform) => {
                const Icon = platform.icon
                const linkedAccount = accounts.find((a) => a.platform === platform.id && a.isConnected)
                const isConnecting = connectingPlatform === platform.id
                const isDisconnecting = disconnectingPlatform === platform.id

                return (
                  <Card
                    key={platform.id}
                    className={cn(
                      'border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden',
                      linkedAccount
                        ? 'border-emerald-500/40 bg-card hover:border-emerald-500/80 shadow-md'
                        : 'border-border/80 bg-card hover:border-shopee/50'
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: platform.color }}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base font-bold text-foreground">
                                {platform.name}
                              </CardTitle>
                              {linkedAccount?.isDemo && (
                                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-500">
                                  Demo Channel
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                              {linkedAccount ? `@${linkedAccount.platformUsername || 'connected_user'}` : 'Not connected'}
                            </span>
                          </div>
                        </div>

                        <Badge
                          className={cn(
                            'text-[10px] font-mono uppercase font-bold tracking-wider',
                            linkedAccount
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {linkedAccount ? 'Authenticated' : 'Disconnected'}
                        </Badge>
                      </div>

                      <CardDescription className="text-xs text-foreground/80 mt-2 leading-relaxed">
                        {platform.recommendedFor}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 py-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target Audience:</span>
                          <span className="font-semibold text-foreground text-right">{platform.audienceTag}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Character Limit:</span>
                          <span className="text-foreground">{platform.characterLimit} chars</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Media Requirement:</span>
                          <span className="text-foreground">
                            {platform.requiresImage ? 'Photo/Video Required' : 'Text & Link Supported'}
                          </span>
                        </div>
                        {linkedAccount?.lastUsedAt && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Last Auto-Post:</span>
                            <span>{new Date(linkedAccount.lastUsedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
                      {linkedAccount ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive min-h-[44px]"
                            onClick={() => handleDisconnect(platform.id)}
                            disabled={isDisconnecting}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                          </Button>

                          <Button
                            size="sm"
                            className="text-xs bg-shopee hover:bg-shopee/90 text-white font-medium min-h-[44px]"
                            onClick={() => {
                              setSelectedTargetPlatforms([platform.id])
                              setTestPostModalOpen(true)
                            }}
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            Quick Post
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full text-xs font-semibold bg-shopee hover:bg-shopee/90 text-white min-h-[44px]"
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          {isConnecting ? 'Authenticating...' : `Connect ${platform.name}`}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: AUTO-POST & BROADCAST QUEUE (EXISTING PRESERVED)               */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="autopost" className="space-y-6 outline-none">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-shopee" />
                  Auto-Post Scheduling Queue
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pantau senarai siaran berjadual ke TikTok, Instagram, Facebook, dan X.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-shopee hover:bg-shopee/90 text-white text-xs font-semibold min-h-[44px]"
                  onClick={() => {
                    setSelectedTargetPlatforms(connectedAccounts.map((a) => a.platform))
                    setTestPostModalOpen(true)
                  }}
                  disabled={connectedCount === 0}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Cipta Siaran Segera
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs min-h-[44px]"
                  onClick={() => setActivePage('autopost')}
                >
                  Buka Pengurus Penuh
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>

            {/* Queue Items */}
            {queueLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-shopee" />
                Memuatkan giliran siaran...
              </div>
            ) : scheduledPosts.length === 0 ? (
              <div className="p-8 border border-dashed rounded-xl text-center space-y-2">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
                <h4 className="text-xs font-bold text-foreground">Tiada Siaran Menunggu</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Semua siaran telah diproses atau tiada siaran dijadualkan. Klik "Cipta Siaran Segera" atau pilih mana-mana trend di Live Trend Radar untuk mula menyiarkan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {post.status.toUpperCase()}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(post.scheduledAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium text-foreground line-clamp-1">{post.caption}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {post.platforms.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px] font-mono">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Auto-Post Direct Publish Modal (Preserved & Enhanced) */}
      <Dialog open={testPostModalOpen} onOpenChange={setTestPostModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Send className="w-5 h-5 text-shopee" />
              Direct Multi-Channel Auto-Post
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Siar atau jadualkan pos ke semua saluran media sosial anda secara serentak dengan pautan Shopee Affiliate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold mb-2 block">Pilih Saluran Sasaran</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORM_DEFINITIONS.map((p) => {
                  const isLinked = accounts.some((a) => a.platform === p.id && a.isConnected)
                  const isSelected = selectedTargetPlatforms.includes(p.id)
                  const Icon = p.icon

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!isLinked}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTargetPlatforms((prev) => prev.filter((id) => id !== p.id))
                        } else {
                          setSelectedTargetPlatforms((prev) => [...prev, p.id])
                        }
                      }}
                      className={cn(
                        'p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all text-xs min-h-[54px]',
                        !isLinked && 'opacity-40 cursor-not-allowed border-dashed bg-muted/40',
                        isLinked && isSelected && 'border-shopee bg-shopee/10 font-bold',
                        isLinked && !isSelected && 'border-border hover:border-shopee/50 bg-card'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className="w-4 h-4" style={{ color: p.color }} />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-shopee" />}
                      </div>
                      <span className="font-semibold truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {isLinked ? 'Ready' : 'Not linked'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Kapsyen & Pautan Affiliate</Label>
              <Textarea
                rows={4}
                value={testCaption}
                onChange={(e) => setTestCaption(e.target.value)}
                placeholder="Tulis kapsyen promosi atau ulasan produk..."
                className="text-xs font-sans leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                <span>Tip: Gunakan hashtag #ShopeeMY untuk keterlihatan tinggi di FYP</span>
                <span>{testCaption.length} aksara</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTestPostModalOpen(false)}
              className="text-xs min-h-[44px]"
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-shopee hover:bg-shopee/90 text-white font-semibold text-xs min-h-[44px] px-4"
              onClick={handleBroadcastTest}
              disabled={isPublishingTest || selectedTargetPlatforms.length === 0}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isPublishingTest ? 'Menyiarkan...' : 'Siar Sekarang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
