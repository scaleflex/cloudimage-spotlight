import type { SpotlightAnnotation, SpotlightRegion } from './types';

export type PositionSide = 'top' | 'bottom' | 'left' | 'right';

const ALL_SIDES: PositionSide[] = ['right', 'bottom', 'left', 'top'];

const CARD_GAP = 20; // px gap between region edge and card
const EDGE_MARGIN = 12; // px minimum distance from stage edges

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Determine the best position for an annotation card relative to the primary region.
 * If annotation.position is explicit, return that side.
 * If "auto", pick the side where the card fits without overlapping the region.
 *
 * @param reservedRects - areas to avoid (e.g. action buttons, controls bar)
 */
export function resolveAnnotationPosition(
  annotation: SpotlightAnnotation | undefined,
  card: HTMLDivElement,
  stageRect: DOMRect,
  regions: SpotlightRegion[],
  isRTL: boolean,
  reservedRects: Rect[] = [],
  contentRect?: { left: number; top: number; width: number; height: number },
): PositionSide {
  const position = annotation?.position ?? 'auto';

  if (position !== 'auto') {
    return maybeMirror(position as PositionSide, isRTL);
  }

  return pickBestSide(card, stageRect, regions, isRTL, reservedRects, contentRect);
}

/**
 * Pick the best side by checking which sides have enough room for the card
 * on the primary axis (so clamping only affects the cross-axis, never
 * pushing the card back over the region).
 */
function pickBestSide(
  card: HTMLDivElement,
  stageRect: DOMRect,
  regions: SpotlightRegion[],
  isRTL: boolean,
  reservedRects: Rect[] = [],
  contentRect?: { left: number; top: number; width: number; height: number },
): PositionSide {
  const cardW = card.offsetWidth || 320;
  const cardH = card.offsetHeight || 100;
  const stageW = stageRect.width;
  const stageH = stageRect.height;

  if (regions.length === 0) {
    return 'bottom';
  }

  const region = getRegionsBoundsRect(regions, stageW, stageH, contentRect);

  let bestSide: PositionSide = 'right';
  let bestScore = -Infinity;

  for (const side of ALL_SIDES) {
    const mirrored = maybeMirror(side, isRTL);

    // Check primary-axis fit: does the card fit on this side without
    // needing to be pushed back over the region?
    if (!fitsPrimaryAxis(mirrored, cardW, cardH, stageW, stageH, region)) {
      continue;
    }

    // Compute final (clamped) coords and check for reserved-rect overlap
    const coords = getSideCoords(mirrored, cardW, cardH, stageW, stageH, region);
    const cardRect: Rect = {
      left: coords.left,
      top: coords.top,
      right: coords.left + cardW,
      bottom: coords.top + cardH,
    };
    const overlap = reservedRects.reduce((sum, r) => sum + rectOverlapArea(cardRect, r), 0);

    // Score: available space on that side, penalize reserved-rect overlap
    const space = getAvailableSpace(mirrored, stageW, stageH, region);
    const score = space - overlap * 10;

    if (score > bestScore) {
      bestScore = score;
      bestSide = mirrored;
    }
  }

  return bestSide;
}

/**
 * Check whether the card fits on the primary axis of the given side
 * (i.e. it doesn't need to be clamped in a way that would overlap the region).
 */
function fitsPrimaryAxis(
  side: PositionSide,
  cardW: number,
  cardH: number,
  stageW: number,
  stageH: number,
  region: Rect,
): boolean {
  switch (side) {
    case 'top':
      return region.top - CARD_GAP - cardH >= EDGE_MARGIN;
    case 'bottom':
      return region.bottom + CARD_GAP + cardH <= stageH - EDGE_MARGIN;
    case 'left':
      return region.left - CARD_GAP - cardW >= EDGE_MARGIN;
    case 'right':
      return region.right + CARD_GAP + cardW <= stageW - EDGE_MARGIN;
  }
}

/**
 * Get the bounding rect of all regions in stage pixel coordinates.
 * Uses the union of all regions so the annotation avoids overlapping any of them.
 */
