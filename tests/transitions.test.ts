import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  runTransition,
  prefersReducedMotion,
  getTransitionDuration,
  TRANSITION_ACTIVE_CLASS,
} from '../src/transitions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStage(): HTMLDivElement {
  const stage = document.createElement('div');
  stage.className = 'cis-stage';
  return stage;
}

function makeRoot(): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'cis-root';
  return root;
}

// Override matchMedia for specific tests
function mockMatchMedia(reducedMotion: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('transitions', () => {
  let stage: HTMLDivElement;
  let root: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    stage = makeStage();
    root = makeRoot();
    document.body.appendChild(root);
    root.appendChild(stage);
  });

  afterEach(() => {
    vi.useRealTimers();
    root.remove();
    // Restore default reduced-motion mock (true in test env)
    mockMatchMedia(true);
  });

  // -------------------------------------------------------------------------
  // prefersReducedMotion
  // -------------------------------------------------------------------------

  describe('prefersReducedMotion', () => {
    it('returns true when matchMedia reports reduce', () => {
      mockMatchMedia(true);
      expect(prefersReducedMotion()).toBe(true);
    });

    it('returns false when matchMedia reports no preference', () => {
      mockMatchMedia(false);
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // getTransitionDuration
  // -------------------------------------------------------------------------

  describe('getTransitionDuration', () => {
    it('returns 300 for fade', () => {
      expect(getTransitionDuration('fade', false)).toBe(300);
    });

    it('returns 350 for slide', () => {
      expect(getTransitionDuration('slide', false)).toBe(350);
    });

    it('returns 400 for zoom', () => {
      expect(getTransitionDuration('zoom', false)).toBe(400);
    });

    it('returns 0 for any type when reduced motion', () => {
      expect(getTransitionDuration('fade', true)).toBe(0);
      expect(getTransitionDuration('slide', true)).toBe(0);
      expect(getTransitionDuration('zoom', true)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Reduced motion — instant cut
  // -------------------------------------------------------------------------

  describe('reduced motion (instant cut)', () => {
    it('calls onMidpoint and onComplete synchronously', () => {
      const onMidpoint = vi.fn();
      const onComplete = vi.fn();

      const cancel = runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: true,
        onMidpoint,
        onComplete,
      });

      expect(onMidpoint).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(cancel).toBeUndefined();
    });

    it('does not add transition classes', () => {
      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: true,
        onMidpoint: () => {},
        onComplete: () => {},
      });

      expect(stage.classList.contains('cis-transition-fade')).toBe(false);
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Fade transition
  // -------------------------------------------------------------------------

  describe('fade transition', () => {
    it('adds transition classes and TRANSITION_ACTIVE_CLASS to root', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete: () => {},
      });

      expect(stage.classList.contains('cis-transition-fade')).toBe(true);
      expect(stage.classList.contains('cis-scene-exit')).toBe(true);
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(true);
    });

    it('adds exit-active class on next frame', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete: () => {},
      });

      // Trigger rAF
      vi.advanceTimersByTime(16);

      expect(stage.classList.contains('cis-scene-exit-active')).toBe(true);
    });

    it('calls onMidpoint at half duration (150ms for fade)', () => {
      mockMatchMedia(false);
      const onMidpoint = vi.fn();

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint,
        onComplete: () => {},
      });

      expect(onMidpoint).not.toHaveBeenCalled();
      vi.advanceTimersByTime(150);
      expect(onMidpoint).toHaveBeenCalledTimes(1);
    });

    it('switches to enter classes at midpoint', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete: () => {},
      });

      vi.advanceTimersByTime(150);

      expect(stage.classList.contains('cis-scene-exit')).toBe(false);
      expect(stage.classList.contains('cis-scene-enter')).toBe(true);
    });

    it('calls onComplete and cleans up at full duration (300ms)', () => {
      mockMatchMedia(false);
      const onComplete = vi.fn();

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete,
      });

      vi.advanceTimersByTime(300);

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(stage.classList.contains('cis-transition-fade')).toBe(false);
      expect(stage.classList.contains('cis-scene-enter')).toBe(false);
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Slide transition — direction awareness
  // -------------------------------------------------------------------------

  describe('slide transition', () => {
    it('adds backward modifier for backward direction', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'slide',
        direction: 'backward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete: () => {},
      });

      expect(stage.classList.contains('cis-transition-slide')).toBe(true);
      expect(stage.classList.contains('cis-transition--backward')).toBe(true);
    });

    it('does not add backward modifier for forward direction', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'slide',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete: () => {},
      });

      expect(stage.classList.contains('cis-transition-slide')).toBe(true);
      expect(stage.classList.contains('cis-transition--backward')).toBe(false);
    });

    it('completes at 350ms', () => {
      mockMatchMedia(false);
      const onComplete = vi.fn();

      runTransition(stage, root, {
        type: 'slide',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete,
      });

      vi.advanceTimersByTime(349);
      expect(onComplete).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Zoom transition
  // -------------------------------------------------------------------------

  describe('zoom transition', () => {
    it('completes at 400ms', () => {
      mockMatchMedia(false);
      const onComplete = vi.fn();

      runTransition(stage, root, {
        type: 'zoom',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete,
      });

      vi.advanceTimersByTime(399);
      expect(onComplete).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Cancel
  // -------------------------------------------------------------------------

  describe('cancel', () => {
    it('returns a cancel function for animated transitions', () => {
      mockMatchMedia(false);

      const cancel = runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete: () => {},
      });

      expect(typeof cancel).toBe('function');
    });

    it('cancelling prevents onMidpoint and onComplete from firing', () => {
      mockMatchMedia(false);
      const onMidpoint = vi.fn();
      const onComplete = vi.fn();

      const cancel = runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint,
        onComplete,
      })!;

      cancel();
      vi.advanceTimersByTime(300);

      expect(onMidpoint).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('cancelling cleans up all transition classes', () => {
      mockMatchMedia(false);

      const cancel = runTransition(stage, root, {
        type: 'slide',
        direction: 'backward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete: () => {},
      })!;

      cancel();

      expect(stage.classList.contains('cis-transition-slide')).toBe(false);
      expect(stage.classList.contains('cis-transition--backward')).toBe(false);
      expect(stage.classList.contains('cis-scene-exit')).toBe(false);
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(false);
    });

    it('double cancel is safe', () => {
      mockMatchMedia(false);

      const cancel = runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete: () => {},
      })!;

      cancel();
      expect(() => cancel()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Transition guard
  // -------------------------------------------------------------------------

  describe('TRANSITION_ACTIVE_CLASS guard', () => {
    it('root has cis-transitioning during transition', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onMidpoint: () => {},
        onComplete: () => {},
      });

      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(true);

      vi.advanceTimersByTime(300);
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(false);
    });
  });
});
