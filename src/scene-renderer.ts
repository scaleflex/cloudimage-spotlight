import type { SpotlightConfig, SpotlightScene, CISErrorDetail, CISCTAClickDetail, SpotlightRegion } from './types';
import { buildCiUrl, getPaddedCropBounds } from './url-builder';
import { interpolate } from './i18n';
import type { CISStrings } from './types';
import { createMask } from './svg-mask';
import { createRegionHighlights } from './region-highlights';
import { createBadges } from './badges';
import { createAnnotation } from './annotation';
import { resolveAnnotationPosition, applyAnnotationPosition, type Rect } from './auto-position';
import { createConnector } from './connector';

/** Run callback when image is settled (loaded or errored). */
function whenImageReady(img: HTMLImageElement, fn: () => void): void {
  if (img.complete) { fn(); return; }
  const settle = () => { img.removeEventListener('load', settle); img.removeEventListener('error', settle); fn(); };
  img.addEventListener('load', settle, { once: true });
  img.addEventListener('error', settle, { once: true });
}

/** Block stagger CSS animation on an element (finishZoom / blur reveal manage opacity directly). */
function cancelStaggerAnim(el: HTMLElement): void {
  el.style.setProperty('animation', 'none', 'important');
}

export interface SceneRenderContext {
  config: SpotlightConfig;
  stage: HTMLDivElement;
  containerWidth: number;
  dpr: number;
  strings: CISStrings;
  instanceId: string;
  isRTL: boolean;
  reservedRects?: Rect[];
  showProgress: boolean;
  showBadges: boolean;
  allowSkip: boolean;
  /** When true, overlays start hidden (stagger class applied immediately). */
  staggerEntry: boolean;
  onImageLoad: (img: HTMLImageElement, scene: SpotlightScene) => void;
  onImageError: (scene: SpotlightScene, detail: CISErrorDetail) => void;
  onCtaClick: (detail: CISCTAClickDetail) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  /** Called when zoom animation begins (suppresses resize re-renders). */
  onZoomStart?: () => void;
  /** Called after zoom finishes and annotation is appended to the DOM. */
  onZoomFinish?: () => void;
}

/**
 * Render a scene's base image into the stage container.
 * Clears previous scene content and creates the new image element.
 * Overlays (mask, highlights, badges) are placed in an overlay wrapper
 * that aligns to the image content area (accounting for object-fit: contain).
 * When zoom is active, overlay coordinates are remapped to the crop space.
 */
