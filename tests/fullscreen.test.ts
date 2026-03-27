import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';
import type { SpotlightConfig } from '../src/types';
import { createFullscreenController } from '../src/fullscreen';
import { createKeyboardController } from '../src/keyboard';
import { iconFullscreen, iconFullscreenExit } from '../src/icons';

// ---------------------------------------------------------------------------
// Element registration + helpers
// ---------------------------------------------------------------------------

const TAG = 'cis-fullscreen-test';
beforeAll(() => {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends CloudimageSpotlight {}, { extends: undefined as never });
  }
});

function makeConfig(sceneCount = 3): SpotlightConfig {
  return {
    version: '1.0',
    ciToken: 'demo',
    scenes: Array.from({ length: sceneCount }, (_, i) => ({
      id: `scene-${i}`,
      image: `test${i}.jpg`,
      title: `Scene ${i}`,
    })),
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
  await new Promise((r) => setTimeout(r, 50));
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// Icon tests
// ---------------------------------------------------------------------------

describe('fullscreen icons', () => {
  it('iconFullscreen returns an SVG element', () => {
    const svg = iconFullscreen();
    expect(svg.tagName).toBe('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.childNodes.length).toBeGreaterThan(0);
  });

  it('iconFullscreenExit returns an SVG element', () => {
    const svg = iconFullscreenExit();
    expect(svg.tagName).toBe('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.childNodes.length).toBeGreaterThan(0);
  });

  it('icons accept custom size', () => {
    const svg = iconFullscreen(24);
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
  });

  it('fullscreen and exit icons have different SVG content', () => {
    const enter = iconFullscreen();
    const exit = iconFullscreenExit();
    // Both have polyline + line children but different point values
    const enterPoints = enter.querySelector('polyline')?.getAttribute('points');
    const exitPoints = exit.querySelector('polyline')?.getAttribute('points');
    expect(enterPoints).not.toBe(exitPoints);
  });
});

// ---------------------------------------------------------------------------
// createFullscreenController tests
// ---------------------------------------------------------------------------

describe('createFullscreenController', () => {
  it('returns null when fullscreen is not supported', () => {
    // jsdom does not support fullscreen API
    const container = document.createElement('div');
    const controller = createFullscreenController(container, vi.fn());
    // In jsdom, document.fullscreenEnabled is undefined/false, so null is expected
    expect(controller).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Keyboard: Escape key + fullscreen interaction
// ---------------------------------------------------------------------------

describe('keyboard escape with fullscreen', () => {
  it('calls exitFullscreen when in fullscreen instead of skip', () => {
    const host = document.createElement('div');
    const skip = vi.fn();
    const exitFullscreen = vi.fn();

    const controller = createKeyboardController(host, {
      next: vi.fn(),
      prev: vi.fn(),
      goTo: vi.fn(),
      skip,
      totalScenes: () => 5,
      isFullscreen: () => true,
      exitFullscreen,
    });

    controller.attach();
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(skip).not.toHaveBeenCalled();
    controller.detach();
  });

  it('calls skip when not in fullscreen', () => {
    const host = document.createElement('div');
    const skip = vi.fn();
    const exitFullscreen = vi.fn();

    const controller = createKeyboardController(host, {
      next: vi.fn(),
      prev: vi.fn(),
      goTo: vi.fn(),
      skip,
      totalScenes: () => 5,
      isFullscreen: () => false,
      exitFullscreen,
    });

    controller.attach();
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(skip).toHaveBeenCalledOnce();
    expect(exitFullscreen).not.toHaveBeenCalled();
    controller.detach();
  });

  it('calls skip when no fullscreen callbacks provided', () => {
    const host = document.createElement('div');
    const skip = vi.fn();

    const controller = createKeyboardController(host, {
      next: vi.fn(),
      prev: vi.fn(),
      goTo: vi.fn(),
      skip,
      totalScenes: () => 5,
    });

    controller.attach();
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(skip).toHaveBeenCalledOnce();
    controller.detach();
  });
});

// ---------------------------------------------------------------------------
// Element public API
// ---------------------------------------------------------------------------

describe('CloudimageSpotlight fullscreen API', () => {
  it('has isFullscreen property defaulting to false', async () => {
    const el = createElement(makeConfig());
    await mountAndWait(el);
    expect(el.isFullscreen).toBe(false);
  });

  it('has enterFullscreen method', async () => {
    const el = createElement(makeConfig());
    await mountAndWait(el);
    expect(typeof el.enterFullscreen).toBe('function');
  });

  it('has exitFullscreen method', async () => {
    const el = createElement(makeConfig());
    await mountAndWait(el);
    expect(typeof el.exitFullscreen).toBe('function');
  });

  it('enterFullscreen does not throw when fullscreen is not supported', async () => {
    const el = createElement(makeConfig());
    await mountAndWait(el);
    await expect(el.enterFullscreen()).resolves.not.toThrow();
  });

  it('exitFullscreen does not throw when fullscreen is not supported', async () => {
    const el = createElement(makeConfig());
    await mountAndWait(el);
    await expect(el.exitFullscreen()).resolves.not.toThrow();
  });

  it('isFullscreen returns false after destroy', async () => {
    const el = createElement(makeConfig());
    await mountAndWait(el);
    el.destroy();
    expect(el.isFullscreen).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Controls bar: fullscreen button presence
// ---------------------------------------------------------------------------

describe('fullscreen button in controls', () => {
  it('does not render fullscreen button when fullscreen API is not supported', async () => {
    // jsdom doesn't support fullscreen, so the button should not appear
    const el = createElement(makeConfig());
    await mountAndWait(el);
    const btn = el.shadowRoot?.querySelector('.cis-btn--fullscreen');
    expect(btn).toBeNull();
  });
});
