// ---------------------------------------------------------------------------
// Scene transition engine
// CSS-class-swap transitions via requestAnimationFrame.
// ---------------------------------------------------------------------------

export type TransitionType = 'fade' | 'slide' | 'zoom';
export type TransitionDirection = 'forward' | 'backward';

export interface TransitionOptions {
  type: TransitionType;
  direction: TransitionDirection;
  reducedMotion: boolean;
  onMidpoint: () => void;
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

/** CSS classes used by the transition engine. */
const EXIT_CLASS = 'cis-scene-exit';
const ENTER_CLASS = 'cis-scene-enter';
const ACTIVE_SUFFIX = '-active';

/**
 * Check if the user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get the CSS duration for a transition type, or 0 for instant cut.
 */
export function getTransitionDuration(type: TransitionType, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return DURATIONS[type];
}

/**
 * Run a scene transition on the stage element.
 *
 * The strategy is a class-swap approach:
 * 1. Add exit classes to the stage (outgoing scene starts leaving)
 * 2. At the midpoint, call onMidpoint() to swap DOM content
 * 3. Add enter classes (incoming scene starts appearing)
 * 4. On completion, clean up all transition classes
 *
 * For reduced motion: instant cut (onMidpoint + onComplete called synchronously).
 */
export function runTransition(
  stage: HTMLElement,
  root: HTMLElement,
  options: TransitionOptions,
): (() => void) | undefined {
  const { type, direction, reducedMotion, onMidpoint, onComplete } = options;

  // Instant cut for reduced motion
  if (reducedMotion) {
    onMidpoint();
    onComplete();
    return undefined;
  }

  const duration = DURATIONS[type];
  const halfDuration = duration / 2;
  const dirClass = `cis-transition-${type}`;
  const dirModifier = direction === 'backward' ? 'cis-transition--backward' : '';

  // Mark root as transitioning (suppresses ResizeObserver rebuilds)
  root.classList.add(TRANSITION_ACTIVE_CLASS);

  // Add direction context classes
  stage.classList.add(dirClass);
  if (dirModifier) {
    stage.classList.add(dirModifier);
  }

  // Phase 1: Exit
  stage.classList.add(EXIT_CLASS);
  let rafId = requestAnimationFrame(() => {
    stage.classList.add(`${EXIT_CLASS}${ACTIVE_SUFFIX}`);
  });

  let cancelled = false;

  // Phase 2: Midpoint — swap content
  const midTimer = setTimeout(() => {
    if (cancelled) return;
    onMidpoint();

    // Phase 3: Enter
    stage.classList.remove(EXIT_CLASS, `${EXIT_CLASS}${ACTIVE_SUFFIX}`);
    stage.classList.add(ENTER_CLASS);
    rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      stage.classList.add(`${ENTER_CLASS}${ACTIVE_SUFFIX}`);
    });
  }, halfDuration);

  // Phase 4: Complete — clean up
  const endTimer = setTimeout(() => {
    if (cancelled) return;
    cleanup();
    onComplete();
  }, duration);

  function cleanup(): void {
    const toRemove = [
      dirClass,
      EXIT_CLASS,
      `${EXIT_CLASS}${ACTIVE_SUFFIX}`,
      ENTER_CLASS,
      `${ENTER_CLASS}${ACTIVE_SUFFIX}`,
    ];
    if (dirModifier) toRemove.push(dirModifier);
    stage.classList.remove(...toRemove);
    root.classList.remove(TRANSITION_ACTIVE_CLASS);
  }

  // Return cancel function
  return () => {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(rafId);
    clearTimeout(midTimer);
    clearTimeout(endTimer);
    cleanup();
  };
}
