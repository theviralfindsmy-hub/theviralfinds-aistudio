'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Mail,
  Key,
  Bot,
  Bell,
  Shield,
  Trash2,
  RefreshCw,
  Save,
  Camera,
  Wifi,
  WifiOff,
  Check,
  AlertTriangle,
  Info,
  Cpu,
  Globe,
  Clock,
  Package,
  Unplug,
  ShoppingBag,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'
import { LogOut, ShieldCheck, CalendarClock, LogIn, MailCheck } from 'lucide-react'
import { SocialAccountsSection } from '@/components/social/social-accounts-section'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

// ─── Shopee Regions ───────────────────────────────────────────────────────────

const SHOPEE_REGIONS = [
  { value: 'my', label: 'Malaysia' },
  { value: 'sg', label: 'Singapore' },
  { value: 'id', label: 'Indonesia' },
  { value: 'th', label: 'Thailand' },
  { value: 'ph', label: 'Philippines' },
  { value: 'vn', label: 'Vietnam' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  // Profile
  const [profileName, setProfileName] = useState('TheViralFindsMY')
  const [profileEmail, setProfileEmail] = useState('admin@theviralfinds.com')
  const [shopeeAffId, setShopeeAffId] = useState('aff_theviralfindsMY_2025')

  // Notification preferences
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(true)
  const [earningsAlert, setEarningsAlert] = useState(true)
  const [campaignAlert, setCampaignAlert] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)

  // Shopee Affiliate API Connection
  const {
    shopeeConnected,
    setShopeeConnected,
    shopeeDataSource,
    setShopeeDataSource,
    user: authUser,
    isAuthenticated,
    logout,
    setAuthView,
    checkAuth,
  } = useAppStore()
  const [shopeeAppId, setShopeeAppId] = useState('')
  const [shopeeSecret, setShopeeSecret] = useState('')
  const [shopeeRegion, setShopeeRegion] = useState('my')
  const [shopeeAccessToken, setShopeeAccessToken] = useState('')
  const [shopeeTesting, setShopeeTesting] = useState(false)
  const [shopeeLastConnected, setShopeeLastConnected] = useState<string | null>(null)
  const [shopeeTestMessage, setShopeeTestMessage] = useState<string | null>(null)
  const [shopeeMaskedAppId, setShopeeMaskedAppId] = useState<string | null>(null)
  const [shopeeHasCredentials, setShopeeHasCredentials] = useState(false)

  // HERMES Connection
  const [hermesEndpoint, setHermesEndpoint] = useState('https://api.openai.com/v1')
  const [hermesApiKey, setHermesApiKey] = useState('sk-***************')
  const [hermesModel, setHermesModel] = useState('gpt-4o')
  const [hermesConnected, setHermesConnected] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)

  // Load Shopee config on mount
  useEffect(() => {
    fetch('/api/shopee/config')
      .then((res) => res.json())
      .then((data) => {
        setShopeeHasCredentials(data.hasCredentials === true)
        setShopeeMaskedAppId(data.appId || null)
        setShopeeRegion(data.region || 'my')
        setShopeeDataSource(data.source || 'mock')
        if (data.status === 'connected') {
          setShopeeConnected(true)
        } else {
          setShopeeConnected(false)
        }
        // If has credentials, also check status endpoint for live connection test
        if (data.hasCredentials) {
          fetch('/api/shopee/status')
            .then((r) => r.json())
            .then((statusData) => {
              setShopeeConnected(statusData.connected === true)
              setShopeeDataSource(statusData.source || 'mock')
            })
            .catch(() => {})
        }
      })
      .catch(() => {
        setShopeeConnected(false)
        setShopeeDataSource('mock')
      })
  }, [setShopeeConnected, setShopeeDataSource])

  // Sync profile form fields with the authenticated user
  useEffect(() => {
    if (authUser) {
      setProfileName(authUser.name)
      setProfileEmail(authUser.email)
      if (authUser.shopeeAffId) setShopeeAffId(authUser.shopeeAffId)
    }
  }, [authUser])

  // Save profile handler — calls /api/auth/me PATCH
  const [savingProfile, setSavingProfile] = useState(false)
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          shopeeAffId,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || 'Failed to save profile')
      } else {
        toast.success('Profile saved successfully')
        await checkAuth()
      }
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Test Shopee connection - save credentials then test
  const handleTestShopeeConnection = async () => {
    if (!shopeeAppId || !shopeeSecret) {
      toast.error('App ID and Secret are required')
      return
    }

    setShopeeTesting(true)
    setShopeeTestMessage(null)

    try {
      // Step 1: Save credentials via POST /api/shopee/config
      const saveRes = await fetch('/api/shopee/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: shopeeAppId,
          secret: shopeeSecret,
          region: shopeeRegion,
        }),
      })

      const saveData = await saveRes.json()

      if (!saveRes.ok) {
        setShopeeTestMessage(saveData.error || 'Failed to save credentials')
        toast.error('Failed to save credentials')
        return
      }

      // Step 2: Test connection via GET /api/shopee/status
      const statusRes = await fetch('/api/shopee/status')
      const statusData = await statusRes.json()

      setShopeeConnected(statusData.connected === true)
      setShopeeHasCredentials(true)
      setShopeeDataSource(statusData.source || 'mock')
      setShopeeMaskedAppId(`${shopeeAppId.slice(0, 4)}****`)

      if (statusData.connected) {
        setShopeeLastConnected(new Date().toISOString())
        setShopeeTestMessage('Connected to Shopee Affiliate API!')
        toast.success('Connected to Shopee Affiliate API!')
      } else {
        setShopeeTestMessage(statusData.message || 'Connection failed. Check your credentials.')
        toast.error('Connection failed. Check your credentials.')
      }
    } catch (error) {
      setShopeeConnected(false)
      setShopeeDataSource('mock')
      setShopeeTestMessage('Failed to connect. Please check your credentials.')
      toast.error('Failed to connect. Please check your credentials.')
    } finally {
      setShopeeTesting(false)
    }
  }

  // Disconnect Shopee
  const handleDisconnectShopee = async () => {
    try {
      const res = await fetch('/api/shopee/config', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        setShopeeConnected(false)
        setShopeeHasCredentials(false)
        setShopeeDataSource('mock')
        setShopeeAppId('')
        setShopeeSecret('')
        setShopeeAccessToken('')
        setShopeeMaskedAppId(null)
        setShopeeLastConnected(null)
        setShopeeTestMessage(null)
        toast.success('Shopee API disconnected. Using demo data.')
      } else {
        toast.error('Failed to disconnect')
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Failed to disconnect')
    }
  }

  const handleTestConnection = () => {
    setTestingConnection(true)
    setTimeout(() => {
      setHermesConnected(true)
      setTestingConnection(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile, preferences, and integrations
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Authentication & Account Summary */}
          <motion.div {...fadeIn}>
            <Card className="card-hover border-shopee/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="size-4 text-shopee" />
                  Account & Authentication
                </CardTitle>
                <CardDescription>
                  Your sign-in status and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAuthenticated && authUser ? (
                  <>
                    <div className="flex items-start gap-4">
                      <Avatar className="size-14">
                        <AvatarFallback className="bg-shopee/10 text-shopee text-base font-bold">
                          {(authUser.name || authUser.email || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{authUser.name}</p>
                          {authUser.emailVerified && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] gap-1">
                              <MailCheck className="size-2.5" /> Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{authUser.email}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Badge variant="secondary" className="bg-shopee/10 text-shopee border-0 text-[10px] capitalize">
                            {authUser.role}
                          </Badge>
                          {authUser.lastLoginAt && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CalendarClock className="size-3" />
                              Last login: {new Date(authUser.lastLoginAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs text-muted-foreground">
                        Want to use a different account? Sign out safely.
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2"
                        onClick={async () => {
                          await logout()
                          toast.success('You have been signed out.')
                        }}
                      >
                        <LogOut className="size-3.5" />
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-muted-foreground">
                      You are not signed in. Sign in to sync your profile.
                    </div>
                    <Button
                      size="sm"
                      className="bg-shopee hover:bg-shopee-dark text-white gap-2"
                      onClick={() => setAuthView('login')}
                    >
                      <LogIn className="size-3.5" />
                      Sign In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Section */}
          <motion.div {...fadeIn}>
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4 text-shopee" />
                  Profile
                </CardTitle>
                <CardDescription>Your personal information and Shopee affiliate details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="size-16">
                      <AvatarFallback className="bg-shopee/10 text-shopee text-lg font-bold">
                        TV
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-1 -right-1 size-7 rounded-full"
                    >
                      <Camera className="size-3" />
                    </Button>
                  </div>
                  <div>
                    <p className="font-semibold">{profileName}</p>
                    <p className="text-xs text-muted-foreground">Shopee Affiliate Partner</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="settings-name">Display Name</Label>
                    <Input
                      id="settings-name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="settings-email">Email</Label>
                    <div className="relative">
                      <Mail className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                      <Input
                        id="settings-email"
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="settings-aff-id">Shopee Affiliate ID</Label>
                  <div className="relative">
                    <Key className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                    <Input
                      id="settings-aff-id"
                      value={shopeeAffId}
                      onChange={(e) => setShopeeAffId(e.target.value)}
                      className="pl-9 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="gap-2" onClick={handleSaveProfile} disabled={savingProfile}>
                    <Save className="size-4" />
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Preferences */}
          <motion.div {...fadeIn}>
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="size-4 text-shopee" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Browser and mobile push alerts</p>
                  </div>
                  <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Earnings Alerts</Label>
                    <p className="text-xs text-muted-foreground">Get notified for every commission earned</p>
                  </div>
                  <Switch checked={earningsAlert} onCheckedChange={setEarningsAlert} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Campaign Alerts</Label>
                    <p className="text-xs text-muted-foreground">Updates on campaign status changes</p>
                  </div>
                  <Switch checked={campaignAlert} onCheckedChange={setCampaignAlert} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Weekly Digest</Label>
                    <p className="text-xs text-muted-foreground">Summary of your weekly performance</p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Connections - Dual Tabs */}
          <motion.div {...fadeIn}>
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="size-4 text-shopee" />
                  API Connections
                </CardTitle>
                <CardDescription>Configure your external API integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="shopee" className="w-full">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="shopee" className="flex-1 gap-1.5">
                      <ShoppingBag className="size-3.5" />
                      Shopee Affiliate API
                    </TabsTrigger>
                    <TabsTrigger value="hermes" className="flex-1 gap-1.5">
                      <Bot className="size-3.5" />
                      HERMES Agent
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Shopee Affiliate API */}
                  <TabsContent value="shopee" className="space-y-4">
                    {/* API Access Status Info Box */}
                    {!shopeeHasCredentials ? (
                      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4">
                        <AlertTriangle className="size-5 text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                            No API Access
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                            You currently do not have access to the Shopee Affiliate Open API Platform. Please contact Shopee to request access. The app is using demo data.
                          </p>
                        </div>
                        <Badge className="shrink-0 bg-amber-500 text-white border-0 text-[10px]">
                          Demo Mode
                        </Badge>
                      </div>
                    ) : shopeeHasCredentials && !shopeeConnected ? (
                      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4">
                        <AlertTriangle className="size-5 text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                            Connection Failed
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                            API credentials configured but connection failed. Check your AppID and Secret.
                          </p>
                        </div>
                        <Badge className="shrink-0 bg-amber-500 text-white border-0 text-[10px]">
                          Demo Mode
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                        <Check className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            Connected to Shopee Affiliate API
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                            Showing real data from Shopee. Affiliate links and product data are live.
                          </p>
                        </div>
                        <Badge className="shrink-0 bg-emerald-500 text-white border-0 text-[10px]">
                          Live Mode
                        </Badge>
                      </div>
                    )}

                    {/* Connection Status Bar */}
                    <div className={cn(
                      'flex items-center gap-2 rounded-lg border p-3',
                      shopeeConnected
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-red-500/20 bg-red-500/5'
                    )}>
                      {shopeeConnected ? (
                        <Wifi className="size-4 text-emerald-500" />
                      ) : (
                        <WifiOff className="size-4 text-red-500" />
                      )}
                      <span className={cn(
                        'text-sm font-medium',
                        shopeeConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {shopeeConnected ? 'Connected' : 'Disconnected'}
                      </span>
                      {shopeeConnected && shopeeMaskedAppId && (
                        <Badge variant="outline" className="ml-auto text-[10px] font-mono">
                          App: {shopeeMaskedAppId}
                        </Badge>
                      )}
                      {shopeeLastConnected && (
                        <Badge variant="outline" className="ml-auto text-[10px] gap-1">
                          <Clock className="size-3" />
                          {new Date(shopeeLastConnected).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>

                    {/* Test Result Message */}
                    {shopeeTestMessage && (
                      <div className={cn(
                        'flex items-center gap-2 rounded-lg border p-3 text-sm',
                        shopeeConnected
                          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400'
                      )}>
                        {shopeeConnected ? (
                          <Check className="size-4" />
                        ) : (
                          <AlertTriangle className="size-4" />
                        )}
                        {shopeeTestMessage}
                      </div>
                    )}

                    {/* Shopee API Docs Link */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="size-3.5 shrink-0" />
                      <span>
                        Need API access? Visit the{' '}
                        <a
                          href="https://affiliate.shopee.com.my/affiliate-api"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-shopee underline underline-offset-2 hover:text-shopee-dark"
                        >
                          Shopee Affiliate API Documentation
                        </a>
                        {' '}to learn more and request access.
                      </span>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="shopee-app-id">App ID</Label>
                      <div className="relative">
                        <Key className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                          id="shopee-app-id"
                          placeholder="Enter your Shopee App ID"
                          value={shopeeAppId}
                          onChange={(e) => setShopeeAppId(e.target.value)}
                          className="pl-9 font-mono text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Found in Shopee Affiliate Portal → Account → API → Open API
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="shopee-secret">Secret</Label>
                      <div className="relative">
                        <Key className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                          id="shopee-secret"
                          type="password"
                          placeholder="Enter your Shopee Secret"
                          value={shopeeSecret}
                          onChange={(e) => setShopeeSecret(e.target.value)}
                          className="pl-9 font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="shopee-region">Region</Label>
                      <Select value={shopeeRegion} onValueChange={setShopeeRegion}>
                        <SelectTrigger id="shopee-region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHOPEE_REGIONS.map((region) => (
                            <SelectItem key={region.value} value={region.value}>
                              {region.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="shopee-access-token">Access Token (Optional)</Label>
                      <div className="relative">
                        <Key className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                          id="shopee-access-token"
                          type="password"
                          placeholder="Optional - for authorized API calls"
                          value={shopeeAccessToken}
                          onChange={(e) => setShopeeAccessToken(e.target.value)}
                          className="pl-9 font-mono text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Required for some endpoints. Generate from Shopee OAuth flow.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleTestShopeeConnection}
                        disabled={shopeeTesting || (!shopeeAppId && !shopeeConnected)}
                      >
                        {shopeeTesting ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <Wifi className="size-4" />
                        )}
                        {shopeeTesting ? 'Testing...' : 'Test Connection'}
                      </Button>
                      {shopeeConnected && (
                        <Button
                          variant="outline"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={handleDisconnectShopee}
                        >
                          <Unplug className="size-4" />
                          Disconnect
                        </Button>
                      )}
                      <Button className="gap-2">
                        <Save className="size-4" />
                        Save Connection
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Tab 2: HERMES Agent */}
                  <TabsContent value="hermes" className="space-y-4">
                    {/* Connection Status */}
                    <div className={cn(
                      'flex items-center gap-2 rounded-lg border p-3',
                      hermesConnected ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                    )}>
                      {hermesConnected ? (
                        <Wifi className="size-4 text-emerald-500" />
                      ) : (
                        <WifiOff className="size-4 text-red-500" />
                      )}
                      <span className={cn('text-sm font-medium', hermesConnected ? 'text-emerald-600' : 'text-red-600')}>
                        {hermesConnected ? 'Connected' : 'Disconnected'}
                      </span>
                      {hermesConnected && (
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          Latency: 120ms
                        </Badge>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="hermes-endpoint">Endpoint URL</Label>
                      <div className="relative">
                        <Globe className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                          id="hermes-endpoint"
                          value={hermesEndpoint}
                          onChange={(e) => setHermesEndpoint(e.target.value)}
                          className="pl-9 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hermes-key">API Key</Label>
                      <div className="relative">
                        <Key className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                          id="hermes-key"
                          type="password"
                          value={hermesApiKey}
                          onChange={(e) => setHermesApiKey(e.target.value)}
                          className="pl-9 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hermes-model">Model</Label>
                      <Select value={hermesModel} onValueChange={setHermesModel}>
                        <SelectTrigger id="hermes-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                          <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                      >
                        {testingConnection ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <Wifi className="size-4" />
                        )}
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                      </Button>
                      <Button className="gap-2">
                        <Save className="size-4" />
                        Save Connection
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Connected Social Accounts (AutoPost) */}
          <SocialAccountsSection />

          {/* Danger Zone */}
          <motion.div {...fadeIn}>
            <Card className="border-destructive/20 card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <Shield className="size-4" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions — proceed with caution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Reset All Data</p>
                    <p className="text-xs text-muted-foreground">
                      Clear all links, campaigns, and analytics data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                        <RefreshCw className="size-4" />
                        Reset Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="size-5 text-destructive" />
                          Reset All Data?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your links, campaigns, analytics data, and chat history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, Reset Everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Separator />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Delete Account</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="size-4" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="size-5 text-destructive" />
                          Delete Your Account?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account, all your data, links, earnings history, and referral connections. This action is irreversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, Delete My Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <motion.div {...fadeIn} className="space-y-6">
          {/* App Info */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="size-4 text-shopee" />
                App Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Package className="size-3.5" />
                  Version
                </span>
                <span className="font-medium">2.4.1</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="size-3.5" />
                  Build
                </span>
                <span className="font-medium font-mono">2025.03.15-a3f8</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Last Sync
                </span>
                <span className="font-medium">2 min ago</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ShoppingBag className="size-3.5" />
                  Shopee API
                </span>
                <Badge
                  variant={shopeeConnected ? 'default' : 'destructive'}
                  className={cn(
                    'text-[10px]',
                    shopeeConnected && 'bg-emerald-500 hover:bg-emerald-600'
                  )}
                >
                  {shopeeConnected ? 'Live' : shopeeHasCredentials ? 'Error' : 'Demo'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Bot className="size-3.5" />
                  HERMES
                </span>
                <Badge variant={hermesConnected ? 'default' : 'destructive'} className="text-[10px]">
                  {hermesConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <RefreshCw className="size-4" />
                Sync with Shopee
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Check className="size-4" />
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Settings className="size-4" />
                Clear Cache
              </Button>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card className="border-shopee/10 bg-shopee/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-shopee/10 flex size-8 items-center justify-center rounded-full">
                  <User className="text-shopee size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{profileName}</p>
                  <p className="text-[10px] text-muted-foreground">Pro Affiliate</p>
                </div>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                <p>Member since Jan 2025</p>
                <p>Shopee Affiliate Partner</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
