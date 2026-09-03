/**
 * i18n formatting utilities for dates, numbers, plurals, and RTL support
 */

export const formatDate = (date, locale = 'en', options = {}) => {
  if (!date) return '';
  const d = new Date(date);
  const defaultOpts = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString(locale === 'tl' ? 'fil-PH' : locale === 'es' ? 'es-ES' : 'en-US', { ...defaultOpts, ...options });
};

export const formatTime = (date, locale = 'en', options = {}) => {
  if (!date) return '';
  const d = new Date(date);
  const defaultOpts = { hour: '2-digit', minute: '2-digit' };
  return d.toLocaleTimeString(locale === 'tl' ? 'fil-PH' : locale === 'es' ? 'es-ES' : 'en-US', { ...defaultOpts, ...options });
};

export const formatDateTime = (date, locale = 'en') => {
  if (!date) return '';
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`;
};

export const formatNumber = (num, locale = 'en', options = {}) => {
  if (typeof num !== 'number') return num;
  const defaultOpts = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
  return num.toLocaleString(locale === 'tl' ? 'fil-PH' : locale === 'es' ? 'es-ES' : 'en-US', { ...defaultOpts, ...options });
};

export const formatCurrency = (amount, locale = 'en', currency = 'PHP') => {
  if (typeof amount !== 'number') return amount;
  const currencyCode = currency.toUpperCase();
  return amount.toLocaleString(locale === 'tl' ? 'fil-PH' : locale === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

export const formatPlural = (count, singularKey, pluralKey, i18n) => {
  if (!i18n || !i18n.t) return '';
  return count === 1 ? i18n.t(singularKey) : i18n.t(pluralKey, { count });
};

export const isRTL = (locale) => {
  // Right-to-left languages: Arabic, Hebrew, Persian, Urdu, etc.
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale?.split('-')[0]);
};

export const getDirectionClass = (locale) => {
  return isRTL(locale) ? 'rtl' : 'ltr';
};

export const applyDirectionCSS = (locale) => {
  const direction = isRTL(locale) ? 'rtl' : 'ltr';
  const marginProp = isRTL(locale) ? 'marginRight' : 'marginLeft';
  return { direction, [marginProp]: '1rem' };
};
