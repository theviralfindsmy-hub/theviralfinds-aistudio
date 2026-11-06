'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key,
  Plus,
  BookOpen,
  Terminal,
  BarChart3,
  Copy,
  Check,
  Pencil,
  Ban,
  Trash2,
  Shield,
  Activity,
  AlertTriangle,
  Gauge,
  Search,
  Send,
  Plus as PlusIcon,
  X,
  Clock,
  Zap,
  Lock,
  Code2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Recharts
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import type {
  ApiKey,
  ApiKeyPermission,
  ApiKeysListResponse,
  GenerateApiKeyRequest,
  HttpMethod,
  NewApiKeyResponse,
  PlaygroundRequest,
  PlaygroundResponse,
  PlaygroundRequestParam,
  RateLimitTier,
  UpdateApiKeyRequest,
  UsageAnalytics,
  UsageAnalyticsResponse,
  ApiEndpoint,
  EndpointCategory,
} from '@/lib/apikeys/types'
import { ALL_PERMISSIONS } from '@/lib/apikeys/types'
import {
  API_ENDPOINTS,
  ENDPOINT_CATEGORIES,
  CATEGORY_META,
  METHOD_BADGE_CLASS,
  matchEndpoint,
  endpointsByCategory,
} from '@/lib/apikeys/endpoints'

// ─── Helpers ────────────────────────────────────────────────────────────

/** "Active", "Revoked", "Expired" → tailwind classes for the status badge. */
function statusBadgeClass(status: ApiKey['status']): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    case 'revoked':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
    case 'expired':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
  }
}

/** Rate-limit tier → human label. */
function tierLabel(tier: RateLimitTier): string {
  if (tier >= 10000) return '10k/day'
  if (tier >= 1000) return '1k/day'
  return '100/day'
}

/** Format an ISO date as "16 Jun 2025". */
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Format a number with thousand separators. */
function formatNumber(n: number): string {
  return n.toLocaleString('en-MY')
}

/** Format a percentage from a 0-1 ratio. */
function formatPct(ratio: number, digits = 2): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

/** Format latency in ms (e.g. "142ms"). */
function formatLatency(ms: number): string {
  return `${Math.round(ms)}ms`
}

/** Render JSON with light syntax highlighting (just keys/strings/numbers). */
function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  const json = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }, [value])

  // Lightweight token highlighting — wraps keys, strings, numbers, booleans.
  const highlighted = useMemo(() => {
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'text-amber-700 dark:text-amber-300' // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-purple-700 dark:text-purple-300' // key
          } else {
            cls = 'text-emerald-700 dark:text-emerald-300' // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-rose-700 dark:text-rose-300' // boolean
        } else if (/null/.test(match)) {
          cls = 'text-muted-foreground' // null
        }
        return `<span class="${cls}">${match}</span>`
      },
    )
  }, [json])

  return (
    <pre
      className={cn(
        'overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed font-mono',
        className,
      )}
    >
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  )
}

