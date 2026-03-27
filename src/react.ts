// ---------------------------------------------------------------------------
// React forwardRef wrapper for <cloudimage-spotlight>
// SSR-safe: dynamically imports ./define in useEffect (client-only)
// ---------------------------------------------------------------------------

import {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  createElement,
  type CSSProperties,
} from 'react';
import type {
  SpotlightConfig,
  CISStrings,
  CISReadyDetail,
  CISSceneChangeDetail,
  CISCompleteDetail,
  CISSkipDetail,
  CISCTAClickDetail,
  CISRegionEnterDetail,
  CISErrorDetail,
  CloudimageSpotlightElement,
} from './types';

// ---------------------------------------------------------------------------
// Props interface
// ---------------------------------------------------------------------------

export interface CloudimageSpotlightProps {
  /** Config object or URL string. */
  config?: string | SpotlightConfig;
  /** Color theme. */
  theme?: 'dark' | 'light' | 'auto';
  /** Language code. */
  lang?: string;
  /** Enable autoplay. */
  autoplay?: boolean;
  /** Autoplay interval in ms. */
  autoplayInterval?: number;
  /** Show progress counter. */
  showProgress?: boolean;
  /** Show region badges. */
  showBadges?: boolean;
  /** Show skip button. */
  allowSkip?: boolean;
  /** Show play/pause button for autoplay control. */
  showPlayButton?: boolean;
  /** Enable keyboard navigation. */
  allowKeyboard?: boolean;
  /** Sync current scene to URL hash. */
  syncUrl?: boolean;
  /** Disable lazy loading. */
  eager?: boolean;
  /** i18n string overrides. */
  strings?: Partial<CISStrings>;
  /** Fires when component is ready. */
  onReady?: (detail: CISReadyDetail) => void;
  /** Fires on scene navigation. */
  onSceneChange?: (detail: CISSceneChangeDetail) => void;
  /** Fires when tour reaches the end. */
  onComplete?: (detail: CISCompleteDetail) => void;
  /** Fires when user skips. */
  onSkip?: (detail: CISSkipDetail) => void;
  /** Fires on CTA click. */
  onCtaClick?: (detail: CISCTAClickDetail) => void;
  /** Fires when a scene with regions is entered. */
  onRegionEnter?: (detail: CISRegionEnterDetail) => void;
  /** Fires on error. */
  onError?: (detail: CISErrorDetail) => void;
  /** Additional CSS class. */
  className?: string;
  /** Inline styles. */
  style?: CSSProperties;
  /** Element id. */
  id?: string;
}

// ---------------------------------------------------------------------------
// Stable ref pattern for event callbacks
// ---------------------------------------------------------------------------

function useStableRef<T>(value: T): { current: T } {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

// ---------------------------------------------------------------------------
// Boolean attribute helper
// ---------------------------------------------------------------------------

function boolAttr(value: boolean | undefined): string | undefined {
  return value === true ? '' : undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * React wrapper for the `<cloudimage-spotlight>` Web Component.
 *
 * Props are mapped to HTML attributes/properties. Event callbacks (`on*`)
 * are subscribed via `addEventListener` with stable refs to avoid
 * re-subscription on every render.
 *
 * SSR-safe: the custom element is registered via dynamic import in `useEffect`.
 */
export const CloudimageSpotlightReact = forwardRef<
  CloudimageSpotlightElement,
  CloudimageSpotlightProps
>(function CloudimageSpotlightReact(props, ref) {
  const elRef = useRef<CloudimageSpotlightElement | null>(null);

  // Stable refs for event callbacks (no re-subscription on re-render)
  const onReadyRef = useStableRef(props.onReady);
  const onSceneChangeRef = useStableRef(props.onSceneChange);
  const onCompleteRef = useStableRef(props.onComplete);
  const onSkipRef = useStableRef(props.onSkip);
  const onCtaClickRef = useStableRef(props.onCtaClick);
  const onRegionEnterRef = useStableRef(props.onRegionEnter);
  const onErrorRef = useStableRef(props.onError);

  // Register custom element (SSR-safe: only runs on client)
  useEffect(() => {
    import('./define');
  }, []);

  // Set JS properties that can't be expressed as attributes
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    if (props.config !== undefined) {
      (el as CloudimageSpotlightElement).config = props.config ?? null;
    }
    if (props.strings !== undefined) {
      (el as CloudimageSpotlightElement).strings = props.strings ?? {};
    }
  }, [props.config, props.strings]);

  // Subscribe to events (once, using stable refs)
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const handlers: Array<[string, (e: Event) => void]> = [
      ['cis:ready', (e) => onReadyRef.current?.((e as CustomEvent<CISReadyDetail>).detail)],
      ['cis:scene-change', (e) => onSceneChangeRef.current?.((e as CustomEvent<CISSceneChangeDetail>).detail)],
      ['cis:complete', (e) => onCompleteRef.current?.((e as CustomEvent<CISCompleteDetail>).detail)],
      ['cis:skip', (e) => onSkipRef.current?.((e as CustomEvent<CISSkipDetail>).detail)],
      ['cis:cta-click', (e) => onCtaClickRef.current?.((e as CustomEvent<CISCTAClickDetail>).detail)],
      ['cis:region-enter', (e) => onRegionEnterRef.current?.((e as CustomEvent<CISRegionEnterDetail>).detail)],
      ['cis:error', (e) => onErrorRef.current?.((e as CustomEvent<CISErrorDetail>).detail)],
    ];

    for (const [name, handler] of handlers) {
      el.addEventListener(name, handler);
    }

    return () => {
      for (const [name, handler] of handlers) {
        el.removeEventListener(name, handler);
      }
    };
  }, []);

  // Expose the underlying custom element via ref
  useImperativeHandle(ref, () => elRef.current as CloudimageSpotlightElement, []);

  // Build HTML attributes from props
  const attrs: Record<string, string | undefined> = {};
  if (props.theme) attrs.theme = props.theme;
  if (props.lang) attrs.lang = props.lang;
  if (props.autoplay !== undefined) attrs.autoplay = boolAttr(props.autoplay);
  if (props.autoplayInterval !== undefined) attrs['autoplay-interval'] = String(props.autoplayInterval);
  if (props.showProgress !== undefined) attrs['show-progress'] = boolAttr(props.showProgress);
  if (props.showBadges !== undefined) attrs['show-badges'] = boolAttr(props.showBadges);
  if (props.allowSkip !== undefined) attrs['allow-skip'] = boolAttr(props.allowSkip);
  if (props.showPlayButton !== undefined) attrs['show-play-button'] = boolAttr(props.showPlayButton);
  if (props.allowKeyboard !== undefined) attrs['allow-keyboard'] = boolAttr(props.allowKeyboard);
  if (props.syncUrl !== undefined) attrs['sync-url'] = boolAttr(props.syncUrl);
  if (props.eager !== undefined) attrs.eager = boolAttr(props.eager);
  if (typeof props.config === 'string') attrs.config = props.config;

  // Filter out undefined values
  const cleanAttrs: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined) cleanAttrs[k] = v;
  }

  return createElement('cloudimage-spotlight', {
    ref: elRef,
    id: props.id,
    className: props.className,
    style: props.style,
    ...cleanAttrs,
  });
});
