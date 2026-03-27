import { CISError } from './types';

const ALLOWED_SCHEMES = ['https://', 'http://'];

/**
 * Validate that a scene has a valid image URL and ciToken.
 * Throws CISError if either is missing.
 */
export function validateSceneImage(image: string, ciToken: string): void {
  if (!image) {
    throw new CISError('MISSING_IMAGE', "Scene is missing an 'image' field.");
  }
  if (!ciToken) {
    throw new CISError(
      'MISSING_TOKEN',
      "'ciToken' is required. Set it in the config JSON or via the ci-token attribute.",
    );
  }
}

/**
 * Sanitize a CTA href value.
 * Only https://, http://, and relative (/) URLs are allowed.
 * Returns the href if safe, or null if blocked (with console.warn).
 */
export function sanitizeCtaHref(href: string | undefined): string | null {
  if (!href) return null;

  const trimmed = href.trim();
  if (!trimmed) return null;

  // Relative URLs are always allowed
  if (trimmed.startsWith('/')) return trimmed;

  // Check allowed schemes
  const lower = trimmed.toLowerCase();
  for (const scheme of ALLOWED_SCHEMES) {
    if (lower.startsWith(scheme)) return trimmed;
  }

  // Block dangerous schemes: javascript:, data:, vbscript:, blob:, etc.
  console.warn(
    `[cloudimage-spotlight] CTA href blocked: "${href}". Only https://, http://, and relative (/) URLs are allowed.`,
  );
  return null;
}
