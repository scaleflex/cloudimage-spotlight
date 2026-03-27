import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, validateConfig } from '../src/config-loader';
import { CISError } from '../src/types';
import type { SpotlightConfig } from '../src/types';

// ---------------------------------------------------------------------------
// validateConfig
// ---------------------------------------------------------------------------

describe('validateConfig', () => {
  const minimal: SpotlightConfig = {
    version: '1.0',
    ciToken: 'demo',
    scenes: [{ id: 'intro', image: 'https://example.com/img.jpg' }],
  };

  it('accepts a minimal valid config', () => {
    const result = validateConfig(minimal);
    expect(result.version).toBe('1.0');
    expect(result.scenes).toHaveLength(1);
  });

  it('throws INVALID_JSON for non-object', () => {
    expect(() => validateConfig('string')).toThrow(CISError);
    expect(() => validateConfig('string')).toThrow('Config must be a JSON object');
    expect(() => validateConfig(null)).toThrow(CISError);
    expect(() => validateConfig(42)).toThrow(CISError);
    expect(() => validateConfig([])).toThrow(CISError);
  });

  it('warns on unknown version but does not throw', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = { ...minimal, version: '2.0' };
    const result = validateConfig(config);
    expect(result).toBeDefined();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown config version "2.0"'),
    );
    spy.mockRestore();
  });

  it('throws MISSING_TOKEN when ciToken is absent', () => {
    const config = { version: '1.0', scenes: [{ id: 'a', image: 'img' }] };
    expect(() => validateConfig(config)).toThrow(CISError);
    try {
      validateConfig(config);
    } catch (e) {
      expect((e as CISError).code).toBe('MISSING_TOKEN');
    }
  });

  it('throws INVALID_JSON when scenes is empty', () => {
    const config = { version: '1.0', ciToken: 'demo', scenes: [] };
    expect(() => validateConfig(config)).toThrow(CISError);
    try {
      validateConfig(config);
    } catch (e) {
      expect((e as CISError).code).toBe('INVALID_JSON');
    }
  });

  it('throws INVALID_JSON when scenes is missing', () => {
    const config = { version: '1.0', ciToken: 'demo' };
    expect(() => validateConfig(config)).toThrow(CISError);
  });

  it('throws INVALID_JSON for duplicate scene IDs', () => {
    const config = {
      ...minimal,
      scenes: [
        { id: 'dup', image: 'a' },
        { id: 'dup', image: 'b' },
      ],
    };
    try {
      validateConfig(config);
    } catch (e) {
      expect((e as CISError).code).toBe('INVALID_JSON');
      expect((e as CISError).message).toContain('Duplicate scene IDs');
    }
  });

  describe('region validation', () => {
    it('throws INVALID_REGION for coordinates outside 0-1 range', () => {
      const config = {
        ...minimal,
        scenes: [
          {
            id: 's1',
            image: 'img',
            regions: [{ tl_x: -0.1, tl_y: 0, br_x: 0.5, br_y: 0.5 }],
          },
        ],
      };
      try {
        validateConfig(config);
      } catch (e) {
        expect((e as CISError).code).toBe('INVALID_REGION');
        expect((e as CISError).message).toContain('between 0 and 1');
      }
    });

    it('throws INVALID_REGION when br_x > 1', () => {
      const config = {
        ...minimal,
        scenes: [
          {
            id: 's1',
            image: 'img',
            regions: [{ tl_x: 0.5, tl_y: 0, br_x: 1.1, br_y: 0.5 }],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(CISError);
    });

    it('throws INVALID_REGION when tl_x >= br_x', () => {
      const config = {
        ...minimal,
        scenes: [
          {
            id: 's1',
            image: 'img',
            regions: [{ tl_x: 0.5, tl_y: 0, br_x: 0.5, br_y: 0.5 }],
          },
        ],
      };
      try {
        validateConfig(config);
      } catch (e) {
        expect((e as CISError).code).toBe('INVALID_REGION');
        expect((e as CISError).message).toContain('tl must be less than br');
      }
    });

    it('throws INVALID_REGION when tl_y >= br_y', () => {
      const config = {
        ...minimal,
        scenes: [
          {
            id: 's1',
            image: 'img',
            regions: [{ tl_x: 0, tl_y: 0.6, br_x: 0.5, br_y: 0.4 }],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(CISError);
    });

    it('accepts coordinates at exact boundaries (0 and 1)', () => {
      const config = {
        ...minimal,
        scenes: [
          {
            id: 's1',
            image: 'img',
            regions: [{ tl_x: 0, tl_y: 0, br_x: 1, br_y: 1 }],
          },
        ],
      };
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('accepts scenes with no regions', () => {
      expect(() => validateConfig(minimal)).not.toThrow();
    });

    it('accepts scenes with empty regions array', () => {
      const config = {
        ...minimal,
        scenes: [{ id: 's1', image: 'img', regions: [] }],
      };
      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe('metadata coercion', () => {
    it('coerces non-string metadata values to strings', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const config = {
        ...minimal,
        scenes: [
          {
            id: 's1',
            image: 'img',
            metadata: { count: 42 as unknown as string, name: 'valid' },
          },
        ],
      };
      const result = validateConfig(config);
      expect(result.scenes[0].metadata!.count).toBe('42');
      expect(result.scenes[0].metadata!.name).toBe('valid');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('metadata.count is not a string'),
      );
      spy.mockRestore();
    });
  });
});

// ---------------------------------------------------------------------------
// loadConfig
// ---------------------------------------------------------------------------

describe('loadConfig', () => {
  const validJson: SpotlightConfig = {
    version: '1.0',
    ciToken: 'demo',
    scenes: [{ id: 'intro', image: 'https://example.com/img.jpg' }],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and validates a config URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(validJson), { status: 200 }),
    );

    const result = await loadConfig('https://cdn.example.com/config.json');
    expect(result.ciToken).toBe('demo');
    expect(fetch).toHaveBeenCalledWith('https://cdn.example.com/config.json', {
      signal: undefined,
    });
  });

  it('throws FETCH_FAILED on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    try {
      await loadConfig('https://cdn.example.com/config.json');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CISError);
      expect((e as CISError).code).toBe('FETCH_FAILED');
      expect((e as CISError).message).toContain('404');
    }
  });

  it('throws FETCH_FAILED on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      await loadConfig('https://cdn.example.com/config.json');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CISError);
      expect((e as CISError).code).toBe('FETCH_FAILED');
    }
  });

  it('throws INVALID_JSON on malformed JSON response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('not json{{{', { status: 200 }),
    );

    try {
      await loadConfig('https://cdn.example.com/config.json');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CISError);
      expect((e as CISError).code).toBe('INVALID_JSON');
    }
  });

  it('passes AbortSignal to fetch', async () => {
    const controller = new AbortController();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(validJson), { status: 200 }),
    );

    await loadConfig('https://cdn.example.com/config.json', controller.signal);
    expect(fetch).toHaveBeenCalledWith(
      'https://cdn.example.com/config.json',
      { signal: controller.signal },
    );
  });

  it('propagates AbortError as-is', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);

    try {
      await loadConfig('https://cdn.example.com/config.json');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(DOMException);
      expect((e as DOMException).name).toBe('AbortError');
    }
  });
});
