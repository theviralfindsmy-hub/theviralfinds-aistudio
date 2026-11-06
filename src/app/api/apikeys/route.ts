import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

import {
  ALL_PERMISSIONS,
  type ApiKeyPermission,
  type ApiKeysListResponse,
  type GenerateApiKeyRequest,
  type NewApiKey,
  type NewApiKeyResponse,
  type RateLimitTier,
} from '@/lib/apikeys/types'
import { maskKey, keyPrefix } from '@/lib/apikeys/mock-data'

/** Allowed rate-limit tiers. */
const VALID_TIERS: RateLimitTier[] = [100, 1000, 10000]

/** Generate random hex chars using Web Crypto. */
function randomHex(n: number): string {
  const bytes = new Uint8Array(n)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, n)
}

/** Pick an env prefix based on the requested rate limit. */
function envFromTier(tier: RateLimitTier): string {
  if (tier >= 10000) return 'prod'
  if (tier >= 1000) return 'ana'
  return 'test'
}

/** Compose a full plaintext key. */
function composePlaintext(env: string, body: string): string {
  return `tvf_${env}_${body}${randomHex(16)}`
}

/**
 * GET /api/apikeys
 *
 * Returns all API keys for the authenticated user (masked). Never exposes
 * the plaintext secret.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', source: 'db' as const },
        { status: 401 },
      )
    }

    const keys = await db.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const mappedKeys = keys.map((k) => ({
      id: k.id,
      name: k.name,
      maskedKey: maskKey(k.key),
      prefix: keyPrefix(k.key),
      permissions: JSON.parse(k.permissions) as ApiKeyPermission[],
      rateLimit: (k.permissions.includes('write') ? 10000 : 1000) as RateLimitTier,
      status: k.status as 'active' | 'revoked' | 'expired',
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      expiresAt: k.expiresAt?.toISOString() ?? null,
    }))

    const body: ApiKeysListResponse = {
      keys: mappedKeys,
      source: 'db',
    }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/apikeys] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to list API keys.',
        source: 'db' as const,
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/apikeys
 *
 * Body: GenerateApiKeyRequest
 *
 * Mints a new API key. The plaintext secret is included in the response
 * body exactly once; subsequent GETs only return the masked preview.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', source: 'db' as const },
        { status: 401 },
      )
    }

    let body: GenerateApiKeyRequest
    try {
      body = (await request.json()) as GenerateApiKeyRequest
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { name, permissions[], rateLimit[, expiresInDays] }.',
          source: 'db' as const,
        },
        { status: 400 },
      )
    }

    // ── Validate name
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Field "name" must be at least 2 characters.', source: 'db' as const },
        { status: 400 },
      )
    }
    if (body.name.trim().length > 60) {
      return NextResponse.json(
        { error: 'Field "name" must be 60 characters or fewer.', source: 'db' as const },
        { status: 400 },
      )
    }

    // ── Validate permissions
    if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
      return NextResponse.json(
        { error: 'Field "permissions" must be a non-empty array.', source: 'db' as const },
        { status: 400 },
      )
    }
    const permissions = Array.from(
      new Set(
        body.permissions.filter(
          (p): p is ApiKeyPermission => ALL_PERMISSIONS.includes(p as ApiKeyPermission),
        ),
      ),
    )
    if (permissions.length === 0) {
      return NextResponse.json(
        { error: 'No valid permissions supplied.', source: 'db' as const },
        { status: 400 },
      )
    }

    // ── Validate rate limit
    if (!VALID_TIERS.includes(body.rateLimit)) {
      return NextResponse.json(
        {
          error: `Field "rateLimit" must be one of: ${VALID_TIERS.join(', ')}.`,
          source: 'db' as const,
        },
        { status: 400 },
      )
    }

    // ── Validate optional expiry
    let expiresAt: Date | null = null
    if (typeof body.expiresInDays === 'number') {
      if (body.expiresInDays < 1 || body.expiresInDays > 3650) {
        return NextResponse.json(
          { error: 'expiresInDays must be between 1 and 3650.', source: 'db' as const },
          { status: 400 },
        )
      }
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + body.expiresInDays)
    }

    // ── Mint the key
    const env = envFromTier(body.rateLimit)
    const body8 = randomHex(10)
    const plaintext = composePlaintext(env, body8)

    // Generate a random secret
    const secretBytes = new Uint8Array(32)
    crypto.getRandomValues(secretBytes)
    const secret = Array.from(secretBytes, (b) => b.toString(16).padStart(2, '0')).join('')

    const apiKey = await db.apiKey.create({
      data: {
        name: body.name.trim(),
        key: plaintext,
        secret,
        userId,
        permissions: JSON.stringify(permissions),
        status: 'active',
        expiresAt,
      },
    })

    const mappedKey = {
      id: apiKey.id,
      name: apiKey.name,
      maskedKey: maskKey(apiKey.key),
      prefix: keyPrefix(apiKey.key),
      permissions,
      rateLimit: body.rateLimit,
      status: 'active' as const,
      createdAt: apiKey.createdAt.toISOString(),
      lastUsedAt: null as string | null,
      expiresAt: apiKey.expiresAt?.toISOString() ?? null,
    }

    const newKey: NewApiKey = { ...mappedKey, plaintextKey: plaintext }
    const response: NewApiKeyResponse = { key: newKey, source: 'db' }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('[POST /api/apikeys] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to mint API key.',
        source: 'db' as const,
      },
      { status: 500 },
    )
  }
}
