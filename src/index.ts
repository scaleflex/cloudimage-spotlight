// Main entry — exports class + all public types. No side effects.

export { CloudimageSpotlight } from './spotlight-element';

// Re-export all public types
export type {
  SpotlightConfig,
  SpotlightSettings,
  SpotlightIntro,
  SpotlightOutro,
  SpotlightScene,
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
  CISFullscreenChangeDetail,
  CloudimageSpotlightElement,
} from './types';

export { CISError } from './types';
