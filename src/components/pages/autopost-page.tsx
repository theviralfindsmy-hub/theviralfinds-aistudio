'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone, Calendar, Clock, Send, Trash2, Sparkles, Video, Camera,
  MessageCircle, Tv, Twitter, RefreshCw, ExternalLink, AlertCircle,
  CheckCircle2, XCircle, Loader2, Zap, Share2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

// ─── Platform Metadata ──────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: MessageCircle, color: '#1877F2', charLimit: 63206 },
  { id: 'instagram', name: 'Instagram', icon: Camera, color: '#E4405F', charLimit: 2200, requiresImage: true },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: '#FF0050', charLimit: 2200 },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: '#0F1419', charLimit: 280 },
  { id: 'youtube', name: 'YouTube', icon: Tv, color: '#FF0000', charLimit: 5000 },
]

interface SocialAccountInfo {
  id: string
  platform: string
  platformUsername: string | null
  isConnected: boolean
  isDemo: boolean
  configured: boolean
  displayName: string
  color: string
  characterLimit: number
  requiresImage: boolean
}

interface PlatformPostResult {
  platform: string
  success: boolean
  demo: boolean
  platformPostId?: string
  platformUrl?: string
  error?: string
  publishedAt: string
  attempt: number
}

interface ScheduledPost {
  id: string
  caption: string
  platforms: string[]
  productUrl: string | null
  affiliateLink: string | null
  imageUrl: string | null
  hashtags: string[]
  status: 'scheduled' | 'publishing' | 'published' | 'failed' | 'partial'
  scheduledAt: string
  publishedAt: string | null
  retryCount: number
  errorMessage: string | null
  result?: Record<string, PlatformPostResult> | null
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  publishing: 'bg-blue-100 text-blue-800 border-blue-200',
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  partial: 'bg-orange-100 text-orange-800 border-orange-200',
}

