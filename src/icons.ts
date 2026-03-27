// ---------------------------------------------------------------------------
// Inline SVG icons — no external dependencies, no innerHTML
// ---------------------------------------------------------------------------

const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvg(size: number, children: SVGElement[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const child of children) svg.appendChild(child);
  return svg;
}

function polyline(points: string): SVGElement {
  const el = document.createElementNS(SVG_NS, 'polyline');
  el.setAttribute('points', points);
  return el;
}

function line(x1: number, y1: number, x2: number, y2: number): SVGElement {
  const el = document.createElementNS(SVG_NS, 'line');
  el.setAttribute('x1', String(x1));
  el.setAttribute('y1', String(y1));
  el.setAttribute('x2', String(x2));
  el.setAttribute('y2', String(y2));
  return el;
}

/** Close / X */
export function iconX(size = 18): SVGSVGElement {
  return createSvg(size, [line(18, 6, 6, 18), line(6, 6, 18, 18)]);
}

/** Checkmark (✓) */
export function iconCheck(size = 14): SVGSVGElement {
  return createSvg(size, [polyline('20 6 9 17 4 12')]);
}

/** Fullscreen enter (Lucide Maximize2) */
export function iconFullscreen(size = 18): SVGSVGElement {
  return createSvg(size, [
    polyline('15 3 21 3 21 9'),
    polyline('9 21 3 21 3 15'),
    line(21, 3, 14, 10),
    line(3, 21, 10, 14),
  ]);
}

/** Fullscreen exit (Lucide Minimize2) */
export function iconFullscreenExit(size = 18): SVGSVGElement {
  return createSvg(size, [
    polyline('4 14 10 14 10 20'),
    polyline('20 10 14 10 14 4'),
    line(14, 10, 21, 3),
    line(3, 21, 10, 14),
  ]);
}

function polygon(points: string): SVGElement {
  const el = document.createElementNS(SVG_NS, 'polygon');
  el.setAttribute('points', points);
  return el;
}

function rect(x: number, y: number, w: number, h: number, rx = 0): SVGElement {
  const el = document.createElementNS(SVG_NS, 'rect');
  el.setAttribute('x', String(x));
  el.setAttribute('y', String(y));
  el.setAttribute('width', String(w));
  el.setAttribute('height', String(h));
  if (rx) el.setAttribute('rx', String(rx));
  return el;
}

/** Play (Lucide Play) */
export function iconPlay(size = 18): SVGSVGElement {
  const svg = createSvg(size, [polygon('6 3 20 12 6 21')]);
  svg.setAttribute('fill', 'currentColor');
  return svg;
}

/** Pause (Lucide Pause) */
export function iconPause(size = 18): SVGSVGElement {
  const svg = createSvg(size, [rect(6, 4, 4, 16, 1), rect(14, 4, 4, 16, 1)]);
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('stroke', 'none');
  return svg;
}

/** Arrow left / chevron left (Lucide ChevronLeft) */
export function iconArrowLeft(size = 14): SVGSVGElement {
  return createSvg(size, [polyline('15 18 9 12 15 6')]);
}

/** Arrow right / chevron right (Lucide ChevronRight) */
export function iconArrowRight(size = 14): SVGSVGElement {
  return createSvg(size, [polyline('9 18 15 12 9 6')]);
}
