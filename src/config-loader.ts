import type { SpotlightConfig, SpotlightScene } from './types';
import { CISError } from './types';

/**
 * Fetch and validate a config JSON from a URL.
 * Uses default fetch mode ('cors') and credentials ('same-origin').
 */
export async function loadConfig(
  url: string,
  signal?: AbortSignal,
): Promise<SpotlightConfig> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err; // Let AbortError propagate as-is
    }
    throw new CISError('FETCH_FAILED', `Failed to load config: network error for ${url}`);
  }

  if (!res.ok) {
    throw new CISError('FETCH_FAILED', `Failed to load config: ${res.status} ${url}`);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new CISError('INVALID_JSON', `Config at ${url} is not valid JSON`);
  }

  return validateConfig(json);
}

/**
 * Validate a raw JSON value as a SpotlightConfig.
 * Throws CISError for invalid configs. Warns on unknown versions.
 * Coerces non-string metadata values to strings.
 */
export function validateConfig(raw: unknown): SpotlightConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new CISError('INVALID_JSON', 'Config must be a JSON object');
  }

  const config = raw as Record<string, unknown>;

  // Version check — warn but don't reject
  if (config.version !== '1.0') {
    console.warn(
      `[cloudimage-spotlight] Unknown config version "${config.version}". Attempting best-effort render.`,
    );
  }

  // Required fields
  if (!config.ciToken) {
    throw new CISError('MISSING_TOKEN', "'ciToken' is required in config JSON");
  }

  if (!Array.isArray(config.scenes) || config.scenes.length === 0) {
    throw new CISError('INVALID_JSON', "'scenes' must be a non-empty array");
  }

  const scenes = config.scenes as SpotlightScene[];

  // Validate unique scene IDs
  const ids = scenes.map((s) => s.id);
  if (new Set(ids).size !== ids.length) {
    throw new CISError('INVALID_JSON', 'Duplicate scene IDs found');
  }

  // Validate scene image fields
  for (const scene of scenes) {
    if (!scene.image) {
      throw new CISError('MISSING_IMAGE', `Scene "${scene.id}" is missing an 'image' field.`);
    }
  }

  // Validate region coordinates
  for (const scene of scenes) {
    for (const region of scene.regions ?? []) {
      if (
        region.tl_x < 0 ||
        region.tl_y < 0 ||
        region.br_x > 1 ||
        region.br_y > 1
      ) {
        throw new CISError(
          'INVALID_REGION',
          `Scene "${scene.id}": region coordinates must be between 0 and 1`,
        );
      }
      if (region.tl_x >= region.br_x || region.tl_y >= region.br_y) {
        throw new CISError(
          'INVALID_REGION',
          `Scene "${scene.id}": region tl must be less than br`,
        );
      }
    }
  }

  // Coerce non-string metadata values
  for (const scene of scenes) {
    if (scene.metadata) {
      for (const [key, val] of Object.entries(scene.metadata)) {
        if (typeof val !== 'string') {
          console.warn(
            `[cloudimage-spotlight] Scene "${scene.id}": metadata.${key} is not a string, coercing`,
          );
          (scene.metadata as Record<string, string>)[key] = String(val);
        }
      }
    }
  }

  // All required fields validated above — safe to cast
  return config as unknown as SpotlightConfig;
}
