import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { buildHash, parseHash, createDeepLinkController } from '../src/deep-link';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';

// ---------------------------------------------------------------------------
// Pure function tests
// ---------------------------------------------------------------------------

describe('deep-link module', () => {
  describe('buildHash', () => {
    it('builds #cis-{sceneId} when no element id', () => {
      expect(buildHash(null, 'smart-tags')).toBe('#cis-smart-tags');
    });

    it('builds #{elementId}:{sceneId} when element has id', () => {
      expect(buildHash('myTour', 'smart-tags')).toBe('#myTour:smart-tags');
    });
  });

  describe('parseHash', () => {
    it('parses #cis-{sceneId} when no element id', () => {
      expect(parseHash('#cis-smart-tags', null)).toBe('smart-tags');
    });

    it('parses #{elementId}:{sceneId} when element has id', () => {
      expect(parseHash('#myTour:smart-tags', 'myTour')).toBe('smart-tags');
    });

    it('returns null for non-matching hash', () => {
      expect(parseHash('#other-hash', null)).toBeNull();
    });

    it('returns null for empty hash', () => {
      expect(parseHash('', null)).toBeNull();
    });

    it('ignores #cis- prefix when element has id', () => {
      expect(parseHash('#cis-smart-tags', 'myTour')).toBeNull();
    });

    it('ignores #{id}: prefix when no element id', () => {
      expect(parseHash('#myTour:smart-tags', null)).toBeNull();
    });
  });

  describe('createDeepLinkController', () => {
    afterEach(() => {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    });

    it('syncHash updates URL via replaceState', () => {
      const ctrl = createDeepLinkController(null, () => {});
      ctrl.syncHash('scene-1');
      expect(window.location.hash).toBe('#cis-scene-1');
    });

    it('syncHash with element id', () => {
      const ctrl = createDeepLinkController('tour1', () => {});
      ctrl.syncHash('step-2');
      expect(window.location.hash).toBe('#tour1:step-2');
    });

    it('clearHash removes hash', () => {
      const ctrl = createDeepLinkController(null, () => {});
      ctrl.syncHash('test');
      expect(window.location.hash).toBe('#cis-test');
      ctrl.clearHash();
      expect(window.location.hash).toBe('');
    });

    it('hashchange triggers callback', () => {
      const onHash = vi.fn();
      const ctrl = createDeepLinkController(null, onHash);
      ctrl.attach();

      // Simulate hashchange by setting hash and dispatching event
      history.replaceState(null, '', '#cis-my-scene');
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(onHash).toHaveBeenCalledWith('my-scene');
      ctrl.detach();
    });

    it('detach stops listening to hashchange', () => {
      const onHash = vi.fn();
      const ctrl = createDeepLinkController(null, onHash);
      ctrl.attach();
      ctrl.detach();

      history.replaceState(null, '', '#cis-another');
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(onHash).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Integration tests with component
// ---------------------------------------------------------------------------

const TAG = 'cis-deeplink-test';
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
      { id: 'intro', image: 'intro.jpg', title: 'Intro' },
      { id: 'smart-tags', image: 'tags.jpg', title: 'Smart Tags' },
      { id: 'final', image: 'final.jpg', title: 'Final' },
    ],
  };
}

describe('deep-link integration', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
    history.replaceState(null, '', window.location.pathname + window.location.search);
  });

  it('sync-url updates hash on navigation', async () => {
    el = document.createElement(TAG) as CloudimageSpotlight;
    el.setAttribute('eager', '');
    el.setAttribute('sync-url', '');
    el.config = makeConfig();
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    // Initial hash should be set
    expect(window.location.hash).toBe('#cis-intro');

    el.next();
    expect(window.location.hash).toBe('#cis-smart-tags');
  });

  it('sync-url clears hash on skip', async () => {
    el = document.createElement(TAG) as CloudimageSpotlight;
    el.setAttribute('eager', '');
    el.setAttribute('sync-url', '');
    el.setAttribute('allow-skip', '');
    el.config = makeConfig();
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    expect(window.location.hash).toBe('#cis-intro');

    // Trigger skip via the close button inside annotation
    const closeBtn = el.shadowRoot!.querySelector('.cis-annotation__close') as HTMLButtonElement;
    closeBtn?.click();

    expect(window.location.hash).toBe('');
  });

  it('sync-url clears hash on complete', async () => {
    el = document.createElement(TAG) as CloudimageSpotlight;
    el.setAttribute('eager', '');
    el.setAttribute('sync-url', '');
    el.config = makeConfig();
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    // Navigate to last scene and trigger complete
    el.goTo(2);
    el.next(); // triggers cis:complete — wraps to scene 0 (no outro/intro)
    // Hash is cleared on complete, then set to scene-0 id by goTo(0)
    expect(window.location.hash).toBe('#cis-intro');
  });

  it('deep link initializes at correct scene', async () => {
    history.replaceState(null, '', '#cis-smart-tags');

    el = document.createElement(TAG) as CloudimageSpotlight;
    el.setAttribute('eager', '');
    el.config = makeConfig();
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    expect(el.currentIndex).toBe(1);
  });

  it('without sync-url, hash is not updated', async () => {
    el = document.createElement(TAG) as CloudimageSpotlight;
    el.setAttribute('eager', '');
    el.config = makeConfig();
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    el.next();
    expect(window.location.hash).toBe('');
  });
});
