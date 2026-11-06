'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Bot, Sparkles, Zap, Link2, BarChart3, Target, Search,
  Smartphone, ChevronDown, Check, Star, ArrowRight, Menu, X,
  Shield, Globe, Cpu, Lock, Github, MapPin, ChevronLeft, ChevronRight,
  Play, TrendingUp, CircleDollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/app-store'

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

const slideFromLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

const slideFromRight = {
  hidden: { opacity: 0, x: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

/* ============================================================
   SECTION WRAPPER — Scroll-triggered animation
   ============================================================ */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/* ============================================================
   COUNTER ANIMATION HOOK
   ============================================================ */
function useCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true
    const startTime = performance.now()
    const startValue = 0

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(startValue + (target - startValue) * eased))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, target, duration])

  return { count, ref }
}

/* ============================================================
   1. NAVBAR
   ============================================================ */
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { setAuthView } = useAppStore()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { label: 'Platform', href: '#features' },
    { label: 'AI', href: '#ai-powered' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Trust', href: '#trust-signals' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b-2 border-border shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-shopee flex items-center justify-center overflow-hidden border-2 border-shopee">
              <img src="/apple-touch-icon.png" alt="TVF" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-foreground text-sm tracking-tight leading-none">THEVIRALFINDS</span>
              <span className="text-[10px] font-bold text-lime tracking-widest">AFFILIATE MANAGER</span>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-shopee transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuthView('login')}
              className="text-muted-foreground hover:text-shopee"
            >
              Log In
            </Button>
            <Button
              size="sm"
              onClick={() => setAuthView('register')}
              className="bg-shopee hover:bg-shopee-dark text-white border-2 border-shopee rounded shadow-[4px_4px_0_0_var(--color-lime)] hover:shadow-[2px_2px_0_0_var(--color-lime)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
            >
              Start Free
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b-2 border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 px-3 text-sm font-medium text-muted-foreground hover:text-shopee hover:bg-muted rounded transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Separator className="my-2" />
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAuthView('login'); setMobileOpen(false) }}
                  className="w-full border-2"
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setAuthView('register'); setMobileOpen(false) }}
                  className="w-full bg-shopee hover:bg-shopee-dark text-white border-2 border-shopee shadow-[4px_4px_0_0_var(--color-lime)] font-bold"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ============================================================
   2. HERO SECTION — CINEMATIC (WishLabs-inspired)
   ============================================================ */
const HERO_ROTATING_PHRASES = [
  'Powered by Shopee Affiliate API.',
  'Built for the Malaysian market.',
  'No fake gurus. Real data only.',
]