export function renderScene(
  scene: SpotlightScene,
  index: number,
  totalScenes: number,
  ctx: SceneRenderContext,
): void {
  const { config, stage, containerWidth, dpr, strings, instanceId, isRTL } = ctx;
  const settings = config.settings;
  const regions = scene.regions ?? [];
  const shouldMask = scene.mask ?? regions.length > 0;
  const maskStyle = scene.maskStyle ?? settings?.maskStyle ?? 'color';
  const isBlurMode = maskStyle === 'blur' && regions.length > 0;
  const isZoom = !!(scene.zoom && regions.length > 0 && !isBlurMode);
  // Merge global annotation defaults with per-scene overrides
  const mergedAnnotation = { ...settings?.annotation, ...scene.annotation };

  // Clear previous scene content + stagger classes
  stage.textContent = '';
  stage.classList.remove('cis-scene-stagger', 'cis-scene-stagger-active');

  // Remap coordinates for zoom (crop-space instead of image-space)
  const overlayRegions = isZoom ? remapRegionsForZoom(regions, undefined, undefined, scene.zoomPadding) : regions;

  // Overlay wrapper — aligns mask/highlights/badges to the image content area.
  // Starts at full stage size; updated on image load to match object-fit: contain.
  const overlayWrapper = document.createElement('div');
  overlayWrapper.className = 'cis-overlay-wrapper';

  // --- Image layers ---
  if (isBlurMode) {
    // Blur mode: blurred full image + sharp image clipped to regions
    const blurRadius = settings?.maskBlurRadius ?? 8;
    const shouldAnimateZoomBlur = !!(scene.zoom && regions.length > 0);

    // Blur layer — visible from the start (the "background").
    const blurredImg = document.createElement('img');
    blurredImg.className = 'cis-image cis-image--blurred';
    blurredImg.src = buildCiUrl(scene.image, config.ciToken, 'blurred', undefined, containerWidth, dpr, blurRadius);
    blurredImg.alt = '';
    blurredImg.setAttribute('aria-hidden', 'true');
    blurredImg.draggable = false;
    blurredImg.addEventListener('error', () => {
      ctx.onImageError(scene, { message: `Failed to load blurred image for scene "${scene.id}"`, code: 'IMAGE_LOAD_FAILED' });
    });
    stage.appendChild(blurredImg);

    // Sharp layer — clipped to region shapes, starts hidden, fades in as the "spotlight".
    const sharpImg = document.createElement('img');
    sharpImg.className = 'cis-image cis-image--sharp';
    sharpImg.src = buildCiUrl(scene.image, config.ciToken, 'full', undefined, containerWidth, dpr);
    sharpImg.alt = generateAltText(scene, index, totalScenes, strings);
    sharpImg.draggable = false;
    sharpImg.style.opacity = '0';
    stage.appendChild(sharpImg);

    sharpImg.addEventListener('load', () => {
      positionOverlayWrapper(overlayWrapper, sharpImg, stage);
      // Pre-apply clip-path so the sharp image is already shaped before fading in
      applyBlurClipPath(sharpImg, regions, instanceId, scene.id, stage);
      ctx.onImageLoad(sharpImg, scene);

      if (shouldAnimateZoomBlur) {
        // Zoom + blur: animate blurred image zooming into crop, then reveal
        overlayWrapper.style.opacity = '0';
        const transform = computeZoomTransform(
          sharpImg, stage, regions, scene.zoomPadding,
        );
        if (transform) {
          const startZoomAnim = () => {
            blurredImg.style.transformOrigin = '0 0';
            blurredImg.style.transition = 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)';
            requestAnimationFrame(() => {
              blurredImg.style.transform = `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`;
            });
            let revealed = false;
            const reveal = () => {
              if (revealed || !sharpImg.isConnected) return;
              revealed = true;
              sharpImg.style.transition = 'opacity 300ms ease';
              sharpImg.style.opacity = '1';
              cancelStaggerAnim(overlayWrapper);
              overlayWrapper.style.transition = 'opacity 300ms ease';
              overlayWrapper.style.opacity = '1';
            };
            blurredImg.addEventListener('transitionend', reveal, { once: true });
            setTimeout(reveal, 700); // fallback
          };
          whenImageReady(blurredImg, startZoomAnim);
        } else {
          whenImageReady(blurredImg, () => {
            sharpImg.style.transition = 'opacity 300ms ease';
            sharpImg.style.opacity = '1';
            cancelStaggerAnim(overlayWrapper);
            overlayWrapper.style.opacity = '1';
          });
        }
      } else {
        // Non-zoom blur: blur is already visible, fade in the sharp spotlight regions.
        // Wait for blur image to load (avoid sharp regions over empty background).
        whenImageReady(blurredImg, () => {
          requestAnimationFrame(() => {
            sharpImg.style.transition = 'opacity 600ms ease';
            sharpImg.style.opacity = '1';
          });
        });
      }
    });
    sharpImg.addEventListener('error', () => {
      ctx.onImageError(scene, { message: `Failed to load image for scene "${scene.id}"`, code: 'IMAGE_LOAD_FAILED' });
      renderImageFallback(stage, scene);
    });
  } else if (maskStyle === 'blur' && regions.length === 0) {
    // Blur mode with no regions — fallback to sharp, log warning
    console.warn(`[cloudimage-spotlight] Scene "${scene.id}": maskStyle "blur" with no regions — rendering sharp image without mask.`);
    const baseImg = appendBaseImage(stage, scene, index, totalScenes, ctx);
    baseImg.addEventListener('load', () => positionOverlayWrapper(overlayWrapper, baseImg, stage));
  } else {
    // Normal mode: single base image (original resolution for zoom — see appendBaseImage)
    const baseImg = appendBaseImage(stage, scene, index, totalScenes, ctx, isZoom);
    if (!isZoom) {
      baseImg.addEventListener('load', () => positionOverlayWrapper(overlayWrapper, baseImg, stage));
    } else {
      // Zoom: animate base image zooming into the crop area, then swap to sharp CDN crop.
      // Hide overlay until the zoom animation + CDN image are both ready.
      overlayWrapper.style.opacity = '0';

      baseImg.addEventListener('load', () => {
        positionOverlayWrapper(overlayWrapper, baseImg, stage);
        if (!baseImg.isConnected) return;

        ctx.onZoomStart?.();

        // Start loading the sharp CDN crop in parallel
        const zoomedImg = document.createElement('img');
        zoomedImg.className = 'cis-image cis-image--zoomed';
        zoomedImg.src = buildCiUrl(
          scene.image, config.ciToken, 'zoomed', regions,
          containerWidth, dpr, undefined,
          baseImg.naturalWidth, baseImg.naturalHeight,
          scene.zoomPadding,
        );
        zoomedImg.alt = '';
        zoomedImg.setAttribute('aria-hidden', 'true');
        zoomedImg.draggable = false;

        // Track readiness of both animation and CDN image
        let animDone = false;
        let zoomLoaded = false;
        let zoomFinished = false;

        const finishZoom = () => {
          if (!animDone || !zoomLoaded || !baseImg.isConnected) return;
          // Guard against double-fire: transitionend + setTimeout fallback
          // can both invoke finishZoom. Without this, the second call resets
          // annotation opacity mid-transition, causing a visible flash.
          if (zoomFinished) return;
          zoomFinished = true;
          positionOverlayWrapper(overlayWrapper, zoomedImg, stage);
          zoomedImg.classList.add('cis-image--visible');
          // Block stagger animations — finishZoom manages the reveal directly.
          cancelStaggerAnim(overlayWrapper);
          overlayWrapper.style.transition = 'opacity 300ms ease';
          overlayWrapper.style.opacity = '1';

          // Block stagger on annotation BEFORE appending to prevent flash.
          cancelStaggerAnim(annotationCard);
          annotationCard.style.opacity = '0';
          stage.appendChild(annotationCard);
          const zoomedContentRect = computeImageContentRect(
            zoomedImg.naturalWidth, zoomedImg.naturalHeight,
            stage.clientWidth, stage.clientHeight,
          );
          const updatedStageRect = stage.getBoundingClientRect();
          const pos = resolveAnnotationPosition(
            mergedAnnotation, annotationCard, updatedStageRect,
            overlayRegions, isRTL, ctx.reservedRects, zoomedContentRect,
          );
          applyAnnotationPosition(annotationCard, pos, updatedStageRect, overlayRegions, zoomedContentRect);
          requestAnimationFrame(() => {
            annotationCard.style.transition = 'opacity 300ms ease';
            annotationCard.style.opacity = '1';
          });

          // Create connector with correct zoomed coordinates
          if (mergedAnnotation.showConnector === true && overlayRegions.length > 0) {
            const cLeft = parseFloat(annotationCard.style.left) || 0;
            const cTop = parseFloat(annotationCard.style.top) || 0;
            const cW = annotationCard.offsetWidth || 320;
            const cH = annotationCard.offsetHeight || 100;
            const conn = createConnector(
              { left: cLeft, top: cTop, width: cW, height: cH },
              overlayRegions,
              updatedStageRect.width,
              updatedStageRect.height,
              zoomedContentRect,
            );
            if (conn) {
              stage.appendChild(conn);
              requestAnimationFrame(() => conn.classList.add('cis-connector--visible'));
            }
          }

          ctx.onZoomFinish?.();
        };

        zoomedImg.addEventListener('load', () => { zoomLoaded = true; finishZoom(); });
        zoomedImg.addEventListener('error', () => {
          ctx.onImageError(scene, { message: `Failed to load zoomed image for scene "${scene.id}"`, code: 'IMAGE_LOAD_FAILED' });
          // On error, still show overlays and annotation on base image
          overlayWrapper.style.transition = 'opacity 300ms ease';
          overlayWrapper.style.opacity = '1';
          if (!annotationCard.parentNode) {
            stage.appendChild(annotationCard);
            const errStageRect = stage.getBoundingClientRect();
            const errPos = resolveAnnotationPosition(
              mergedAnnotation, annotationCard, errStageRect,
              overlayRegions, isRTL, ctx.reservedRects,
            );
            applyAnnotationPosition(annotationCard, errPos, errStageRect, overlayRegions);
          }
          cancelStaggerAnim(annotationCard);
          annotationCard.style.opacity = '1';
        });
        stage.appendChild(zoomedImg);

        // Animate base image zooming into the crop area
        const transform = computeZoomTransform(
          baseImg, stage, regions, scene.zoomPadding,
        );
        if (transform) {
          baseImg.style.transformOrigin = '0 0';
          baseImg.style.transition = 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)';
          requestAnimationFrame(() => {
            baseImg.style.transform = `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`;
          });
          baseImg.addEventListener('transitionend', () => { animDone = true; finishZoom(); }, { once: true });
          // Fallback if transitionend doesn't fire
          setTimeout(() => { animDone = true; finishZoom(); }, 700);
        } else {
          animDone = true;
          finishZoom();
        }
      });
    }
  }

  // --- Overlays inside wrapper (aligned to image content area) ---

  // SVG mask (color mode only, not blur mode)
  if (shouldMask && overlayRegions.length > 0 && !isBlurMode) {
    const maskSvg = createMask(instanceId, scene.id, overlayRegions, settings?.maskOpacity, settings?.maskColor);
    overlayWrapper.appendChild(maskSvg);
  }

  // Region highlights + badges (both modes)
  if (overlayRegions.length > 0) {
    const highlights = createRegionHighlights(overlayRegions);
    for (const hl of highlights) overlayWrapper.appendChild(hl);

    if (ctx.showBadges) {
      const badges = createBadges(overlayRegions);
      for (const badge of badges) overlayWrapper.appendChild(badge);
    }
  }

  stage.appendChild(overlayWrapper);

  // --- Annotation card (positioned in stage, not in wrapper) ---
  const annotationCard = createAnnotation(
    scene,
    {
      index,
      totalScenes,
      strings,
      showProgress: ctx.showProgress,
      allowSkip: ctx.allowSkip,
      globalAnnotation: ctx.config.settings?.annotation,
    },
    {
      onCtaClick: (detail) => ctx.onCtaClick(detail),
      onPrev: ctx.onPrev,
      onNext: ctx.onNext,
      onSkip: ctx.onSkip,
    },
  );

  if (!isZoom) {
    // Non-zoom: append and position immediately
    stage.appendChild(annotationCard);
    const stageRect = stage.getBoundingClientRect();
    const position = resolveAnnotationPosition(
      mergedAnnotation,
      annotationCard,
      stageRect,
      regions,
      isRTL,
      ctx.reservedRects,
    );
    applyAnnotationPosition(annotationCard, position, stageRect, regions);
  }
  // Zoom: annotation is appended and positioned in finishZoom to avoid
  // bouncing (stagger would reveal it at approximate coords before zoom ends).

  // --- Connector line (card → primary region) ---
  // Only show connector when explicitly opted in, since region-relative
  // positioning places the card adjacent to the region already.
  // For zoom scenes, connector is created in finishZoom after annotation
  // is repositioned to the correct zoomed coordinates.
  if (mergedAnnotation.showConnector === true && regions.length > 0 && !isZoom) {
    const connStageRect = stage.getBoundingClientRect();
    const cardLeft = parseFloat(annotationCard.style.left) || 0;
    const cardTop = parseFloat(annotationCard.style.top) || 0;
    const cardW = annotationCard.offsetWidth || 320;
    const cardH = annotationCard.offsetHeight || 100;
    const connector = createConnector(
      { left: cardLeft, top: cardTop, width: cardW, height: cardH },
      regions,
      connStageRect.width,
      connStageRect.height,
    );
    if (connector) {
      stage.appendChild(connector);
      requestAnimationFrame(() => connector.classList.add('cis-connector--visible'));
    }
  }

  // Hide overlays immediately when stagger is enabled — prevents flash of
  // finished state before the stagger animation kicks in after image load.
  if (ctx.staggerEntry) {
    stage.classList.add('cis-scene-stagger');
  }

}

