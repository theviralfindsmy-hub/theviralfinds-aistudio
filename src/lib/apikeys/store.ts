/**
 * API as a Service — Shared in-memory key store
 *
 * Fasa 4.5 (CHECKLIST Section 4.5).
 *
 * Single source of truth for the in-memory API key store. Imported by both
 * `/api/apikeys/route.ts` (GET/POST) and `/api/apikeys/[id]/route.ts`
 * (GET/PATCH/DELETE) so that keys minted in one route are visible to the
 * other within the same dev-server process.
 *
 * Designed to be swapped for a Prisma `ApiKey` model in production without
 * touching the route handlers.
 */

import type { ApiKey } from './types'
import { MOCK_API_KEYS } from './mock-data'

/** All known API keys (mock + dynamically minted). */
export const keyStore: ApiKey[] = MOCK_API_KEYS.map((k) => ({ ...k }))

/**
 * Plaintext-key registry — only populated when a new key is minted via POST.
 * The plaintext is returned exactly once in the POST response and then kept
 * here purely so the playground route can echo a masked bearer token in its
 * response headers. NEVER returned by GET.
 */
export const plaintextRegistry: Record<string, string> = {}

/** Find a key by id (case-insensitive). */
export function findKey(id: string): ApiKey | undefined {
  return keyStore.find((k) => k.id.toLowerCase() === id.toLowerCase())
}
