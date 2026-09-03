import { execute } from '../db.js';
import { getTranslation, upsertTranslation } from './translations.js';

const ENABLE_MT_FALLBACK = process.env.ENABLE_MT_FALLBACK === 'true';
const MT_PROVIDER = process.env.MT_PROVIDER || 'google';

/**
 * Get language_id from language code
 */
const getLanguageId = async (languageCode = 'en') => {
  try {
    const [rows] = await execute('SELECT id FROM translation_languages WHERE code = ? LIMIT 1', [languageCode]);
    return rows && rows.length > 0 ? rows[0].id : 1;
  } catch (err) {
    console.error('Error fetching language ID:', err);
    return 1;
  }
};

// Simple MT via Google Translate API (requires GOOGLE_TRANSLATE_API_KEY)
const translateWithGoogle = async (text, targetLang) => {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) return null;
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`;
    const body = { q: text, target: targetLang };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    if (json.data && json.data.translations && json.data.translations[0]) {
      return json.data.translations[0].translatedText;
    }
  } catch (err) {
    console.error('Google Translate error:', err.message);
  }
  return null;
};

// Placeholder for DeepL, Libre, etc. (can be expanded)
const translateWithProvider = async (text, targetLang, provider) => {
  if (provider === 'google') return translateWithGoogle(text, targetLang);
  return null;
};

/**
 * Get translation with fallback to MT if not found in DB.
 * If MT returns a result, it's cached in the DB with is_approved=0 (pending review).
 */
export const getTranslationWithFallback = async (entityType, entityId, fieldName, locale) => {
  if (locale === 'en') return null; // English is base, don't need fallback

  try {
    // Try DB first
    const translation = await getTranslation(entityType, entityId, fieldName, locale);
    if (translation) return translation;

    // If not found and MT is disabled, return null
    if (!ENABLE_MT_FALLBACK) return null;

    // Get original text from the entity table
    const [rows] = await execute(
      `SELECT ${fieldName} FROM ${entityType} WHERE id = ? LIMIT 1`,
      [entityId]
    );
    const enText = rows && rows.length > 0 ? rows[0][fieldName] : null;
    if (!enText) return null;

    // Translate via MT
    const translated = await translateWithProvider(enText, locale, MT_PROVIDER);
    if (!translated) return null;

    // Cache the MT result in DB with is_approved=0 (pending review)
    await upsertTranslation(entityType, entityId, fieldName, locale, translated, 0);
    return translated;
  } catch (err) {
    console.error('Error in getTranslationWithFallback:', err);
    return null;
  }
};
