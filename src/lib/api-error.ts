import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Custom API error with HTTP status code.
 * Throw this inside any API route handler to return a structured error response.
 *
 * @example
 *   throw new ApiError(404, 'Link not found')
 *   throw new ApiError(400, 'Invalid input', { field: 'name' })
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** Convenience constructors for common status codes */
  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details)
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message)
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message)
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, message)
  }
  static conflict(message: string) {
    return new ApiError(409, message)
  }
  static tooManyRequests(message = 'Too many requests, please slow down.') {
    return new ApiError(429, message)
  }
  static internal(message = 'Internal server error') {
    return new ApiError(500, message)
  }
}

/**
 * Convert any thrown error into a structured NextResponse.
 * Handles ApiError, ZodError, JSON SyntaxError, Prisma errors, and unknown errors.
 */
export function handleError(error: unknown): NextResponse {
  // Log full error server-side for debugging
  console.error('[API Error]', error)

  // Structured ApiError — use as-is
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details ?? null },
      { status: error.statusCode }
    )
  }

  // Zod validation error → 400
  // Handles both Zod v3 (.errors) and v4 (.issues) shapes
  if (error instanceof ZodError) {
    const issues = error.issues ?? (error as unknown as { errors?: unknown[] }).errors ?? []
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: (issues as Array<{ path?: PropertyKey[]; message?: string }>).map((i) => ({
          path: Array.isArray(i.path) ? i.path.join('.') : '',
          message: i.message ?? 'Invalid value',
        })),
      },
      { status: 400 }
    )
  }

  // Malformed JSON body → 400
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    )
  }

  // Prisma known errors (P2002 = unique constraint, P2025 = record not found)
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const prismaError = error as { code: string; message?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'A record with this value already exists', details: prismaError.message },
        { status: 409 }
      )
    }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }
  }

  // TypeError → usually a programming error, treat as 500
  if (error instanceof TypeError) {
    return NextResponse.json(
      { error: 'A type error occurred while processing the request' },
      { status: 500 }
    )
  }

  // Fallback for everything else
  const message =
    error instanceof Error ? error.message : 'Internal server error'
  return NextResponse.json({ error: message }, { status: 500 })
}

/**
 * Wraps an async API handler so any thrown error is converted to a JSON response.
 * Use for both GET and POST handlers, e.g.:
 *   export const POST = apiHandler(async (req) => { ... })
 */
type RouteHandler<Ctx = unknown> = (
  req: Request,
  ctx: Ctx
) => Promise<Response> | Response

export function apiHandler<Ctx = unknown>(handler: RouteHandler<Ctx>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      return handleError(error)
    }
  }
}

/**
 * Safely parse JSON body, throwing ApiError(400) on failure.
 */
export async function parseJsonBody<T = unknown>(req: Request): Promise<T> {
  try {
    const text = await req.text()
    if (!text) {
      throw ApiError.badRequest('Request body is empty')
    }
    return JSON.parse(text) as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof SyntaxError) {
      throw ApiError.badRequest('Invalid JSON in request body')
    }
    throw error
  }
}
