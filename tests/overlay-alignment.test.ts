import { describe, it, expect } from 'vitest';
import { computeImageContentRect, remapRegionsForZoom, computeZoomTransform } from '../src/scene-renderer';
import type { SpotlightRegion } from '../src/types';

// ---------------------------------------------------------------------------
// computeImageContentRect
// ---------------------------------------------------------------------------

describe('computeImageContentRect', () => {
  it('fills container when aspect ratios match', () => {
    const rect = computeImageContentRect(1600, 900, 800, 450);
    expect(rect.left).toBeCloseTo(0);
    expect(rect.top).toBeCloseTo(0);
    expect(rect.width).toBeCloseTo(800);
    expect(rect.height).toBeCloseTo(450);
  });

  it('letterboxes vertically for wider image', () => {
    // Image 2:1, container 16:9 (1.78:1) — image is wider
    const rect = computeImageContentRect(2000, 1000, 800, 450);
    expect(rect.left).toBeCloseTo(0);
    expect(rect.width).toBeCloseTo(800);
    // Height = 800 / 2 = 400, offset = (450 - 400) / 2 = 25
    expect(rect.height).toBeCloseTo(400);
    expect(rect.top).toBeCloseTo(25);
  });

  it('pillarboxes horizontally for taller image', () => {
    // Image 1:1, container 16:9 — image is taller
    const rect = computeImageContentRect(1000, 1000, 800, 450);
    expect(rect.top).toBeCloseTo(0);
    expect(rect.height).toBeCloseTo(450);
    // Width = 450 * 1 = 450, offset = (800 - 450) / 2 = 175
    expect(rect.width).toBeCloseTo(450);
    expect(rect.left).toBeCloseTo(175);
  });

  it('returns full container for zero natural dimensions', () => {
    const rect = computeImageContentRect(0, 0, 800, 450);
    expect(rect).toEqual({ left: 0, top: 0, width: 800, height: 450 });
  });

  it('returns zeros for zero container', () => {
    const rect = computeImageContentRect(1600, 900, 0, 0);
    expect(rect).toEqual({ left: 0, top: 0, width: 0, height: 0 });
  });

  it('handles very wide crop (zoom scenario)', () => {
    // Simulates a zoom crop: 48% width x 24% height of a 16:9 image
    // Crop pixels from 1920x1080: 922 x 259, aspect 3.56:1
    // Container: 900x506 (16:9 stage)
    const rect = computeImageContentRect(922, 259, 900, 506);
    expect(rect.left).toBeCloseTo(0);
    expect(rect.width).toBeCloseTo(900);
    // Height = 900 / (922/259) = 900 / 3.56 ≈ 252.8
    const expectedHeight = 900 / (922 / 259);
    expect(rect.height).toBeCloseTo(expectedHeight, 0);
    // Top offset = (506 - 252.8) / 2 ≈ 126.6
    expect(rect.top).toBeCloseTo((506 - expectedHeight) / 2, 0);
  });
});

// ---------------------------------------------------------------------------
// remapRegionsForZoom
// ---------------------------------------------------------------------------

