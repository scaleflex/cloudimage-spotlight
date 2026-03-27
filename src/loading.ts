// ---------------------------------------------------------------------------
// Loading state manager
// Three states: config-loading → image-loading → ready
// ---------------------------------------------------------------------------

export type LoadingPhase = 'config' | 'image' | 'ready';

/**
 * Create the skeleton placeholder element.
 */
export function createSkeleton(): HTMLDivElement {
  const skeleton = document.createElement('div');
  skeleton.className = 'cis-skeleton';
  skeleton.setAttribute('aria-hidden', 'true');

  const shimmer = document.createElement('div');
  shimmer.className = 'cis-skeleton__shimmer';
  skeleton.appendChild(shimmer);

  return skeleton;
}

/**
 * Set the loading phase on the root element.
 * - 'config' / 'image': adds .cis-loading, shows skeleton
 * - 'ready': removes .cis-loading, removes skeleton from DOM
 */
export function setLoadingPhase(root: HTMLElement, phase: LoadingPhase): void {
  if (phase === 'ready') {
    root.classList.remove('cis-loading');
    const skeleton = root.querySelector('.cis-skeleton');
    skeleton?.remove();
  } else {
    root.classList.add('cis-loading');
  }
}
