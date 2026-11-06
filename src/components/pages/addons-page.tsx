'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Film,
  Code2,
  GitFork,
  Presentation,
  Compass,
  Zap,
  Home,
  ShoppingCart,
  HardDrive,
  CheckSquare,
  Sparkles,
  Bot,
  Play,
  ArrowRight,
  ShieldAlert,
  Flame,
  Radio,
  Share2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAppStore, type PageId } from '@/store/app-store'
import { toast } from 'sonner'

interface AddonItem {
  id: string
  name: string
  version: string
  size: string
  category: string
  icon: React.ElementType
  color: string
  description: string
  features: string[]
  actionLabel: string
  targetPage?: PageId
  status: 'active' | 'ready' | 'sandboxed'
}

const MANUS_ADDONS: AddonItem[] = [
  {
    id: 'tvf-video-editor',
    name: 'TVF Video Studio Pro',
    version: 'v0.1.0',
    size: '61.4 MB',
    category: 'Media Engine',
    icon: Film,
    color: 'from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-500',
    description: 'Enjin pemprosesan dan penyuntingan video berterusan berasaskan AI untuk TikTok FYP & Reels.',
    features: ['Auto Hook Detector (0-3s)', 'Malay Voiceover & Caption Sync', 'Product Tagging Overlay'],
    actionLabel: 'Launch Video Studio',
    targetPage: 'studio',
    status: 'active',
  },
  {
    id: 'tvf-shopee-scout',
    name: 'Shopee & TikTok Scout',
    version: 'v0.0.1',
    size: '26 KB',
    category: 'E-Commerce Agent',
    icon: ShoppingCart,
    color: 'from-amber-500/20 to-orange-500/10 border-orange-500/30 text-orange-500',
    description: 'Penjejak harga kilat, semakan komisen affiliate tinggi (>= 10%), dan penarafan produk Shopee.',
    features: ['Real-time Commission Filter', 'Stock & Price Drop Sentinel', 'Sub-ID Tracking Validator'],
    actionLabel: 'Explore Products',
    targetPage: 'products',
    status: 'active',
  },
  {
    id: 'tvf-workflow',
    name: 'Manus Workflow Automator',
    version: 'v0.0.23',
    size: '728 KB',
    category: 'Autonomous Chain',
    icon: GitFork,
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-500',
    description: 'Rantaian automasi berbilang langkah (Multi-Step O-P-B-V pipeline) dari pautan produk hingga penyiaran.',
    features: ['Observe ➔ Plan ➔ Batch ➔ Verify', 'Safety Gate Approval Check', 'Conditional Webhook Triggers'],
    actionLabel: 'Configure Workflow',
    targetPage: 'autopost',
    status: 'ready',
  },
  {
    id: 'tvf-triggers',
    name: 'Event-Driven Triggers',
    version: 'v0.0.64',
    size: '47 KB',
    category: 'System Daemon',
    icon: Zap,
    color: 'from-amber-500/20 to-yellow-500/10 border-yellow-500/30 text-yellow-500',
    description: 'Pencetus automatik apabila jualan 11.11, Payday Sale, atau Shopee Live bermula.',
    features: ['Shopee Flash Sale Listener', 'Spike Traffic Alerts', 'Auto Telegram Broadcast'],
    actionLabel: 'Manage Alerts',
    targetPage: 'alerts',
    status: 'ready',
  },
  {
    id: 'tvf-webdev',
    name: 'Affiliate Landing Sandbox',
    version: 'v0.0.68',
    size: '25.6 MB',
    category: 'Web Engine',
    icon: Code2,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-500',
    description: 'Kotak pasir penjanaan laman mikro affiliate bio-link (Mirip Linktree & Shopee Showcase).',
    features: ['Instant Bio-Page Builder', 'Custom Sub-Domain Routing', 'Conversion CVR Analytics'],
    actionLabel: 'Open Link Hub',
    targetPage: 'links',
    status: 'active',
  },
  {
    id: 'tvf-slides',
    name: 'Affiliate Pitch Deck Gen',
    version: 'v0.0.1',
    size: '170 KB',
    category: 'Presentation',
    icon: Presentation,
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-500',
    description: 'Penjana dek persembahan penajaan (Media Kit) untuk KOL & pencipta kandungan bekerjasama dengan jenama.',
    features: ['Automated Engagement Stats', 'Rate Card Formatter', 'Export PDF & Slides'],
    actionLabel: 'Open Hermes Agent',
    targetPage: 'hermes',
    status: 'ready',
  },
  {
    id: 'tvf-trip',
    name: 'Campaign Route Planner',
    version: 'v0.0.1',
    size: '113 KB',
    category: 'Planner',
    icon: Compass,
    color: 'from-sky-500/20 to-blue-500/10 border-sky-500/30 text-sky-500',
    description: 'Pengatur jadual kempen bulanan (Gaji, Double Digits, Payday, Ramadan) untuk affiliate Malaysia.',
    features: ['Malaysian Calendar Sync', 'Best Post-Time Predictor', 'Content Pillar Mapping'],
    actionLabel: 'View AI Calendar',
    targetPage: 'calendar',
    status: 'ready',
  },
  {
    id: 'tvf-homemaster',
    name: 'Smart Bot Broadcaster',
    version: 'v0.4.10',
    size: '21 KB',
    category: 'Broadcaster',
    icon: Home,
    color: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-500',
    description: 'Integrasi pintar ke saluran peribadi WhatsApp & Telegram dengan kod diskaun terpantas.',
    features: ['Telegram Channel Webhook', 'WhatsApp Broadcast Hook', 'Anti-Spam Throttling'],
    actionLabel: 'Check Social Intel',
    targetPage: 'trends',
    status: 'ready',
  },
  {
    id: 'tvf-storage',
    name: 'Affiliate Asset Vault',
    version: 'v0.1.5',
    size: '9.4 KB',
    category: 'Asset Storage',
    icon: HardDrive,
    color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-500',
    description: 'Penyimpanan terpusat fail grafik, mockups, aset promosi, dan thumbnail berkualiti tinggi.',
    features: ['Fast Asset CDN Access', 'Thumbnail Preset Library', 'Auto WebP Compression'],
    actionLabel: 'AI Thumbnails',
    targetPage: 'thumbnails',
    status: 'active',
  },
  {
    id: 'tvf-tasks',
    name: 'Manus Mission Control',
    version: 'v0.0.15',
    size: '8.2 KB',
    category: 'Task Manager',
    icon: CheckSquare,
    color: 'from-red-500/20 to-orange-500/10 border-red-500/30 text-red-500',
    description: 'Pusat penjejak matlamat harian affiliate untuk mencapai sasaran pendapatan RM10,000/bulan.',
    features: ['Daily Commission Quota', 'Gamified Achievement Track', 'Top Rank Milestones'],
    actionLabel: 'Check Achievements',
    targetPage: 'achievements',
    status: 'active',
  },
]

