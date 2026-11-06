import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

import {
  ALL_PERMISSIONS,
  type ApiKeyPermission,
  type ApiKeyResponse,
  type RateLimitTier,
  type UpdateApiKeyRequest,
} from '@/lib/apikeys/types'
import { maskKey, keyPrefix } from '@/lib/apikeys/mock-data'

/** Allowed rate-limit tiers. */
const VALID_TIERS: RateLimitTier[] = [100, 1000, 10000]

/**
 * GET /api/apikeys/[id]
 *
 * Returns full detail for one key. The plaintext secret is NEVER included.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const key = await db.apiKey.findUnique({ where: { id } })
    if (!key) {
      return NextResponse.json(
        { error: `API key "${id}" not found.`, source: 'db' as const },
        { status: 404 },
      )
    }

    const mappedKey = {
      id: key.id,
      name: key.name,
      maskedKey: maskKey(key.key),
      prefix: keyPrefix(key.key),
      permissions: JSON.parse(key.permissions) as ApiKeyPermission[],
      rateLimit: (key.permissions.includes('write') ? 10000 : 1000) as RateLimitTier,
      status: key.status as 'active' | 'revoked' | 'expired',
      createdAt: key.createdAt.toISOString(),
      lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
      expiresAt: key.expiresAt?.toISOString() ?? null,
    }

    const body: ApiKeyResponse = { key: mappedKey, source: 'db' }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/apikeys/[id]] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch API key.',
        source: 'db' as const,
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/apikeys/[id]
 *
 * Body: UpdateApiKeyRequest (all fields optional)
 *
 * Updates the key's name and/or permissions. Does NOT regenerate the secret.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const key = await db.apiKey.findUnique({ where: { id } })
    if (!key) {
      return NextResponse.json(
        { error: `API key "${id}" not found.`, source: 'db' as const },
        { status: 404 },
      )
    }
    if (key.status === 'revoked') {
      return NextResponse.json(
        { error: 'Cannot edit a revoked key. Generate a new one instead.', source: 'db' as const },
        { status: 409 },
      )
    }

    let body: UpdateApiKeyRequest
    try {
      body = (await request.json()) as UpdateApiKeyRequest
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON body. Expected Partial<{ name, permissions, rateLimit }>.',
          source: 'db' as const,
        },
        { status: 400 },
      )
    }

    const updateData: Record<string, unknown> = {}

    // ── Apply name
    if (typeof body.name === 'string') {
      const trimmed = body.name.trim()
      if (trimmed.length < 2 || trimmed.length > 60) {
        return NextResponse.json(
          { error: 'Field "name" must be 2-60 characters.', source: 'db' as const },
          { status: 400 },
        )
      }
      updateData.name = trimmed
    }

    // ── Apply permissions
    if (Array.isArray(body.permissions)) {
      if (body.permissions.length === 0) {
        return NextResponse.json(
          { error: 'permissions must be a non-empty array.', source: 'db' as const },
          { status: 400 },
        )
      }
      const cleaned = Array.from(
        new Set(
          body.permissions.filter(
            (p): p is ApiKeyPermission => ALL_PERMISSIONS.includes(p as ApiKeyPermission),
          ),
        ),
      )
      if (cleaned.length === 0) {
        return NextResponse.json(
          { error: 'No valid permissions supplied.', source: 'db' as const },
          { status: 400 },
        )
      }
      updateData.permissions = JSON.stringify(cleaned)
    }

    const updated = await db.apiKey.update({
      where: { id },
      data: updateData,
    })

    const mappedKey = {
      id: updated.id,
      name: updated.name,
      maskedKey: maskKey(updated.key),
      prefix: keyPrefix(updated.key),
      permissions: JSON.parse(updated.permissions) as ApiKeyPermission[],
      rateLimit: (updated.permissions.includes('write') ? 10000 : 1000) as RateLimitTier,
      status: updated.status as 'active' | 'revoked' | 'expired',
      createdAt: updated.createdAt.toISOString(),
      lastUsedAt: updated.lastUsedAt?.toISOString() ?? null,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
    }

    const response: ApiKeyResponse = { key: mappedKey, source: 'db' }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[PATCH /api/apikeys/[id]] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update API key.',
        source: 'db' as const,
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/apikeys/[id]
 *
 * Revokes the key (soft delete). Subsequent authenticated requests using
 * the revoked key's plaintext will return 401.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const key = await db.apiKey.findUnique({ where: { id } })
    if (!key) {
      return NextResponse.json(
        { error: `API key "${id}" not found.`, source: 'db' as const },
        { status: 404 },
      )
    }

    const updated = await db.apiKey.update({
      where: { id },
      data: { status: 'revoked' },
    })

    const mappedKey = {
      id: updated.id,
      name: updated.name,
      maskedKey: maskKey(updated.key),
      prefix: keyPrefix(updated.key),
      permissions: JSON.parse(updated.permissions) as ApiKeyPermission[],
      rateLimit: (updated.permissions.includes('write') ? 10000 : 1000) as RateLimitTier,
      status: 'revoked' as const,
      createdAt: updated.createdAt.toISOString(),
      lastUsedAt: updated.lastUsedAt?.toISOString() ?? null,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
    }

    const response: ApiKeyResponse = { key: mappedKey, source: 'db' }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[DELETE /api/apikeys/[id]] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to revoke API key.',
        source: 'db' as const,
      },
      { status: 500 },
    )
  }
}
