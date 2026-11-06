'use client'

/**
 * OnboardingWizard — premium full-screen onboarding experience.
 *
 * 6 steps:
 *   1. Welcome (with branching question)
 *   2. Connect Shopee API (or enable demo mode)
 *   3. Pick Your Niche (multi-select up to 3)
 *   4. Generate First Link (interactive spotlight + confetti)
 *   5. Connect Social Accounts (optional)
 *   6. Personalized Dashboard summary
 *
 * Persists completion to localStorage:
 *   - tvf_onboarding_complete=true
 *   - tvf_onboarding_niches=JSON string[]
 *   - tvf_onboarding_demo_mode=true (if user skipped API)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Link2,
  Instagram,
  Youtube,
  KeyRound,
  AlertCircle,
  PartyPopper,
  Rocket,
  Copy,
  Wand2,
  TrendingUp,
} from 'lucide-react'

// ---------- localStorage keys ----------
const STORAGE_KEY = 'tvf_onboarding_complete'
const NICHES_KEY = 'tvf_onboarding_niches'
const DEMO_KEY = 'tvf_onboarding_demo_mode'
const OLD_TOUR_KEY = 'tvf_tour_seen' // legacy key from old OnboardingTour — respect it too

// ---------- static data ----------
const NICHES = [
  { id: 'electronics', label: 'Electronics', emoji: '📱', desc: 'Gadgets, audio, accessories' },
  { id: 'beauty', label: 'Beauty', emoji: '💄', desc: 'Skincare, makeup, fragrance' },
  { id: 'fashion', label: 'Fashion', emoji: '👗', desc: 'Apparel, tudung, shoes' },
  { id: 'home', label: 'Home & Living', emoji: '🏠', desc: 'Decor, kitchen, furniture' },
  { id: 'food', label: 'Food & Beverage', emoji: '🍜', desc: 'Snacks, supplements, drinks' },
  { id: 'baby', label: 'Baby & Kids', emoji: '👶', desc: 'Toys, diapers, kiddie care' },
  { id: 'sports', label: 'Sports & Fitness', emoji: '🏋️', desc: 'Gear, supplements, apparel' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮', desc: 'Consoles, accessories, merch' },
] as const

const STEP_LABELS = ['Welcome', 'Connect', 'Niches', 'First Link', 'Social', 'Done']
const TOTAL_STEPS = 6
const MAX_NICHES = 3

const API_STEPS = [
  {
    title: 'Go to Shopee Affiliate Dashboard',
    desc: 'Visit affiliate.shopee.com.my and sign in with your seller account.',
  },
  {
    title: 'Open "API Settings" in the menu',
    desc: 'Find this under the Developer section of your dashboard sidebar.',
  },
  {
    title: 'Generate your App ID & Secret Key',
    desc: 'Click "Create New App" — copy both credentials somewhere safe.',
  },
  {
    title: 'Paste them below',
    desc: 'Drop both values into the fields on the right, then test the connection.',
  },
] as const

const SOCIALS = [
  { id: 'tiktok', name: 'TikTok', desc: 'Short videos & lives', hint: 'shopee.co/tiktok' },
  { id: 'instagram', name: 'Instagram', desc: 'Reels & stories', hint: 'shopee.co/ig' },
  { id: 'youtube', name: 'YouTube', desc: 'Long-form & shorts', hint: 'shopee.co/yt' },
  { id: 'telegram', name: 'Telegram', desc: 'Channel broadcasts', hint: 'shopee.co/tg' },
] as const

// ---------- brand mascot (animated SVG owl in Shopee orange) ----------
function MascotOwl({ size = 140 }: { size?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label="TheViralFindsMY mascot owl">
        {/* outer glow */}
        <circle cx="70" cy="72" r="56" fill="var(--shopee)" opacity="0.12" />
        {/* ear tufts */}
        <path d="M 30 38 L 22 16 L 42 30 Z" fill="var(--shopee-dark)" />
        <path d="M 110 38 L 118 16 L 98 30 Z" fill="var(--shopee-dark)" />
        {/* body */}
        <ellipse cx="70" cy="78" rx="44" ry="46" fill="var(--shopee)" />
        {/* belly */}
        <ellipse cx="70" cy="88" rx="26" ry="30" fill="var(--shopee-light)" />
        {/* face mask */}
        <ellipse cx="70" cy="66" rx="36" ry="28" fill="var(--shopee-dark)" opacity="0.85" />
        {/* eyes - white */}
        <circle cx="56" cy="64" r="14" fill="white" />
        <circle cx="84" cy="64" r="14" fill="white" />
        {/* pupils */}
        <motion.g
          animate={{ y: [0, 1.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="58" cy="66" r="6" fill="#1a1a1a" />
          <circle cx="82" cy="66" r="6" fill="#1a1a1a" />
          {/* shines */}
          <circle cx="60.5" cy="63.5" r="2" fill="white" />
          <circle cx="84.5" cy="63.5" r="2" fill="white" />
        </motion.g>
        {/* beak */}
        <path d="M 70 74 L 62 84 L 78 84 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />
        {/* wings */}
        <path d="M 26 76 Q 18 100 32 116 L 42 92 Z" fill="var(--shopee-dark)" />
        <path d="M 114 76 Q 122 100 108 116 L 98 92 Z" fill="var(--shopee-dark)" />
        {/* feet */}
        <ellipse cx="56" cy="124" rx="8" ry="3.5" fill="#fbbf24" />
        <ellipse cx="84" cy="124" rx="8" ry="3.5" fill="#fbbf24" />
        {/* sparkle */}
        <motion.g
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M 110 30 L 113 36 L 119 39 L 113 42 L 110 48 L 107 42 L 101 39 L 107 36 Z" fill="#fbbf24" />
        </motion.g>
      </svg>
    </motion.div>
  )
}

// ---------- social brand icons (no blue) ----------
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.05z" />
    </svg>
  )
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21.94 4.6L18.6 20.3c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1 .5l.36-5.16 9.4-8.5c.4-.36-.09-.56-.63-.2L5.16 13.04.13 11.46c-1.1-.34-1.12-1.1.23-1.62L20.5 2.4c.92-.34 1.72.2 1.44 1.6z" />
    </svg>
  )
}

