'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  QrCode,
  Pencil,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  Download,
  Tag,
  Link2,
  BarChart3,
  MousePointerClick,
  Target,
  DollarSign,
  TrendingUp,
  X,
  Check,
  RefreshCw,
  Zap,
  Loader2,
  LinkIcon,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ExportButtons } from '@/components/ui/export-buttons'
import { QUERY_STALE_TIME } from '@/lib/query-config'
import { toast } from 'sonner'

// --- Types ---
type LinkStatus = 'active' | 'paused' | 'expired'

interface AffiliateLink {
  id: string
  name: string
  productName: string
  shortCode: string
  fullUrl: string
  clicks: number
  conversions: number
  earnings: number
  ctr: number
  status: LinkStatus
  campaign: string
  tags: string[]
  createdAt: string
  expiresAt?: string
  category: string
  shopeeAffiliateUrl?: string | null
  shopeeTracked?: boolean
}

// --- API response type ---
interface ApiLink {
  id: string
  name: string
  productUrl: string
  affiliateUrl: string
  productName: string | null
  shortCode: string
  clicks: number
  conversions: number
  earnings: number
  ctr: number | null
  status: string
  category: string | null
  campaignId: string | null
  tags: string | null
  createdAt: string
  expiresAt: string | null
  productPrice: number | null
  commission: number | null
  commissionRate: number | null
  campaign: { id: string; name: string } | null
}

