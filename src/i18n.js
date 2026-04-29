// Tiny i18n harness — Korean (default) + English.
//
// Pattern: instead of a translation key/value system, scenes call
//   tr('한국어', 'English')
// inline at the use site. Reads cleaner for a small game and keeps the
// Korean text right next to its English counterpart for review.
//
// Data files (characters / memories / recipes) maintain a parallel
// en variant; their getters check getLocale() to pick.

const STORAGE_KEY = 'yss_locale';
const SUPPORTED = ['ko', 'en'];

let locale = 'ko';
const listeners = new Set();

(function init() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) {
      locale = saved;
      return;
    }
  } catch (_) {}
  // No persisted choice — pick by browser language.
  const nav = (typeof navigator !== 'undefined' && navigator.language) || '';
  if (!nav.toLowerCase().startsWith('ko')) locale = 'en';
})();

export function getLocale() {
  return locale;
}

export function setLocale(loc) {
  if (!SUPPORTED.includes(loc) || loc === locale) return;
  locale = loc;
  try { localStorage.setItem(STORAGE_KEY, loc); } catch (_) {}
  for (const fn of listeners) fn(loc);
}

export function toggleLocale() {
  setLocale(locale === 'ko' ? 'en' : 'ko');
  return locale;
}

export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Pick the localized variant for an inline string. Args are (ko, en).
export function tr(ko, en) {
  return locale === 'en' ? en : ko;
}
