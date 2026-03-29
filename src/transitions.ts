// ---------------------------------------------------------------------------
// Scene transition engine
// Dual-layer transitions: outgoing and incoming scenes overlap for the full
// duration, producing smooth crossfade / slide / zoom effects.
// ---------------------------------------------------------------------------

export type TransitionType = 'fade' | 'slide' | 'zoom';
export type TransitionDirection = 'forward' | 'backward';

export interface TransitionOptions {
  type: TransitionType;
  direction: TransitionDirection;
  reducedMotion: boolean;
  /** Called to render new scene content into the incoming layer. */
  onSwap: (incomingLayer: HTMLDivElement) => void;
  onComplete: () => void;
}

/** Duration per transition type (ms). */
const DURATIONS: Record<TransitionType, number> = {
  fade: 300,
  slide: 350,
  zoom: 400,
};

/** CSS class applied during transition (suppresses ResizeObserver rebuilds). */
export const TRANSITION_ACTIVE_CLASS = 'cis-transitioning';

/**
 * Check if the user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Run a dual-layer scene transition on the stage element.
 *
 * Strategy:
 * 1. Wrap existing stage children into an "outgoing" layer.
 * 2. Create an "incoming" layer and call onSwap() to populate it.
 * 3. Both layers animate simultaneously for the full duration.
 * 4. On completion, remove the outgoing layer and strip animation classes
 *    from the incoming layer, leaving it as a positioned wrapper. This
 *    preserves closure references from renderSceneDOM (zoom, annotation
 *    appending, etc.) which target the layer as their container.
 */
export function runTransition(
  stage: HTMLElement,
  root: HTMLElement,
  options: TransitionOptions,
): (() => void) | undefined {
  const { type, direction, reducedMotion, onSwap, onComplete } = options;

  // Instant cut for reduced motion — render directly into the stage.
  // No wrapper layer, so closures from renderSceneDOM reference the real
  // stage and remain valid for deferred operations (zoom, annotation append).
  if (reducedMotion) {
    stage.textContent = '';
    onSwap(stage as HTMLDivElement);
    onComplete();
    return undefined;
  }

  const duration = DURATIONS[type];
  const dirClass = `cis-transition-${type}`;
  const dirModifier = direction === 'backward' ? 'cis-transition--backward' : '';

  // Mark root as transitioning (suppresses ResizeObserver rebuilds)
  root.classList.add(TRANSITION_ACTIVE_CLASS);

  // --- Step 1: Wrap existing content into outgoing layer ---
  const outgoing = document.createElement('div');
  outgoing.className = 'cis-transition-layer cis-transition-layer--outgoing';
  while (stage.firstChild) {
    outgoing.appendChild(stage.firstChild);
  }
  stage.appendChild(outgoing);

  // --- Step 2: Create incoming layer with enter classes already applied ---
  // Classes must be set BEFORE onSwap so the layer starts hidden (opacity: 0
  // for fade/zoom, off-screen for slide). Without this, the incoming layer
  // is briefly visible at full opacity on top of the outgoing layer.
  const incoming = document.createElement('div');
  incoming.className = 'cis-transition-layer cis-transition-layer--incoming';
  incoming.classList.add(dirClass, 'cis-scene-enter');
  if (dirModifier) incoming.classList.add(dirModifier);
  stage.appendChild(incoming);

  // Render new scene into the (hidden) incoming layer
  onSwap(incoming);

  // --- Step 3: Add exit classes to outgoing layer ---
  outgoing.classList.add(dirClass, 'cis-scene-exit');
  if (dirModifier) outgoing.classList.add(dirModifier);

  // Force layout so initial states are applied before triggering transitions
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  outgoing.offsetHeight;

  let cancelled = false;

  // Trigger the active (animated) state on next frame
  const rafId = requestAnimationFrame(() => {
    if (cancelled) return;
    outgoing.classList.add('cis-scene-exit-active');
    incoming.classList.add('cis-scene-enter-active');
  });

  // --- Step 4: Clean up after animation completes ---
  const endTimer = setTimeout(() => {
    if (cancelled) return;
    cleanup();
    onComplete();
  }, duration);

  function cleanup(): void {
    // Remove outgoing layer
    if (outgoing.parentNode) {
      outgoing.remove();
    }
    // Keep incoming layer in the DOM — closures from renderSceneDOM reference
    // it as their container. Strip only transition-animation classes; keep
    // cis-transition-layer for positioning (position:absolute;inset:0;100%×100%).
    incoming.classList.remove(
      'cis-transition-layer--incoming',
      dirClass,
      'cis-scene-enter',
      'cis-scene-enter-active',
    );
    if (dirModifier) incoming.classList.remove(dirModifier);
    root.classList.remove(TRANSITION_ACTIVE_CLASS);
  }

  // Return cancel function
  return () => {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(rafId);
    clearTimeout(endTimer);
    cleanup();
  };
}
