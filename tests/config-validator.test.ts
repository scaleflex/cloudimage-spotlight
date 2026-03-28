import { describe, it, expect, vi } from 'vitest';
import { sanitizeCtaHref } from '../src/validation';

// ---------------------------------------------------------------------------
// sanitizeCtaHref
// ---------------------------------------------------------------------------

describe('sanitizeCtaHref', () => {
  it('returns null for undefined href', () => {
    expect(sanitizeCtaHref(undefined)).toBeNull();
  });

  it('allows https:// URLs', () => {
    expect(sanitizeCtaHref('https://example.com')).toBe('https://example.com');
  });

  it('allows http:// URLs', () => {
    expect(sanitizeCtaHref('http://example.com')).toBe('http://example.com');
  });

  it('allows relative URLs starting with /', () => {
    expect(sanitizeCtaHref('/docs/feature')).toBe('/docs/feature');
  });

  it('blocks javascript: URLs', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(sanitizeCtaHref('javascript:alert(1)')).toBeNull();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('CTA href blocked'),
    );
    spy.mockRestore();
  });

  it('blocks data: URLs', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(sanitizeCtaHref('data:text/html,<h1>XSS</h1>')).toBeNull();
    spy.mockRestore();
  });

  it('blocks vbscript: URLs', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(sanitizeCtaHref('vbscript:MsgBox("XSS")')).toBeNull();
    spy.mockRestore();
  });

  it('blocks blob: URLs', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(sanitizeCtaHref('blob:https://example.com/abc')).toBeNull();
    spy.mockRestore();
  });

  it('is case-insensitive for scheme detection', () => {
    expect(sanitizeCtaHref('HTTPS://example.com')).toBe('HTTPS://example.com');
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(sanitizeCtaHref('JAVASCRIPT:alert(1)')).toBeNull();
    spy.mockRestore();
  });

  it('blocks scheme with leading whitespace', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(sanitizeCtaHref('  javascript:alert(1)')).toBeNull();
    spy.mockRestore();
  });

  it('blocks unknown schemes', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(sanitizeCtaHref('ftp://example.com')).toBeNull();
    spy.mockRestore();
  });
});
