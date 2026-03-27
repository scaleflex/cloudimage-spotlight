// ---------------------------------------------------------------------------
// Keyboard navigation handler
// Active only when the component (host) or a child has focus.
// ---------------------------------------------------------------------------

export interface KeyboardCallbacks {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  skip: () => void;
  totalScenes: () => number;
  isFullscreen?: () => boolean;
  exitFullscreen?: () => void;
}

export interface KeyboardController {
  attach: () => void;
  detach: () => void;
  setRTL: (rtl: boolean) => void;
  setEnabled: (enabled: boolean) => void;
}

/**
 * Create a keyboard controller that listens for keydown on the host element.
 *
 * Key bindings:
 * - → / Space  = next scene
 * - ←          = previous scene
 * - Escape     = skip / close
 * - Home       = first scene
 * - End        = last scene
 * - 1–9        = jump to scene by number (if ≤ 9 scenes)
 *
 * RTL-aware: ← and → swap when `isRTL` is true.
 * Disabled when `enabled` is false.
 */
export function createKeyboardController(
  host: HTMLElement,
  callbacks: KeyboardCallbacks,
): KeyboardController {
  let isRTL = false;
  let enabled = true;

  function handleKeydown(e: KeyboardEvent): void {
    if (!enabled) return;

    // Don't handle keys when focus is on an interactive child (input, button inside annotation)
    const target = e.target as HTMLElement;
    if (target !== host && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      return;
    }

    // Don't handle keys when a CTA link/button is focused (let it handle its own keys)
    if (target.classList.contains('cis-cta')) {
      // Only pass through Enter/Space (native behavior) — capture arrow keys
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End' && e.key !== 'Escape') {
        return;
      }
    }

    const nextKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = isRTL ? 'ArrowRight' : 'ArrowLeft';

    switch (e.key) {
      case nextKey:
      case ' ':
        e.preventDefault();
        callbacks.next();
        break;
      case prevKey:
        e.preventDefault();
        callbacks.prev();
        break;
      case 'Escape':
        e.preventDefault();
        if (callbacks.isFullscreen?.()) {
          callbacks.exitFullscreen?.();
        } else {
          callbacks.skip();
        }
        break;
      case 'Home':
        e.preventDefault();
        callbacks.goTo(0);
        break;
      case 'End':
        e.preventDefault();
        callbacks.goTo(callbacks.totalScenes() - 1);
        break;
      default:
        // 1–9 jump to scene by number
        if (e.key >= '1' && e.key <= '9') {
          const sceneIndex = parseInt(e.key, 10) - 1;
          const total = callbacks.totalScenes();
          if (total <= 9 && sceneIndex < total) {
            e.preventDefault();
            callbacks.goTo(sceneIndex);
          }
        }
        break;
    }
  }

  return {
    attach() {
      host.addEventListener('keydown', handleKeydown);
    },
    detach() {
      host.removeEventListener('keydown', handleKeydown);
    },
    setRTL(rtl: boolean) {
      isRTL = rtl;
    },
    setEnabled(value: boolean) {
      enabled = value;
    },
  };
}