function HeroSection() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const words = 'Turn Shopee Clicks into Real RM'.split(' ')

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % HERO_ROTATING_PHRASES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Section className="relative min-h-screen flex items-center pt-20 lg:pt-24 pb-16 overflow-hidden" id="hero">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-shopee/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-lime/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hermes/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Film grain texture */}
      <div className="absolute inset-0 -z-10 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        {/* Staggered word animation headline */}
        <motion.div className="mb-6">
          <Badge className="bg-lime/15 text-lime-dark border-2 border-lime/40 rounded-none font-bold text-xs tracking-wider px-4 py-1.5 mb-8 inline-flex">
            <Sparkles className="w-3 h-3 mr-1.5" />
            AI-POWERED AFFILIATE PLATFORM
          </Badge>
        </motion.div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-foreground leading-[0.95] mb-8">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
              className="inline-block mr-[0.3em]"
            >
              {word === 'Shopee' ? (
                <span className="text-shopee">{word}</span>
              ) : word === 'RM' ? (
                <span className="text-lime">{word}</span>
              ) : word === 'Clicks' ? (
                <span className="relative inline-block">
                  <span className="relative z-10">{word}</span>
                  <motion.span
                    className="absolute bottom-1 left-0 h-3 bg-lime/40 -z-0"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 1.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                  />
                </span>
              ) : (
                word
              )}
            </motion.span>
          ))}
        </h1>

        {/* Animated text rotation */}
        <div className="h-8 mb-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-lg sm:text-xl text-muted-foreground"
            >
              {HERO_ROTATING_PHRASES[phraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Two CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <Button
            size="lg"
            onClick={() => useAppStore.getState().setAuthView('register')}
            className="bg-shopee hover:bg-shopee-dark text-white border-2 border-shopee rounded shadow-[4px_4px_0_0_var(--color-lime)] hover:shadow-[2px_2px_0_0_var(--color-lime)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-base px-8 py-6 font-bold"
          >
            Start Free — No Card Needed
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-border rounded shadow-[3px_3px_0_0_var(--color-border)] hover:shadow-[1px_1px_0_0_var(--color-border)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-base px-8 py-6"
            onClick={() => {
              const el = document.getElementById('features')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <Play className="w-4 h-4 mr-2" />
            See How It Works
          </Button>
        </motion.div>

        {/* Trust badges row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-profit" /> Free forever plan</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-profit" /> No credit card</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-profit" /> Setup in 2 minutes</span>
        </motion.div>
      </div>
    </Section>
  )
}

/* ============================================================
   3. STATS SECTION — "ONLY THE REAL NUMBERS HERE"
   ============================================================ */
const STATS_DATA = [
  { value: 500, suffix: 'K+', label: 'Shopee Affiliates in Malaysia', prefix: '' },
  { value: 2, suffix: 'B+', label: 'Commissions Paid by Shopee', prefix: 'RM ' },
  { value: 1, suffix: '', label: 'E-Commerce Platform in SEA', prefix: '#' },
]

function StatsSection() {
  const counter0 = useCounter(500, 2000)
  const counter1 = useCounter(2, 1500)
  const counter2 = useCounter(1, 1000)
  const counters = [counter0, counter1, counter2]

  return (
    <Section className="py-20 lg:py-28 bg-muted/30" id="stats">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            Only the real numbers
            <span className="text-shopee"> here.</span>
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
          {STATS_DATA.map((stat, i) => (
            <motion.div key={i} variants={staggerItem} ref={counters[i].ref}>
              <Card className="border-2 border-border rounded-lg shadow-[3px_3px_0_0_var(--color-border)] text-center group hover:shadow-[5px_5px_0_0_var(--color-shopee)] hover:border-shopee/40 transition-all">
                <CardContent className="p-6 lg:p-8">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground">
                    {stat.prefix}{counters[i].count}{stat.suffix}
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="text-center">
          <p className="text-lg font-bold text-foreground mb-2">
            We don&apos;t follow trends. We build AI that makes Malaysian affiliates <span className="text-shopee">the trend.</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Source: Shopee Annual Report, data.ai
          </p>
        </motion.div>
      </div>
    </Section>
  )
}

/* ============================================================
   4. "IT'S AI-POWERED" — Feature Showcase
   ============================================================ */
const AI_FEATURES = [
  {
    icon: Bot,
    title: 'HERMES AI Agent',
    desc: 'Your personal AI assistant with Manglish personality, skills, memory, and automation. The most advanced affiliate AI in Malaysia.',
    color: 'text-hermes',
    bg: 'bg-hermes/10',
    border: 'border-hermes/30',
    tall: true,
  },
  {
    icon: Sparkles,
    title: 'AI Content Generator',
    desc: 'Generate Manglish, BM, and English captions, scripts, and hashtags in seconds.',
    color: 'text-shopee',
    bg: 'bg-shopee/10',
    border: 'border-shopee/30',
    tall: false,
  },
  {
    icon: Zap,
    title: 'Social Auto-Post',
    desc: 'Schedule posts to TikTok, IG, FB, YouTube, Twitter/X — optimized for Malaysian peak times.',
    color: 'text-lime-dark',
    bg: 'bg-lime/10',
    border: 'border-lime/30',
    tall: false,
  },
]

function AIPoweredSection() {
  return (
    <Section className="py-20 lg:py-28" id="ai-powered">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <Badge className="bg-lime/15 text-lime-dark border-2 border-lime/40 rounded-none font-bold text-xs tracking-wider px-4 py-1.5 mb-4">
            AI-POWERED PLATFORM
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            Building category-defining tools,
            <br className="hidden sm:block" />
            <span className="text-shopee"> one after another.</span>
          </h2>
        </motion.div>

        {/* Asymmetric card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-6">
          {AI_FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              variants={slideFromLeft}
              custom={i}
              className={feature.tall ? 'lg:row-span-2' : ''}
            >
              <Card className={`h-full border-2 ${feature.border} rounded-lg shadow-[4px_4px_0_0_var(--color-border)] hover:shadow-[5px_5px_0_0_var(--color-shopee)] hover:border-shopee/40 transition-all duration-300 group`}>
                <CardContent className={`p-6 lg:p-8 flex flex-col h-full ${feature.tall ? 'lg:justify-center' : ''}`}>
                  <div className={`w-14 h-14 rounded-lg ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="font-black text-foreground text-xl lg:text-2xl mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed flex-1 text-sm lg:text-base">{feature.desc}</p>
                  <div className="mt-6">
                    <a
                      href="#features"
                      className={`inline-flex items-center gap-1.5 text-sm font-bold ${feature.color} hover:gap-3 transition-all`}
                    >
                      Explore <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ============================================================
   5. DUAL MOAT SECTION
   ============================================================ */
const MOAT_ITEMS = {
  ai: {
    title: 'We build the AI.',
    desc: 'Proprietary profit scoring, Commission XTRA detection, and Manglish content generation. Our AI models are trained specifically for the Malaysian market.',
    items: [
      { icon: Target, text: 'Profit Score 0-100 algorithm' },
      { icon: Sparkles, text: 'Manglish/BM/English content AI' },
      { icon: CircleDollarSign, text: 'Commission XTRA auto-detection' },
    ],
  },
  integration: {
    title: 'And the Shopee integration.',
    desc: 'Direct Shopee Affiliate API integration with real-time commission tracking, product search, and link generation. Plus TikTok Shop and Lazada support.',
    items: [
      { icon: Link2, text: 'Shopee Affiliate API integration' },
      { icon: Smartphone, text: 'Multi-platform: TikTok Shop + Lazada' },
      { icon: BarChart3, text: 'Real-time earnings dashboard' },
    ],
  },
}

function DualMoatSection() {
  return (
    <Section className="py-20 lg:py-28 bg-muted/30" id="dual-moat">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            Top earnings don&apos;t happen
            <span className="text-shopee"> by accident.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(['ai', 'integration'] as const).map((key, colIndex) => {
            const moat = MOAT_ITEMS[key]
            return (
              <motion.div
                key={key}
                variants={colIndex === 0 ? slideFromLeft : slideFromRight}
                custom={0}
              >
                <Card className="h-full border-2 border-border rounded-lg shadow-[3px_3px_0_0_var(--color-border)] hover:shadow-[5px_5px_0_0_var(--color-shopee)] transition-all duration-300">
                  <CardContent className="p-6 lg:p-8">
                    <h3 className="text-2xl lg:text-3xl font-black text-foreground mb-4">
                      {moat.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6 text-sm lg:text-base">
                      {moat.desc}
                    </p>
                    <div className="space-y-4">
                      {moat.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-shopee/10 flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-5 h-5 text-shopee" />
                          </div>
                          <span className="text-foreground font-medium text-sm lg:text-base pt-2">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

/* ============================================================
   6. BEFORE/AFTER PROOF SECTION
   ============================================================ */
const BEFORE_ITEMS = [
  'Spending hours finding products manually',
  'Writing captions one by one',
  'Posting to each platform separately',
  'Guessing which products earn most',
  'Earnings: RM 200-500/month',
]

const AFTER_ITEMS = [
  'AI finds trending products in seconds',
  'Generate Manglish content instantly',
  'Auto-post to 5+ platforms at once',
  'Profit Score tells you exactly what sells',
  'Earnings: RM 2,000-5,000+/month',
]

function BeforeAfterSection() {
  return (
    <Section className="py-20 lg:py-28" id="before-after">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            See the <span className="text-shopee">transformation.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            From manual affiliate work to AI-powered earnings.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Before card */}
          <motion.div variants={slideFromLeft} custom={0}>
            <Card className="h-full border-2 border-destructive/40 rounded-lg shadow-[3px_3px_0_0_var(--color-destructive)] bg-destructive/5">
              <CardContent className="p-6 lg:p-8">
                <Badge className="bg-destructive/10 text-destructive border-destructive/30 rounded-none font-bold text-xs tracking-wider px-4 py-1.5 mb-6">
                  BEFORE TVF
                </Badge>
                <ul className="space-y-4">
                  {BEFORE_ITEMS.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-destructive font-bold text-lg leading-none mt-0.5">✕</span>
                      <span className="text-muted-foreground text-sm lg:text-base">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* After card */}
          <motion.div variants={slideFromRight} custom={0}>
            <Card className="h-full border-2 border-profit/40 rounded-lg shadow-[4px_4px_0_0_var(--color-lime)] bg-profit/5">
              <CardContent className="p-6 lg:p-8">
                <Badge className="bg-profit/10 text-profit border-profit/30 rounded-none font-bold text-xs tracking-wider px-4 py-1.5 mb-6">
                  AFTER TVF
                </Badge>
                <ul className="space-y-4">
                  {AFTER_ITEMS.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-profit font-bold text-lg leading-none mt-0.5">✓</span>
                      <span className="text-foreground font-medium text-sm lg:text-base">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

/* ============================================================
   7. FEATURE CAROUSEL — "We build tools affiliates actually use."
   ============================================================ */
const FEATURE_CARDS = [
  {
    icon: Link2,
    title: 'Smart Link Manager',
    desc: 'Create, track, A/B test affiliate links',
    badge: '10K+ links created',
    color: 'text-shopee',
    bg: 'bg-shopee/10',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    desc: 'Clicks, conversions, earnings with period comparison',
    badge: 'Live data',
    color: 'text-hermes',
    bg: 'bg-hermes/10',
  },
  {
    icon: Target,
    title: 'Profit Optimizer',
    desc: '0-100 product scoring algorithm',
    badge: 'AI-powered',
    color: 'text-profit',
    bg: 'bg-profit/10',
  },
  {
    icon: Search,
    title: 'Product Discovery',
    desc: 'AI-powered search with Commission XTRA',
    badge: '22M+ products',
    color: 'text-lime-dark',
    bg: 'bg-lime/10',
  },
  {
    icon: Smartphone,
    title: 'Multi-Platform',
    desc: 'Shopee + TikTok Shop + Lazada',
    badge: '3 platforms',
    color: 'text-shopee',
    bg: 'bg-shopee/10',
  },
  {
    icon: Bot,
    title: 'HERMES AI',
    desc: 'Personal AI assistant with Manglish personality',
    badge: 'Most popular',
    color: 'text-hermes',
    bg: 'bg-hermes/10',
  },
]

function FeatureCarouselSection() {
  return (
    <Section className="py-20 lg:py-28 bg-muted/30" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            We build tools affiliates
            <span className="text-shopee"> actually use.</span>
          </h2>
        </motion.div>

        {/* Mobile: horizontal scroll / Desktop: 3x2 grid */}
        <div className="flex lg:grid lg:grid-cols-3 gap-5 overflow-x-auto snap-x snap-mandatory pb-4 lg:pb-0 no-scrollbar-mobile -mx-4 px-4 lg:mx-0 lg:px-0">
          {FEATURE_CARDS.map((feature, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="min-w-[280px] lg:min-w-0 snap-start"
            >
              <Card className="h-full border-2 border-border rounded-lg shadow-[3px_3px_0_0_var(--color-border)] hover:shadow-[5px_5px_0_0_var(--color-shopee)] hover:border-shopee/40 transition-all duration-300 group">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{feature.desc}</p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Badge className={`${feature.bg} ${feature.color} border-0 rounded-none text-[10px] font-bold tracking-wider`}>
                      {feature.badge}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ============================================================
   8. TESTIMONIALS — Story-Driven
   ============================================================ */
const TESTIMONIALS = [
  {
    quote: 'I found 23 high-margin products in my first week using the Profit Score. My conversion rate went from 2% to 7%.',
    name: 'Aisyah R.',
    role: 'Part-time Affiliate',
    rating: 5,
  },
  {
    quote: 'HERMES generates my Manglish captions and schedules all my posts. I publish 5x more content now with half the effort.',
    name: 'Kumar S.',
    role: 'Content Creator',
    rating: 5,
  },
  {
    quote: 'From RM 800 to RM 5,200 in 4 months. The Commission XTRA alerts alone paid for my Pro subscription 10x over.',
    name: 'Farah M.',
    role: 'Full-time Affiliate',
    rating: 5,
  },
  {
    quote: 'I tracked my earnings across Shopee, TikTok Shop, and Lazada in one dashboard. No more spreadsheet nightmares.',
    name: 'Hafiz Z.',
    role: 'Multi-platform Seller',
    rating: 5,
  },
]

function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((index: number) => {
    setCurrent(index)
  }, [])

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % TESTIMONIALS.length)
  }, [])

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  }, [])

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(goNext, 6000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, goNext])

  return (
    <Section className="py-20 lg:py-28" id="testimonials">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            What our affiliates
            <span className="text-shopee"> are saying</span>
          </h2>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <Card className="border-2 border-border rounded-lg shadow-[4px_4px_0_0_var(--color-border)]">
            <CardContent className="p-8 lg:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                >
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-6">
                    {Array.from({ length: TESTIMONIALS[current].rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-lime text-lime" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-xl lg:text-2xl font-bold text-foreground leading-relaxed mb-8">
                    &ldquo;{TESTIMONIALS[current].quote}&rdquo;
                  </blockquote>

                  {/* Attribution */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-shopee/10 flex items-center justify-center border-2 border-shopee/30">
                      <span className="font-black text-shopee text-lg">
                        {TESTIMONIALS[current].name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{TESTIMONIALS[current].name}</p>
                      <p className="text-sm text-muted-foreground">{TESTIMONIALS[current].role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === current ? 'bg-shopee w-8' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goPrev}
                className="h-10 w-10 border-2 border-border rounded shadow-[2px_2px_0_0_var(--color-border)] hover:shadow-[1px_1px_0_0_var(--color-border)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goNext}
                className="h-10 w-10 border-2 border-border rounded shadow-[2px_2px_0_0_var(--color-border)] hover:shadow-[1px_1px_0_0_var(--color-border)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  )
}

/* ============================================================
   9. TRUST SIGNALS SECTION
   ============================================================ */
const TRUST_SIGNALS = [
  {
    icon: Shield,
    title: 'Shopee API Integration',
    desc: 'Direct integration with Shopee Affiliate API for real-time commission tracking.',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    desc: 'Your data and credentials are encrypted at rest and in transit.',
  },
  {
    icon: MapPin,
    title: 'Built for Malaysian Market',
    desc: 'Manglish, BM, local peak times, and Malaysian Ringgit — built for you.',
  },
  {
    icon: Github,
    title: 'Open Source on GitHub',
    desc: 'Transparent codebase. Audit our security, contribute, or self-host.',
  },
]

function TrustSignalsSection() {
  return (
    <Section className="py-20 lg:py-28 bg-muted/30" id="trust-signals">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <Badge className="bg-shopee/10 text-shopee border-shopee/30 rounded-none font-bold text-xs tracking-wider px-4 py-1.5 mb-4">
            TRUST & SECURITY
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            Built on <span className="text-shopee">trust</span>,
            secured by <span className="text-lime">design</span>.
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_SIGNALS.map((signal, i) => (
            <motion.div key={i} variants={staggerItem}>
              <Card className="h-full border-2 border-border rounded-lg shadow-[3px_3px_0_0_var(--color-border)] hover:shadow-[5px_5px_0_0_var(--color-shopee)] hover:border-shopee/40 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-lg bg-shopee/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <signal.icon className="w-7 h-7 text-shopee" />
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-2">{signal.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{signal.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

/* ============================================================
   10. PRICING SECTION
   ============================================================ */
const PLANS = [
  {
    name: 'Free',
    price: 'RM 0',
    period: '/month',
    desc: 'Perfect for getting started',
    features: [
      '50 products tracked',
      '20 affiliate links',
      '5 AI content generations',
      '1 platform (Shopee)',
      'Basic analytics',
      'Community support',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: 'RM 49',
    period: '/month',
    desc: 'Perfect for growing affiliates',
    features: [
      '500 products tracked',
      '200 affiliate links',
      '50 AI content generations',
      'All platforms',
      'Advanced analytics + trends',
      'HERMES AI assistant',
      'Social auto-post (3 accounts)',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Business',
    price: 'RM 149',
    period: '/month',
    desc: 'Perfect for scaling teams',
    features: [
      'Unlimited everything',
      'A/B testing',
      'Audience AI insights',
      '3 team members',
      'API access',
      'Custom content calendar',
      'White-label ready',
      'Dedicated support',
    ],
    cta: 'Start Business Trial',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Perfect for large operations',
    features: [
      'Everything in Business',
      'Unlimited team members',
      'White-label deployment',
      'Custom AI training',
      'SLA guarantee',
      'Dedicated account manager',
      'On-premise option',
      '24/7 priority support',
    ],
    cta: 'Contact Us',
    popular: false,
  },
]

function PricingSection() {
  const [yearly, setYearly] = useState(false)

  return (
    <Section className="py-20 lg:py-28" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <Badge className="bg-lime/15 text-lime-dark border-2 border-lime/40 rounded-none font-bold text-xs tracking-wider px-4 py-1.5 mb-4">
            PRICING
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            Simple, Transparent
            <span className="text-shopee"> Pricing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you&apos;re ready. No hidden fees, no surprises.
          </p>

          {/* Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-14 h-7 rounded-full border-2 transition-colors ${
                yearly ? 'bg-shopee border-shopee' : 'bg-muted border-border'
              }`}
              aria-label="Toggle yearly pricing"
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ left: yearly ? 'calc(100% - 22px)' : '3px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium ${yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly <Badge className="bg-profit/10 text-profit border-profit/30 rounded-none text-[10px] font-bold ml-1">-20%</Badge>
            </span>
          </div>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => (
            <motion.div key={i} variants={staggerItem} className="relative">
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-shopee text-white border-shopee rounded-none font-bold text-[10px] tracking-wider px-3 py-1 shadow-lg">
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              <Card className={`h-full border-2 rounded-lg transition-all duration-300 ${
                plan.popular
                  ? 'border-shopee shadow-[5px_5px_0_0_var(--color-lime)] scale-[1.02]'
                  : 'border-border shadow-[3px_3px_0_0_var(--color-border)] hover:shadow-[5px_5px_0_0_var(--color-shopee)] hover:border-shopee/40'
              }`}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className="font-black text-foreground text-lg">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black text-foreground">
                        {plan.price === 'Custom' ? 'Custom' : yearly && plan.price !== 'RM 0' ? `RM ${Math.round(parseInt(plan.price.replace('RM ', '')) * 0.8)}` : plan.price}
                      </span>
                      {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                  </div>

                  <Separator className="mb-4" />

                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-profit flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full mt-6 border-2 rounded font-bold ${
                      plan.popular
                        ? 'bg-shopee hover:bg-shopee-dark text-white border-shopee shadow-[3px_3px_0_0_var(--color-lime)] hover:shadow-[1px_1px_0_0_var(--color-lime)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all'
                        : 'bg-card hover:bg-shopee hover:text-white text-foreground border-border hover:border-shopee shadow-[3px_3px_0_0_var(--color-border)] hover:shadow-[3px_3px_0_0_var(--color-lime)] transition-all'
                    }`}
                    onClick={() => useAppStore.getState().setAuthView(plan.name === 'Enterprise' ? 'login' : 'register')}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

/* ============================================================
   11. FAQ SECTION
   ============================================================ */
const FAQS = [
  {
    q: 'How can TheViralFindsMY help me earn more from Shopee Affiliate?',
    a: 'We provide AI-powered product discovery with profit scoring, automatic Commission XTRA detection, content generation in Manglish/BM/English, social media auto-posting, and HERMES AI assistant — everything you need to maximize earnings in one dashboard.',
  },
  {
    q: 'Is it difficult to connect my Shopee Affiliate account?',
    a: "Not at all! Just enter your Shopee Affiliate credentials in Settings, and you're connected. Our platform integrates directly with Shopee's Affiliate API for real-time commission tracking and product data.",
  },
  {
    q: 'What platforms are supported besides Shopee?',
    a: 'We support Shopee (primary), TikTok Shop, and Lazada — all in one dashboard. You can compare commissions across platforms, match the same product on different stores, and track unified earnings.',
  },
  {
    q: 'How does HERMES AI work?',
    a: 'HERMES is your personal AI assistant built specifically for Malaysian affiliates. It remembers your preferences, suggests products, generates content, automates posting, and provides weekly earnings insights — all with a Manglish personality that understands the local market.',
  },
  {
    q: 'Can I try it for free?',
    a: 'Absolutely! Our Free plan includes 50 products, 20 affiliate links, 5 AI content generations, and basic analytics — forever, no credit card required. Upgrade to Pro when you need more power.',
  },
  {
    q: 'Is my data secure?',
    a: "Yes. We use industry-standard encryption, secure API handling, and never share your data with third parties. Your Shopee credentials are encrypted and stored securely. We're built on Next.js with enterprise-grade security practices.",
  },
]

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Section className="py-20 lg:py-28 bg-muted/30" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <Badge className="bg-shopee/10 text-shopee border-shopee/30 rounded-none font-bold text-xs tracking-wider px-4 py-1.5 mb-4">
            FAQ
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            Frequently Asked
            <span className="text-shopee"> Questions</span>
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div key={i} variants={staggerItem}>
              <Card className="border-2 border-border rounded-lg overflow-hidden hover:border-shopee/40 transition-colors">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4"
                  aria-expanded={openIndex === i}
                >
                  <span className="font-bold text-foreground text-sm pr-4">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-shopee" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                    >
                      <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

/* ============================================================
   12. CTA SECTION
   ============================================================ */
function CTASection() {
  return (
    <Section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-shopee" />
      <div className="absolute inset-0 -z-10 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-lime/20 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div variants={fadeUp}>
          <Badge className="bg-white/10 text-white border-white/20 rounded-none font-bold text-xs tracking-wider px-4 py-1.5 mb-6">
            GET STARTED TODAY
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Ready to Turn Shopee Clicks
            <br />
            into Real <span className="text-lime">RM</span>?
          </h2>
          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
            Let AI handle the hard work while you focus on growing your affiliate income. Start your free account today — no credit card needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => useAppStore.getState().setAuthView('register')}
              className="bg-white text-shopee hover:bg-lime hover:text-shopee-dark border-2 border-white rounded shadow-[4px_4px_0_0_rgba(204,255,0,0.5)] hover:shadow-[2px_2px_0_0_rgba(204,255,0,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-base px-8 py-6 font-bold"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => useAppStore.getState().setAuthView('login')}
              className="border-2 border-white/30 text-white hover:bg-white/10 rounded text-base px-8 py-6"
            >
              Already have an account? Log In
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-lime" /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-lime" /> Setup in 2 minutes</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-lime" /> No credit card</span>
          </div>
        </motion.div>
      </div>
    </Section>
  )
}

/* ============================================================
   13. FOOTER
   ============================================================ */
function LandingFooter() {
  return (
    <footer className="bg-foreground text-background py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded bg-shopee flex items-center justify-center overflow-hidden border-2 border-shopee">
                <img src="/apple-touch-icon.png" alt="TVF" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-black text-background text-sm leading-none block">THEVIRALFINDS</span>
                <span className="text-[9px] font-bold text-lime tracking-widest">AFFILIATE MANAGER</span>
              </div>
            </div>
            <p className="text-sm text-background/60 leading-relaxed mb-4">
              AI-powered affiliate earnings.
            </p>
            <Badge className="bg-shopee/20 text-white border-shopee/40 rounded-none text-[10px] font-mono gap-1">
              <MapPin className="w-3 h-3" />
              Built in Malaysia 🇲🇾
            </Badge>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-bold text-sm text-background mb-4">Features</h4>
            <ul className="space-y-2">
              {['Product Discovery', 'AI Content', 'Auto-Post', 'Profit Optimizer', 'HERMES AI', 'Analytics'].map((item) => (
                <li key={item}>
                  <a href="#features" className="text-sm text-background/60 hover:text-lime transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-sm text-background mb-4">Company</h4>
            <ul className="space-y-2">
              {['About Us', 'Blog', 'Careers', 'Contact', 'Partners'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-background/60 hover:text-lime transition-colors cursor-pointer">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-sm text-background mb-4">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-background/60 hover:text-lime transition-colors cursor-pointer">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-background/10 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/50">
            &copy; {new Date().getFullYear()} TheViralFindsMY — Built with care for Malaysian Affiliates
          </p>
          <div className="flex items-center gap-3">
            <Badge className="bg-shopee/20 text-white border-shopee/40 rounded-none text-[10px] font-mono">v8.1</Badge>
            <Badge className="bg-lime/20 text-lime border-lime/40 rounded-none text-[10px] font-mono">BRUTAL</Badge>
            <Badge className="bg-hermes/20 text-hermes border-hermes/40 rounded-none text-[10px] font-mono">HERMES</Badge>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ============================================================
   MAIN LANDING PAGE
   ============================================================ */
export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <AIPoweredSection />
        <DualMoatSection />
        <BeforeAfterSection />
        <FeatureCarouselSection />
        <TestimonialsSection />
        <TrustSignalsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
