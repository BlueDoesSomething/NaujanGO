/**
 * Admin API Endpoints for Translation Management & Review
 * Provides endpoints for reviewing, approving, and monitoring translations
 */

import express from 'express';
import { getTranslationsForReview, approveTranslation, rejectTranslation, updateTranslationAfterReview, getReviewStats, initReviewLog } from '../services/translationReview.js';
import { execute } from '../db.js';

const router = express.Router();

/**
 * GET /api/admin/translations/review
 * Get translations pending review for a locale
 */
router.get('/translations/review', async (req, res) => {
  try {
    const { locale = 'es', limit = 50, offset = 0 } = req.query;
    const translations = await getTranslationsForReview(locale, parseInt(limit), parseInt(offset));
    const stats = await getReviewStats(locale);
    
    res.json({
      success: true,
      locale,
      stats,
      translations,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching translations for review:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/translations/coverage
 * Get translation coverage statistics for all locales
 */
router.get('/translations/coverage', async (req, res) => {
  try {
    const [coverage] = await execute(`
      SELECT 
        locale,
        COUNT(*) as total,
        SUM(CASE WHEN review_required = 0 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN review_required = 1 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN review_required = 2 THEN 1 ELSE 0 END) as rejected
      FROM translations
      GROUP BY locale
      ORDER BY locale ASC
    `);
    
    res.json({
      success: true,
      data: coverage.map(row => ({
        locale: row.locale,
        total: row.total,
        approved: row.approved,
        pending: row.pending,
        rejected: row.rejected,
        approvalRate: row.total > 0 ? Math.round((row.approved / row.total) * 100) : 0
      }))
    });
  } catch (error) {
    console.error('Error fetching coverage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/translations/:id/approve
 * Approve a translation (mark as reviewed)
 */
router.post('/translations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes = '' } = req.body;
    const success = await approveTranslation(parseInt(id), notes);
    
    res.json({
      success,
      message: success ? 'Translation approved' : 'Translation not found'
    });
  } catch (error) {
    console.error('Error approving translation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/translations/:id/reject
 * Reject a translation (mark for revision)
 */
router.post('/translations/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;
    const success = await rejectTranslation(parseInt(id), reason);
    
    res.json({
      success,
      message: success ? 'Translation rejected' : 'Translation not found'
    });
  } catch (error) {
    console.error('Error rejecting translation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/translations/:id
 * Update translation text after review
 */
router.put('/translations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, locale, notes = '' } = req.body;
    
    if (!text || !locale) {
      return res.status(400).json({ success: false, error: 'text and locale required' });
    }
    
    const success = await updateTranslationAfterReview(parseInt(id), text, locale, notes);
    
    res.json({
      success,
      message: success ? 'Translation updated' : 'Translation not found'
    });
  } catch (error) {
    console.error('Error updating translation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/translations/stats/by-entity
 * Get translation stats grouped by entity type
 */
router.get('/translations/stats/by-entity', async (req, res) => {
  try {
    const [stats] = await execute(`
      SELECT 
        entity_type,
        locale,
        COUNT(*) as total,
        SUM(CASE WHEN review_required = 0 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN review_required = 1 THEN 1 ELSE 0 END) as pending
      FROM translations
      GROUP BY entity_type, locale
      ORDER BY entity_type, locale
    `);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching entity stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/translations/init-review-log
 * Initialize review log table (one-time setup)
 */
router.post('/translations/init-review-log', async (req, res) => {
  try {
    await initReviewLog();
    res.json({ success: true, message: 'Review log table initialized' });
  } catch (error) {
    console.error('Error initializing review log:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
