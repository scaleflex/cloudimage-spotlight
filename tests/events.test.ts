import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';

// Register once
const TAG = 'cloudimage-spotlight-events';
beforeAll(() => {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends CloudimageSpotlight {}, { extends: undefined as never });
  }
});

// We need a different tag name to avoid conflicts. Use define approach.
function createElement(config: SpotlightConfig): CloudimageSpotlight {
  const el = document.createElement(TAG) as CloudimageSpotlight;
  el.config = config;
  el.setAttribute('eager', '');
  return el;
}

const threeSceneConfig: SpotlightConfig = {
  version: '1.0',
  ciToken: 'demo',
  title: 'Test Tour',
  scenes: [
    { id: 'intro', image: 'https://example.com/1.jpg', title: 'Intro' },
    { id: 'middle', image: 'https://example.com/2.jpg', title: 'Middle' },
    { id: 'end', image: 'https://example.com/3.jpg', title: 'End' },
  ],
};

describe('Custom events', () => {
  let el: CloudimageSpotlight;

  beforeEach(() => {
    el = createElement(threeSceneConfig);
  });

  afterEach(() => {
    el.destroy();
    el.remove();
  });

  describe('cis:ready', () => {
    it('fires after first image loads', async () => {
      const handler = vi.fn();
      el.addEventListener('cis:ready', handler);
      document.body.appendChild(el);

      // Simulate image load — trigger the onload on the img in shadow DOM
      await vi.waitFor(() => {
        const img = el.shadowRoot!.querySelector('.cis-image--base') as HTMLImageElement;
        expect(img).not.toBeNull();
      });

      // Manually trigger load event since jsdom doesn't load images
      const img = el.shadowRoot!.querySelector('.cis-image--base') as HTMLImageElement;
      img.dispatchEvent(new Event('load'));

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.totalScenes).toBe(3);
      expect(detail.config).toBeDefined();
      expect(detail.config.ciToken).toBe('demo');
    });

    it('bubbles and is composed', async () => {
      const handler = vi.fn();
      // Listen on document (tests bubbling + composed crossing shadow boundary)
      document.addEventListener('cis:ready', handler);
      document.body.appendChild(el);

      await vi.waitFor(() => {
        const img = el.shadowRoot!.querySelector('.cis-image--base') as HTMLImageElement;
        expect(img).not.toBeNull();
      });

      const img = el.shadowRoot!.querySelector('.cis-image--base') as HTMLImageElement;
      img.dispatchEvent(new Event('load'));

      expect(handler).toHaveBeenCalledTimes(1);
      document.removeEventListener('cis:ready', handler);
    });
  });

  describe('cis:scene-change', () => {
    it('fires on next() with correct payload', async () => {
      const handler = vi.fn();
      el.addEventListener('cis:scene-change', handler);
      document.body.appendChild(el);

      await vi.waitFor(() => expect(el.totalScenes).toBe(3));

      el.next();

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.from).toBe(0);
      expect(detail.to).toBe(1);
      expect(detail.scene.id).toBe('middle');
      expect(detail.totalScenes).toBe(3);
    });

    it('fires on prev() with correct payload', async () => {
      const handler = vi.fn();
      el.addEventListener('cis:scene-change', handler);
      document.body.appendChild(el);

      await vi.waitFor(() => expect(el.totalScenes).toBe(3));

      el.next(); // 0 → 1
      el.prev(); // 1 → 0

      expect(handler).toHaveBeenCalledTimes(2);
      const detail = handler.mock.calls[1][0].detail;
      expect(detail.from).toBe(1);
      expect(detail.to).toBe(0);
    });

    it('fires on goTo() with correct payload', async () => {
      const handler = vi.fn();
      el.addEventListener('cis:scene-change', handler);
      document.body.appendChild(el);

      await vi.waitFor(() => expect(el.totalScenes).toBe(3));

      el.goTo(2);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.to).toBe(2);
    });

    it('fires on goToId() with correct payload', async () => {
      const handler = vi.fn();
      el.addEventListener('cis:scene-change', handler);
      document.body.appendChild(el);

      await vi.waitFor(() => expect(el.totalScenes).toBe(3));

      el.goToId('end');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.scene.id).toBe('end');
    });
  });

  describe('cis:complete', () => {
    it('fires when next() is called on last scene', async () => {
      const handler = vi.fn();
      el.addEventListener('cis:complete', handler);
      document.body.appendChild(el);

      await vi.waitFor(() => expect(el.totalScenes).toBe(3));

      el.goTo(2); // jump to last
      el.next(); // should complete

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.totalScenes).toBe(3);
      expect(detail.timeSpent).toBeGreaterThanOrEqual(0);
      expect(detail.config).toBeDefined();
    });

    it('does not advance past last scene', async () => {
      document.body.appendChild(el);
      await vi.waitFor(() => expect(el.totalScenes).toBe(3));

      el.goTo(2);
      el.next();

      expect(el.currentIndex).toBe(2); // stayed on last
    });
  });

  describe('cis:skip', () => {
    it('fires when skip button is clicked', async () => {
      const handler = vi.fn();
      el.addEventListener('cis:skip', handler);
      el.setAttribute('allow-skip', '');
      document.body.appendChild(el);

      await vi.waitFor(() => {
        const closeBtn = el.shadowRoot!.querySelector('.cis-annotation__close');
        expect(closeBtn).not.toBeNull();
      });

      const closeBtn = el.shadowRoot!.querySelector('.cis-annotation__close') as HTMLButtonElement;
      closeBtn.click();

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.atScene).toBe(0);
      expect(detail.scene.id).toBe('intro');
      expect(detail.totalScenes).toBe(3);
    });
  });

  describe('cis:region-enter', () => {
    it('fires when navigating to a scene with regions', async () => {
      const configWithRegions: SpotlightConfig = {
        version: '1.0',
        ciToken: 'demo',
        scenes: [
          { id: 's0', image: 'a.jpg' },
          {
            id: 's1',
            image: 'b.jpg',
            regions: [{ tl_x: 0.1, tl_y: 0.2, br_x: 0.5, br_y: 0.6 }],
          },
        ],
      };
      const elr = createElement(configWithRegions);
      const handler = vi.fn();
      elr.addEventListener('cis:region-enter', handler);
      document.body.appendChild(elr);

      await vi.waitFor(() => expect(elr.totalScenes).toBe(2));

      elr.next(); // navigate to scene with regions

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.scene.id).toBe('s1');
      expect(detail.regions).toHaveLength(1);

      elr.destroy();
      elr.remove();
    });
  });

  describe('cis:error', () => {
    it('fires on config validation failure', async () => {
      const badEl = document.createElement(TAG) as CloudimageSpotlight;
      badEl.setAttribute('eager', '');
      const handler = vi.fn();
      badEl.addEventListener('cis:error', handler);

      document.body.appendChild(badEl);

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalled();
      });

      const detail = handler.mock.calls[0][0].detail;
      expect(detail.code).toBeDefined();
      expect(detail.message).toBeDefined();

      badEl.destroy();
      badEl.remove();
    });
  });
});

