import { describe, it, expect } from 'vitest';
import { createSkeleton, setLoadingPhase } from '../src/loading';

describe('loading states', () => {
  // -------------------------------------------------------------------------
  // createSkeleton
  // -------------------------------------------------------------------------

  describe('createSkeleton', () => {
    it('creates a skeleton element with shimmer child', () => {
      const skeleton = createSkeleton();
      expect(skeleton.className).toBe('cis-skeleton');
      expect(skeleton.getAttribute('aria-hidden')).toBe('true');
      expect(skeleton.querySelector('.cis-skeleton__shimmer')).not.toBeNull();
    });

    it('each call creates a new instance', () => {
      const a = createSkeleton();
      const b = createSkeleton();
      expect(a).not.toBe(b);
    });
  });

  // -------------------------------------------------------------------------
  // setLoadingPhase
  // -------------------------------------------------------------------------

  describe('setLoadingPhase', () => {
    function makeRoot(): HTMLDivElement {
      const root = document.createElement('div');
      root.className = 'cis-root';
      root.appendChild(createSkeleton());
      return root;
    }

    it('config phase adds cis-loading class', () => {
      const root = makeRoot();
      setLoadingPhase(root, 'config');
      expect(root.classList.contains('cis-loading')).toBe(true);
    });

    it('image phase adds cis-loading class', () => {
      const root = makeRoot();
      setLoadingPhase(root, 'image');
      expect(root.classList.contains('cis-loading')).toBe(true);
    });

    it('ready phase removes cis-loading class', () => {
      const root = makeRoot();
      root.classList.add('cis-loading');
      setLoadingPhase(root, 'ready');
      expect(root.classList.contains('cis-loading')).toBe(false);
    });

    it('ready phase removes skeleton from DOM', () => {
      const root = makeRoot();
      expect(root.querySelector('.cis-skeleton')).not.toBeNull();
      setLoadingPhase(root, 'ready');
      expect(root.querySelector('.cis-skeleton')).toBeNull();
    });

    it('ready phase is safe when skeleton already removed', () => {
      const root = document.createElement('div');
      root.className = 'cis-root cis-loading';
      expect(() => setLoadingPhase(root, 'ready')).not.toThrow();
      expect(root.classList.contains('cis-loading')).toBe(false);
    });
  });
});
