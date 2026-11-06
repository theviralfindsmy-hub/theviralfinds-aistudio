'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  DollarSign,
  MousePointerClick,
  Target,
  Plus,
  MoreHorizontal,
  Mail,
  Trash2,
  Shield,
  Crown,
  UserCog,
  Eye,
  Link2,
  FileText,
  TrendingUp,
  Activity,
  Settings as SettingsIcon,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  UserPlus,
  Sparkles,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  DropdownMenuLabel,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import type {
  Team,
  TeamMember,
  TeamInvitation,
  TeamStats,
  SharedResource,
  TeamActivity,
  TeamAnalytics,
  TeamRole,
} from '@/lib/team/types'
import { ROLE_PERMISSIONS, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/team/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRM(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-MY')
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const ROLE_BADGE_CLASS: Record<TeamRole, string> = {
  owner: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  admin: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  member: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  viewer: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
}

const ROLE_ICON: Record<TeamRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: UserCog,
  viewer: Eye,
}

const PLATFORM_COLORS: Record<string, string> = {
  shopee: '#ee4d2d',
  tiktok: '#ec4899',
  lazada: '#0fbd6e',
}

const CHART_COLORS = ['#ee4d2d', '#ec4899', '#0fbd6e', '#f59e0b', '#8b5cf6', '#06b6d4']

// ─── API fetchers ───────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  loading,
}: {
  icon: typeof Users
  label: string
  value: string
  sub?: string
  accent: string
  loading?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
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

function RoleBadge({ role }: { role: TeamRole }) {
  const Icon = ROLE_ICON[role]
  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', ROLE_BADGE_CLASS[role])}>
      <Icon className="size-3" />
      {ROLE_LABELS[role]}
    </Badge>
  )
}