export function AddonsPage() {
  const { setActivePage } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'active' | 'ready'>('all')

  const filteredAddons = MANUS_ADDONS.filter((item) => {
    if (filter === 'all') return true
    return item.status === filter
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-shopee/15 via-background to-shopee/5 border-2 border-shopee/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-shopee text-white hover:bg-shopee/90 font-mono text-xs px-2.5 py-0.5">
              MANUS STUDIO v2.1.0 ARCHITECTURE
            </Badge>
            <Badge variant="outline" className="border-emerald-500 text-emerald-500 font-mono text-xs">
              10 Microkernel Addons Active
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Modular Addon Execution Engine
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Diinspirasikan daripada struktur mikrokernel 10 bundled addon Manus Studio Desktop v2.1.0. Setiap modul
            beroperasi sebagai mikrosistem berautonomi untuk menguruskan kitaran penghasilan video, tinjauan produk Shopee,
            dan automasi penyiaran.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-shopee hover:bg-shopee/90 text-white font-semibold text-xs"
              onClick={() => {
                toast.success('Manus Multi-Agent loop active in background!')
              }}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Sync All Micro-Services
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:border-shopee text-xs"
              onClick={() => setActivePage('hermes')}
            >
              <Bot className="w-3.5 h-3.5 mr-1.5 text-shopee" />
              Launch Hermes Controller
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'ready'] as const).map((tab) => (
            <Button
              key={tab}
              variant={filter === tab ? 'default' : 'ghost'}
              size="sm"
              className={`text-xs capitalize ${
                filter === tab ? 'bg-shopee text-white hover:bg-shopee/90' : 'text-muted-foreground'
              }`}
              onClick={() => setFilter(tab)}
            >
              {tab === 'all' ? 'All Addons (10)' : `${tab} Services`}
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground font-mono hidden sm:block">
          Architecture: Go 1.27.3 IPC + Stdio MCP
        </div>
      </div>

      {/* Bento Grid: 10 Micro-Addons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAddons.map((addon) => {
          const Icon = addon.icon
          return (
            <Card
              key={addon.id}
              className={`group hover:shadow-xl transition-all duration-300 border-2 bg-gradient-to-b ${addon.color} hover:border-shopee/60 flex flex-col justify-between`}
            >
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-background/80 border border-border shadow-sm group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-shopee" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono border-border bg-background/50">
                      {addon.size}
                    </Badge>
                    <Badge
                      className={`text-[10px] uppercase font-mono font-bold ${
                        addon.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                      }`}
                    >
                      {addon.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-shopee transition-colors">
                      {addon.name}
                    </CardTitle>
                    <span className="text-[10px] font-mono text-muted-foreground">{addon.version}</span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">{addon.category}</span>
                </div>

                <CardDescription className="text-xs text-foreground/80 leading-relaxed">
                  {addon.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 py-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Core Capabilities:
                </div>
                <ul className="space-y-1.5">
                  {addon.features.map((feature, idx) => (
                    <li key={idx} className="text-xs text-foreground/90 flex items-center gap-1.5 font-medium">
                      <span className="size-1.5 rounded-full bg-shopee" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border/50">
                <Button
                  className="w-full text-xs font-semibold bg-background hover:bg-shopee hover:text-white border border-border group-hover:border-shopee text-foreground transition-all"
                  onClick={() => {
                    if (addon.targetPage) {
                      setActivePage(addon.targetPage)
                      toast.success(`Launched ${addon.name}`)
                    } else {
                      toast.info(`${addon.name} is executing autonomously in background.`)
                    }
                  }}
                >
                  <span>{addon.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
