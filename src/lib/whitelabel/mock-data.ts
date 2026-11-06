/**
 * White-Label Configuration — Mock Data
 *
 * Fasa 4.4 (CHECKLIST Section 4.4 — White-Label Option).
 *
 * Five realistic Malaysian / regional enterprise tenants, each with their
 * own brand identity (logo URL, colour palette, custom domain, email
 * templates, plan, status). Used by:
 *   - `/api/whitelabel/config`  → returns the "current org" config (defaults
 *     to ShopHijau for demo) and lists all tenants for the super-admin table.
 *   - `/api/whitelabel/preview` → builds preview data for any supplied config.
 *   - The admin UI's "Active White-Labels" table.
 */

import type { EmailTemplate, WhiteLabelConfig } from './types'

/* ------------------------------------------------------------------ */
/* Email template factory                                              */
/* ------------------------------------------------------------------ */

const TEMPLATE_VARIABLES: Record<EmailTemplate['type'], string[]> = {
  welcome: ['{brandName}', '{userName}', '{loginUrl}', '{supportEmail}'],
  notification: ['{brandName}', '{userName}', '{notificationTitle}', '{notificationBody}', '{ctaUrl}'],
  digest: ['{brandName}', '{userName}', '{period}', '{totalClicks}', '{totalConversions}', '{totalEarnings}', '{topProduct}'],
  promotion: ['{brandName}', '{userName}', '{productName}', '{discount}', '{promoCode}', '{expiryDate}', '{shopUrl}'],
}

function buildEmailTemplates(
  brandName: string,
  custom: Partial<Record<EmailTemplate['type'], { subject?: string; body?: string }>> = {},
): EmailTemplate[] {
  const types: EmailTemplate['type'][] = ['welcome', 'notification', 'digest', 'promotion']
  const names: Record<EmailTemplate['type'], string> = {
    welcome: 'Welcome Email',
    notification: 'Notification Email',
    digest: 'Daily Digest',
    promotion: 'Promotion Email',
  }
  const defaults: Record<EmailTemplate['type'], { subject: string; body: string }> = {
    welcome: {
      subject: `Selamat datang ke ${brandName}, {userName}! 🎉`,
      body: `Hi {userName},\n\nTerima kasih kerana menyertai ${brandName}. Platform kami membantu anda uruskan affiliate links, track earnings, dan dapatkan AI insights — semua dalam satu tempat.\n\nLog masuk di {loginUrl} untuk mula.\n\nSokongan: {supportEmail}\n\n— Pasukan ${brandName}`,
    },
    notification: {
      subject: `[${brandName}] {notificationTitle}`,
      body: `Hi {userName},\n\n{notificationTitle}\n\n{notificationBody}\n\nKlik di sini untuk lanjut: {ctaUrl}\n\n— ${brandName}`,
    },
    digest: {
      subject: `Daily Digest ${brandName} — {period}`,
      body: `Hi {userName},\n\nRingkasan {period}:\n• Klik: {totalClicks}\n• Konversi: {totalConversions}\n• Pendapatan: {totalEarnings}\n• Produk terbaik: {topProduct}\n\nTeruskan berusaha! 💪\n\n— ${brandName}`,
    },
    promotion: {
      subject: `🔥 {productName} — {discount} OFF di ${brandName}!`,
      body: `Hi {userName},\n\nTawaran terhad untuk {productName}!\n\nDiskaun: {discount}\nKod promo: {promoCode}\nBerakhir: {expiryDate}\n\nBeli sekarang: {shopUrl}\n\nJangan lepaskan!\n\n— ${brandName}`,
    },
  }

  return types.map((type) => {
    const c = custom[type] ?? {}
    const d = defaults[type]
    return {
      type,
      name: names[type],
      subject: c.subject ?? d.subject,
      body: c.body ?? d.body,
      customized: Boolean(c.subject || c.body),
      availableVariables: TEMPLATE_VARIABLES[type],
    }
  })
}

/* ------------------------------------------------------------------ */
/* The five enterprise tenants                                         */
/* ------------------------------------------------------------------ */

/** 1. ShopHijau — green eco-friendly affiliate agency (the demo "current org"). */
export const SHOPIJAU_CONFIG: WhiteLabelConfig = {
  id: 'wl-shophijau',
  orgId: 'org-shophijau',
  brandName: 'ShopHijau',
  logoUrl:
    'https://placehold.co/200x60/059669/FFFFFF/png?text=ShopHijau&font=raleway',
  colors: { primary: '#059669', secondary: '#047857', accent: '#6EE7B7' },
  domain: {
    domain: 'affiliate.shophijau.my',
    status: 'verified',
    cnameTarget: 'whitelabel.theviralfindsmy.com',
    lastVerifiedAt: '2025-09-12T03:14:22Z',
    sslStatus: 'active',
  },
  emailTemplates: buildEmailTemplates('ShopHijau', {
    welcome: {
      subject: 'Selamat datang ke ShopHijau 🌿 {userName}',
    },
  }),
  plan: 'enterprise',
  status: 'active',
  createdAt: '2025-03-04T01:20:00Z',
  updatedAt: '2025-10-18T07:42:11Z',
  contactEmail: 'hello@shophijau.my',
  tagline: 'Eco-Friendly Affiliate Network',
}