/**
 * Apply staggered entry animation to a stage.
 * Elements start hidden (via .cis-scene-stagger), then animate in
 * sequentially when .cis-scene-stagger-active is added on next frame.
 *
 * The .cis-scene-stagger class should already be on the stage (applied by renderScene).
 * @returns a cancel function that clears any pending timer.
 */
export function applyStagger(stage: HTMLElement): () => void {
  // Ensure the hiding class is present (renderScene already adds it,
  // but be defensive for direct callers).
  stage.classList.add('cis-scene-stagger');

  requestAnimationFrame(() => {
    stage.classList.add('cis-scene-stagger-active');
  });

  // No-op cancel — RAF-based, nothing to clear
  return () => {};
}

/** Max width the CDN accepts (values above ~10000 return errors). */
const CDN_MAX_WIDTH = 9999;

/**
 * Append the base image element. Returns the img for load hooking.
 * When `originalResolution` is true, requests the image at CDN max width
 * with DPR 1 so that naturalWidth/naturalHeight reflect the original
 * source dimensions — needed for zoom crop coordinate calculation.
 */
function appendBaseImage(
  stage: HTMLDivElement,
  scene: SpotlightScene,
  index: number,
  totalScenes: number,
  ctx: SceneRenderContext,
  originalResolution = false,
): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'cis-image cis-image--base';
  img.src = originalResolution
    ? buildCiUrl(scene.image, ctx.config.ciToken, 'full', undefined, CDN_MAX_WIDTH, 1)
    : buildCiUrl(scene.image, ctx.config.ciToken, 'full', undefined, ctx.containerWidth, ctx.dpr);
  img.alt = generateAltText(scene, index, totalScenes, ctx.strings);
  img.draggable = false;

  img.addEventListener('load', () => ctx.onImageLoad(img, scene));
  img.addEventListener('error', () => {
    ctx.onImageError(scene, { message: `Failed to load image for scene "${scene.id}"`, code: 'IMAGE_LOAD_FAILED' });
    renderImageFallback(stage, scene);
  });

  stage.appendChild(img);
  return img;
}