/** Build a curl command string from an endpoint + params. */
function buildCurlExample(ep: ApiEndpoint, params: PlaygroundRequestParam[] = []): string {
  const base = 'https://api.theviralfinds.my'
  let path = ep.path
  const queryParams: string[] = []
  for (const p of params) {
    if (!p.key || p.value === '') continue
    if (path.includes(`:${p.key}`)) {
      path = path.replace(`:${p.key}`, encodeURIComponent(p.value))
    } else {
      queryParams.push(`${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    }
  }
  const url = base + path + (queryParams.length ? `?${queryParams.join('&')}` : '')
  const lines = [
    `curl -X ${ep.method} '${url}' \\`,
    `  -H 'Authorization: Bearer tvf_••••••••••••' \\`,
    `  -H 'Content-Type: application/json'`,
  ]
  return lines.join('\n')
}

/** Build a JSON request body example from endpoint params (body-only). */
function buildBodyExample(ep: ApiEndpoint): string {
  const bodyParams = ep.params.filter((p) => p.location === 'body')
  if (bodyParams.length === 0) return ''
  const obj: Record<string, unknown> = {}
  for (const p of bodyParams) {
    obj[p.name] = p.example ?? ''
  }
  return JSON.stringify(obj, null, 2)
}

// ─── Permission metadata ────────────────────────────────────────────────

const PERMISSION_GROUPS: { label: string; perms: ApiKeyPermission[] }[] = [
  { label: 'Products', perms: ['products:read', 'products:write'] },
  { label: 'Links', perms: ['links:read', 'links:write'] },
  { label: 'Earnings', perms: ['earnings:read'] },
  { label: 'Analytics', perms: ['analytics:read', 'audience:read'] },
  { label: 'Content', perms: ['content:write'] },
  { label: 'Trends', perms: ['trends:read'] },
  { label: 'Alerts', perms: ['alerts:read', 'alerts:write'] },
]

// ─── Stat card ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  loading,
}: {
  icon: typeof Zap
  label: string
  value: string
  sub?: string
  accent: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">
                {value}
              </p>
            )}
            {sub && !loading && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
            )}
          </div>
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              accent,
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── API Keys tab ───────────────────────────────────────────────────────

function KeysTable({
  keys,
  onCopy,
  onEdit,
  onRevoke,
}: {
  keys: ApiKey[]
  onCopy: (k: ApiKey) => void
  onEdit: (k: ApiKey) => void
  onRevoke: (k: ApiKey) => void
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="size-4 text-shopee" />
          Your API Keys
        </CardTitle>
        <CardDescription>
          {keys.length} key(s) · masked for security. The full secret is only
          shown once at generation time.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="hidden md:table-cell">Rate limit</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden lg:table-cell">Last used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
                    {k.maskedKey}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[280px]">
                    {k.permissions.slice(0, 3).map((p) => (
                      <Badge
                        key={p}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-mono"
                      >
                        {p}
                      </Badge>
                    ))}
                    {k.permissions.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        +{k.permissions.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {tierLabel(k.rateLimit)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {formatDate(k.createdAt)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                  {formatDate(k.lastUsedAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('capitalize text-[11px]', statusBadgeClass(k.status))}
                  >
                    {k.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onCopy(k)}
                      title="Copy masked key"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(k)}
                      disabled={k.status === 'revoked'}
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                      onClick={() => onRevoke(k)}
                      disabled={k.status === 'revoked'}
                      title="Revoke"
                    >
                      <Ban className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/** "Generate New Key" dialog. */
function GenerateKeyDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onGenerated: (key: NewApiKeyResponse['key']) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [perms, setPerms] = useState<Set<ApiKeyPermission>>(
    new Set(['products:read', 'links:write', 'earnings:read']),
  )
  const [tier, setTier] = useState<RateLimitTier>(1000)

  const reset = useCallback(() => {
    setName('')
    setPerms(new Set(['products:read', 'links:write', 'earnings:read']))
    setTier(1000)
  }, [])

  const generate = useMutation({
    mutationFn: async (req: GenerateApiKeyRequest) => {
      const res = await fetch('/api/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to generate key')
      }
      return (await res.json()) as NewApiKeyResponse
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apikeys'] })
      queryClient.invalidateQueries({ queryKey: ['apikeys-usage'] })
      onGenerated(data.key)
      onOpenChange(false)
      reset()
      toast.success('API key generated', {
        description: 'Copy it now — it won\'t be shown again.',
      })
    },
    onError: (err: Error) => {
      toast.error('Failed to generate key', { description: err.message })
    },
  })

  const togglePerm = (p: ApiKeyPermission) => {
    setPerms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const handleSubmit = () => {
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    if (perms.size === 0) {
      toast.error('Select at least one permission')
      return
    }
    generate.mutate({
      name: name.trim(),
      permissions: Array.from(perms),
      rateLimit: tier,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate New API Key</DialogTitle>
          <DialogDescription>
            Mint a new key scoped to specific permissions and a daily rate limit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="key-name">Key name</Label>
            <Input
              id="key-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production App"
              maxLength={60}
            />
            <p className="text-[11px] text-muted-foreground">
              Used to identify this key in your dashboard.
            </p>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {group.perms.map((p) => (
                      <label
                        key={p}
                        className={cn(
                          'flex items-center gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer transition-colors',
                          perms.has(p)
                            ? 'border-shopee/40 bg-shopee/5'
                            : 'border-border hover:bg-accent/40',
                        )}
                      >
                        <Checkbox
                          checked={perms.has(p)}
                          onCheckedChange={() => togglePerm(p)}
                        />
                        <code className="text-[11px] font-mono">{p}</code>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate limit */}
          <div className="space-y-1.5">
            <Label>Daily rate limit</Label>
            <Select
              value={String(tier)}
              onValueChange={(v) => setTier(Number(v) as RateLimitTier)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 requests/day (Testing)</SelectItem>
                <SelectItem value="1000">1,000 requests/day (Standard)</SelectItem>
                <SelectItem value="10000">10,000 requests/day (Enterprise)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={generate.isPending}
            className="bg-shopee text-white hover:bg-shopee-dark"
          >
            {generate.isPending ? (
              <>
                <RefreshCw className="size-4 mr-1.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Key className="size-4 mr-1.5" />
                Generate Key
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** One-time key reveal dialog. */
function OneTimeKeyDialog({
  newKey,
  onClose,
}: {
  newKey: NewApiKeyResponse['key'] | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newKey!.plaintextKey)
      setCopied(true)
      toast.success('Key copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy — copy manually')
    }
  }

  return (
    <Dialog open={!!newKey} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-emerald-500" />
            Key Generated — Save It Now
          </DialogTitle>
          <DialogDescription>
            This is the only time the full secret will be shown. Store it securely.
          </DialogDescription>
        </DialogHeader>

        {newKey && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4" />
                Save this key securely
              </div>
              <p className="mt-1 text-[12px]">
                TheViralFindsMY does not store the plaintext. If you lose it you
                will need to revoke this key and generate a new one.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Plaintext API key</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={newKey.plaintextKey}
                  className="font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  onClick={handleCopy}
                  className={cn(
                    'shrink-0',
                    copied
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-shopee text-white hover:bg-shopee-dark',
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="size-4 mr-1.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-4 mr-1.5" />
                      Copy Key
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{newKey.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rate limit</span>
                <span className="font-medium font-mono">{tierLabel(newKey.rateLimit)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Permissions</span>
                <span className="font-medium">{newKey.permissions.length} scope(s)</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} className="bg-shopee text-white hover:bg-shopee-dark">
            I&apos;ve saved my key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Edit-key dialog (name + permissions + rate limit). */
function EditKeyDialog({
  keyObj,
  onClose,
}: {
  keyObj: ApiKey
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(keyObj.name)
  const [perms, setPerms] = useState<Set<ApiKeyPermission>>(
    () => new Set(keyObj.permissions),
  )
  const [tier, setTier] = useState<RateLimitTier>(keyObj.rateLimit)

  const update = useMutation({
    mutationFn: async (req: UpdateApiKeyRequest) => {
      const res = await fetch(`/api/apikeys/${keyObj!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to update key')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apikeys'] })
      toast.success('API key updated')
      onClose()
    },
    onError: (err: Error) => {
      toast.error('Failed to update key', { description: err.message })
    },
  })

  const togglePerm = (p: ApiKeyPermission) => {
    setPerms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  if (!keyObj) return null

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit API Key</DialogTitle>
          <DialogDescription>
            Update name, permissions, or rate limit. The secret is not regenerated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Key name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="space-y-2 rounded-lg border p-3 bg-muted/30 max-h-[300px] overflow-y-auto">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {group.perms.map((p) => (
                      <label
                        key={p}
                        className={cn(
                          'flex items-center gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer transition-colors',
                          perms.has(p)
                            ? 'border-shopee/40 bg-shopee/5'
                            : 'border-border hover:bg-accent/40',
                        )}
                      >
                        <Checkbox
                          checked={perms.has(p)}
                          onCheckedChange={() => togglePerm(p)}
                        />
                        <code className="text-[11px] font-mono">{p}</code>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Daily rate limit</Label>
            <Select
              value={String(tier)}
              onValueChange={(v) => setTier(Number(v) as RateLimitTier)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 requests/day (Testing)</SelectItem>
                <SelectItem value="1000">1,000 requests/day (Standard)</SelectItem>
                <SelectItem value="10000">10,000 requests/day (Enterprise)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() =>
              update.mutate({
                name: name.trim(),
                permissions: Array.from(perms),
                rateLimit: tier,
              })
            }
            disabled={update.isPending || perms.size === 0 || name.trim().length < 2}
            className="bg-shopee text-white hover:bg-shopee-dark"
          >
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Revoke-key confirmation dialog. */
function RevokeKeyDialog({
  keyObj,
  onClose,
}: {
  keyObj: ApiKey | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const revoke = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/apikeys/${keyObj!.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to revoke key')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apikeys'] })
      toast.success('API key revoked')
      onClose()
    },
    onError: (err: Error) => {
      toast.error('Failed to revoke key', { description: err.message })
    },
  })

  if (!keyObj) return null

  return (
    <Dialog open={!!keyObj} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <Ban className="size-5" />
            Revoke API Key?
          </DialogTitle>
          <DialogDescription>
            This permanently disables the key. All requests using it will return
            401. Earnings already recorded are preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-3 bg-muted/30 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{keyObj.name}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Key</span>
            <code className="font-mono text-[11px]">{keyObj.maskedKey}</code>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => revoke.mutate()}
            disabled={revoke.isPending}
          >
            {revoke.isPending ? 'Revoking…' : 'Revoke Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Documentation tab ──────────────────────────────────────────────────

function DocsTab() {
  const [selectedId, setSelectedId] = useState<string>(API_ENDPOINTS[0]?.id ?? '')
  const [query, setQuery] = useState('')

  const filteredEndpoints = useMemo(() => {
    if (!query.trim()) return API_ENDPOINTS
    const q = query.toLowerCase()
    return API_ENDPOINTS.filter(
      (e) =>
        e.path.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    )
  }, [query])

  const selected = useMemo(
    () => API_ENDPOINTS.find((e) => e.id === selectedId) ?? API_ENDPOINTS[0],
    [selectedId],
  )

  // Group filtered endpoints by category for the sidebar.
  const grouped = useMemo(() => {
    const map = new Map<EndpointCategory, ApiEndpoint[]>()
    for (const cat of ENDPOINT_CATEGORIES) {
      const items = filteredEndpoints.filter((e) => e.category === cat)
      if (items.length > 0) map.set(cat, items)
    }
    return map
  }, [filteredEndpoints])

  const defaultParams = useMemo<PlaygroundRequestParam[]>(
    () =>
      (selected?.params ?? [])
        .filter((p) => p.location === 'path' || p.location === 'query')
        .map((p) => ({
          key: p.name,
          value: p.example !== undefined ? String(p.example) : '',
        })),
    [selected],
  )

  if (!selected) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Sidebar */}
      <Card className="h-[calc(100vh-340px)] min-h-[420px] lg:sticky lg:top-4">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search endpoints…"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100%-72px)]">
            <div className="px-3 pb-3 space-y-3">
              {Array.from(grouped.entries()).map(([cat, items]) => (
                <div key={cat}>
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <span>{CATEGORY_META[cat].icon}</span>
                    {cat}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => setSelectedId(ep.id)}
                        className={cn(
                          'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                          ep.id === selected.id
                            ? 'bg-shopee/10 text-shopee-dark dark:text-shopee-light'
                            : 'hover:bg-accent/40',
                        )}
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            'shrink-0 text-[9px] px-1 py-0 font-mono w-14 justify-center',
                            METHOD_BADGE_CLASS[ep.method],
                          )}
                        >
                          {ep.method}
                        </Badge>
                        <span className="truncate font-mono text-[11px]">
                          {ep.path}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredEndpoints.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No endpoints match &quot;{query}&quot;.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail */}
      <Card className="h-[calc(100vh-340px)] min-h-[420px] overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-5 space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-[11px]',
                    METHOD_BADGE_CLASS[selected.method],
                  )}
                >
                  {selected.method}
                </Badge>
                <code className="text-sm font-mono font-semibold">
                  {selected.path}
                </code>
                <Badge variant="secondary" className="text-[10px]">
                  {selected.category}
                </Badge>
              </div>
              <h3 className="mt-2 text-lg font-semibold">{selected.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.description}
              </p>
            </div>

            {/* Required permissions */}
            {selected.requiredPermissions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Lock className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Required:</span>
                {selected.requiredPermissions.map((p) => (
                  <Badge
                    key={p}
                    variant="outline"
                    className="font-mono text-[10px] border-purple-500/40 bg-purple-500/5 text-purple-700 dark:text-purple-300"
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            )}

            {/* Parameters */}
            {selected.params.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Code2 className="size-4 text-shopee" />
                  Parameters
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="hidden md:table-cell">Required</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.params.map((p) => (
                      <TableRow key={`${p.name}-${p.location}`}>
                        <TableCell className="font-mono text-xs">{p.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {p.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {p.location}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {p.required ? (
                            <span className="text-rose-600 text-xs font-medium">Yes</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.description}
                          {p.example !== undefined && (
                            <span className="block mt-0.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                              e.g. {JSON.stringify(p.example)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Request example */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Terminal className="size-4 text-shopee" />
                Request example
              </h4>
              <JsonBlock value={buildCurlExample(selected, defaultParams)} />
              {(selected.method === 'POST' || selected.method === 'PUT' || selected.method === 'PATCH') && (
                <div className="mt-2">
                  <p className="text-[11px] text-muted-foreground mb-1">Body:</p>
                  <JsonBlock value={buildBodyExample(selected) || '{}'} />
                </div>
              )}
            </div>

            {/* Response example */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Check className="size-4 text-emerald-500" />
                Response (200)
              </h4>
              <JsonBlock value={selected.responseExample} />
            </div>

            {/* Errors */}
            {selected.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="size-4 text-rose-500" />
                  Error responses
                </h4>
                <div className="space-y-1.5">
                  {selected.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 p-2.5"
                    >
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 shrink-0"
                      >
                        {err.status}
                      </Badge>
                      <div className="min-w-0">
                        <code className="text-[11px] font-mono text-rose-700 dark:text-rose-300">
                          {err.code}
                        </code>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {err.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rate limit cost */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
              <Gauge className="size-3.5" />
              Rate-limit cost per call:{' '}
              <Badge variant="secondary" className="font-mono text-[10px]">
                {selected.rateLimitCost} quota
              </Badge>
            </div>
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}

// ─── Playground tab ─────────────────────────────────────────────────────

function PlaygroundTab({
  keys,
}: {
  keys: ApiKey[]
}) {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [path, setPath] = useState('/api/v1/products')
  const [params, setParams] = useState<PlaygroundRequestParam[]>([])
  const [body, setBody] = useState<string>('')
  const [keyId, setKeyId] = useState<string>(keys[0]?.id ?? '')
  const [response, setResponse] = useState<PlaygroundResponse | null>(null)
  const [sending, setSending] = useState(false)

  const matched = useMemo(() => matchEndpoint(method, path), [method, path])

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    const q = path.toLowerCase()
    return API_ENDPOINTS.filter((e) => e.path.toLowerCase().includes(q)).slice(0, 6)
  }, [path])

  const addParam = () => setParams((p) => [...p, { key: '', value: '' }])
  const removeParam = (idx: number) =>
    setParams((p) => p.filter((_, i) => i !== idx))
  const updateParam = (idx: number, field: 'key' | 'value', val: string) =>
    setParams((p) => p.map((it, i) => (i === idx ? { ...it, [field]: val } : it)))

  const send = async () => {
    setSending(true)
    setResponse(null)
    try {
      const req: PlaygroundRequest = {
        method,
        endpoint: path,
        params: params.filter((p) => p.key !== ''),
        body: body || undefined,
        keyId: keyId || undefined,
      }
      const res = await fetch('/api/apikeys/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      const data = (await res.json()) as PlaygroundResponse
      setResponse(data)
    } catch (err) {
      toast.error('Request failed', {
        description: err instanceof Error ? err.message : 'Network error',
      })
    } finally {
      setSending(false)
    }
  }

  // When a matched endpoint changes, pre-fill body for POST/PUT/PATCH.
  useEffect(() => {
    if (matched && (matched.method === 'POST' || matched.method === 'PUT' || matched.method === 'PATCH')) {
      const ex = buildBodyExample(matched)
      if (ex) setBody(ex)
    }
  }, [matched?.id])

  const selectedKey = keys.find((k) => k.id === keyId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Request panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="size-4 text-shopee" />
            Request
          </CardTitle>
          <CardDescription>
            Build a request against the mock API surface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Method + path */}
          <div className="flex gap-2">
            <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
              <SelectTrigger className="w-[110px] shrink-0 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/v1/products"
                className="font-mono text-sm pr-8"
              />
              {suggestions.length > 0 && path && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-[200px] overflow-y-auto">
                  {suggestions.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setMethod(ep.method)
                        setPath(ep.path)
                      }}
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-accent/40"
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-mono text-[9px] px-1 py-0 w-12 justify-center',
                          METHOD_BADGE_CLASS[ep.method],
                        )}
                      >
                        {ep.method}
                      </Badge>
                      <code className="font-mono text-[11px]">{ep.path}</code>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Matched endpoint info */}
          {matched ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                <Check className="size-3.5" />
                Matched: {matched.title}
              </div>
              <p className="mt-1 text-muted-foreground">{matched.description}</p>
              {matched.requiredPermissions.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">Needs:</span>
                  {matched.requiredPermissions.map((p) => (
                    <code
                      key={p}
                      className="text-[10px] font-mono text-purple-700 dark:text-purple-300"
                    >
                      {p}
                    </code>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-700 dark:text-amber-300">
              No endpoint matched — request will return 404 with suggestions.
            </div>
          )}

          {/* API key selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">API key (Authorization header)</Label>
            <Select value={keyId} onValueChange={setKeyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a key" />
              </SelectTrigger>
              <SelectContent>
                {keys
                  .filter((k) => k.status === 'active')
                  .map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name} ({k.maskedKey.slice(0, 18)}…)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedKey && (
              <p className="text-[11px] text-muted-foreground font-mono">
                Authorization: Bearer {selectedKey.maskedKey}
              </p>
            )}
          </div>

          {/* Parameters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Query / Path parameters</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={addParam}
              >
                <PlusIcon className="size-3 mr-1" />
                Add row
              </Button>
            </div>
            <div className="space-y-1.5">
              {params.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">
                  No parameters. Click &quot;Add row&quot; to add query/path params.
                </p>
              )}
              {params.map((p, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <Input
                    value={p.key}
                    onChange={(e) => updateParam(idx, 'key', e.target.value)}
                    placeholder="key"
                    className="font-mono text-xs h-8"
                  />
                  <Input
                    value={p.value}
                    onChange={(e) => updateParam(idx, 'value', e.target.value)}
                    placeholder="value"
                    className="font-mono text-xs h-8"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-rose-600"
                    onClick={() => removeParam(idx)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Body for POST/PUT/PATCH */}
          {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
            <div className="space-y-1.5">
              <Label className="text-xs">Request body (JSON)</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"productId": "shp_8821"}'
                className="font-mono text-xs min-h-[120px]"
              />
            </div>
          )}

          {/* Headers display */}
          <div className="space-y-1.5">
            <Label className="text-xs">Headers</Label>
            <div className="rounded-md border bg-muted/40 p-2.5 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Authorization</span>
                <span>Bearer {selectedKey?.maskedKey ?? 'tvf_••••••••••••'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Content-Type</span>
                <span>application/json</span>
              </div>
            </div>
          </div>

          <Button
            onClick={send}
            disabled={sending}
            className="w-full bg-shopee text-white hover:bg-shopee-dark"
          >
            {sending ? (
              <>
                <RefreshCw className="size-4 mr-1.5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="size-4 mr-1.5" />
                Send Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Response panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-4 text-shopee" />
              Response
            </CardTitle>
            {response && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-[11px]',
                    response.status >= 200 && response.status < 300
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : response.status >= 400 && response.status < 500
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
                  )}
                >
                  {response.status} {response.statusText}
                </Badge>
                <Badge variant="secondary" className="font-mono text-[11px]">
                  <Clock className="size-3 mr-1" />
                  {formatLatency(response.latencyMs)}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!response ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Terminal className="size-10 mb-3 opacity-40" />
              <p className="text-sm">Send a request to see the response here.</p>
            </div>
          ) : (
            <>
              {/* Response body */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                  Body
                </p>
                <JsonBlock value={response.body} className="max-h-[280px]" />
              </div>

              {/* Response headers */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                  Headers
                </p>
                <div className="rounded-lg border bg-muted/40 p-3 space-y-1 font-mono text-[11px]">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="truncate text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched endpoint */}
              {response.matchedEndpoint && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ChevronRight className="size-3" />
                  Matched endpoint:{' '}
                  <code className="font-mono">
                    {response.matchedEndpoint.method} {response.matchedEndpoint.path}
                  </code>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Usage Analytics tab ────────────────────────────────────────────────

function AnalyticsTab({ analytics }: { analytics: UsageAnalytics }) {
  return (
    <div className="space-y-4">
      {/* Time series */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-shopee" />
            Requests over time (30 days)
          </CardTitle>
          <CardDescription>
            Total successful + errored calls across all keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.timeseries}>
                <defs>
                  <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--shopee)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--shopee)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                  }}
                  formatter={(v: number) => [formatNumber(v), 'Calls']}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="var(--shopee)"
                  strokeWidth={2}
                  fill="url(#callsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2-up row: by endpoint + error trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4 text-shopee" />
              Requests by endpoint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.byEndpoint.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <YAxis
                    type="category"
                    dataKey="endpoint"
                    tick={{ fontSize: 9 }}
                    width={140}
                    tickFormatter={(v: string) => v.length > 22 ? `${v.slice(0, 22)}…` : v}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [formatNumber(v), 'Calls']}
                  />
                  <Bar dataKey="calls" fill="var(--shopee)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-500" />
              Error rate trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.errorTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                    domain={[0, 'dataMax']}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [formatPct(v, 3), 'Error rate']}
                    labelFormatter={(l) => `Date: ${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="errorRate"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latency distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="size-4 text-shopee" />
            Latency distribution
          </CardTitle>
          <CardDescription>
            How fast do most requests return? Buckets shown across all calls in the window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.latencyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => [formatNumber(v), 'Calls']}
                />
                <Bar dataKey="calls" fill="var(--hermes)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top endpoints table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top endpoints</CardTitle>
          <CardDescription>
            Calls, errors, and average latency per endpoint (30-day window).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead className="text-right">Error rate</TableHead>
                <TableHead className="text-right">Avg latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.byEndpoint.map((row) => (
                <TableRow key={`${row.method}-${row.endpoint}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-mono text-[10px] px-1 py-0 w-14 justify-center',
                          METHOD_BADGE_CLASS[row.method],
                        )}
                      >
                        {row.method}
                      </Badge>
                      <code className="font-mono text-xs">{row.endpoint}</code>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs">
                    {formatNumber(row.calls)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs">
                    {formatNumber(row.errors)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs">
                    <span
                      className={cn(
                        row.calls > 0 && row.errors / row.calls > 0.01
                          ? 'text-rose-600 font-medium'
                          : 'text-muted-foreground',
                      )}
                    >
                      {row.calls > 0 ? formatPct(row.errors / row.calls, 2) : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs">
                    {formatLatency(row.avgLatencyMs)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-key breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Per-key usage</CardTitle>
          <CardDescription>
            Calls, errors, and latency broken down per API key.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead className="text-right">Error rate</TableHead>
                <TableHead className="text-right">Avg latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.byKey.map((row) => (
                <TableRow key={row.keyId}>
                  <TableCell className="font-medium">{row.keyName}</TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs">
                    {formatNumber(row.calls)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs">
                    {formatNumber(row.errors)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs">
                    <span
                      className={cn(
                        row.errorRate > 0.01
                          ? 'text-rose-600 font-medium'
                          : 'text-muted-foreground',
                      )}
                    >
                      {formatPct(row.errorRate, 2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs">
                    {formatLatency(row.avgLatencyMs)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────

export function ApiKeysPage() {
  const [tab, setTab] = useState<string>('keys')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [newKey, setNewKey] = useState<NewApiKeyResponse['key'] | null>(null)
  const [editKey, setEditKey] = useState<ApiKey | null>(null)
  const [revokeKey, setRevokeKey] = useState<ApiKey | null>(null)

  // Fetch keys
  const keysQuery = useQuery({
    queryKey: ['apikeys'],
    queryFn: async () => {
      const res = await fetch('/api/apikeys')
      if (!res.ok) throw new Error('Failed to fetch API keys')
      return (await res.json()) as ApiKeysListResponse
    },
  })

  // Fetch usage analytics
  const usageQuery = useQuery({
    queryKey: ['apikeys-usage'],
    queryFn: async () => {
      const res = await fetch('/api/apikeys/usage')
      if (!res.ok) throw new Error('Failed to fetch usage analytics')
      return (await res.json()) as UsageAnalyticsResponse
    },
  })

  const keys = keysQuery.data?.keys ?? []
  const analytics = usageQuery.data?.analytics

  const activeKeys = keys.filter((k) => k.status === 'active').length
  const totalCalls = analytics?.totalCalls ?? 0
  const errorRate = analytics?.errorRate ?? 0
  const avgLatency = analytics?.avgLatencyMs ?? 0

  const handleCopy = async (k: ApiKey) => {
    try {
      await navigator.clipboard.writeText(k.maskedKey)
      toast.success('Masked key copied', { description: k.maskedKey })
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Key className="size-7 text-shopee" />
            API as a Service
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access platform data programmatically. Generate keys, browse docs, test endpoints, and track usage.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab('docs')}>
            <BookOpen className="size-4 mr-1.5" />
            View Docs
          </Button>
          <Button
            onClick={() => setGenerateOpen(true)}
            className="bg-shopee text-white hover:bg-shopee-dark"
          >
            <Plus className="size-4 mr-1.5" />
            Generate New Key
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Key}
          label="Active Keys"
          value={String(activeKeys)}
          sub={`of ${keys.length} total`}
          accent="bg-shopee/10 text-shopee"
          loading={keysQuery.isLoading}
        />
        <StatCard
          icon={Activity}
          label="Total Requests (30d)"
          value={formatNumber(totalCalls)}
          sub="across all keys"
          accent="bg-purple-500/10 text-purple-600 dark:text-purple-300"
          loading={usageQuery.isLoading}
        />
        <StatCard
          icon={AlertTriangle}
          label="Error Rate"
          value={formatPct(errorRate, 2)}
          sub={errorRate < 0.01 ? 'Healthy' : 'Above target'}
          accent={errorRate < 0.01 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'}
          loading={usageQuery.isLoading}
        />
        <StatCard
          icon={Gauge}
          label="Avg Latency"
          value={formatLatency(avgLatency)}
          sub="p50 across endpoints"
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-300"
          loading={usageQuery.isLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="keys" className="text-xs sm:text-sm">
            <Key className="size-3.5 mr-1.5" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="docs" className="text-xs sm:text-sm">
            <BookOpen className="size-3.5 mr-1.5" />
            Docs
          </TabsTrigger>
          <TabsTrigger value="playground" className="text-xs sm:text-sm">
            <Terminal className="size-3.5 mr-1.5" />
            Playground
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            <BarChart3 className="size-3.5 mr-1.5" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* API Keys tab */}
        <TabsContent value="keys" className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="keys-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {keysQuery.isLoading ? (
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ) : keysQuery.isError ? (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-rose-600">
                    Failed to load API keys.{' '}
                    <Button variant="link" onClick={() => keysQuery.refetch()}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : keys.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Key className="size-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">No API keys yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate your first key to start using the API.
                    </p>
                    <Button
                      onClick={() => setGenerateOpen(true)}
                      className="mt-4 bg-shopee text-white hover:bg-shopee-dark"
                    >
                      <Plus className="size-4 mr-1.5" />
                      Generate New Key
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <KeysTable
                  keys={keys}
                  onCopy={handleCopy}
                  onEdit={(k) => setEditKey(k)}
                  onRevoke={(k) => setRevokeKey(k)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Documentation tab */}
        <TabsContent value="docs" className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="docs-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <DocsTab />
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Playground tab */}
        <TabsContent value="playground" className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="playground-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {keysQuery.isLoading ? (
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              ) : (
                <PlaygroundTab keys={keys} />
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Analytics tab */}
        <TabsContent value="analytics" className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {usageQuery.isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-1/3 mb-3" />
                      <Skeleton className="h-[260px] w-full" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-1/3 mb-3" />
                      <Skeleton className="h-[260px] w-full" />
                    </CardContent>
                  </Card>
                </div>
              ) : usageQuery.isError || !analytics ? (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-rose-600">
                    Failed to load usage analytics.{' '}
                    <Button variant="link" onClick={() => usageQuery.refetch()}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <AnalyticsTab analytics={analytics} />
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <GenerateKeyDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={setNewKey}
      />
      <OneTimeKeyDialog newKey={newKey} onClose={() => setNewKey(null)} />
      {editKey && (
        <EditKeyDialog
          key={editKey.id}
          keyObj={editKey}
          onClose={() => setEditKey(null)}
        />
      )}
      <RevokeKeyDialog keyObj={revokeKey} onClose={() => setRevokeKey(null)} />
    </div>
  )
}