describe('Controls bar', () => {
  let el: CloudimageSpotlight;

  beforeEach(() => {
    el = createElement(threeSceneConfig);
  });

  afterEach(() => {
    el.destroy();
    el.remove();
  });

  it('renders progress, next, and close inside annotation', async () => {
    el.setAttribute('allow-skip', '');
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    // First scene: no prev button, but next + progress + close exist
    expect(el.shadowRoot!.querySelector('.cis-annotation__btn--prev')).toBeNull();
    expect(el.shadowRoot!.querySelector('.cis-annotation__btn--next')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.cis-annotation__close')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.cis-annotation__progress')).not.toBeNull();
  });

  it('shows correct progress text', async () => {
    document.body.appendChild(el);

    await vi.waitFor(() => {
      const progress = el.shadowRoot!.querySelector('.cis-annotation__progress');
      expect(progress).not.toBeNull();
      expect(progress!.textContent).toBe('1 / 3');
    });
  });

  it('updates progress on navigation', async () => {
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.totalScenes).toBe(3));

    el.next();

    const progress = el.shadowRoot!.querySelector('.cis-annotation__progress');
    expect(progress!.textContent).toBe('2 / 3');
  });

  it('does not render prev button on first scene', async () => {
    document.body.appendChild(el);
    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    // First scene has no prev button at all
    expect(el.shadowRoot!.querySelector('.cis-annotation__btn--prev')).toBeNull();
  });

  it('renders prev button after navigating forward', async () => {
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.totalScenes).toBe(3));

    el.next();

    const prev = el.shadowRoot!.querySelector('.cis-annotation__btn--prev');
    expect(prev).not.toBeNull();
  });

  it('changes next button label on last scene', async () => {
    document.body.appendChild(el);
    await vi.waitFor(() => expect(el.totalScenes).toBe(3));

    el.goTo(2);

    const next = el.shadowRoot!.querySelector('.cis-annotation__btn--next');
    expect(next!.getAttribute('aria-label')).toBe('Finish');
  });

  it('next button clicks trigger navigation', async () => {
    const handler = vi.fn();
    el.addEventListener('cis:scene-change', handler);
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation__btn--next')).not.toBeNull();
    });

    const nextBtn = el.shadowRoot!.querySelector('.cis-annotation__btn--next') as HTMLButtonElement;
    nextBtn.click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('prev button does not exist on first scene (no-op)', async () => {
    const handler = vi.fn();
    el.addEventListener('cis:scene-change', handler);
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    // No prev button on first scene means no way to accidentally trigger
    expect(el.shadowRoot!.querySelector('.cis-annotation__btn--prev')).toBeNull();
    expect(handler).not.toHaveBeenCalled();
  });
});
