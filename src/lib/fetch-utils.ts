'use client'

import { toast } from 'sonner'

/**
 * Typed fetch wrapper for the browser. Automatically:
 *   - parses JSON response
 *   - throws an Error with the server's `error` field on non-2xx
 *   - shows a toast notification for network/HTTP errors
 *   - rethrows so callers can do their own error handling if needed
 *
 * Usage:
 *   const data = await apiFetch<MyType>('/api/links')
 *   const created = await apiFetch<Link>('/api/links', {
 *     method: 'POST',
 *     body: JSON.stringify(payload),
 *     headers: { 'Content-Type': 'application/json' },
 *   })
 */
export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, options)
  } catch (err) {
    // TypeError thrown by fetch when network fails or server unreachable
    const isOffline =
      typeof navigator !== 'undefined' && navigator.onLine === false
    if (isOffline) {
      toast.error('You are offline', {
        description: 'Please check your internet connection and try again.',
      })
    } else {
      toast.error('Network error', {
        description: 'Could not reach the server. Please try again.',
      })
    }
    throw new Error(
      isOffline ? 'Offline — request could not be sent' : 'Network request failed'
    )
  }

  // Try to parse JSON, but tolerate empty bodies
  let payload: unknown = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      payload = await res.json()
    } catch {
      payload = null
    }
  }

  if (!res.ok) {
    const errorMessage =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `Request failed (HTTP ${res.status})`

    // Don't toast 401/403 here — let callers handle auth flows quietly if they want
    if (res.status !== 401 && res.status !== 403) {
      toast.error(errorMessage, {
        description:
          res.status >= 500
            ? 'Server error. Please try again in a moment.'
            : undefined,
      })
    }
    const err = new Error(errorMessage) as Error & { status?: number; payload?: unknown }
    err.status = res.status
    err.payload = payload
    throw err
  }

  return payload as T
}

/**
 * Build query string from a flat object of params. Skips null/undefined/empty values.
 */
export function buildQuery(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Convenience: GET JSON.
 */
export function apiGet<T = unknown>(
  url: string,
  params?: Record<string, string | number | boolean | null | undefined>
): Promise<T> {
  return apiFetch<T>(`${url}${params ? buildQuery(params) : ''}`)
}

/**
 * Convenience: POST JSON. Auto-sets Content-Type.
 */
export function apiPost<T = unknown>(
  url: string,
  body?: unknown
): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/**
 * Convenience: PATCH JSON.
 */
export function apiPatch<T = unknown>(
  url: string,
  body?: unknown
): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/**
 * Convenience: DELETE.
 */
export function apiDelete<T = unknown>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: 'DELETE' })
}
