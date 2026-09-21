import { describe, expect, it } from 'vitest';

import { checkBrandAsset } from '@/lib/constants/brandAssets';

const file = (name: string, type: string, size = 1024) =>
  new File([new Uint8Array(size)], name, { type });

describe('checkBrandAsset (mirrors the backend upload rules)', () => {
  it('accepts PNG, JPEG and WebP logos within 2 MB', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      expect(checkBrandAsset('logo', file('logo', type))).toBeNull();
    }
  });

  it('rejects SVG and GIF logos by type', () => {
    expect(checkBrandAsset('logo', file('logo.svg', 'image/svg+xml'))).toBe('type');
    expect(checkBrandAsset('logo', file('logo.gif', 'image/gif'))).toBe('type');
  });

  it('rejects a logo over 2 MB and accepts exactly 2 MB', () => {
    expect(checkBrandAsset('logo', file('a.png', 'image/png', 2 * 1024 * 1024 + 1))).toBe('size');
    expect(checkBrandAsset('logo', file('a.png', 'image/png', 2 * 1024 * 1024))).toBeNull();
  });

  it('accepts PNG and ICO favicons, including an .ico the browser leaves untyped', () => {
    expect(checkBrandAsset('favicon', file('f.png', 'image/png'))).toBeNull();
    expect(checkBrandAsset('favicon', file('f.ico', 'image/x-icon'))).toBeNull();
    expect(checkBrandAsset('favicon', file('f.ico', ''))).toBeNull();
  });

  it('rejects JPEG and WebP favicons, which are logo-only', () => {
    expect(checkBrandAsset('favicon', file('f.jpg', 'image/jpeg'))).toBe('type');
    expect(checkBrandAsset('favicon', file('f.webp', 'image/webp'))).toBe('type');
  });

  it('rejects a favicon over 512 KB', () => {
    expect(checkBrandAsset('favicon', file('f.png', 'image/png', 512 * 1024 + 1))).toBe('size');
  });
});