// --- Map API data to AffiliateLink ---
function mapApiLink(raw: ApiLink): AffiliateLink {
  let tags: string[] = []
  if (raw.tags) {
    try {
      const parsed = JSON.parse(raw.tags)
      if (Array.isArray(parsed)) tags = parsed
    } catch {
      tags = raw.tags.split(',').map((t) => t.trim()).filter(Boolean)
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    productName: raw.productName || raw.name,
    shortCode: raw.shortCode,
    fullUrl: raw.affiliateUrl || raw.productUrl,
    clicks: raw.clicks,
    conversions: raw.conversions,
    earnings: Number(raw.earnings) || 0,
    ctr: Number(raw.ctr) || 0,
    status: (['active', 'paused', 'expired'].includes(raw.status) ? raw.status : 'active') as LinkStatus,
    campaign: raw.campaign?.name || 'Default',
    tags,
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt || undefined,
    category: raw.category || 'General',
    shopeeAffiliateUrl: null,
    shopeeTracked: false,
  }
}

const STATUS_STYLES: Record<
  LinkStatus,
  { className: string; label: string }
> = {
  active: {
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0',
    label: 'Active',
  },
  paused: {
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0',
    label: 'Paused',
  },
  expired: {
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0',
    label: 'Expired',
  },
}

// --- QR Code SVG Placeholder ---
function QRCodePlaceholder({ size = 160 }: { size?: number }) {
  const cells = 21
  const cellSize = size / cells

  const pattern: boolean[][] = []
  for (let r = 0; r < cells; r++) {
    pattern[r] = []
    for (let c = 0; c < cells; c++) {
      const isTopLeft = r < 7 && c < 7
      const isTopRight = r < 7 && c >= cells - 7
      const isBottomLeft = r >= cells - 7 && c < 7

      if (isTopLeft || isTopRight || isBottomLeft) {
        const lr = isTopLeft ? r : isBottomLeft ? r - (cells - 7) : r
        const lc = isTopLeft ? c : isTopRight ? c - (cells - 7) : c
        const isOuterBorder = lr === 0 || lr === 6 || lc === 0 || lc === 6
        const isInnerSquare = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4
        pattern[r][c] = isOuterBorder || isInnerSquare
      } else {
        const seed = (r * 31 + c * 17 + 42) % 100
        pattern[r][c] = seed < 40
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx={4} />
      {pattern.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  )
}

// --- Loading Skeleton ---
function LinksLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="size-10 rounded-lg" />
              <div>
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Skeleton className="h-10 w-40" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-[200px]" />
        <Skeleton className="h-9 w-[130px]" />
        <Skeleton className="h-9 w-[150px]" />
      </div>
      <Card>
        <CardContent className="p-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12 ml-auto" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// --- Empty State ---
function LinksEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-shopee/10 mb-4">
            <LinkIcon className="size-8 text-shopee" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No affiliate links yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Create your first affiliate link to start tracking clicks, conversions, and earnings from your Shopee promotions.
          </p>
          <Button className="bg-shopee hover:bg-shopee-dark text-white">
            <Plus className="size-4 mr-2" />
            Create Your First Link
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Error State ---
function LinksErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="size-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold mb-1">Failed to load links</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Something went wrong while fetching your affiliate links.
        </p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="size-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

// --- Main Component ---
export function LinksPage() {
  const queryClient = useQueryClient()

  // Fetch links from API
  const {
    data: linksData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['links'],
    queryFn: async () => {
      const res = await fetch('/api/links?limit=100')
      if (!res.ok) throw new Error('Failed to fetch links')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.products,
  })

  // Map API data to our interface
  const links = useMemo(() => {
    if (!linksData?.links) return []
    return (linksData.links as ApiLink[]).map(mapApiLink)
  }, [linksData])

  // Fetch Shopee connection status
  const { data: shopeeData } = useQuery({
    queryKey: ['shopee-connection'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/shopee/connect')
        if (!res.ok) return { connected: false }
        return res.json()
      } catch {
        return { connected: false }
      }
    },
    staleTime: QUERY_STALE_TIME.marketplace,
  })
  const isShopeeConnected = shopeeData?.connected === true

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // API integration state
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  // Create Link Dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newLink, setNewLink] = useState({
    productUrl: '',
    customName: '',
    campaign: '',
    tags: '',
    expiryDate: '',
  })

  // QR Code Dialog
  const [qrOpen, setQrOpen] = useState(false)
  const [qrLink, setQrLink] = useState<AffiliateLink | null>(null)

  // Detail Dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLink, setDetailLink] = useState<AffiliateLink | null>(null)

  // Stats
  const stats = useMemo(() => {
    const total = links.length
    const active = links.filter((l) => l.status === 'active').length
    const paused = links.filter((l) => l.status === 'paused').length
    const expired = links.filter((l) => l.status === 'expired').length
    const tracked = links.filter((l) => l.shopeeTracked).length
    return { total, active, paused, expired, tracked }
  }, [links])

  // Filtered links
  const filteredLinks = useMemo(() => {
    let result = links

    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      result = result.filter((l) => l.category === categoryFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.productName.toLowerCase().includes(q) ||
          l.shortCode.toLowerCase().includes(q) ||
          l.campaign.toLowerCase().includes(q)
      )
    }

    return result
  }, [links, statusFilter, categoryFilter, searchQuery])

  // Bulk actions
  const allFilteredSelected =
    filteredLinks.length > 0 &&
    filteredLinks.every((l) => selectedIds.has(l.id))

  const handleToggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLinks.map((l) => l.id)))
    }
  }

  const handleToggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopyLink = (link: AffiliateLink) => {
    const urlToCopy = link.shopeeAffiliateUrl || link.fullUrl
    navigator.clipboard?.writeText(urlToCopy).catch(() => {})
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Pause/Resume link via API
  const handleTogglePause = useCallback(async (id: string) => {
    try {
      const currentLink = links.find((l) => l.id === id)
      if (!currentLink) return
      const newStatus = currentLink.status === 'paused' ? 'active' : 'paused'
      const res = await fetch('/api/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['links'] })
        toast.success(`Link ${newStatus === 'paused' ? 'paused' : 'resumed'}`)
      }
    } catch {
      toast.error('Failed to update link status')
    }
  }, [links, queryClient])

  // Delete link via API
  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        queryClient.invalidateQueries({ queryKey: ['links'] })
        toast.success('Link deleted')
      }
    } catch {
      toast.error('Failed to delete link')
    }
  }, [queryClient])

  const handleBulkPause = async () => {
    for (const id of selectedIds) {
      const link = links.find((l) => l.id === id)
      if (link && link.status === 'active') {
        await handleTogglePause(id)
      }
    }
    setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await handleDelete(id)
    }
    setSelectedIds(new Set())
  }

  const handleCreateLink = async () => {
    setIsCreatingLink(true)

    try {
      let shopeeAffiliateUrl: string | null = null
      let shopeeTracked = false

      // If Shopee API is connected and we have a product URL, generate a real affiliate link
      if (isShopeeConnected && newLink.productUrl) {
        try {
          const res = await fetch('/api/shopee/generate-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productUrl: newLink.productUrl,
              subId: newLink.customName || undefined,
            }),
          })

          const data = await res.json()

          if (data.link) {
            shopeeAffiliateUrl = data.link.shortUrl || data.link.longUrl
            shopeeTracked = data.source === 'shopee_api'
          }
        } catch (error) {
          console.error('Failed to generate Shopee link:', error)
        }
      }

      // Create link via API
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLink.customName || 'Untitled Link',
          productUrl: newLink.productUrl || `https://shopee.com.my/custom`,
          affiliateUrl: shopeeAffiliateUrl || newLink.productUrl || `https://shopee.com.my/custom`,
          productName: newLink.productUrl || 'Custom Product',
          category: newLink.campaign || 'Electronics',
          campaignId: newLink.campaign || undefined,
          tags: newLink.tags ? newLink.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
          expiresAt: newLink.expiryDate || undefined,
        }),
      })

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['links'] })
        toast.success('Link created successfully!')
        setNewLink({
          productUrl: '',
          customName: '',
          campaign: '',
          tags: '',
          expiryDate: '',
        })
        setCreateOpen(false)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create link')
      }
    } catch (error) {
      console.error('Create link error:', error)
      toast.error('Failed to create link')
    } finally {
      setIsCreatingLink(false)
    }
  }

  // Sync stats from Shopee API
  const handleSyncStats = async () => {
    setIsSyncing(true)
    setSyncMessage(null)

    try {
      const res = await fetch('/api/shopee/stats?period=30d')
      const data = await res.json()

      if (data.connected) {
        queryClient.invalidateQueries({ queryKey: ['links'] })
        setSyncMessage('Stats synced successfully from Shopee API')
      } else {
        setSyncMessage('Shopee API not connected. Showing database data.')
      }
    } catch (error) {
      setSyncMessage('Failed to sync stats. Please try again.')
    } finally {
      setIsSyncing(false)
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  const openQrDialog = (link: AffiliateLink) => {
    setQrLink(link)
    setQrOpen(true)
  }

  const openDetailDialog = (link: AffiliateLink) => {
    setDetailLink(link)
    setDetailOpen(true)
  }

  const categories = useMemo(() => {
    const cats = new Set(links.map((l) => l.category))
    return Array.from(cats).sort()
  }, [links])

  // Loading state
  if (isLoading) {
    return <LinksLoadingSkeleton />
  }

  // Error state
  if (isError) {
    return <LinksErrorState onRetry={() => refetch()} />
  }

  // Empty state - no links at all
  if (links.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Affiliate Links</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage and track your affiliate links
            </p>
          </div>
          <Button
            className="bg-shopee hover:bg-shopee-dark text-white"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            Create New Link
          </Button>
        </div>
        <LinksEmptyState />

        {/* Create Link Dialog (still accessible) */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Affiliate Link</DialogTitle>
              <DialogDescription>
                Generate a new affiliate link for a product
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product-url">Product URL</Label>
                <Input
                  id="product-url"
                  placeholder="https://shopee.com.my/product/..."
                  value={newLink.productUrl}
                  onChange={(e) => setNewLink((prev) => ({ ...prev, productUrl: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="custom-name">Custom Name</Label>
                <Input
                  id="custom-name"
                  placeholder="e.g., Xiaomi CNY Promo"
                  value={newLink.customName}
                  onChange={(e) => setNewLink((prev) => ({ ...prev, customName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Select
                  value={newLink.campaign}
                  onValueChange={(val) => setNewLink((prev) => ({ ...prev, campaign: val }))}
                >
                  <SelectTrigger id="campaign" className="w-full">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Default">Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="electronics, promo, xiaomi"
                  value={newLink.tags}
                  onChange={(e) => setNewLink((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newLink.expiryDate}
                  onChange={(e) => setNewLink((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                className="bg-shopee hover:bg-shopee-dark text-white"
                onClick={handleCreateLink}
                disabled={(!newLink.productUrl && !newLink.customName) || isCreatingLink}
              >
                {isCreatingLink ? (
                  <><Loader2 className="size-4 animate-spin" />Generating...</>
                ) : 'Create Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Links</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track your affiliate links
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sync Stats Button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSyncStats}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Stats'}
          </Button>
          <ExportButtons type="links" />
          {isShopeeConnected && (
            <Badge className="bg-emerald-500 text-white border-0 gap-1 text-[10px]">
              <Zap className="size-3" />
              Shopee API Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`py-3 ${syncMessage.includes('successfully') ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20' : 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/20'}`}>
            <CardContent className="p-3 flex items-center gap-2">
              {syncMessage.includes('successfully') ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <X className="size-4 text-amber-500" />
              )}
              <p className="text-xs">{syncMessage}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Links',
            value: stats.total,
            icon: Link2,
            color: 'text-shopee',
            bg: 'bg-shopee/10',
          },
          {
            label: 'Active',
            value: stats.active,
            icon: TrendingUp,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          },
          {
            label: 'Paused',
            value: stats.paused,
            icon: Pause,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
          },
          {
            label: 'Expired',
            value: stats.expired,
            icon: X,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-100 dark:bg-red-900/30',
          },
          {
            label: 'Shopee Tracked',
            value: stats.tracked,
            icon: Zap,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="py-4">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex items-center justify-center size-10 rounded-lg ${stat.bg}`}
                >
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Create New Link */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-shopee hover:bg-shopee-dark text-white">
              <Plus className="size-4" />
              Create New Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Affiliate Link</DialogTitle>
              <DialogDescription>
                Generate a new affiliate link for a product
                {isShopeeConnected && (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                    — Shopee API connected, will generate real tracking link
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product-url">Product URL</Label>
                <Input
                  id="product-url"
                  placeholder="https://shopee.com.my/product/..."
                  value={newLink.productUrl}
                  onChange={(e) =>
                    setNewLink((prev) => ({
                      ...prev,
                      productUrl: e.target.value,
                    }))
                  }
                />
                {!isShopeeConnected && newLink.productUrl && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    Connect Shopee API in Settings to generate real tracking links
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="custom-name">Custom Name</Label>
                <Input
                  id="custom-name"
                  placeholder="e.g., Xiaomi CNY Promo"
                  value={newLink.customName}
                  onChange={(e) =>
                    setNewLink((prev) => ({
                      ...prev,
                      customName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Select
                  value={newLink.campaign}
                  onValueChange={(val) =>
                    setNewLink((prev) => ({ ...prev, campaign: val }))
                  }
                >
                  <SelectTrigger id="campaign" className="w-full">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chinese New Year">
                      Chinese New Year
                    </SelectItem>
                    <SelectItem value="Valentine Beauty">
                      Valentine Beauty
                    </SelectItem>
                    <SelectItem value="11.11 Sale">11.11 Sale</SelectItem>
                    <SelectItem value="12.12 Sale">12.12 Sale</SelectItem>
                    <SelectItem value="Home Makeover">Home Makeover</SelectItem>
                    <SelectItem value="Sports Week">Sports Week</SelectItem>
                    <SelectItem value="Default">Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="electronics, promo, xiaomi"
                  value={newLink.tags}
                  onChange={(e) =>
                    setNewLink((prev) => ({ ...prev, tags: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newLink.expiryDate}
                  onChange={(e) =>
                    setNewLink((prev) => ({
                      ...prev,
                      expiryDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-shopee hover:bg-shopee-dark text-white"
                onClick={handleCreateLink}
                disabled={(!newLink.productUrl && !newLink.customName) || isCreatingLink}
              >
                {isCreatingLink ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Create Link'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Badge variant="secondary" className="gap-1">
              {selectedIds.size} selected
            </Badge>
            <Button variant="outline" size="sm" onClick={handleBulkPause}>
              <Pause className="size-3.5" />
              Pause
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </motion.div>
        )}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            className="pl-10 h-9 w-full sm:w-[200px] lg:w-[260px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Links Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] pl-4">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={handleToggleAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Short Code</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px] pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredLinks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-12 text-muted-foreground"
                        >
                          No links found matching your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLinks.map((link) => (
                        <motion.tr
                          key={link.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-muted/50 border-b transition-colors"
                          data-state={
                            selectedIds.has(link.id) ? 'selected' : undefined
                          }
                        >
                          <TableCell className="pl-4">
                            <Checkbox
                              checked={selectedIds.has(link.id)}
                              onCheckedChange={() => handleToggleOne(link.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              className="text-left hover:underline cursor-pointer"
                              onClick={() => openDetailDialog(link)}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm">
                                  {link.name}
                                </span>
                                {link.shopeeTracked && (
                                  <Badge className="bg-emerald-500 text-white border-0 text-[9px] px-1 py-0 gap-0.5">
                                    <Zap className="size-2.5" />
                                    Tracked
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                {link.productName}
                              </div>
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {link.shortCode}
                              </code>
                              <button
                                onClick={() => handleCopyLink(link)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title={link.shopeeAffiliateUrl ? 'Copy Shopee affiliate URL' : 'Copy link'}
                              >
                                {copiedId === link.id ? (
                                  <Check className="size-3 text-emerald-500" />
                                ) : (
                                  <Copy className="size-3 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {link.clicks.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {link.conversions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            <span className="text-shopee">
                              RM{link.earnings.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {link.ctr.toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge
                                className={`text-[10px] px-1.5 py-0.5 ${
                                  STATUS_STYLES[link.status].className
                                }`}
                              >
                                {STATUS_STYLES[link.status].label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="pr-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openDetailDialog(link)}
                                >
                                  <BarChart3 className="size-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTogglePause(link.id)
                                  }
                                  disabled={link.status === 'expired'}
                                >
                                  {link.status === 'paused' ? (
                                    <>
                                      <Play className="size-4" />
                                      Resume
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="size-4" />
                                      Pause
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openQrDialog(link)}
                                >
                                  <QrCode className="size-4" />
                                  QR Code
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyLink(link)}
                                >
                                  <Copy className="size-4" />
                                  {link.shopeeAffiliateUrl ? 'Copy Shopee Link' : 'Copy Link'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => handleDelete(link.id)}
                                >
                                  <Trash2 className="size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              {qrLink?.name || 'Scan to open affiliate link'}
            </DialogDescription>
          </DialogHeader>
          {qrLink && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="border rounded-lg p-4 bg-white">
                <QRCodePlaceholder size={200} />
              </div>
              <div className="text-center w-full">
                <p className="text-sm font-medium">{qrLink.productName}</p>
                {qrLink.shopeeTracked && qrLink.shopeeAffiliateUrl && (
                  <div className="mt-1">
                    <Badge className="bg-emerald-500 text-white border-0 text-[9px] gap-0.5 mb-1">
                      <Zap className="size-2.5" />
                      Shopee Tracked
                    </Badge>
                    <code className="block text-xs text-muted-foreground break-all">
                      {qrLink.shopeeAffiliateUrl}
                    </code>
                  </div>
                )}
                <code className="text-xs text-muted-foreground break-all">
                  {qrLink.fullUrl}
                </code>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const svgEl = document.querySelector(
                    '#qr-dialog svg'
                  ) as SVGElement | null
                  if (svgEl) {
                    const svgData = new XMLSerializer().serializeToString(svgEl)
                    const blob = new Blob([svgData], {
                      type: 'image/svg+xml',
                    })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `qr-${qrLink.shortCode}.svg`
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                }}
              >
                <Download className="size-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailLink?.name}
              {detailLink && (
                <>
                  <Badge
                    className={`text-[10px] ${
                      STATUS_STYLES[detailLink.status].className
                    }`}
                  >
                    {STATUS_STYLES[detailLink.status].label}
                  </Badge>
                  {detailLink.shopeeTracked && (
                    <Badge className="bg-emerald-500 text-white border-0 text-[10px] gap-0.5">
                      <Zap className="size-3" />
                      Shopee Tracked
                    </Badge>
                  )}
                </>
              )}
            </DialogTitle>
            <DialogDescription>{detailLink?.productName}</DialogDescription>
          </DialogHeader>
          {detailLink && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    icon: MousePointerClick,
                    label: 'Clicks',
                    value: detailLink.clicks.toLocaleString(),
                    color: 'text-shopee',
                    bg: 'bg-shopee/10',
                  },
                  {
                    icon: Target,
                    label: 'Conversions',
                    value: detailLink.conversions.toLocaleString(),
                    color: 'text-hermes',
                    bg: 'bg-hermes/10',
                  },
                  {
                    icon: DollarSign,
                    label: 'Earnings',
                    value: `RM${detailLink.earnings.toFixed(2)}`,
                    color: 'text-emerald-600 dark:text-emerald-400',
                    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                  },
                  {
                    icon: TrendingUp,
                    label: 'CTR',
                    value: `${detailLink.ctr.toFixed(2)}%`,
                    color: 'text-amber-600 dark:text-amber-400',
                    bg: 'bg-amber-100 dark:bg-amber-900/30',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={`flex items-center justify-center size-8 rounded-md ${stat.bg}`}
                    >
                      <stat.icon className={`size-4 ${stat.color}`} />
                    </div>
                    <span className="text-lg font-bold">{stat.value}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Link Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Link Information</h4>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Short Code:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs w-fit">
                    {detailLink.shortCode}
                  </code>
                  <span className="text-muted-foreground">Full URL:</span>
                  <span className="text-xs break-all">
                    {detailLink.fullUrl}
                  </span>
                  {detailLink.shopeeAffiliateUrl && (
                    <>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Zap className="size-3 text-emerald-500" />
                        Shopee URL:
                      </span>
                      <span className="text-xs break-all text-emerald-600 dark:text-emerald-400">
                        {detailLink.shopeeAffiliateUrl}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">Campaign:</span>
                  <span>{detailLink.campaign}</span>
                  <span className="text-muted-foreground">Category:</span>
                  <span>{detailLink.category}</span>
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(detailLink.createdAt).toLocaleDateString()}</span>
                  {detailLink.expiresAt && (
                    <>
                      <span className="text-muted-foreground">Expires:</span>
                      <span>{new Date(detailLink.expiresAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Tags */}
              {detailLink.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Tag className="size-3.5" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detailLink.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Click History */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <MousePointerClick className="size-3.5" />
                  Recent Clicks
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detailLink.clicks > 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      {detailLink.clicks} total clicks recorded
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No clicks recorded yet
                    </p>
                  )}
                </div>
              </div>

              {/* Conversion History */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Target className="size-3.5" />
                  Recent Conversions
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detailLink.conversions > 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      {detailLink.conversions} total conversions — RM{detailLink.earnings.toFixed(2)} earned
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No conversions yet
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(detailLink)}
                  className="flex-1"
                >
                  <Copy className="size-3.5" />
                  {detailLink.shopeeAffiliateUrl ? 'Copy Shopee Link' : 'Copy Link'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openQrDialog(detailLink)}
                  className="flex-1"
                >
                  <QrCode className="size-3.5" />
                  QR Code
                </Button>
                {detailLink.status !== 'expired' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleTogglePause(detailLink.id)
                      setDetailLink((prev) =>
                        prev
                          ? {
                              ...prev,
                              status:
                                prev.status === 'paused' ? 'active' : 'paused',
                            }
                          : null
                      )
                    }}
                    className="flex-1"
                  >
                    {detailLink.status === 'paused' ? (
                      <>
                        <Play className="size-3.5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="size-3.5" />
                        Pause
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