const statusIcons: Record<string, typeof CheckCircle2> = {
  scheduled: Clock,
  publishing: Loader2,
  published: CheckCircle2,
  failed: XCircle,
  partial: AlertCircle,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AutopostPage() {
  const { setActivePage } = useAppStore()
  const [tab, setTab] = useState('quick')
  const [caption, setCaption] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [productUrl, setProductUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [loading, setLoading] = useState(false)
  const [publishingNow, setPublishingNow] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [accounts, setAccounts] = useState<SocialAccountInfo[]>([])
  const [bestTimes, setBestTimes] = useState<Record<string, any>>({})

  const togglePlatform = (id: string) => {
    // Only allow selecting connected platforms
    const isConnected = accounts.some(a => a.platform === id && a.isConnected)
    if (!isConnected) {
      toast.error('Connect this platform in Settings first')
      return
    }
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/autopost')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch {}
  }, [])

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch {}
  }, [])

  const fetchBestTimes = useCallback(async () => {
    try {
      const res = await fetch('/api/autopost/suggest-times')
      if (res.ok) {
        const data = await res.json()
        setBestTimes(data.platforms || {})
      }
    } catch {}
  }, [])

  // On mount: fetch posts, accounts, best times + trigger execute for any due posts
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [postsRes, timesRes, accRes] = await Promise.all([
          fetch('/api/autopost'),
          fetch('/api/autopost/suggest-times'),
          fetch('/api/social/accounts'),
        ])
        if (postsRes.ok && active) {
          const data = await postsRes.json()
          setPosts(data.posts || [])
        }
        if (timesRes.ok && active) {
          const data = await timesRes.json()
          setBestTimes(data.platforms || {})
        }
        if (accRes.ok && active) {
          const data = await accRes.json()
          setAccounts(data.accounts || [])
        }
      } catch {}

      // Trigger the execution engine for any due posts (non-blocking)
      try {
        await fetch('/api/social/execute', { method: 'POST' })
        // Re-fetch posts after a delay to reflect any status changes
        setTimeout(() => { if (active) fetchPosts() }, 2000)
      } catch {}
    })()
    return () => { active = false }
  }, [fetchPosts])

  // Poll every 15s while there are scheduled/publishing posts
  useEffect(() => {
    const hasActive = posts.some(p => p.status === 'scheduled' || p.status === 'publishing')
    if (!hasActive) return
    const interval = setInterval(async () => {
      await fetch('/api/social/execute', { method: 'POST' }).catch(() => {})
      fetchPosts()
    }, 15000)
    return () => clearInterval(interval)
  }, [posts, fetchPosts])

  const connectedCount = accounts.filter(a => a.isConnected).length
  const isPlatformConnected = (id: string) => accounts.some(a => a.platform === id && a.isConnected)

  const handleSchedule = async () => {
    if (!caption) return toast.error('Add a caption')
    if (selectedPlatforms.length === 0) return toast.error('Select at least one connected platform')
    if (!scheduledAt) return toast.error('Select schedule time')
    setLoading(true)
    try {
      const res = await fetch('/api/autopost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          platforms: selectedPlatforms,
          scheduledAt,
          productUrl: productUrl || undefined,
          imageUrl: imageUrl || undefined,
          hashtags: hashtags ? hashtags.split(',').map(h => h.trim()).filter(Boolean) : undefined,
        }),
      })
      if (res.ok) {
        toast.success('Post scheduled! Will publish at the scheduled time.')
        setCaption(''); setScheduledAt(''); setProductUrl(''); setImageUrl(''); setHashtags('')
        fetchPosts()
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to schedule')
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  const publishNow = async (postId: string) => {
    setPublishingNow(postId)
    try {
      const res = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Published to ${Object.values(data.platforms || {}).filter((p: any) => p.success).length} platform(s)`)
      } else {
        toast.error(data.error || 'Publish failed')
      }
      fetchPosts()
    } catch {
      toast.error('Network error')
    }
    setPublishingNow(null)
  }

  const retryPost = async (postId: string) => {
    setRetrying(postId)
    try {
      const res = await fetch(`/api/social/post/${postId}/retry`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        if (data.status === 'published') toast.success('Retry successful — post published!')
        else toast.info(`Retry: ${data.status}`)
      } else {
        toast.error(data.error || 'Retry failed')
      }
      fetchPosts()
    } catch {
      toast.error('Network error')
    }
    setRetrying(null)
  }

  const deletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/autopost/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Post deleted'); fetchPosts() }
    } catch {}
  }

  const triggerExecute = async () => {
    try {
      const res = await fetch('/api/social/execute', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        if (data.processed > 0) {
          toast.success(`Processed ${data.processed} post(s): ${data.published} published, ${data.failed} failed`)
        } else {
          toast.info('No due posts to publish')
        }
        setTimeout(fetchPosts, 1500)
      }
    } catch {
      toast.error('Failed to trigger execution')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-emerald-600" /> AutoPost
          </h1>
          <p className="text-muted-foreground">Schedule & automate your social media posts</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('gap-1', connectedCount > 0 ? 'text-emerald-600 border-emerald-300' : 'text-amber-600 border-amber-300')}>
            <Share2 className="size-3" />
            {connectedCount}/{PLATFORMS.filter(p => p.id !== 'youtube').length} platforms connected
          </Badge>
          <Button variant="outline" size="sm" onClick={triggerExecute} className="gap-2">
            <Zap className="size-3.5" /> Run Now
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="quick"><Sparkles className="h-4 w-4 mr-1" />Quick Post</TabsTrigger>
          <TabsTrigger value="queue"><Calendar className="h-4 w-4 mr-1" />Queue</TabsTrigger>
          <TabsTrigger value="times"><Clock className="h-4 w-4 mr-1" />Best Times</TabsTrigger>
        </TabsList>

        {/* ─── Quick Post Tab ─── */}
        <TabsContent value="quick">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Caption</Label>
                    <Textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write your post caption..." rows={4} />
                    <p className="text-xs text-muted-foreground mt-1">{caption.length} chars</p>
                  </div>
                  <div>
                    <Label>Platforms (only connected ones selectable)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {PLATFORMS.map(p => {
                        const Icon = p.icon
                        const on = selectedPlatforms.includes(p.id)
                        const connected = isPlatformConnected(p.id)
                        const acc = accounts.find(a => a.platform === p.id)
                        return (
                          <button
                            key={p.id}
                            onClick={() => togglePlatform(p.id)}
                            disabled={!connected}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm',
                              on ? 'text-white border-transparent' : 'border-muted bg-background',
                              !connected && 'opacity-50 cursor-not-allowed'
                            )}
                            style={on ? { backgroundColor: p.color } : undefined}
                            title={connected ? `Connected${acc?.isDemo ? ' (Demo)' : ''}` : 'Not connected — go to Settings'}
                          >
                            <Icon className="h-4 w-4" />
                            {p.name}
                            {connected && acc?.isDemo && <Badge className="bg-white/20 text-white text-[8px] px-1 py-0">DEMO</Badge>}
                          </button>
                        )
                      })}
                    </div>
                    {connectedCount === 0 && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="size-3" /> No platforms connected. Visit Settings → Connected Social Accounts to connect.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Product URL</Label><Input value={productUrl} onChange={e => setProductUrl(e.target.value)} placeholder="https://shopee.com.my/..." /></div>
                    <div><Label>Hashtags (comma-separated)</Label><Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#RacunShopee, #ad" /></div>
                  </div>
                  <div><Label>Image URL (optional, required for Instagram)</Label><Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." /></div>
                  <div><Label>Schedule Time</Label><Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} /></div>
                  <Button onClick={handleSchedule} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {loading ? 'Scheduling...' : <><Send className="h-4 w-4 mr-2" />Schedule Post</>}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Connection Status Sidebar */}
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Share2 className="size-4 text-emerald-600" /> Platform Status</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {PLATFORMS.map(p => {
                    const Icon = p.icon
                    const acc = accounts.find(a => a.platform === p.id)
                    const connected = !!acc?.isConnected
                    return (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <div className="flex size-7 items-center justify-center rounded text-white" style={{ backgroundColor: p.color }}>
                          <Icon className="size-3.5" />
                        </div>
                        <span className="flex-1">{p.name}</span>
                        {connected ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] gap-1">
                            <CheckCircle2 className="size-2.5" /> {acc?.isDemo ? 'Demo' : 'Live'}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] gap-1">
                            <XCircle className="size-2.5" /> Off
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                  <div className="pt-2 border-t mt-2">
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setActivePage('settings')}>
                      <Share2 className="size-3.5" /> Manage Connections
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Post Status Legend</CardTitle></CardHeader>
                <CardContent className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2"><Badge className={statusColors.scheduled + ' text-[10px]'}>Scheduled</Badge> <span className="text-muted-foreground">Waiting for scheduled time</span></div>
                  <div className="flex items-center gap-2"><Badge className={statusColors.publishing + ' text-[10px]'}>Publishing</Badge> <span className="text-muted-foreground">Currently being posted</span></div>
                  <div className="flex items-center gap-2"><Badge className={statusColors.published + ' text-[10px]'}>Published</Badge> <span className="text-muted-foreground">All platforms succeeded</span></div>
                  <div className="flex items-center gap-2"><Badge className={statusColors.partial + ' text-[10px]'}>Partial</Badge> <span className="text-muted-foreground">Some platforms failed</span></div>
                  <div className="flex items-center gap-2"><Badge className={statusColors.failed + ' text-[10px]'}>Failed</Badge> <span className="text-muted-foreground">All platforms failed (retry available)</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Queue Tab ─── */}
        <TabsContent value="queue">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Scheduled Posts ({posts.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={fetchPosts} className="gap-2">
                <RefreshCw className="size-3.5" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No scheduled posts yet. Create one in the Quick Post tab.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {posts.map(post => {
                    const StatusIcon = statusIcons[post.status] || Clock
                    const results = post.result || {}
                    const successCount = Object.values(results).filter(r => r.success).length
                    const failedCount = Object.values(results).filter(r => !r.success).length
                    const canRetry = (post.status === 'failed' || post.status === 'partial') && (post.retryCount || 0) < 3
                    const canPublishNow = post.status === 'scheduled'
                    const isPublishing = post.status === 'publishing'

                    return (
                      <div key={post.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2">{post.caption}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {post.platforms.map((p: string) => {
                                const meta = PLATFORMS.find(x => x.id === p)
                                const Icon = meta?.icon || MessageCircle
                                const r = results[p]
                                return (
                                  <div key={p} className="flex items-center gap-1">
                                    <div className="flex size-5 items-center justify-center rounded text-white" style={{ backgroundColor: meta?.color || '#888' }}>
                                      <Icon className="size-3" />
                                    </div>
                                    {r && (
                                      <span className="text-[10px]">
                                        {r.success ? <CheckCircle2 className="size-3 text-emerald-500" /> : <XCircle className="size-3 text-red-500" />}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                              <Badge className={cn('text-[10px] gap-1', statusColors[post.status])}>
                                <StatusIcon className={cn('size-2.5', isPublishing && 'animate-spin')} />
                                {post.status}
                              </Badge>
                              {post.retryCount > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                  Retry #{post.retryCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(post.scheduledAt).toLocaleString()}
                              {post.publishedAt && ` · Published ${new Date(post.publishedAt).toLocaleString()}`}
                            </p>
                            {post.errorMessage && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="size-3" /> {post.errorMessage}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Per-platform result details */}
                        {Object.keys(results).length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 bg-muted/30 rounded p-2">
                            {Object.entries(results).map(([platform, r]) => {
                              const meta = PLATFORMS.find(x => x.id === platform)
                              return (
                                <div key={platform} className="flex items-center gap-2 text-xs">
                                  <span className="font-medium w-20 truncate">{meta?.name || platform}</span>
                                  {r.success ? (
                                    <>
                                      <CheckCircle2 className="size-3 text-emerald-500" />
                                      <span className="text-emerald-600 truncate">
                                        {r.demo ? 'Demo published' : 'Published'}
                                      </span>
                                      {r.platformUrl && (
                                        <a href={r.platformUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-blue-500 hover:underline">
                                          <ExternalLink className="size-3" />
                                        </a>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="size-3 text-red-500" />
                                      <span className="text-red-600 truncate" title={r.error}>{r.error || 'Failed'}</span>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {canPublishNow && (
                            <Button size="sm" variant="default" onClick={() => publishNow(post.id)} disabled={publishingNow === post.id} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                              {publishingNow === post.id ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />}
                              {publishingNow === post.id ? 'Publishing...' : 'Publish Now'}
                            </Button>
                          )}
                          {canRetry && (
                            <Button size="sm" variant="outline" onClick={() => retryPost(post.id)} disabled={retrying === post.id} className="gap-2">
                              {retrying === post.id ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                              {retrying === post.id ? 'Retrying...' : `Retry (${post.retryCount || 0}/3)`}
                            </Button>
                          )}
                          {successCount > 0 && (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 gap-1">
                              <CheckCircle2 className="size-2.5" /> {successCount} succeeded
                            </Badge>
                          )}
                          {failedCount > 0 && (
                            <Badge variant="outline" className="text-[10px] text-red-600 gap-1">
                              <XCircle className="size-2.5" /> {failedCount} failed
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)} className="ml-auto gap-2 text-destructive hover:text-destructive">
                            <Trash2 className="size-3" /> Delete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Best Times Tab ─── */}
        <TabsContent value="times">
          <div className="space-y-4">
            {Object.entries(bestTimes).map(([key, platform]: [string, any]) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{platform.icon}</span>{platform.name}
                    <span className="text-xs text-muted-foreground ml-auto">Limit: {platform.characterLimit}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {platform.timeSlots?.map((slot: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium">{slot.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${slot.engagement}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{slot.engagement}%</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-1 mt-1">
                      {platform.bestDays?.map((d: string) => <Badge key={d} variant="outline" className="text-xs">{d}</Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