/**
 * Remap region coordinates from image-space (0–1 of full image) to
 * zoom-crop-space (0–1 of the cropped area). This ensures overlays
 * (mask, highlights, badges) align with the visible zoomed content.
 *
 * When naturalWidth/naturalHeight are provided, the crop bounds are
 * rounded to pixels (matching buildCiUrl) to avoid sub-pixel misalignment.
 */
export function remapRegionsForZoom(
  regions: SpotlightRegion[],
  naturalWidth?: number,
  naturalHeight?: number,
  zoomPadding?: number,
): SpotlightRegion[] {
  const crop = getPaddedCropBounds(regions, zoomPadding);
  let { x1, y1, x2, y2 } = crop;

  // Snap to the same pixel grid the CDN crop uses
  if (naturalWidth && naturalHeight) {
    x1 = Math.round(x1 * naturalWidth) / naturalWidth;
    y1 = Math.round(y1 * naturalHeight) / naturalHeight;
    x2 = Math.round(x2 * naturalWidth) / naturalWidth;
    y2 = Math.round(y2 * naturalHeight) / naturalHeight;
  }

  const w = x2 - x1;
  const h = y2 - y1;

  return regions.map((r) => ({
    ...r,
    tl_x: (r.tl_x - x1) / w,
    tl_y: (r.tl_y - y1) / h,
    br_x: (r.br_x - x1) / w,
    br_y: (r.br_y - y1) / h,
  }));
}

