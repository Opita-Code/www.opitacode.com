/**
 * i18n helper for the Opita Code landing.
 * Loads es.json and en.json at build time (Vite tree-shakes the unused locale).
 *
 * Usage in Astro components:
 *   ---
 *   import { t } from '../i18n';
 *   const { lang } = Astro.props;
 *   ---
 *   <h1>{t(lang, 'hero.title-pre')} {t(lang, 'hero.title-post')}</h1>
 *
 * Usage with variable interpolation:
 *   t(lang, 'footer.copyright', { year: 2026 })
 *   // → "© 2026 Opita Code."
 *
 * Usage with nested keys (dot notation):
 *   t(lang, 'nav.ecosystem')
 *   // → "Ecosistema" (es) or "Ecosystem" (en)
 *
 * Missing keys log a warning and return the key path as a fallback.
 */

import esDict from './es.json';
import enDict from './en.json';

export type Lang = 'es' | 'en';

const dictionaries: Record<Lang, Record<string, any>> = {
  es: esDict as Record<string, any>,
  en: enDict as Record<string, any>,
};

const DEFAULT_LANG: Lang = 'es';

/**
 * Resolve a nested key path (dot notation) to a value.
 * Returns undefined if any segment is missing.
 */
function resolve(dict: Record<string, any>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dict);
}

/**
 * Interpolate `{name}` placeholders in a string.
 */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

/**
 * Get a translation for a key in a given language.
 *
 * @param lang - 'es' or 'en'
 * @param key - Dot-notation key path (e.g. 'nav.ecosystem')
 * @param vars - Optional variable interpolation map
 * @returns The translated string, or the key path if not found
 */
export function t(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[lang] ?? dictionaries[DEFAULT_LANG];
  const value = resolve(dict, key);

  if (value === undefined || value === null) {
    if (typeof window !== 'undefined') {
      // Browser: warn so devs see missing keys
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Missing translation: ${key} for lang=${lang}`);
    }
    // Fallback to key path (visible in UI so it's obvious)
    return key;
  }

  if (typeof value !== 'string') {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Non-string value for key: ${key} (lang=${lang})`);
    }
    return key;
  }

  return interpolate(value, vars);
}

/**
 * Get the full dictionary for a language (useful for client-side hydration).
 */
export function getDict(lang: Lang): Record<string, any> {
  return dictionaries[lang] ?? dictionaries[DEFAULT_LANG];
}

/**
 * Get the list of supported languages.
 */
export function getSupportedLangs(): Lang[] {
  return Object.keys(dictionaries) as Lang[];
}

/**
 * Check if a string is a supported language code.
 */
export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && value in dictionaries;
}
