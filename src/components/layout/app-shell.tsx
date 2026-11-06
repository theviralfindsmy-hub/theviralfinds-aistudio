'use client'

import { useAppStore, type PageId } from '@/store/app-store'
import { AppSidebar } from '@/components/layout/sidebar'
import { AppHeader } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { MobileSheet } from '@/components/layout/mobile-sheet'
import { CommandPalette } from '@/components/layout/command-palette'
import { RegisterSW } from '@/components/pwa/register-sw'
import { PullToRefreshWrapper } from '@/components/pwa/pull-to-refresh-wrapper'
import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorBoundary } from '@/components/error-boundary'
import { NetworkBanner } from '@/components/network-banner'
import { AgentFloatingHud } from '@/components/agent-floating-hud'
import { HermesCopilotSidebar } from '@/components/hermes-copilot-sidebar'
import { PageSkeleton } from '@/components/ui/inline-skeleton'
import {
  LayoutDashboard, ShoppingBag, Link2, BarChart3, Calculator,
  Bot, Sparkles, HelpCircle, FileText, Shield, Lock,
  DollarSign, ChevronLeft, ChevronRight, X, Loader2, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { DashboardPage } from '@/components/pages/dashboard-page'
import { LandingPage } from '@/components/pages/landing-page'
import { LoginPage } from '@/components/pages/login-page'
import { RegisterPage } from '@/components/pages/register-page'

const ProductsPage = lazy(() => import('@/components/pages/products-page').then(m => ({ default: m.ProductsPage })))
const LinksPage = lazy(() => import('@/components/pages/links-page').then(m => ({ default: m.LinksPage })))
const AnalyticsPage = lazy(() => import('@/components/pages/analytics-page').then(m => ({ default: m.AnalyticsPage })))
const CampaignsPage = lazy(() => import('@/components/pages/campaigns-page').then(m => ({ default: m.CampaignsPage })))
const CalculatorPage = lazy(() => import('@/components/pages/calculator-page').then(m => ({ default: m.CalculatorPage })))
const EarningsPage = lazy(() => import('@/components/pages/earnings-page').then(m => ({ default: m.EarningsPage })))
const AutopostPage = lazy(() => import('@/components/pages/autopost-page').then(m => ({ default: m.AutopostPage })))
const ContentPage = lazy(() => import('@/components/pages/content-page').then(m => ({ default: m.ContentPage })))
const TrendsPage = lazy(() => import('@/components/pages/trends-page').then(m => ({ default: m.TrendsPage })))
const ProfitPage = lazy(() => import('@/components/pages/profit-page').then(m => ({ default: m.ProfitPage })))
const StudioPage = lazy(() => import('@/components/pages/studio-page').then(m => ({ default: m.StudioPage })))
const HermesPage = lazy(() => import('@/components/pages/hermes-page').then(m => ({ default: m.HermesPage })))
const AchievementsPage = lazy(() => import('@/components/pages/achievements-page').then(m => ({ default: m.AchievementsPage })))
const LeaderboardPage = lazy(() => import('@/components/pages/leaderboard-page').then(m => ({ default: m.LeaderboardPage })))
const ReferralsPage = lazy(() => import('@/components/pages/referrals-page').then(m => ({ default: m.ReferralsPage })))
const NotificationsPage = lazy(() => import('@/components/pages/notifications-page').then(m => ({ default: m.NotificationsPage })))
const SettingsPage = lazy(() => import('@/components/pages/settings-page').then(m => ({ default: m.SettingsPage })))
const AddonsPage = lazy(() => import('@/components/pages/addons-page').then(m => ({ default: m.AddonsPage })))
const SocialHubPage = lazy(() => import('@/components/pages/socialhub-page').then(m => ({ default: m.SocialHubPage })))

// Fasa 2 -- Multi-platform expansion
const TikTokPage = lazy(() => import('@/components/pages/tiktok-page').then(m => ({ default: m.TikTokPage })))
const LazadaPage = lazy(() => import('@/components/pages/lazada-page').then(m => ({ default: m.LazadaPage })))
const LivePage = lazy(() => import('@/components/pages/live-page').then(m => ({ default: m.LivePage })))
const ComparePage = lazy(() => import('@/components/pages/compare-page').then(m => ({ default: m.ComparePage })))
const UnifiedPage = lazy(() => import('@/components/pages/unified-page').then(m => ({ default: m.UnifiedPage })))
const MatcherPage = lazy(() => import('@/components/pages/matcher-page').then(m => ({ default: m.MatcherPage })))

// Fasa 3 -- AI Superpowers
const RecommenderPage = lazy(() => import('@/components/pages/recommender-page').then(m => ({ default: m.RecommenderPage })))
const ThumbnailsPage = lazy(() => import('@/components/pages/thumbnails-page').then(m => ({ default: m.ThumbnailsPage })))
const AlertsPage = lazy(() => import('@/components/pages/alerts-page').then(m => ({ default: m.AlertsPage })))
const AbTestingPage = lazy(() => import('@/components/pages/abtesting-page').then(m => ({ default: m.AbTestingPage })))
const AudiencePage = lazy(() => import('@/components/pages/audience-page').then(m => ({ default: m.AudiencePage })))
const HashtagsPage = lazy(() => import('@/components/pages/hashtags-page').then(m => ({ default: m.HashtagsPage })))
const CalendarPage = lazy(() => import('@/components/pages/calendar-page').then(m => ({ default: m.CalendarPage })))

// Fasa 4 -- Monetize & Scale
const PricingPage = lazy(() => import('@/components/pages/pricing-page').then(m => ({ default: m.PricingPage })))
const MarketplacePage = lazy(() => import('@/components/pages/marketplace-page').then(m => ({ default: m.MarketplacePage })))
const TeamPage = lazy(() => import('@/components/pages/team-page').then(m => ({ default: m.TeamPage })))
const WhiteLabelPage = lazy(() => import('@/components/pages/whitelabel-page').then(m => ({ default: m.WhiteLabelPage })))
const ApiKeysPage = lazy(() => import('@/components/pages/apikeys-page').then(m => ({ default: m.ApiKeysPage })))

// Fasa 5 -- Shopee Pro (Open API Integration)
const IntelligencePage = lazy(() => import('@/components/pages/intelligence-page').then(m => ({ default: m.IntelligencePage })))
const HealthPage = lazy(() => import('@/components/pages/health-page').then(m => ({ default: m.HealthPage })))
const PromotionsPage = lazy(() => import('@/components/pages/promotions-page').then(m => ({ default: m.PromotionsPage })))
const AdsPage = lazy(() => import('@/components/pages/ads-page').then(m => ({ default: m.AdsPage })))
const ChatPage = lazy(() => import('@/components/pages/chat-page').then(m => ({ default: m.ChatPage })))

function PageLoader() {
  return <PageSkeleton />
}

const pageComponents: Record<PageId, React.ComponentType<any>> = {
  dashboard: DashboardPage,
  products: ProductsPage,
  links: LinksPage,
  analytics: AnalyticsPage,
  campaigns: CampaignsPage,
  calculator: CalculatorPage,
  earnings: EarningsPage,
  autopost: AutopostPage,
  content: ContentPage,
  trends: TrendsPage,
  profit: ProfitPage,
  studio: StudioPage,
  hermes: HermesPage,
  achievements: AchievementsPage,
  leaderboard: LeaderboardPage,
  referrals: ReferralsPage,
  notifications: NotificationsPage,
  settings: SettingsPage,
  addons: AddonsPage,
  socialhub: SocialHubPage,
  // Fasa 2
  tiktok: TikTokPage,
  lazada: LazadaPage,
  live: LivePage,
  compare: ComparePage,
  unified: UnifiedPage,
  matcher: MatcherPage,
  // Fasa 3
  recommender: RecommenderPage,
  thumbnails: ThumbnailsPage,
  alerts: AlertsPage,
  abtesting: AbTestingPage,
  audience: AudiencePage,
  hashtags: HashtagsPage,
  calendar: CalendarPage,
  // Fasa 4
  pricing: PricingPage,
  marketplace: MarketplacePage,
  team: TeamPage,
  whitelabel: WhiteLabelPage,
  apikeys: ApiKeysPage,
  // Fasa 5
  intelligence: IntelligencePage,
  health: HealthPage,
  promotions: PromotionsPage,
  ads: AdsPage,
  chat: ChatPage,
}

// Onboarding Tour
const TOUR_STEPS = [
  {
    title: 'Welcome to TheViralFindsMY!',
    description: 'Your ultimate Shopee Affiliate Manager with AI-powered insights, link management, and earnings tracking.',
    icon: LayoutDashboard,
  },
  {
    title: 'Discover Products & Generate Links',
    description: 'Find trending products on Shopee and generate affiliate links instantly to start earning commissions.',
    icon: ShoppingBag,
  },
  {
    title: 'HERMES AI Hub',
    description: 'Chat with your AI assistant, manage skills, automate tasks, and get smart insights to boost your earnings.',
    icon: Bot,
  },
  {
    title: 'Track Earnings & Analytics',
    description: 'Monitor your performance with detailed analytics, conversion funnels, and real-time earnings tracking.',
    icon: BarChart3,
  },
]

function OnboardingTour({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const currentStep = TOUR_STEPS[step]
  const StepIcon = currentStep.icon

  const handleNext = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      onClose()
    }
  }, [step, onClose])

  const handlePrev = useCallback(() => {
    if (step > 0) setStep(step - 1)
  }, [step])

  if (!show) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
          <button
            onClick={onClose}
            aria-label="Close tour"
            className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-xl bg-shopee/10 text-shopee flex-shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-lime-dark" />
                <span className="text-[11px] font-semibold text-lime-dark uppercase tracking-wider">
                  Step {step + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">{currentStep.title}</h3>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{currentStep.description}</p>
          <div className="flex items-center gap-2 mb-6">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx === step ? 'bg-shopee w-8' : idx < step ? 'bg-shopee/40 w-4' : 'bg-muted w-4'
                )}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
              Skip Tour
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={step === 0} className="gap-1">
                <ChevronLeft className="w-3 h-3" /> Back
              </Button>
              <Button size="sm" onClick={handleNext} className="bg-shopee hover:bg-shopee-dark text-white gap-1 rounded">
                {step === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

function AuthScreen() {
  const { authView } = useAppStore()
  if (authView === 'login') return <LoginPage />
  if (authView === 'register') return <RegisterPage />
  return <LandingPage />
}

function AuthLoader() {
  const { quickDemoLogin } = useAppStore()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-12 h-12 rounded bg-shopee flex items-center justify-center overflow-hidden animate-pulse-glow">
          <img src="/apple-touch-icon.png" alt="TVF" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading THEVIRALFINDS...
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => useAppStore.setState({ isLoadingAuth: false, authView: 'landing' })}
          >
            Go to Home
          </Button>
          <Button
            size="sm"
            className="bg-shopee hover:bg-shopee-dark text-white text-xs font-semibold"
            onClick={() => quickDemoLogin()}
          >
            Demo Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const { activePage, setActivePage, isAuthenticated, isLoadingAuth, checkAuth, focusMode, toggleFocusMode } = useAppStore()
  const queryClient = useQueryClient()
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isAuthenticated) return
    const seen = localStorage.getItem('tvf_tour_seen')
    if (!seen) {
      const timer = setTimeout(() => setShowTour(true), 800)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated])

  const completeTour = useCallback(() => {
    setShowTour(false)
    localStorage.setItem('tvf_tour_seen', 'true')
  }, [])

  // Pull-to-refresh: invalidate all queries so they refetch with fresh data
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries()
    toast.success('Refreshed', { description: 'Latest data loaded.' })
  }, [queryClient])

  const PageComponent = pageComponents[activePage]

  // Show auth screen (login/register) when not authenticated
  if (isLoadingAuth) {
    return <AuthLoader />
  }
  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NetworkBanner />
      <div className="flex flex-1">
        {/* Hide sidebar in focus mode */}
        {!focusMode && <AppSidebar />}
        <MobileSheet />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 relative">
            <PullToRefreshWrapper onRefresh={handleRefresh}>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activePage}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <PageComponent />
                    </motion.div>
                  </AnimatePresence>
                </Suspense>
              </ErrorBoundary>
            </PullToRefreshWrapper>
          </main>

          {/* Footer -- Brutalist style */}
          <footer className="hidden lg:block border-t-2 border-border bg-gradient-to-b from-muted/30 to-background mt-auto">
            <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded bg-shopee flex items-center justify-center overflow-hidden">
                    <img src="/apple-touch-icon.png" alt="TVF" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-foreground text-sm">THEVIRALFINDS</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Empowering Malaysian affiliates with AI-powered analytics, link management, and HERMES intelligent automation.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-3">Quick Links</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    { label: 'Dashboard', id: 'dashboard' as PageId, icon: LayoutDashboard },
                    { label: 'Products', id: 'products' as PageId, icon: ShoppingBag },
                    { label: 'Links', id: 'links' as PageId, icon: Link2 },
                    { label: 'Analytics', id: 'analytics' as PageId, icon: BarChart3 },
                    { label: 'Calculator', id: 'calculator' as PageId, icon: Calculator },
                    { label: 'Earnings', id: 'earnings' as PageId, icon: DollarSign },
                    { label: 'Hermes AI', id: 'hermes' as PageId, icon: Bot },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-shopee transition-colors text-left"
                    >
                      <item.icon className="w-3 h-3 flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-3">Support</h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'Help Center', icon: HelpCircle },
                    { label: 'API Docs', icon: FileText },
                    { label: 'Terms of Service', icon: Shield },
                    { label: 'Privacy Policy', icon: Lock },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => toast.info('Coming soon', { description: `${item.label} page is under development.` })}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-shopee transition-colors w-full"
                    >
                      <item.icon className="w-3 h-3 flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-border px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} TheViralFindsMY -- Built with care for Malaysian Affiliates
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-mono bg-shopee/10 text-shopee border-shopee/30 border-2 rounded-none">
                  v8.1
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-mono bg-lime/15 text-lime-dark border-lime/30 border-2 rounded-none">
                  BRUTAL
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-mono bg-hermes/10 text-hermes border-hermes/30 border-2 rounded-none">
                  HERMES
                </Badge>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Nav -- hidden in focus mode */}
      {!focusMode && <MobileNav />}

      {/* Floating Action Button -- Spring entrance + Lime accent, hidden in focus mode */}
      {!focusMode && (
        <motion.button
          aria-label="Quick AI assistant"
          className="fixed bottom-20 right-4 z-30 lg:hidden w-14 h-14 rounded bg-shopee text-white shadow-lg shadow-shopee/30 flex items-center justify-center border-2 border-lime"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setActivePage('hermes')}
        >
          <Bot className="w-6 h-6" />
          <span className="absolute -right-0.5 -top-0.5 flex size-3">
            <span className="absolute inline-flex size-3 animate-ping rounded-full bg-lime/60" />
            <span className="relative inline-flex size-3 rounded-full bg-lime" />
          </span>
        </motion.button>
      )}

      {/* Focus Mode: Exit Focus floating button */}
      {focusMode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          aria-label="Exit focus mode"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded bg-card border-2 border-shopee text-shopee text-sm font-semibold shadow-lg shadow-shopee/20 hover:bg-shopee hover:text-white transition-colors"
          onClick={toggleFocusMode}
        >
          <EyeOff className="w-4 h-4" />
          Exit Focus
        </motion.button>
      )}

      {/* Onboarding Tour */}
      <AnimatePresence>
        {showTour && <OnboardingTour show={showTour} onClose={completeTour} />}
      </AnimatePresence>

      {/* Command Palette — Cmd+K */}
      <CommandPalette />

      {/* Manus Studio Execution HUD — Floating Activity & Task Loop */}
      <AgentFloatingHud />

      {/* CopilotKit-inspired In-App AI Copilot Sidebar & Trigger */}
      <HermesCopilotSidebar />

      {/* PWA: Service Worker registration + update toast */}
      <RegisterSW />
    </div>
  )
}
