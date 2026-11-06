import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/team
 *
 * List all teams where the current user is a member.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', source: 'db' },
        { status: 401 },
      )
    }

    // Find all team memberships for the user
    const memberships = await db.teamMember.findMany({
      where: { userId, status: 'active' },
      include: {
        team: {
          include: {
            members: { where: { status: 'active' } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const teams = memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      description: m.team.description ?? '',
      ownerId: m.team.ownerId,
      memberCount: m.team.members.length,
      memberLimit: m.team.maxMembers,
      plan: m.team.plan as 'free' | 'agency' | 'enterprise',
      niches: [],
      avatarColor: '',
      createdAt: m.team.createdAt.toISOString(),
      defaultRole: 'member' as const,
    }))

    return NextResponse.json(
      { teams, total: teams.length, source: 'db' as const },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    console.error('[/api/team GET] Error:', error)
    return NextResponse.json(
      {
        teams: [],
        total: 0,
        source: 'db' as const,
        error: 'Failed to fetch teams',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/team
 *
 * Create a new team. The current user becomes the owner.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', source: 'db' },
        { status: 401 },
      )
    }

    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 3) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Team name must be at least 3 characters',
          source: 'db',
        },
        { status: 400 },
      )
    }

    const plan = body.plan || 'free'
    const maxMembers = plan === 'enterprise' ? 50 : plan === 'agency' ? 15 : 5

    const team = await db.team.create({
      data: {
        name: body.name.trim(),
        description: body.description ?? null,
        ownerId: userId,
        plan,
        maxMembers,
        members: {
          create: {
            userId,
            role: 'owner',
            status: 'active',
          },
        },
      },
      include: {
        members: true,
      },
    })

    const teamResponse = {
      id: team.id,
      name: team.name,
      description: team.description ?? '',
      ownerId: team.ownerId,
      memberCount: team.members.length,
      memberLimit: team.maxMembers,
      plan: team.plan as 'free' | 'agency' | 'enterprise',
      niches: body.niches ?? [],
      avatarColor: '',
      createdAt: team.createdAt.toISOString(),
      defaultRole: 'member' as const,
    }

    return NextResponse.json(
      { team: teamResponse, source: 'db' as const },
      { status: 201 },
    )
  } catch (error) {
    console.error('[/api/team POST] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create team',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}
