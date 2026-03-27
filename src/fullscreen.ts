// ---------------------------------------------------------------------------
// Fullscreen API abstraction
// Handles vendor prefixes (webkit) and state synchronization.
// ---------------------------------------------------------------------------

function isFullscreenEnabled(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled
  );
}

function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    null
  );
}

function requestFullscreen(el: HTMLElement): Promise<void> {
  if (el.requestFullscreen) return el.requestFullscreen();
  if ((el as any).webkitRequestFullscreen) {
    (el as any).webkitRequestFullscreen();
    return Promise.resolve();
  }
  return Promise.reject(new Error('Fullscreen API not supported'));
}

function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) return document.exitFullscreen();
  if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
    return Promise.resolve();
  }
  return Promise.reject(new Error('Fullscreen API not supported'));
}

export interface FullscreenController {
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
  isFullscreen: () => boolean;
  destroy: () => void;
}

/**
 * Create a fullscreen controller for a given container element.
 * Returns null if the Fullscreen API is not supported.
 */
export function createFullscreenController(
  container: HTMLElement,
  onChange: (isFullscreen: boolean) => void,
): FullscreenController | null {
  if (typeof document === 'undefined' || !isFullscreenEnabled()) {
    return null;
  }

  function syncState(): void {
    const fs = getFullscreenElement() === container;
    onChange(fs);
  }

  document.addEventListener('fullscreenchange', syncState);
  document.addEventListener('webkitfullscreenchange', syncState);

  return {
    enter() {
      return requestFullscreen(container).catch(() => {});
    },
    exit() {
      if (!getFullscreenElement()) return Promise.resolve();
      return exitFullscreen().catch(() => {});
    },
    toggle() {
      return getFullscreenElement() === container ? this.exit() : this.enter();
    },
    isFullscreen() {
      return getFullscreenElement() === container;
    },
    destroy() {
      document.removeEventListener('fullscreenchange', syncState);
      document.removeEventListener('webkitfullscreenchange', syncState);
      // Exit fullscreen if still active
      if (getFullscreenElement() === container) {
        exitFullscreen().catch(() => {});
      }
    },
  };
}
