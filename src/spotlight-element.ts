import type { SpotlightConfig, SpotlightScene, SpotlightIntro, SpotlightOutro, CISStrings, CISErrorDetail, CISReadyDetail } from './types';
import { CISError } from './types';
import { loadConfig, validateConfig } from './config-loader';
import { resolveStrings, interpolate } from './i18n';
import {
  createNavigationState,
  navigateNext,
  navigatePrev,
  navigateGoTo,
  navigateGoToId,
  createSkipDetail,
  preloadAdjacentScenes,
  type NavigationState,
} from './navigation';
import {
  renderScene as renderSceneDOM,
  checkImageResolution,
  applyStagger,
} from './scene-renderer';
import { updateAnnotation } from './annotation';
import { buildCiUrl } from './url-builder';
import {
  runTransition,
  prefersReducedMotion,
  TRANSITION_ACTIVE_CLASS,
  type TransitionDirection,
} from './transitions';
import { createAutoplayController, type AutoplayController } from './autoplay';
import { createSkeleton, setLoadingPhase } from './loading';
import { createKeyboardController, type KeyboardController } from './keyboard';
import { hideDecorativeElements } from './a11y';
import { createDeepLinkController, type DeepLinkController } from './deep-link';
import { createResponsiveController, type ResponsiveController } from './responsive';
import { createFullscreenController, type FullscreenController } from './fullscreen';
import { iconFullscreen, iconFullscreenExit, iconPlay, iconPause } from './icons';
import cssText from './styles/spotlight.css?inline';

// ---------------------------------------------------------------------------
// Shared constructable stylesheet (singleton across all instances)
// ---------------------------------------------------------------------------

let sharedSheet: CSSStyleSheet | null = null;

function getSheet(): CSSStyleSheet {
  if (!sharedSheet) {
    sharedSheet = new CSSStyleSheet();
    sharedSheet.replaceSync(cssText);
  }
  return sharedSheet;
}

// ---------------------------------------------------------------------------
// Instance counter for unique SVG mask IDs
// ---------------------------------------------------------------------------

let instanceCounter = 0;

// ---------------------------------------------------------------------------
// Observed attributes
// ---------------------------------------------------------------------------

const OBSERVED_ATTRIBUTES = [
  'config',
  'ci-token',
  'theme',
  'lang',
  'autoplay',
  'autoplay-interval',
  'show-progress',
  'show-badges',
  'allow-skip',
  'show-play-button',
  'allow-keyboard',
  'sync-url',
  'eager',
] as const;

// ---------------------------------------------------------------------------
// CloudimageSpotlight element
// ---------------------------------------------------------------------------

export class CloudimageSpotlight extends HTMLElement {
  static get observedAttributes(): string[] {
    return [...OBSERVED_ATTRIBUTES];
  }

  // --- Internal state ---
  private _initialized = false;
  private _destroyed = false;
  private _failed = false;
  private _currentIndex = 0;
  private _config: SpotlightConfig | null = null;
  private _configProperty: SpotlightConfig | string | null = null;
  private _isPlaying = false;
  private _strings: Partial<CISStrings> = {};
  private _resolvedStrings: CISStrings = resolveStrings();
  private _instanceId: string;

  // --- Navigation + rendering ---
  private _navState: NavigationState | null = null;
  private _stage: HTMLDivElement | null = null;
  private _readyDispatched = false;
  private _resolutionChecked = false;
  private _cachedNavCallbacks: import('./navigation').NavigationCallbacks | null = null;

  // --- Transitions + autoplay + keyboard + deep-link + fullscreen ---
  private _cancelTransition: (() => void) | null = null;
  private _cancelStagger: (() => void) | null = null;
  private _autoplayController: AutoplayController | null = null;
  private _keyboardController: KeyboardController | null = null;
  private _deepLinkController: DeepLinkController | null = null;
  private _responsiveController: ResponsiveController | null = null;
  private _fullscreenController: FullscreenController | null = null;
  private _fullscreenBtn: HTMLButtonElement | null = null;
  private _playBtn: HTMLButtonElement | null = null;
  private _isFullscreen = false;
  private _pendingResize = false;
  private _zoomActive = false;
  private _resizeRafId: number | null = null;
  private _introVisible = false;
  private _introEl: HTMLDivElement | null = null;
  private _introKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private _outroVisible = false;
  private _outroEl: HTMLDivElement | null = null;
  private _outroKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  // --- Lifecycle resources (cleaned up on disconnect/destroy) ---
  private _abortController: AbortController | null = null;
  private _intersectionObserver: IntersectionObserver | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _root: HTMLDivElement | null = null;

  constructor() {
    super();
    this._instanceId = `cis-${instanceCounter++}`;
  }

  // ---------------------------------------------------------------------------
  // Public read-only state
  // ---------------------------------------------------------------------------

  get currentIndex(): number {
    return this._currentIndex;
  }