describe('remapRegionsForZoom', () => {
  it('remaps single region to fill most of the crop area', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.3, tl_y: 0.4, br_x: 0.7, br_y: 0.6 },
    ];
    const remapped = remapRegionsForZoom(regions);

    // Bounding box: tl=(0.3,0.4) br=(0.7,0.6), padding=0.02
    // Crop: x1=0.28 y1=0.38 x2=0.72 y2=0.62, w=0.44 h=0.24
    const x1 = 0.28, y1 = 0.38, w = 0.44, h = 0.24;
    expect(remapped[0].tl_x).toBeCloseTo((0.3 - x1) / w, 5);
    expect(remapped[0].tl_y).toBeCloseTo((0.4 - y1) / h, 5);
    expect(remapped[0].br_x).toBeCloseTo((0.7 - x1) / w, 5);
    expect(remapped[0].br_y).toBeCloseTo((0.6 - y1) / h, 5);
  });

  it('remaps multiple regions correctly', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.28, tl_y: 0.36, br_x: 0.72, br_y: 0.44 },
      { tl_x: 0.28, tl_y: 0.47, br_x: 0.72, br_y: 0.56 },
    ];
    const remapped = remapRegionsForZoom(regions);

    // Bounding box: tl=(0.28,0.36) br=(0.72,0.56), padding=0.02
    // Crop: x1=0.26 y1=0.34 x2=0.74 y2=0.58, w=0.48 h=0.24
    const x1 = 0.26, y1 = 0.34, w = 0.48, h = 0.24;

    expect(remapped[0].tl_x).toBeCloseTo((0.28 - x1) / w, 5);
    expect(remapped[0].tl_y).toBeCloseTo((0.36 - y1) / h, 5);
    expect(remapped[0].br_x).toBeCloseTo((0.72 - x1) / w, 5);
    expect(remapped[0].br_y).toBeCloseTo((0.44 - y1) / h, 5);

    expect(remapped[1].tl_x).toBeCloseTo((0.28 - x1) / w, 5);
    expect(remapped[1].tl_y).toBeCloseTo((0.47 - y1) / h, 5);
    expect(remapped[1].br_x).toBeCloseTo((0.72 - x1) / w, 5);
    expect(remapped[1].br_y).toBeCloseTo((0.56 - y1) / h, 5);
  });

  it('preserves non-coordinate region properties', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.2, tl_y: 0.3, br_x: 0.8, br_y: 0.7, label: 'Test', shape: 'ellipse' },
    ];
    const remapped = remapRegionsForZoom(regions);
    expect(remapped[0].label).toBe('Test');
    expect(remapped[0].shape).toBe('ellipse');
  });

  it('remapped coordinates stay within 0–1 range', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.1, tl_y: 0.2, br_x: 0.9, br_y: 0.8 },
    ];
    const remapped = remapRegionsForZoom(regions);
    expect(remapped[0].tl_x).toBeGreaterThanOrEqual(0);
    expect(remapped[0].tl_y).toBeGreaterThanOrEqual(0);
    expect(remapped[0].br_x).toBeLessThanOrEqual(1);
    expect(remapped[0].br_y).toBeLessThanOrEqual(1);
  });

  it('handles regions near edges (padding clamped to 0)', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.0, tl_y: 0.0, br_x: 0.1, br_y: 0.1 },
    ];
    const remapped = remapRegionsForZoom(regions);
    // Crop: x1=max(0, 0-0.02)=0, y1=0, x2=min(1, 0.1+0.02)=0.12, y2=0.12
    // w=0.12, h=0.12
    // tl_x = (0 - 0) / 0.12 = 0
    expect(remapped[0].tl_x).toBeCloseTo(0);
    expect(remapped[0].tl_y).toBeCloseTo(0);
    // br_x = (0.1 - 0) / 0.12 ≈ 0.833
    expect(remapped[0].br_x).toBeCloseTo(0.1 / 0.12, 3);
  });

  it('respects custom padding on regions', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.3, tl_y: 0.3, br_x: 0.7, br_y: 0.7, padding: 0.05 },
    ];
    const remapped = remapRegionsForZoom(regions);
    // Padding = 0.05
    // Crop: x1=0.25, y1=0.25, x2=0.75, y2=0.75, w=0.5, h=0.5
    expect(remapped[0].tl_x).toBeCloseTo((0.3 - 0.25) / 0.5, 5); // 0.1
    expect(remapped[0].br_x).toBeCloseTo((0.7 - 0.25) / 0.5, 5); // 0.9
  });

  it('uses scene-level zoomPadding override', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.3, tl_y: 0.3, br_x: 0.7, br_y: 0.7 },
    ];
    const remapped = remapRegionsForZoom(regions, undefined, undefined, 0.1);
    // zoomPadding = 0.1 (overrides default 0.02)
    // Crop: x1=0.2, y1=0.2, x2=0.8, y2=0.8, w=0.6, h=0.6
    expect(remapped[0].tl_x).toBeCloseTo((0.3 - 0.2) / 0.6, 5); // ~0.167
    expect(remapped[0].br_x).toBeCloseTo((0.7 - 0.2) / 0.6, 5); // ~0.833
  });
});

// ---------------------------------------------------------------------------
// computeZoomTransform
// ---------------------------------------------------------------------------

describe('computeZoomTransform', () => {
  function makeImg(naturalWidth: number, naturalHeight: number): HTMLImageElement {
    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', { value: naturalWidth });
    Object.defineProperty(img, 'naturalHeight', { value: naturalHeight });
    return img;
  }

  function makeStage(w: number, h: number): HTMLElement {
    const el = document.createElement('div');
    Object.defineProperty(el, 'clientWidth', { value: w });
    Object.defineProperty(el, 'clientHeight', { value: h });
    return el;
  }

  it('returns null when no regions', () => {
    const result = computeZoomTransform(makeImg(1920, 1080), makeStage(800, 450), []);
    expect(result).toBeNull();
  });

  it('returns null when image has no natural dimensions', () => {
    const result = computeZoomTransform(
      makeImg(0, 0), makeStage(800, 450),
      [{ tl_x: 0.3, tl_y: 0.3, br_x: 0.7, br_y: 0.7 }],
    );
    expect(result).toBeNull();
  });

  it('computes scale > 1 for a region smaller than the stage', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.4, tl_y: 0.4, br_x: 0.6, br_y: 0.6 },
    ];
    const result = computeZoomTransform(makeImg(1920, 1080), makeStage(800, 450), regions);
    expect(result).not.toBeNull();
    expect(result!.scale).toBeGreaterThan(1);
  });

  it('respects zoomPadding override', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.4, tl_y: 0.4, br_x: 0.6, br_y: 0.6 },
    ];
    const small = computeZoomTransform(makeImg(1920, 1080), makeStage(800, 450), regions, 0.02);
    const large = computeZoomTransform(makeImg(1920, 1080), makeStage(800, 450), regions, 0.2);
    expect(small).not.toBeNull();
    expect(large).not.toBeNull();
    // More padding = less zoom
    expect(small!.scale).toBeGreaterThan(large!.scale);
  });
});
