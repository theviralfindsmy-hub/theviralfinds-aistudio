'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  ChevronRight,
  Check,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

const BENEFITS = [
  'Free forever for Malaysian affiliates',
  'Generate unlimited Shopee affiliate links',
  'AI-powered content in Manglish & Bahasa',
  'Track clicks, conversions & earnings in real-time',
]

export function RegisterPage() {
  const { register, loginWithProvider, setAuthView } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasGoogle, setHasGoogle] = useState(false)
  const [hasFacebook, setHasFacebook] = useState(false)

  useEffect(() => {
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

  const passwordChecks = {
    length: password.length >= 6,
    match: password.length > 0 && password === confirm,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (!passwordChecks.length) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (!passwordChecks.match) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await register(name.trim(), email.trim(), password)
    setLoading(false)

    if (!result.ok) {
      setError(result.error || 'Registration failed.')
      toast.error(result.error || 'Registration failed.')
    } else {
      toast.success('Account created! Welcome to TheViralFindsMY.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left: Marketing — Electric Blue + Acid Lime */}
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
            <Sparkles className="w-3 h-3 mr-1" /> Join 1000+ Malaysian Affiliates
          </Badge>
          <h1 className="text-4xl font-bold leading-tight">
            Start Earning <span className="text-lime">RM Today</span> from Shopee
          </h1>
          <p className="text-white/90 text-lg leading-relaxed max-w-md">
            Create your free account and unlock AI-powered tools to grow your Shopee affiliate
            commissions like never before.
          </p>

          <ul className="space-y-3 pt-4 max-w-md">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-lime flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-foreground" />
                </div>
                <span className="text-sm text-white/90">{b}</span>
              </li>
            ))}
          </ul>

          <div className="bg-white/10 backdrop-blur rounded p-4 border border-white/10 flex items-center gap-3 max-w-md">
            <TrendingUp className="w-8 h-8 text-lime flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">RM 4,250</p>
              <p className="text-xs text-white/70">Average monthly commission of our top affiliates</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/60">
          &copy; {new Date().getFullYear()} THEVIRALFINDS — Built with ⚡ for Malaysian Affiliates
        </div>
      </div>

      {/* Right: Register form */}
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
                <h2 className="text-2xl font-bold text-foreground">Create Your Account 🚀</h2>
                <p className="text-sm text-muted-foreground">
                  Join TheViralFindsMY — it&apos;s free!
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-3 py-2 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Ahmad Razak"
                      className="pl-9"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="register-email"
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
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min 6 characters"
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
                  {password.length > 0 && (
                    <p className={`text-xs ${passwordChecks.length ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {passwordChecks.length ? '✓ Good length' : '✗ At least 6 characters'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="register-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      className="pl-9"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  {confirm.length > 0 && (
                    <p className={`text-xs ${passwordChecks.match ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {passwordChecks.match ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-shopee hover:bg-shopee-dark text-white h-11"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...
                    </>
                  ) : (
                    <>
                      Create Account <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>

              {(hasGoogle || hasFacebook) && (
                <>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">or sign up with</span>
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
                        Sign up with Google
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
                        Sign up with Facebook
                      </Button>
                    )}
                  </div>
                </>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className="font-semibold text-shopee hover:underline"
                >
                  Sign in
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
