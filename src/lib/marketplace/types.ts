/**
 * Affiliate Content Marketplace — Type Definitions
 *
 * Fasa 4.2 (CHECKLIST Section 4.2).
 *
 * The marketplace lets Malaysian affiliates buy and sell reusable content
 * templates: video scripts, captions, hashtag sets, thumbnail designs,
 * live shopping scripts, and email templates. Sellers receive revenue
 * (minus a marketplace fee); buyers get an instant download URL after
 * purchase.
 *
 * All currency values are in Malaysian Ringgit (RM). Time values are
 * ISO-8601 strings.
 */

/** Source flag included on every API response. */
export type MarketplaceDataSource = 'mock'

/** The six template categories supported by the marketplace. */
export type ListingCategory =
  | 'video_scripts' // 🎬 TikTok / Reels video scripts
  | 'captions' // ✍️ Caption templates for posts
  | 'hashtag_sets' // #️⃣ Curated hashtag bundles
  | 'thumbnail_designs' // 🖼️ PSD / Canva thumbnail templates
  | 'live_scripts' // 📡 Live shopping script templates
  | 'email_templates' // 📧 Email / newsletter templates

/** Platforms a listing can target. */
export type ListingPlatform = 'shopee' | 'tiktok' | 'lazada' | 'all'

/** Affiliate niches (matches other parts of the app). */
export type ListingNiche = 'beauty' | 'tech' | 'fashion' | 'home' | 'food'

/** Sort modes accepted by the listings API. */
export type ListingSort =
  | 'popular' // most downloads first
  | 'newest' // most recently created first
  | 'price_low' // cheapest first
  | 'price_high' // most expensive first
  | 'rating' // highest rating first

/** Payment methods supported at checkout. */
export type PaymentMethod = 'stripe' | 'billplz'

/**
 * The actual content payload that a buyer downloads after purchase.
 *
 * The seller pastes this as raw text / markdown / link list at listing
 * creation time. The marketplace stores the full version (returned only
 * after purchase) and shows a watermarked preview before that.
 */
export interface ContentTemplate {
  /** Markdown / plain-text body of the template. */
  body: string
  /** Optional list of file URLs (PSD, Canva, PDF). */
  files?: string[]
  /** Optional usage notes (e.g. "Replace [PRODUCT] with your item name"). */
  usageNotes?: string
}

/**
 * A single star-rating review left by a buyer on a listing.
 */
export interface ListingReview {
  /** Stable id. */
  id: string
  /** Listing being reviewed. */
  listingId: string
  /** Reviewer display name. */
  reviewerName: string
  /** Reviewer avatar URL. */
  reviewerAvatar: string
  /** 0-5 star rating. */
  rating: number
  /** Review text. */
  comment: string
  /** ISO-8601 timestamp. */
  createdAt: string
}

/**
 * A seller's public profile + dashboard stats.
 */
export interface SellerProfile {
  /** Stable id. */
  id: string
  /** Display name (Malaysian context). */
  name: string
  /** Avatar URL. */
  avatar: string
  /** Short bio. */
  bio: string
  /** Total lifetime sales (units). */
  totalSales: number
  /** Total lifetime revenue in RM (after marketplace fee). */
  totalRevenue: number
  /** Number of active listings. */
  listingCount: number
  /** Average star rating across all listings. */
  rating: number
  /** Total reviews across all listings. */
  reviewCount: number
  /** ISO-8601 timestamp the seller joined. */
  joinedAt: string
  /** Whether the current user "is" this seller (dashboard view). */
  isCurrentUser?: boolean
}

/**
 * A single marketplace listing.
 */
export interface MarketplaceListing {
  /** Stable id (e.g. "lst-001"). */
  id: string
  /** Display title. */
  title: string
  /** Long-form description shown on the detail dialog. */
  description: string
  /** Listing category. */
  category: ListingCategory
  /** Platform filter. */
  platform: ListingPlatform
  /** Primary niche. */
  niche: ListingNiche
  /** Price in RM. */
  price: number
  /** Original price for "discount" display (optional). */
  originalPrice?: number
  /** Seller id (links to SellerProfile.id). */
  sellerId: string
  /** Seller display name (denormalised for convenience). */
  sellerName: string
  /** Seller avatar URL (denormalised). */
  sellerAvatar: string
  /** Total download count (lifetime). */
  downloads: number
  /** Average star rating 0-5. */
  rating: number
  /** Total review count. */
  reviewCount: number
  /** Square preview thumbnail URL. */
  previewUrl: string
  /** Searchable tag list. */
  tags: string[]
  /** Watermarked preview snippet (free, shown before purchase). */
  previewSnippet: string
  /** Full content (returned only on listing detail route and after purchase). */
  content?: ContentTemplate
  /** Bullet-point feature list shown on detail dialog. */
  features: string[]
  /** Whether the listing is currently published. */
  isActive: boolean
  /** Whether the current user has purchased this listing. */
  isPurchased?: boolean
  /** ISO-8601 timestamp the listing was created. */
  createdAt: string
  /** ISO-8601 timestamp the listing was last updated. */
  updatedAt: string
}

/**
 * A purchase record (returned by the purchase API).
 */
