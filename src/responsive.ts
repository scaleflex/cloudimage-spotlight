// ---------------------------------------------------------------------------
// Responsive layout — mobile breakpoint detection + bottom-sheet toggle
// ---------------------------------------------------------------------------

const DEFAULT_MOBILE_BREAKPOINT = 600;
const MOBILE_CLASS = 'cis-root--mobile';

export interface ResponsiveController {
  /** Check current width and toggle mobile class. Call after scene render. */
  evaluate: () => void;
  /** Whether currently in mobile mode. */
  isMobile: () => boolean;
  /** Clean up. */
  destroy: () => void;
}

/**
 * Create a responsive controller that toggles mobile layout.
 *
 * Below `--cis-mobile-breakpoint` (default 600px):
 * - Adds `.cis-root--mobile` to root
 * - Creates a `.cis-bottom-sheet` container and moves annotation into it
 *
 * Above breakpoint:
 * - Removes `.cis-root--mobile`
 * - Moves annotation back to its default position in stage
 */
export function createResponsiveController(
  root: HTMLDivElement,
): ResponsiveController {
  let mobile = false;
  let bottomSheet: HTMLDivElement | null = null;

  function getBreakpoint(): number {
    if (typeof getComputedStyle === 'undefined') return DEFAULT_MOBILE_BREAKPOINT;
    const style = getComputedStyle(root);
    if (typeof style.getPropertyValue !== 'function') return DEFAULT_MOBILE_BREAKPOINT;
    const val = style.getPropertyValue('--cis-mobile-breakpoint');
    if (val) {
      const parsed = parseInt(val, 10);
      if (parsed > 0) return parsed;
    }
    return DEFAULT_MOBILE_BREAKPOINT;
  }

  function evaluate(): void {
    const width = root.clientWidth;
    const breakpoint = getBreakpoint();
    const shouldBeMobile = width > 0 && width < breakpoint;

    if (shouldBeMobile === mobile) return;
    mobile = shouldBeMobile;

    if (mobile) {
      enterMobile();
    } else {
      exitMobile();
    }
  }

  function enterMobile(): void {
    root.classList.add(MOBILE_CLASS);

    // Create bottom-sheet if it doesn't exist
    if (!bottomSheet) {
      bottomSheet = document.createElement('div');
      bottomSheet.className = 'cis-bottom-sheet';
    }

    // Move annotation (which now contains nav controls) into bottom-sheet
    const annotation = root.querySelector('.cis-stage .cis-annotation');

    // Clear bottom-sheet first
    bottomSheet.textContent = '';

    if (annotation) {
      bottomSheet.appendChild(annotation);
    }

    // Append bottom-sheet to root (after stage)
    if (!bottomSheet.parentNode) {
      root.appendChild(bottomSheet);
    }
  }

  function exitMobile(): void {
    root.classList.remove(MOBILE_CLASS);

    if (!bottomSheet) return;

    // Move annotation back into stage
    const stage = root.querySelector('.cis-stage');
    const annotation = bottomSheet.querySelector('.cis-annotation');
    if (annotation && stage) {
      stage.appendChild(annotation);
    }

    // Remove bottom-sheet from DOM
    bottomSheet.remove();
    bottomSheet = null;
  }

  return {
    evaluate,
    isMobile: () => mobile,
    destroy() {
      // If in mobile mode, restore desktop layout before destroying
      if (mobile) {
        exitMobile();
      }
      bottomSheet = null;
      mobile = false;
    },
  };
}
