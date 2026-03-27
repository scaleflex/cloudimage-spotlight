import { describe, it, expect } from 'vitest';
import { createConnector, getEdgeAnchors, findBestAnchorPair } from '../src/connector';
import type { SpotlightRegion } from '../src/types';

// ---------------------------------------------------------------------------
// getEdgeAnchors
// ---------------------------------------------------------------------------

describe('getEdgeAnchors', () => {
  const rect = { left: 100, top: 200, width: 300, height: 100 };

  it('returns 4 anchors', () => {
    const anchors = getEdgeAnchors(rect);
    expect(anchors).toHaveLength(4);
  });

  it('top anchor is at horizontal center, top edge, pointing up', () => {
    const [top] = getEdgeAnchors(rect);
    expect(top.point).toEqual({ x: 250, y: 200 });
    expect(top.normal).toEqual({ x: 0, y: -1 });
  });

  it('bottom anchor is at horizontal center, bottom edge, pointing down', () => {
    const [, bottom] = getEdgeAnchors(rect);
    expect(bottom.point).toEqual({ x: 250, y: 300 });
    expect(bottom.normal).toEqual({ x: 0, y: 1 });
  });

  it('left anchor is at vertical center, left edge, pointing left', () => {
    const [, , left] = getEdgeAnchors(rect);
    expect(left.point).toEqual({ x: 100, y: 250 });
    expect(left.normal).toEqual({ x: -1, y: 0 });
  });

  it('right anchor is at vertical center, right edge, pointing right', () => {
    const [, , , right] = getEdgeAnchors(rect);
    expect(right.point).toEqual({ x: 400, y: 250 });
    expect(right.normal).toEqual({ x: 1, y: 0 });
  });
});

// ---------------------------------------------------------------------------
// findBestAnchorPair
// ---------------------------------------------------------------------------

describe('findBestAnchorPair', () => {
  it('picks right→left when card is left of region', () => {
    const card = { left: 10, top: 100, width: 200, height: 80 };
    const region = { left: 400, top: 100, width: 150, height: 100 };
    const pair = findBestAnchorPair(card, region)!;
    expect(pair).not.toBeNull();
    // Card right edge midpoint → Region left edge midpoint
    expect(pair.card.normal).toEqual({ x: 1, y: 0 });
    expect(pair.region.normal).toEqual({ x: -1, y: 0 });
  });

  it('picks left→right when card is right of region', () => {
    const card = { left: 500, top: 100, width: 200, height: 80 };
    const region = { left: 50, top: 100, width: 150, height: 100 };
    const pair = findBestAnchorPair(card, region)!;
    expect(pair).not.toBeNull();
    expect(pair.card.normal).toEqual({ x: -1, y: 0 });
    expect(pair.region.normal).toEqual({ x: 1, y: 0 });
  });

  it('picks bottom→top when card is above region', () => {
    const card = { left: 200, top: 10, width: 200, height: 80 };
    const region = { left: 200, top: 300, width: 200, height: 100 };
    const pair = findBestAnchorPair(card, region)!;
    expect(pair).not.toBeNull();
    expect(pair.card.normal).toEqual({ x: 0, y: 1 });
    expect(pair.region.normal).toEqual({ x: 0, y: -1 });
  });

  it('picks top→bottom when card is below region', () => {
    const card = { left: 200, top: 400, width: 200, height: 80 };
    const region = { left: 200, top: 50, width: 200, height: 100 };
    const pair = findBestAnchorPair(card, region)!;
    expect(pair).not.toBeNull();
    expect(pair.card.normal).toEqual({ x: 0, y: -1 });
    expect(pair.region.normal).toEqual({ x: 0, y: 1 });
  });

  it('handles diagonal arrangement (card top-left, region bottom-right)', () => {
    const card = { left: 10, top: 10, width: 200, height: 80 };
    const region = { left: 500, top: 400, width: 150, height: 100 };
    const pair = findBestAnchorPair(card, region)!;
    expect(pair).not.toBeNull();
    // Should pick the pair with shortest distance — both normals point toward the other
    const d = Math.hypot(
      pair.card.point.x - pair.region.point.x,
      pair.card.point.y - pair.region.point.y,
    );
    expect(d).toBeGreaterThan(0);
  });

  it('returns zero-distance pair when rects fully overlap (createConnector rejects via dist check)', () => {
    const rect = { left: 100, top: 100, width: 200, height: 200 };
    const pair = findBestAnchorPair(rect, rect);
    // Pair exists but points coincide — createConnector's dist < 20 check handles this
    expect(pair).not.toBeNull();
    expect(pair!.card.point).toEqual(pair!.region.point);
  });
});

