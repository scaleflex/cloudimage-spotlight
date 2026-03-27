import type { SpotlightRegion } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

/** An edge midpoint with its outward-facing normal direction. */
interface Anchor {
  point: Point;
  normal: Point; // unit vector pointing away from the shape
}

/**
 * Create an SVG connector from annotation card to the primary region.
 * Returns null if no regions or shapes overlap/are too close.
 *
 * Uses cubic bezier that exits each shape perpendicular to the edge,
 * with edge-midpoint anchors on both the card and region for clean geometry.
 */
export function createConnector(
  cardRect: Rect,
  regions: SpotlightRegion[],
  stageWidth: number,
  stageHeight: number,
  contentRect?: { left: number; top: number; width: number; height: number },
): SVGSVGElement | null {
  if (regions.length === 0) return null;

  const r = regions[0];
  const ox = contentRect?.left ?? 0;
  const oy = contentRect?.top ?? 0;
  const w = contentRect?.width ?? stageWidth;
  const h = contentRect?.height ?? stageHeight;
  const regionRect: Rect = {
    left: ox + r.tl_x * w,
    top: oy + r.tl_y * h,
    width: (r.br_x - r.tl_x) * w,
    height: (r.br_y - r.tl_y) * h,
  };

  const pair = findBestAnchorPair(cardRect, regionRect);
  if (!pair) return null;

  const { card: cardAnchor, region: regionAnchor } = pair;
  const dist = distance(cardAnchor.point, regionAnchor.point);
  if (dist < 20) return null;

  // Cubic bezier control points — extend outward along each edge normal.
  // Extension = 35% of gap distance, clamped to [24, 80] px.
  const ext = Math.max(24, Math.min(dist * 0.35, 80));
  const cp1: Point = {
    x: cardAnchor.point.x + cardAnchor.normal.x * ext,
    y: cardAnchor.point.y + cardAnchor.normal.y * ext,
  };
  const cp2: Point = {
    x: regionAnchor.point.x + regionAnchor.normal.x * ext,
    y: regionAnchor.point.y + regionAnchor.normal.y * ext,
  };

  // Build the SVG
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'cis-connector');
  svg.setAttribute('width', String(stageWidth));
  svg.setAttribute('height', String(stageHeight));
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS(SVG_NS, 'path');
  const d = [
    `M ${cardAnchor.point.x} ${cardAnchor.point.y}`,
    `C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${regionAnchor.point.x} ${regionAnchor.point.y}`,
  ].join(' ');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--cis-connector-color, oklch(0.578 0.198 268.129 / 0.4))');
  path.setAttribute('stroke-width', 'var(--cis-connector-width, 1.5)');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);

  // Dot at the region end
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', String(regionAnchor.point.x));
  dot.setAttribute('cy', String(regionAnchor.point.y));
  dot.setAttribute('r', '4');
  dot.setAttribute('fill', 'var(--cis-connector-color, oklch(0.578 0.198 268.129 / 0.4))');
  svg.appendChild(dot);

  return svg;
}

/**
 * Return the 4 edge midpoints of a rectangle with outward normals.
 */
export function getEdgeAnchors(rect: Rect): Anchor[] {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return [
    { point: { x: cx, y: rect.top }, normal: { x: 0, y: -1 } },                    // top
    { point: { x: cx, y: rect.top + rect.height }, normal: { x: 0, y: 1 } },       // bottom
    { point: { x: rect.left, y: cy }, normal: { x: -1, y: 0 } },                   // left
    { point: { x: rect.left + rect.width, y: cy }, normal: { x: 1, y: 0 } },       // right
  ];
}

/**
 * Evaluate all 4×4 edge-midpoint pairs and return the pair with
 * the shortest distance. Returns null if both rects overlap
 * (all pairs would produce a crossing path).
 */
export function findBestAnchorPair(
  cardRect: Rect,
  regionRect: Rect,
): { card: Anchor; region: Anchor } | null {
  const cardAnchors = getEdgeAnchors(cardRect);
  const regionAnchors = getEdgeAnchors(regionRect);

  let best: { card: Anchor; region: Anchor } | null = null;
  let bestDist = Infinity;

  for (const ca of cardAnchors) {
    for (const ra of regionAnchors) {
      // Skip pairs whose normals face each other head-on and endpoints
      // are on the wrong side (would cause the path to cross through a shape).
      // A valid pair: the region anchor should be roughly in the direction
      // the card normal points, and vice versa.
      const toRegion = { x: ra.point.x - ca.point.x, y: ra.point.y - ca.point.y };
      const dotCard = ca.normal.x * toRegion.x + ca.normal.y * toRegion.y;
      const dotRegion = ra.normal.x * -toRegion.x + ra.normal.y * -toRegion.y;

      // Both normals should point toward the other shape (positive dot product)
      if (dotCard < 0 || dotRegion < 0) continue;

      const d = distance(ca.point, ra.point);
      if (d < bestDist) {
        bestDist = d;
        best = { card: ca, region: ra };
      }
    }
  }

  return best;
}

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
