import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';
import { applyStagger, clearStagger } from '../src/scene-renderer';

const TAG = 'cis-intro-stagger-test';
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
  // Wait for config to be processed and DOM built
  await vi.waitFor(() => {
    const root = el.shadowRoot!.querySelector('.cis-root');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('cis-loading')).toBe(false);
  });
}

// ---------------------------------------------------------------------------
// Staggered entry animation
// ---------------------------------------------------------------------------

describe('staggered scene entry', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('applies stagger classes after image loads', async () => {
    el = createElement(makeConfig());
    await mountAndWait(el);

    const stage = el.shadowRoot!.querySelector('.cis-stage')!;
    // Before image load, stagger hiding class is already applied by renderScene
    const imgBefore = stage.querySelector('.cis-image') as HTMLImageElement;
    expect(imgBefore).not.toBeNull();
    expect(stage.classList.contains('cis-scene-stagger')).toBe(true);
    expect(stage.classList.contains('cis-scene-stagger-active')).toBe(false);

    // Trigger image load — stagger-active should be applied (via RAF)
    imgBefore.dispatchEvent(new Event('load'));

    // stagger-active is applied via requestAnimationFrame, wait for it
    await vi.waitFor(() => {
      expect(stage.classList.contains('cis-scene-stagger')).toBe(true);
      expect(stage.classList.contains('cis-scene-stagger-active')).toBe(true);
    });
  });

  it('does not apply stagger classes when staggerEntry is false', async () => {
    el = createElement(makeConfig({ staggerEntry: false }));
    await mountAndWait(el);

    const stage = el.shadowRoot!.querySelector('.cis-stage')!;
    const img = stage.querySelector('.cis-image') as HTMLImageElement;
    img?.dispatchEvent(new Event('load'));

    expect(stage.classList.contains('cis-scene-stagger')).toBe(false);
    expect(stage.classList.contains('cis-scene-stagger-active')).toBe(false);
  });

  it('clears stagger classes when rendering a new scene', async () => {
    el = createElement(makeConfig());
    await mountAndWait(el);

    const stage = el.shadowRoot!.querySelector('.cis-stage')!;
    // Trigger image load to get stagger
    const img = stage.querySelector('.cis-image') as HTMLImageElement;
    img.dispatchEvent(new Event('load'));
    expect(stage.classList.contains('cis-scene-stagger')).toBe(true);

    // Navigate to next scene — stagger hiding class is applied immediately
    // by renderScene to prevent flash, but stagger-active is NOT yet applied
    // (waits for image load).
    el.next();
    await vi.waitFor(() => {
      const newImg = stage.querySelector('.cis-image') as HTMLImageElement;
      if (newImg && newImg.src.includes('2.jpg')) {
        // Overlays hidden from the start (stagger applied by renderScene)
        expect(stage.classList.contains('cis-scene-stagger')).toBe(true);
        // Animation not yet triggered (image hasn't loaded)
        expect(stage.classList.contains('cis-scene-stagger-active')).toBe(false);
      }
    });
  });
});

