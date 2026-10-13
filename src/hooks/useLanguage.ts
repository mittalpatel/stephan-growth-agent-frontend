'use client';

import {
  LANGUAGE_COOKIE,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  type Language,
} from '@/config/language';
import { getLanguage } from '@/locales/activeLanguage';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * The viewer's language and how to change it.
 *
 * The choice lives in the `LANGUAGE_COOKIE` so the server renders the next
 * page in it (ADR-0019). Switching reloads the page: every string, formatter
 * and API client then starts over in the new language, which is simpler and
 * more reliable than re-rendering a tree that has cached text in places.
 */
export function useLanguage() {
  const setLanguage = (language: Language) => {
    if (language === getLanguage()) return;
    document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    window.location.reload();
  };

  return {
    language: getLanguage(),
    options: SUPPORTED_LANGUAGES.map((code) => ({ value: code, label: LANGUAGE_NAMES[code] })),
    // Nothing to choose between until a second catalog ships.
    canSwitch: SUPPORTED_LANGUAGES.length > 1,
    setLanguage,
  };
}
