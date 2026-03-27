import type { SpotlightRegion } from './types';

/**
 * Create numbered badge elements positioned at each region's top-left corner.
 * Uses region.label if set, otherwise auto-numbers 1, 2, 3...
 * Labels longer than 2 characters get pill styling (cis-badge--label).
 * All text rendered via textContent (never innerHTML).
 */
export function createBadges(regions: SpotlightRegion[]): HTMLSpanElement[] {
  return regions.map((region, index) => {
    const badge = document.createElement('span');
    badge.setAttribute('data-index', String(index));
    badge.setAttribute('aria-hidden', 'true');

    // Label: custom or auto-numbered
    const label = region.label ?? String(index + 1);
    badge.textContent = label;

    // Pill style for text labels, circle for short numbers/letters
    badge.className = label.length > 2 ? 'cis-badge cis-badge--label' : 'cis-badge';

    // Position at region's top-left corner
    badge.style.left = `${region.tl_x * 100}%`;
    badge.style.top = `${region.tl_y * 100}%`;

    return badge;
  });
}