/**
 * Compute the CSS transform (scale + translate) that zooms the base image
 * so the crop region fills the stage. Returns null if dimensions are unavailable.
 */
export function computeZoomTransform(
  img: HTMLImageElement,
  stage: HTMLElement,
  regions: SpotlightRegion[],
  zoomPadding?: number,
): { scale: number; tx: number; ty: number } | null {
  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;
  if (!img.naturalWidth || !img.naturalHeight || !stageW || !stageH || regions.length === 0) {
    return null;
  }

  const contentRect = computeImageContentRect(img.naturalWidth, img.naturalHeight, stageW, stageH);
  const { x1, y1, x2, y2 } = getPaddedCropBounds(regions, zoomPadding);

  // Crop region in stage pixel coordinates
  const cropLeft = contentRect.left + x1 * contentRect.width;
  const cropTop = contentRect.top + y1 * contentRect.height;
  const cropW = (x2 - x1) * contentRect.width;
  const cropH = (y2 - y1) * contentRect.height;

  if (cropW <= 0 || cropH <= 0) return null;

  // Scale so crop fills the stage (contain)
  const scale = Math.min(stageW / cropW, stageH / cropH);

  // Translate so crop center lands on stage center
  const cropCenterX = cropLeft + cropW / 2;
  const cropCenterY = cropTop + cropH / 2;
  const tx = stageW / 2 - cropCenterX * scale;
  const ty = stageH / 2 - cropCenterY * scale;

  return { scale, tx, ty };
}

