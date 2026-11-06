import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ user: null, isAuthenticated: false })
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        avatarUrl: true,
        shopeeAffId: true,
        isActive: true,
        lastLoginAt: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ user: null, isAuthenticated: false })
    }

    return NextResponse.json({
      user: dbUser,
      isAuthenticated: true,
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { user: null, isAuthenticated: false },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to update your profile.' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { name, shopeeAffId } = body ?? {}

    const data: { name?: string; shopeeAffId?: string | null } = {}
    if (typeof name === 'string' && name.trim().length > 0) {
      data.name = name.trim().slice(0, 80)
    }
    if (typeof shopeeAffId === 'string') {
      data.shopeeAffId = shopeeAffId.trim().slice(0, 120) || null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No updatable fields provided.' },
        { status: 400 }
      )
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        avatarUrl: true,
        shopeeAffId: true,
        isActive: true,
        lastLoginAt: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updated, isAuthenticated: true })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile.' },
      { status: 500 }
    )
  }
}
