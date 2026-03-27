import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';

const TAG = 'cis-integration-test';
beforeAll(() => {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends CloudimageSpotlight {}, { extends: undefined as never });
  }
});

function makeConfig(): SpotlightConfig {
  return {
    version: '1.0',
    ciToken: 'demo',
    title: 'Integration Tour',
    settings: {
      transition: 'fade',
      maskStyle: 'color',
    },
    scenes: [
      {
        id: 'step-1',
        image: 'https://example.com/1.jpg',
        title: 'Step One',
        description: 'First step of the tour.',
        regions: [{ tl_x: 0.1, tl_y: 0.1, br_x: 0.5, br_y: 0.5 }],
      },
      {
        id: 'step-2',
        image: 'https://example.com/2.jpg',
        title: 'Step Two',
        description: 'Second step with zoom.',
        regions: [{ tl_x: 0.3, tl_y: 0.2, br_x: 0.8, br_y: 0.7 }],
        zoom: true,
        cta: { label: 'Learn more', href: 'https://example.com' },
      },
      {
        id: 'step-3',
        image: 'https://example.com/3.jpg',
        title: 'Final Step',
        description: 'Wrapping up the tour.',
      },
    ],
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
// Full lifecycle flow
// ---------------------------------------------------------------------------

describe('integration: full lifecycle', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('load → render → navigate → events → complete → destroy', async () => {
    const events: string[] = [];
    el = createElement(makeConfig());

    el.addEventListener('cis:ready', () => events.push('ready'));
    el.addEventListener('cis:scene-change', () => events.push('scene-change'));
    el.addEventListener('cis:complete', () => events.push('complete'));

    await mountAndWait(el);

    // Ready event fired
    expect(events).toContain('ready');

    // Scene 0 rendered
    expect(el.currentIndex).toBe(0);
    expect(el.totalScenes).toBe(3);

    // Shadow DOM has expected structure
    expect(el.shadowRoot!.querySelector('.cis-root')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.cis-stage')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();

    // Scene 0 has mask + regions
    expect(el.shadowRoot!.querySelector('.cis-mask')).not.toBeNull();
    expect(el.shadowRoot!.querySelectorAll('.cis-region-highlight').length).toBe(1);
    expect(el.shadowRoot!.querySelectorAll('.cis-badge').length).toBe(1);

    // Navigate forward
    el.next();
    expect(el.currentIndex).toBe(1);
    expect(events.filter((e) => e === 'scene-change').length).toBe(1);

    // Scene 1 has zoom — zoomed image is created after base image loads
    const baseImg = el.shadowRoot!.querySelector('.cis-image--base') as HTMLImageElement;
    Object.defineProperty(baseImg, 'naturalWidth', { value: 1920, configurable: true });
    Object.defineProperty(baseImg, 'naturalHeight', { value: 1080, configurable: true });
    baseImg.dispatchEvent(new Event('load'));
    const zoomedImg = el.shadowRoot!.querySelector('.cis-image--zoomed') as HTMLImageElement;
    expect(zoomedImg).not.toBeNull();

    // Complete zoom cycle: animation end + CDN image load → finishZoom appends annotation
    baseImg.dispatchEvent(new Event('transitionend'));
    Object.defineProperty(zoomedImg, 'naturalWidth', { value: 960, configurable: true });
    Object.defineProperty(zoomedImg, 'naturalHeight', { value: 540, configurable: true });
    zoomedImg.dispatchEvent(new Event('load'));

    // Scene 1 has CTA (annotation appended by finishZoom)
    const cta = el.shadowRoot!.querySelector('.cis-cta');
    expect(cta).not.toBeNull();
    expect(cta!.textContent).toBe('Learn more');

    // Navigate to last scene
    el.next();
    expect(el.currentIndex).toBe(2);

    // Trigger complete
    el.next();
    expect(events).toContain('complete');

    // Destroy
    el.destroy();
    expect(el.shadowRoot!.childNodes.length).toBe(0);
  });

  it('skip flow dispatches event and allows further calls', async () => {
    const skipHandler = vi.fn();
    el = createElement(makeConfig());
    el.setAttribute('allow-skip', '');
    el.addEventListener('cis:skip', skipHandler);

    await mountAndWait(el);

    // Click close button (skip) inside annotation
    const closeBtn = el.shadowRoot!.querySelector('.cis-annotation__close') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    closeBtn.click();

    expect(skipHandler).toHaveBeenCalledTimes(1);
    expect(skipHandler.mock.calls[0][0].detail.atScene).toBe(0);
  });

  it('reload resets the tour', async () => {
    el = createElement(makeConfig());
    await mountAndWait(el);

    el.goTo(2);
    expect(el.currentIndex).toBe(2);

    await el.reload(makeConfig());
    expect(el.currentIndex).toBe(0);
    expect(el.totalScenes).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Multiple instances
// ---------------------------------------------------------------------------

describe('integration: multiple instances', () => {
  it('two instances render independently', async () => {
    const el1 = createElement(makeConfig());
    const el2 = createElement(makeConfig());

    await mountAndWait(el1);
    await mountAndWait(el2);

    // Both render
    expect(el1.shadowRoot!.querySelector('.cis-root')).not.toBeNull();
    expect(el2.shadowRoot!.querySelector('.cis-root')).not.toBeNull();

    // Navigate independently
    el1.next();
    expect(el1.currentIndex).toBe(1);
    expect(el2.currentIndex).toBe(0);

    el1.destroy();
    el2.destroy();
    el1.remove();
    el2.remove();
  });

  it('instances have unique SVG mask IDs', async () => {
    const el1 = createElement(makeConfig());
    const el2 = createElement(makeConfig());

    await mountAndWait(el1);
    await mountAndWait(el2);

    expect(el1.instanceId).not.toBe(el2.instanceId);

    el1.destroy();
    el2.destroy();
    el1.remove();
    el2.remove();
  });
});

// ---------------------------------------------------------------------------
// ARIA structure
// ---------------------------------------------------------------------------

describe('integration: accessibility', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('has correct ARIA structure after full init', async () => {
    el = createElement(makeConfig());
    await mountAndWait(el);

    const root = el.shadowRoot!.querySelector('.cis-root')!;
    expect(root.getAttribute('role')).toBe('region');
    expect(root.getAttribute('aria-roledescription')).toBe('Interactive tour');
    expect(root.getAttribute('aria-label')).toBe('Integration Tour');

    const progress = el.shadowRoot!.querySelector('.cis-annotation__progress')!;
    expect(progress.getAttribute('aria-live')).toBe('polite');
    expect(progress.textContent).toBe('1 / 3');

    const nav = el.shadowRoot!.querySelector('.cis-annotation__nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Experience navigation');
  });
});
