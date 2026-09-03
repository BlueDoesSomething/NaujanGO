const CACHE_PREFIX = 'naujan:site-settings:';

const buildCacheKey = (key, scope = '') => {
  if (!scope) return `${CACHE_PREFIX}${key}`;
  return `${CACHE_PREFIX}${scope}:${key}`;
};

export const loadCachedSetting = (key, fallback = null, scope = '') => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(buildCacheKey(key, scope));
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const saveCachedSetting = (key, value, scope = '') => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(buildCacheKey(key, scope), JSON.stringify(value));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
};