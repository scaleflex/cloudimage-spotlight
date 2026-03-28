import type { CISStrings } from './types';

export const DEFAULT_STRINGS: CISStrings = {
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

/**
 * Interpolate template variables in a string.
 * Replaces {key} with the corresponding value from the vars object.
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    return key in vars ? String(vars[key]) : match;
  });
}

/**
 * Merge user-provided partial strings with defaults.
 */
export function resolveStrings(overrides?: Partial<CISStrings>): CISStrings {
  return { ...DEFAULT_STRINGS, ...overrides };
}
