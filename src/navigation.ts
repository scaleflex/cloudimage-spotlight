import type {
  SpotlightConfig,
  SpotlightScene,
  CISSceneChangeDetail,
  CISCompleteDetail,
  CISSkipDetail,
} from './types';
import { buildCiUrl } from './url-builder';

export interface NavigationState {
  currentIndex: number;
  totalScenes: number;
  startTime: number;
}

export interface NavigationCallbacks {
  onSceneChange(detail: CISSceneChangeDetail): void;
  onComplete(detail: CISCompleteDetail): void;
}

export function createNavigationState(config: SpotlightConfig): NavigationState {
  return {
    currentIndex: 0,
    totalScenes: config.scenes.length,
    startTime: Date.now(),
  };
}

export function navigateNext(
  state: NavigationState,
  config: SpotlightConfig,
  callbacks: NavigationCallbacks,
): void {
  if (state.currentIndex >= state.totalScenes - 1) {
    // Last scene — dispatch complete, don't advance
    callbacks.onComplete({
      totalScenes: state.totalScenes,
      timeSpent: Date.now() - state.startTime,
      config,
    });
    return;
  }

  const from = state.currentIndex;
  const to = from + 1;
  state.currentIndex = to;

  callbacks.onSceneChange({
    from,
    to,
    scene: config.scenes[to],
    totalScenes: state.totalScenes,
  });
}

export function navigatePrev(
  state: NavigationState,
  config: SpotlightConfig,
  callbacks: NavigationCallbacks,
): void {
  if (state.currentIndex <= 0) return; // No-op on first scene

  const from = state.currentIndex;
  const to = from - 1;
  state.currentIndex = to;

  callbacks.onSceneChange({
    from,
    to,
    scene: config.scenes[to],
    totalScenes: state.totalScenes,
  });
}

export function navigateGoTo(
  index: number,
  state: NavigationState,
  config: SpotlightConfig,
  callbacks: NavigationCallbacks,
): void {
  if (index < 0 || index >= state.totalScenes || index === state.currentIndex) return;

  const from = state.currentIndex;
  state.currentIndex = index;

  callbacks.onSceneChange({
    from,
    to: index,
    scene: config.scenes[index],
    totalScenes: state.totalScenes,
  });
}

export function navigateGoToId(
  id: string,
  state: NavigationState,
  config: SpotlightConfig,
  callbacks: NavigationCallbacks,
): void {
  const index = config.scenes.findIndex((s) => s.id === id);
  if (index === -1) return; // No-op if no match
  navigateGoTo(index, state, config, callbacks);
}

export function createSkipDetail(
  state: NavigationState,
  config: SpotlightConfig,
): CISSkipDetail {
  return {
    atScene: state.currentIndex,
    scene: config.scenes[state.currentIndex],
    totalScenes: state.totalScenes,
  };
}

/**
 * Preload adjacent scenes (N-1 and N+1) for smooth navigation.
 */
export function preloadAdjacentScenes(
  state: NavigationState,
  config: SpotlightConfig,
  containerWidth: number,
  dpr: number,
): void {
  const indices = [state.currentIndex - 1, state.currentIndex + 1];

  for (const idx of indices) {
    if (idx < 0 || idx >= state.totalScenes) continue;
    const scene = config.scenes[idx];
    preloadScene(scene, config.ciToken, containerWidth, dpr, config.settings?.maskStyle, config.settings?.maskBlurRadius);
  }
}

function preloadScene(
  scene: SpotlightScene,
  ciToken: string | undefined,
  containerWidth: number,
  dpr: number,
  settingsMaskStyle?: string,
  settingsBlurRadius?: number,
): void {
  const fullUrl = buildCiUrl(scene.image, ciToken, 'full', undefined, containerWidth, dpr);

  // Preload blurred variant if scene or settings use blur mask
  const maskStyle = scene.maskStyle ?? settingsMaskStyle;
  if (maskStyle === 'blur') {
    const blurImg = new Image();
    blurImg.src = buildCiUrl(scene.image, ciToken, 'blurred', undefined, containerWidth, dpr, settingsBlurRadius);
  }

  // Zoomed variant requires natural dimensions (pixel coords). Two-phase:
  // load full image first → use naturalWidth/Height → build & preload zoomed URL.
  // The full image is also preloaded as a side effect of this first fetch.
  if (scene.zoom && scene.regions?.length) {
    const fullImg = new Image();
    fullImg.src = fullUrl;
    fullImg.addEventListener('load', () => {
      const zoomedImg = new Image();
      zoomedImg.src = buildCiUrl(
        scene.image, ciToken, 'zoomed', scene.regions,
        containerWidth, dpr, undefined,
        fullImg.naturalWidth, fullImg.naturalHeight,
      );
    }, { once: true });
  } else {
    // Non-zoom: just preload the full image
    const img = new Image();
    img.src = fullUrl;
  }
}
