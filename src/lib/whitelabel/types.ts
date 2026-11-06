/**
 * White-Label Configuration — Type Definitions
 *
 * Fasa 4.4 (CHECKLIST Section 4.4 — White-Label Option).
 *
 * Enterprise clients can rebrand the entire platform — logo, brand name,
 * colour palette, custom domain, and email templates — through a single
 * `WhiteLabelConfig` record. This module defines the contract used by both
 * the API layer (`/api/whitelabel/*`) and the admin UI.
 *
 * All Malaysian context (RM currency, .my domains, Manglish sample copy).
 */

/** Source flag for every API response. */
export type WhiteLabelDataSource = 'mock' | 'db'

/** Subscription tiers that unlock white-label. */
export type WhiteLabelPlan = 'enterprise' | 'agency' | 'reseller'

/** Status of a custom domain's DNS verification. */
export type DomainStatus = 'verified' | 'pending' | 'failed' | 'not_configured'

/** Status of a white-label tenant overall. */
export type WhiteLabelStatus = 'active' | 'pending' | 'suspended'

/**
 * Brand colour palette. Each entry is a hex string (`#RRGGBB`).
 * These get injected as CSS custom properties on a wrapper element so the
 * live preview updates without affecting the global theme.
 */
export interface BrandColors {
  /** Primary brand colour — buttons, active sidebar item, accents. */
  primary: string
  /** Secondary brand colour — gradients, hover states. */
  secondary: string
  /** Accent / highlight colour — badges, notifications, charts. */
  accent: string
}

/**
 * Custom domain configuration. Enterprise clients point a CNAME record at
 * our gateway, we verify ownership, then we provision SSL + route traffic.
 */
export interface CustomDomain {
  /** Fully-qualified domain, e.g. "affiliate.shophijau.my". */
  domain: string
  /** Current DNS verification status. */
  status: DomainStatus
  /** CNAME target the client must point their domain at. */
  cnameTarget: string
  /** ISO-8601 timestamp of last verification attempt. */
  lastVerifiedAt: string | null
  /** SSL certificate provisioning status. */
  sslStatus: 'active' | 'pending' | 'none'
}

/** The four built-in email templates that white-label tenants can customise. */
export type EmailTemplateType =
  | 'welcome'
  | 'notification'
  | 'digest'
  | 'promotion'

/**
 * A single customisable email template. Tenants can edit the subject + body
 * and use variable placeholders that get substituted at send time.
 */
export interface EmailTemplate {
  /** Which built-in template this is. */
  type: EmailTemplateType
  /** Display name shown in the UI. */
  name: string
  /** Email subject line, supports `{{placeholders}}`. */
  subject: string
  /** Plain-text or simple-HTML email body. */
  body: string
  /** Whether the tenant has customised this template (false = using default). */
  customized: boolean
  /** List of variable placeholders available in this template. */
  availableVariables: string[]
}

/**
 * The complete white-label configuration for one organisation.
 * Stored as a single record (in production this maps to a `WhiteLabelConfig`
 * Prisma model; for Fasa 4.4 we keep it in-memory in the API route).
 */
export interface WhiteLabelConfig {
  /** Stable unique id. */
  id: string
  /** Organisation id this config belongs to. */
  orgId: string
  /** Display brand name shown in headers, emails, etc. */
  brandName: string
  /** Logo URL (https) — square or wide PNG/SVG. */
  logoUrl: string
  /** Favicon URL (optional). */
  faviconUrl?: string
  /** Brand colour palette. */
  colors: BrandColors
  /** Custom domain setup (optional — domain may be `''` if not yet set). */
  domain: CustomDomain
  /** The four customisable email templates. */
  emailTemplates: EmailTemplate[]
  /** Subscription tier that unlocked white-label. */
  plan: WhiteLabelPlan
  /** Overall tenant status. */
  status: WhiteLabelStatus
  /** ISO-8601 creation timestamp. */
  createdAt: string
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string
  /** Contact email for the tenant admin. */
  contactEmail: string
  /** Optional tagline shown under the brand name. */
  tagline?: string
}

