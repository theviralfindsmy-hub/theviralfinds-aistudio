import type { ThumbnailPlatform, ThumbnailSize } from './types'

/**
 * Canonical thumbnail sizes per platform. Ordered to mirror the UI radio
 * selector (TikTok → IG Square → IG Story → Facebook → YouTube).
 */
export const THUMBNAIL_SIZES: Record<ThumbnailPlatform, ThumbnailSize> = {
  tiktok: {
    platform: 'tiktok',
    label: 'TikTok',
    width: 1080,
    height: 1920,
    aspectRatio: '9 / 16',
    orientation: 'vertical',
  },
  instagram_square: {
    platform: 'instagram_square',
    label: 'Instagram Square',
    width: 1080,
    height: 1080,
    aspectRatio: '1 / 1',
    orientation: 'square',
  },
  instagram_story: {
    platform: 'instagram_story',
    label: 'Instagram Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9 / 16',
    orientation: 'vertical',
  },
  facebook: {
    platform: 'facebook',
    label: 'Facebook',
    width: 1200,
    height: 630,
    aspectRatio: '40 / 21',
    orientation: 'horizontal',
  },
  youtube: {
    platform: 'youtube',
    label: 'YouTube',
    width: 1280,
    height: 720,
    aspectRatio: '16 / 9',
    orientation: 'horizontal',
  },
}

/** Ordered list — useful for rendering the platform selector. */
export const THUMBNAIL_SIZE_LIST: ThumbnailSize[] = [
  THUMBNAIL_SIZES.tiktok,
  THUMBNAIL_SIZES.instagram_square,
  THUMBNAIL_SIZES.instagram_story,
  THUMBNAIL_SIZES.facebook,
  THUMBNAIL_SIZES.youtube,
]

/** Look up a size by platform id (defaults to TikTok vertical). */
export function getSize(platform: ThumbnailPlatform): ThumbnailSize {
  return THUMBNAIL_SIZES[platform] ?? THUMBNAIL_SIZES.tiktok
}

/**
 * Map a target image-generation pixel size from the SDK's supported set to a
 * given platform. The SDK only supports a handful of sizes, so we pick the
 * closest match by orientation. We return the original platform dimensions
 * separately for downstream resize / crop logic on the client.
 */
export function getSdkSizeForPlatform(
  platform: ThumbnailPlatform
): '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440' {
  switch (platform) {
    case 'tiktok':
    case 'instagram_story':
      return '768x1344' // vertical 9:16
    case 'instagram_square':
      return '1024x1024' // 1:1
    case 'facebook':
      return '1440x720' // wide 2:1
    case 'youtube':
      return '1344x768' // 16:9
    default:
      return '768x1344'
  }
}
