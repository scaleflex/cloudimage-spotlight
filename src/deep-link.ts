// ---------------------------------------------------------------------------
// Hash-based deep linking and URL sync
// ---------------------------------------------------------------------------

export interface DeepLinkController {
  /** Start listening for hashchange events (sync-url mode). */
  attach: () => void;
  /** Stop listening for hashchange events. */
  detach: () => void;
  /** Update the URL hash to reflect the current scene. */
  syncHash: (sceneId: string) => void;
  /** Clear the hash (on complete/skip). */
  clearHash: () => void;
}

/**
 * Build the hash string for a scene.
 * - If the element has an id: `#{id}:{sceneId}`
 * - If no id: `#cis-{sceneId}`
 */
export function buildHash(elementId: string | null, sceneId: string): string {
  if (elementId) {
    return `#${elementId}:${sceneId}`;
  }
  return `#cis-${sceneId}`;
}

/**
 * Parse the current URL hash to extract a scene ID for a given element.
 * Returns the scene ID string, or null if the hash doesn't match.
 */
export function parseHash(hash: string, elementId: string | null): string | null {
  if (!hash) return null;

  if (elementId && hash.startsWith(`#${elementId}:`)) {
    return hash.slice(elementId.length + 2); // skip `#{id}:`
  }
  if (!elementId && hash.startsWith('#cis-')) {
    return hash.slice(5); // skip `#cis-`
  }
  return null;
}

/**
 * Create a deep link controller for sync-url mode.
 *
 * - Uses `history.replaceState()` to avoid polluting browser history
 * - Listens for `hashchange` to handle external navigation
 * - Clears hash on complete/skip
 */
export function createDeepLinkController(
  elementId: string | null,
  onHashChange: (sceneId: string) => void,
): DeepLinkController {
  function handleHashChange(): void {
    const hash = window.location.hash;
    const sceneId = parseHash(hash, elementId);
    if (sceneId) {
      onHashChange(sceneId);
    }
  }

  return {
    attach() {
      window.addEventListener('hashchange', handleHashChange);
    },
    detach() {
      window.removeEventListener('hashchange', handleHashChange);
    },
    syncHash(sceneId: string) {
      const newHash = buildHash(elementId, sceneId);
      if (window.location.hash !== newHash) {
        history.replaceState(null, '', newHash);
      }
    },
    clearHash() {
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    },
  };
}
