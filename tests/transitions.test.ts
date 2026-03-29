import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  runTransition,
  prefersReducedMotion,
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
  // Reduced motion — instant cut (renders directly into stage)
  // -------------------------------------------------------------------------

  describe('reduced motion (instant cut)', () => {
    it('calls onSwap with the stage element and onComplete synchronously', () => {
      const onSwap = vi.fn();
      const onComplete = vi.fn();

      const cancel = runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: true,
        onSwap,
        onComplete,
      });

      expect(onSwap).toHaveBeenCalledTimes(1);
      expect(onSwap).toHaveBeenCalledWith(stage);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(cancel).toBeUndefined();
    });

    it('does not add transition classes or layers', () => {
      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: true,
        onSwap: () => {},
        onComplete: () => {},
      });

      expect(stage.querySelector('.cis-transition-layer')).toBeNull();
      expect(stage.classList.contains('cis-transition-fade')).toBe(false);
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Fade transition — dual-layer
  // -------------------------------------------------------------------------

  describe('fade transition', () => {
    it('creates outgoing and incoming layers with correct classes', () => {
      mockMatchMedia(false);

      // Add existing content to simulate a rendered scene
      const child = document.createElement('div');
      child.className = 'existing-content';
      stage.appendChild(child);

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: () => {},
        onComplete: () => {},
      });

      const outgoing = stage.querySelector('.cis-transition-layer--outgoing');
      const incoming = stage.querySelector('.cis-transition-layer--incoming');
      expect(outgoing).not.toBeNull();
      expect(incoming).not.toBeNull();
      // Existing content moved into outgoing
      expect(outgoing!.querySelector('.existing-content')).not.toBeNull();
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(true);
    });

    it('calls onSwap with the incoming layer immediately', () => {
      mockMatchMedia(false);
      const onSwap = vi.fn();

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap,
        onComplete: () => {},
      });

      expect(onSwap).toHaveBeenCalledTimes(1);
      const incomingLayer = onSwap.mock.calls[0][0] as HTMLDivElement;
      expect(incomingLayer.classList.contains('cis-transition-layer--incoming')).toBe(true);
    });

    it('incoming layer has enter classes before onSwap to prevent flash', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: (layer) => {
          // Inside onSwap, the layer should already have the enter class
          // so it starts hidden (opacity: 0) — prevents a visible flash.
          expect(layer.classList.contains('cis-scene-enter')).toBe(true);
          expect(layer.classList.contains('cis-transition-fade')).toBe(true);
        },
        onComplete: () => {},
      });
    });

    it('adds exit/enter and type classes to layers', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: () => {},
        onComplete: () => {},
      });

      const outgoing = stage.querySelector('.cis-transition-layer--outgoing')!;
      const incoming = stage.querySelector('.cis-transition-layer--incoming')!;
      expect(outgoing.classList.contains('cis-scene-exit')).toBe(true);
      expect(outgoing.classList.contains('cis-transition-fade')).toBe(true);
      expect(incoming.classList.contains('cis-scene-enter')).toBe(true);
      expect(incoming.classList.contains('cis-transition-fade')).toBe(true);
    });

    it('adds active classes on next frame', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: () => {},
        onComplete: () => {},
      });

      // Trigger rAF
      vi.advanceTimersByTime(16);

      const outgoing = stage.querySelector('.cis-transition-layer--outgoing')!;
      const incoming = stage.querySelector('.cis-transition-layer--incoming')!;
      expect(outgoing.classList.contains('cis-scene-exit-active')).toBe(true);
      expect(incoming.classList.contains('cis-scene-enter-active')).toBe(true);
    });

    it('on complete: removes outgoing, keeps incoming as positioned wrapper', () => {
      mockMatchMedia(false);
      const onComplete = vi.fn();

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: () => {},
        onComplete,
      });

      vi.advanceTimersByTime(300);

      expect(onComplete).toHaveBeenCalledTimes(1);
      // Outgoing removed
      expect(stage.querySelector('.cis-transition-layer--outgoing')).toBeNull();
      // Incoming stays but transition-animation classes stripped
      const remaining = stage.querySelector('.cis-transition-layer') as HTMLDivElement;
      expect(remaining).not.toBeNull();
      expect(remaining.classList.contains('cis-transition-layer--incoming')).toBe(false);
      expect(remaining.classList.contains('cis-scene-enter')).toBe(false);
      expect(remaining.classList.contains('cis-scene-enter-active')).toBe(false);
      expect(remaining.classList.contains('cis-transition-fade')).toBe(false);
      // TRANSITION_ACTIVE_CLASS removed from root
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Slide transition — direction awareness
  // -------------------------------------------------------------------------

  describe('slide transition', () => {
    it('adds backward modifier to both layers for backward direction', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'slide',
        direction: 'backward',
        reducedMotion: false,
        onSwap: () => {},
        onComplete: () => {},
      });

      const outgoing = stage.querySelector('.cis-transition-layer--outgoing')!;
      const incoming = stage.querySelector('.cis-transition-layer--incoming')!;
      expect(outgoing.classList.contains('cis-transition--backward')).toBe(true);
      expect(incoming.classList.contains('cis-transition--backward')).toBe(true);
    });

    it('does not add backward modifier for forward direction', () => {
      mockMatchMedia(false);

      runTransition(stage, root, {
        type: 'slide',
        direction: 'forward',
        reducedMotion: false,
        onSwap: () => {},
        onComplete: () => {},
      });

      const outgoing = stage.querySelector('.cis-transition-layer--outgoing')!;
      const incoming = stage.querySelector('.cis-transition-layer--incoming')!;
      expect(outgoing.classList.contains('cis-transition--backward')).toBe(false);
      expect(incoming.classList.contains('cis-transition--backward')).toBe(false);
    });

    it('completes at 350ms', () => {
      mockMatchMedia(false);
      const onComplete = vi.fn();

      runTransition(stage, root, {
        type: 'slide',
        direction: 'forward',
        reducedMotion: false,
        onSwap: () => {},
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
        onSwap: () => {},
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
        onSwap: () => {},
        onComplete: () => {},
      });

      expect(typeof cancel).toBe('function');
    });

    it('cancelling prevents onComplete from firing', () => {
      mockMatchMedia(false);
      const onComplete = vi.fn();

      const cancel = runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: () => {},
        onComplete,
      })!;

      cancel();
      vi.advanceTimersByTime(300);

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('cancelling cleans up: removes outgoing, keeps incoming wrapper', () => {
      mockMatchMedia(false);

      const cancel = runTransition(stage, root, {
        type: 'slide',
        direction: 'backward',
        reducedMotion: false,
        onSwap: () => {},
        onComplete: () => {},
      })!;

      cancel();

      expect(stage.querySelector('.cis-transition-layer--outgoing')).toBeNull();
      const remaining = stage.querySelector('.cis-transition-layer');
      expect(remaining).not.toBeNull();
      expect(remaining!.classList.contains('cis-scene-enter')).toBe(false);
      expect(remaining!.classList.contains('cis-transition--backward')).toBe(false);
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(false);
    });

    it('double cancel is safe', () => {
      mockMatchMedia(false);

      const cancel = runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: () => {},
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
        onSwap: () => {},
        onComplete: () => {},
      });

      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(true);

      vi.advanceTimersByTime(300);
      expect(root.classList.contains(TRANSITION_ACTIVE_CLASS)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Dual-layer structural integrity
  // -------------------------------------------------------------------------

  describe('dual-layer structure', () => {
    it('existing stage children are wrapped into outgoing layer', () => {
      mockMatchMedia(false);

      const child = document.createElement('span');
      child.textContent = 'old scene';
      stage.appendChild(child);

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: () => {},
        onComplete: () => {},
      });

      const outgoing = stage.querySelector('.cis-transition-layer--outgoing')!;
      expect(outgoing.contains(child)).toBe(true);
    });

    it('incoming layer content remains connected after transition completes', () => {
      mockMatchMedia(false);

      let incomingRef: HTMLDivElement | null = null;

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: (layer) => {
          incomingRef = layer;
          const p = document.createElement('p');
          p.className = 'new-content';
          layer.appendChild(p);
        },
        onComplete: () => {},
      });

      vi.advanceTimersByTime(300);

      // Content still reachable in DOM via the (now settled) incoming layer
      expect(stage.querySelector('.new-content')).not.toBeNull();
      expect(incomingRef!.isConnected).toBe(true);
    });

    it('closures referencing incoming layer can still mutate DOM after transition', () => {
      mockMatchMedia(false);

      let incomingRef: HTMLDivElement | null = null;

      runTransition(stage, root, {
        type: 'fade',
        direction: 'forward',
        reducedMotion: false,
        onSwap: (layer) => { incomingRef = layer; },
        onComplete: () => {},
      });

      vi.advanceTimersByTime(300);

      // Simulate a deferred operation (e.g., zoom appending a zoomed image)
      const deferred = document.createElement('img');
      deferred.className = 'cis-image--zoomed';
      incomingRef!.appendChild(deferred);

      // The appended element is reachable from the stage
      expect(stage.querySelector('.cis-image--zoomed')).not.toBeNull();
    });
  });
});
