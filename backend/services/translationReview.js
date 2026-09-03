/**
 * Translation Review & QA Workflow
 * Manages linguistic review status and feedback for translations
 */

import { execute } from '../db.js';

/**
 * Get translations pending review (MT suggestions or incomplete)
 */
export const getTranslationsForReview = async (locale = null, limit = 50, offset = 0) => {
  let query = 'SELECT * FROM translations WHERE review_required = 1';
  let params = [];
  
  if (locale) {
    query += ' AND locale = ?';
    params.push(locale);
  }
  
  query += ' ORDER BY entity_type, entity_id, field_name, updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  try {
    const [rows] = await execute(query, params);
    return rows || [];
  } catch (err) {
    console.error('Error fetching translations for review:', err);
    return [];
  }
};

/**
 * Approve a translation (mark as reviewed and ready)
 */
export const approveTranslation = async (translationId, notes = '') => {
  const query = 'UPDATE translations SET review_required = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  try {
    const [result] = await execute(query, [translationId]);
    if (result.affectedRows > 0) {
      // Log approval
      await logReviewAction(translationId, 'approved', notes);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error approving translation:', err);
    return false;
  }
};

/**
 * Reject a translation and request revision
 */
export const rejectTranslation = async (translationId, reason = '') => {
  const query = 'UPDATE translations SET review_required = 2, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  try {
    const [result] = await execute(query, [translationId]);
    if (result.affectedRows > 0) {
      await logReviewAction(translationId, 'rejected', reason);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error rejecting translation:', err);
    return false;
  }
};

/**
 * Update translation text after review feedback
 */
export const updateTranslationAfterReview = async (translationId, newText, locale, notes = '') => {
  const query = 'UPDATE translations SET text = ?, review_required = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  try {
    const [result] = await execute(query, [newText, translationId]);
    if (result.affectedRows > 0) {
      await logReviewAction(translationId, 'updated', notes);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error updating translation:', err);
    return false;
  }
};

/**
 * Get review statistics for a locale
 */
export const getReviewStats = async (locale) => {
  const query = `
    SELECT 
      SUM(CASE WHEN review_required = 0 THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN review_required = 1 THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN review_required = 2 THEN 1 ELSE 0 END) as rejected,
      COUNT(*) as total
    FROM translations
    WHERE locale = ?
  `;
  try {
    const [rows] = await execute(query, [locale]);
    return rows[0] || { approved: 0, pending: 0, rejected: 0, total: 0 };
  } catch (err) {
    console.error('Error fetching review stats:', err);
    return { approved: 0, pending: 0, rejected: 0, total: 0 };
  }
};

/**
 * Log review actions for audit trail
 */
const logReviewAction = async (translationId, action, notes = '') => {
  const query = `INSERT INTO translation_review_log (translation_id, action, notes, reviewed_at) VALUES (?, ?, ?, NOW())`;
  try {
    await execute(query, [translationId, action, notes]);
  } catch (err) {
    // Table might not exist; safe to ignore
    if (err.code !== 'ER_NO_SUCH_TABLE') {
      console.error('Error logging review action:', err);
    }
  }
};

/**
 * Create review log table if it doesn't exist
 */
export const initReviewLog = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS translation_review_log (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      translation_id BIGINT NOT NULL,
      action VARCHAR(50) NOT NULL,
      notes TEXT,
      reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE
    )
  `;
  try {
    await execute(query, []);
    console.log('✓ Translation review log table initialized');
  } catch (err) {
    console.error('Error initializing review log:', err);
  }
};
