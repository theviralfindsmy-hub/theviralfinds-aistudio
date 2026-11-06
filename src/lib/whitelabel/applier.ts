/**
 * White-Label Configuration — Branding Applier
 *
 * Fasa 4.4 (CHECKLIST Section 4.4 — White-Label Option).
 *
 * Pure functions used by both the API layer and the admin UI to:
 *   - turn a `WhiteLabelConfig` into CSS custom properties for the live preview
 *   - derive Tailwind class overrides (since the global theme cannot be
 *     mutated at runtime without affecting other pages, we expose a small
 *     set of utility class strings the preview can apply directly)
 *   - validate custom domain strings (RFC-1034-ish, with Malaysian TLD bias)
 *   - build a `WhiteLabelPreviewData` payload for the right-hand preview pane
 *
 * These functions are dependency-free and safe to import on both server and
 * client (`'use client'` page imports them, API routes import them too).
 */

import {
  DEFAULT_BRAND_COLORS,
  type BrandColors,
  type WhiteLabelConfig,
  type WhiteLabelPreviewData,
} from './types'

/* ------------------------------------------------------------------ */
/* Colour helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Returns `true` when the given string is a valid `#RRGGBB` / `#RGB` hex colour.
 * Used by both the validation pass and the colour inputs' onChange handlers.
 */
export function isValidHex(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

/**
 * Normalises a 3-digit hex to a 6-digit hex. Leaves 6-digit hex untouched.
 * Returns the default primary if the input is invalid.
 */
export function normalizeHex(value: string, fallback = '#000000'): string {
  const v = value.trim()
  if (!isValidHex(v)) return fallback
  if (v.length === 4) {
    // #RGB → #RRGGBB
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  }
  return v.toUpperCase()
}

/**
 * Converts a hex colour to its `r, g, b` numeric components.
 * Returns `{0,0,0}` for invalid input.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex)
  const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(h)
  if (!m) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  }
}

/** `rgba()` string with the given alpha, suitable for inline styles. */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Compute the relative luminance of a hex colour (0-1). Used to decide
 * whether the foreground on top of a coloured surface should be light or dark.
 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const toLinear = (c: number): number => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * Returns `#FFFFFF` or `#0A0A0A` depending on which contrasts better with
 * the supplied background colour. Used for primary-button text, sidebar
 * active-item text, etc.
 */
export function contrastingForeground(bgHex: string): string {
  return relativeLuminance(bgHex) > 0.5 ? '#0A0A0A' : '#FFFFFF'
}

/* ------------------------------------------------------------------ */
/* Branding application                                                 */
/* ------------------------------------------------------------------ */

/**
 * Builds the CSS custom property map for a given white-label config.
 *
 * The returned object can be spread onto a wrapper element's `style` prop:
 *
 * ```tsx
 * <div style={applyBranding(config)}>…</div>
 * ```
 *
 * The variables are intentionally prefixed `--wl-*` so they cannot collide
 * with the global theme tokens (`--primary`, `--shopee`, etc.).
 */
export function applyBranding(
  config: Partial<WhiteLabelConfig> | null | undefined,
): Record<string, string> {
  const colors: BrandColors = {
    ...DEFAULT_BRAND_COLORS,
    ...(config?.colors ?? {}),
  }
  const primary = normalizeHex(colors.primary, DEFAULT_BRAND_COLORS.primary)
  const secondary = normalizeHex(colors.secondary, DEFAULT_BRAND_COLORS.secondary)
  const accent = normalizeHex(colors.accent, DEFAULT_BRAND_COLORS.accent)

  return {
    '--wl-primary': primary,
    '--wl-secondary': secondary,
    '--wl-accent': accent,
    '--wl-primary-fg': contrastingForeground(primary),
    '--wl-secondary-fg': contrastingForeground(secondary),
    '--wl-accent-fg': contrastingForeground(accent),
    '--wl-primary-10': hexToRgba(primary, 0.1),
    '--wl-primary-20': hexToRgba(primary, 0.2),
    '--wl-primary-50': hexToRgba(primary, 0.5),
    '--wl-accent-20': hexToRgba(accent, 0.2),
  }
}

/**
 * Returns Tailwind class string overrides for the preview pane. Since the
 * preview lives inside a wrapper with the `--wl-*` CSS vars set, these
 * classes reference those vars via arbitrary-value syntax
 * (e.g. `bg-[var(--wl-primary)]`).
 *
 * Returned as a structured object so the React component can apply each
 * override to its semantic target without string parsing.
 */
export function getThemeOverride(
  _config: Partial<WhiteLabelConfig> | null | undefined,
): {
  primaryBg: string
  primaryText: string
  secondaryBg: string
  accentBg: string
  ring: string
  sidebarActive: string
} {
  // All overrides resolve through the CSS vars set by `applyBranding`.
  // We intentionally don't branch on `config` here so the classes are stable
  // across renders (Framer Motion can transition colours via CSS vars).
  return {
    primaryBg: 'bg-[var(--wl-primary)]',
    primaryText: 'text-[var(--wl-primary)]',
    secondaryBg: 'bg-[var(--wl-secondary)]',
    accentBg: 'bg-[var(--wl-accent)]',
    ring: 'ring-[var(--wl-primary)]',
    sidebarActive: 'bg-[var(--wl-primary)] text-[var(--wl-primary-fg)]',
  }
}

/* ------------------------------------------------------------------ */
/* Domain validation                                                    */
/* ------------------------------------------------------------------ */

/**
 * Validates a custom domain string.
 *
 * Rules (kept pragmatic for the demo):
 *   - 3-253 chars total
 *   - Lowercase letters, digits, hyphens, dots only
 *   - Each label 1-63 chars, no leading/trailing hyphen
 *   - Must have at least one dot
 *   - TLD must be 2+ letters (covers .my, .com.my, .sg, .com, .asia, etc.)
 *
 * Returns `true` for valid domains, `false` otherwise. Empty string is
 * considered valid (means "no custom domain yet").
 */
export function validateDomain(domain: string): boolean {
  const d = domain.trim().toLowerCase()
  if (d === '') return true
  if (d.length > 253) return false
  if (!/^[a-z0-9.-]+$/.test(d)) return false
  if (!d.includes('.')) return false

  const labels = d.split('.')
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false
    if (label.startsWith('-') || label.endsWith('-')) return false
  }

  // TLD must be all-letters and at least 2 chars
  const tld = labels[labels.length - 1]
  return /^[a-z]{2,}$/.test(tld)
}

