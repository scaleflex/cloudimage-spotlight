import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';

const TAG = 'cis-a11y-test';
beforeAll(() => {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends CloudimageSpotlight {}, { extends: undefined as never });
  }
});

function makeConfig(opts?: Partial<SpotlightConfig>): SpotlightConfig {
  return {
    version: '1.0',
    ciToken: 'demo',
    title: 'Feature Tour',
    scenes: [
      {
        id: 'intro',
        image: 'intro.jpg',
        title: 'Welcome',
        description: 'This is the intro scene.',
        regions: [{ tl_x: 0.1, tl_y: 0.1, br_x: 0.5, br_y: 0.5 }],
      },
      {
        id: 'step2',
        image: 'step2.jpg',
        title: 'Step Two',
        description: 'Second scene of the tour.',
      },
      {
        id: 'final',
        image: 'final.jpg',
        title: 'Done',
      },
    ],
    ...opts,
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

// ---------------------------------------------------------------------------
// Integration: ARIA attributes on the live component
// ---------------------------------------------------------------------------

describe('accessibility (component integration)', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  describe('root element ARIA', () => {
    it('has role="region"', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const root = el.shadowRoot!.querySelector('.cis-root')!;
      expect(root.getAttribute('role')).toBe('region');
    });

    it('has aria-roledescription="Interactive tour"', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const root = el.shadowRoot!.querySelector('.cis-root')!;
      expect(root.getAttribute('aria-roledescription')).toBe('Interactive tour');
    });

    it('has aria-label from config title', async () => {
      el = createElement(makeConfig({ title: 'My Feature Tour' }));
      await mountAndWait(el);

      const root = el.shadowRoot!.querySelector('.cis-root')!;
      expect(root.getAttribute('aria-label')).toBe('My Feature Tour');
    });
  });

  describe('host tabindex', () => {
    it('sets tabindex="0" on the host element', () => {
      el = createElement(makeConfig());
      document.body.appendChild(el);
      expect(el.getAttribute('tabindex')).toBe('0');
    });

    it('does not override existing tabindex', () => {
      el = document.createElement(TAG) as CloudimageSpotlight;
      el.setAttribute('tabindex', '-1');
      el.setAttribute('eager', '');
      el.config = makeConfig();
      document.body.appendChild(el);
      expect(el.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('progress counter', () => {
    it('has aria-live="polite" and aria-atomic="true"', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const progress = el.shadowRoot!.querySelector('.cis-annotation__progress');
      expect(progress).not.toBeNull();
      expect(progress!.getAttribute('aria-live')).toBe('polite');
      expect(progress!.getAttribute('aria-atomic')).toBe('true');
    });

    it('shows correct progress text', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const progress = el.shadowRoot!.querySelector('.cis-annotation__progress');
      expect(progress!.textContent).toBe('1 / 3');
    });

    it('updates on navigation', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      el.next();
      const progress = el.shadowRoot!.querySelector('.cis-annotation__progress');
      expect(progress!.textContent).toBe('2 / 3');
    });
  });

  describe('controls ARIA', () => {
    it('prev button is absent on first scene', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      // First scene: no prev button at all
      const prev = el.shadowRoot!.querySelector('.cis-annotation__btn--prev');
      expect(prev).toBeNull();
    });

    it('prev button is present after navigating forward', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      el.next();
      const prev = el.shadowRoot!.querySelector('.cis-annotation__btn--prev');
      expect(prev).not.toBeNull();
    });

    it('next button shows "Finish" on last scene', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      el.goTo(2);
      const next = el.shadowRoot!.querySelector('.cis-annotation__btn--next');
      expect(next!.getAttribute('aria-label')).toBe('Finish');
    });

    it('nav has aria-label', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const nav = el.shadowRoot!.querySelector('.cis-annotation__nav');
      expect(nav!.getAttribute('aria-label')).toBe('Experience navigation');
    });
  });

  describe('annotation card', () => {
    it('has role="status" and aria-live="polite"', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const card = el.shadowRoot!.querySelector('.cis-annotation');
      expect(card).not.toBeNull();
      expect(card!.getAttribute('role')).toBe('status');
      expect(card!.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('decorative elements', () => {
    it('SVG mask has aria-hidden="true"', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const masks = el.shadowRoot!.querySelectorAll('.cis-mask');
      for (const m of masks) {
        expect(m.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('region highlights have aria-hidden="true"', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const highlights = el.shadowRoot!.querySelectorAll('.cis-region-highlight');
      for (const h of highlights) {
        expect(h.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('badges have aria-hidden="true"', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const badges = el.shadowRoot!.querySelectorAll('.cis-badge');
      for (const b of badges) {
        expect(b.getAttribute('aria-hidden')).toBe('true');
      }
    });
  });

  describe('image alt text', () => {
    it('base image has descriptive alt text', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      const img = el.shadowRoot!.querySelector('.cis-image--base, .cis-image--sharp') as HTMLImageElement;
      if (img) {
        expect(img.alt).toContain('Step 1 of 3');
        expect(img.alt).toContain('Welcome');
      }
    });
  });

  describe('strings property (i18n)', () => {
    it('updates aria-roledescription when strings change', async () => {
      el = createElement(makeConfig());
      await mountAndWait(el);

      el.strings = { tourLabel: 'Visita interactiva' };
      const root = el.shadowRoot!.querySelector('.cis-root')!;
      expect(root.getAttribute('aria-roledescription')).toBe('Visita interactiva');
    });
  });
});