describe('applyStagger / clearStagger helpers', () => {
  it('applyStagger adds cis-scene-stagger class', () => {
    const div = document.createElement('div');
    applyStagger(div);
    expect(div.classList.contains('cis-scene-stagger')).toBe(true);
  });

  it('clearStagger removes both stagger classes', () => {
    const div = document.createElement('div');
    div.classList.add('cis-scene-stagger', 'cis-scene-stagger-active');
    clearStagger(div);
    expect(div.classList.contains('cis-scene-stagger')).toBe(false);
    expect(div.classList.contains('cis-scene-stagger-active')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Intro / welcome screen
// ---------------------------------------------------------------------------

describe('intro screen', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('shows intro overlay when intro: true', async () => {
    el = createElement(makeConfig({ intro: true }));
    await mountAndWait(el);

    const intro = el.shadowRoot!.querySelector('.cis-intro');
    expect(intro).not.toBeNull();

    const card = intro!.querySelector('.cis-screen-card');
    expect(card).not.toBeNull();

    const title = card!.querySelector('.cis-screen-card__title');
    expect(title!.textContent).toContain('Product Tour');

    const startBtn = card!.querySelector('.cis-screen-card__btn');
    expect(startBtn).not.toBeNull();
    expect(startBtn!.textContent).toBe('Start');
  });

  it('shows custom intro title and description', async () => {
    el = createElement(makeConfig({
      intro: {
        title: 'Welcome!',
        description: 'Take a quick tour.',
        startLabel: 'Begin',
      },
    }));
    await mountAndWait(el);

    const card = el.shadowRoot!.querySelector('.cis-screen-card')!;
    expect(card.querySelector('.cis-screen-card__title')!.textContent).toBe('Welcome!');
    expect(card.querySelector('.cis-screen-card__description')!.textContent).toBe('Take a quick tour.');
    expect(card.querySelector('.cis-screen-card__btn')!.textContent).toBe('Begin');
  });

  it('shows clean image without overlays during intro', async () => {
    el = createElement(makeConfig({ intro: true }));
    await mountAndWait(el);

    const stage = el.shadowRoot!.querySelector('.cis-stage')!;
    // Should have an image but no mask, no badges, no annotation
    expect(stage.querySelector('.cis-image')).not.toBeNull();
    expect(stage.querySelector('.cis-mask')).toBeNull();
    expect(stage.querySelector('.cis-badge')).toBeNull();
    expect(stage.querySelector('.cis-annotation')).toBeNull();
  });

  it('hides annotation during intro', async () => {
    el = createElement(makeConfig({ intro: true }));
    await mountAndWait(el);

    const annotation = el.shadowRoot!.querySelector('.cis-annotation');
    expect(annotation).toBeNull();
  });

  it('blocks navigation during intro', async () => {
    el = createElement(makeConfig({ intro: true }));
    await mountAndWait(el);

    expect(el.currentIndex).toBe(0);
    el.next();
    expect(el.currentIndex).toBe(0);
    el.goTo(1);
    expect(el.currentIndex).toBe(0);
  });

  it('dismisses intro on start button click', async () => {
    el = createElement(makeConfig({ intro: true }));
    await mountAndWait(el);

    const startBtn = el.shadowRoot!.querySelector('.cis-screen-card__btn') as HTMLButtonElement;
    startBtn.click();

    // After dismiss, controls should appear and intro should fade out
    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    // The intro should have the hidden class
    const intro = el.shadowRoot!.querySelector('.cis-intro');
    if (intro) {
      expect(intro.classList.contains('cis-intro--hidden')).toBe(true);
    }

    // Stage should now have full scene content (mask, annotation, etc.)
    const stage = el.shadowRoot!.querySelector('.cis-stage')!;
    expect(stage.querySelector('.cis-overlay-wrapper')).not.toBeNull();
  });

  it('dispatches cis:region-enter after intro dismiss', async () => {
    const events: string[] = [];
    el = createElement(makeConfig({ intro: true }));
    el.addEventListener('cis:region-enter', () => events.push('region-enter'));
    await mountAndWait(el);

    // During intro, no region-enter should have fired
    expect(events).not.toContain('region-enter');

    // Dismiss intro
    const startBtn = el.shadowRoot!.querySelector('.cis-screen-card__btn') as HTMLButtonElement;
    startBtn.click();

    await vi.waitFor(() => {
      expect(events).toContain('region-enter');
    });
  });

  it('skips intro when autoplay is enabled', async () => {
    el = createElement(makeConfig({ intro: true, autoplay: true }));
    await mountAndWait(el);

    const intro = el.shadowRoot!.querySelector('.cis-intro');
    expect(intro).toBeNull();

    // Annotation should be visible
    expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
  });

  it('does not show intro by default', async () => {
    el = createElement(makeConfig());
    await mountAndWait(el);

    const intro = el.shadowRoot!.querySelector('.cis-intro');
    expect(intro).toBeNull();
  });

  it('fires cis:ready even during intro', async () => {
    const events: string[] = [];
    el = createElement(makeConfig({ intro: true }));
    el.addEventListener('cis:ready', () => events.push('ready'));
    await mountAndWait(el);

    expect(events).toContain('ready');
  });

  it('dismisses intro on Escape key', async () => {
    el = createElement(makeConfig({ intro: true }));
    await mountAndWait(el);

    expect(el.shadowRoot!.querySelector('.cis-intro')).not.toBeNull();

    // Press Escape
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    // After dismiss, controls should appear
    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-annotation')).not.toBeNull();
    });

    // Intro should be hidden
    const intro = el.shadowRoot!.querySelector('.cis-intro');
    if (intro) {
      expect(intro.classList.contains('cis-intro--hidden')).toBe(true);
    }
  });

  it('cleans up intro on destroy', async () => {
    el = createElement(makeConfig({ intro: true }));
    await mountAndWait(el);

    expect(el.shadowRoot!.querySelector('.cis-intro')).not.toBeNull();

    el.destroy();

    // Shadow DOM is cleared
    expect(el.shadowRoot!.querySelector('.cis-intro')).toBeNull();
  });

  it('has role="dialog" and aria-label on intro overlay', async () => {
    el = createElement(makeConfig({ intro: true }));
    await mountAndWait(el);

    const intro = el.shadowRoot!.querySelector('.cis-intro')!;
    expect(intro.getAttribute('role')).toBe('dialog');
    expect(intro.getAttribute('aria-modal')).toBe('true');
    expect(intro.getAttribute('aria-label')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Outro / completion screen
// ---------------------------------------------------------------------------

describe('outro screen', () => {
  let el: CloudimageSpotlight;

  afterEach(() => {
    el?.destroy();
    el?.remove();
  });

  it('shows outro overlay when completing the tour with outro: true', async () => {
    el = createElement(makeConfig({ outro: true }));
    await mountAndWait(el);

    // Navigate to last scene
    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));

    // Trigger complete (next on last scene)
    el.next();

    await vi.waitFor(() => {
      const outro = el.shadowRoot!.querySelector('.cis-outro');
      expect(outro).not.toBeNull();
    });

    const card = el.shadowRoot!.querySelector('.cis-outro .cis-screen-card')!;
    expect(card.querySelector('.cis-screen-card__title')!.textContent).toBe('Tour complete');
    expect(card.querySelector('.cis-screen-card__btn')!.textContent).toBe('Watch again');
  });

  it('shows custom outro title and description', async () => {
    el = createElement(makeConfig({
      outro: {
        title: 'All done!',
        description: 'You completed the tour.',
        restartLabel: 'Start over',
      },
    }));
    await mountAndWait(el);

    el.next(); // go to last scene
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next(); // trigger complete

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    const card = el.shadowRoot!.querySelector('.cis-outro .cis-screen-card')!;
    expect(card.querySelector('.cis-screen-card__title')!.textContent).toBe('All done!');
    expect(card.querySelector('.cis-screen-card__description')!.textContent).toBe('You completed the tour.');
    expect(card.querySelector('.cis-screen-card__btn')!.textContent).toBe('Start over');
  });

  it('does not show outro by default', async () => {
    el = createElement(makeConfig());
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next(); // trigger complete

    // Small delay to ensure no outro appears
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.cis-outro')).toBeNull();
  });

  it('restarts tour on restart button click', async () => {
    el = createElement(makeConfig({ outro: true }));
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next(); // trigger complete

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    const restartBtn = el.shadowRoot!.querySelector('.cis-outro .cis-screen-card__btn') as HTMLButtonElement;
    restartBtn.click();

    await vi.waitFor(() => {
      expect(el.currentIndex).toBe(0);
    });
  });

  it('restarts tour on Escape key', async () => {
    el = createElement(makeConfig({ outro: true }));
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next();

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    await vi.waitFor(() => {
      expect(el.currentIndex).toBe(0);
    });
  });

  it('blocks next/prev during outro', async () => {
    el = createElement(makeConfig({ outro: true }));
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next(); // trigger complete + outro

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    // next and prev should be no-ops
    el.next();
    el.prev();
    expect(el.currentIndex).toBe(1);
  });

  it('dispatches cis:complete before showing outro', async () => {
    const events: string[] = [];
    el = createElement(makeConfig({ outro: true }));
    el.addEventListener('cis:complete', () => events.push('complete'));
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next();

    await vi.waitFor(() => {
      expect(events).toContain('complete');
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });
  });

  it('cleans up outro on destroy', async () => {
    el = createElement(makeConfig({ outro: true }));
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next();

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    el.destroy();
    expect(el.shadowRoot!.querySelector('.cis-outro')).toBeNull();
  });

  it('renders scene grid when showSceneGrid is true', async () => {
    el = createElement(makeConfig({
      outro: { showSceneGrid: true },
    }));
    await mountAndWait(el);

    // Navigate to end
    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next();

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    const grid = el.shadowRoot!.querySelector('.cis-outro-grid')!;
    expect(grid).not.toBeNull();
    expect(grid.getAttribute('role')).toBe('list');

    const items = grid.querySelectorAll('.cis-outro-grid__item');
    expect(items.length).toBe(2); // 2 scenes

    // Each item has a thumbnail and label
    items.forEach((item) => {
      expect(item.querySelector('.cis-outro-grid__thumb')).not.toBeNull();
      expect(item.querySelector('.cis-outro-grid__label')).not.toBeNull();
    });

    // Labels match scene titles
    expect(items[0].querySelector('.cis-outro-grid__label')!.textContent).toBe('Step One');
    expect(items[1].querySelector('.cis-outro-grid__label')!.textContent).toBe('Step Two');
  });

  it('navigates to scene when grid item is clicked', async () => {
    el = createElement(makeConfig({
      outro: { showSceneGrid: true },
    }));
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next();

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    // Click the first grid item
    const items = el.shadowRoot!.querySelectorAll('.cis-outro-grid__item');
    (items[0] as HTMLButtonElement).click();

    await vi.waitFor(() => {
      expect(el.currentIndex).toBe(0);
      // Outro should be cleared
      expect(el.shadowRoot!.querySelector('.cis-outro')).toBeNull();
    });
  });

  it('does not render grid when showSceneGrid is false', async () => {
    el = createElement(makeConfig({
      outro: { title: 'Done' },
    }));
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next();

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    expect(el.shadowRoot!.querySelector('.cis-outro-grid')).toBeNull();
  });

  it('sets grid columns via sceneGridColumns', async () => {
    el = createElement(makeConfig({
      outro: { showSceneGrid: true, sceneGridColumns: 4 },
    }));
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next();

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    const grid = el.shadowRoot!.querySelector('.cis-outro-grid') as HTMLElement;
    expect(grid.style.getPropertyValue('--cis-outro-grid-cols')).toBe('4');
  });

  it('clamps grid columns to 2-4 range', async () => {
    // Test column count below minimum
    el = createElement(makeConfig({
      outro: { showSceneGrid: true, sceneGridColumns: 1 },
    }));
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next();

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    const grid = el.shadowRoot!.querySelector('.cis-outro-grid') as HTMLElement;
    expect(grid.style.getPropertyValue('--cis-outro-grid-cols')).toBe('2');
  });

  it('uses step number as label for scenes without title', async () => {
    const config: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      settings: { outro: { showSceneGrid: true } },
      scenes: [
        { id: 's1', image: 'https://example.com/1.jpg' },
        { id: 's2', image: 'https://example.com/2.jpg', title: 'Named Step' },
      ],
    };
    el = createElement(config);
    await mountAndWait(el);

    el.next();
    await vi.waitFor(() => expect(el.currentIndex).toBe(1));
    el.next();

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-outro')).not.toBeNull();
    });

    const labels = el.shadowRoot!.querySelectorAll('.cis-outro-grid__label');
    expect(labels[0].textContent).toBe('1');
    expect(labels[1].textContent).toBe('Named Step');
  });
});
