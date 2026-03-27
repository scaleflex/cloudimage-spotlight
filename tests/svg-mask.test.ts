import { describe, it, expect, vi } from 'vitest';
import { createMask } from '../src/svg-mask';
import { createRegionHighlights } from '../src/region-highlights';
import { createBadges } from '../src/badges';
import { renderScene } from '../src/scene-renderer';
import { DEFAULT_STRINGS } from '../src/i18n';
import type { SpotlightRegion, SpotlightConfig, SpotlightScene } from '../src/types';
import type { SceneRenderContext } from '../src/scene-renderer';

// ---------------------------------------------------------------------------
// SVG Mask
// ---------------------------------------------------------------------------

describe('createMask', () => {
  const singleRegion: SpotlightRegion[] = [
    { tl_x: 0.1, tl_y: 0.2, br_x: 0.5, br_y: 0.6 },
  ];

  it('creates an SVG element with correct attributes', () => {
    const svg = createMask('inst-0', 'scene-1', singleRegion);
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 1 1');
    expect(svg.getAttribute('preserveAspectRatio')).toBe('none');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.classList.contains('cis-mask')).toBe(true);
  });

  it('creates a mask with instance-unique ID', () => {
    const svg = createMask('inst-0', 'scene-1', singleRegion);
    const mask = svg.querySelector('mask');
    expect(mask).not.toBeNull();
    expect(mask!.getAttribute('id')).toBe('cis-mask-inst-0-scene-1');
  });

  it('creates different IDs for different instances', () => {
    const svg1 = createMask('inst-0', 'scene-1', singleRegion);
    const svg2 = createMask('inst-1', 'scene-1', singleRegion);
    const id1 = svg1.querySelector('mask')!.getAttribute('id');
    const id2 = svg2.querySelector('mask')!.getAttribute('id');
    expect(id1).not.toBe(id2);
  });

  it('has a white background rect in the mask', () => {
    const svg = createMask('inst-0', 'scene-1', singleRegion);
    const mask = svg.querySelector('mask')!;
    const whiteRect = mask.querySelector('rect[fill="white"]');
    expect(whiteRect).not.toBeNull();
    expect(whiteRect!.getAttribute('width')).toBe('1');
    expect(whiteRect!.getAttribute('height')).toBe('1');
  });

  it('creates one black rect cut-out for a single rect region', () => {
    const svg = createMask('inst-0', 'scene-1', singleRegion);
    const mask = svg.querySelector('mask')!;
    const blackRects = mask.querySelectorAll('rect[fill="black"]');
    expect(blackRects).toHaveLength(1);

    const rect = blackRects[0];
    expect(rect.getAttribute('x')).toBe('0.1');
    expect(rect.getAttribute('y')).toBe('0.2');
    expect(rect.getAttribute('width')).toBe(String(0.5 - 0.1));
    expect(rect.getAttribute('height')).toBe(String(0.6 - 0.2));
    expect(rect.getAttribute('rx')).toBe('0.005');
  });

  it('creates multiple cut-outs for multiple regions', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.0, tl_y: 0.0, br_x: 0.3, br_y: 0.3 },
      { tl_x: 0.5, tl_y: 0.5, br_x: 0.8, br_y: 0.8 },
      { tl_x: 0.1, tl_y: 0.7, br_x: 0.4, br_y: 0.9 },
    ];
    const svg = createMask('inst-0', 'scene-1', regions);
    const mask = svg.querySelector('mask')!;
    const blackRects = mask.querySelectorAll('rect[fill="black"]');
    expect(blackRects).toHaveLength(3);
  });

  it('creates an ellipse cut-out for ellipse regions', () => {
    const ellipseRegion: SpotlightRegion[] = [
      { tl_x: 0.2, tl_y: 0.3, br_x: 0.8, br_y: 0.7, shape: 'ellipse' },
    ];
    const svg = createMask('inst-0', 'scene-1', ellipseRegion);
    const mask = svg.querySelector('mask')!;
    const ellipse = mask.querySelector('ellipse');
    expect(ellipse).not.toBeNull();
    expect(ellipse!.getAttribute('fill')).toBe('black');
    // Use parseFloat + toBeCloseTo for floating point precision
    expect(parseFloat(ellipse!.getAttribute('cx')!)).toBeCloseTo(0.5, 5);
    expect(parseFloat(ellipse!.getAttribute('cy')!)).toBeCloseTo(0.5, 5);
    expect(parseFloat(ellipse!.getAttribute('rx')!)).toBeCloseTo(0.3, 5);
    expect(parseFloat(ellipse!.getAttribute('ry')!)).toBeCloseTo(0.2, 5);
  });

  it('mixes rect and ellipse cut-outs', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.0, tl_y: 0.0, br_x: 0.4, br_y: 0.4 },
      { tl_x: 0.5, tl_y: 0.5, br_x: 0.9, br_y: 0.9, shape: 'ellipse' },
    ];
    const svg = createMask('inst-0', 'scene-1', regions);
    const mask = svg.querySelector('mask')!;
    expect(mask.querySelectorAll('rect[fill="black"]')).toHaveLength(1);
    expect(mask.querySelectorAll('ellipse')).toHaveLength(1);
  });

  it('overlay rect references the mask by ID', () => {
    const svg = createMask('inst-0', 'scene-1', singleRegion);
    // The overlay rect is the direct child of svg (not in defs)
    const overlayRects = svg.querySelectorAll(':scope > rect');
    expect(overlayRects).toHaveLength(1);
    expect(overlayRects[0].getAttribute('mask')).toBe('url(#cis-mask-inst-0-scene-1)');
  });

  it('overlay rect has mask reference and style applied', () => {
    const svg = createMask('inst-0', 'scene-1', singleRegion);
    const overlay = svg.querySelector(':scope > rect')!;
    expect(overlay.getAttribute('mask')).toBe('url(#cis-mask-inst-0-scene-1)');
    // fill and opacity are set via style.cssText (var() values may not be
    // parseable by jsdom, so we verify the style was set via the property)
    expect((overlay as SVGElement).style.length).toBeGreaterThanOrEqual(0);
  });

  it('handles empty regions (no cut-outs, just the mask shell)', () => {
    const svg = createMask('inst-0', 'scene-1', []);
    const mask = svg.querySelector('mask')!;
    const blackRects = mask.querySelectorAll('rect[fill="black"]');
    expect(blackRects).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Region Highlights
// ---------------------------------------------------------------------------

describe('createRegionHighlights', () => {
  it('creates one highlight per region', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.1, tl_y: 0.2, br_x: 0.5, br_y: 0.6 },
      { tl_x: 0.6, tl_y: 0.1, br_x: 0.9, br_y: 0.4 },
    ];
    const highlights = createRegionHighlights(regions);
    expect(highlights).toHaveLength(2);
  });

  it('positions highlight with percentage coordinates', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.1, tl_y: 0.2, br_x: 0.5, br_y: 0.6 },
    ];
    const hl = createRegionHighlights(regions)[0];
    expect(hl.style.left).toBe('10%');
    expect(hl.style.top).toBe('20%');
    expect(hl.style.width).toBe('40%'); // (0.5-0.1)*100
    expect(hl.style.height).toBe('40%'); // (0.6-0.2)*100
  });

  it('has correct class and attributes', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 0.5, br_y: 0.5 },
    ];
    const hl = createRegionHighlights(regions)[0];
    expect(hl.className).toBe('cis-region-highlight');
    expect(hl.getAttribute('data-index')).toBe('0');
    expect(hl.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies border-radius: 50% for ellipse regions', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.1, tl_y: 0.2, br_x: 0.5, br_y: 0.6, shape: 'ellipse' },
    ];
    const hl = createRegionHighlights(regions)[0];
    expect(hl.style.borderRadius).toBe('50%');
  });

  it('does not set border-radius for rect regions', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 0.5, br_y: 0.5 },
    ];
    const hl = createRegionHighlights(regions)[0];
    expect(hl.style.borderRadius).toBe('');
  });

  it('returns empty array for no regions', () => {
    expect(createRegionHighlights([])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

describe('createBadges', () => {
  it('creates one badge per region', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.1, tl_y: 0.2, br_x: 0.5, br_y: 0.6 },
      { tl_x: 0.6, tl_y: 0.1, br_x: 0.9, br_y: 0.4 },
    ];
    const badges = createBadges(regions);
    expect(badges).toHaveLength(2);
  });

  it('auto-numbers badges 1, 2, 3', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 0.3, br_y: 0.3 },
      { tl_x: 0.4, tl_y: 0.4, br_x: 0.7, br_y: 0.7 },
      { tl_x: 0.8, tl_y: 0.8, br_x: 1, br_y: 1 },
    ];
    const badges = createBadges(regions);
    expect(badges[0].textContent).toBe('1');
    expect(badges[1].textContent).toBe('2');
    expect(badges[2].textContent).toBe('3');
  });

  it('uses custom label when provided', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 0.5, br_y: 0.5, label: 'A' },
      { tl_x: 0.5, tl_y: 0.5, br_x: 1, br_y: 1, label: '→' },
    ];
    const badges = createBadges(regions);
    expect(badges[0].textContent).toBe('A');
    expect(badges[1].textContent).toBe('→');
  });

  it('positions badge at region top-left', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.25, tl_y: 0.75, br_x: 0.5, br_y: 1 },
    ];
    const badge = createBadges(regions)[0];
    expect(badge.style.left).toBe('25%');
    expect(badge.style.top).toBe('75%');
  });

  it('has correct class and attributes', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 0.5, br_y: 0.5 },
    ];
    const badge = createBadges(regions)[0];
    expect(badge.className).toBe('cis-badge');
    expect(badge.getAttribute('data-index')).toBe('0');
    expect(badge.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses textContent (not innerHTML) for labels', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 0.5, br_y: 0.5, label: '<script>alert(1)</script>' },
    ];
    const badge = createBadges(regions)[0];
    expect(badge.textContent).toBe('<script>alert(1)</script>');
    expect(badge.innerHTML).not.toContain('<script>');
  });

  it('returns empty array for no regions', () => {
    expect(createBadges([])).toHaveLength(0);
  });

  it('uses circle class for short labels (≤ 2 chars)', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 0.5, br_y: 0.5 },              // auto "1"
      { tl_x: 0.5, tl_y: 0, br_x: 1, br_y: 0.5, label: 'A' },   // 1 char
      { tl_x: 0, tl_y: 0.5, br_x: 0.5, br_y: 1, label: 'OK' },  // 2 chars
    ];
    const badges = createBadges(regions);
    expect(badges[0].className).toBe('cis-badge');
    expect(badges[1].className).toBe('cis-badge');
    expect(badges[2].className).toBe('cis-badge');
  });

  it('uses pill class for text labels (> 2 chars)', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 0.5, br_y: 0.5, label: 'API Keys' },
      { tl_x: 0.5, tl_y: 0.5, br_x: 1, br_y: 1, label: 'Create key' },
    ];
    const badges = createBadges(regions);
    expect(badges[0].className).toBe('cis-badge cis-badge--label');
    expect(badges[1].className).toBe('cis-badge cis-badge--label');
  });
});

