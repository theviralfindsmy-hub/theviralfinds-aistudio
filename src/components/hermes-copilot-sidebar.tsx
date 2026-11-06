'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Sparkles,
  X,
  Send,
  ArrowRight,
  Share2,
  ExternalLink,
  ShoppingBag,
  Zap,
  TrendingUp,
  SlidersHorizontal,
  CheckCircle2,
  Minimize2,
  Maximize2,
  ChevronRight,
  Clock,
  Compass,
  Calculator,
  Film,
  Radio,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAppStore, type PageId } from '@/store/app-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// AG-UI Protocol Context & Hooks
import {
  CopilotProvider,
  useCopilot,
  useCopilotSafe,
  useCopilotReadable,
  useCopilotAction,
  type CopilotChatMessage,
} from '@/lib/copilot'

// Generative UI Cards
import { CommissionSimulatorCard } from '@/components/copilot/commission-simulator-card'
import { ViralHookCard } from '@/components/copilot/viral-hook-card'
import { BroadcastActionCard } from '@/components/copilot/broadcast-action-card'

/**
 * Inner component that interacts with AG-UI CopilotProvider
 */
export function HermesCopilotSidebarInner() {
  const { activePage, setActivePage } = useAppStore()
  const {
    isSidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    messages,
    addMessage,
    executeAction,
    cardState,
    setCardState,
  } = useCopilot()

  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. AG-UI useCopilotReadable: Expose active page state to AI reasoning engine
  useCopilotReadable({
    id: 'current_page_telemetry',
    description: 'Active screen telemetry and contextual view in TheViralFinds AppShell',
    value: {
      activePage,
      viewTimestamp: new Date().toISOString(),
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'desktop',
    },
  })

  // 2. AG-UI useCopilotAction: Register callable client-side tools
  useCopilotAction({
    name: 'simulate_commission',
    description: 'Open and configure the Interactive Commission Simulator Card in chat',
    parameters: {
      parse: (args: any) => ({
        price: Number(args?.price) || 45,
        units: Number(args?.units) || 150,
        commissionRate: Number(args?.commissionRate) || 12,
        productName: args?.productName || 'Serum Brightening Vitamin C 30ml',
      }),
    },
    handler: async (args) => {
      addMessage({
        role: 'assistant',
        content: `Berikut adalah simulasi komisen interaktif untuk "${args.productName}". Anda boleh laraskan slider harga dan sasaran unit jualan di bawah:`,
        actionData: {
          type: 'card',
          cardType: 'commission_simulator',
          cardProps: args,
        },
      })
      return { success: true, opened: 'commission_simulator', args }
    },
  })

  useCopilotAction({
    name: 'generate_viral_hook',
    description: 'Generate multi-angle viral video hooks (Curiosity, PAS, Manglish, Shock) in chat',
    parameters: {
      parse: (args: any) => ({
        productName: args?.productName || 'Serum Brightening Vitamin C 30ml',
        category: args?.category || 'Beauty & Skincare',
        initialAngle: args?.initialAngle || 'dialect',
      }),
    },
    handler: async (args) => {
      addMessage({
        role: 'assistant',
        content: `Saya telah menjana 4 variasi hook video FYP untuk "${args.productName}". Termasuk loghat santai tempatan dan psikologi Curiosity Gap:`,
        actionData: {
          type: 'card',
          cardType: 'viral_hook',
          cardProps: args,
        },
      })
      return { success: true, opened: 'viral_hook', args }
    },
  })

  useCopilotAction({
    name: 'broadcast_social_post',
    description: 'Open the One-Click Multi-Channel Broadcast action card for scheduled social publishing',
    parameters: {
      parse: (args: any) => ({
        platform: args?.platform || 'tiktok',
        productName: args?.productName || 'Serum Brightening Vitamin C 30ml',
        affiliateUrl: args?.affiliateUrl || 'https://shp.ee/tvf-serum',
        subId: args?.subId || 'tvf_copilot_01',
      }),
    },
    handler: async (args) => {
      addMessage({
        role: 'assistant',
        content: `Sedia untuk siaran media sosial! Pilih saluran sasaran (TikTok, XHS, Twitter/X, Shorts) dan semak pautan sub-affiliate anda:`,
        actionData: {
          type: 'card',
          cardType: 'broadcast_action',
          cardProps: args,
        },
      })
      return { success: true, opened: 'broadcast_action', args }
    },
  })

  useCopilotAction({
    name: 'navigate_page',
    description: 'Navigate AppShell to any supported page view',
    parameters: {
      parse: (args: any) => ({ targetPage: args?.targetPage as PageId }),
    },
    handler: async ({ targetPage }) => {
      setActivePage(targetPage)
      toast.success(`Menavigasi ke halaman ${targetPage}`)
      setSidebarOpen(false)
      return { navigated: targetPage }
    },
  })

  // Keyboard shortcut: Cmd+J or Ctrl+J to toggle Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const getPageContextLabel = () => {
    switch (activePage) {
      case 'dashboard':
        return 'Viewing Affiliate Dashboard & Revenue Insights'
      case 'products':
        return 'Viewing Shopee & TikTok Product Catalog'
      case 'socialhub':
        return 'Managing Linked Social Media (TikTok, XHS, X, Shorts)'
      case 'autopost':
        return 'Configuring Scheduled Auto-Posts'
      case 'trends':
        return 'Analyzing Real-time Malaysian FYP Trends'
      case 'addons':
        return 'Browsing 10 Manus Modular Addons'
      case 'studio':
        return 'Producing Video Scripts & Storyboards'
      default:
        return `Navigating ${String(activePage).toUpperCase()}`
    }
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim()) return

    addMessage({
      role: 'user',
      content: query,
    })

    if (!textToSend) setInput('')
    setIsTyping(true)

    // CopilotKit Reasoning & Intent Execution Engine
    setTimeout(async () => {
      const lower = query.toLowerCase()

      if (
        lower.includes('komisen') ||
        lower.includes('simulasi') ||
        lower.includes('calculator') ||
        lower.includes('kira untung')
      ) {
        await executeAction('simulate_commission', {
          price: 45.0,
          units: 150,
          commissionRate: 12.0,
          productName: 'Serum Brightening Vitamin C 30ml',
        })
      } else if (
        lower.includes('hook') ||
        lower.includes('skrip') ||
        lower.includes('video') ||
        lower.includes('fyp') ||
        lower.includes('santai')
      ) {
        await executeAction('generate_viral_hook', {
          productName: 'Serum Brightening Vitamin C 30ml',
          category: 'Beauty & Skincare',
          initialAngle: 'dialect',
        })
      } else if (
        lower.includes('broadcast') ||
        lower.includes('siar') ||
        lower.includes('autopost') ||
        lower.includes('post') ||
        lower.includes('publish')
      ) {
        await executeAction('broadcast_social_post', {
          platform: 'tiktok',
          productName: 'Serum Brightening Vitamin C 30ml',
          affiliateUrl: 'https://shp.ee/tvf-serum',
          subId: 'tvf_copilot_01',
        })
      } else if (lower.includes('social') || lower.includes('akaun')) {
        addMessage({
          role: 'assistant',
          content:
            'Saya telah menyemak Social Media Hub anda. 4 platform disokong (TikTok, Xiaohongshu, Twitter/X, YouTube Shorts). Anda boleh terus menyiarkan pos promosi sekarang.',
          actionData: {
            type: 'navigation',
            actionLabel: 'Buka Social Media Hub',
            targetPage: 'socialhub',
          },
        })
      } else if (lower.includes('produk') || lower.includes('trending') || lower.includes('racun')) {
        addMessage({
          role: 'assistant',
          content:
            'Saya mengesyorkan "Serum Vitamin C Brightening" dengan komisen 12% (anggaran RM5.40 seunit). Produk ini mencatat lonjakan carian 145% di Shopee Malaysia minggu ini.',
          actionData: {
            type: 'product_card',
            productName: 'Serum Vitamin C Brightening',
            commissionRate: 12.0,
            price: 45.0,
            targetPage: 'products',
            actionLabel: 'Lihat Dalam Katalog',
          },
        })
      } else {
        addMessage({
          role: 'assistant',
          content: `Berdasarkan halaman ${activePage} yang sedang anda buka, saya sedia bantu membuat simulasi komisen, jana video hook FYP, atau siarkan autopost terus ke media sosial anda.`,
          actionData: {
            type: 'quick_action',
            actionLabel: 'Kira Simulasi Komisen',
            cardType: 'commission_simulator',
          },
        })
      }

      setIsTyping(false)
    }, 450)
  }

  return (
    <>
      {/* Floating Copilot Trigger Button (Desktop & Tablet) */}
      <motion.button
        data-testid="copilot-floating-trigger"
        aria-label="Open Hermes Copilot"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-shopee to-orange-600 text-white shadow-xl shadow-shopee/30 border-2 border-white/20 hover:shadow-shopee/50 transition-all font-sans cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-lime" />
        <span className="text-xs font-bold tracking-wide">Hermes Copilot</span>
        <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-black/25 rounded border border-white/20 text-white/90">
          ⌘J
        </kbd>
      </motion.button>

      {/* Slide-over Copilot Drawer (CopilotKit AG-UI Sidebar) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div
            data-testid="copilot-sidebar-drawer"
            className="fixed inset-0 z-50 pointer-events-none font-sans"
          >
            {/* Backdrop */}
            <motion.div
              data-testid="copilot-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto"
            />

            {/* Sidebar Drawer Panel */}
            <motion.div
              data-testid="copilot-sidebar-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="absolute top-0 right-0 bottom-0 w-full sm:w-[440px] bg-card/98 backdrop-blur-xl border-l-2 border-shopee/30 shadow-2xl flex flex-col pointer-events-auto text-card-foreground"
            >
              {/* Header */}
              <div className="p-4 border-b border-border/80 bg-gradient-to-r from-shopee/10 via-background to-shopee/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-shopee/15 text-shopee flex items-center justify-center border border-shopee/30">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-foreground">Hermes In-App Copilot</h3>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 border-shopee/40 text-shopee"
                      >
                        CopilotKit AG-UI
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Context Aware
                    </p>
                  </div>
                </div>

                <Button
                  data-testid="copilot-close-btn"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Context Awareness Bar (useCopilotReadable) */}
              <div className="px-4 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-muted-foreground truncate font-mono">
                  <Compass className="w-3.5 h-3.5 text-shopee shrink-0" />
                  <span className="truncate">{getPageContextLabel()}</span>
                </div>
                <Badge
                  data-testid="copilot-active-page-badge"
                  variant="secondary"
                  className="text-[9px] shrink-0 font-mono"
                >
                  {activePage}
                </Badge>
              </div>

              {/* Chat Message Scroll Area */}
              <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    data-testid={`copilot-message-${m.id}`}
                    className={cn(
                      'flex flex-col space-y-2',
                      m.role === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'p-3 rounded-2xl max-w-[88%] leading-relaxed shadow-sm text-xs',
                        m.role === 'user'
                          ? 'bg-shopee text-white rounded-br-xs'
                          : 'bg-muted/70 border border-border/80 text-foreground rounded-bl-xs'
                      )}
                    >
                      {m.content}
                    </div>

                    {/* Generative UI Component Render: Commission Simulator Card */}
                    {(m.actionData?.cardType === 'commission_simulator' ||
                      m.generativeCard?.type === 'commission_simulator') && (
                      <div className="w-[96%]">
                        <CommissionSimulatorCard
                          {...(m.actionData?.cardProps || m.generativeCard?.props)}
                          onApplyToCampaign={(math) => {
                            setCardState('last_commission_sim', math)
                          }}
                        />
                      </div>
                    )}

                    {/* Generative UI Component Render: Viral Video Hook Card */}
                    {(m.actionData?.cardType === 'viral_hook' ||
                      m.generativeCard?.type === 'viral_hook') && (
                      <div className="w-[96%]">
                        <ViralHookCard
                          {...(m.actionData?.cardProps || m.generativeCard?.props)}
                          onSendToStudio={(hook) => {
                            setActivePage('studio')
                            setSidebarOpen(false)
                          }}
                        />
                      </div>
                    )}

                    {/* Generative UI Component Render: Broadcast Action Card */}
                    {(m.actionData?.cardType === 'broadcast_action' ||
                      m.generativeCard?.type === 'broadcast_action') && (
                      <div className="w-[96%]">
                        <BroadcastActionCard
                          {...(m.actionData?.cardProps || m.generativeCard?.props)}
                        />
                      </div>
                    )}

                    {/* Legacy/Quick Action & Product Card */}
                    {m.actionData &&
                      m.actionData.type !== 'card' &&
                      m.actionData.cardType !== 'commission_simulator' &&
                      m.actionData.cardType !== 'viral_hook' &&
                      m.actionData.cardType !== 'broadcast_action' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-[88%] p-3 rounded-xl bg-background border-2 border-shopee/30 shadow-md space-y-2 text-xs"
                        >
                          {m.actionData.type === 'product_card' && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground text-xs">
                                  {m.actionData.productName}
                                </span>
                                <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-mono">
                                  +{m.actionData.commissionRate}% Comm
                                </Badge>
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono">
                                Harga: RM{m.actionData.price?.toFixed(2)}
                              </div>
                            </div>
                          )}

                          <Button
                            size="sm"
                            className="w-full h-7 text-[11px] bg-shopee hover:bg-shopee/90 text-white font-medium"
                            onClick={() => {
                              if (m.actionData?.targetPage) {
                                setActivePage(m.actionData.targetPage)
                                toast.success(`Menavigasi ke ${m.actionData.targetPage}`)
                                setSidebarOpen(false)
                              } else if (m.actionData?.cardType === 'commission_simulator') {
                                executeAction('simulate_commission', {})
                              }
                            }}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            {m.actionData.actionLabel || 'Jalankan Aksi'}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </motion.div>
                      )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs p-2">
                    <Bot className="w-3.5 h-3.5 text-shopee animate-bounce" />
                    <span className="font-mono">Hermes sedang berfikir...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2.5 bg-muted/20 border-t border-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                <button
                  type="button"
                  data-testid="prompt-chip-sim"
                  onClick={() => handleSendMessage('Kira simulasi komisen produk')}
                  className="px-2.5 py-1 rounded-full border border-border bg-background hover:border-shopee text-foreground text-nowrap transition-colors flex items-center gap-1"
                >
                  <Calculator className="w-3 h-3 text-shopee" />
                  Simulasi Komisen
                </button>
                <button
                  type="button"
                  data-testid="prompt-chip-hook"
                  onClick={() => handleSendMessage('Jana skrip video viral hook FYP')}
                  className="px-2.5 py-1 rounded-full border border-border bg-background hover:border-shopee text-foreground text-nowrap transition-colors flex items-center gap-1"
                >
                  <Film className="w-3 h-3 text-emerald-500" />
                  Viral Hook 4-Angle
                </button>
                <button
                  type="button"
                  data-testid="prompt-chip-broadcast"
                  onClick={() => handleSendMessage('Siar pos autopost ke media sosial')}
                  className="px-2.5 py-1 rounded-full border border-border bg-background hover:border-shopee text-foreground text-nowrap transition-colors flex items-center gap-1"
                >
                  <Radio className="w-3 h-3 text-indigo-500" />
                  Broadcast Post
                </button>
                <button
                  type="button"
                  data-testid="prompt-chip-trends"
                  onClick={() => handleSendMessage('Cadangkan produk trending Shopee harini')}
                  className="px-2.5 py-1 rounded-full border border-border bg-background hover:border-shopee text-foreground text-nowrap transition-colors"
                >
                  🔥 Produk Trending
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-border/80 bg-background flex items-center gap-2">
                <Input
                  data-testid="copilot-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Tanya Hermes atau minta kad simulasi / hook / broadcast..."
                  className="text-xs h-9"
                />
                <Button
                  data-testid="copilot-send-btn"
                  size="icon"
                  className="h-9 w-9 bg-shopee hover:bg-shopee/90 text-white shrink-0 cursor-pointer"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Root HermesCopilotSidebar:
 * Safely self-wraps with CopilotProvider if not already in context tree
 */
export function HermesCopilotSidebar() {
  const existingContext = useCopilotSafe()

  if (existingContext) {
    return <HermesCopilotSidebarInner />
  }

  return (
    <CopilotProvider>
      <HermesCopilotSidebarInner />
    </CopilotProvider>
  )
}