function SocialIcon({ id, className }: { id: string; className?: string }) {
  if (id === 'tiktok') return <TikTokIcon className={className} />
  if (id === 'instagram') return <Instagram className={className} />
  if (id === 'youtube') return <Youtube className={className} />
  if (id === 'telegram') return <TelegramIcon className={className} />
  return null
}

// ---------- progress dots ----------
function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const isCurrent = i === current
        const isDone = i < current
        return (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              animate={{
                width: isCurrent ? 32 : 8,
                backgroundColor: isCurrent
                  ? 'var(--shopee)'
                  : isDone
                    ? 'var(--shopee)'
                    : 'var(--muted-foreground)',
                opacity: isCurrent ? 1 : isDone ? 0.5 : 0.3,
              }}
              transition={{ duration: 0.25 }}
              className="h-2 rounded-full"
            />
            {i < TOTAL_STEPS - 1 && (
              <div
                className={cn(
                  'h-px w-3 transition-colors',
                  isDone ? 'bg-shopee/40' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------- step variants ----------
const stepVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 50 : -50,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -50 : 50,
  }),
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function OnboardingWizard() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  // step 1 state
  const [hasUsedShopee, setHasUsedShopee] = useState<boolean | null>(null)

  // step 2 state
  const [appId, setAppId] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success'>('idle')
  const [demoMode, setDemoMode] = useState(false)

  // step 3 state
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])

  // step 4 state
  const [linkGenerated, setLinkGenerated] = useState(false)
  const [mockLink, setMockLink] = useState('')

  // step 5 state
  const [connectedSocials, setConnectedSocials] = useState<string[]>([])

  const user = useAppStore((s) => s.user)
  const setShopeeConnected = useAppStore((s) => s.setShopeeConnected)
  const setShopeeDataSource = useAppStore((s) => s.setShopeeDataSource)

  const displayName = useMemo(() => {
    const name = user?.name?.trim()
    if (!name) return 'Affiliate'
    return name.split(' ')[0]
  }, [user?.name])

  // ---------- auto-open on first visit ----------
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Respect both legacy tour flag and new onboarding flag
    const done = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_TOUR_KEY)
    if (done) return
    const timer = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(timer)
  }, [])

  // ---------- completion handler ----------
  const completeWizard = useCallback(
    (skipped: boolean) => {
      try {
        localStorage.setItem(STORAGE_KEY, 'true')
        if (selectedNiches.length) {
          localStorage.setItem(NICHES_KEY, JSON.stringify(selectedNiches))
        }
        if (demoMode) {
          localStorage.setItem(DEMO_KEY, 'true')
          setShopeeDataSource('mock')
        } else if (connectionStatus === 'success') {
          setShopeeConnected(true)
          setShopeeDataSource('graphql_api')
        }
      } catch {
        // ignore storage errors
      }
      setOpen(false)
      if (skipped) {
        toast.info('Onboarding skipped', {
          description: 'You can complete it anytime from Settings.',
        })
      } else {
        // celebration confetti on real completion
        const colors = ['#ee4d2d', '#7c3aed', '#10b981', '#fbbf24']
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors,
        })
        toast.success(`Welcome aboard, ${displayName}! 🎉`, {
          description: 'Your dashboard is ready. Mari kita mula!',
        })
      }
    },
    [selectedNiches, demoMode, connectionStatus, displayName, setShopeeConnected, setShopeeDataSource]
  )

  // ---------- navigation ----------
  const handleNext = useCallback(() => {
    setDirection(1)
    // Branch on step 0: if user has used Shopee before, skip API step
    if (step === 0 && hasUsedShopee === true) {
      setStep(2)
      return
    }
    if (step === 5) {
      completeWizard(false)
      return
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [step, hasUsedShopee, completeWizard])

  const handleBack = useCallback(() => {
    setDirection(-1)
    if (step === 0) return
    // Branch back: from step 2 (API) to step 0 (Welcome) if user said Yes
    if (step === 2 && hasUsedShopee === true) {
      setStep(0)
      return
    }
    setStep((s) => Math.max(s - 1, 0))
  }, [step, hasUsedShopee])

  const handleSkip = useCallback(() => {
    completeWizard(true)
  }, [completeWizard])

  // Note: Radix Dialog handles Escape & backdrop-click by calling
  // onOpenChange(false) → handleSkip. No custom keydown listener needed.

  // ---------- confetti for first link ----------
  const fireConfetti = useCallback(() => {
    const colors = ['#ee4d2d', '#7c3aed', '#10b981', '#fbbf24']
    confetti({
      particleCount: 100,
      spread: 75,
      origin: { y: 0.65 },
      colors,
      scalar: 1.1,
    })
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
      })
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
      })
    }, 180)
  }, [])

  const handleGenerateLink = useCallback(() => {
    if (linkGenerated) return
    const link = `shopee.com.my/universal-link/tvf-${Math.random().toString(36).slice(2, 10)}`
    setMockLink(link)
    setLinkGenerated(true)
    fireConfetti()
    toast.success('You created your first affiliate link! 🎉', {
      description: 'Copy it and share anywhere — every click counts.',
    })
  }, [linkGenerated, fireConfetti])

  // ---------- api test mock ----------
  const handleTestConnection = useCallback(() => {
    if (!appId.trim() || !secretKey.trim()) {
      toast.error('Missing credentials', {
        description: 'Please enter both your App ID and Secret Key.',
      })
      return
    }
    if (appId.trim().length < 6 || secretKey.trim().length < 6) {
      toast.error('Invalid credentials', {
        description: 'App ID and Secret Key should each be at least 6 characters.',
      })
      return
    }
    setConnectionStatus('testing')
    setTimeout(() => {
      setConnectionStatus('success')
      toast.success('Connection successful!', {
        description: 'Your Shopee Affiliate API is now connected.',
      })
    }, 1800)
  }, [appId, secretKey])

  // ---------- niche toggle ----------
  const toggleNiche = useCallback((id: string) => {
    setSelectedNiches((prev) => {
      if (prev.includes(id)) {
        return prev.filter((n) => n !== id)
      }
      if (prev.length >= MAX_NICHES) {
        toast.warning(`You can pick up to ${MAX_NICHES} niches`, {
          description: 'Unselect one to add a different niche.',
        })
        return prev
      }
      return [...prev, id]
    })
  }, [])

  // ---------- social toggle (mock) ----------
  const toggleSocial = useCallback((id: string) => {
    setConnectedSocials((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id)
      const social = SOCIALS.find((s) => s.id === id)
      toast.success(`${social?.name} connected`, {
        description: 'Mock connection — real OAuth would happen here.',
      })
      return [...prev, id]
    })
  }, [])

  // ---------- step 0: can advance ----------
  const step0Valid = hasUsedShopee !== null
  // step 2: can advance if connection succeeded OR demo mode enabled
  const step2Valid = connectionStatus === 'success' || demoMode
  // step 3: at least 1 niche selected
  const step3Valid = selectedNiches.length > 0
  // step 4: must generate link (or just allow skip — task says "Continue" enabled after)
  const step4Valid = linkGenerated

  const canAdvance =
    step === 0 ? step0Valid :
    step === 2 ? step2Valid :
    step === 3 ? step3Valid :
    step === 4 ? step4Valid :
    true

  // ---------- open change handler (block backdrop click if invalid?) ----------
  // We'll allow backdrop click = skip (consistent with the previous OnboardingTour behavior).
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        handleSkip()
      } else {
        setOpen(true)
      }
    },
    [handleSkip]
  )

  // ---------- render ----------
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-md" />
        <DialogContent
          showCloseButton={false}
          className="
            w-screen h-[100dvh] max-w-none max-h-none
            rounded-none border-0 p-0
            flex flex-col gap-0
            bg-background
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
            duration-300
          "
        >
          {/* ===== Header: progress + skip ===== */}
          <header className="flex items-center justify-between gap-4 px-4 sm:px-8 lg:px-12 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-shopee flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground truncate">TheViralFindsMY</span>
                  <Badge variant="secondary" className="text-[10px] bg-hermes/10 text-hermes border-hermes/20 hidden sm:inline-flex">
                    ONBOARDING
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  Step {Math.min(step + 1, TOTAL_STEPS)} of {TOTAL_STEPS} · {STEP_LABELS[step]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressDots current={step} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <span className="hidden sm:inline">Skip</span>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* ===== Step content ===== */}
          <div className="flex-1 overflow-y-auto relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 overflow-y-auto"
              >
                <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
                  <div className="w-full max-w-3xl">
                    {step === 0 && (
                      <WelcomeStep
                        displayName={displayName}
                        hasUsedShopee={hasUsedShopee}
                        onSelect={(v) => setHasUsedShopee(v)}
                      />
                    )}
                    {step === 1 && (
                      <ConnectApiStep
                        appId={appId}
                        secretKey={secretKey}
                        showSecret={showSecret}
                        connectionStatus={connectionStatus}
                        demoMode={demoMode}
                        onAppIdChange={setAppId}
                        onSecretChange={setSecretKey}
                        onToggleShowSecret={() => setShowSecret((v) => !v)}
                        onTestConnection={handleTestConnection}
                        onEnableDemo={() => {
                          setDemoMode(true)
                          toast.info('Demo mode enabled', {
                            description: 'Explore the platform with sample Malaysian products.',
                          })
                        }}
                      />
                    )}
                    {step === 2 && (
                      <PickNicheStep
                        selectedNiches={selectedNiches}
                        onToggle={toggleNiche}
                      />
                    )}
                    {step === 3 && (
                      <GenerateLinkStep
                        linkGenerated={linkGenerated}
                        mockLink={mockLink}
                        onGenerate={handleGenerateLink}
                      />
                    )}
                    {step === 4 && (
                      <ConnectSocialStep
                        connectedSocials={connectedSocials}
                        onToggle={toggleSocial}
                      />
                    )}
                    {step === 5 && (
                      <PersonalizedDashboardStep
                        displayName={displayName}
                        selectedNiches={selectedNiches}
                        demoMode={demoMode}
                        connectedSocials={connectedSocials}
                        linkGenerated={linkGenerated}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ===== Footer: nav buttons ===== */}
          <footer className="border-t border-border bg-card/50 backdrop-blur-sm px-4 sm:px-8 lg:px-12 py-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={step === 0}
                className="gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {step === 4 && (
                  <span className="hidden sm:inline">Optional — skip if you prefer</span>
                )}
                {step === 2 && !step2Valid && (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Connect API or enable demo to continue
                  </span>
                )}
                {step === 3 && !step3Valid && (
                  <span className="text-muted-foreground">Pick at least 1 niche</span>
                )}
                {step === 4 && !step4Valid && (
                  <span className="text-muted-foreground">Generate your first link to continue</span>
                )}
              </div>

              {step < 5 ? (
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={!canAdvance}
                  className="bg-shopee hover:bg-shopee-dark text-white gap-1.5 min-w-[100px]"
                >
                  {step === 0 && hasUsedShopee === true ? 'Continue'
                    : step === 4 ? 'Continue'
                    : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => completeWizard(false)}
                  className="bg-shopee hover:bg-shopee-dark text-white gap-1.5 min-w-[140px]"
                >
                  <Rocket className="w-4 h-4" />
                  Enter Dashboard
                </Button>
              )}
            </div>
          </footer>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

