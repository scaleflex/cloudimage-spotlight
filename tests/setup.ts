import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia (not available in jsdom)
// Default: reduced-motion = true (instant transitions in test env, since jsdom has no CSS)
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Mock IntersectionObserver (not available in jsdom)
if (typeof IntersectionObserver === 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '0px';
    readonly thresholds: ReadonlyArray<number> = [0];
    private callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
      this.callback = callback;
    }

    observe(_target: Element): void {}
    unobserve(_target: Element): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }
  (globalThis as Record<string, unknown>).IntersectionObserver = MockIntersectionObserver;
}

// Mock CSSStyleSheet for constructable stylesheets (not available in jsdom)
if (typeof CSSStyleSheet !== 'undefined') {
  const originalCSSStyleSheet = CSSStyleSheet;

  // Ensure replaceSync is available
  if (!originalCSSStyleSheet.prototype.replaceSync) {
    originalCSSStyleSheet.prototype.replaceSync = function (_text: string) {
      // no-op in test environment
    };
  }
} else {
  // Provide a minimal CSSStyleSheet mock
  class MockCSSStyleSheet {
    cssRules: CSSRule[] = [];
    replaceSync(_text: string): void {
      // no-op
    }
    replace(_text: string): Promise<CSSStyleSheet> {
      return Promise.resolve(this as unknown as CSSStyleSheet);
    }
  }
  (globalThis as Record<string, unknown>).CSSStyleSheet = MockCSSStyleSheet;
}

// Mock adoptedStyleSheets on ShadowRoot if not available
if (typeof ShadowRoot !== 'undefined') {
  const proto = ShadowRoot.prototype as unknown as Record<string, unknown>;
  if (!('adoptedStyleSheets' in proto)) {
    Object.defineProperty(proto, 'adoptedStyleSheets', {
      get() {
        return (this as Record<string, unknown>)._adoptedStyleSheets ?? [];
      },
      set(sheets: CSSStyleSheet[]) {
        (this as Record<string, unknown>)._adoptedStyleSheets = sheets;
      },
      configurable: true,
    });
  }
}