function getRegionsBoundsRect(
  regions: SpotlightRegion[],
  stageW: number,
  stageH: number,
  contentRect?: { left: number; top: number; width: number; height: number },
): Rect {
  const ox = contentRect?.left ?? 0;
  const oy = contentRect?.top ?? 0;
  const w = contentRect?.width ?? stageW;
  const h = contentRect?.height ?? stageH;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of regions) {
    left = Math.min(left, ox + r.tl_x * w);
    top = Math.min(top, oy + r.tl_y * h);
    right = Math.max(right, ox + r.br_x * w);
    bottom = Math.max(bottom, oy + r.br_y * h);
  }
  return { left, top, right, bottom };
}

/**
 * Get available space (px) on a given side of the region.
 */
function getAvailableSpace(
  side: PositionSide,
  stageW: number,
  stageH: number,
  region: Rect,
): number {
  switch (side) {
    case 'top':
      return region.top;
    case 'bottom':
      return stageH - region.bottom;
    case 'left':
      return region.left;
    case 'right':
      return stageW - region.right;
  }
}

/**
 * Get pixel coordinates for a card placed on a given side of the primary region.
 * Primary axis: card is placed with CARD_GAP from the region edge.
 * Cross axis: card is aligned to the start of the region edge (not centered),
 * then clamped to stage bounds.
 */
function getSideCoords(
  side: PositionSide,
  cardW: number,
  cardH: number,
  stageW: number,
  stageH: number,
  region: Rect,
): { left: number; top: number } {
  let left: number;
  let top: number;

  switch (side) {
    case 'top':
      left = region.left;
      top = region.top - CARD_GAP - cardH;
      break;
    case 'bottom':
      left = region.left;
      top = region.bottom + CARD_GAP;
      break;
    case 'left':
      left = region.left - CARD_GAP - cardW;
      top = region.top;
      break;
    case 'right':
      left = region.right + CARD_GAP;
      top = region.top;
      break;
  }

  // Clamp cross-axis to stage bounds (primary axis is guaranteed by fitsPrimaryAxis)
  left = Math.max(EDGE_MARGIN, Math.min(left, stageW - cardW - EDGE_MARGIN));
  top = Math.max(EDGE_MARGIN, Math.min(top, stageH - cardH - EDGE_MARGIN));

  return { left, top };
}

/**
 * Calculate overlap area between two rectangles.
 */
function rectOverlapArea(a: Rect, b: Rect): number {
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return overlapX * overlapY;
}

/**
 * Mirror left/right for RTL layouts.
 */
function maybeMirror(side: PositionSide, isRTL: boolean): PositionSide {
  if (!isRTL) return side;
  if (side === 'left') return 'right';
  if (side === 'right') return 'left';
  return side;
}

/**
 * Apply position CSS to the annotation card relative to the primary region.
 */
export function applyAnnotationPosition(
  card: HTMLDivElement,
  side: PositionSide,
  stageRect: DOMRect,
  regions: SpotlightRegion[],
  contentRect?: { left: number; top: number; width: number; height: number },
): void {
  const cardW = card.offsetWidth || 320;
  const cardH = card.offsetHeight || 100;
  const stageW = stageRect.width;
  const stageH = stageRect.height;

  let left: number;
  let top: number;

  if (regions.length > 0) {
    const region = getRegionsBoundsRect(regions, stageW, stageH, contentRect);
    ({ left, top } = getSideCoords(side, cardW, cardH, stageW, stageH, region));
  } else {
    // No regions — center in stage with a margin from the edge
    switch (side) {
      case 'top':
        left = (stageW - cardW) / 2;
        top = EDGE_MARGIN;
        break;
      case 'bottom':
        left = (stageW - cardW) / 2;
        top = stageH - cardH - EDGE_MARGIN;
        break;
      case 'left':
        left = EDGE_MARGIN;
        top = (stageH - cardH) / 2;
        break;
      case 'right':
        left = stageW - cardW - EDGE_MARGIN;
        top = (stageH - cardH) / 2;
        break;
    }
  }

  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}
