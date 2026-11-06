'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Bot,
  BarChart3,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Trend Spy',
    desc: 'Discover viral Malaysian products',
    color: 'text-amber-500',
  },
  {
    icon: Bot,
    title: 'HERMES AI',
    desc: 'AI-powered affiliate insights',
    color: 'text-hermes',
  },
  {
    icon: BarChart3,
    title: 'Real Analytics',
    desc: 'Track clicks, conversions, earnings',
    color: 'text-emerald-500',
  },
  {
    icon: Sparkles,
    title: 'AI Content',
    desc: 'Manglish & BM captions in seconds',
    color: 'text-violet-500',
  },
]

export function LoginPage() {
  const { login, loginWithProvider, setAuthView, quickDemoLogin } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasGoogle, setHasGoogle] = useState(false)
  const [hasFacebook, setHasFacebook] = useState(false)

  useEffect(() => {
    // Detect which OAuth providers are configured by probing the NextAuth providers endpoint
    fetch('/api/auth/providers')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        const ids = Array.isArray(data) ? data.map((p: { id: string }) => p.id) : []
        setHasGoogle(ids.includes('google'))
        setHasFacebook(ids.includes('facebook'))
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error || 'Login failed.')
      toast.error(result.error || 'Login failed.')
    } else {
      toast.success('Welcome back! Login successful.')
    }
  }



  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left: Brand / Marketing — Electric Blue + Acid Lime */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-shopee via-shopee-dark to-[#003D99] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-lime blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden">
            <img src="/apple-touch-icon.png" alt="TVF" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold">THEVIRALFINDS</h2>
            <p className="text-xs text-lime font-semibold tracking-wider">AFFILIATE MANAGER PRO</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <Badge variant="secondary" className="bg-lime text-foreground border-0 backdrop-blur font-bold">
            <Sparkles className="w-3 h-3 mr-1" /> AI-Powered Platform
          </Badge>
          <h1 className="text-4xl font-bold leading-tight">
            Turn Shopee Clicks into <span className="text-lime">Real RM</span>
          </h1>
          <p className="text-white/90 text-lg leading-relaxed max-w-md">
            The all-in-one platform for Malaysian Shopee affiliates. Generate links, track earnings,
            automate content, and grow your commissions with AI.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 max-w-md">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/10 backdrop-blur rounded p-4 border border-white/10"
              >
                <f.icon className={`w-5 h-5 mb-2 ${f.color}`} />
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-white/70 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/60">
          &copy; {new Date().getFullYear()} THEVIRALFINDS — Built with ⚡ for Malaysian Affiliates
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Back to landing */}
          <button
            type="button"
            onClick={() => setAuthView('landing')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-shopee transition-colors mb-6"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Home
          </button>

          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded bg-shopee text-white flex items-center justify-center overflow-hidden">
              <img src="/apple-touch-icon.png" alt="TVF" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">THEVIRALFINDS</h2>
              <p className="text-xs text-lime font-semibold tracking-wider">AFFILIATE MANAGER</p>
            </div>
          </div>

          <Card className="border-border shadow-lg">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground">Welcome Back 👋</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to your affiliate dashboard
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-3 py-2 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-shopee hover:underline"
                      onClick={() => toast.info('Password reset is coming soon.')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pl-9 pr-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-shopee hover:bg-shopee-dark text-white h-11"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
                    </>
                  ) : (
                    <>
                      Sign In <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    quickDemoLogin()
                    toast.success('Signed in as Demo Affiliate!')
                  }}
                  className="w-full h-11 border-dashed border-2 border-shopee/40 hover:border-shopee bg-shopee/5 text-shopee font-semibold"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-shopee" />
                  Quick Demo Access (1-Click)
                </Button>
              </div>



              {(hasGoogle || hasFacebook) && (
                <>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {hasGoogle && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        onClick={() => loginWithProvider('google')}
                        disabled={loading}
                      >
                        <GoogleIcon className="w-4 h-4 mr-2" />
                        Continue with Google
                      </Button>
                    )}
                    {hasFacebook && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        onClick={() => loginWithProvider('facebook')}
                        disabled={loading}
                      >
                        <FacebookIcon className="w-4 h-4 mr-2" />
                        Continue with Facebook
                      </Button>
                    )}
                  </div>
                </>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthView('register')}
                  className="font-semibold text-shopee hover:underline"
                >
                  Create one now
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
