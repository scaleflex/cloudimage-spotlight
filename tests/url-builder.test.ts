import { describe, it, expect } from 'vitest';
import {
  buildCiUrl,
  getRegionsBoundingBox,
  stripProtocol,
  roundWidth,
} from '../src/url-builder';
import type { SpotlightRegion } from '../src/types';

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

describe('stripProtocol', () => {
  it('removes https:// prefix', () => {
    expect(stripProtocol('https://example.com/img.jpg')).toBe('example.com/img.jpg');
  });

  it('removes http:// prefix', () => {
    expect(stripProtocol('http://example.com/img.jpg')).toBe('example.com/img.jpg');
  });

  it('passes through URLs without protocol', () => {
    expect(stripProtocol('example.com/img.jpg')).toBe('example.com/img.jpg');
  });

  it('encodes spaces and special characters', () => {
    expect(stripProtocol('https://example.com/my image.jpg')).toBe(
      'example.com/my%20image.jpg',
    );
  });

  it('encodes unicode characters', () => {
    const result = stripProtocol('https://example.com/café.jpg');
    expect(result).toBe('example.com/caf%C3%A9.jpg');
  });
});

describe('roundWidth', () => {
  it('rounds up to nearest 100 by default', () => {
    expect(roundWidth(373)).toBe(400);
    expect(roundWidth(800)).toBe(800);
    expect(roundWidth(801)).toBe(900);
    expect(roundWidth(1)).toBe(100);
  });

  it('accepts custom step', () => {
    expect(roundWidth(373, 50)).toBe(400);
    expect(roundWidth(351, 50)).toBe(400);
    expect(roundWidth(300, 50)).toBe(300);
  });

  it('handles exact multiples', () => {
    expect(roundWidth(500)).toBe(500);
    expect(roundWidth(1200)).toBe(1200);
  });
});

describe('getRegionsBoundingBox', () => {
  it('returns the single region as bounding box', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.1, tl_y: 0.2, br_x: 0.5, br_y: 0.6 },
    ];
    const box = getRegionsBoundingBox(regions);
    expect(box.tl_x).toBe(0.1);
    expect(box.tl_y).toBe(0.2);
    expect(box.br_x).toBe(0.5);
    expect(box.br_y).toBe(0.6);
    expect(box.padding).toBe(0.02); // default
  });

  it('computes union of multiple regions', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.1, tl_y: 0.2, br_x: 0.4, br_y: 0.5 },
      { tl_x: 0.3, tl_y: 0.1, br_x: 0.8, br_y: 0.7 },
    ];
    const box = getRegionsBoundingBox(regions);
    expect(box.tl_x).toBe(0.1);
    expect(box.tl_y).toBe(0.1);
    expect(box.br_x).toBe(0.8);
    expect(box.br_y).toBe(0.7);
  });

  it('uses max padding from all regions', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 0.5, br_y: 0.5, padding: 0.01 },
      { tl_x: 0.5, tl_y: 0.5, br_x: 1, br_y: 1, padding: 0.05 },
    ];
    const box = getRegionsBoundingBox(regions);
    expect(box.padding).toBe(0.05);
  });

  it('defaults padding to 0.02 when not specified', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0, tl_y: 0, br_x: 1, br_y: 1 },
    ];
    expect(getRegionsBoundingBox(regions).padding).toBe(0.02);
  });
});

// ---------------------------------------------------------------------------
// buildCiUrl
// ---------------------------------------------------------------------------

