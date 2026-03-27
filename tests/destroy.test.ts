import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';

const TAG = 'cis-destroy-test';
beforeAll(() => {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends CloudimageSpotlight {}, { extends: undefined as never });
  }
});

function makeConfig(): SpotlightConfig {
  return {
    version: '1.0',
    ciToken: 'demo',
    scenes: [
      { id: 's0', image: 'a.jpg', title: 'Scene 0' },
      { id: 's1', image: 'b.jpg', title: 'Scene 1' },
      { id: 's2', image: 'c.jpg', title: 'Scene 2' },
    ],
  };
}

function createElement(): CloudimageSpotlight {
  const el = document.createElement(TAG) as CloudimageSpotlight;
  el.setAttribute('eager', '');
  el.config = makeConfig();
  return el;
}

async function mountAndWait(el: CloudimageSpotlight): Promise<void> {
  document.body.appendChild(el);
  await vi.waitFor(() => {
    expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
  });
}

describe('destroy()', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.remove();
  });

  it('clears Shadow DOM', async () => {
    el = createElement();
    await mountAndWait(el);

    expect(el.shadowRoot!.childNodes.length).toBeGreaterThan(0);
    el.destroy();
    expect(el.shadowRoot!.childNodes.length).toBe(0);
  });

  it('navigation methods become no-ops after destroy', async () => {
    el = createElement();
    await mountAndWait(el);

    el.destroy();

    // These should not throw
    expect(() => el.next()).not.toThrow();
    expect(() => el.prev()).not.toThrow();
    expect(() => el.goTo(1)).not.toThrow();
    expect(() => el.goToId('s1')).not.toThrow();
    expect(() => el.play()).not.toThrow();
    expect(() => el.pause()).not.toThrow();
  });

  it('double destroy is safe (idempotent)', async () => {
    el = createElement();
    await mountAndWait(el);

    el.destroy();
    expect(() => el.destroy()).not.toThrow();
  });

  it('destroy sets isPlaying to false', async () => {
    el = createElement();
    await mountAndWait(el);

    el.play();
    expect(el.isPlaying).toBe(true);

    el.destroy();
    expect(el.isPlaying).toBe(false);
  });

  it('does not dispatch events after destroy', async () => {
    el = createElement();
    await mountAndWait(el);

    el.destroy();

    const handler = vi.fn();
    el.addEventListener('cis:scene-change', handler);
    el.next();

    expect(handler).not.toHaveBeenCalled();
  });

  it('connectedCallback is no-op after destroy', async () => {
    el = createElement();
    await mountAndWait(el);

    el.destroy();

    // Remove and re-add to DOM
    el.remove();
    document.body.appendChild(el);

    // Shadow DOM should still be empty
    expect(el.shadowRoot!.childNodes.length).toBe(0);
  });
});

describe('reload()', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('resets to scene 0', async () => {
    el = createElement();
    await mountAndWait(el);

    el.goTo(2);
    expect(el.currentIndex).toBe(2);

    await el.reload(makeConfig());
    expect(el.currentIndex).toBe(0);
  });

  it('re-renders with new config', async () => {
    el = createElement();
    await mountAndWait(el);

    const newConfig: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      title: 'Updated Tour',
      scenes: [
        { id: 'new1', image: 'new.jpg', title: 'New Scene' },
      ],
    };

    await el.reload(newConfig);

    expect(el.totalScenes).toBe(1);
    expect(el.currentScene?.id).toBe('new1');
  });

  it('stops autoplay on reload', async () => {
    el = createElement();
    await mountAndWait(el);

    el.play();
    expect(el.isPlaying).toBe(true);

    await el.reload(makeConfig());
    expect(el.isPlaying).toBe(false);
  });

  it('recovers from destroy via reload', async () => {
    el = createElement();
    await mountAndWait(el);

    el.destroy();
    expect(el.shadowRoot!.childNodes.length).toBe(0);

    await el.reload(makeConfig());

    // Shadow DOM should be rebuilt
    expect(el.shadowRoot!.querySelector('.cis-root')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.cis-stage')).not.toBeNull();
    expect(el.totalScenes).toBe(3);
    expect(el.currentIndex).toBe(0);
  });

  it('throws CISError on invalid config', async () => {
    el = createElement();
    await mountAndWait(el);

    await expect(
      el.reload({ version: '1.0', ciToken: '', scenes: [] } as unknown as SpotlightConfig),
    ).rejects.toThrow();
  });

  it('dispatches cis:error on invalid config', async () => {
    el = createElement();
    await mountAndWait(el);

    const handler = vi.fn();
    el.addEventListener('cis:error', handler);

    try {
      await el.reload({ version: '1.0', ciToken: '', scenes: [] } as unknown as SpotlightConfig);
    } catch {
      // expected
    }

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('destroy before lazy loading fires', () => {
  it('disconnects IntersectionObserver and prevents late init', () => {
    // Create element without eager — will use lazy loading
    const el2 = document.createElement(TAG) as CloudimageSpotlight;
    el2.config = makeConfig();
    document.body.appendChild(el2);

    // Destroy before the observer fires
    el2.destroy();

    // The element should be inert
    expect(el2.totalScenes).toBe(0);
    expect(() => el2.next()).not.toThrow();

    el2.remove();
  });
});
