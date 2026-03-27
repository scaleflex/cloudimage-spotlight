import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { createAnnotation } from '../src/annotation';
import type { AnnotationOptions, AnnotationCallbacks } from '../src/annotation';
import { CloudimageSpotlight } from '../src/spotlight-element';
import { resolveStrings } from '../src/i18n';
import type { SpotlightScene, SpotlightConfig } from '../src/types';

// ---------------------------------------------------------------------------
// createAnnotation (unit tests — no DOM mounting needed)
// ---------------------------------------------------------------------------

describe('createAnnotation', () => {
  const defaultStrings = resolveStrings();

  const defaultOptions: AnnotationOptions = {
    index: 0,
    totalScenes: 3,
    strings: defaultStrings,
    showProgress: true,
    allowSkip: true,
  };

  const mockCallbacks: AnnotationCallbacks = {
    onCtaClick: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a navigation-only card when scene has no title, description, or CTA', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg' };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card).toBeInstanceOf(HTMLDivElement);
    // No title, no body, no CTA — but nav footer is present
    expect(card.querySelector('.cis-annotation__title')).toBeNull();
    expect(card.querySelector('.cis-annotation__body')).toBeNull();
    expect(card.querySelector('.cis-cta')).toBeNull();
    expect(card.querySelector('.cis-annotation__nav')).not.toBeNull();
  });

  it('renders card with title only', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'Hello' };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card.querySelector('.cis-annotation__title')!.textContent).toBe('Hello');
    expect(card.querySelector('.cis-annotation__body')).toBeNull();
    expect(card.querySelector('.cis-cta')).toBeNull();
  });

  it('renders card with title and description', () => {
    const scene: SpotlightScene = {
      id: 's1', image: 'img.jpg',
      title: 'Title',
      description: 'Description text',
    };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card.querySelector('.cis-annotation__title')!.textContent).toBe('Title');
    expect(card.querySelector('.cis-annotation__body')!.textContent).toBe('Description text');
  });

  it('renders card with CTA only', () => {
    const scene: SpotlightScene = {
      id: 's1', image: 'img.jpg',
      cta: { label: 'Click me' },
    };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card.querySelector('.cis-cta')).not.toBeNull();
  });

  it('has role="status" and aria-live="polite"', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'Test' };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card.getAttribute('role')).toBe('status');
    expect(card.getAttribute('aria-live')).toBe('polite');
  });

  it('applies maxWidth as inline style', () => {
    const scene: SpotlightScene = {
      id: 's1', image: 'img.jpg', title: 'T',
      annotation: { maxWidth: 400 },
    };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card.style.maxWidth).toBe('400px');
  });

  it('does not set maxWidth inline style when not specified', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card.style.maxWidth).toBe('');
  });

  it('adds style variant class for tooltip', () => {
    const scene: SpotlightScene = {
      id: 's1', image: 'img.jpg', title: 'T',
      annotation: { style: 'tooltip' },
    };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card.classList.contains('cis-annotation--tooltip')).toBe(true);
  });

  it('does not add extra class for default "card" style', () => {
    const scene: SpotlightScene = {
      id: 's1', image: 'img.jpg', title: 'T',
      annotation: { style: 'card' },
    };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card.classList.contains('cis-annotation--card')).toBe(false);
  });

  it('renders all text via textContent (never innerHTML)', () => {
    const scene: SpotlightScene = {
      id: 's1', image: 'img.jpg',
      title: '<b>XSS</b>',
      description: '<script>alert(1)</script>',
    };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    expect(card.querySelector('.cis-annotation__title')!.textContent).toBe('<b>XSS</b>');
    expect(card.querySelector('.cis-annotation__title')!.innerHTML).not.toContain('<b>');
    expect(card.querySelector('.cis-annotation__body')!.innerHTML).not.toContain('<script>');
  });

  it('renders title inside .cis-annotation__header', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'Hello' };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    const header = card.querySelector('.cis-annotation__header');
    expect(header).not.toBeNull();
    const title = header!.querySelector('.cis-annotation__title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toBe('Hello');
  });

  it('renders progress pill when showProgress is true', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const opts: AnnotationOptions = { ...defaultOptions, index: 1, totalScenes: 5, showProgress: true };
    const card = createAnnotation(scene, opts, mockCallbacks);
    const progress = card.querySelector('.cis-annotation__progress');
    expect(progress).not.toBeNull();
    expect(progress!.textContent).toBe('2 / 5');
  });

  it('omits progress pill when showProgress is false', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const opts: AnnotationOptions = { ...defaultOptions, showProgress: false };
    const card = createAnnotation(scene, opts, mockCallbacks);
    expect(card.querySelector('.cis-annotation__progress')).toBeNull();
  });

  it('renders close button when allowSkip is true', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const opts: AnnotationOptions = { ...defaultOptions, allowSkip: true };
    const card = createAnnotation(scene, opts, mockCallbacks);
    const closeBtn = card.querySelector('.cis-annotation__close');
    expect(closeBtn).not.toBeNull();
    expect(closeBtn!.getAttribute('aria-label')).toBe(defaultStrings.close);
  });

  it('omits close button when allowSkip is false', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const opts: AnnotationOptions = { ...defaultOptions, allowSkip: false };
    const card = createAnnotation(scene, opts, mockCallbacks);
    expect(card.querySelector('.cis-annotation__close')).toBeNull();
  });

  it('close button calls onSkip callback', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    const closeBtn = card.querySelector('.cis-annotation__close') as HTMLButtonElement;
    closeBtn.click();
    expect(mockCallbacks.onSkip).toHaveBeenCalledTimes(1);
  });

  it('renders nav footer with next button', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    const nav = card.querySelector('.cis-annotation__nav');
    expect(nav).not.toBeNull();
    const nextBtn = nav!.querySelector('.cis-annotation__btn--next');
    expect(nextBtn).not.toBeNull();
  });

  it('does not render prev button on first scene', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const opts: AnnotationOptions = { ...defaultOptions, index: 0 };
    const card = createAnnotation(scene, opts, mockCallbacks);
    expect(card.querySelector('.cis-annotation__btn--prev')).toBeNull();
  });

  it('renders prev button on non-first scene', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const opts: AnnotationOptions = { ...defaultOptions, index: 1 };
    const card = createAnnotation(scene, opts, mockCallbacks);
    const prevBtn = card.querySelector('.cis-annotation__btn--prev');
    expect(prevBtn).not.toBeNull();
    expect(prevBtn!.textContent).toBe(defaultStrings.prev);
  });

  it('prev button calls onPrev callback', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const opts: AnnotationOptions = { ...defaultOptions, index: 1 };
    const card = createAnnotation(scene, opts, mockCallbacks);
    const prevBtn = card.querySelector('.cis-annotation__btn--prev') as HTMLButtonElement;
    prevBtn.click();
    expect(mockCallbacks.onPrev).toHaveBeenCalledTimes(1);
  });

  it('next button calls onNext callback', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const card = createAnnotation(scene, defaultOptions, mockCallbacks);
    const nextBtn = card.querySelector('.cis-annotation__btn--next') as HTMLButtonElement;
    nextBtn.click();
    expect(mockCallbacks.onNext).toHaveBeenCalledTimes(1);
  });

  it('renders finish button on last scene', () => {
    const scene: SpotlightScene = { id: 's1', image: 'img.jpg', title: 'T' };
    const opts: AnnotationOptions = { ...defaultOptions, index: 2, totalScenes: 3 };
    const card = createAnnotation(scene, opts, mockCallbacks);
    const nextBtn = card.querySelector('.cis-annotation__btn--next');
    expect(nextBtn).not.toBeNull();
    expect(nextBtn!.classList.contains('cis-annotation__btn--finish')).toBe(true);
    expect(nextBtn!.getAttribute('aria-label')).toBe(defaultStrings.finish);
  });

  describe('CTA as link', () => {
    it('renders <a> with href, target, and rel', () => {
      const scene: SpotlightScene = {
        id: 's1', image: 'img.jpg',
        cta: { label: 'Learn more', href: 'https://example.com' },
      };
      const card = createAnnotation(scene, defaultOptions, mockCallbacks);
      const link = card.querySelector('.cis-cta') as HTMLAnchorElement;
      expect(link.tagName).toBe('A');
      expect(link.href).toContain('example.com');
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
      expect(link.textContent).toBe('Learn more');
    });
  });

  describe('CTA as button (no href)', () => {
    it('renders <button> that dispatches onCtaClick', () => {
      const scene: SpotlightScene = {
        id: 's1', image: 'img.jpg',
        cta: { label: 'Do something' },
        metadata: { key: 'value' },
      };
      const card = createAnnotation(scene, defaultOptions, mockCallbacks);
      const button = card.querySelector('.cis-cta') as HTMLButtonElement;
      expect(button.tagName).toBe('BUTTON');
      expect(button.textContent).toBe('Do something');

      button.click();

      expect(mockCallbacks.onCtaClick).toHaveBeenCalledTimes(1);
      const detail = mockCallbacks.onCtaClick.mock.calls[0][0];
      expect(detail.scene.id).toBe('s1');
      expect(detail.cta.label).toBe('Do something');
      expect(detail.metadata).toEqual({ key: 'value' });
    });
  });

  describe('CTA href sanitization', () => {
    it('blocks javascript: href and renders as button', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const scene: SpotlightScene = {
        id: 's1', image: 'img.jpg',
        cta: { label: 'Evil', href: 'javascript:alert(1)' },
      };
      const card = createAnnotation(scene, defaultOptions, mockCallbacks);
      const el = card.querySelector('.cis-cta')!;
      expect(el.tagName).toBe('BUTTON'); // Not <a>
      spy.mockRestore();
    });

    it('blocks data: href', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const scene: SpotlightScene = {
        id: 's1', image: 'img.jpg',
        cta: { label: 'Evil', href: 'data:text/html,<h1>XSS</h1>' },
      };
      const card = createAnnotation(scene, defaultOptions, mockCallbacks);
      expect(card.querySelector('.cis-cta')!.tagName).toBe('BUTTON');
      spy.mockRestore();
    });

    it('allows relative href', () => {
      const scene: SpotlightScene = {
        id: 's1', image: 'img.jpg',
        cta: { label: 'Go', href: '/docs/feature' },
      };
      const card = createAnnotation(scene, defaultOptions, mockCallbacks);
      const link = card.querySelector('.cis-cta') as HTMLAnchorElement;
      expect(link.tagName).toBe('A');
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: annotation renders in the element
// ---------------------------------------------------------------------------

describe('Annotation in element', () => {
  const TAG = 'cloudimage-spotlight-annotation';

  beforeAll(() => {
    if (!customElements.get(TAG)) {
      customElements.define(TAG, class extends CloudimageSpotlight {});
    }
  });

  it('renders annotation card for scene with title', async () => {
    const config: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{ id: 's1', image: 'https://example.com/img.jpg', title: 'Welcome' }],
    };
    const el = document.createElement(TAG) as CloudimageSpotlight;
    el.config = config;
    el.setAttribute('eager', '');
    document.body.appendChild(el);

    await vi.waitFor(() => {
      const card = el.shadowRoot!.querySelector('.cis-annotation');
      expect(card).not.toBeNull();
    });

    const title = el.shadowRoot!.querySelector('.cis-annotation__title');
    expect(title!.textContent).toBe('Welcome');

    el.destroy();
    el.remove();
  });

  it('dispatches cis:cta-click for CTA button without href', async () => {
    const config: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{
        id: 's1', image: 'https://example.com/img.jpg',
        cta: { label: 'Click' },
      }],
    };
    const el = document.createElement(TAG) as CloudimageSpotlight;
    el.config = config;
    el.setAttribute('eager', '');
    const handler = vi.fn();
    el.addEventListener('cis:cta-click', handler);
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-cta')).not.toBeNull();
    });

    const ctaBtn = el.shadowRoot!.querySelector('.cis-cta') as HTMLButtonElement;
    ctaBtn.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.cta.label).toBe('Click');

    el.destroy();
    el.remove();
  });

  it('renders zoom image when scene.zoom is true', async () => {
    const config: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [{
        id: 's1', image: 'https://example.com/img.jpg',
        zoom: true,
        regions: [{ tl_x: 0.1, tl_y: 0.2, br_x: 0.5, br_y: 0.6 }],
      }],
    };
    const el = document.createElement(TAG) as CloudimageSpotlight;
    el.config = config;
    el.setAttribute('eager', '');
    document.body.appendChild(el);

    // Zoomed image is created after base image loads (needs natural dimensions)
    await vi.waitFor(() => {
      const base = el.shadowRoot!.querySelector('.cis-image--base') as HTMLImageElement;
      expect(base).not.toBeNull();
    });
    const base = el.shadowRoot!.querySelector('.cis-image--base') as HTMLImageElement;
    // Simulate natural dimensions and fire load
    Object.defineProperty(base, 'naturalWidth', { value: 1920 });
    Object.defineProperty(base, 'naturalHeight', { value: 1080 });
    base.dispatchEvent(new Event('load'));

    await vi.waitFor(() => {
      const zoomed = el.shadowRoot!.querySelector('.cis-image--zoomed');
      expect(zoomed).not.toBeNull();
    });

    const zoomed = el.shadowRoot!.querySelector('.cis-image--zoomed') as HTMLImageElement;
    expect(zoomed.src).toContain('func=crop');

    el.destroy();
    el.remove();
  });

  it('renders blur mode with blurred + sharp images', async () => {
    const config: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      settings: { maskStyle: 'blur' },
      scenes: [{
        id: 's1', image: 'https://example.com/img.jpg',
        regions: [{ tl_x: 0.1, tl_y: 0.2, br_x: 0.5, br_y: 0.6 }],
      }],
    };
    const el = document.createElement(TAG) as CloudimageSpotlight;
    el.config = config;
    el.setAttribute('eager', '');
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-image--blurred')).not.toBeNull();
    });

    const blurred = el.shadowRoot!.querySelector('.cis-image--blurred') as HTMLImageElement;
    const sharp = el.shadowRoot!.querySelector('.cis-image--sharp') as HTMLImageElement;
    expect(blurred.src).toContain('blur=');
    expect(sharp).not.toBeNull();

    // Blur reveal: blurred layer starts hidden, clip-path applied after image load
    expect(blurred.style.opacity).toBe('0');

    // No SVG mask in blur mode
    expect(el.shadowRoot!.querySelector('.cis-mask')).toBeNull();

    el.destroy();
    el.remove();
  });

  it('falls back to sharp image when blur mode has no regions', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      settings: { maskStyle: 'blur' },
      scenes: [{ id: 's1', image: 'https://example.com/img.jpg' }],
    };
    const el = document.createElement(TAG) as CloudimageSpotlight;
    el.config = config;
    el.setAttribute('eager', '');
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.shadowRoot!.querySelector('.cis-image--base')).not.toBeNull();
    });

    expect(el.shadowRoot!.querySelector('.cis-image--blurred')).toBeNull();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('no regions'));
    spy.mockRestore();

    el.destroy();
    el.remove();
  });
});