describe('buildCiUrl', () => {
  const origin = 'https://example.com/screenshot.jpg';
  const token = 'demo';

  describe('full variant', () => {
    it('builds correct URL with defaults', () => {
      const url = buildCiUrl(origin, token, 'full');
      expect(url).toBe(
        'https://demo.cloudimg.io/example.com/screenshot.jpg?w=1200&dpr=1&q=85&org_if_sml=1',
      );
    });

    it('uses custom container width (rounded)', () => {
      const url = buildCiUrl(origin, token, 'full', undefined, 750);
      expect(url).toContain('w=800'); // 750 rounded to 800
    });

    it('uses custom DPR', () => {
      const url = buildCiUrl(origin, token, 'full', undefined, 800, 2);
      expect(url).toContain('dpr=2');
    });

    it('clamps DPR to minimum 1', () => {
      const url = buildCiUrl(origin, token, 'full', undefined, 800, 0.5);
      expect(url).toContain('dpr=1');
    });

    it('clamps DPR to maximum 3', () => {
      const url = buildCiUrl(origin, token, 'full', undefined, 800, 5);
      expect(url).toContain('dpr=3');
    });

    it('includes org_if_sml=1', () => {
      const url = buildCiUrl(origin, token, 'full');
      expect(url).toContain('org_if_sml=1');
    });
  });

  describe('zoomed variant', () => {
    const regions: SpotlightRegion[] = [
      { tl_x: 0.62, tl_y: 0.08, br_x: 0.98, br_y: 0.44 },
    ];
    // Simulated original image: 1920×1080
    const natW = 1920;
    const natH = 1080;

    it('builds crop URL with pixel coordinates', () => {
      const url = buildCiUrl(origin, token, 'zoomed', regions, 800, 1, undefined, natW, natH);
      expect(url).toContain('func=crop');
      expect(url).toContain('tl_px=');
      expect(url).toContain('br_px=');
      expect(url).toContain('org_if_sml=1');
    });

    it('applies padding around region bounds as pixels', () => {
      const url = buildCiUrl(origin, token, 'zoomed', regions, 800, 1, undefined, natW, natH);
      // Region: tl(0.62, 0.08) br(0.98, 0.44), default padding 0.02
      // Padded: tl(0.60, 0.06) br(1.0, 0.46)
      // Pixels: tl(1152, 65) br(1920, 497)
      expect(url).toContain('tl_px=1152,65');
      expect(url).toContain('br_px=1920,497');
    });

    it('clamps padded coordinates to 0–1 range', () => {
      const edgeRegions: SpotlightRegion[] = [
        { tl_x: 0.0, tl_y: 0.0, br_x: 1.0, br_y: 1.0 },
      ];
      const url = buildCiUrl(origin, token, 'zoomed', edgeRegions, 800, 1, undefined, natW, natH);
      // Padded beyond 0-1 should be clamped to 0 and full dimensions
      expect(url).toContain('tl_px=0,0');
      expect(url).toContain('br_px=1920,1080');
    });

    it('falls back to "full" when no regions', () => {
      const url = buildCiUrl(origin, token, 'zoomed', [], 800, 1, undefined, natW, natH);
      expect(url).not.toContain('func=crop');
      expect(url).toContain('q=85'); // full variant marker
    });

    it('falls back to "full" when regions undefined', () => {
      const url = buildCiUrl(origin, token, 'zoomed', undefined, 800);
      expect(url).toContain('q=85');
    });

    it('falls back to "full" when natural dimensions missing', () => {
      const url = buildCiUrl(origin, token, 'zoomed', regions, 800);
      expect(url).not.toContain('func=crop');
      expect(url).toContain('q=85');
    });

    it('falls back to "full" when naturalWidth is 0', () => {
      const url = buildCiUrl(origin, token, 'zoomed', regions, 800, 1, undefined, 0, 1080);
      expect(url).not.toContain('func=crop');
      expect(url).toContain('q=85');
    });

    it('falls back to "full" when naturalHeight is 0', () => {
      const url = buildCiUrl(origin, token, 'zoomed', regions, 800, 1, undefined, 1920, 0);
      expect(url).not.toContain('func=crop');
      expect(url).toContain('q=85');
    });

    it('computes bounding box for multiple regions', () => {
      const multiRegions: SpotlightRegion[] = [
        { tl_x: 0.1, tl_y: 0.1, br_x: 0.3, br_y: 0.3 },
        { tl_x: 0.6, tl_y: 0.6, br_x: 0.9, br_y: 0.9 },
      ];
      const url = buildCiUrl(origin, token, 'zoomed', multiRegions, 800, 1, undefined, natW, natH);
      // Bounding box: tl(0.1, 0.1) br(0.9, 0.9), padding 0.02
      // Padded: tl(0.08, 0.08) br(0.92, 0.92)
      // Pixels: tl(154, 86) br(1766, 994)
      expect(url).toContain('tl_px=154,86');
      expect(url).toContain('br_px=1766,994');
    });

    it('uses scene-level zoomPadding override', () => {
      const url = buildCiUrl(origin, token, 'zoomed', regions, 800, 1, undefined, natW, natH, 0.2);
      // Region: tl(0.62, 0.08) br(0.98, 0.44), zoomPadding 0.2
      // Padded: tl(0.42, 0) br(1.0, 0.64)
      // Pixels: tl(806, 0) br(1920, 691)
      expect(url).toContain('tl_px=806,0');
      expect(url).toContain('br_px=1920,691');
    });

    it('zoomPadding=0 overrides region default padding', () => {
      const url = buildCiUrl(origin, token, 'zoomed', regions, 800, 1, undefined, natW, natH, 0);
      // Region: tl(0.62, 0.08) br(0.98, 0.44), zoomPadding 0 (no padding)
      // Pixels: tl(1190, 86) br(1882, 475)
      expect(url).toContain('tl_px=1190,86');
      expect(url).toContain('br_px=1882,475');
    });
  });

  describe('blurred variant', () => {
    it('builds blur URL with default radius', () => {
      const url = buildCiUrl(origin, token, 'blurred');
      expect(url).toContain('blur=8');
      expect(url).toContain('q=70');
      expect(url).toContain('org_if_sml=1');
    });

    it('uses custom blur radius', () => {
      const url = buildCiUrl(origin, token, 'blurred', undefined, 800, 1, 15);
      expect(url).toContain('blur=15');
    });

    it('includes DPR and width', () => {
      const url = buildCiUrl(origin, token, 'blurred', undefined, 600, 2);
      expect(url).toContain('w=600');
      expect(url).toContain('dpr=2');
    });
  });

  describe('URL encoding', () => {
    it('handles origin URL with spaces', () => {
      const url = buildCiUrl('https://example.com/my image.jpg', token, 'full');
      expect(url).toContain('example.com/my%20image.jpg');
    });

    it('handles origin URL without protocol', () => {
      const url = buildCiUrl('example.com/img.jpg', token, 'full');
      expect(url).toBe(
        'https://demo.cloudimg.io/example.com/img.jpg?w=1200&dpr=1&q=85&org_if_sml=1',
      );
    });
  });
});
