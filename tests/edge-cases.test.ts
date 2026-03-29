import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';

const TAG = 'cis-edge-test';
beforeAll(() => {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends CloudimageSpotlight {}, { extends: undefined as never });
  }
});

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
// Zero / invalid scenes
// ---------------------------------------------------------------------------

describe('edge case: invalid config', () => {
  it('empty scenes array dispatches cis:error', async () => {
    const handler = vi.fn();
    const el = document.createElement(TAG) as CloudimageSpotlight;
    el.setAttribute('eager', '');
    el.addEventListener('cis:error', handler);
    el.config = { version: '1.0', ciToken: 'demo', scenes: [] } as unknown as SpotlightConfig;
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });

    expect(handler.mock.calls[0][0].detail.code).toBe('INVALID_JSON');
    el.destroy();
    el.remove();
  });

  it('config without ciToken uses image URLs directly', async () => {
    const handler = vi.fn();
    const el = document.createElement(TAG) as CloudimageSpotlight;
    el.setAttribute('eager', '');
    el.addEventListener('cis:ready', handler);
    el.config = { version: '1.0', scenes: [{ id: 's', image: 'https://cdn.example.com/x.jpg' }] } as unknown as SpotlightConfig;
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });

    el.destroy();
    el.remove();
  });
});

// ---------------------------------------------------------------------------
// Single scene
// ---------------------------------------------------------------------------

describe('edge case: single scene', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('renders correctly', async () => {
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 'only', image: 'only.jpg', title: 'Only Scene' }],
    });
    await mountAndWait(el);

    expect(el.currentIndex).toBe(0);
    expect(el.totalScenes).toBe(1);
  });

  it('prev is no-op on single scene', async () => {
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 'only', image: 'only.jpg', title: 'Only Scene' }],
    });
    await mountAndWait(el);

    el.prev();
    expect(el.currentIndex).toBe(0);
  });

  it('next on single scene dispatches complete', async () => {
    const handler = vi.fn();
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 'only', image: 'only.jpg', title: 'Only Scene' }],
    });
    el.addEventListener('cis:complete', handler);
    await mountAndWait(el);

    el.next();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('prev button does not exist on first scene', async () => {
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 'only', image: 'only.jpg', title: 'Only Scene' }],
    });
    await mountAndWait(el);

    const prev = el.shadowRoot!.querySelector('.cis-annotation__btn--prev');
    expect(prev).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Empty regions
// ---------------------------------------------------------------------------

describe('edge case: empty regions', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('scene with empty regions array renders without mask', async () => {
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'a.jpg', title: 'No Regions', regions: [] }],
    });
    await mountAndWait(el);

    expect(el.shadowRoot!.querySelector('.cis-mask')).toBeNull();
    expect(el.shadowRoot!.querySelectorAll('.cis-region-highlight').length).toBe(0);
    expect(el.shadowRoot!.querySelectorAll('.cis-badge').length).toBe(0);
  });

  it('scene without regions field renders without mask', async () => {
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'a.jpg', title: 'No Regions' }],
    });
    await mountAndWait(el);

    expect(el.shadowRoot!.querySelector('.cis-mask')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Rapid navigation
// ---------------------------------------------------------------------------

describe('edge case: rapid navigation', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('rapid next() calls land on correct scene', async () => {
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: Array.from({ length: 5 }, (_, i) => ({
        id: `s${i}`,
        image: `${i}.jpg`,
        title: `Scene ${i}`,
      })),
    });
    await mountAndWait(el);

    el.next();
    el.next();
    el.next();

    expect(el.currentIndex).toBe(3);
  });

  it('rapid prev() calls stay at 0', async () => {
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [
        { id: 's0', image: 'a.jpg', title: 'A' },
        { id: 's1', image: 'b.jpg', title: 'B' },
      ],
    });
    await mountAndWait(el);

    el.prev();
    el.prev();
    el.prev();

    expect(el.currentIndex).toBe(0);
  });

  it('goTo out of range is no-op', async () => {
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [
        { id: 's0', image: 'a.jpg', title: 'A' },
        { id: 's1', image: 'b.jpg', title: 'B' },
      ],
    });
    await mountAndWait(el);

    el.goTo(99);
    expect(el.currentIndex).toBe(0);

    el.goTo(-1);
    expect(el.currentIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Double destroy
// ---------------------------------------------------------------------------

describe('edge case: double destroy', () => {
  it('is idempotent', async () => {
    const el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's', image: 'a.jpg', title: 'A' }],
    });
    await mountAndWait(el);

    el.destroy();
    expect(() => el.destroy()).not.toThrow();
    el.remove();
  });
});

// ---------------------------------------------------------------------------
// Concurrent reload
// ---------------------------------------------------------------------------

describe('edge case: concurrent reload', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('second reload supersedes first', async () => {
    el = createElement({
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's0', image: 'a.jpg', title: 'A' }],
    });
    await mountAndWait(el);

    const config2: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [
        { id: 'new1', image: 'n1.jpg', title: 'New 1' },
        { id: 'new2', image: 'n2.jpg', title: 'New 2' },
      ],
    };

    // Fire two reloads without awaiting the first
    const p1 = el.reload({
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 'mid', image: 'm.jpg', title: 'Mid' }],
    });
    const p2 = el.reload(config2);

    await Promise.all([p1, p2]);

    // Second reload should win
    expect(el.totalScenes).toBe(2);
    expect(el.currentScene?.id).toBe('new1');
  });
});