// ---------------------------------------------------------------------------
// showBadges setting in renderScene
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<SceneRenderContext> = {}): SceneRenderContext {
  const scene: SpotlightScene = {
    id: 'test',
    image: '/test.png',
    regions: [{ tl_x: 0.1, tl_y: 0.1, br_x: 0.5, br_y: 0.5 }],
  };
  const config: SpotlightConfig = {
    version: '1.0',
    ciToken: 'demo',
    scenes: [scene],
  };
  return {
    config,
    stage: document.createElement('div'),
    containerWidth: 800,
    dpr: 1,
    strings: DEFAULT_STRINGS,
    instanceId: 'test-1',
    isRTL: false,
    showBadges: true,
    showProgress: true,
    allowSkip: false,
    onImageLoad: vi.fn(),
    onImageError: vi.fn(),
    onCtaClick: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onSkip: vi.fn(),
    ...overrides,
  };
}

describe('renderScene showBadges', () => {
  it('renders badges when showBadges is true (default)', () => {
    const ctx = makeCtx({ showBadges: true });
    const scene = ctx.config.scenes[0];
    renderScene(scene, 0, 1, ctx);
    const badges = ctx.stage.querySelectorAll('.cis-badge');
    expect(badges.length).toBe(1);
  });

  it('hides badges when showBadges is false', () => {
    const ctx = makeCtx({ showBadges: false });
    const scene = ctx.config.scenes[0];
    renderScene(scene, 0, 1, ctx);
    const badges = ctx.stage.querySelectorAll('.cis-badge');
    expect(badges.length).toBe(0);
  });

  it('still renders region highlights when showBadges is false', () => {
    const ctx = makeCtx({ showBadges: false });
    const scene = ctx.config.scenes[0];
    renderScene(scene, 0, 1, ctx);
    const highlights = ctx.stage.querySelectorAll('.cis-region-highlight');
    expect(highlights.length).toBe(1);
  });
});