/** Default brand colours for TheViralFindsMY (Shopee orange theme). */
export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#EE4D2D', // shopee orange
  secondary: '#D73211', // shopee-dark
  accent: '#F69E80', // shopee-light
}

/** Default config — TheViralFindsMY itself, no white-label applied. */
export const DEFAULT_WHITELABEL_CONFIG: Omit<WhiteLabelConfig, 'id' | 'orgId'> = {
  brandName: 'TheViralFindsMY',
  logoUrl: '/logo.svg',
  colors: { ...DEFAULT_BRAND_COLORS },
  domain: {
    domain: '',
    status: 'not_configured',
    cnameTarget: 'whitelabel.theviralfindsmy.com',
    lastVerifiedAt: null,
    sslStatus: 'none',
  },
  emailTemplates: [],
  plan: 'enterprise',
  status: 'active',
  createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  updatedAt: new Date().toISOString(),
  contactEmail: 'support@theviralfindsmy.com',
  tagline: 'AI-Powered Affiliate Manager',
}

/** Preset colour palettes offered in the admin UI. */
export interface ColorPreset {
  /** Internal id. */
  id: string
  /** Display label. */
  label: string
  /** Three-colour palette. */
  colors: BrandColors
}

/** The six preset palettes available in the colour picker. */
export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'shopee-orange',
    label: 'Shopee Orange',
    colors: { primary: '#EE4D2D', secondary: '#D73211', accent: '#F69E80' },
  },
  {
    id: 'hermes-purple',
    label: 'Hermes Purple',
    colors: { primary: '#7C3AED', secondary: '#5B21B6', accent: '#C4B5FD' },
  },
  {
    id: 'emerald',
    label: 'Emerald',
    colors: { primary: '#059669', secondary: '#047857', accent: '#6EE7B7' },
  },
  {
    id: 'rose',
    label: 'Rose',
    colors: { primary: '#E11D48', secondary: '#BE123C', accent: '#FDA4AF' },
  },
  {
    id: 'amber',
    label: 'Amber',
    colors: { primary: '#D97706', secondary: '#B45309', accent: '#FCD34D' },
  },
  {
    id: 'teal',
    label: 'Teal',
    colors: { primary: '#0D9488', secondary: '#0F766E', accent: '#5EEAD4' },
  },
]

/* ------------------------------------------------------------------ */
/* API response envelopes                                              */
/* ------------------------------------------------------------------ */

export interface WhiteLabelConfigResponse {
  config: WhiteLabelConfig | null
  source: WhiteLabelDataSource
}

export interface SaveWhiteLabelConfigRequest {
  config: Partial<Omit<WhiteLabelConfig, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>>
}

export interface SaveWhiteLabelConfigResponse {
  config: WhiteLabelConfig
  source: WhiteLabelDataSource
}

export interface WhiteLabelPreviewRequest {
  config: Partial<WhiteLabelConfig>
}

export interface WhiteLabelPreviewData {
  /** CSS variable map to inject into the preview wrapper. */
  cssVars: Record<string, string>
  /** Tailwind class overrides the preview should use. */
  themeOverrides: {
    primaryBg: string
    primaryText: string
    secondaryBg: string
    accentBg: string
    ring: string
  }
  /** Sample dashboard data rendered with the branding applied. */
  sampleDashboard: {
    brandName: string
    logoUrl: string
    tagline: string
    sidebarItems: { label: string; icon: string; active?: boolean }[]
    sampleProduct: {
      name: string
      price: string
      commission: string
      thumbnail: string
    }
    sampleNotification: {
      title: string
      message: string
    }
    sampleStat: { label: string; value: string; delta: string }
  }
  /** Whether the supplied custom domain is valid. */
  domainValid: boolean
  source: WhiteLabelDataSource
}

export interface WhiteLabelListResponse {
  configs: WhiteLabelConfig[]
  count: number
  source: WhiteLabelDataSource
}
