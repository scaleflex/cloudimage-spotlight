import type { SpotlightRegion } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create an SVG mask overlay element with transparent cut-outs for each region.
 *
 * The SVG uses viewBox="0 0 1 1" with preserveAspectRatio="none" so that
 * normalized 0–1 region coordinates map directly to SVG coordinates.
 */
export function createMask(
  instanceId: string,
  sceneId: string,
  regions: SpotlightRegion[],
  maskOpacity?: number,
  maskColor?: string,
): SVGSVGElement {
  const maskId = `cis-mask-${instanceId}-${sceneId}`;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'cis-mask');
  svg.setAttribute('viewBox', '0 0 1 1');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');

  // <defs> with <mask>
  const defs = document.createElementNS(SVG_NS, 'defs');
  const mask = document.createElementNS(SVG_NS, 'mask');
  mask.setAttribute('id', maskId);

  // White background (everything masked = dimmed)
  const whiteRect = document.createElementNS(SVG_NS, 'rect');
  whiteRect.setAttribute('width', '1');
  whiteRect.setAttribute('height', '1');
  whiteRect.setAttribute('fill', 'white');
  mask.appendChild(whiteRect);

  // Black cut-outs per region (transparent = visible)
  for (const region of regions) {
    const cutout = createRegionCutout(region);
    mask.appendChild(cutout);
  }

  defs.appendChild(mask);
  svg.appendChild(defs);

  // Dark overlay rect that references the mask
  const overlay = document.createElementNS(SVG_NS, 'rect');
  overlay.setAttribute('width', '1');
  overlay.setAttribute('height', '1');
  overlay.setAttribute('mask', `url(#${maskId})`);
  const fill = maskColor ?? 'var(--cis-mask-color, oklch(0 0 0))';
  const opacity = maskOpacity ?? 'var(--cis-mask-opacity, 0.65)';
  overlay.style.cssText = `fill: ${fill}; opacity: ${opacity};`;
  svg.appendChild(overlay);

  return svg;
}

/**
 * Create an SVG shape element for a region cut-out.
 * Supports "rect" (default) and "ellipse" shapes.
 */
function createRegionCutout(region: SpotlightRegion): SVGElement {
  const shape = region.shape ?? 'rect';
  const w = region.br_x - region.tl_x;
  const h = region.br_y - region.tl_y;

  if (shape === 'ellipse') {
    const ellipse = document.createElementNS(SVG_NS, 'ellipse');
    ellipse.setAttribute('cx', String(region.tl_x + w / 2));
    ellipse.setAttribute('cy', String(region.tl_y + h / 2));
    ellipse.setAttribute('rx', String(w / 2));
    ellipse.setAttribute('ry', String(h / 2));
    ellipse.setAttribute('fill', 'black');
    return ellipse;
  }

  // Default: rect
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(region.tl_x));
  rect.setAttribute('y', String(region.tl_y));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('fill', 'black');
  rect.setAttribute('rx', '0.005'); // Slight rounded corners
  return rect;
}