/**
 * Returns a human-readable description of why a domain is invalid. Empty
 * string when the domain is valid (or empty).
 */
export function describeDomainError(domain: string): string {
  const d = domain.trim().toLowerCase()
  if (d === '') return ''
  if (d.length > 253) return 'Domain terlalu panjang (max 253 aksara).'
  if (!/^[a-z0-9.-]+$/.test(d))
    return 'Hanya huruf kecil, nombor, hyphen dan titik dibenarkan.'
  if (!d.includes('.')) return 'Domain mesti ada sekurang-kurangnya satu titik (cth: affiliate.brand.my).'
  for (const label of d.split('.')) {
    if (label.length === 0) return 'Label kosong — ada titik berturut-turut.'
    if (label.length > 63) return `Label "${label}" terlalu panjang (max 63 aksara).`
    if (label.startsWith('-') || label.endsWith('-'))
      return `Label "${label}" tak boleh mula/akhir dengan hyphen.`
  }
  const tld = d.split('.').pop() ?? ''
  if (!/^[a-z]{2,}$/.test(tld))
    return `TLD ".${tld}" tak sah — mesti 2+ huruf (cth: .my, .com, .sg).`
  return ''
}

/* ------------------------------------------------------------------ */
/* Preview data builder                                                 */
/* ------------------------------------------------------------------ */

const SAMPLE_SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: 'LayoutDashboard', active: true },
  { label: 'Products', icon: 'Package' },
  { label: 'Links', icon: 'Link' },
  { label: 'Analytics', icon: 'BarChart3' },
  { label: 'Earnings', icon: 'Wallet' },
  { label: 'Settings', icon: 'Settings' },
]