  get totalScenes(): number {
    return this._config?.scenes.length ?? 0;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get currentScene(): SpotlightScene | undefined {
    return this._config?.scenes[this._currentIndex];
  }

  get instanceId(): string {
    return this._instanceId;
  }

  get isFullscreen(): boolean {
    return this._isFullscreen;
  }

  // ---------------------------------------------------------------------------
  // Strings property (i18n)
  // ---------------------------------------------------------------------------

  get strings(): Partial<CISStrings> {
    return this._strings;
  }

  set strings(value: Partial<CISStrings>) {
    this._strings = value;
    this._resolvedStrings = resolveStrings(value);
    // Re-render visible UI strings in annotation card
    if (this._stage && this._navState) {
      const card = this._stage.querySelector('.cis-annotation') as HTMLDivElement | null;
      if (card) {
        const config = this._config;
        updateAnnotation(card, {
          index: this._currentIndex,
          totalScenes: this._navState.totalScenes,
          strings: this._resolvedStrings,
          showProgress: this._getBoolAttr('show-progress', config?.settings?.showProgress ?? true),
          allowSkip: this._getBoolAttr('allow-skip', config?.settings?.allowSkip ?? false),
        });
      }
    }
    if (this._root) {
      this._root.setAttribute('aria-roledescription', this._resolvedStrings.tourLabel);
    }
  }

  // ---------------------------------------------------------------------------
  // Config property (highest priority config source)
  // ---------------------------------------------------------------------------

  get config(): SpotlightConfig | string | null {
    return this._configProperty;
  }

  set config(value: SpotlightConfig | string | null) {
    this._configProperty = value;
    if (this._initialized && !this._destroyed) {
      // Config changed after init — reload
      if (typeof value === 'object' && value !== null) {
        this.reload(value).catch(() => { /* errors dispatched via cis:error */ });
      } else if (typeof value === 'string') {
        this.setAttribute('config', value);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // connectedCallback
  // ---------------------------------------------------------------------------

  connectedCallback(): void {
    if (this._destroyed) return;

    if (this._initialized) {
      // Re-mount after reparenting: re-attach observers, resume state
      this._attachObservers();
      return;
    }

    this._initialized = true;

    // Attach Shadow DOM with constructable stylesheet
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.adoptedStyleSheets = [getSheet()];

    // Set tabindex for keyboard focus
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }

    // Build initial shell DOM
    this._root = document.createElement('div');
    this._root.className = 'cis-root cis-loading';
    this._root.setAttribute('role', 'region');
    this._root.setAttribute('aria-roledescription', this._resolvedStrings.tourLabel);

    // Skeleton loading placeholder
    this._root.appendChild(createSkeleton());

    // Stage container (empty for now, filled in Stage 4)
    const stage = document.createElement('div');
    stage.className = 'cis-stage';
    this._root.appendChild(stage);

    // Slot for inline <script type="application/json">
    const slot = document.createElement('slot');
    shadow.appendChild(this._root);
    shadow.appendChild(slot);

    // Determine if we should defer init (lazy loading)
    const shouldDefer = this._shouldDeferInit();

    if (shouldDefer) {
      this._setupLazyLoading();
    } else {
      this._initConfig();
    }
  }

  // ---------------------------------------------------------------------------
  // disconnectedCallback
  // ---------------------------------------------------------------------------

  disconnectedCallback(): void {
    if (this._destroyed) return;
    this._teardownObservers();
    this._abortPendingFetch();
    this._cancelPendingTransition();
    if (this._cancelStagger) { this._cancelStagger(); this._cancelStagger = null; }
    this._keyboardController?.detach();
    this._deepLinkController?.detach();

    // Pause autoplay but preserve controller (resume on reconnect)
    if (this._autoplayController?.isPlaying()) {
      this._autoplayController.pause();
      this._isPlaying = false;
    }
    // Shadow DOM preserved — connectedCallback will resume on re-mount
  }

  // ---------------------------------------------------------------------------
  // attributeChangedCallback
  // ---------------------------------------------------------------------------

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (!this._initialized || this._destroyed || oldValue === newValue) return;

    switch (name) {
      case 'config':
        // Only reload from URL if no JS property is set
        if (!this._configProperty && newValue) {
          this._initConfig();
        }
        break;
      case 'theme':
      case 'lang':
        // Theme is handled by CSS :host([theme=...]) selectors — no JS needed
        // Lang: future — update resolved strings
        break;
      case 'autoplay':
        if (newValue !== null && !this._isPlaying) {
          this.play();
        } else if (newValue === null && this._isPlaying) {
          this.pause();
        }
        break;
      case 'autoplay-interval': {
        const ms = parseInt(newValue || '', 10);
        if (ms > 0 && this._autoplayController) {
          this._autoplayController.setInterval(ms);
        }
        break;
      }
      case 'allow-keyboard':
        if (this._keyboardController) {
          this._keyboardController.setEnabled(newValue !== 'false');
        }
        break;
      case 'allow-skip':
        if (this._config) this._renderCurrentScene(this._config);
        break;
      case 'show-badges':
        if (this._config) this._renderCurrentScene(this._config);
        break;
      case 'show-progress':
      case 'sync-url':
        // Future: toggle features
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation methods
  // ---------------------------------------------------------------------------

  next(): void {
    if (this._destroyed || this._failed || this._introVisible || this._outroVisible || !this._navState || !this._config) return;
    navigateNext(this._navState, this._config, this._getNavCallbacks());
  }

  prev(): void {
    if (this._destroyed || this._failed || this._introVisible || this._outroVisible || !this._navState || !this._config) return;
    navigatePrev(this._navState, this._config, this._getNavCallbacks());
  }

  goTo(index: number): void {
    if (this._destroyed || this._failed || this._introVisible || !this._navState || !this._config) return;
    // Clear outro if navigating away (e.g., restart from outro)
    if (this._outroVisible) this._clearOutro();
    navigateGoTo(index, this._navState, this._config, this._getNavCallbacks());
  }

  goToId(id: string): void {
    if (this._destroyed || this._failed || this._introVisible || !this._navState || !this._config) return;
    if (this._outroVisible) this._clearOutro();
    navigateGoToId(id, this._navState, this._config, this._getNavCallbacks());
  }

  // ---------------------------------------------------------------------------
  // Playback methods
  // ---------------------------------------------------------------------------

  play(): void {
    if (this._destroyed || this._failed || !this._config) return;
    this._ensureAutoplayController();
    this._autoplayController!.play();
    this._isPlaying = true;
    this._syncPlayButton();
  }

  pause(): void {
    if (this._destroyed || this._failed) return;
    this._autoplayController?.pause();
    this._isPlaying = false;
    this._syncPlayButton();
  }

  // ---------------------------------------------------------------------------
  // Fullscreen methods
  // ---------------------------------------------------------------------------

  async enterFullscreen(): Promise<void> {
    if (this._destroyed || this._failed) return;
    await this._fullscreenController?.enter();
  }

  async exitFullscreen(): Promise<void> {
    if (this._destroyed || this._failed) return;
    await this._fullscreenController?.exit();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle: destroy
  // ---------------------------------------------------------------------------

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this._isPlaying = false;
    this._teardownObservers();
    this._abortPendingFetch();
    this._cancelPendingTransition();
    if (this._cancelStagger) { this._cancelStagger(); this._cancelStagger = null; }
    this._autoplayController?.destroy();
    this._autoplayController = null;
    this._keyboardController?.detach();
    this._keyboardController = null;
    this._deepLinkController?.detach();
    this._deepLinkController = null;
    this._responsiveController?.destroy();
    this._responsiveController = null;
    this._fullscreenController?.destroy();
    this._fullscreenController = null;
    this._fullscreenBtn = null;
    this._playBtn = null;
    this._isFullscreen = false;
    this._introVisible = false;
    this._introEl?.remove();
    this._introEl = null;
    if (this._introKeyHandler) {
      this.removeEventListener('keydown', this._introKeyHandler);
      this._introKeyHandler = null;
    }
    this._clearOutro();

    if (this._resizeRafId !== null) {
      cancelAnimationFrame(this._resizeRafId);
      this._resizeRafId = null;
    }

    // Clear Shadow DOM
    if (this.shadowRoot) {
      while (this.shadowRoot.firstChild) {
        this.shadowRoot.removeChild(this.shadowRoot.firstChild);
      }
    }
    this._root = null;
    this._stage = null;
    this._navState = null;
    this._cachedNavCallbacks = null;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle: reload
  // ---------------------------------------------------------------------------

  async reload(config?: SpotlightConfig): Promise<void> {
    if (this._destroyed) {
      this._destroyed = false;
      // Rebuild Shadow DOM shell if it was cleared by destroy()
      this._rebuildShadowShell();
    }
    this._failed = false;
    this._currentIndex = 0;
    this._cancelPendingTransition();
    if (this._cancelStagger) { this._cancelStagger(); this._cancelStagger = null; }
    this._autoplayController?.destroy();
    this._autoplayController = null;
    this._deepLinkController?.detach();
    this._deepLinkController = null;
    this._responsiveController?.destroy();
    this._responsiveController = null;
    this._fullscreenController?.destroy();
    this._fullscreenController = null;
    this._fullscreenBtn?.remove();
    this._fullscreenBtn = null;
    this._playBtn?.remove();
    this._playBtn = null;
    this._isFullscreen = false;
    this._introVisible = false;
    this._introEl?.remove();
    this._introEl = null;
    if (this._introKeyHandler) {
      this.removeEventListener('keydown', this._introKeyHandler);
      this._introKeyHandler = null;
    }
    this._clearOutro();

    this._isPlaying = false;
    this._cachedNavCallbacks = null;

    if (config) {
      try {
        this._config = validateConfig(config);
      } catch (err) {
        this._handleError(err);
        throw err;
      }
      this._renderConfig(this._config);
    } else {
      await this._initConfig();
    }
  }

  /**
   * Rebuild the Shadow DOM shell after destroy() cleared it.
   */
  private _rebuildShadowShell(): void {
    if (!this.shadowRoot) return;

    this._root = document.createElement('div');
    this._root.className = 'cis-root cis-loading';
    this._root.setAttribute('role', 'region');
    this._root.setAttribute('aria-roledescription', this._resolvedStrings.tourLabel);

    this._root.appendChild(createSkeleton());

    const stage = document.createElement('div');
    stage.className = 'cis-stage';
    this._root.appendChild(stage);

    const slot = document.createElement('slot');
    this.shadowRoot.appendChild(this._root);
    this.shadowRoot.appendChild(slot);
  }

  // ---------------------------------------------------------------------------
  // Private: Config initialization
  // ---------------------------------------------------------------------------

  private async _initConfig(): Promise<void> {
    this._abortPendingFetch();
    this._abortController = new AbortController();

    try {
      const config = await this._resolveConfig(this._abortController.signal);
      this._config = config;
      this._failed = false;

      // Update aria-label from config title
      if (config.title && this._root) {
        this._root.setAttribute('aria-label', config.title);
      }

      // Initialize navigation and render first scene
      this._renderConfig(config);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      this._handleError(err);
    }
  }

  /**
   * Resolve config from: JS property > inline JSON > URL attribute
   */
  private async _resolveConfig(signal: AbortSignal): Promise<SpotlightConfig> {
    // 1. JS property (highest priority)
    if (this._configProperty) {
      if (typeof this._configProperty === 'object') {
        return validateConfig(this._configProperty);
      }
      // String property treated as URL
      return loadConfig(this._configProperty, signal);
    }

    // 2. Inline <script type="application/json">
    const inlineScript = this.querySelector('script[type="application/json"]');
    if (inlineScript) {
      let json: unknown;
      try {
        json = JSON.parse(inlineScript.textContent || '');
      } catch {
        throw new CISError('INVALID_JSON', 'Inline <script type="application/json"> contains invalid JSON');
      }
      return validateConfig(json);
    }

    // 3. config URL attribute
    const configUrl = this.getAttribute('config');
    if (configUrl) {
      return loadConfig(configUrl, signal);
    }

    throw new CISError('INVALID_JSON', 'No config provided. Use the config attribute, inline JSON, or config property.');
  }

  // ---------------------------------------------------------------------------
  // Private: Lazy loading
  // ---------------------------------------------------------------------------

  private _shouldDeferInit(): boolean {
    // Don't defer if eager attribute is set
    if (this.hasAttribute('eager')) return false;

    // Don't defer if deep-link hash matches this component
    if (this._hasMatchingDeepLink()) return false;

    return true;
  }

  /**
   * Resolve the deep-linked scene index from URL hash.
   * Returns the scene index (0-based), or -1 if no match / not found.
   */
  private _getDeepLinkIndex(config: SpotlightConfig): number {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash) return -1;

    const id = this.getAttribute('id');
    let sceneId: string | null = null;

    if (id && hash.startsWith(`#${id}:`)) {
      sceneId = hash.slice(id.length + 2); // skip `#{id}:`
    } else if (!id && hash.startsWith('#cis-')) {
      sceneId = hash.slice(5); // skip `#cis-`
    }

    if (!sceneId) return -1;

    const sceneIndex = config.scenes.findIndex((s) => s.id === sceneId);
    if (sceneIndex === -1) {
      console.warn(`[cloudimage-spotlight] Deep link scene "${sceneId}" not found in config. Starting at scene 0.`);
    }
    return sceneIndex;
  }

  private _hasMatchingDeepLink(): boolean {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash) return false;

    const id = this.getAttribute('id');
    if (id) {
      return hash.startsWith(`#${id}:`);
    }
    return hash.startsWith('#cis-');
  }

  private _setupLazyLoading(): void {
    this._intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this._intersectionObserver?.disconnect();
            this._intersectionObserver = null;
            if (!this._destroyed) {
              this._initConfig();
            }
            break;
          }
        }
      },
      { threshold: 0.1, rootMargin: '200px' },
    );
    this._intersectionObserver.observe(this);
  }

  // ---------------------------------------------------------------------------
  // Private: Scene rendering
  // ---------------------------------------------------------------------------

  private _renderConfig(config: SpotlightConfig): void {
    this._navState = createNavigationState(config);
    this._currentIndex = 0;
    this._readyDispatched = false;
    this._introVisible = false;
    this._clearOutro();

    // Transition from loading → ready
    if (this._root) {
      setLoadingPhase(this._root, 'ready');
    }

    // Get or create stage
    this._stage = this._root?.querySelector('.cis-stage') as HTMLDivElement | null;

    // Navigate to deep-linked scene before first render (so cis:ready reflects actual initial scene)
    const deepLinkIndex = this._getDeepLinkIndex(config);
    if (deepLinkIndex >= 0) {
      this._navState!.currentIndex = deepLinkIndex;
      this._currentIndex = deepLinkIndex;
    }

    // Set up fullscreen controller (before controls, so the button can be added)
    this._setupFullscreen();

    // Set up play/pause button (after fullscreen, positioned to its left)
    this._setupPlayButton(config);

    // Determine if intro screen should be shown
    const shouldAutoplay = this.hasAttribute('autoplay') || config.settings?.autoplay;
    const hasDeepLink = deepLinkIndex >= 0;
    const introSetting = config.settings?.intro;
    const shouldShowIntro = !!introSetting && !shouldAutoplay && !hasDeepLink;

    if (shouldShowIntro) {
      // Intro mode: show clean scene-0 image + welcome card, hide controls
      this._renderIntro(config);
    } else {
      // Normal mode: render first scene directly (controls are inside annotation)
      this._renderCurrentScene(config);
    }

    // Dispatch cis:ready after DOM is built
    if (!this._readyDispatched) {
      this._readyDispatched = true;
      this._dispatchEvent<CISReadyDetail>('cis:ready', {
        totalScenes: this._navState!.totalScenes,
        config,
      });

      // Dispatch cis:region-enter for initial scene if it has regions (only if not in intro)
      if (!this._introVisible) {
        const initialScene = config.scenes[this._currentIndex];
        if (initialScene.regions && initialScene.regions.length > 0) {
          this._dispatchEvent('cis:region-enter', {
            scene: initialScene,
            regions: initialScene.regions,
          });
        }
      }
    }

    // Set up responsive controller (mobile breakpoint)
    this._setupResponsive();

    // Set up deep linking
    this._setupDeepLink(config);

    // Set up ResizeObserver on root
    this._setupResizeObserver();

    // Set up keyboard navigation (disabled during intro — re-enabled on dismiss)
    this._setupKeyboard(config);
    if (this._introVisible) {
      this._keyboardController?.setEnabled(false);
    }

    // Start autoplay if configured
    if (shouldAutoplay) {
      this.play();
    }
  }

  private _renderCurrentScene(config: SpotlightConfig): void {
    if (!this._stage || !this._navState) return;

    // Reset zoom suppression — navigating away mid-zoom would otherwise
    // leave _zoomActive=true permanently (onZoomFinish never fires).
    this._zoomActive = false;

    const scene = config.scenes[this._navState.currentIndex];
    this._currentIndex = this._navState.currentIndex;

    const staggerEntry = config.settings?.staggerEntry !== false;
    const staggerDelay = config.settings?.staggerDelay ?? 600;
    const staggerAnimDuration = config.settings?.staggerAnimationDuration ?? 500;
    const stageRef = this._stage;

    // Cancel any in-flight stagger timer from a previous scene
    if (this._cancelStagger) {
      this._cancelStagger();
      this._cancelStagger = null;
    }

    // Set CSS custom properties for stagger timing (consumed by CSS animations)
    if (staggerEntry) {
      stageRef.style.setProperty('--cis-stagger-delay-mask', `${staggerDelay}ms`);
      stageRef.style.setProperty('--cis-stagger-delay-badge', `${staggerDelay + 300}ms`);
      stageRef.style.setProperty('--cis-stagger-delay-annotation', `${staggerDelay + 450}ms`);
      stageRef.style.setProperty('--cis-stagger-delay-connector', `${staggerDelay + 600}ms`);
      stageRef.style.setProperty('--cis-stagger-duration', `${staggerAnimDuration}ms`);
    }

    const showBadges = this._getBoolAttr('show-badges', config.settings?.showBadges ?? true);
    const showProgress = this._getBoolAttr('show-progress', config.settings?.showProgress ?? true);
    const allowSkip = this._getBoolAttr('allow-skip', config.settings?.allowSkip ?? false);

    renderSceneDOM(scene, this._navState.currentIndex, this._navState.totalScenes, {
      config,
      stage: this._stage,
      containerWidth: this._getContainerWidth(),
      dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      strings: this._resolvedStrings,
      instanceId: this._instanceId,
      isRTL: this._isRTL(),
      showBadges,
      showProgress,
      allowSkip,
      staggerEntry,
      reservedRects: this._getActionButtonsRect(),
      onPrev: () => this.prev(),
      onNext: () => this.next(),
      onSkip: () => this._handleSkip(),
      onImageLoad: (img, loadedScene) => {
        // Resolution check on first image load (regardless of scene index)
        if (!this._resolutionChecked) {
          this._resolutionChecked = true;
          checkImageResolution(img, loadedScene.id);
        }

        // Trigger staggered entry after image loads.
        // The .cis-scene-stagger class is already on the stage (applied by renderScene),
        // so overlays are hidden from the start. applyStagger triggers the CSS animations
        // which use animation-delay via --cis-stagger-delay-* custom properties.
        if (staggerEntry) {
          this._cancelStagger = applyStagger(stageRef);
        }

        // Preload adjacent scenes
        preloadAdjacentScenes(
          this._navState!,
          config,
          this._getContainerWidth(),
          typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        );
      },
      onImageError: (_scene, detail) => {
        this._dispatchEvent<CISErrorDetail>('cis:error', detail);
        // Show overlays instantly on error (stagger waits for load which won't come)
        if (staggerEntry) {
          if (this._cancelStagger) { this._cancelStagger(); this._cancelStagger = null; }
          stageRef.classList.remove('cis-scene-stagger', 'cis-scene-stagger-active');
        }
      },
      onCtaClick: (detail) => {
        this._dispatchEvent<import('./types').CISCTAClickDetail>('cis:cta-click', detail);
      },
      onZoomStart: () => { this._zoomActive = true; },
      onZoomFinish: () => {
        this._zoomActive = false;
        // Re-evaluate responsive layout after zoom appends the annotation
        this._responsiveController?.evaluate();
        // Apply any resize that was queued during zoom
        if (this._pendingResize) {
          this._pendingResize = false;
          this._handleResize();
        }
      },
    });

    // Mark decorative overlay elements as aria-hidden
    hideDecorativeElements(this._stage);

    // Re-evaluate responsive layout (annotation may have moved)
    this._responsiveController?.evaluate();
  }

  /**
   * Render the intro/welcome screen: clean scene-0 image + welcome card overlay.
   * Controls are hidden until the user dismisses the intro.
   */
  private _renderIntro(config: SpotlightConfig): void {
    if (!this._stage || !this._root) return;

    this._introVisible = true;

    // Render scene-0 base image only (no overlays, no mask, no annotation)
    const scene = config.scenes[0];
    this._stage.textContent = '';
    const img = document.createElement('img');
    img.className = 'cis-image cis-image--base';
    img.src = buildCiUrl(scene.image, config.ciToken, 'full', undefined, this._getContainerWidth(), typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    img.alt = scene.title || '';
    img.draggable = false;
    this._stage.appendChild(img);

    // Build intro overlay
    const introSetting = config.settings?.intro;
    const introConfig: SpotlightIntro = typeof introSetting === 'object' ? introSetting : {};
    const introTitle = introConfig.title || (config.title ? interpolate(this._resolvedStrings.introDefault, { title: config.title }) : this._resolvedStrings.tourLabel);
    const introDescription = introConfig.description;
    const startLabel = introConfig.startLabel || this._resolvedStrings.introStart;

    const introEl = document.createElement('div');
    introEl.className = 'cis-screen-overlay cis-intro';
    introEl.setAttribute('role', 'dialog');
    introEl.setAttribute('aria-modal', 'true');
    introEl.setAttribute('aria-label', introTitle);

    const card = document.createElement('div');
    card.className = 'cis-screen-card';

    const title = document.createElement('p');
    title.className = 'cis-screen-card__title';
    title.textContent = introTitle;
    card.appendChild(title);

    if (introDescription) {
      const desc = document.createElement('p');
      desc.className = 'cis-screen-card__description';
      desc.textContent = introDescription;
      card.appendChild(desc);
    }

    const startBtn = document.createElement('button');
    startBtn.className = 'cis-screen-card__btn';
    startBtn.setAttribute('type', 'button');
    startBtn.textContent = startLabel;
    startBtn.addEventListener('click', () => this._dismissIntro(config));
    card.appendChild(startBtn);

    introEl.appendChild(card);
    this._root.appendChild(introEl);
    this._introEl = introEl;

    // Escape key dismisses intro
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        this._dismissIntro(config);
      }
    };
    this.addEventListener('keydown', onKeydown);
    // Store ref so _dismissIntro can remove the listener
    this._introKeyHandler = onKeydown;

    // Focus the start button for keyboard users
    requestAnimationFrame(() => startBtn.focus());
  }

  /**
   * Dismiss the intro screen and transition to the full first scene with stagger.
   */
  private _dismissIntro(config: SpotlightConfig): void {
    if (!this._introVisible || !this._introEl) return;
    this._introVisible = false;

    // Remove Escape key handler
    if (this._introKeyHandler) {
      this.removeEventListener('keydown', this._introKeyHandler);
      this._introKeyHandler = null;
    }

    // Fade out intro overlay
    this._introEl.classList.add('cis-intro--hidden');
    const introRef = this._introEl;
    setTimeout(() => introRef.remove(), 400);
    this._introEl = null;

    // Reset tour timer — intro idle time shouldn't count toward timeSpent
    if (this._navState) {
      this._navState.startTime = Date.now();
    }

    // Re-enable keyboard navigation
    this._keyboardController?.setEnabled(true);

    // Render the full first scene with stagger (controls are inside annotation)
    this._renderCurrentScene(config);

    // Dispatch region-enter for the first scene
    const scene = config.scenes[this._currentIndex];
    if (scene.regions && scene.regions.length > 0) {
      this._dispatchEvent('cis:region-enter', {
        scene,
        regions: scene.regions,
      });
    }
  }

  /**
   * Show the outro/completion screen over the last scene.
   */
  private _showOutro(config: SpotlightConfig): void {
    if (!this._root || this._outroVisible) return;

    this._outroVisible = true;

    const outroSetting = config.settings?.outro;
    const outroConfig: SpotlightOutro = typeof outroSetting === 'object' ? outroSetting : {};
    const outroTitle = outroConfig.title || this._resolvedStrings.outroDefault;
    const outroDescription = outroConfig.description;
    const restartLabel = outroConfig.restartLabel || this._resolvedStrings.outroRestart;

    const outroEl = document.createElement('div');
    outroEl.className = 'cis-screen-overlay cis-outro';
    outroEl.setAttribute('role', 'dialog');
    outroEl.setAttribute('aria-modal', 'true');
    outroEl.setAttribute('aria-label', outroTitle);

    const card = document.createElement('div');
    card.className = 'cis-screen-card';

    const title = document.createElement('p');
    title.className = 'cis-screen-card__title';
    title.textContent = outroTitle;
    card.appendChild(title);

    if (outroDescription) {
      const desc = document.createElement('p');
      desc.className = 'cis-screen-card__description';
      desc.textContent = outroDescription;
      card.appendChild(desc);
    }

    const restartBtn = document.createElement('button');
    restartBtn.className = 'cis-screen-card__btn';
    restartBtn.setAttribute('type', 'button');
    restartBtn.textContent = restartLabel;
    restartBtn.addEventListener('click', () => this._dismissOutro(config));
    card.appendChild(restartBtn);

    // Scene navigation for direct jump-to-step
    const sceneNav = outroConfig.sceneNav;
    if (sceneNav && config.scenes.length > 0) {
      if (sceneNav === 'list') {
        const list = document.createElement('div');
        list.className = 'cis-outro-list';
        list.setAttribute('role', 'list');
        list.setAttribute('aria-label', 'Scenes');

        config.scenes.forEach((scene, i) => {
          const item = document.createElement('button');
          item.className = 'cis-outro-list__item';
          item.setAttribute('type', 'button');
          item.setAttribute('role', 'listitem');
          item.setAttribute(
            'aria-label',
            scene.title || interpolate(this._resolvedStrings.outroGoToStep, { n: i + 1 }),
          );
          item.addEventListener('click', () => {
            this._clearOutro();
            this.goTo(i);
          });

          const number = document.createElement('span');
          number.className = 'cis-outro-list__number';
          number.textContent = `${i + 1}`;
          item.appendChild(number);

          const title = document.createElement('span');
          title.className = 'cis-outro-list__title';
          title.textContent = scene.title || interpolate(this._resolvedStrings.outroGoToStep, { n: i + 1 });
          item.appendChild(title);

          const thumb = document.createElement('img');
          thumb.className = 'cis-outro-list__thumb';
          thumb.src = buildCiUrl(scene.image, config.ciToken, 'full', undefined, 120, 1);
          thumb.alt = '';
          thumb.loading = 'lazy';
          thumb.draggable = false;
          item.appendChild(thumb);

          list.appendChild(item);
        });

        card.appendChild(list);
      } else {
        // Grid mode
        const cols = Math.min(4, Math.max(2, outroConfig.sceneGridColumns ?? 3));
        const grid = document.createElement('div');
        grid.className = 'cis-outro-grid';
        grid.style.setProperty('--cis-outro-grid-cols', String(cols));
        grid.setAttribute('role', 'list');
        grid.setAttribute('aria-label', 'Scenes');

        config.scenes.forEach((scene, i) => {
          const item = document.createElement('button');
          item.className = 'cis-outro-grid__item';
          item.setAttribute('type', 'button');
          item.setAttribute('role', 'listitem');
          item.setAttribute(
            'aria-label',
            scene.title || interpolate(this._resolvedStrings.outroGoToStep, { n: i + 1 }),
          );
          item.addEventListener('click', () => {
            this._clearOutro();
            this.goTo(i);
          });

          const thumb = document.createElement('img');
          thumb.className = 'cis-outro-grid__thumb';
          thumb.src = buildCiUrl(scene.image, config.ciToken, 'full', undefined, 200, 1);
          thumb.alt = scene.title || `Step ${i + 1}`;
          thumb.loading = 'lazy';
          thumb.draggable = false;
          item.appendChild(thumb);

          const label = document.createElement('span');
          label.className = 'cis-outro-grid__label';
          label.textContent = scene.title || `${i + 1}`;
          item.appendChild(label);

          grid.appendChild(item);
        });

        card.appendChild(grid);
      }
    }

    outroEl.appendChild(card);
    this._root.appendChild(outroEl);
    this._outroEl = outroEl;

    // Fade in on next frame
    requestAnimationFrame(() => outroEl.classList.add('cis-outro--visible'));

    // Disable keyboard navigation during outro
    this._keyboardController?.setEnabled(false);

    // Escape key dismisses outro (restarts)
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        this._dismissOutro(config);
      }
    };
    this.addEventListener('keydown', onKeydown);
    this._outroKeyHandler = onKeydown;

    // Focus the restart button
    requestAnimationFrame(() => restartBtn.focus());
  }

  /**
   * Dismiss the outro screen and restart the tour from scene 0.
   */
  private _dismissOutro(config: SpotlightConfig): void {
    if (!this._outroVisible || !this._outroEl) return;
    this._outroVisible = false;

    // Remove Escape key handler
    if (this._outroKeyHandler) {
      this.removeEventListener('keydown', this._outroKeyHandler);
      this._outroKeyHandler = null;
    }

    // Remove outro overlay
    this._outroEl.classList.remove('cis-outro--visible');
    const outroRef = this._outroEl;
    setTimeout(() => outroRef.remove(), 400);
    this._outroEl = null;

    // Re-enable keyboard navigation
    this._keyboardController?.setEnabled(true);

    // Restart tour from scene 0
    this.goTo(0);
  }

  /**
   * Instantly remove the outro overlay (no animation). Used by goTo/goToId.
   */
  private _clearOutro(): void {
    if (!this._outroVisible && !this._outroEl) return;
    this._outroVisible = false;
    this._outroEl?.remove();
    this._outroEl = null;
    if (this._outroKeyHandler) {
      this.removeEventListener('keydown', this._outroKeyHandler);
      this._outroKeyHandler = null;
    }
    this._keyboardController?.setEnabled(true);
  }

  private _getNavCallbacks() {
    if (!this._cachedNavCallbacks) {
      this._cachedNavCallbacks = {
        onSceneChange: (detail: import('./types').CISSceneChangeDetail) => {
          const direction: TransitionDirection = detail.to > detail.from ? 'forward' : 'backward';
          this._transitionToScene(direction, () => {
            this._currentIndex = detail.to;
            this._dispatchEvent('cis:scene-change', detail);
            const scene = detail.scene;
            if (scene.regions && scene.regions.length > 0) {
              this._dispatchEvent('cis:region-enter', {
                scene,
                regions: scene.regions,
              });
            }
            // Sync URL hash
            if (this._deepLinkController) {
              this._deepLinkController.syncHash(scene.id);
            }
          });
        },
        onComplete: (detail: import('./types').CISCompleteDetail) => {
          // Pause autoplay at end
          this._autoplayController?.pause();
          this._isPlaying = false;
          this._dispatchEvent('cis:complete', detail);
          // Clear hash on complete
          this._deepLinkController?.clearHash();
          // Show outro → intro → first scene (fallback chain)
          if (this._config?.settings?.outro) {
            this._showOutro(this._config);
          } else if (this._config?.settings?.intro) {
            this._renderIntro(this._config);
          } else {
            this.goTo(0);
          }
        },
      };
    }
    return this._cachedNavCallbacks;
  }

  private _handleSkip(): void {
    if (!this._navState || !this._config) return;
    const config = this._config;
    const detail = createSkipDetail(this._navState, config);
    this._dispatchEvent('cis:skip', detail);
    // Clear hash on skip
    this._deepLinkController?.clearHash();

    // Pause autoplay if playing
    if (this._isPlaying) {
      this.pause();
    }

    // Clear outro if visible
    if (this._outroVisible) this._clearOutro();

    // Reset navigation state to scene 0
    if (this._navState) {
      this._navState.currentIndex = 0;
      this._currentIndex = 0;
    }

    // Show intro if configured, otherwise reset to scene 0 base image
    if (config.settings?.intro) {
      this._renderIntro(config);
    } else {
      this._renderResetScene(config);
    }
  }

  /**
   * Render a "reset" view: scene-0 base image only (no overlays, mask, or annotation).
   * Used when skip/close is pressed and no intro screen is configured.
   * The user can restart by calling goTo(0) or play() programmatically,
   * or the host page can listen for cis:skip and take action.
   */
  private _renderResetScene(config: SpotlightConfig): void {
    if (!this._stage || !this._root) return;

    this._introVisible = true; // Block navigation while in reset state

    // Render scene-0 base image only
    const scene = config.scenes[0];
    this._stage.textContent = '';
    const img = document.createElement('img');
    img.className = 'cis-image cis-image--base';
    img.src = buildCiUrl(scene.image, config.ciToken, 'full', undefined, this._getContainerWidth(), typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    img.alt = scene.title || '';
    img.draggable = false;
    this._stage.appendChild(img);

    // Disable keyboard navigation while in reset state
    this._keyboardController?.setEnabled(false);
  }

  private _getContainerWidth(): number {
    return this._root?.clientWidth || 1200;
  }

  /**
   * Compute reserved rects for UI elements so annotation auto-positioning
   * avoids overlapping them. Includes:
   * - Top-right action buttons (fullscreen, skip)
   * - Bottom navigation controls bar (prev, progress, next)
   * Returns pixel rects relative to the stage.
   */
  private _getActionButtonsRect(): import('./auto-position').Rect[] {
    const stageW = this._root?.clientWidth || 0;
    const stageH = this._root?.clientHeight || 0;
    if (!stageW || !stageH) return [];

    const rects: import('./auto-position').Rect[] = [];

    // Top-right fullscreen button: 36px, positioned 12px from top/right
    const btnSize = 36;
    const inset = 12;
    const padding = 8; // extra breathing room

    if (this._fullscreenBtn) {
      rects.push({
        left: stageW - inset - btnSize - padding,
        top: inset - padding,
        right: stageW,
        bottom: inset + btnSize + padding,
      });
    }

    // Play/pause button: positioned to the left of fullscreen (or in its place)
    if (this._playBtn) {
      const playInsetEnd = this._fullscreenBtn ? (inset + btnSize + 8) : inset; // 8px gap
      rects.push({
        left: stageW - playInsetEnd - btnSize - padding,
        top: inset - padding,
        right: stageW - playInsetEnd + padding,
        bottom: inset + btnSize + padding,
      });
    }

    return rects;
  }

  private _getBoolAttr(name: string, configDefault: boolean): boolean {
    if (this.hasAttribute(name)) {
      const val = this.getAttribute(name);
      return val !== 'false';
    }
    return configDefault;
  }

  private _dispatchEvent<T>(name: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Private: Transitions
  // ---------------------------------------------------------------------------

  /**
   * Run a scene transition, then render the new scene at the midpoint.
   */
  private _transitionToScene(direction: TransitionDirection, onAfterSwap: () => void): void {
    this._cancelPendingTransition();

    const transitionType = this._config?.settings?.transition ?? 'fade';
    const reducedMotion = prefersReducedMotion();

    if (!this._stage || !this._root) {
      // No DOM — just render directly
      if (this._config) this._renderCurrentScene(this._config);
      onAfterSwap();
      return;
    }

    this._cancelTransition = runTransition(this._stage, this._root, {
      type: transitionType,
      direction,
      reducedMotion,
      onMidpoint: () => {
        // Swap scene DOM content at the midpoint of the transition
        if (this._config) this._renderCurrentScene(this._config);
      },
      onComplete: () => {
        this._cancelTransition = null;
        onAfterSwap();

        // Apply any queued resize
        if (this._pendingResize) {
          this._pendingResize = false;
          this._handleResize();
        }
      },
    }) ?? null;

    // For instant cut (reduced motion), onComplete fires synchronously
    // so onAfterSwap has already been called
  }

  private _cancelPendingTransition(): void {
    if (this._cancelTransition) {
      this._cancelTransition();
      this._cancelTransition = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private: Autoplay
  // ---------------------------------------------------------------------------

  private _ensureAutoplayController(): void {
    if (this._autoplayController) return;

    const interval = this._getAutoplayInterval();

    this._autoplayController = createAutoplayController(interval, {
      next: () => this.next(),
      isLastScene: () => {
        if (!this._navState) return true;
        return this._navState.currentIndex >= this._navState.totalScenes - 1;
      },
      onComplete: () => {
        // Autoplay reached last scene — call next() to trigger the navigation
        // onComplete flow (which shows outro/intro or restarts)
        this._isPlaying = false;
        this._syncPlayButton();
        this.next();
      },
    });
  }

  private _getAutoplayInterval(): number {
    const attrVal = this.getAttribute('autoplay-interval');
    if (attrVal) {
      const parsed = parseInt(attrVal, 10);
      if (parsed > 0) return parsed;
    }
    return this._config?.settings?.autoplayInterval ?? 4000;
  }

  // ---------------------------------------------------------------------------
  // Private: Keyboard
  // ---------------------------------------------------------------------------

  private _setupKeyboard(config: SpotlightConfig): void {
    // Clean up previous controller
    this._keyboardController?.detach();

    const allowKeyboard = this._getBoolAttr('allow-keyboard', config.settings?.allowKeyboard ?? true);

    this._keyboardController = createKeyboardController(this, {
      next: () => this.next(),
      prev: () => this.prev(),
      goTo: (index: number) => this.goTo(index),
      skip: () => this._handleSkip(),
      totalScenes: () => this._navState?.totalScenes ?? 0,
      isFullscreen: () => this._isFullscreen,
      exitFullscreen: () => { this._fullscreenController?.exit(); },
    });

    this._keyboardController.setEnabled(allowKeyboard);
    this._keyboardController.setRTL(this._isRTL());
    this._keyboardController.attach();
  }

  private _isRTL(): boolean {
    if (typeof getComputedStyle === 'undefined') return false;
    return getComputedStyle(this).direction === 'rtl';
  }

  // ---------------------------------------------------------------------------
  // Private: Fullscreen
  // ---------------------------------------------------------------------------

  private _setupFullscreen(): void {
    this._fullscreenController?.destroy();
    this._fullscreenController = null;
    this._fullscreenBtn?.remove();
    this._fullscreenBtn = null;

    if (!this._root) return;

    // Use `this` (host element) so document.fullscreenElement matches correctly
    this._fullscreenController = createFullscreenController(
      this,
      (isFullscreen) => this._handleFullscreenChange(isFullscreen),
    );

    // Only create button if the Fullscreen API is available
    if (!this._fullscreenController) return;

    const btn = document.createElement('button');
    btn.className = 'cis-btn cis-btn--fullscreen';
    btn.setAttribute('aria-label', this._resolvedStrings.enterFullscreen);
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('type', 'button');
    btn.appendChild(iconFullscreen(16));
    btn.addEventListener('click', () => this._fullscreenController?.toggle());
    this._fullscreenBtn = btn;
    this._root.appendChild(btn);
  }

  private _handleFullscreenChange(isFullscreen: boolean): void {
    this._isFullscreen = isFullscreen;

    if (this._root) {
      this._root.classList.toggle('cis-root--fullscreen', isFullscreen);
    }

    // Sync button icon + aria
    if (this._fullscreenBtn) {
      this._fullscreenBtn.setAttribute(
        'aria-label',
        isFullscreen ? this._resolvedStrings.exitFullscreen : this._resolvedStrings.enterFullscreen,
      );
      this._fullscreenBtn.setAttribute('aria-pressed', String(isFullscreen));
      this._fullscreenBtn.textContent = '';
      this._fullscreenBtn.appendChild(
        isFullscreen ? iconFullscreenExit(16) : iconFullscreen(16),
      );
    }

    this._dispatchEvent<import('./types').CISFullscreenChangeDetail>('cis:fullscreen-change', {
      isFullscreen,
    });

    // Re-render scene to fit new dimensions
    requestAnimationFrame(() => this._handleResize());
  }

  // ---------------------------------------------------------------------------
  // Private: Play/pause button
  // ---------------------------------------------------------------------------

  private _setupPlayButton(config: SpotlightConfig): void {
    this._playBtn?.remove();
    this._playBtn = null;

    if (!this._root) return;

    const showPlayButton = this._getBoolAttr('show-play-button', config.settings?.showPlayButton ?? false);
    if (!showPlayButton) return;

    const btn = document.createElement('button');
    btn.className = 'cis-btn cis-btn--play';
    btn.setAttribute('aria-label', this._resolvedStrings.playAutoplay);
    btn.setAttribute('type', 'button');
    btn.appendChild(iconPlay(16));
    btn.addEventListener('click', () => {
      if (this._isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    });
    this._playBtn = btn;
    this._root.appendChild(btn);
  }

  private _syncPlayButton(): void {
    if (!this._playBtn) return;
    const playing = this._isPlaying;
    this._playBtn.setAttribute(
      'aria-label',
      playing ? this._resolvedStrings.pauseAutoplay : this._resolvedStrings.playAutoplay,
    );
    this._playBtn.textContent = '';
    this._playBtn.appendChild(playing ? iconPause(16) : iconPlay(16));
  }

  // ---------------------------------------------------------------------------
  // Private: Responsive layout
  // ---------------------------------------------------------------------------

  private _setupResponsive(): void {
    this._responsiveController?.destroy();
    this._responsiveController = null;

    if (!this._root) return;

    this._responsiveController = createResponsiveController(this._root);
    this._responsiveController.evaluate();
  }

  // ---------------------------------------------------------------------------
  // Private: Deep linking
  // ---------------------------------------------------------------------------

  private _setupDeepLink(config: SpotlightConfig): void {
    this._deepLinkController?.detach();
    this._deepLinkController = null;

    const syncUrl = this._getBoolAttr('sync-url', false);
    if (!syncUrl || typeof window === 'undefined') return;

    this._deepLinkController = createDeepLinkController(
      this.getAttribute('id'),
      (sceneId: string) => {
        // hashchange fired externally — navigate to the scene
        this.goToId(sceneId);
      },
    );

    this._deepLinkController.attach();

    // Sync initial scene hash
    const scene = config.scenes[this._currentIndex];
    if (scene) {
      this._deepLinkController.syncHash(scene.id);
    }
  }

  // ---------------------------------------------------------------------------
  // Private: ResizeObserver
  // ---------------------------------------------------------------------------

  private _setupResizeObserver(): void {
    if (!this._root || typeof ResizeObserver === 'undefined') return;

    // Clean up any existing observer
    this._resizeObserver?.disconnect();

    this._resizeObserver = new ResizeObserver(() => {
      // Suppress rebuilds during transitions and zoom animations
      if (this._root?.classList.contains(TRANSITION_ACTIVE_CLASS) || this._zoomActive) {
        this._pendingResize = true;
        return;
      }
      this._debouncedResize();
    });

    this._resizeObserver.observe(this._root);
  }

  private _debouncedResize(): void {
    if (this._resizeRafId !== null) {
      cancelAnimationFrame(this._resizeRafId);
    }
    this._resizeRafId = requestAnimationFrame(() => {
      this._resizeRafId = null;
      this._handleResize();
    });
  }

  private _handleResize(): void {
    if (!this._config || !this._stage || !this._navState) return;
    // Evaluate responsive breakpoint (may toggle mobile layout)
    this._responsiveController?.evaluate();
    // Skip re-render during intro or outro — the overlay is independent of scene content
    if (this._introVisible || this._outroVisible) return;
    // Re-render current scene with new container width
    this._renderCurrentScene(this._config);
  }

  // ---------------------------------------------------------------------------
  // Private: Observer management
  // ---------------------------------------------------------------------------

  private _attachObservers(): void {
    // Re-attach ResizeObserver on reconnect
    this._setupResizeObserver();

    // Re-attach keyboard handler and deep-link listener
    this._keyboardController?.attach();
    this._deepLinkController?.attach();

    // Resume autoplay if it was active before disconnect
    if (this._autoplayController && this._config) {
      const shouldAutoplay = this.hasAttribute('autoplay') || this._config.settings?.autoplay;
      if (shouldAutoplay) {
        this.play();
      }
    }
  }

  private _teardownObservers(): void {
    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._resizeRafId !== null) {
      cancelAnimationFrame(this._resizeRafId);
      this._resizeRafId = null;
    }
  }

  private _abortPendingFetch(): void {
    this._abortController?.abort();
    this._abortController = null;
  }

  // ---------------------------------------------------------------------------
  // Private: Error handling
  // ---------------------------------------------------------------------------

  private _handleError(err: unknown): void {
    this._failed = true;
    this._root?.classList.remove('cis-loading');

    const detail: CISErrorDetail = err instanceof CISError
      ? { message: err.message, code: err.code }
      : { message: String(err), code: 'INVALID_JSON' };

    this.dispatchEvent(
      new CustomEvent('cis:error', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );

    // Render error state in shadow DOM
    if (this._root) {
      const stage = this._root.querySelector('.cis-stage');
      if (stage) {
        stage.textContent = '';
        const errorEl = document.createElement('div');
        errorEl.className = 'cis-annotation';
        errorEl.style.cssText = 'position:static;margin:16px;';
        const title = document.createElement('p');
        title.className = 'cis-annotation__title';
        title.textContent = 'Failed to load experience';
        const body = document.createElement('p');
        body.className = 'cis-annotation__body';
        body.textContent = detail.message;
        errorEl.appendChild(title);
        errorEl.appendChild(body);
        stage.appendChild(errorEl);
      }
    }
  }
}
