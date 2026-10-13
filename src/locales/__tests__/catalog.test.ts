import { afterEach, describe, expect, it } from 'vitest';

import { formatNumber } from '@/lib/i18n';

import { t, translations } from '..';
import { getLanguage } from '../activeLanguage';

function setLang(lang: string) {
  document.documentElement.lang = lang;
}

afterEach(() => setLang(''));

describe('t (read-through catalog, ADR-0019)', () => {
  it('reads the language written on <html lang>', () => {
    setLang('en');
    expect(t.buttons.save).toBe('Save');
    setLang('fr');
    expect(t.buttons.save).toBe('Enregistrer');
  });

  it('falls back to English for a missing or unsupported language', () => {
    setLang('de');
    expect(getLanguage()).toBe('en');
    expect(t.buttons.save).toBe('Save');
  });

  it('keeps a captured nested object live, which is what module-scope `copy` relies on', () => {
    const copy = t.buttons;
    setLang('en');
    expect(copy.cancel).toBe('Cancel');
    setLang('fr');
    expect(copy.cancel).toBe('Annuler');
  });

  it('returns the same view for the same path, so it is stable as a React dependency', () => {
    expect(t.agents.detail).toBe(t.agents.detail);
  });

  it('behaves like the catalog for arrays and key iteration', () => {
    setLang('fr');
    expect(Array.isArray(t.auth.heroFeatures)).toBe(true);
    expect(t.auth.heroFeatures.map((feature) => feature)).toEqual(
      translations.fr.auth.heroFeatures
    );
    expect(Object.keys(t.buttons)).toEqual(Object.keys(translations.en.buttons));
    expect(Object.entries(t.analytics.metrics)[0]).toEqual([
      'conversations',
      translations.fr.analytics.metrics.conversations,
    ]);
  });

  it('formats numbers in the active language', () => {
    setLang('fr');
    expect(formatNumber(1234.5)).toMatch(/1\s?234,5/);
    setLang('en');
    expect(formatNumber(1234.5)).toBe('1,234.5');
  });
});

describe('French catalog', () => {
  it('never uses an em-dash in user-facing text', () => {
    const strings: string[] = [];
    (function walk(node: unknown) {
      if (typeof node === 'string') strings.push(node);
      else if (node && typeof node === 'object') Object.values(node).forEach(walk);
    })(translations.fr);
    expect(strings.filter((value) => value.includes('—'))).toEqual([]);
  });

  it('keeps every {placeholder} the English text has', () => {
    const missing: string[] = [];
    (function walk(en: unknown, fr: unknown, path: string) {
      if (typeof en === 'string' && typeof fr === 'string') {
        for (const token of en.match(/\{\w+\}/g) ?? []) {
          if (!fr.includes(token)) missing.push(`${path} ${token}`);
        }
      } else if (en && typeof en === 'object' && fr && typeof fr === 'object') {
        for (const key of Object.keys(en)) {
          walk(
            (en as Record<string, unknown>)[key],
            (fr as Record<string, unknown>)[key],
            `${path}.${key}`
          );
        }
      }
    })(translations.en, translations.fr, 't');
    expect(missing).toEqual([]);
  });
});
