import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';

// Register once for all tests
beforeAll(() => {
  if (!customElements.get('cloudimage-spotlight')) {
    customElements.define('cloudimage-spotlight', CloudimageSpotlight);
  }
});

function createElement(): CloudimageSpotlight {
  return document.createElement('cloudimage-spotlight') as CloudimageSpotlight;
}

describe('CloudimageSpotlight element', () => {
  let el: CloudimageSpotlight;

  beforeEach(() => {
    el = createElement();
  });

  afterEach(() => {
    el.destroy();
    el.remove();
  });

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  describe('registration', () => {
    it('is registered as a custom element', () => {
      expect(customElements.get('cloudimage-spotlight')).toBe(CloudimageSpotlight);
    });

    it('has all 13 observed attributes', () => {
      expect(CloudimageSpotlight.observedAttributes).toHaveLength(13);
      expect(CloudimageSpotlight.observedAttributes).toContain('config');
      expect(CloudimageSpotlight.observedAttributes).toContain('eager');
      expect(CloudimageSpotlight.observedAttributes).toContain('sync-url');
      expect(CloudimageSpotlight.observedAttributes).toContain('show-badges');
      expect(CloudimageSpotlight.observedAttributes).toContain('show-play-button');
    });
  });

  // ---------------------------------------------------------------------------
  // connectedCallback
  // ---------------------------------------------------------------------------

  describe('connectedCallback', () => {
    it('attaches a shadow root', () => {
      document.body.appendChild(el);
      expect(el.shadowRoot).not.toBeNull();
      expect(el.shadowRoot!.mode).toBe('open');
    });

    it('applies constructable stylesheet', () => {
      document.body.appendChild(el);
      expect(el.shadowRoot!.adoptedStyleSheets).toHaveLength(1);
    });

    it('shares the same stylesheet across instances', () => {
      const el2 = createElement();
      document.body.appendChild(el);
      document.body.appendChild(el2);
      expect(el.shadowRoot!.adoptedStyleSheets[0]).toBe(
        el2.shadowRoot!.adoptedStyleSheets[0],
      );
      el2.destroy();
      el2.remove();
    });

    it('creates .cis-root with role="region"', () => {
      document.body.appendChild(el);
      const root = el.shadowRoot!.querySelector('.cis-root');
      expect(root).not.toBeNull();
      expect(root!.getAttribute('role')).toBe('region');
      expect(root!.getAttribute('aria-roledescription')).toBe('Interactive tour');
    });

    it('shows skeleton in loading state', () => {
      document.body.appendChild(el);
      const root = el.shadowRoot!.querySelector('.cis-root');
      expect(root!.classList.contains('cis-loading')).toBe(true);
      const skeleton = el.shadowRoot!.querySelector('.cis-skeleton');
      expect(skeleton).not.toBeNull();
    });

    it('creates a .cis-stage container', () => {
      document.body.appendChild(el);
      expect(el.shadowRoot!.querySelector('.cis-stage')).not.toBeNull();
    });

    it('sets tabindex="0" if not already set', () => {
      document.body.appendChild(el);
      expect(el.getAttribute('tabindex')).toBe('0');
    });

    it('preserves existing tabindex', () => {
      el.setAttribute('tabindex', '-1');
      document.body.appendChild(el);
      expect(el.getAttribute('tabindex')).toBe('-1');
    });

    it('includes a slot for inline JSON', () => {
      document.body.appendChild(el);
      const slot = el.shadowRoot!.querySelector('slot');
      expect(slot).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Config loading
  // ---------------------------------------------------------------------------

  describe('config loading', () => {
    it('fetches config from URL attribute', async () => {
      const mockConfig = {
        version: '1.0',
        ciToken: 'demo',
        scenes: [{ id: 'intro', image: 'https://example.com/img.jpg' }],
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockConfig), { status: 200 }),
      );

      el.setAttribute('config', 'https://cdn.example.com/config.json');
      el.setAttribute('eager', '');
      document.body.appendChild(el);

      // Wait for async config load
      await vi.waitFor(() => {
        const root = el.shadowRoot!.querySelector('.cis-root');
        expect(root!.classList.contains('cis-loading')).toBe(false);
      });

      expect(el.totalScenes).toBe(1);
      vi.restoreAllMocks();
    });

    it('parses inline JSON config', async () => {
      const script = document.createElement('script');
      script.type = 'application/json';
      script.textContent = JSON.stringify({
        version: '1.0',
        ciToken: 'demo',
        scenes: [{ id: 's1', image: 'img.jpg' }],
      });
      el.appendChild(script);
      el.setAttribute('eager', '');
      document.body.appendChild(el);

      await vi.waitFor(() => {
        expect(el.totalScenes).toBe(1);
      });
    });

    it('JS property takes priority over inline JSON', async () => {
      const script = document.createElement('script');
      script.type = 'application/json';
      script.textContent = JSON.stringify({
        version: '1.0',
        ciToken: 'inline',
        scenes: [{ id: 'inline', image: 'a' }],
      });
      el.appendChild(script);

      el.config = {
        version: '1.0',
        ciToken: 'property',
        scenes: [
          { id: 'prop1', image: 'b' },
          { id: 'prop2', image: 'c' },
        ],
      };
      el.setAttribute('eager', '');
      document.body.appendChild(el);

      await vi.waitFor(() => {
        expect(el.totalScenes).toBe(2);
      });
    });

    it('dispatches cis:error on invalid inline JSON', async () => {
      const script = document.createElement('script');
      script.type = 'application/json';
      script.textContent = 'not valid json{{{';
      el.appendChild(script);
      el.setAttribute('eager', '');

      const errorHandler = vi.fn();
      el.addEventListener('cis:error', errorHandler);

      document.body.appendChild(el);

      await vi.waitFor(() => {
        expect(errorHandler).toHaveBeenCalled();
      });

      const detail = errorHandler.mock.calls[0][0].detail;
      expect(detail.code).toBe('INVALID_JSON');
    });

    it('dispatches cis:error when no config provided', async () => {
      el.setAttribute('eager', '');
      const errorHandler = vi.fn();
      el.addEventListener('cis:error', errorHandler);

      document.body.appendChild(el);

      await vi.waitFor(() => {
        expect(errorHandler).toHaveBeenCalled();
      });

      expect(errorHandler.mock.calls[0][0].detail.code).toBe('INVALID_JSON');
    });

    it('renders error state on failure', async () => {
      el.setAttribute('eager', '');
      document.body.appendChild(el);

      await vi.waitFor(() => {
        const errorEl = el.shadowRoot!.querySelector('.cis-annotation__title');
        expect(errorEl).not.toBeNull();
        expect(errorEl!.textContent).toContain('Failed to load');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Instance ID
  // ---------------------------------------------------------------------------

  describe('instance ID', () => {
    it('has a unique instance ID', () => {
      const el2 = createElement();
      expect(el.instanceId).not.toBe(el2.instanceId);
      expect(el.instanceId).toMatch(/^cis-\d+$/);
    });
  });

  // ---------------------------------------------------------------------------
  // disconnectedCallback / reconnect
  // ---------------------------------------------------------------------------

  describe('disconnect and reconnect', () => {
    it('preserves state on re-mount', async () => {
      el.config = {
        version: '1.0',
        ciToken: 'demo',
        scenes: [{ id: 's1', image: 'a' }, { id: 's2', image: 'b' }],
      };
      el.setAttribute('eager', '');
      document.body.appendChild(el);

      await vi.waitFor(() => {
        expect(el.totalScenes).toBe(2);
      });

      // Disconnect
      el.remove();

      // Reconnect
      document.body.appendChild(el);

      // Shadow DOM should still exist
      expect(el.shadowRoot!.querySelector('.cis-root')).not.toBeNull();
      expect(el.totalScenes).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // destroy
  // ---------------------------------------------------------------------------

  describe('destroy', () => {
    it('clears shadow DOM', () => {
      document.body.appendChild(el);
      el.destroy();
      expect(el.shadowRoot!.children).toHaveLength(0);
    });

    it('makes navigation methods no-ops', () => {
      document.body.appendChild(el);
      el.destroy();
      // Should not throw
      el.next();
      el.prev();
      el.goTo(0);
      el.goToId('x');
      el.play();
      el.pause();
    });

    it('is idempotent', () => {
      document.body.appendChild(el);
      el.destroy();
      el.destroy(); // Should not throw
    });

    it('connectedCallback is no-op after destroy', () => {
      document.body.appendChild(el);
      el.destroy();
      el.remove();
      document.body.appendChild(el);
      // Shadow root exists but should be empty (not re-initialized)
      expect(el.shadowRoot!.querySelector('.cis-root')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // reload
  // ---------------------------------------------------------------------------

  describe('reload', () => {
    it('applies new config and resets to scene 0', async () => {
      el.setAttribute('eager', '');
      document.body.appendChild(el);

      await el.reload({
        version: '1.0',
        ciToken: 'new',
        scenes: [
          { id: 'a', image: 'x' },
          { id: 'b', image: 'y' },
          { id: 'c', image: 'z' },
        ],
      });

      expect(el.totalScenes).toBe(3);
      expect(el.currentIndex).toBe(0);
    });

    it('rejects with CISError on invalid config', async () => {
      el.setAttribute('eager', '');
      document.body.appendChild(el);

      await expect(
        el.reload({ version: '1.0', scenes: [] } as unknown as SpotlightConfig),
      ).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // strings property
  // ---------------------------------------------------------------------------

  describe('strings property', () => {
    it('defaults to empty overrides', () => {
      expect(el.strings).toEqual({});
    });

    it('accepts partial overrides', () => {
      el.strings = { prev: 'Précédent' };
      expect(el.strings).toEqual({ prev: 'Précédent' });
    });
  });

  // ---------------------------------------------------------------------------
  // Config → CSS custom property bridging (aspectRatio)
  // ---------------------------------------------------------------------------

  describe('config CSS bridging', () => {
    function makeConfig(overrides?: Partial<SpotlightConfig>): SpotlightConfig {
      return {
        version: '1.0',
        ciToken: 'demo',
        scenes: [{ id: 's1', image: 'a.jpg', title: 'Scene 1' }],
        ...overrides,
      };
    }

    async function mountEager(
      element: CloudimageSpotlight,
      config: SpotlightConfig,
    ): Promise<void> {
      element.setAttribute('eager', '');
      element.config = config;
      document.body.appendChild(element);
      await vi.waitFor(() => {
        expect(element.shadowRoot!.querySelector('.cis-root')).not.toBeNull();
      });
    }

    it('sets --cis-aspect-ratio from config.aspectRatio', async () => {
      await mountEager(el, makeConfig({ aspectRatio: '16:9' }));
      expect(el.style.getPropertyValue('--cis-aspect-ratio')).toBe('16 / 9');
    });

    it('converts colon to CSS slash syntax', async () => {
      await mountEager(el, makeConfig({ aspectRatio: '4:3' }));
      expect(el.style.getPropertyValue('--cis-aspect-ratio')).toBe('4 / 3');
    });

    it('handles 1:1 aspect ratio', async () => {
      await mountEager(el, makeConfig({ aspectRatio: '1:1' }));
      expect(el.style.getPropertyValue('--cis-aspect-ratio')).toBe('1 / 1');
    });

    it('does not set --cis-aspect-ratio when absent', async () => {
      await mountEager(el, makeConfig());
      expect(el.style.getPropertyValue('--cis-aspect-ratio')).toBe('');
    });

    it('clears --cis-aspect-ratio on reload without aspectRatio', async () => {
      await mountEager(el, makeConfig({ aspectRatio: '16:9' }));
      expect(el.style.getPropertyValue('--cis-aspect-ratio')).toBe('16 / 9');

      await el.reload(makeConfig());
      expect(el.style.getPropertyValue('--cis-aspect-ratio')).toBe('');
    });

    it('updates --cis-aspect-ratio on reload with new value', async () => {
      await mountEager(el, makeConfig({ aspectRatio: '16:9' }));
      expect(el.style.getPropertyValue('--cis-aspect-ratio')).toBe('16 / 9');

      await el.reload(makeConfig({ aspectRatio: '4:3' }));
      expect(el.style.getPropertyValue('--cis-aspect-ratio')).toBe('4 / 3');
    });
  });
});
