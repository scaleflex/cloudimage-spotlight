import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createResponsiveController, type ResponsiveController } from '../src/responsive';

describe('responsive controller', () => {
  let root: HTMLDivElement;
  let ctrl: ResponsiveController;

  beforeEach(() => {
    root = document.createElement('div');
    root.className = 'cis-root';
    document.body.appendChild(root);

    // Create stage with annotation
    const stage = document.createElement('div');
    stage.className = 'cis-stage';
    const annotation = document.createElement('div');
    annotation.className = 'cis-annotation';
    annotation.textContent = 'Test annotation';
    stage.appendChild(annotation);
    root.appendChild(stage);
  });

  afterEach(() => {
    ctrl?.destroy();
    root.remove();
  });

  // -------------------------------------------------------------------------
  // Mobile detection
  // -------------------------------------------------------------------------

  describe('mobile breakpoint', () => {
    it('adds cis-root--mobile when width < 600', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();

      expect(root.classList.contains('cis-root--mobile')).toBe(true);
    });

    it('does not add cis-root--mobile when width >= 600', () => {
      Object.defineProperty(root, 'clientWidth', { value: 800, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();

      expect(root.classList.contains('cis-root--mobile')).toBe(false);
    });

    it('isMobile() returns correct state', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();

      expect(ctrl.isMobile()).toBe(true);
    });

    it('does not toggle when width is 0 (not mounted)', () => {
      Object.defineProperty(root, 'clientWidth', { value: 0, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();

      expect(root.classList.contains('cis-root--mobile')).toBe(false);
      expect(ctrl.isMobile()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Bottom-sheet creation
  // -------------------------------------------------------------------------

  describe('bottom-sheet layout', () => {
    it('creates .cis-bottom-sheet on mobile', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();

      const sheet = root.querySelector('.cis-bottom-sheet');
      expect(sheet).not.toBeNull();
    });

    it('moves annotation into bottom-sheet', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();

      const sheet = root.querySelector('.cis-bottom-sheet')!;
      expect(sheet.querySelector('.cis-annotation')).not.toBeNull();
      // Annotation should no longer be in stage
      expect(root.querySelector('.cis-stage .cis-annotation')).toBeNull();
    });

    it('annotation is inside bottom-sheet (controls are embedded)', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();

      const sheet = root.querySelector('.cis-bottom-sheet')!;
      expect(sheet.querySelector('.cis-annotation')).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Desktop restore
  // -------------------------------------------------------------------------

  describe('desktop restore', () => {
    it('removes cis-root--mobile when resized above breakpoint', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();
      expect(root.classList.contains('cis-root--mobile')).toBe(true);

      // Resize to desktop
      Object.defineProperty(root, 'clientWidth', { value: 900, configurable: true });
      ctrl.evaluate();
      expect(root.classList.contains('cis-root--mobile')).toBe(false);
    });

    it('moves annotation back to stage on desktop', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();

      // Back to desktop
      Object.defineProperty(root, 'clientWidth', { value: 900, configurable: true });
      ctrl.evaluate();

      expect(root.querySelector('.cis-stage .cis-annotation')).not.toBeNull();
    });

    it('removes bottom-sheet from DOM on desktop', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();

      Object.defineProperty(root, 'clientWidth', { value: 900, configurable: true });
      ctrl.evaluate();

      expect(root.querySelector('.cis-bottom-sheet')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // No-op when same state
  // -------------------------------------------------------------------------

  describe('no-op when state unchanged', () => {
    it('calling evaluate() twice at same width is safe', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();
      ctrl.evaluate();

      // Should still have exactly one bottom-sheet
      expect(root.querySelectorAll('.cis-bottom-sheet')).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // destroy()
  // -------------------------------------------------------------------------

  describe('destroy', () => {
    it('restores desktop layout on destroy from mobile', () => {
      Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();
      expect(root.classList.contains('cis-root--mobile')).toBe(true);

      ctrl.destroy();
      expect(root.classList.contains('cis-root--mobile')).toBe(false);
    });

    it('is safe to call destroy from desktop state', () => {
      Object.defineProperty(root, 'clientWidth', { value: 900, configurable: true });
      ctrl = createResponsiveController(root);
      ctrl.evaluate();
      expect(() => ctrl.destroy()).not.toThrow();
    });
  });
});
