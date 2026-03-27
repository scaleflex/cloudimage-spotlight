import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { useRef, useEffect } from 'react';
import { CloudimageSpotlightReact } from '../src/react';
import type { CloudimageSpotlightElement, SpotlightConfig } from '../src/types';

afterEach(cleanup);

const basicConfig: SpotlightConfig = {
  version: '1.0',
  ciToken: 'demo',
  title: 'Test Tour',
  scenes: [
    { id: 's0', image: 'a.jpg', title: 'Scene A' },
    { id: 's1', image: 'b.jpg', title: 'Scene B' },
    { id: 's2', image: 'c.jpg', title: 'Scene C' },
  ],
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('CloudimageSpotlightReact', () => {
  it('renders a <cloudimage-spotlight> element', () => {
    const { container } = render(
      <CloudimageSpotlightReact config={basicConfig} eager />,
    );

    const el = container.querySelector('cloudimage-spotlight');
    expect(el).not.toBeNull();
  });

  it('passes theme attribute', () => {
    const { container } = render(
      <CloudimageSpotlightReact config={basicConfig} theme="light" eager />,
    );

    const el = container.querySelector('cloudimage-spotlight');
    expect(el!.getAttribute('theme')).toBe('light');
  });

  it('passes boolean attributes', () => {
    const { container } = render(
      <CloudimageSpotlightReact
        config={basicConfig}
        eager
        autoplay
        syncUrl
      />,
    );

    const el = container.querySelector('cloudimage-spotlight');
    expect(el!.hasAttribute('eager')).toBe(true);
    expect(el!.hasAttribute('autoplay')).toBe(true);
    expect(el!.hasAttribute('sync-url')).toBe(true);
  });

  it('passes className and style', () => {
    const { container } = render(
      <CloudimageSpotlightReact
        config={basicConfig}
        eager
        className="my-tour"
        style={{ maxWidth: '800px' }}
      />,
    );

    const el = container.querySelector('cloudimage-spotlight');
    expect(el!.classList.contains('my-tour')).toBe(true);
    expect(el!.style.maxWidth).toBe('800px');
  });

  it('passes id attribute', () => {
    const { container } = render(
      <CloudimageSpotlightReact config={basicConfig} eager id="tour-1" />,
    );

    const el = container.querySelector('cloudimage-spotlight');
    expect(el!.id).toBe('tour-1');
  });

  it('does not pass config as attribute when config is an object', () => {
    const { container } = render(
      <CloudimageSpotlightReact config={basicConfig} eager />,
    );

    const el = container.querySelector('cloudimage-spotlight');
    // Object config should be set as JS property, not attribute
    expect(el!.hasAttribute('config')).toBe(false);
  });

  it('passes config as attribute when config is a string URL', () => {
    const { container } = render(
      <CloudimageSpotlightReact config="https://example.com/config.json" eager />,
    );

    const el = container.querySelector('cloudimage-spotlight');
    expect(el!.getAttribute('config')).toBe('https://example.com/config.json');
  });
});

// ---------------------------------------------------------------------------
// Ref API
// ---------------------------------------------------------------------------

describe('ref API', () => {
  it('exposes the underlying element via ref', async () => {
    // Pre-register the element so it's available synchronously
    const { CloudimageSpotlight } = await import('../src/spotlight-element');
    if (!customElements.get('cloudimage-spotlight')) {
      customElements.define('cloudimage-spotlight', CloudimageSpotlight);
    }

    let refValue: CloudimageSpotlightElement | null = null;

    function TestComponent() {
      const ref = useRef<CloudimageSpotlightElement>(null);
      useEffect(() => {
        refValue = ref.current;
      }, []);
      return <CloudimageSpotlightReact ref={ref} config={basicConfig} eager />;
    }

    render(<TestComponent />);

    expect(refValue).not.toBeNull();
    expect(typeof refValue!.next).toBe('function');
    expect(typeof refValue!.prev).toBe('function');
    expect(typeof refValue!.goTo).toBe('function');
    expect(typeof refValue!.goToId).toBe('function');
    expect(typeof refValue!.play).toBe('function');
    expect(typeof refValue!.pause).toBe('function');
    expect(typeof refValue!.destroy).toBe('function');
    expect(typeof refValue!.reload).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Event callbacks
// ---------------------------------------------------------------------------

describe('event callbacks', () => {
  it('calls onReady when cis:ready fires', async () => {
    const onReady = vi.fn();
    const { container } = render(
      <CloudimageSpotlightReact config={basicConfig} eager onReady={onReady} />,
    );

    const el = container.querySelector('cloudimage-spotlight')!;

    // Wait for element to initialize
    await vi.waitFor(() => {
      expect(el.shadowRoot?.querySelector('.cis-stage')).not.toBeNull();
    });

    // Fire a synthetic cis:ready event
    act(() => {
      el.dispatchEvent(new CustomEvent('cis:ready', {
        detail: { totalScenes: 3, config: basicConfig },
        bubbles: true,
        composed: true,
      }));
    });

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledWith(
      expect.objectContaining({ totalScenes: 3 }),
    );
  });

  it('calls onError when cis:error fires', async () => {
    const onError = vi.fn();
    const { container } = render(
      <CloudimageSpotlightReact config={basicConfig} eager onError={onError} />,
    );

    const el = container.querySelector('cloudimage-spotlight')!;

    await vi.waitFor(() => {
      expect(el.shadowRoot?.querySelector('.cis-stage')).not.toBeNull();
    });

    act(() => {
      el.dispatchEvent(new CustomEvent('cis:error', {
        detail: { message: 'test error', code: 'FETCH_FAILED' },
        bubbles: true,
        composed: true,
      }));
    });

    expect(onError).toHaveBeenCalled();
    // Check the last call has our error detail
    const lastCall = onError.mock.calls[onError.mock.calls.length - 1][0];
    expect(lastCall.code).toBe('FETCH_FAILED');
  });
});

// ---------------------------------------------------------------------------
// SSR safety
// ---------------------------------------------------------------------------

describe('SSR safety', () => {
  it('module can be imported without throwing', async () => {
    // This test verifies that importing the module doesn't throw
    // (would fail if it tried to access window/document at module scope)
    const mod = await import('../src/react');
    expect(mod.CloudimageSpotlightReact).toBeDefined();
  });
});