// ============================================================
// STEP 1 — Welcome
// ============================================================
function WelcomeStep({
  displayName,
  hasUsedShopee,
  onSelect,
}: {
  displayName: string
  hasUsedShopee: boolean | null
  onSelect: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <MascotOwl size={140} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2"
      >
        <Badge variant="secondary" className="bg-shopee/10 text-shopee border-shopee/20 gap-1">
          <Sparkles className="w-3 h-3" />
          Selamat Datang
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
          Welcome to <span className="text-shopee">TheViralFindsMY</span>
          {displayName !== 'Affiliate' && (
            <>
              ,<br />
              <span className="text-shopee">{displayName}</span>
            </>
          )}
          !
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          The only AI-powered platform built exclusively for Malaysian Shopee affiliates.
          Let&apos;s get you set up in under 2 minutes — promise, confirm!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md space-y-3"
      >
        <p className="text-sm font-medium text-foreground">
          Have you used Shopee Affiliate before?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelect(true)}
            aria-pressed={hasUsedShopee === true}
            className={cn(
              'group relative p-4 rounded-xl border-2 transition-all text-left',
              hasUsedShopee === true
                ? 'border-shopee bg-shopee/5 shadow-md'
                : 'border-border bg-card hover:border-shopee/40 hover:bg-shopee/5'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className={cn(
                'w-4 h-4 transition-colors',
                hasUsedShopee === true ? 'text-shopee' : 'text-muted-foreground'
              )} />
              <span className="font-semibold text-sm text-foreground">Yes, I have</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Skip the API tutorial — jump straight to picking niches.
            </p>
          </button>
          <button
            type="button"
            onClick={() => onSelect(false)}
            aria-pressed={hasUsedShopee === false}
            className={cn(
              'group relative p-4 rounded-xl border-2 transition-all text-left',
              hasUsedShopee === false
                ? 'border-shopee bg-shopee/5 shadow-md'
                : 'border-border bg-card hover:border-shopee/40 hover:bg-shopee/5'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className={cn(
                'w-4 h-4 transition-colors',
                hasUsedShopee === false ? 'text-shopee' : 'text-muted-foreground'
              )} />
              <span className="font-semibold text-sm text-foreground">No, first time</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We&apos;ll guide you through connecting your Shopee API step by step.
            </p>
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground/80 pt-1">
          Tip: Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">Esc</kbd> anytime to skip onboarding.
        </p>
      </motion.div>
    </div>
  )
}

// ============================================================
// STEP 2 — Connect Shopee API
// ============================================================
function ConnectApiStep({
  appId,
  secretKey,
  showSecret,
  connectionStatus,
  demoMode,
  onAppIdChange,
  onSecretChange,
  onToggleShowSecret,
  onTestConnection,
  onEnableDemo,
}: {
  appId: string
  secretKey: string
  showSecret: boolean
  connectionStatus: 'idle' | 'testing' | 'success'
  demoMode: boolean
  onAppIdChange: (v: string) => void
  onSecretChange: (v: string) => void
  onToggleShowSecret: () => void
  onTestConnection: () => void
  onEnableDemo: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="bg-hermes/10 text-hermes border-hermes/20 gap-1">
          <KeyRound className="w-3 h-3" />
          Step 2 · API Setup
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Connect your <span className="text-shopee">Shopee API</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          This unlocks real product data, commission rates, and live earnings tracking.
          Follow the 4 steps below — should take about a minute.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Left: numbered instructions */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            How to get your credentials
          </h3>
          {API_STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card className="py-3 px-4 shadow-none bg-card/50">
                <CardContent className="p-0 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-shopee/10 text-shopee flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          <a
            href="https://affiliate.shopee.com.my"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-shopee hover:underline mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Open Shopee Affiliate Dashboard
          </a>
        </div>

        {/* Right: form */}
        <div className="space-y-4">
          <Card className={cn(
            'p-5 shadow-none transition-colors',
            demoMode ? 'bg-muted/30 border-dashed' : 'bg-card'
          )}>
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Your API credentials</h3>
                {connectionStatus === 'success' && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="appId" className="text-xs font-medium">
                  App ID
                </Label>
                <Input
                  id="appId"
                  type="text"
                  placeholder="e.g. 20240516SHOPEE..."
                  value={appId}
                  onChange={(e) => onAppIdChange(e.target.value)}
                  disabled={demoMode || connectionStatus === 'success'}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-xs font-medium">
                  Secret Key
                </Label>
                <div className="relative">
                  <Input
                    id="secretKey"
                    type={showSecret ? 'text' : 'password'}
                    placeholder="••••••••••••••••"
                    value={secretKey}
                    onChange={(e) => onSecretChange(e.target.value)}
                    disabled={demoMode || connectionStatus === 'success'}
                    className="font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={onToggleShowSecret}
                    aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="button"
                onClick={onTestConnection}
                disabled={demoMode || connectionStatus === 'testing' || connectionStatus === 'success'}
                className="w-full bg-shopee hover:bg-shopee-dark text-white gap-2"
              >
                {connectionStatus === 'testing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing connection...
                  </>
                ) : connectionStatus === 'success' ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Connection verified
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Demo mode fallback */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-dashed border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-[11px] text-muted-foreground uppercase tracking-wider">
                or
              </span>
            </div>
          </div>

          <Card className={cn(
            'p-4 shadow-none transition-colors cursor-pointer',
            demoMode
              ? 'bg-shopee/5 border-shopee border-2'
              : 'bg-card hover:border-shopee/40'
          )}
          onClick={() => !demoMode && onEnableDemo()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !demoMode) {
              e.preventDefault()
              onEnableDemo()
            }
          }}
        >
            <CardContent className="p-0 flex items-start gap-3">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                demoMode ? 'bg-shopee text-white' : 'bg-muted text-muted-foreground'
              )}>
                {demoMode ? <Check className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {demoMode ? 'Demo mode enabled' : 'I don\'t have API access yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Explore the platform with realistic Malaysian sample products.
                  You can connect your real API later in Settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// STEP 3 — Pick Your Niche
// ============================================================
function PickNicheStep({
  selectedNiches,
  onToggle,
}: {
  selectedNiches: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="bg-hermes/10 text-hermes border-hermes/20 gap-1">
          <TrendingUp className="w-3 h-3" />
          Step 3 · Personalize
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Pick your <span className="text-shopee">niches</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Choose up to {MAX_NICHES} areas you want to promote.
          We&apos;ll use these to recommend trending products and tailor HERMES AI insights.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selectedNiches.length === 0
            ? `Select up to ${MAX_NICHES} niches`
            : `${selectedNiches.length} of ${MAX_NICHES} selected`}
        </span>
        <Badge variant="secondary" className="bg-shopee/10 text-shopee border-shopee/20">
          {selectedNiches.length}/{MAX_NICHES}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {NICHES.map((niche, i) => {
          const isSelected = selectedNiches.includes(niche.id)
          return (
            <motion.button
              key={niche.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onToggle(niche.id)}
              aria-pressed={isSelected}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-shopee bg-shopee/5 shadow-md'
                  : 'border-border bg-card hover:border-shopee/40 hover:bg-shopee/5'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-shopee text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <div className="text-3xl mb-2">{niche.emoji}</div>
              <p className="text-sm font-semibold text-foreground">{niche.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {niche.desc}
              </p>
            </motion.button>
          )
        })}
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          You can change these anytime in Settings → Preferences
        </p>
      </div>
    </div>
  )
}

// ============================================================
// STEP 4 — Generate First Link (spotlight + confetti)
// ============================================================
function GenerateLinkStep({
  linkGenerated,
  mockLink,
  onGenerate,
}: {
  linkGenerated: boolean
  mockLink: string
  onGenerate: () => void
}) {
  const fullLink = mockLink ? `https://${mockLink}` : ''

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="bg-hermes/10 text-hermes border-hermes/20 gap-1">
          <Link2 className="w-3 h-3" />
          Step 4 · Your First Link
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Generate your <span className="text-shopee">first link</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {linkGenerated
            ? 'Boom! You just created your first affiliate link. Welcome to earnings mode.'
            : 'Click "Generate Link" below to create your first Shopee affiliate link. Try it — we\'ll celebrate! 🎉'}
        </p>
      </div>

      {/* Spotlight area */}
      <div className="relative flex items-center justify-center py-6">
        {/* spotlight gradient backdrop */}
        {!linkGenerated && (
          <motion.div
            aria-hidden
            animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--shopee-light)_0%,_transparent_60%)]"
          />
        )}

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative w-full max-w-md"
        >
          {!linkGenerated && (
            <>
              {/* pulsing ring */}
              <motion.div
                aria-hidden
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(238, 77, 45, 0.45)',
                    '0 0 0 14px rgba(238, 77, 45, 0)',
                  ],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
              />
              {/* pointing arrow / hint */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
              >
                <Badge variant="secondary" className="bg-shopee text-white border-0 shadow-lg gap-1 text-[11px]">
                  <ArrowRight className="w-3 h-3 rotate-90" />
                  Click here
                </Badge>
              </motion.div>
            </>
          )}

          <Card className={cn(
            'border-2 transition-colors',
            linkGenerated ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-shopee'
          )}>
            <CardContent className="p-5 space-y-4">
              {/* product mock */}
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-shopee-light to-shopee/30 flex items-center justify-center text-4xl flex-shrink-0">
                  🎧
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Sample product · Electronics
                  </p>
                  <h4 className="font-semibold text-sm text-foreground leading-snug mt-0.5">
                    Wireless Earbuds Pro X (Malay Edition)
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-bold text-shopee">RM 89.00</span>
                    <span className="text-xs text-muted-foreground line-through">RM 129.00</span>
                    <Badge variant="secondary" className="text-[10px] bg-profit/10 text-profit border-profit/20">
                      12% commission
                    </Badge>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    You earn RM 10.68 per sale
                  </p>
                </div>
              </div>

              {/* action / result */}
              {!linkGenerated ? (
                <Button
                  type="button"
                  onClick={onGenerate}
                  className="w-full bg-shopee hover:bg-shopee-dark text-white gap-2 h-11 text-sm font-semibold"
                  size="lg"
                >
                  <Link2 className="w-4 h-4" />
                  Generate Link
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                    <PartyPopper className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        You just created your first link!
                      </p>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-500/80">
                        Every click could mean real commission.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted border border-border">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <code className="flex-1 text-xs font-mono text-foreground truncate">
                      {fullLink}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        if (fullLink) {
                          navigator.clipboard?.writeText(fullLink).catch(() => {})
                          toast.success('Copied!', { description: 'Link copied to clipboard.' })
                        }
                      }}
                      aria-label="Copy link"
                      className="p-1 rounded text-muted-foreground hover:text-shopee hover:bg-shopee/5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          This is a sample — your real products will appear in the Products page.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// STEP 5 — Connect Social Accounts
// ============================================================
function ConnectSocialStep({
  connectedSocials,
  onToggle,
}: {
  connectedSocials: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="bg-hermes/10 text-hermes border-hermes/20 gap-1">
          <Sparkles className="w-3 h-3" />
          Step 5 · Optional
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Connect your <span className="text-shopee">social accounts</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Connect your platforms so HERMES AI can write captions in the right tone
          and auto-post when you&apos;re ready. Totally optional.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {SOCIALS.map((social, i) => {
          const isConnected = connectedSocials.includes(social.id)
          return (
            <motion.div
              key={social.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className={cn(
                'p-4 shadow-none transition-colors',
                isConnected ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/10' : 'bg-card hover:border-shopee/30'
              )}>
                <CardContent className="p-0 flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    isConnected
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-foreground'
                  )}>
                    {isConnected ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <SocialIcon id={social.id} className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{social.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{social.desc}</p>
                  </div>
                  <Button
                    type="button"
                    variant={isConnected ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => onToggle(social.id)}
                    className={cn(
                      isConnected
                        ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30'
                        : 'bg-shopee hover:bg-shopee-dark text-white'
                    )}
                  >
                    {isConnected ? 'Connected' : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          You can connect these later in Settings → Platforms. Real OAuth flow is mocked in this demo.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// STEP 6 — Personalized Dashboard
// ============================================================
function PersonalizedDashboardStep({
  displayName,
  selectedNiches,
  demoMode,
  connectedSocials,
  linkGenerated,
}: {
  displayName: string
  selectedNiches: string[]
  demoMode: boolean
  connectedSocials: string[]
  linkGenerated: boolean
}) {
  const completedItems = [
    { label: 'Welcome received', done: true },
    { label: demoMode ? 'Demo mode enabled' : 'Shopee API connected', done: true },
    { label: `${selectedNiches.length} niche${selectedNiches.length === 1 ? '' : 's'} selected`, done: selectedNiches.length > 0 },
    { label: 'First link generated', done: linkGenerated },
    { label: `${connectedSocials.length} social account${connectedSocials.length === 1 ? '' : 's'} connected`, done: connectedSocials.length > 0 },
  ]

  const selectedNicheLabels = selectedNiches
    .map((id) => NICHES.find((n) => n.id === id))
    .filter(Boolean)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="flex justify-center"
      >
        <MascotOwl size={100} />
      </motion.div>

      <div className="text-center space-y-2">
        <Badge variant="secondary" className="bg-shopee/10 text-shopee border-shopee/20 gap-1">
          <PartyPopper className="w-3 h-3" />
          All Set!
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          You&apos;re all set, <span className="text-shopee">{displayName}</span>! 🎉
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Your dashboard is personalized and ready. Mari kita mula — let&apos;s make some Ringgit together.
        </p>
      </div>

      <Card className="p-5 shadow-none bg-card/50">
        <CardContent className="p-0 space-y-4">
          {/* Completed checklist */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Setup summary
            </h3>
            <div className="space-y-2">
              {completedItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-center gap-2.5"
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                    item.done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {item.done ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                  <span className={cn(
                    'text-sm',
                    item.done ? 'text-foreground' : 'text-muted-foreground line-through'
                  )}>
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Selected niches */}
          {selectedNicheLabels.length > 0 && (
            <div className="pt-3 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Your niches
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedNicheLabels.map((n) => (
                  <Badge
                    key={n!.id}
                    variant="secondary"
                    className="bg-shopee/10 text-shopee border-shopee/20 gap-1.5 py-1.5"
                  >
                    <span className="text-base">{n!.emoji}</span>
                    {n!.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* What's next preview */}
          <div className="pt-3 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              What&apos;s next?
            </h3>
            <ul className="space-y-1.5 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-shopee mt-0.5 flex-shrink-0" />
                <span>Browse trending products in <strong>Products</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-shopee mt-0.5 flex-shrink-0" />
                <span>Ask <strong>HERMES AI</strong> for content ideas</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-shopee mt-0.5 flex-shrink-0" />
                <span>Track clicks & commissions in <strong>Analytics</strong></span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OnboardingWizard
