import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/team/[id]
 *
 * Return a single team with its members, pending invitations, and aggregated stats.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const team = await db.team.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: { joinedAt: 'asc' },
        },
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'db' },
        { status: 404 },
      )
    }

    // Get invitations for this team
    const invitations = await db.teamInvitation.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'desc' },
    })

    // Compute stats from affiliate links owned by team members
    const memberUserIds = team.members.map((m) => m.userId)
    const links = await db.affiliateLink.findMany({
      where: { userId: { in: memberUserIds } },
      include: {
        clickRecords: true,
        conversionRecords: true,
      },
    })

    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0)
    const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0)
    const totalEarnings = links.reduce((sum, l) => sum + Number(l.earnings), 0)
    const activeMembers = team.members.filter((m) => m.status === 'active').length
    const pendingInvitations = invitations.filter((i) => i.status === 'pending').length

    const stats = {
      teamId: team.id,
      totalMembers: team.members.length,
      activeMembers,
      pendingInvitations,
      combinedClicks: totalClicks,
      combinedConversions: totalConversions,
      combinedEarnings: totalEarnings,
      combinedLinksShared: links.length,
      combinedContentCreated: 0,
      avgConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      earningsGrowth: 0,
      clicksGrowth: 0,
    }

    const teamResponse = {
      id: team.id,
      name: team.name,
      description: team.description ?? '',
      ownerId: team.ownerId,
      memberCount: team.members.length,
      memberLimit: team.maxMembers,
      plan: team.plan as 'free' | 'agency' | 'enterprise',
      niches: [],
      avatarColor: '',
      createdAt: team.createdAt.toISOString(),
      defaultRole: 'member' as const,
    }

    const membersResponse = team.members.map((m) => ({
      id: m.id,
      teamId: m.teamId,
      userId: m.userId,
      name: '',
      email: '',
      avatarColor: '',
      initials: '',
      role: m.role as 'owner' | 'admin' | 'member' | 'viewer',
      joinedAt: m.joinedAt.toISOString(),
      lastActiveAt: m.joinedAt.toISOString(),
      status: m.status as 'active' | 'invited' | 'suspended',
      contribution: {
        linksShared: 0,
        contentCreated: 0,
        clicksGenerated: 0,
        conversionsGenerated: 0,
        earningsGenerated: 0,
      },
    }))

    const invitationsResponse = invitations.map((inv) => ({
      id: inv.id,
      teamId: inv.teamId,
      teamName: team.name,
      email: inv.email,
      role: inv.role as 'owner' | 'admin' | 'member' | 'viewer',
      invitedBy: '',
      message: '',
      createdAt: inv.createdAt.toISOString(),
      status: inv.status as 'pending' | 'accepted' | 'declined' | 'expired',
      expiresAt: inv.expiresAt.toISOString(),
    }))

    return NextResponse.json(
      {
        team: teamResponse,
        members: membersResponse,
        invitations: invitationsResponse,
        stats,
        source: 'db' as const,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[/api/team/[id] GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch team',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/team/[id]
 *
 * Update team name, description, plan, or maxMembers.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.team.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Team not found', source: 'db' },
        { status: 404 },
      )
    }

    const updated = await db.team.update({
      where: { id },
      data: {
        name: typeof body.name === 'string' ? body.name.trim() : undefined,
        description: typeof body.description === 'string' ? body.description : undefined,
        plan: typeof body.plan === 'string' ? body.plan : undefined,
        maxMembers: typeof body.maxMembers === 'number' ? body.maxMembers : undefined,
      },
      include: { members: true },
    })

    const teamResponse = {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? '',
      ownerId: updated.ownerId,
      memberCount: updated.members.length,
      memberLimit: updated.maxMembers,
      plan: updated.plan as 'free' | 'agency' | 'enterprise',
      niches: [],
      avatarColor: '',
      createdAt: updated.createdAt.toISOString(),
      defaultRole: 'member' as const,
    }

    return NextResponse.json({ team: teamResponse, source: 'db' }, { status: 200 })
  } catch (error) {
    console.error('[/api/team/[id] PATCH] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update team',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/team/[id]
 *
 * Permanently delete a team. Only the owner may perform this action.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = await params

    const team = await db.team.findUnique({ where: { id } })
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'db' },
        { status: 404 },
      )
    }

    // Only owner can delete
    if (userId && team.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Only the team owner can delete the team', source: 'db' },
        { status: 403 },
      )
    }

    await db.team.delete({ where: { id } })

    return NextResponse.json(
      { success: true, source: 'db' },
      { status: 200 },
    )
  } catch (error) {
    console.error('[/api/team/[id] DELETE] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete team',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}
