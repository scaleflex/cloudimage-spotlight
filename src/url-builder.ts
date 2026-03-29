import type { SpotlightRegion, SceneImageVariant, BoundingBox } from './types';

/**
 * Build a Cloudimage CDN URL for a scene image variant.
 *
 * When `ciToken` is provided, builds a full Cloudimage URL:
 *   `https://{ciToken}.cloudimg.io/{originUrl}?...`
 *
 * When `ciToken` is omitted, the image URL is assumed to already be a
 * complete CDN URL — query parameters are appended directly.
 *
 * @param originUrl - The origin image URL (full URL when no token, or path when token is set)
 * @param ciToken - Cloudimage token (optional — omit when URLs already include CDN)
 * @param variant - Which image variant to generate
 * @param regions - Scene regions (used for "zoomed" variant bounding box)
 * @param containerWidth - Current container width in CSS pixels (default 1200)
 * @param dpr - Device pixel ratio (clamped 1–3, default 1)
 * @param blurRadius - Blur radius for "blurred" variant (default 8)
 * @param naturalWidth - Original image width in pixels (required for "zoomed" variant)
 * @param naturalHeight - Original image height in pixels (required for "zoomed" variant)
 * @param zoomPadding - Scene-level zoom padding override (0–1 normalized, overrides per-region padding)
 */
export function buildCiUrl(
  originUrl: string,
  ciToken: string | undefined,
  variant: SceneImageVariant,
  regions?: SpotlightRegion[],
  containerWidth?: number,
  dpr?: number,
  blurRadius?: number,
  naturalWidth?: number,
  naturalHeight?: number,
  zoomPadding?: number,
): string {
  const base = ciToken
    ? `https://${ciToken}.cloudimg.io/${stripProtocol(originUrl)}`
    : originUrl;
  const sep = base.includes('?') ? '&' : '?';
  const clampedDpr = Math.min(Math.max(dpr ?? 1, 1), 3);
  const w = roundWidth(containerWidth ?? 1200);

  switch (variant) {
    case 'full':
      return `${base}${sep}w=${w}&dpr=${clampedDpr}&q=85&org_if_sml=1`;

    case 'zoomed': {
      if (!regions || regions.length === 0 || !naturalWidth || !naturalHeight) {
        return buildCiUrl(originUrl, ciToken, 'full', undefined, containerWidth, dpr);
      }
      const { x1, y1, x2, y2 } = getPaddedCropBounds(regions, zoomPadding);
      const tlX = Math.round(x1 * naturalWidth);
      const tlY = Math.round(y1 * naturalHeight);
      const brX = Math.round(x2 * naturalWidth);
      const brY = Math.round(y2 * naturalHeight);
      return (
        `${base}${sep}func=crop` +
        `&tl_px=${tlX},${tlY}` +
        `&br_px=${brX},${brY}` +
        `&w=${w}&dpr=${clampedDpr}&org_if_sml=1`
      );
    }

    case 'blurred': {
      const blur = blurRadius ?? 8;
      return `${base}${sep}blur=${blur}&w=${w}&dpr=${clampedDpr}&q=70&org_if_sml=1`;
    }

    default: {
      const _exhaustive: never = variant;
      throw new Error(`Unknown image variant: ${_exhaustive}`);
    }
  }
}

/**
 * Returns the smallest bounding box that contains all provided regions.
 * Used when multiple regions exist and zoom: true — we zoom to show all of them.
 */
export function getRegionsBoundingBox(regions: SpotlightRegion[]): BoundingBox {
  return {
    tl_x: Math.min(...regions.map((r) => r.tl_x)),
    tl_y: Math.min(...regions.map((r) => r.tl_y)),
    br_x: Math.max(...regions.map((r) => r.br_x)),
    br_y: Math.max(...regions.map((r) => r.br_y)),
    padding: Math.max(...regions.map((r) => r.padding ?? 0.02)),
  };
}

/**
 * Compute the padded bounding box for a set of regions, clamped to 0–1.
 * Shared by buildCiUrl (zoomed), remapRegionsForZoom, and computeZoomTransform.
 */
export function getPaddedCropBounds(
  regions: SpotlightRegion[],
  zoomPadding?: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const bounds = getRegionsBoundingBox(regions);
  const pad = zoomPadding ?? bounds.padding;
  return {
    x1: Math.max(0, bounds.tl_x - pad),
    y1: Math.max(0, bounds.tl_y - pad),
    x2: Math.min(1, bounds.br_x + pad),
    y2: Math.min(1, bounds.br_y + pad),
  };
}

/** Strip protocol and encode for use in Cloudimage URL path */
export function stripProtocol(url: string): string {
  return encodeURI(url.replace(/^https?:\/\//, ''));
}

/** Round up to nearest step for better CDN cache hit rate */
export function roundWidth(w: number, step: number = 100): number {
  return Math.ceil(w / step) * step;
}
