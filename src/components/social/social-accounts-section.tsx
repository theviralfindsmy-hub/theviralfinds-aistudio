'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle,
  Camera,
  Video,
  Twitter,
  RefreshCw,
  Unplug,
  Plus,
  Check,
  AlertTriangle,
  Clock,
  Sparkles,
  Share2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SocialAccountInfo {
  id: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter'
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

const PLATFORMS: Array<{
  id: 'facebook' | 'instagram' | 'tiktok' | 'twitter'
  name: string
  icon: typeof MessageCircle
  color: string
  description: string
}> = [
  { id: 'facebook', name: 'Facebook', icon: MessageCircle, color: '#1877F2', description: 'Post text, images, and links to your Facebook Page.' },
  { id: 'instagram', name: 'Instagram', icon: Camera, color: '#E4405F', description: 'Publish image posts to your Instagram Business account.' },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: '#FF0050', description: 'Generate a pre-filled TikTok share link with your caption.' },
  { id: 'twitter', name: 'Twitter / X', icon: Twitter, color: '#0F1419', description: 'Post text tweets with optional image via Twitter API v2.' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function SocialAccountsSection() {
  const [accounts, setAccounts] = useState<SocialAccountInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/accounts')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // Check URL params for OAuth callback messages (set by /api/social/callback)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const msg = params.get('social_msg')
    if (msg) {
      const isError = msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('error')
      if (isError) toast.error(msg)
      else toast.success(msg)
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('social_msg')
      window.history.replaceState({}, '', url.toString())
      fetchAccounts()
    }
  }, [fetchAccounts])

  const accountFor = (platformId: string) => accounts.find((a) => a.platform === platformId)

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId)
    try {
      const res = await fetch(`/api/social/connect/${platformId}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || `Failed to connect ${platformId}`)
        return
      }
      if (data.mode === 'demo') {
        toast.success(`${data.message}`)
        fetchAccounts()
      } else if (data.mode === 'oauth' && data.authUrl) {
        // Real OAuth — redirect to provider
        toast.info(`Redirecting to ${platformId} for authorization…`)
        window.location.href = data.authUrl
      }
    } catch {
      toast.error(`Failed to connect ${platformId}`)
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (platformId: string) => {
    setDisconnecting(platformId)
    try {
      const res = await fetch(`/api/social/disconnect/${platformId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || `Failed to disconnect ${platformId}`)
        return
      }
      toast.success(data.message || `${platformId} disconnected`)
      fetchAccounts()
    } catch {
      toast.error(`Failed to disconnect ${platformId}`)
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="card-hover border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="size-4 text-emerald-600" />
            Connected Social Accounts
          </CardTitle>
          <CardDescription>
            Connect your social media accounts to enable real AutoPost publishing.
            Platforms without OAuth credentials run in demo mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="size-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading connections…</span>
            </div>
          ) : (
            PLATFORMS.map((p) => {
              const Icon = p.icon
              const account = accountFor(p.id)
              const isConnected = !!account?.isConnected
              const isDemo = account?.isDemo
              const isConfigured = account?.configured
              const connectingThis = connecting === p.id
              const disconnectingThis = disconnecting === p.id

              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between',
                    isConnected
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-muted bg-muted/30'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{p.name}</p>
                        {isConnected ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] gap-1">
                            <Check className="size-2.5" /> Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Not Connected
                          </Badge>
                        )}
                        {isDemo && (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] gap-1">
                            <Sparkles className="size-2.5" /> Demo Mode
                          </Badge>
                        )}
                        {!isConfigured && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                            Configure in .env
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                      {account && (
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          {account.platformUsername && (
                            <span className="flex items-center gap-1">
                              <span className="font-mono">@{account.platformUsername}</span>
                            </span>
                          )}
                          {account.lastUsedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              Last used {new Date(account.lastUsedAt).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            Limit: {account.characterLimit} chars
                          </span>
                          {account.requiresImage && (
                            <span className="text-amber-600">Requires image</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isConnected ? (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(p.id)}
                        disabled={connectingThis}
                        className={cn('gap-2', isConfigured ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600')}
                      >
                        {connectingThis ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                          <Plus className="size-3.5" />
                        )}
                        {connectingThis ? 'Connecting…' : isConfigured ? 'Connect' : 'Connect (Demo)'}
                      </Button>
                    ) : (
                      <>
                        {isDemo && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConnect(p.id)}
                            disabled={connectingThis}
                            className="gap-2"
                          >
                            {connectingThis ? <RefreshCw className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                            Reconnect
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisconnect(p.id)}
                          disabled={disconnectingThis}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          {disconnectingThis ? <RefreshCw className="size-3.5 animate-spin" /> : <Unplug className="size-3.5" />}
                          Disconnect
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Info banner */}
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
            <AlertTriangle className="size-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-muted-foreground">
              <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                About Demo Mode
              </p>
              <p>
                When platform OAuth credentials aren&apos;t configured in your <code className="rounded bg-muted px-1">.env</code> file,
                connecting a platform creates a simulated (demo) account. Scheduled posts will be
                &ldquo;published&rdquo; after a short delay so you can test the full flow end-to-end.
                To enable real publishing, set{' '}
                <code className="rounded bg-muted px-1">FACEBOOK_APP_ID</code>,{' '}
                <code className="rounded bg-muted px-1">FACEBOOK_APP_SECRET</code>,{' '}
                <code className="rounded bg-muted px-1">INSTAGRAM_APP_ID</code>,{' '}
                <code className="rounded bg-muted px-1">TIKTOK_CLIENT_KEY</code>,{' '}
                <code className="rounded bg-muted px-1">TWITTER_CLIENT_ID</code>, etc.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
