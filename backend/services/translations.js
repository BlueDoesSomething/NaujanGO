import { execute } from '../db.js';

/**
 * Get language_id from language code (e.g., 'en' -> 1)
 */
const getLanguageId = async (languageCode = 'en') => {
  try {
    const [rows] = await execute('SELECT id FROM translation_languages WHERE code = ? LIMIT 1', [languageCode]);
    return rows && rows.length > 0 ? rows[0].id : 1; // default to English (id=1)
  } catch (err) {
    console.error('Error fetching language ID:', err);
    return 1; // fallback to English
  }
};

/**
 * Get translations for a set of entities and fields in a given locale.
 * Returns an object mapping original_id -> { field_name: translated_value }
 */
export const getTranslationsForEntities = async (entityType, entityIds = [], fields = [], locale = 'en') => {
  if (!entityIds || entityIds.length === 0 || !fields || fields.length === 0) return {};
  
  try {
    const languageId = await getLanguageId(locale);
    const placeholders = entityIds.map(() => '?').join(',');
    const fieldPlaceholders = fields.map(() => '?').join(',');
    const params = [entityType, languageId, ...entityIds, ...fields];
    const query = `SELECT original_id, field_name, translated_value FROM translations 
                   WHERE original_table = ? AND language_id = ? AND original_id IN (${placeholders}) 
                   AND field_name IN (${fieldPlaceholders}) AND is_approved = 1`;
    const [rows] = await execute(query, params);
    const map = {};
    for (const r of rows) {
      if (!map[r.original_id]) map[r.original_id] = {};
      map[r.original_id][r.field_name] = r.translated_value;
    }
    return map;
  } catch (err) {
    console.error('Error fetching translations:', err);
    return {};
  }
};

/**
 * Get single translation
 */
export const getTranslation = async (entityType, entityId, fieldName, locale = 'en') => {
  try {
    const languageId = await getLanguageId(locale);
    const query = 'SELECT translated_value FROM translations WHERE original_table = ? AND original_id = ? AND field_name = ? AND language_id = ? AND is_approved = 1 LIMIT 1';
    const [rows] = await execute(query, [entityType, entityId, fieldName, languageId]);
    if (rows && rows.length > 0) return rows[0].translated_value;
    return null;
  } catch (err) {
    console.error('Error fetching translation:', err);
    return null;
  }
};

/**
 * Upsert translation (insert or update)
 */
export const upsertTranslation = async (entityType, entityId, fieldName, locale, text, isApproved = 0) => {
  try {
    const languageId = await getLanguageId(locale);
    const query = `INSERT INTO translations (original_table, original_id, field_name, language_id, translated_value, is_approved)
                   VALUES (?, ?, ?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE translated_value = VALUES(translated_value), is_approved = VALUES(is_approved), updated_at = CURRENT_TIMESTAMP`;
    await execute(query, [entityType, entityId, fieldName, languageId, text, isApproved]);
    return true;
  } catch (err) {
    console.error('Error upserting translation:', err);
    return false;
  }
};