/** 2. AffiliatePro MY — purple professional agency. */
export const AFFILIATE_PRO_CONFIG: WhiteLabelConfig = {
  id: 'wl-affiliatepro',
  orgId: 'org-affiliatepro',
  brandName: 'AffiliatePro MY',
  logoUrl:
    'https://placehold.co/200x60/7C3AED/FFFFFF/png?text=AffiliatePro+MY&font=raleway',
  colors: { primary: '#7C3AED', secondary: '#5B21B6', accent: '#C4B5FD' },
  domain: {
    domain: 'app.affiliatepro.my',
    status: 'verified',
    cnameTarget: 'whitelabel.theviralfindsmy.com',
    lastVerifiedAt: '2025-08-22T09:11:00Z',
    sslStatus: 'active',
  },
  emailTemplates: buildEmailTemplates('AffiliatePro MY'),
  plan: 'enterprise',
  status: 'active',
  createdAt: '2025-02-15T05:00:00Z',
  updatedAt: '2025-10-10T14:22:00Z',
  contactEmail: 'admin@affiliatepro.my',
  tagline: 'Professional Affiliate Management',
}

/** 3. Kedai Viral — orange/red local Malaysian agency. */
export const KEDAI_VIRAL_CONFIG: WhiteLabelConfig = {
  id: 'wl-kedaiviral',
  orgId: 'org-kedaiviral',
  brandName: 'Kedai Viral',
  logoUrl:
    'https://placehold.co/200x60/D97706/FFFFFF/png?text=Kedai+Viral&font=raleway',
  colors: { primary: '#D97706', secondary: '#B45309', accent: '#FCD34D' },
  domain: {
    domain: 'dashboard.kedaiviral.com.my',
    status: 'pending',
    cnameTarget: 'whitelabel.theviralfindsmy.com',
    lastVerifiedAt: '2025-10-19T11:30:00Z',
    sslStatus: 'pending',
  },
  emailTemplates: buildEmailTemplates('Kedai Viral', {
    promotion: {
      subject: '🔥 VIRAL SEKARANG: {productName} — {discount} OFF!',
      body: 'Hi {userName},\n\nProduk ni tengah viral sekarang: {productName} 🤯\n\nDiskaun: {discount}\nKod: {promoCode}\nBerakhir: {expiryDate}\n\nCepat sbelum habis: {shopUrl}\n\n— Kedai Viral Team',
    },
  }),
  plan: 'agency',
  status: 'pending',
  createdAt: '2025-09-01T02:00:00Z',
  updatedAt: '2025-10-19T11:30:00Z',
  contactEmail: 'support@kedaiviral.com.my',
  tagline: 'Malaysia\'s Viral Product Hub',
}

/** 4. TrendingAsia — dark theme regional agency. */
export const TRENDING_ASIA_CONFIG: WhiteLabelConfig = {
  id: 'wl-trendingasia',
  orgId: 'org-trendingasia',
  brandName: 'TrendingAsia',
  logoUrl:
    'https://placehold.co/200x60/18181B/FAFAFA/png?text=TrendingAsia&font=raleway',
  colors: { primary: '#18181B', secondary: '#3F3F46', accent: '#A1A1AA' },
  domain: {
    domain: 'app.trendingasia.sg',
    status: 'verified',
    cnameTarget: 'whitelabel.theviralfindsmy.com',
    lastVerifiedAt: '2025-07-30T06:45:00Z',
    sslStatus: 'active',
  },
  emailTemplates: buildEmailTemplates('TrendingAsia'),
  plan: 'enterprise',
  status: 'active',
  createdAt: '2025-01-20T03:00:00Z',
  updatedAt: '2025-10-05T16:18:00Z',
  contactEmail: 'contact@trendingasia.sg',
  tagline: 'Regional Affiliate Intelligence',
}

/** 5. Boost Affiliate — teal performance agency (blue-free per project rules). */
export const BOOST_AFFILIATE_CONFIG: WhiteLabelConfig = {
  id: 'wl-boostaffiliate',
  orgId: 'org-boostaffiliate',
  brandName: 'Boost Affiliate',
  logoUrl:
    'https://placehold.co/200x60/0D9488/FFFFFF/png?text=Boost+Affiliate&font=raleway',
  colors: { primary: '#0D9488', secondary: '#0F766E', accent: '#5EEAD4' },
  domain: {
    domain: 'panel.boost-affiliate.com',
    status: 'failed',
    cnameTarget: 'whitelabel.theviralfindsmy.com',
    lastVerifiedAt: '2025-10-18T22:05:00Z',
    sslStatus: 'none',
  },
  emailTemplates: buildEmailTemplates('Boost Affiliate', {
    digest: {
      subject: '🚀 Your Boost Performance — {period}',
    },
  }),
  plan: 'reseller',
  status: 'suspended',
  createdAt: '2025-05-12T08:00:00Z',
  updatedAt: '2025-10-18T22:05:00Z',
  contactEmail: 'ops@boost-affiliate.com',
  tagline: 'Performance Affiliate Platform',
}

/** All five enterprise tenants, in display order. */
export const ALL_WHITELABEL_CONFIGS: WhiteLabelConfig[] = [
  SHOPIJAU_CONFIG,
  AFFILIATE_PRO_CONFIG,
  KEDAI_VIRAL_CONFIG,
  TRENDING_ASIA_CONFIG,
  BOOST_AFFILIATE_CONFIG,
]

/**
 * Look up a tenant config by org id. Falls back to `null` when not found so
 * the caller can decide whether to surface the default TheViralFindsMY config.
 */
export function getConfigByOrgId(orgId: string): WhiteLabelConfig | null {
  return ALL_WHITELABEL_CONFIGS.find((c) => c.orgId === orgId) ?? null
}

/**
 * Returns the "current" config — for the demo we treat ShopHijau as the
 * currently-logged-in enterprise tenant, since they have a verified domain
 * and the richest set of customisations.
 */
export function getCurrentConfig(): WhiteLabelConfig {
  return SHOPIJAU_CONFIG
}
