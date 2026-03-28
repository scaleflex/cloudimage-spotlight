// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

export interface SpotlightConfig {
  version: '1.0';
  ciToken: string;
  title?: string;
  settings?: SpotlightSettings;
  scenes: SpotlightScene[];
}

export interface SpotlightIntro {
  title?: string;
  description?: string;
  startLabel?: string;
}

export interface SpotlightOutro {
  title?: string;
  description?: string;
  restartLabel?: string;
  /** Scene navigation style on the outro screen. 'grid' shows thumbnails, 'list' shows a numbered list. Default: none. */
  sceneNav?: 'grid' | 'list';
  /** Max columns in the scene grid (only for sceneNav: 'grid'). Default: 3 (clamped 2–4). */
  sceneGridColumns?: number;
}

export interface SpotlightSettings {
  transition?: 'fade' | 'slide' | 'zoom';
  autoplay?: boolean;
  autoplayInterval?: number;
  showProgress?: boolean;
  allowSkip?: boolean;
  allowKeyboard?: boolean;
  maskOpacity?: number;
  maskColor?: string;
  maskStyle?: 'color' | 'blur';
  maskBlurRadius?: number;
  intro?: boolean | SpotlightIntro;
  outro?: boolean | SpotlightOutro;
  staggerEntry?: boolean;
  /** Delay (ms) before staggered overlays begin animating in after the image loads. Default: 600. */
  staggerDelay?: number;
  /** Duration (ms) for each stagger animation phase. Default: 500. */
  staggerAnimationDuration?: number;
  showBadges?: boolean;
  showPlayButton?: boolean;
  /** Global annotation defaults. Per-scene `annotation` overrides these. */
  annotation?: SpotlightAnnotation;
}

export interface SpotlightScene {
  id: string;
  image: string;
  title?: string;
  description?: string;
  regions?: SpotlightRegion[];
  mask?: boolean;
  zoom?: boolean;
  zoomPadding?: number;
  annotation?: SpotlightAnnotation;
  cta?: SpotlightCTA;
  maskStyle?: 'color' | 'blur';
  metadata?: Record<string, string>;
}

export interface SpotlightRegion {
  tl_x: number;
  tl_y: number;
  br_x: number;
  br_y: number;
  shape?: 'rect' | 'ellipse';
  padding?: number;
  label?: string;
}

export interface SpotlightAnnotation {
  /** Position relative to the primary region. 'auto' picks the side with most space. */
  position?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'auto';
  style?: 'card' | 'tooltip' | 'minimal';
  maxWidth?: number;
  showConnector?: boolean;
}

export interface SpotlightCTA {
  label: string;
  href?: string;
  style?: 'button' | 'link';
  metadata?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// URL builder types
// ---------------------------------------------------------------------------

export type SceneImageVariant =
  | 'full'
  | 'zoomed'
  | 'blurred';

export interface BoundingBox {
  tl_x: number;
  tl_y: number;
  br_x: number;
  br_y: number;
  padding: number;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type CISErrorCode =
  | 'FETCH_FAILED'
  | 'INVALID_JSON'
  | 'INVALID_VERSION'
  | 'MISSING_TOKEN'
  | 'MISSING_IMAGE'
  | 'INVALID_REGION'
  | 'IMAGE_LOAD_FAILED';

export class CISError extends Error {
  code: CISErrorCode;

  constructor(code: CISErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'CISError';
  }
}

// ---------------------------------------------------------------------------
// Event detail types
// ---------------------------------------------------------------------------

export interface CISReadyDetail {
  totalScenes: number;
  config: SpotlightConfig;
}

export interface CISSceneChangeDetail {
  from: number;
  to: number;
  scene: SpotlightScene;
  totalScenes: number;
}

export interface CISCompleteDetail {
  totalScenes: number;
  timeSpent: number;
  config: SpotlightConfig;
}

export interface CISSkipDetail {
  atScene: number;
  scene: SpotlightScene;
  totalScenes: number;
}

export interface CISCTAClickDetail {
  scene: SpotlightScene;
  cta: SpotlightCTA;
  metadata?: Record<string, string>;
}

export interface CISRegionEnterDetail {
  scene: SpotlightScene;
  regions: SpotlightRegion[];
}

export interface CISErrorDetail {
  message: string;
  code: CISErrorCode;
}

export interface CISFullscreenChangeDetail {
  isFullscreen: boolean;
}

// ---------------------------------------------------------------------------
// Internationalization
// ---------------------------------------------------------------------------

export interface CISStrings {
  prev: string;
  next: string;
  finish: string;
  skip: string;
  close: string;
  progress: string;
  progressShort: string;
  tourLabel: string;
  navLabel: string;
  enterFullscreen: string;
  exitFullscreen: string;
  introStart: string;
  introDefault: string;
  outroRestart: string;
  outroDefault: string;
  outroGoToStep: string;
  playAutoplay: string;
  pauseAutoplay: string;
}

// ---------------------------------------------------------------------------
// Public element interface
// ---------------------------------------------------------------------------

export interface CloudimageSpotlightElement extends HTMLElement {
  // Navigation
  next(): void;
  prev(): void;
  goTo(index: number): void;
  goToId(id: string): void;

  // Playback
  play(): void;
  pause(): void;

  // Fullscreen
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  readonly isFullscreen: boolean;

  // State (read-only)
  readonly currentIndex: number;
  readonly totalScenes: number;
  readonly isPlaying: boolean;
  readonly currentScene: SpotlightScene | undefined;
  readonly instanceId: string;

  // Config
  config: SpotlightConfig | string | null;

  // Internationalization
  strings: Partial<CISStrings>;

  // Lifecycle
  destroy(): void;
  reload(config?: SpotlightConfig): Promise<void>;
}

// ---------------------------------------------------------------------------
// Global event map augmentation
// ---------------------------------------------------------------------------

declare global {
  interface HTMLElementEventMap {
    'cis:ready': CustomEvent<CISReadyDetail>;
    'cis:scene-change': CustomEvent<CISSceneChangeDetail>;
    'cis:complete': CustomEvent<CISCompleteDetail>;
    'cis:skip': CustomEvent<CISSkipDetail>;
    'cis:cta-click': CustomEvent<CISCTAClickDetail>;
    'cis:region-enter': CustomEvent<CISRegionEnterDetail>;
    'cis:error': CustomEvent<CISErrorDetail>;
    'cis:fullscreen-change': CustomEvent<CISFullscreenChangeDetail>;
  }
}
