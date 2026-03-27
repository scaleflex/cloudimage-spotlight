import type { SpotlightRegion } from './types';

/**
 * Create region highlight divs positioned over the image.
 * Each div renders the --cis-region-border and pulse animation.
 */
export function createRegionHighlights(regions: SpotlightRegion[]): HTMLDivElement[] {
  return regions.map((region, index) => {
    const div = document.createElement('div');
    div.className = 'cis-region-highlight';
    div.setAttribute('data-index', String(index));
    div.setAttribute('aria-hidden', 'true');

    const left = region.tl_x * 100;
    const top = region.tl_y * 100;
    const width = (region.br_x - region.tl_x) * 100;
    const height = (region.br_y - region.tl_y) * 100;

    div.style.left = `${left}%`;
    div.style.top = `${top}%`;
    div.style.width = `${width}%`;
    div.style.height = `${height}%`;

    if (region.shape === 'ellipse') {
      div.style.borderRadius = '50%';
    }

    return div;
  });
}
