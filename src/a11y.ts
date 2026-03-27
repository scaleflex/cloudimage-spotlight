// ---------------------------------------------------------------------------
// Accessibility (ARIA) setup and management
// ---------------------------------------------------------------------------

import type { CISStrings } from './types';

/**
 * Set up initial ARIA attributes on the root element.
 * Called once after config is loaded.
 */
export function setupRootARIA(
  root: HTMLElement,
  strings: CISStrings,
  title?: string,
): void {
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', strings.tourLabel);
  if (title) {
    root.setAttribute('aria-label', title);
  }
}

/**
 * Mark decorative/overlay elements as aria-hidden.
 * Should be called after each scene render since the stage DOM is rebuilt.
 */
export function hideDecorativeElements(stage: HTMLElement): void {
  const selectors = [
    '.cis-mask',
    '.cis-region-highlight',
    '.cis-badge',
    '.cis-image--zoomed',
    '.cis-image--blurred',
  ];

  for (const selector of selectors) {
    const elements = stage.querySelectorAll(selector);
    for (const el of elements) {
      el.setAttribute('aria-hidden', 'true');
    }
  }
}

