import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';

const TAG = 'cis-keyboard-test';
beforeAll(() => {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends CloudimageSpotlight {}, { extends: undefined as never });
  }
});

function makeConfig(sceneCount = 5): SpotlightConfig {
  return {
    version: '1.0',
    ciToken: 'demo',
    scenes: Array.from({ length: sceneCount }, (_, i) => ({
      id: `scene-${i}`,
      image: `test${i}.jpg`,
      title: `Scene ${i}`,
    })),
  };
}

function createElement(config: SpotlightConfig): CloudimageSpotlight {
  const el = document.createElement(TAG) as CloudimageSpotlight;
  el.setAttribute('eager', '');
  el.config = config;
  return el;
}

async function mountAndWait(el: CloudimageSpotlight): Promise<void> {
  document.body.appendChild(el);
  await vi.waitFor(() => {
    expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
  });
}

function pressKey(el: HTMLElement, key: string, opts: Partial<KeyboardEventInit> = {}): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }));
}

describe('keyboard navigation', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  // -------------------------------------------------------------------------
  // Basic key bindings
  // -------------------------------------------------------------------------

  describe('arrow keys', () => {
    it('→ advances to next scene', async () => {
      el = createElement(makeConfig(5));
      await mountAndWait(el);
      expect(el.currentIndex).toBe(0);
      pressKey(el, 'ArrowRight');
      expect(el.currentIndex).toBe(1);
    });

    it('← goes to previous scene', async () => {
      el = createElement(makeConfig(5));
      await mountAndWait(el);
      el.goTo(2);
      pressKey(el, 'ArrowLeft');
      expect(el.currentIndex).toBe(1);
    });

    it('← on first scene is no-op', async () => {
      el = createElement(makeConfig(5));
      await mountAndWait(el);
      pressKey(el, 'ArrowLeft');
      expect(el.currentIndex).toBe(0);
    });
  });

  describe('Space key', () => {
    it('Space advances to next scene', async () => {
      el = createElement(makeConfig(3));
      await mountAndWait(el);
      pressKey(el, ' ');
      expect(el.currentIndex).toBe(1);
    });
  });

  describe('Escape key', () => {
    it('Escape dispatches cis:skip', async () => {
      el = createElement(makeConfig(3));
      await mountAndWait(el);
      const handler = vi.fn();
      el.addEventListener('cis:skip', handler);
      pressKey(el, 'Escape');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Home / End', () => {
    it('Home jumps to first scene', async () => {
      el = createElement(makeConfig(5));
      await mountAndWait(el);
      el.goTo(3);
      pressKey(el, 'Home');
      expect(el.currentIndex).toBe(0);
    });

    it('End jumps to last scene', async () => {
      el = createElement(makeConfig(5));
      await mountAndWait(el);
      pressKey(el, 'End');
      expect(el.currentIndex).toBe(4);
    });

    it('Home on first scene is no-op', async () => {
      el = createElement(makeConfig(5));
      await mountAndWait(el);
      pressKey(el, 'Home');
      expect(el.currentIndex).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Number keys 1-9
  // -------------------------------------------------------------------------

  describe('number keys (1-9)', () => {
    it('1-5 jump to corresponding scene for 5-scene config', async () => {
      el = createElement(makeConfig(5));
      await mountAndWait(el);

      pressKey(el, '3');
      expect(el.currentIndex).toBe(2);

      pressKey(el, '1');
      expect(el.currentIndex).toBe(0);

      pressKey(el, '5');
      expect(el.currentIndex).toBe(4);
    });

    it('number keys are ignored when > 9 scenes', async () => {
      el = createElement(makeConfig(12));
      await mountAndWait(el);

      pressKey(el, '3');
      expect(el.currentIndex).toBe(0); // no-op
    });

    it('out-of-range number key is ignored', async () => {
      el = createElement(makeConfig(3));
      await mountAndWait(el);

      pressKey(el, '5'); // only 3 scenes
      expect(el.currentIndex).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // RTL support
  // -------------------------------------------------------------------------

  describe('RTL arrow key reversal', () => {
    it('swaps arrow keys in RTL mode', async () => {
      el = createElement(makeConfig(5));
      el.setAttribute('dir', 'rtl');
      const origGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = (() => ({
        direction: 'rtl',
        getPropertyValue: () => '',
      })) as unknown as typeof window.getComputedStyle;

      await mountAndWait(el);

      // In RTL: ArrowLeft = next, ArrowRight = prev
      pressKey(el, 'ArrowLeft');
      expect(el.currentIndex).toBe(1);

      pressKey(el, 'ArrowRight');
      expect(el.currentIndex).toBe(0);

      window.getComputedStyle = origGetComputedStyle;
    });
  });

  // -------------------------------------------------------------------------
  // allow-keyboard attribute
  // -------------------------------------------------------------------------

  describe('allow-keyboard="false"', () => {
    it('disables keyboard navigation', async () => {
      el = createElement(makeConfig(5));
      el.setAttribute('allow-keyboard', 'false');
      await mountAndWait(el);

      pressKey(el, 'ArrowRight');
      expect(el.currentIndex).toBe(0); // no-op
    });

    it('re-enables after setting allow-keyboard back', async () => {
      el = createElement(makeConfig(5));
      el.setAttribute('allow-keyboard', 'false');
      await mountAndWait(el);

      pressKey(el, 'ArrowRight');
      expect(el.currentIndex).toBe(0);

      el.setAttribute('allow-keyboard', 'true');
      pressKey(el, 'ArrowRight');
      expect(el.currentIndex).toBe(1);
    });

    it('config setting allowKeyboard: false disables', async () => {
      const config = makeConfig(5);
      config.settings = { allowKeyboard: false };
      el = createElement(config);
      await mountAndWait(el);

      pressKey(el, 'ArrowRight');
      expect(el.currentIndex).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // cis:complete on last scene
  // -------------------------------------------------------------------------

  describe('last scene behavior', () => {
    it('→ on last scene dispatches cis:complete', async () => {
      el = createElement(makeConfig(3));
      await mountAndWait(el);

      const handler = vi.fn();
      el.addEventListener('cis:complete', handler);

      el.goTo(2);
      pressKey(el, 'ArrowRight');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Event prevention
  // -------------------------------------------------------------------------

  describe('default prevention', () => {
    it('prevents default on handled keys', async () => {
      el = createElement(makeConfig(3));
      await mountAndWait(el);

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      el.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('does not prevent default on unhandled keys', async () => {
      el = createElement(makeConfig(3));
      await mountAndWait(el);

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      el.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });
  });
});