function MemberAvatar({ name, color, initials }: { name: string; color: string; initials: string }) {
  return (
    <Avatar className="size-8 border border-border">
      <AvatarFallback className={cn('text-white text-xs font-semibold', color)}>
        {initials || name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

// ─── Tab: Overview ──────────────────────────────────────────────────────────

function OverviewTab({
  team,
  stats,
  activities,
  members,
  loading,
}: {
  team: Team | undefined
  stats: TeamStats | undefined
  activities: TeamActivity[]
  members: TeamMember[]
  loading: boolean
}) {
  const topContributors = useMemo(() => {
    return members
      .slice()
      .sort((a, b) => b.contribution.earningsGenerated - a.contribution.earningsGenerated)
      .slice(0, 5)
  }, [members])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Team summary */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Team Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading || !team || !stats ? (
            <>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">{team.description}</p>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <Badge variant="outline" className="capitalize">{team.plan}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Niches</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {team.niches.map((n) => (
                      <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Limit</span>
                  <span className="font-medium tabular-nums">
                    {stats.totalMembers} / {team.memberLimit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Invitations</span>
                  <span className="font-medium tabular-nums">{stats.pendingInvitations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Conversion Rate</span>
                  <span className="font-medium tabular-nums">{stats.avgConversionRate.toFixed(2)}%</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-rose-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity yet. Be the first to share!
            </p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="size-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                    <Activity className="size-3.5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="leading-snug">
                      <span className="font-medium text-foreground">{a.actorName}</span>{' '}
                      <span className="text-muted-foreground">{a.description}</span>
                      {a.targetName && (
                        <>
                          {' '}
                          <span className="font-medium text-foreground">{a.targetName}</span>
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top contributors leaderboard */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="size-4 text-amber-500" />
            Top Contributors Leaderboard
          </CardTitle>
          <CardDescription>Members ranked by total earnings generated</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topContributors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No contributions yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {topContributors.map((m, idx) => (
                <Card
                  key={m.id}
                  className={cn(
                    'relative overflow-hidden',
                    idx === 0 && 'border-amber-500/40 bg-amber-500/5',
                    idx === 1 && 'border-slate-400/40 bg-slate-400/5',
                    idx === 2 && 'border-orange-700/40 bg-orange-700/5',
                  )}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="absolute top-2 right-2 text-xs font-bold text-muted-foreground">
                      #{idx + 1}
                    </div>
                    <div className="flex justify-center">
                      <MemberAvatar name={m.name} color={m.avatarColor} initials={m.initials} />
                    </div>
                    <p className="text-sm font-medium truncate">{m.name.trim()}</p>
                    <p className="text-base font-bold text-emerald-600">
                      {formatRM(m.contribution.earningsGenerated)}
                    </p>
                    <div className="flex justify-around text-[11px] text-muted-foreground">
                      <span>{formatNumber(m.contribution.clicksGenerated)} clicks</span>
                      <span>{m.contribution.conversionsGenerated} conv</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab: Members ───────────────────────────────────────────────────────────

function MembersTab({
  teamId,
  members,
  invitations,
  loading,
  currentUserRole,
  onInvite,
  onRemove,
  onRoleChange,
}: {
  teamId: string
  members: TeamMember[]
  invitations: TeamInvitation[]
  loading: boolean
  currentUserRole: TeamRole
  onInvite: (email: string, role: TeamRole, message?: string) => void
  onRemove: (memberId: string, name: string) => void
  onRoleChange: (memberId: string, role: TeamRole) => void
}) {
  void teamId
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('member')
  const [inviteMessage, setInviteMessage] = useState('')

  const perms = ROLE_PERMISSIONS[currentUserRole]

  const handleSendInvite = () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address')
      return
    }
    onInvite(inviteEmail, inviteRole, inviteMessage)
    setInviteEmail('')
    setInviteRole('member')
    setInviteMessage('')
    setInviteOpen(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-rose-500" />
              Team Members ({members.length})
            </CardTitle>
            <CardDescription>Manage who has access to this team</CardDescription>
          </div>
          {perms.canInviteMembers && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
                  <UserPlus className="size-4 mr-1" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation by email. The recipient will join once they accept.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as TeamRole)}
                    >
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member — can share & view analytics</SelectItem>
                        <SelectItem value="viewer">Viewer — read-only access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-message">Invitation Message (optional)</Label>
                    <Textarea
                      id="invite-message"
                      placeholder="Welcome to our team!"
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendInvite} className="bg-rose-500 hover:bg-rose-600 text-white">
                    <Mail className="size-4 mr-1" />
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Links</TableHead>
                    <TableHead className="text-right">Content</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    {perms.canRemoveMembers && <TableHead className="w-10"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MemberAvatar name={m.name} color={m.avatarColor} initials={m.initials} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.name.trim()}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Active {timeAgo(m.lastActiveAt)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                      <TableCell>
                        {perms.canChangeRoles && m.role !== 'owner' ? (
                          <Select
                            value={m.role}
                            onValueChange={(v) => onRoleChange(m.id, v as TeamRole)}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <RoleBadge role={m.role} />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(m.joinedAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(m.contribution.linksShared)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(m.contribution.contentCreated)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(m.contribution.clicksGenerated)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium text-emerald-600">
                        {formatRM(m.contribution.earningsGenerated)}
                      </TableCell>
                      {perms.canRemoveMembers && (
                        <TableCell>
                          {m.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-700"
                                  onClick={() => onRemove(m.id, m.name.trim())}
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="size-4 text-amber-500" />
              Pending Invitations ({invitations.length})
            </CardTitle>
            <CardDescription>Awaiting acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{inv.email}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {inv.role}
                      </Badge>
                    </div>
                    {inv.message && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        &ldquo;{inv.message}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Invited by {inv.invitedBy} · {timeAgo(inv.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-700 border-amber-500/30">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Tab: Shared Resources ──────────────────────────────────────────────────

function SharedResourcesTab({
  resources,
  loading,
  onAddResource,
  canShare,
}: {
  resources: SharedResource[]
  loading: boolean
  onAddResource: (resource: Omit<SharedResource, 'id' | 'teamId' | 'createdAt' | 'ownerId' | 'ownerName' | 'clicks' | 'conversions' | 'earnings' | 'usageCount'>) => void
  canShare: boolean
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [addType, setAddType] = useState<'affiliate_link' | 'content'>('affiliate_link')
  const [addTitle, setAddTitle] = useState('')
  const [addProduct, setAddProduct] = useState('')
  const [addPlatform, setAddPlatform] = useState<'shopee' | 'tiktok' | 'lazada'>('shopee')
  const [addUrl, setAddUrl] = useState('')
  const [addContentType, setAddContentType] = useState<'caption' | 'video_script' | 'image_prompt' | 'review' | 'tutorial'>('caption')
  const [addNiche, setAddNiche] = useState('')

  const affiliateLinks = resources.filter((r) => r.type === 'affiliate_link')
  const contentLibrary = resources.filter((r) => r.type === 'content')

  const reset = () => {
    setAddTitle('')
    setAddProduct('')
    setAddUrl('')
    setAddNiche('')
  }

  const handleAdd = () => {
    if (!addTitle.trim()) {
      toast.error('Title is required')
      return
    }
    onAddResource({
      type: addType,
      title: addTitle,
      product: addType === 'affiliate_link' ? addProduct : undefined,
      platform: addType === 'affiliate_link' ? addPlatform : undefined,
      affiliateUrl: addType === 'affiliate_link' ? addUrl : undefined,
      contentType: addType === 'content' ? addContentType : undefined,
      niche: addType === 'content' ? addNiche : undefined,
      tags: [],
    })
    reset()
    setAddOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Shared Affiliate Links */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="size-4 text-rose-500" />
              Shared Affiliate Links ({affiliateLinks.length})
            </CardTitle>
            <CardDescription>Top-performing affiliate links shared by the team</CardDescription>
          </div>
          {canShare && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAddType('affiliate_link')
                setAddOpen(true)
              }}
            >
              <Plus className="size-4 mr-1" />
              Share Link
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : affiliateLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No shared affiliate links yet. Share your top performers with the team!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliateLinks.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-xs">{r.title}</p>
                          {r.product && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                              {r.product}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="capitalize text-[10px]"
                          style={{
                            color: PLATFORM_COLORS[r.platform || 'shopee'],
                            borderColor: PLATFORM_COLORS[r.platform || 'shopee'] + '40',
                          }}
                        >
                          {r.platform || 'shopee'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.ownerName}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(r.clicks || 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(r.conversions || 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium text-emerald-600">
                        {formatRM(r.earnings || 0)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                if (r.affiliateUrl) {
                                  navigator.clipboard.writeText(r.affiliateUrl)
                                  toast.success('Affiliate URL copied to clipboard')
                                }
                              }}
                            >
                              <Copy className="size-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            {r.affiliateUrl && (
                              <DropdownMenuItem asChild>
                                <a href={r.affiliateUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="size-4 mr-2" />
                                  Open URL
                                </a>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared Content Library */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4 text-emerald-500" />
              Shared Content Library ({contentLibrary.length})
            </CardTitle>
            <CardDescription>Reusable content templates and assets</CardDescription>
          </div>
          {canShare && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAddType('content')
                setAddOpen(true)
              }}
            >
              <Plus className="size-4 mr-1" />
              Add Content
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : contentLibrary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No shared content yet. Add captions, scripts, and templates for the team!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contentLibrary.map((r) => (
                <Card key={r.id} className="border-dashed">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {r.contentType?.replace('_', ' ')} · {r.niche}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {r.contentType?.replace('_', ' ')}
                      </Badge>
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>By {r.ownerName}</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="size-3" />
                        {r.usageCount || 0} uses
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add shared resource dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Share {addType === 'affiliate_link' ? 'Affiliate Link' : 'Content'}
            </DialogTitle>
            <DialogDescription>
              Add this resource to the team&apos;s shared library.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-title">Title</Label>
              <Input
                id="add-title"
                placeholder={addType === 'affiliate_link' ? 'Product name' : 'Content title'}
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
              />
            </div>

            {addType === 'affiliate_link' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="add-product">Product Name</Label>
                  <Input
                    id="add-product"
                    placeholder="e.g. Xiaomi Redmi Note 13 Pro 5G"
                    value={addProduct}
                    onChange={(e) => setAddProduct(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="add-platform">Platform</Label>
                    <Select
                      value={addPlatform}
                      onValueChange={(v) => setAddPlatform(v as 'shopee' | 'tiktok' | 'lazada')}
                    >
                      <SelectTrigger id="add-platform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shopee">Shopee</SelectItem>
                        <SelectItem value="tiktok">TikTok Shop</SelectItem>
                        <SelectItem value="lazada">Lazada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-url">Affiliate URL</Label>
                    <Input
                      id="add-url"
                      placeholder="https://shopee.my/aff/..."
                      value={addUrl}
                      onChange={(e) => setAddUrl(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="add-content-type">Content Type</Label>
                    <Select
                      value={addContentType}
                      onValueChange={(v) =>
                        setAddContentType(v as 'caption' | 'video_script' | 'image_prompt' | 'review' | 'tutorial')
                      }
                    >
                      <SelectTrigger id="add-content-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caption">Caption</SelectItem>
                        <SelectItem value="video_script">Video Script</SelectItem>
                        <SelectItem value="image_prompt">Image Prompt</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-niche">Niche</Label>
                    <Input
                      id="add-niche"
                      placeholder="e.g. Beauty"
                      value={addNiche}
                      onChange={(e) => setAddNiche(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} className="bg-rose-500 hover:bg-rose-600 text-white">
              <Plus className="size-4 mr-1" />
              Share with Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Tab: Analytics ─────────────────────────────────────────────────────────

function AnalyticsTab({
  analytics,
  loading,
}: {
  analytics: TeamAnalytics | undefined
  loading: boolean
}) {
  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={MousePointerClick}
          label="Total Clicks"
          value={formatNumber(analytics.summary.totalClicks)}
          accent="bg-rose-500/10 text-rose-500"
        />
        <StatCard
          icon={Target}
          label="Conversions"
          value={formatNumber(analytics.summary.totalConversions)}
          accent="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          icon={DollarSign}
          label="Total Earnings"
          value={formatRM(analytics.summary.totalEarnings)}
          accent="bg-amber-500/10 text-amber-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Conv. Rate"
          value={`${analytics.summary.avgConversionRate.toFixed(2)}%`}
          accent="bg-purple-500/10 text-purple-500"
        />
      </div>

      {/* Earnings trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-500" />
            Combined Earnings Trend
          </CardTitle>
          <CardDescription>Last 12 months of team earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  tickFormatter={(v) => `RM ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  formatter={(value: number) => [formatRM(value), 'Earnings']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-member contribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-rose-500" />
              Per-Member Contribution
            </CardTitle>
            <CardDescription>Clicks generated by each team member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.perMember}
                  layout="vertical"
                  margin={{ top: 5, right: 20, bottom: 5, left: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), 'Clicks']}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                  />
                  <Bar dataKey="clicks" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4 text-purple-500" />
              Platform Distribution
            </CardTitle>
            <CardDescription>Earnings split across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.platformDistribution}
                    dataKey="earnings"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    label={(entry) => `${entry.platform}`}
                    labelLine={false}
                  >
                    {analytics.platformDistribution.map((entry, idx) => (
                      <Cell
                        key={entry.platform}
                        fill={PLATFORM_COLORS[entry.platform] || CHART_COLORS[idx % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatRM(value)}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top performing shared links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="size-4 text-rose-500" />
            Top Performing Shared Links
          </CardTitle>
          <CardDescription>Best converting affiliate links in the team library</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topSharedLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No shared links with performance data yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topSharedLinks.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <p className="text-sm font-medium truncate max-w-xs">{l.title}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {l.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.ownerName}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(l.clicks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(l.conversions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium text-emerald-600">
                        {formatRM(l.earnings)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab: Settings ──────────────────────────────────────────────────────────

function SettingsTab({
  team,
  loading,
  canDelete,
  onSave,
  onDelete,
}: {
  team: Team | undefined
  loading: boolean
  canDelete: boolean
  onSave: (updates: { name: string; description: string; defaultRole: TeamRole }) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(team?.name ?? '')
  const [description, setDescription] = useState(team?.description ?? '')
  const [defaultRole, setDefaultRole] = useState<TeamRole>(team?.defaultRole ?? 'member')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  if (loading || !team) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const hasChanges =
    name !== team.name || description !== team.description || defaultRole !== team.defaultRole

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SettingsIcon className="size-4 text-rose-500" />
            Team Settings
          </CardTitle>
          <CardDescription>Update team information and defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this team about?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-role">Default Role for New Members</Label>
            <Select
              value={defaultRole}
              onValueChange={(v) => setDefaultRole(v as TeamRole)}
            >
              <SelectTrigger id="default-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {ROLE_DESCRIPTIONS[defaultRole]}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => onSave({ name, description, defaultRole })}
              disabled={!hasChanges || !name.trim()}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Check className="size-4 mr-1" />
              Save Changes
            </Button>
            {hasChanges && (
              <Button
                variant="outline"
                onClick={() => {
                  setName(team.name)
                  setDescription(team.description)
                  setDefaultRole(team.defaultRole)
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Member Limit</CardTitle>
          <CardDescription>Based on your current subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {team.memberCount}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  / {team.memberLimit} members
                </span>
              </p>
              <Badge variant="outline" className="mt-1 capitalize">{team.plan} plan</Badge>
            </div>
            <Button variant="outline" size="sm">
              <Sparkles className="size-4 mr-1" />
              Upgrade Plan
            </Button>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (team.memberCount / team.memberLimit) * 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {canDelete && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="size-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete this team and remove all members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="size-4 mr-1" />
                  Delete Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete &ldquo;{team.name}&rdquo;?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. All members will be removed and all shared
                    resources will be permanently deleted. Type the team name to confirm.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Input
                    placeholder={team.name}
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleteConfirm !== team.name}
                    onClick={() => {
                      onDelete()
                      setDeleteOpen(false)
                      setDeleteConfirm('')
                    }}
                  >
                    <Trash2 className="size-4 mr-1" />
                    Delete Forever
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Create Team Dialog ─────────────────────────────────────────────────────

function CreateTeamDialog({
  onCreate,
}: {
  onCreate: (name: string, description: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = () => {
    if (!name.trim() || name.trim().length < 3) {
      toast.error('Team name must be at least 3 characters')
      return
    }
    onCreate(name.trim(), description.trim())
    setName('')
    setDescription('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-rose-500 hover:bg-rose-600 text-white">
          <Plus className="size-4 mr-1" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Start a new team to collaborate with other affiliates.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-team-name">Team Name</Label>
            <Input
              id="new-team-name"
              placeholder="e.g. Beauty Bosses Agency"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-team-description">Description (optional)</Label>
            <Textarea
              id="new-team-description"
              placeholder="What is this team about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} className="bg-rose-500 hover:bg-rose-600 text-white">
            <Building2 className="size-4 mr-1" />
            Create Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function TeamPage() {
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch list of teams
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: () =>
      fetchJSON<{ teams: Team[]; total: number; source: string }>('/api/team'),
    staleTime: 30_000,
  })

  // Derive the effective team id: prefer the user's selection, but fall back
  // to the first team if the selection is stale or unset.
  const teams = teamsQuery.data?.teams ?? []
  const selectedStillExists =
    selectedTeamId != null && teams.some((t) => t.id === selectedTeamId)
  const currentTeamId =
    (selectedStillExists ? selectedTeamId : teams[0]?.id) || ''

  // Fetch team detail (members, invitations, stats)
  const teamDetailQuery = useQuery({
    queryKey: ['team', currentTeamId],
    queryFn: () =>
      fetchJSON<{
        team: Team
        members: TeamMember[]
        invitations: TeamInvitation[]
        stats: TeamStats
        source: string
      }>(`/api/team/${currentTeamId}`),
    enabled: !!currentTeamId,
    staleTime: 30_000,
  })

  // Fetch activities (derived from mock data via team detail)
  // Activities are also part of mock-data but not exposed via API; we'll
  // reconstruct from the team detail's invitation timeline + member join dates.
  const activities: TeamActivity[] = useMemo(() => {
    if (!teamDetailQuery.data) return []
    const { members, invitations } = teamDetailQuery.data
    const acts: TeamActivity[] = []

    for (const m of members) {
      acts.push({
        id: `act_join_${m.id}`,
        teamId: currentTeamId,
        type: 'member_joined',
        actorId: m.userId,
        actorName: m.name.trim(),
        description: 'joined the team',
        createdAt: m.joinedAt,
      })
    }
    for (const inv of invitations) {
      acts.push({
        id: `act_inv_${inv.id}`,
        teamId: currentTeamId,
        type: 'member_invited',
        actorId: 'unknown',
        actorName: inv.invitedBy,
        targetName: inv.email,
        description: 'invited a new member',
        createdAt: inv.createdAt,
      })
    }
    return acts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
  }, [teamDetailQuery.data, currentTeamId])

  // Fetch shared resources
  const sharedQuery = useQuery({
    queryKey: ['team-shared', currentTeamId],
    queryFn: () =>
      fetchJSON<{ resources: SharedResource[]; total: number; source: string }>(
        `/api/team/${currentTeamId}/shared`,
      ),
    enabled: !!currentTeamId,
    staleTime: 30_000,
  })

  // Fetch analytics
  const analyticsQuery = useQuery({
    queryKey: ['team-analytics', currentTeamId],
    queryFn: () =>
      fetchJSON<{ analytics: TeamAnalytics; source: string }>(
        `/api/team/${currentTeamId}/analytics`,
      ),
    enabled: !!currentTeamId,
    staleTime: 30_000,
  })

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      fetchJSON<{ team: Team; source: string }>('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      } as unknown as RequestInit),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setSelectedTeamId(data.team.id)
      toast.success(`Team "${data.team.name}" created!`)
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create team'),
  })

  const inviteMemberMutation = useMutation({
    mutationFn: (input: { email: string; role: TeamRole; message?: string }) =>
      fetchJSON<{ invitation: TeamInvitation; source: string }>(
        `/api/team/${currentTeamId}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        } as unknown as RequestInit,
      ),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['team', currentTeamId] })
      toast.success(`Invitation sent to ${vars.email}`)
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to send invitation'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      fetchJSON<{ success: boolean; source: string }>(
        `/api/team/${currentTeamId}/members?memberId=${memberId}`,
        { method: 'DELETE' } as unknown as RequestInit,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', currentTeamId] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Member removed')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to remove member'),
  })

  const updateRoleMutation = useMutation({
    mutationFn: (input: { memberId: string; role: TeamRole }) =>
      fetchJSON<{ member: TeamMember; source: string }>(
        `/api/team/${currentTeamId}/members`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        } as unknown as RequestInit,
      ),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['team', currentTeamId] })
      toast.success(`Role updated to ${ROLE_LABELS[vars.role]}`)
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update role'),
  })

  const addResourceMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      fetchJSON<{ resource: SharedResource; source: string }>(
        `/api/team/${currentTeamId}/shared`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        } as unknown as RequestInit,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-shared', currentTeamId] })
      toast.success('Resource shared with the team')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to add resource'),
  })

  const updateTeamMutation = useMutation({
    mutationFn: (input: { name: string; description: string; defaultRole: TeamRole }) =>
      fetchJSON<{ team: Team; source: string }>(`/api/team/${currentTeamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      } as unknown as RequestInit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', currentTeamId] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team settings saved')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save settings'),
  })

  const deleteTeamMutation = useMutation({
    mutationFn: () =>
      fetchJSON<{ success: boolean; source: string }>(`/api/team/${currentTeamId}`, {
        method: 'DELETE',
      } as unknown as RequestInit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setSelectedTeamId(null)
      toast.success('Team deleted')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete team'),
  })

  // Determine current user's role within the team (mock = owner of every team)
  const currentUserRole: TeamRole = 'owner'
  const perms = ROLE_PERMISSIONS[currentUserRole]

  const team = teamDetailQuery.data?.team
  const members = teamDetailQuery.data?.members || []
  const invitations = teamDetailQuery.data?.invitations || []
  const stats = teamDetailQuery.data?.stats
  const resources = sharedQuery.data?.resources || []
  const analytics = analyticsQuery.data?.analytics
  const isLoading = teamsQuery.isLoading || teamDetailQuery.isLoading

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                <Building2 className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Team Dashboard</h1>
                <p className="text-sm text-muted-foreground">Collaborate. Share. Scale.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {teamsQuery.data && teamsQuery.data.teams.length > 0 && (
              <Select value={currentTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teamsQuery.data.teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn('size-2 rounded-full', t.avatarColor)} />
                        <span>{t.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({t.memberCount})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                teamsQuery.refetch()
                teamDetailQuery.refetch()
                sharedQuery.refetch()
                analyticsQuery.refetch()
              }}
              title="Refresh"
            >
              <RefreshCw className={cn('size-4', teamsQuery.isFetching && 'animate-spin')} />
            </Button>
            <CreateTeamDialog onCreate={(n, d) => createTeamMutation.mutate({ name: n, description: d })} />
          </div>
        </div>

        {/* Selected team banner */}
        {team && (
          <Card className="border-rose-500/20 bg-rose-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className={cn('size-10 rounded-lg flex items-center justify-center text-white', team.avatarColor)}>
                  <Building2 className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold truncate">{team.name}</h2>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {team.plan} plan
                    </Badge>
                    <RoleBadge role={currentUserRole} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Owned by {team.ownerName} · {team.memberCount} members · {team.niches.join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            icon={Users}
            label="Team Members"
            value={stats ? `${stats.totalMembers}` : '—'}
            sub={stats ? `${stats.activeMembers} active · ${stats.pendingInvitations} pending` : undefined}
            accent="bg-rose-500/10 text-rose-500"
            loading={isLoading}
          />
          <StatCard
            icon={DollarSign}
            label="Combined Earnings"
            value={stats ? formatRM(stats.combinedEarnings) : '—'}
            sub={stats ? `+${stats.earningsGrowth}% vs last month` : undefined}
            accent="bg-emerald-500/10 text-emerald-500"
            loading={isLoading}
          />
          <StatCard
            icon={MousePointerClick}
            label="Combined Clicks"
            value={stats ? formatNumber(stats.combinedClicks) : '—'}
            sub={stats ? `+${stats.clicksGrowth}% vs last month` : undefined}
            accent="bg-amber-500/10 text-amber-500"
            loading={isLoading}
          />
          <StatCard
            icon={Target}
            label="Combined Conversions"
            value={stats ? formatNumber(stats.combinedConversions) : '—'}
            sub={stats ? `${stats.avgConversionRate.toFixed(2)}% conv rate` : undefined}
            accent="bg-purple-500/10 text-purple-500"
            loading={isLoading}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      {currentTeamId ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="gap-1">
              <Activity className="size-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1">
              <Users className="size-3.5" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-1">
              <Link2 className="size-3.5" />
              <span className="hidden sm:inline">Shared</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1">
              <TrendingUp className="size-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            {perms.canManageSettings && (
              <TabsTrigger value="settings" className="gap-1">
                <SettingsIcon className="size-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <OverviewTab
                  team={team}
                  stats={stats}
                  activities={activities}
                  members={members}
                  loading={isLoading}
                />
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <MembersTab
                  teamId={currentTeamId}
                  members={members}
                  invitations={invitations}
                  loading={isLoading}
                  currentUserRole={currentUserRole}
                  onInvite={(email, role, message) =>
                    inviteMemberMutation.mutate({ email, role, message })
                  }
                  onRemove={(memberId, name) => {
                    if (confirm(`Remove ${name} from this team?`)) {
                      removeMemberMutation.mutate(memberId)
                    }
                  }}
                  onRoleChange={(memberId, role) =>
                    updateRoleMutation.mutate({ memberId, role })
                  }
                />
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="shared" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <SharedResourcesTab
                  resources={resources}
                  loading={sharedQuery.isLoading}
                  onAddResource={(r) => addResourceMutation.mutate(r)}
                  canShare={perms.canShareResources}
                />
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AnalyticsTab analytics={analytics} loading={analyticsQuery.isLoading} />
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {perms.canManageSettings && (
            <TabsContent value="settings" className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <SettingsTab
                    key={team?.id ?? 'no-team'}
                    team={team}
                    loading={isLoading}
                    canDelete={perms.canDeleteTeam}
                    onSave={(updates) => updateTeamMutation.mutate(updates)}
                    onDelete={() => deleteTeamMutation.mutate()}
                  />
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center space-y-4">
            <div className="flex justify-center">
              <Building2 className="size-12 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">No team selected</h3>
              <p className="text-sm text-muted-foreground">
                Create your first team to start collaborating.
              </p>
            </div>
            <CreateTeamDialog
              onCreate={(n, d) => createTeamMutation.mutate({ name: n, description: d })}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