export interface Purchase {
  /** Stable id. */
  id: string
  /** Listing purchased. */
  listingId: string
  /** Listing title (denormalised). */
  listingTitle: string
  /** Buyer display name (mock = current user). */
  buyerName: string
  /** Amount paid in RM. */
  amount: number
  /** Marketplace fee in RM (15% of amount). */
  fee: number
  /** Seller payout in RM (amount - fee). */
  sellerPayout: number
  /** Payment method used. */
  paymentMethod: PaymentMethod
  /** Mock download URL for the full content. */
  downloadUrl: string
  /** ISO-8601 timestamp. */
  purchasedAt: string
  /** Payment status. */
  status: 'completed' | 'pending' | 'failed'
}

/**
 * Monthly sales data point for the seller dashboard chart.
 */
export interface SellerSalesPoint {
  /** Month label (e.g. "Jan"). */
  month: string
  /** Sales count that month. */
  sales: number
  /** Revenue that month (RM, after fee). */
  revenue: number
}

/**
 * Seller dashboard aggregate stats returned by the seller API.
 */
export interface SellerDashboard {
  profile: SellerProfile
  listings: MarketplaceListing[]
  recentSales: Purchase[]
  monthly: SellerSalesPoint[]
  totalEarnings: number
  totalSales: number
  avgRating: number
  pendingPayout: number
  source: MarketplaceDataSource
}

// ─── API Response Shapes ────────────────────────────────────────────────────

export interface MarketplaceListingsResponse {
  listings: MarketplaceListing[]
  total: number
  featured: MarketplaceListing[]
  categories: ListingCategory[]
  source: MarketplaceDataSource
}

export interface MarketplaceListingDetailResponse {
  listing: MarketplaceListing
  reviews: ListingReview[]
  related: MarketplaceListing[]
  source: MarketplaceDataSource
}

export interface CreateListingRequest {
  title: string
  description: string
  category: ListingCategory
  platform: ListingPlatform
  niche: ListingNiche
  price: number
  originalPrice?: number
  previewSnippet: string
  contentBody: string
  features?: string[]
  tags?: string[]
}

export interface CreateListingResponse {
  success: boolean
  listing: MarketplaceListing
  source: MarketplaceDataSource
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {
  isActive?: boolean
}

export interface PurchaseRequest {
  listingId: string
  paymentMethod: PaymentMethod
}

export interface PurchaseResponse {
  success: boolean
  purchase: Purchase
  listing: MarketplaceListing
  source: MarketplaceDataSource
}

export interface CreateSellerRequest {
  name: string
  bio: string
  avatar?: string
}

export interface CreateSellerResponse {
  success: boolean
  profile: SellerProfile
  source: MarketplaceDataSource
}

// ─── Static Lookup Tables (shared with mock-data + UI) ─────────────────────

export const CATEGORY_META: Record<
  string,
  { label: string; emoji: string; description: string }
> = {
  video_scripts: {
    label: 'Video Scripts',
    emoji: '🎬',
    description: 'TikTok / Reels video scripts with hooks + CTAs',
  },
  captions: {
    label: 'Captions',
    emoji: '✍️',
    description: 'Caption templates for posts and product listings',
  },
  hashtag_sets: {
    label: 'Hashtag Sets',
    emoji: '#️⃣',
    description: 'Curated hashtag bundles for Malaysian market',
  },
  thumbnail_designs: {
    label: 'Thumbnail Designs',
    emoji: '🖼️',
    description: 'PSD / Canva templates for thumbnails',
  },
  live_scripts: {
    label: 'Live Scripts',
    emoji: '📡',
    description: 'Live shopping script templates (Manglish ready)',
  },
  email_templates: {
    label: 'Email Templates',
    emoji: '📧',
    description: 'Newsletter / broadcast email templates',
  },
  // DB seeded categories
  templates: {
    label: 'Template Packs',
    emoji: '📦',
    description: 'Affiliate campaign and design template packs',
  },
  scripts: {
    label: 'Scripts',
    emoji: '🎬',
    description: 'Shopee Live & video shopping scripts',
  },
  research: {
    label: 'Research',
    emoji: '🔍',
    description: 'Hashtags, keyword research & trend bundles',
  },
}

export function getCategoryMeta(category?: string | null): { label: string; emoji: string; description: string } {
  if (!category) {
    return { label: 'Templates', emoji: '📦', description: 'Affiliate templates & resources' }
  }
  const normalized = category.toLowerCase().trim()
  if (CATEGORY_META[normalized]) {
    return CATEGORY_META[normalized]
  }
  return {
    label: category.charAt(0).toUpperCase() + category.slice(1),
    emoji: '📁',
    description: 'Affiliate content resources',
  }
}

export const PLATFORM_META: Record<
  ListingPlatform,
  { label: string; color: string }
> = {
  shopee: { label: 'Shopee', color: 'bg-orange-500' },
  tiktok: { label: 'TikTok', color: 'bg-pink-500' },
  lazada: { label: 'Lazada', color: 'bg-purple-500' },
  all: { label: 'All Platforms', color: 'bg-emerald-500' },
}

export const NICHE_META: Record<ListingNiche, { label: string; emoji: string }> = {
  beauty: { label: 'Beauty', emoji: '💄' },
  tech: { label: 'Tech', emoji: '💻' },
  fashion: { label: 'Fashion', emoji: '👗' },
  home: { label: 'Home', emoji: '🏠' },
  food: { label: 'Food', emoji: '🍜' },
}

/** Marketplace fee percentage (deducted from seller payout). */
export const MARKETPLACE_FEE_PERCENT = 15

/** Default seller id used for the "current user" seller profile. */
export const CURRENT_SELLER_ID = 'seller-me'