// ---------------------------------------------------------------------------
// createConnector (SVG element creation)
// ---------------------------------------------------------------------------

describe('createConnector', () => {
  const stageW = 800;
  const stageH = 600;

  const region: SpotlightRegion = {
    tl_x: 0.6,
    tl_y: 0.1,
    br_x: 0.9,
    br_y: 0.4,
  };

  const cardRect = { left: 16, top: 16, width: 320, height: 100 };

  it('returns SVG with path and circle', () => {
    const svg = createConnector(cardRect, [region], stageW, stageH);
    expect(svg).not.toBeNull();
    expect(svg!.tagName.toLowerCase()).toBe('svg');
    expect(svg!.classList.contains('cis-connector')).toBe(true);
    expect(svg!.querySelector('path')).not.toBeNull();
    expect(svg!.querySelector('circle')).not.toBeNull();
  });

  it('uses cubic bezier (C command) for smooth curves', () => {
    const svg = createConnector(cardRect, [region], stageW, stageH);
    const d = svg!.querySelector('path')!.getAttribute('d')!;
    expect(d).toContain('C');
  });

  it('sets aria-hidden', () => {
    const svg = createConnector(cardRect, [region], stageW, stageH);
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('returns null for empty regions', () => {
    expect(createConnector(cardRect, [], stageW, stageH)).toBeNull();
  });

  it('returns null when card overlaps the region', () => {
    const overlapping = {
      left: region.tl_x * stageW - 10,
      top: region.tl_y * stageH - 10,
      width: (region.br_x - region.tl_x) * stageW + 20,
      height: (region.br_y - region.tl_y) * stageH + 20,
    };
    expect(createConnector(overlapping, [region], stageW, stageH)).toBeNull();
  });

  it('dot is at the region edge midpoint, not the center', () => {
    const svg = createConnector(cardRect, [region], stageW, stageH);
    expect(svg).not.toBeNull();
    const circle = svg!.querySelector('circle')!;
    const cx = Number(circle.getAttribute('cx'));
    const cy = Number(circle.getAttribute('cy'));

    // Card is top-left — best pair should be card-right → region-left
    // Region left edge midpoint: x = 0.6 * 800 = 480, y = (0.1+0.4)/2 * 600 = 150
    expect(cx).toBe(region.tl_x * stageW);
    expect(cy).toBe(((region.tl_y + region.br_y) / 2) * stageH);
  });

  it('uses SVG namespace for all elements', () => {
    const svg = createConnector(cardRect, [region], stageW, stageH);
    expect(svg!.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg!.querySelector('path')!.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg!.querySelector('circle')!.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('sets width and height to stage dimensions', () => {
    const svg = createConnector(cardRect, [region], stageW, stageH);
    expect(svg!.getAttribute('width')).toBe(String(stageW));
    expect(svg!.getAttribute('height')).toBe(String(stageH));
  });

  it('connects to top edge when card is above region', () => {
    const topCard = { left: 200, top: 16, width: 200, height: 80 };
    const bottomRegion: SpotlightRegion = { tl_x: 0.2, tl_y: 0.6, br_x: 0.6, br_y: 0.9 };
    const svg = createConnector(topCard, [bottomRegion], stageW, stageH);
    expect(svg).not.toBeNull();
    const circle = svg!.querySelector('circle')!;
    const cy = Number(circle.getAttribute('cy'));
    // Should be at top edge of region = 0.6 * 600 = 360
    expect(cy).toBe(bottomRegion.tl_y * stageH);
  });

  it('connects to bottom edge when card is below region', () => {
    const bottomCard = { left: 200, top: 450, width: 200, height: 80 };
    const topRegion: SpotlightRegion = { tl_x: 0.2, tl_y: 0.05, br_x: 0.6, br_y: 0.3 };
    const svg = createConnector(bottomCard, [topRegion], stageW, stageH);
    expect(svg).not.toBeNull();
    const circle = svg!.querySelector('circle')!;
    const cy = Number(circle.getAttribute('cy'));
    // Should be at bottom edge of region = 0.3 * 600 = 180
    expect(cy).toBe(topRegion.br_y * stageH);
  });
});
