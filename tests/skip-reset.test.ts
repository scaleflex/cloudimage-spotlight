import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';

const TAG = 'cis-skip-reset-test';
beforeAll(() => {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends CloudimageSpotlight {}, { extends: undefined as never });
  }
});

function makeConfig(overrides?: Partial<SpotlightConfig['settings']>): SpotlightConfig {
  return {
    version: '1.0',
    ciToken: 'demo',
    title: 'Product Tour',
    settings: {
      transition: 'fade',
      allowSkip: true,
      ...overrides,
    },
    scenes: [
      {
        id: 'step-1',
        image: 'https://example.com/1.jpg',
        title: 'Step One',
        description: 'First step.',
        regions: [{ tl_x: 0.1, tl_y: 0.1, br_x: 0.5, br_y: 0.5 }],
      },
      {
        id: 'step-2',
        image: 'https://example.com/2.jpg',
        title: 'Step Two',
      },
      {
        id: 'step-3',
        image: 'https://example.com/3.jpg',
        title: 'Step Three',
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
    const root = el.shadowRoot!.querySelector('.cis-root');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('cis-loading')).toBe(false);
  });
}

// ---------------------------------------------------------------------------
// Skip / close button reset behavior
// ---------------------------------------------------------------------------

describe('skip resets to intro or scene 0', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('dispatches cis:skip event when close button is clicked', async () => {
    const events: unknown[] = [];
    el = createElement(makeConfig());
    el.addEventListener('cis:skip', (e) => events.push((e as CustomEvent).detail));
    await mountAndWait(el);

    // Navigate to scene 1
    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));

    // Click close button
    const closeBtn = el.shadowRoot!.querySelector('.cis-annotation__close') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    closeBtn.click();

    expect(events.length).toBe(1);
    expect((events[0] as Record<string, unknown>).atScene).toBe(1);
  });

  it('shows intro screen on skip when intro is configured', async () => {
    el = createElement(makeConfig({ intro: true }));
    await mountAndWait(el);

    // Dismiss intro first
    const startBtn = el.shadowRoot!.querySelector('.cis-screen-card__btn') as HTMLButtonElement;
    startBtn.click();
    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    // Click close button
    const closeBtn = el.shadowRoot!.querySelector('.cis-annotation__close') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    closeBtn.click();

    // Should show intro again
    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-intro')).not.toBeNull();
    });
  });

  it('resets to scene 0 base image on skip when no intro configured', async () => {
    el = createElement(makeConfig());
    await mountAndWait(el);

    // Navigate to scene 1
    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));

    // Click close button
    const closeBtn = el.shadowRoot!.querySelector('.cis-annotation__close') as HTMLButtonElement;
    closeBtn.click();

    // Should show base image only (no annotation, no overlay)
    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-image--base')).not.toBeNull();
      expect(el.shadowRoot!.querySelector('.cis-annotation')).toBeNull();
    });

    // Index should be reset to 0
    expect(el.currentIndex).toBe(0);
  });

  it('pauses autoplay on skip', async () => {
    el = createElement(makeConfig());
    await mountAndWait(el);

    // Start autoplay
    el.play();
    expect(el.isPlaying).toBe(true);

    // Click close button
    const closeBtn = el.shadowRoot!.querySelector('.cis-annotation__close') as HTMLButtonElement;
    closeBtn.click();

    expect(el.isPlaying).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Play/pause button
// ---------------------------------------------------------------------------

describe('play/pause button', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('does not render play button by default', async () => {
    el = createElement(makeConfig());
    await mountAndWait(el);

    expect(el.shadowRoot!.querySelector('.cis-btn--play')).toBeNull();
  });

  it('renders play button when showPlayButton is true', async () => {
    el = createElement(makeConfig({ showPlayButton: true }));
    await mountAndWait(el);

    const btn = el.shadowRoot!.querySelector('.cis-btn--play');
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute('aria-label')).toBe('Play');
  });

  it('renders play button via show-play-button attribute', async () => {
    el = createElement(makeConfig());
    el.setAttribute('show-play-button', '');
    await mountAndWait(el);

    expect(el.shadowRoot!.querySelector('.cis-btn--play')).not.toBeNull();
  });

  it('toggles to pause icon when clicked', async () => {
    el = createElement(makeConfig({ showPlayButton: true }));
    await mountAndWait(el);

    const btn = el.shadowRoot!.querySelector('.cis-btn--play') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Play');

    btn.click();
    expect(el.isPlaying).toBe(true);
    expect(btn.getAttribute('aria-label')).toBe('Pause');
  });

  it('toggles back to play icon on second click', async () => {
    el = createElement(makeConfig({ showPlayButton: true }));
    await mountAndWait(el);

    const btn = el.shadowRoot!.querySelector('.cis-btn--play') as HTMLButtonElement;

    btn.click(); // play
    expect(el.isPlaying).toBe(true);

    btn.click(); // pause
    expect(el.isPlaying).toBe(false);
    expect(btn.getAttribute('aria-label')).toBe('Play');
  });

  it('syncs icon when play/pause called programmatically', async () => {
    el = createElement(makeConfig({ showPlayButton: true }));
    await mountAndWait(el);

    const btn = el.shadowRoot!.querySelector('.cis-btn--play') as HTMLButtonElement;

    el.play();
    expect(btn.getAttribute('aria-label')).toBe('Pause');

    el.pause();
    expect(btn.getAttribute('aria-label')).toBe('Play');
  });

  it('is cleaned up on destroy', async () => {
    el = createElement(makeConfig({ showPlayButton: true }));
    await mountAndWait(el);

    expect(el.shadowRoot!.querySelector('.cis-btn--play')).not.toBeNull();

    el.destroy();
    // Shadow DOM is cleared
    expect(el.shadowRoot!.querySelector('.cis-btn--play')).toBeNull();
  });
});