/**
 * Compute the pixel rectangle where an image renders within a container
 * when using object-fit: contain. Returns position and size of the
 * actual image content area within the container.
 */
export function computeImageContentRect(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number,
): { left: number; top: number; width: number; height: number } {
  if (!naturalWidth || !naturalHeight || !containerWidth || !containerHeight) {
    return { left: 0, top: 0, width: containerWidth || 0, height: containerHeight || 0 };
  }

  const imgAspect = naturalWidth / naturalHeight;
  const containerAspect = containerWidth / containerHeight;

  if (imgAspect > containerAspect) {
    // Image is wider — fills width, letterboxed vertically
    const height = containerWidth / imgAspect;
    return { left: 0, top: (containerHeight - height) / 2, width: containerWidth, height };
  }
  // Image is taller or equal — fills height, pillarboxed horizontally
  const width = containerHeight * imgAspect;
  return { left: (containerWidth - width) / 2, top: 0, width, height: containerHeight };
}

/**
 * Position the overlay wrapper to match the image content area within the stage.
 * Also expands the SVG mask (if present) to cover the full stage so that
 * pillarbox/letterbox areas are dimmed, not just the image area.
 */
function positionOverlayWrapper(
  wrapper: HTMLDivElement,
  img: HTMLImageElement,
  stage: HTMLDivElement,
): void {
  const rect = computeImageContentRect(
    img.naturalWidth,
    img.naturalHeight,
    stage.clientWidth,
    stage.clientHeight,
  );
  wrapper.style.left = `${rect.left}px`;
  wrapper.style.top = `${rect.top}px`;
  wrapper.style.width = `${rect.width}px`;
  wrapper.style.height = `${rect.height}px`;

  expandMaskToStage(wrapper, rect, stage.clientWidth, stage.clientHeight);
}

/**
 * Expand the SVG mask to cover the full stage (beyond the overlay wrapper).
 * Adjusts the viewBox so that 0–1 region coordinates still map to the image area,
 * while the mask background and overlay rects extend to cover pillarbox/letterbox gaps.
 */
function expandMaskToStage(
  wrapper: HTMLDivElement,
  imageRect: { left: number; top: number; width: number; height: number },
  stageWidth: number,
  stageHeight: number,
): void {
  const maskSvg = wrapper.querySelector<SVGSVGElement>('.cis-mask');
  if (!maskSvg || imageRect.width <= 0 || imageRect.height <= 0) return;

  // Position the SVG to cover the full stage (escaping the wrapper bounds)
  maskSvg.style.left = `${-imageRect.left}px`;
  maskSvg.style.top = `${-imageRect.top}px`;
  maskSvg.style.width = `${stageWidth}px`;
  maskSvg.style.height = `${stageHeight}px`;

  // Adjust viewBox so 0–1 region coords still map to the image content area
  const minX = -imageRect.left / imageRect.width;
  const minY = -imageRect.top / imageRect.height;
  const vbW = stageWidth / imageRect.width;
  const vbH = stageHeight / imageRect.height;
  maskSvg.setAttribute('viewBox', `${minX} ${minY} ${vbW} ${vbH}`);

  // Expand the mask background rect to fill the full viewBox
  const maskEl = maskSvg.querySelector('mask');
  if (maskEl) {
    const whiteRect = maskEl.querySelector('rect[fill="white"]');
    if (whiteRect) {
      whiteRect.setAttribute('x', String(minX));
      whiteRect.setAttribute('y', String(minY));
      whiteRect.setAttribute('width', String(vbW));
      whiteRect.setAttribute('height', String(vbH));
    }
  }

  // Expand the overlay rect (direct child of SVG, not in defs)
  const overlayRect = maskSvg.querySelector(':scope > rect[mask]');
  if (overlayRect) {
    overlayRect.setAttribute('x', String(minX));
    overlayRect.setAttribute('y', String(minY));
    overlayRect.setAttribute('width', String(vbW));
    overlayRect.setAttribute('height', String(vbH));
  }
}

