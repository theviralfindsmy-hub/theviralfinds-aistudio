import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_ROLES = ['owner', 'admin', 'member', 'viewer'] as const

/**
 * GET /api/team/[id]/members
 *
 * List all members of a team.
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

    const members = team.members.map((m) => ({
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

    return NextResponse.json(
      { members, total: members.length, source: 'db' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[/api/team/[id]/members GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch members',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/team/[id]/members
 *
 * Invite a new member by email. Creates a TeamInvitation record.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const team = await db.team.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'db' },
        { status: 404 },
      )
    }

    const body = await request.json()

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address', source: 'db' },
        { status: 400 },
      )
    }

    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role', source: 'db' },
        { status: 400 },
      )
    }

    // Cannot invite as owner
    if (body.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot invite as owner', source: 'db' },
        { status: 400 },
      )
    }

    // Check member limit
    const activeMembers = team.members.filter((m) => m.status === 'active')
    if (activeMembers.length >= team.maxMembers) {
      return NextResponse.json(
        {
          error: `Team is at member limit (${team.maxMembers}). Upgrade your plan to invite more members.`,
          source: 'db',
        },
        { status: 403 },
      )
    }

    // Check if invitation already exists
    const existingInvitation = await db.teamInvitation.findFirst({
      where: {
        teamId: id,
        email: body.email,
        status: 'pending',
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email', source: 'db' },
        { status: 409 },
      )
    }

    // Generate a unique token
    const tokenBytes = new Uint8Array(16)
    crypto.getRandomValues(tokenBytes)
    const token = Array.from(tokenBytes, (b) => b.toString(16).padStart(2, '0')).join('')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14) // 14-day expiry

    const invitation = await db.teamInvitation.create({
      data: {
        teamId: id,
        email: body.email,
        role: body.role,
        token,
        status: 'pending',
        expiresAt,
      },
    })

    const invitationResponse = {
      id: invitation.id,
      teamId: invitation.teamId,
      teamName: team.name,
      email: invitation.email,
      role: invitation.role as 'owner' | 'admin' | 'member' | 'viewer',
      invitedBy: '',
      message: body.message ?? '',
      createdAt: invitation.createdAt.toISOString(),
      status: invitation.status as 'pending' | 'accepted' | 'declined' | 'expired',
      expiresAt: invitation.expiresAt.toISOString(),
    }

    return NextResponse.json(
      { invitation: invitationResponse, source: 'db' },
      { status: 201 },
    )
  } catch (error) {
    console.error('[/api/team/[id]/members POST] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to invite member',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/team/[id]/members
 *
 * Update a member's role. Owner's role cannot be changed.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const team = await db.team.findUnique({ where: { id } })
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'db' },
        { status: 404 },
      )
    }

    const body = await request.json()

    if (!body.memberId) {
      return NextResponse.json(
        { error: 'memberId is required', source: 'db' },
        { status: 400 },
      )
    }

    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role', source: 'db' },
        { status: 400 },
      )
    }

    if (body.role === 'owner') {
      return NextResponse.json(
        { error: 'Ownership transfer is not supported via this endpoint', source: 'db' },
        { status: 400 },
      )
    }

    const member = await db.teamMember.findUnique({
      where: { id: body.memberId },
    })

    if (!member || member.teamId !== id) {
      return NextResponse.json(
        {
          error: 'Member not found',
          source: 'db',
        },
        { status: 404 },
      )
    }

    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change owner role', source: 'db' },
        { status: 400 },
      )
    }

    const updated = await db.teamMember.update({
      where: { id: body.memberId },
      data: { role: body.role },
    })

    const memberResponse = {
      id: updated.id,
      teamId: updated.teamId,
      userId: updated.userId,
      role: updated.role as 'owner' | 'admin' | 'member' | 'viewer',
      joinedAt: updated.joinedAt.toISOString(),
      status: updated.status as 'active' | 'invited' | 'suspended',
    }

    return NextResponse.json({ member: memberResponse, source: 'db' }, { status: 200 })
  } catch (error) {
    console.error('[/api/team/[id]/members PATCH] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update member role',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/team/[id]/members
 *
 * Remove a member from the team. The owner cannot be removed.
 * Pass ?memberId=xxx to specify which member to remove.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId query parameter is required', source: 'db' },
        { status: 400 },
      )
    }

    const team = await db.team.findUnique({ where: { id } })
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'db' },
        { status: 404 },
      )
    }

    const member = await db.teamMember.findUnique({
      where: { id: memberId },
    })

    if (!member || member.teamId !== id) {
      return NextResponse.json(
        { error: 'Member not found', source: 'db' },
        { status: 404 },
      )
    }

    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the team owner', source: 'db' },
        { status: 400 },
      )
    }

    await db.teamMember.delete({ where: { id: memberId } })

    return NextResponse.json(
      { success: true, source: 'db' },
      { status: 200 },
    )
  } catch (error) {
    console.error('[/api/team/[id]/members DELETE] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to remove member',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}
