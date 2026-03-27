import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { CloudimageSpotlight } from '../src/spotlight-element';

// Register once
beforeAll(() => {
  if (!customElements.get('cloudimage-spotlight-lazy')) {
    customElements.define('cloudimage-spotlight-lazy', CloudimageSpotlight);
  }
});

// Custom element with a different tag for lazy loading tests
function createElement(): CloudimageSpotlight {
  return document.createElement('cloudimage-spotlight-lazy') as CloudimageSpotlight;
}

// Mock IntersectionObserver
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  elements: Element[] = [];
  disconnected = false;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  observe(el: Element) {
    this.elements.push(el);
  }

  disconnect() {
    this.disconnected = true;
    this.elements = [];
  }

  unobserve() {}

  // Simulate intersection
  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting, target: this.elements[0] } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }

  static reset() {
    MockIntersectionObserver.instances = [];
  }
}

describe('Lazy loading', () => {
  let originalIO: typeof IntersectionObserver;
  let el: CloudimageSpotlight;

  beforeEach(() => {
    originalIO = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
    MockIntersectionObserver.reset();
    el = createElement();
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIO;
    el.destroy();
    el.remove();
  });

  it('defers initialization by default (no eager, no hash)', () => {
    // No eager attribute, no matching hash
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '' },
      writable: true,
    });

    el.config = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'img' }],
    };
    document.body.appendChild(el);

    // IntersectionObserver should be created
    expect(MockIntersectionObserver.instances.length).toBeGreaterThan(0);
    const observer = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
    expect(observer.elements).toContain(el);

    // Config should NOT be loaded yet (still in loading state)
    expect(el.totalScenes).toBe(0);
  });

  it('initializes immediately when eager is set', () => {
    el.setAttribute('eager', '');
    el.config = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'img' }],
    };
    document.body.appendChild(el);

    // Should NOT use IntersectionObserver
    const ioInstances = MockIntersectionObserver.instances.filter(
      (io) => io.elements.includes(el),
    );
    expect(ioInstances).toHaveLength(0);
  });

  it('initializes on intersection', async () => {
    el.config = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'img' }],
    };
    document.body.appendChild(el);

    const observer = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];

    // Simulate scroll into view
    observer.trigger(true);

    await vi.waitFor(() => {
      expect(el.totalScenes).toBe(1);
    });

    // Observer should be disconnected after trigger
    expect(observer.disconnected).toBe(true);
  });

  it('does not initialize on non-intersecting observation', () => {
    el.config = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'img' }],
    };
    document.body.appendChild(el);

    const observer = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
    observer.trigger(false);

    // Should still be waiting
    expect(el.totalScenes).toBe(0);
    expect(observer.disconnected).toBe(false);
  });

  it('bypasses lazy loading when deep-link hash matches (cis- prefix)', () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '#cis-s1' },
      writable: true,
    });

    el.config = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'img' }],
    };
    document.body.appendChild(el);

    // Should NOT defer — deep link forces eager
    const ioInstances = MockIntersectionObserver.instances.filter(
      (io) => io.elements.includes(el),
    );
    expect(ioInstances).toHaveLength(0);
  });

  it('bypasses lazy loading when deep-link hash matches (id prefix)', () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '#myTour:s1' },
      writable: true,
    });

    el.setAttribute('id', 'myTour');
    el.config = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'img' }],
    };
    document.body.appendChild(el);

    const ioInstances = MockIntersectionObserver.instances.filter(
      (io) => io.elements.includes(el),
    );
    expect(ioInstances).toHaveLength(0);
  });

  it('disconnects observer on destroy before intersection', () => {
    el.config = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'img' }],
    };
    document.body.appendChild(el);

    const observer = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
    expect(observer.disconnected).toBe(false);

    el.destroy();
    expect(observer.disconnected).toBe(true);
  });

  it('does not initialize if destroyed before observer fires', async () => {
    el.config = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'img' }],
    };
    document.body.appendChild(el);

    const observer = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];

    el.destroy();

    // Late observer fire should be a no-op
    observer.trigger(true);

    // Small delay to ensure no async init happens
    await new Promise((r) => setTimeout(r, 50));
    expect(el.totalScenes).toBe(0);
  });
});
