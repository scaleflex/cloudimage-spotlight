import { describe, it, expect, beforeAll } from 'vitest';
import {
  CISError,
  CloudimageSpotlight,
} from '../src/index';
import type {
  SpotlightConfig,
  SpotlightSettings,
  SpotlightRegion,
  SpotlightAnnotation,
  SpotlightCTA,
  CISStrings,
  SceneImageVariant,
  BoundingBox,
  CISErrorCode,
  CISReadyDetail,
  CISSceneChangeDetail,
  CISCompleteDetail,
  CISSkipDetail,
  CISCTAClickDetail,
  CISRegionEnterDetail,
  CISErrorDetail,
  CloudimageSpotlightElement,
} from '../src/index';

describe('Type definitions compile correctly', () => {
  it('SpotlightConfig accepts a minimal valid config', () => {
    const config: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      scenes: [
        {
          id: 'intro',
          image: 'https://example.com/screenshot.jpg',
        },
      ],
    };
    expect(config.version).toBe('1.0');
    expect(config.scenes).toHaveLength(1);
  });

  it('SpotlightConfig accepts a full config', () => {
    const config: SpotlightConfig = {
      version: '1.0',
      ciToken: 'demo',
      title: 'Feature Tour',
      aspectRatio: '16:9',
      settings: {
        transition: 'fade',
        autoplay: false,
        autoplayInterval: 4000,
        showProgress: true,
        allowSkip: true,
        allowKeyboard: true,
        maskOpacity: 0.65,
        maskColor: '#000000',
        maskStyle: 'color',
        maskBlurRadius: 8,
      } satisfies SpotlightSettings,
      scenes: [
        {
          id: 'scene-1',
          image: 'https://example.com/img.jpg',
          title: 'Welcome',
          description: 'A description',
          regions: [
            {
              tl_x: 0.1,
              tl_y: 0.2,
              br_x: 0.5,
              br_y: 0.6,
              shape: 'rect',
              padding: 0.02,
              label: 'A',
            } satisfies SpotlightRegion,
          ],
          mask: true,
          zoom: true,
          annotation: {
            position: 'auto',
            style: 'card',
            maxWidth: 320,
          } satisfies SpotlightAnnotation,
          cta: {
            label: 'Learn more',
            href: 'https://example.com',
            metadata: { productId: '123' },
          } satisfies SpotlightCTA,
          maskStyle: 'blur',
          metadata: { feature: 'ai-tagging' },
        },
      ],
    };
    expect(config.scenes[0].id).toBe('scene-1');
  });

  it('SceneImageVariant accepts all valid variants', () => {
    const variants: SceneImageVariant[] = [
      'full',
      'zoomed',
      'blurred',
    ];
    expect(variants).toHaveLength(3);
  });

  it('BoundingBox has the correct shape', () => {
    const box: BoundingBox = {
      tl_x: 0,
      tl_y: 0,
      br_x: 1,
      br_y: 1,
      padding: 0.02,
    };
    expect(box.tl_x).toBe(0);
  });

  it('CISError has code and message', () => {
    const error = new CISError('FETCH_FAILED', 'Network error');
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('FETCH_FAILED');
    expect(error.message).toBe('Network error');
    expect(error.name).toBe('CISError');
  });

  it('CISErrorCode accepts all valid codes', () => {
    const codes: CISErrorCode[] = [
      'FETCH_FAILED',
      'INVALID_JSON',
      'MISSING_TOKEN',
      'MISSING_IMAGE',
      'INVALID_REGION',
      'IMAGE_LOAD_FAILED',
    ];
    expect(codes).toHaveLength(6);
  });

  it('Event detail types have correct shapes', () => {
    const ready: CISReadyDetail = {
      totalScenes: 3,
      config: { version: '1.0', ciToken: 'x', scenes: [] },
    };
    expect(ready.totalScenes).toBe(3);

    const change: CISSceneChangeDetail = {
      from: 0,
      to: 1,
      scene: { id: 's', image: 'img' },
      totalScenes: 3,
    };
    expect(change.from).toBe(0);

    const complete: CISCompleteDetail = {
      totalScenes: 3,
      timeSpent: 5000,
      config: { version: '1.0', ciToken: 'x', scenes: [] },
    };
    expect(complete.timeSpent).toBe(5000);

    const skip: CISSkipDetail = {
      atScene: 1,
      scene: { id: 's', image: 'img' },
      totalScenes: 3,
    };
    expect(skip.atScene).toBe(1);

    const ctaClick: CISCTAClickDetail = {
      scene: { id: 's', image: 'img' },
      cta: { label: 'Click' },
      metadata: { key: 'value' },
    };
    expect(ctaClick.cta.label).toBe('Click');

    const regionEnter: CISRegionEnterDetail = {
      scene: { id: 's', image: 'img' },
      regions: [{ tl_x: 0, tl_y: 0, br_x: 1, br_y: 1 }],
    };
    expect(regionEnter.regions).toHaveLength(1);

    const errorDetail: CISErrorDetail = {
      message: 'fail',
      code: 'FETCH_FAILED',
    };
    expect(errorDetail.code).toBe('FETCH_FAILED');
  });

  it('CISStrings has all required keys', () => {
    const strings: CISStrings = {
      prev: 'Previous',
      next: 'Next',
      finish: 'Finish',
      skip: 'Skip tour',
      close: 'Close',
      progress: 'Step {n} of {total}',
      progressShort: '{n} / {total}',
      tourLabel: 'Interactive tour',
      navLabel: 'Experience navigation',
      enterFullscreen: 'Enter fullscreen',
      exitFullscreen: 'Exit fullscreen',
      introStart: 'Start',
      introDefault: 'Learn about {title}',
      outroRestart: 'Watch again',
      outroDefault: 'Tour complete',
      outroGoToStep: 'Go to step {n}',
      playAutoplay: 'Play',
      pauseAutoplay: 'Pause',
      errorTitle: 'Failed to load experience',
    };
    expect(Object.keys(strings)).toHaveLength(19);
  });
});

