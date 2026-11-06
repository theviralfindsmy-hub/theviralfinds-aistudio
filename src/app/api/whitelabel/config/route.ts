import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateDomain } from '@/lib/whitelabel/applier'
import type {
  SaveWhiteLabelConfigResponse,
  WhiteLabelConfig,
  WhiteLabelConfigResponse,
  WhiteLabelListResponse,
} from '@/lib/whitelabel/types'

/**
 * Map a Prisma WhiteLabelConfig row to the API WhiteLabelConfig type.
 */
function mapConfig(row: {
  id: string
  name: string
  domain: string
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  companyName: string
  supportEmail: string | null
  headTitle: string | null
  customCss: string | null
  emailTemplate: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}): WhiteLabelConfig {
  return {
    id: row.id,
    orgId: row.id, // Use id as orgId for DB-backed configs
    brandName: row.companyName,
    logoUrl: row.logoUrl ?? '',
    colors: {
      primary: row.primaryColor,
      secondary: row.primaryColor,
      accent: row.accentColor,
    },
    domain: {
      domain: row.domain,
      status: row.domain ? 'verified' as const : 'not_configured' as const,
      cnameTarget: 'whitelabel.theviralfindsmy.com',
      lastVerifiedAt: row.updatedAt.toISOString(),
      sslStatus: row.domain ? 'active' as const : 'none' as const,
    },
    emailTemplates: row.emailTemplate ? JSON.parse(row.emailTemplate) : [],
    plan: 'enterprise' as const,
    status: row.status as 'active' | 'pending' | 'suspended',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    contactEmail: row.supportEmail ?? '',
    tagline: row.headTitle ?? '',
  }
}

/**
 * GET /api/whitelabel/config
 * GET /api/whitelabel/config?list=1   (super-admin — returns all tenants)
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const isList = searchParams.get('list') === '1'

    if (isList) {
      // Super-admin view: all tenants, sorted by creation date desc.
      const configs = await db.whiteLabelConfig.findMany({
        orderBy: { createdAt: 'desc' },
      })

      const mapped = configs.map(mapConfig)

      const body: WhiteLabelListResponse = {
        configs: mapped,
        count: mapped.length,
        source: 'db',
      }
      return NextResponse.json(body, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      })
    }

    // Regular tenant view: just the first (or current) config.
    const config = await db.whiteLabelConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!config) {
      const body: WhiteLabelConfigResponse = {
        config: null,
        source: 'db',
      }
      return NextResponse.json(body, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      })
    }

    const body: WhiteLabelConfigResponse = {
      config: mapConfig(config),
      source: 'db',
    }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/whitelabel/config] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch white-label config.',
        source: 'db' as const,
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/whitelabel/config
 *
 * Body: { config: Partial<WhiteLabelConfig> }
 *
 * Creates or updates a white-label config. Validates domain and persists to DB.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    let body: { config: Partial<WhiteLabelConfig> }
    try {
      body = (await request.json()) as { config: Partial<WhiteLabelConfig> }
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { config: Partial<WhiteLabelConfig> }.',
          source: 'db' as const,
        },
        { status: 400 },
      )
    }

    if (!body || !body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        {
          error: 'Field "config" is required (object).',
          source: 'db' as const,
        },
        { status: 400 },
      )
    }

    const cfg = body.config

    // Validate the custom domain (if supplied).
    if (cfg.domain?.domain !== undefined) {
      const d = cfg.domain.domain.trim()
      if (d !== '' && !validateDomain(d)) {
        return NextResponse.json(
          {
            error: `Domain tidak sah: "${d}". Sila semak format (cth: affiliate.brand.my).`,
            source: 'db' as const,
          },
          { status: 400 },
        )
      }
    }

    // Check if a config already exists
    const existing = await db.whiteLabelConfig.findFirst()

    const domainValue = cfg.domain?.domain ?? existing?.domain ?? ''
    const status = domainValue ? 'active' : 'draft'

    let savedConfig

    if (existing) {
      // Update existing
      savedConfig = await db.whiteLabelConfig.update({
        where: { id: existing.id },
        data: {
          name: cfg.brandName ?? existing.name,
          domain: domainValue || existing.domain,
          logoUrl: cfg.logoUrl ?? existing.logoUrl,
          primaryColor: cfg.colors?.primary ?? existing.primaryColor,
          accentColor: cfg.colors?.accent ?? existing.accentColor,
          companyName: cfg.brandName ?? existing.companyName,
          supportEmail: cfg.contactEmail ?? existing.supportEmail,
          headTitle: cfg.tagline ?? existing.headTitle,
          customCss: cfg.colors ? JSON.stringify(cfg.colors) : existing.customCss,
          emailTemplate: cfg.emailTemplates ? JSON.stringify(cfg.emailTemplates) : existing.emailTemplate,
          status,
        },
      })
    } else {
      // Create new
      savedConfig = await db.whiteLabelConfig.create({
        data: {
          name: cfg.brandName ?? 'My Brand',
          domain: domainValue,
          logoUrl: cfg.logoUrl ?? null,
          primaryColor: cfg.colors?.primary ?? '#0066FF',
          accentColor: cfg.colors?.accent ?? '#CCFF00',
          companyName: cfg.brandName ?? 'My Brand',
          supportEmail: cfg.contactEmail ?? null,
          headTitle: cfg.tagline ?? null,
          customCss: cfg.colors ? JSON.stringify(cfg.colors) : null,
          emailTemplate: cfg.emailTemplates ? JSON.stringify(cfg.emailTemplates) : null,
          status,
        },
      })
    }

    const response: SaveWhiteLabelConfigResponse = {
      config: mapConfig(savedConfig),
      source: 'db',
    }
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[POST /api/whitelabel/config] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save white-label config.',
        source: 'db' as const,
      },
      { status: 500 },
    )
  }
}