/**
 * Create an inline SVG <clipPath> for blur mode and apply it to the sharp image.
 * Supports multiple regions with individual rect/ellipse shapes.
 * The SVG is injected into the stage DOM so url(#id) resolves within the shadow root.
 */
function applyBlurClipPath(
  sharpImg: HTMLImageElement,
  regions: import('./types').SpotlightRegion[],
  instanceId: string,
  sceneId: string,
  stage: HTMLDivElement,
): void {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const clipId = `cis-blur-clip-${instanceId}-${sceneId}`;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';

  const clipPath = document.createElementNS(SVG_NS, 'clipPath');
  clipPath.setAttribute('id', clipId);
  clipPath.setAttribute('clipPathUnits', 'objectBoundingBox');

  for (const r of regions) {
    if (r.shape === 'ellipse') {
      const el = document.createElementNS(SVG_NS, 'ellipse');
      el.setAttribute('cx', String((r.tl_x + r.br_x) / 2));
      el.setAttribute('cy', String((r.tl_y + r.br_y) / 2));
      el.setAttribute('rx', String((r.br_x - r.tl_x) / 2));
      el.setAttribute('ry', String((r.br_y - r.tl_y) / 2));
      clipPath.appendChild(el);
    } else {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(r.tl_x));
      rect.setAttribute('y', String(r.tl_y));
      rect.setAttribute('width', String(r.br_x - r.tl_x));
      rect.setAttribute('height', String(r.br_y - r.tl_y));
      clipPath.appendChild(rect);
    }
  }

  svg.appendChild(clipPath);
  stage.appendChild(svg);

  sharpImg.style.clipPath = `url(#${clipId})`;
}

/**
 * Generate alt text for a scene image.
 * Format: "Step {n} of {total}: {title} — {description truncated to 80 chars}"
 */
export function generateAltText(
  scene: SpotlightScene,
  index: number,
  totalScenes: number,
  strings: CISStrings,
): string {
  const stepText = interpolate(strings.progress, { n: index + 1, total: totalScenes });
  const parts = [stepText];

  if (scene.title) {
    parts.push(scene.title);
  }

  if (scene.description) {
    const truncated =
      scene.description.length > 80
        ? scene.description.slice(0, 80) + '…'
        : scene.description;
    parts.push(truncated);
  }

  // Format: "Step N of M: Title — Description"
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]}: ${parts[1]}`;
  return `${parts[0]}: ${parts[1]} — ${parts[2]}`;
}

/**
 * Render a fallback placeholder when an image fails to load.
 */
function renderImageFallback(stage: HTMLDivElement, scene: SpotlightScene): void {
  const fallback = document.createElement('div');
  fallback.className = 'cis-image-fallback';
  const text = document.createElement('span');
  text.className = 'cis-image-fallback__text';
  text.textContent = `Failed to load image${scene.title ? ` for "${scene.title}"` : ''}`;
  fallback.appendChild(text);
  stage.appendChild(fallback);
}

/**
 * Check if a loaded image meets the minimum resolution recommendation.
 */
export function checkImageResolution(img: HTMLImageElement, sceneId: string): void {
  if (img.naturalWidth > 0 && img.naturalWidth < 1920) {
    console.warn(
      `[cloudimage-spotlight] Scene "${sceneId}": source image is ${img.naturalWidth}px wide. ` +
        'Recommended minimum: 1920px for optimal zoom quality.',
    );
  }
}