describe('CloudimageSpotlight class', () => {
  // Register the custom element before tests that instantiate it
  beforeAll(() => {
    if (!customElements.get('cloudimage-spotlight')) {
      customElements.define('cloudimage-spotlight', CloudimageSpotlight);
    }
  });

  it('is a valid custom element constructor', () => {
    expect(CloudimageSpotlight.prototype).toBeInstanceOf(HTMLElement);
  });

  it('has observedAttributes with all 13 attributes', () => {
    const attrs = CloudimageSpotlight.observedAttributes;
    expect(attrs).toContain('config');
    expect(attrs).toContain('ci-token');
    expect(attrs).toContain('theme');
    expect(attrs).toContain('lang');
    expect(attrs).toContain('autoplay');
    expect(attrs).toContain('autoplay-interval');
    expect(attrs).toContain('show-progress');
    expect(attrs).toContain('allow-skip');
    expect(attrs).toContain('allow-keyboard');
    expect(attrs).toContain('sync-url');
    expect(attrs).toContain('eager');
    expect(attrs).toContain('show-badges');
    expect(attrs).toContain('show-play-button');
    expect(attrs).toHaveLength(13);
  });

  it('can be instantiated via document.createElement', () => {
    const el = document.createElement('cloudimage-spotlight') as InstanceType<typeof CloudimageSpotlight>;
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el).toBeInstanceOf(CloudimageSpotlight);
    expect(el.currentIndex).toBe(0);
    expect(el.totalScenes).toBe(0);
    expect(el.isPlaying).toBe(false);
  });

  it('satisfies CloudimageSpotlightElement interface', () => {
    const el = document.createElement('cloudimage-spotlight') as CloudimageSpotlightElement;
    expect(typeof el.next).toBe('function');
    expect(typeof el.prev).toBe('function');
    expect(typeof el.goTo).toBe('function');
    expect(typeof el.goToId).toBe('function');
    expect(typeof el.play).toBe('function');
    expect(typeof el.pause).toBe('function');
    expect(typeof el.destroy).toBe('function');
    expect(typeof el.reload).toBe('function');
  });
});
