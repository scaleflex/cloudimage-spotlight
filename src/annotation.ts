import type { SpotlightScene, SpotlightCTA, CISCTAClickDetail, CISStrings } from './types';
import { sanitizeCtaHref } from './validation';
import { interpolate } from './i18n';
import { iconX, iconCheck } from './icons';

export interface AnnotationCallbacks {
  onCtaClick: (detail: CISCTAClickDetail) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export interface AnnotationOptions {
  index: number;
  totalScenes: number;
  strings: CISStrings;
  showProgress: boolean;
  allowSkip: boolean;
}

/**
 * Create an annotation card element for a scene.
 * The card always renders (navigation controls are embedded).
 * All text rendered via textContent (never innerHTML).
 */
export function createAnnotation(
  scene: SpotlightScene,
  options: AnnotationOptions,
  callbacks: AnnotationCallbacks,
): HTMLDivElement {
  const { index, totalScenes, strings, showProgress, allowSkip } = options;
  const annotation = scene.annotation ?? {};
  const maxWidth = annotation.maxWidth;
  const isFirst = index === 0;
  const isLast = index >= totalScenes - 1;

  const card = document.createElement('div');
  card.className = 'cis-annotation';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');

  // Apply maxWidth as inline style if set in config
  if (maxWidth !== undefined) {
    card.style.maxWidth = `${maxWidth}px`;
  }

  // Apply annotation style variant class
  const style = annotation.style ?? 'card';
  if (style !== 'card') {
    card.classList.add(`cis-annotation--${style}`);
  }

  // --- Header row: title + progress pill + close button ---
  const header = document.createElement('div');
  header.className = 'cis-annotation__header';

  if (scene.title) {
    const title = document.createElement('p');
    title.className = 'cis-annotation__title';
    title.textContent = scene.title;
    header.appendChild(title);
  }

  if (showProgress) {
    const progress = document.createElement('span');
    progress.className = 'cis-annotation__progress';
    progress.setAttribute('aria-live', 'polite');
    progress.setAttribute('aria-atomic', 'true');
    progress.textContent = interpolate(strings.progressShort, { n: index + 1, total: totalScenes });
    header.appendChild(progress);
  }

  if (allowSkip) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'cis-annotation__close';
    closeBtn.setAttribute('aria-label', strings.close);
    closeBtn.setAttribute('type', 'button');
    closeBtn.appendChild(iconX(14));
    closeBtn.addEventListener('click', callbacks.onSkip);
    header.appendChild(closeBtn);
  }

  card.appendChild(header);

  // --- Description ---
  if (scene.description) {
    const body = document.createElement('p');
    body.className = 'cis-annotation__body';
    body.textContent = scene.description;
    card.appendChild(body);
  }

  // --- CTA button ---
  if (scene.cta) {
    const ctaEl = createCTAElement(scene, scene.cta, callbacks);
    if (ctaEl) {
      card.appendChild(ctaEl);
    }
  }

  // --- Navigation footer ---
  const nav = document.createElement('nav');
  nav.className = 'cis-annotation__nav';
  nav.setAttribute('aria-label', strings.navLabel);

  if (!isFirst) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'cis-annotation__btn cis-annotation__btn--prev';
    prevBtn.setAttribute('aria-label', strings.prev);
    prevBtn.setAttribute('type', 'button');
    prevBtn.textContent = strings.prev;
    prevBtn.addEventListener('click', callbacks.onPrev);
    nav.appendChild(prevBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.setAttribute('type', 'button');
  if (isLast) {
    nextBtn.className = 'cis-annotation__btn cis-annotation__btn--next cis-annotation__btn--finish';
    nextBtn.setAttribute('aria-label', strings.finish);
    const label = document.createElement('span');
    label.textContent = strings.finish;
    nextBtn.appendChild(label);
    nextBtn.appendChild(iconCheck(14));
  } else {
    nextBtn.className = 'cis-annotation__btn cis-annotation__btn--next';
    nextBtn.setAttribute('aria-label', strings.next);
    nextBtn.textContent = strings.next;
  }
  nextBtn.addEventListener('click', callbacks.onNext);
  nav.appendChild(nextBtn);

  card.appendChild(nav);

  return card;
}

/**
 * Update an existing annotation card's navigation state in-place.
 * Used when strings change without a full scene re-render.
 */
export function updateAnnotation(
  card: HTMLDivElement,
  options: AnnotationOptions,
): void {
  const { index, totalScenes, strings, showProgress } = options;

  // Update progress pill
  const progress = card.querySelector('.cis-annotation__progress');
  if (progress && showProgress) {
    progress.textContent = interpolate(strings.progressShort, { n: index + 1, total: totalScenes });
  }

  // Update close button label
  const closeBtn = card.querySelector('.cis-annotation__close');
  if (closeBtn) {
    closeBtn.setAttribute('aria-label', strings.close);
  }

  // Update nav label
  const nav = card.querySelector('.cis-annotation__nav');
  if (nav) {
    nav.setAttribute('aria-label', strings.navLabel);
  }

  // Update prev button
  const prevBtn = card.querySelector('.cis-annotation__btn--prev');
  if (prevBtn) {
    prevBtn.setAttribute('aria-label', strings.prev);
    prevBtn.textContent = strings.prev;
  }

  // Update next button
  const nextBtn = card.querySelector('.cis-annotation__btn--next');
  if (nextBtn) {
    const isLast = index >= totalScenes - 1;
    nextBtn.setAttribute('aria-label', isLast ? strings.finish : strings.next);
    // Rebuild content for finish vs next
    nextBtn.textContent = '';
    if (isLast) {
      nextBtn.classList.add('cis-annotation__btn--finish');
      const label = document.createElement('span');
      label.textContent = strings.finish;
      nextBtn.appendChild(label);
      nextBtn.appendChild(iconCheck(14));
    } else {
      nextBtn.classList.remove('cis-annotation__btn--finish');
      nextBtn.textContent = strings.next;
    }
  }
}

/**
 * Create a CTA element — either an <a> link or a <button>.
 */
function createCTAElement(
  scene: SpotlightScene,
  cta: SpotlightCTA,
  callbacks: AnnotationCallbacks,
): HTMLElement | null {
  const safeHref = sanitizeCtaHref(cta.href);

  const isLink = cta.style === 'link';

  if (safeHref) {
    // Render as <a> link
    const link = document.createElement('a');
    link.className = isLink ? 'cis-cta cis-cta--link' : 'cis-cta';
    link.href = safeHref;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = cta.label;
    return link;
  }

  // No href (or blocked href) — render as <button> that dispatches event
  const button = document.createElement('button');
  button.className = isLink ? 'cis-cta cis-cta--link' : 'cis-cta';
  button.type = 'button';
  button.textContent = cta.label;
  button.addEventListener('click', () => {
    callbacks.onCtaClick({
      scene,
      cta,
      metadata: cta.metadata ?? scene.metadata,
    });
  });
  return button;
}
