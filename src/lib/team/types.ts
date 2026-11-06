/**
 * Fasa 4.3 — Team/Agency Multi-User Dashboard
 *
 * Shared types for the team module. Used by both the mock data layer and
 * the API routes / page component.
 */

/** Roles available within a team. Ordered by ascending permission level. */
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

/** Subscription plan that determines the team member limit. */
export type TeamPlan = 'free' | 'agency' | 'enterprise'

export interface Team {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  memberCount: number
  memberLimit: number
  plan: TeamPlan
  niches: string[]
  avatarColor: string
  /** ISO date string */
  createdAt: string
  defaultRole: TeamRole
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  name: string
  email: string
  avatarColor: string
  initials: string
  role: TeamRole
  /** ISO date string */
  joinedAt: string
  lastActiveAt: string
  status: 'active' | 'invited' | 'suspended'
  contribution: {
    linksShared: number
    contentCreated: number
    clicksGenerated: number
    conversionsGenerated: number
    earningsGenerated: number
  }
}

export interface TeamInvitation {
  id: string
  teamId: string
  teamName: string
  email: string
  role: TeamRole
  invitedBy: string
  message?: string
  /** ISO date string */
  createdAt: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt: string
}

export type SharedResourceType = 'affiliate_link' | 'content'

export interface SharedResource {
  id: string
  teamId: string
  type: SharedResourceType
  title: string
  description?: string
  /** For affiliate links */
  product?: string
  platform?: 'shopee' | 'tiktok' | 'lazada'
  affiliateUrl?: string
  clicks?: number
  conversions?: number
  earnings?: number
  /** For content pieces */
  contentType?: 'caption' | 'video_script' | 'image_prompt' | 'review' | 'tutorial'
  niche?: string
  usageCount?: number
  /** Owner information */
  ownerId: string
  ownerName: string
  createdAt: string
  tags: string[]
}

export interface TeamStats {
  teamId: string
  totalMembers: number
  activeMembers: number
  pendingInvitations: number
  combinedClicks: number
  combinedConversions: number
  combinedEarnings: number
  combinedLinksShared: number
  combinedContentCreated: number
  avgConversionRate: number
  /** Month-over-month growth % */
  earningsGrowth: number
  clicksGrowth: number
}

export interface TeamActivity {
  id: string
  teamId: string
  type:
    | 'member_joined'
    | 'member_invited'
    | 'member_left'
    | 'link_shared'
    | 'content_created'
    | 'role_changed'
    | 'team_updated'
    | 'invitation_accepted'
  actorId: string
  actorName: string
  targetName?: string
  description: string
  createdAt: string
}

export interface TeamAnalyticsTrendPoint {
  date: string
  clicks: number
  conversions: number
  earnings: number
}

export interface TeamMemberContribution {
  memberId: string
  name: string
  initials: string
  avatarColor: string
  clicks: number
  conversions: number
  earnings: number
}

export interface PlatformDistribution {
  platform: string
  clicks: number
  conversions: number
  earnings: number
}

export interface TeamAnalytics {
  teamId: string
  summary: {
    totalClicks: number
    totalConversions: number
    totalEarnings: number
    avgConversionRate: number
  }
  trend: TeamAnalyticsTrendPoint[]
  perMember: TeamMemberContribution[]
  platformDistribution: PlatformDistribution[]
  topSharedLinks: Array<{
    id: string
    title: string
    product: string
    platform: string
    clicks: number
    conversions: number
    earnings: number
    ownerName: string
  }>
}

export interface TeamListResponse {
  teams: Team[]
  total: number
  source: 'mock'
}

export interface TeamDetailResponse {
  team: Team
  members: TeamMember[]
  invitations: TeamInvitation[]
  stats: TeamStats
  source: 'mock'
}

export interface TeamAnalyticsResponse {
  analytics: TeamAnalytics
  source: 'mock'
}

export interface TeamSharedResponse {
  resources: SharedResource[]
  total: number
  source: 'mock'
}

export interface CreateTeamRequest {
  name: string
  description?: string
  niches?: string[]
}

export interface InviteMemberRequest {
  email: string
  role: TeamRole
  message?: string
}

export interface UpdateRoleRequest {
  memberId: string
  role: TeamRole
}

export interface AddSharedResourceRequest {
  type: SharedResourceType
  title: string
  description?: string
  product?: string
  platform?: 'shopee' | 'tiktok' | 'lazada'
  affiliateUrl?: string
  contentType?: 'caption' | 'video_script' | 'image_prompt' | 'review' | 'tutorial'
  niche?: string
  tags?: string[]
}

/** Permission matrix — can the given role perform the action? */
export const ROLE_PERMISSIONS: Record<
  TeamRole,
  {
    canManageSettings: boolean
    canInviteMembers: boolean
    canRemoveMembers: boolean
    canChangeRoles: boolean
    canDeleteTeam: boolean
    canShareResources: boolean
    canViewAnalytics: boolean
  }
> = {
  owner: {
    canManageSettings: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRoles: true,
    canDeleteTeam: true,
    canShareResources: true,
    canViewAnalytics: true,
  },
  admin: {
    canManageSettings: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRoles: true,
    canDeleteTeam: false,
    canShareResources: true,
    canViewAnalytics: true,
  },
  member: {
    canManageSettings: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    canDeleteTeam: false,
    canShareResources: true,
    canViewAnalytics: true,
  },
  viewer: {
    canManageSettings: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    canDeleteTeam: false,
    canShareResources: false,
    canViewAnalytics: true,
  },
}

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  owner: 'Full control. Can delete team and transfer ownership.',
  admin: 'Can manage members, settings, and shared resources.',
  member: 'Can share resources and view analytics.',
  viewer: 'Read-only access to team data and analytics.',
}

/** Map plan to its maximum member count. */
export const PLAN_MEMBER_LIMITS: Record<TeamPlan, number> = {
  free: 3,
  agency: 15,
  enterprise: 50,
}