const SAMPLE_PRODUCT = {
  name: 'Baju Kurung Moden Premium',
  price: 'RM 89.90',
  commission: '12% / RM 10.79',
  thumbnail:
    'https://placehold.co/120x120/FFFFFF/18181B/png?text=Baju+Kurung&font=raleway',
}

const SAMPLE_NOTIFICATION = {
  title: 'Commission XTRA Aktif!',
  message: 'Produk "Kopi Susu Tambun" dapat commission boost 18% selama 6 jam akan datang. Jangan lepaskan!',
}

const SAMPLE_STAT = {
  label: 'Pendapatan Bulan Ini',
  value: 'RM 4,520.50',
  delta: '+18.4%',
}

/**
 * Builds the preview payload shown in the right-hand pane of the admin UI.
 *
 * This is the same shape that `POST /api/whitelabel/preview` returns, so
 * the client can either call the API for a server-rendered preview or call
 * this function locally for instant updates as the user types.
 */
export function previewBranding(
  config: Partial<WhiteLabelConfig> | null | undefined,
): WhiteLabelPreviewData {
  const cssVars = applyBranding(config)
  const themeOverrides = getThemeOverride(config)
  const brandName = config?.brandName?.trim() || 'TheViralFindsMY'
  const tagline = config?.tagline?.trim() || 'AI-Powered Affiliate Manager'
  const logoUrl =
    config?.logoUrl?.trim() ||
    'https://placehold.co/200x60/EE4D2D/FFFFFF/png?text=YourBrand&font=raleway'
  const domain = config?.domain?.domain?.trim() ?? ''
  const domainValid = validateDomain(domain)

  return {
    cssVars,
    themeOverrides,
    sampleDashboard: {
      brandName,
      logoUrl,
      tagline,
      sidebarItems: SAMPLE_SIDEBAR_ITEMS,
      sampleProduct: SAMPLE_PRODUCT,
      sampleNotification: SAMPLE_NOTIFICATION,
      sampleStat: SAMPLE_STAT,
    },
    domainValid,
    source: 'mock',
  }
}

/* ------------------------------------------------------------------ */
/* Misc helpers                                                          */
/* ------------------------------------------------------------------ */

/**
 * Merges a partial config onto the default TheViralFindsMY config. Used by
 * the API when persisting a save request so missing fields keep their
 * default values rather than `undefined`.
 */
export function mergeWithDefaults(
  partial: Partial<WhiteLabelConfig>,
): Omit<WhiteLabelConfig, 'id' | 'orgId' | 'createdAt' | 'updatedAt'> {
  return {
    brandName: partial.brandName?.trim() || 'TheViralFindsMY',
    logoUrl:
      partial.logoUrl?.trim() ||
      'https://placehold.co/200x60/EE4D2D/FFFFFF/png?text=YourBrand&font=raleway',
    faviconUrl: partial.faviconUrl?.trim() || undefined,
    colors: {
      primary: normalizeHex(
        partial.colors?.primary ?? '',
        DEFAULT_BRAND_COLORS.primary,
      ),
      secondary: normalizeHex(
        partial.colors?.secondary ?? '',
        DEFAULT_BRAND_COLORS.secondary,
      ),
      accent: normalizeHex(
        partial.colors?.accent ?? '',
        DEFAULT_BRAND_COLORS.accent,
      ),
    },
    domain: {
      domain: partial.domain?.domain?.trim() ?? '',
      status: partial.domain?.status ?? 'not_configured',
      cnameTarget:
        partial.domain?.cnameTarget ?? 'whitelabel.theviralfindsmy.com',
      lastVerifiedAt: partial.domain?.lastVerifiedAt ?? null,
      sslStatus: partial.domain?.sslStatus ?? 'none',
    },
    emailTemplates: partial.emailTemplates ?? [],
    plan: partial.plan ?? 'enterprise',
    status: partial.status ?? 'active',
    contactEmail: partial.contactEmail?.trim() || 'support@theviralfindsmy.com',
    tagline: partial.tagline?.trim() || 'AI-Powered Affiliate Manager',
  }
}
