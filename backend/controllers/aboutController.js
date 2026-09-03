/**
 * ═════════════════════════════════════════════════════════════════════════════════
 * About Controller - Dynamic Section Management
 * ═════════════════════════════════════════════════════════════════════════════════
 * Supports creating, editing, and deleting About page sections dynamically
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execute } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Setup multer for media uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const aboutMediaDir = path.join(__dirname, '..', 'uploads', 'about');

if (!fs.existsSync(aboutMediaDir)) {
  fs.mkdirSync(aboutMediaDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const section = req.body.section || 'general';
    const sectionDir = path.join(aboutMediaDir, section);
    if (!fs.existsSync(sectionDir)) {
      fs.mkdirSync(sectionDir, { recursive: true });
    }
    cb(null, sectionDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    return cb(null, true);
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════════

async function logAudit(action, entityType, entityId, changes, userId, ipAddress) {
  try {
    await execute(
      `INSERT INTO about_audit_log 
       (action, entity_type, entity_id, changes, user_id, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [action, entityType, entityId, JSON.stringify(changes), userId, ipAddress]
    );
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

// Default values for about settings
const ABOUT_SETTINGS_DEFAULT = {
  overview_text: 'Naujan is a 1st class municipality in Oriental Mindoro with 70 barangays. It is known for its agricultural economy, cultural heritage, and tourism development. It is the second most populous municipality in the province after Calapan City.',
  vision_text: 'By 2030, Naujan envisions to be the leading agricultural municipality in MIMAROPA, with a livable and ecologically balanced environment demonstrating a vibrant economy inspired by God-loving, healthy, educated, and empowered citizenry under a dynamic and committed leadership.',
  mission_text: {
    points: [
      'Recognition and promotion of indigenous cultural communities while ensuring respect for cultural integrity',
      'Conservation and protection of natural resources for safe, adaptive, and resilient barangays',
      'Accountability and competency of people-centered governance through partnerships and development programs',
      'Promotion of eco-tourism and sustainable agricultural production with adequate social services and improved infrastructure'
    ]
  },
  population: 109122,
  land_area_sq_km: 503.10,
  density_per_sq_km: 216.50,
  num_barangays: 70,
  municipal_rank: '2nd most populous in Oriental Mindoro',
  current_mayor_name: 'Henry Joel C. Teves',
  current_mayor_term: '2022-Present',
  current_vice_mayor_name: 'Candido J. Melgar Jr.',
  current_vice_mayor_term: '2025-Present',
  visitor_arrivals_2022: 15605,
  visitor_arrivals_2023: 42561,
  visitor_arrivals_2024: 62788,
  visitor_arrivals_2025: 36074,
  tourism_total_employment: 580,
  tourism_attractions_count: 475,
  tourism_accommodation_count: 105,
  tourism_female_employed: 338,
  tourism_male_employed: 242
};

/**
 * PUBLIC — GET /api/about-settings
 * Fetch all about page dynamic content with defaults if not found
 */
router.get('/about-settings', async (req, res) => {
  try {
    const [rows] = await execute(
      `SELECT overview_text, vision_text, mission_text, population, land_area_sq_km, 
              density_per_sq_km, num_barangays, municipal_rank, current_mayor_name, 
              current_mayor_term, current_vice_mayor_name, current_vice_mayor_term,
              visitor_arrivals_2022, visitor_arrivals_2023, visitor_arrivals_2024, 
              visitor_arrivals_2025, tourism_total_employment, tourism_attractions_count,
              tourism_accommodation_count, tourism_female_employed, tourism_male_employed
       FROM about_settings LIMIT 1`
    );

    if (rows && rows.length > 0) {
      const settings = rows[0];
      // Parse mission_text if it's a JSON string
      const missionText = typeof settings.mission_text === 'string' 
        ? JSON.parse(settings.mission_text) 
        : settings.mission_text;

      return res.json({
        overview_text: settings.overview_text,
        vision_text: settings.vision_text,
        mission_text: missionText,
        population: settings.population,
        land_area_sq_km: settings.land_area_sq_km,
        density_per_sq_km: settings.density_per_sq_km,
        num_barangays: settings.num_barangays,
        municipal_rank: settings.municipal_rank,
        current_mayor_name: settings.current_mayor_name,
        current_mayor_term: settings.current_mayor_term,
        current_vice_mayor_name: settings.current_vice_mayor_name,
        current_vice_mayor_term: settings.current_vice_mayor_term,
        visitor_arrivals_2022: settings.visitor_arrivals_2022,
        visitor_arrivals_2023: settings.visitor_arrivals_2023,
        visitor_arrivals_2024: settings.visitor_arrivals_2024,
        visitor_arrivals_2025: settings.visitor_arrivals_2025,
        tourism_total_employment: settings.tourism_total_employment,
        tourism_attractions_count: settings.tourism_attractions_count,
        tourism_accommodation_count: settings.tourism_accommodation_count,
        tourism_female_employed: settings.tourism_female_employed,
        tourism_male_employed: settings.tourism_male_employed
      });
    }

    // Return defaults if no settings found
    return res.json(ABOUT_SETTINGS_DEFAULT);
  } catch (err) {
    console.error('Get about settings error:', err);
    res.status(500).json({ error: 'Failed to load about settings', defaults: ABOUT_SETTINGS_DEFAULT });
  }
});

// PUBLIC - GET /api/about-leadership-photos
// Returns photo URLs keyed by leader role, name, and term.
router.get('/about-leadership-photos', async (req, res) => {
  try {
    const [rows] = await execute(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['about-leadership-photos']
    );
    const photos = rows?.[0]?.setting_value ? JSON.parse(rows[0].setting_value) : {};
    res.json(photos);
  } catch (error) {
    console.error('Get leadership photos error:', error);
    res.status(500).json({ error: 'Failed to load leadership photos' });
  }
});

// PUBLIC - GET /api/about-leadership-roster
router.get('/about-leadership-roster', async (req, res) => {
  try {
    const [rows] = await execute(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['about-leadership-roster']
    );
    const roster = rows?.[0]?.setting_value ? JSON.parse(rows[0].setting_value) : [];
    res.json(Array.isArray(roster) ? roster : []);
  } catch (error) {
    console.error('Get leadership roster error:', error);
    res.status(500).json({ error: 'Failed to load leadership roster' });
  }
});

// PUBLIC - GET /api/about-pageant-queens (legacy path)
router.get('/about-pageant-queens', async (req, res) => {
  try {
    const [rows] = await execute(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['about-pageant-queens']
    );
    const queens = rows?.[0]?.setting_value ? JSON.parse(rows[0].setting_value) : [];
    res.json(Array.isArray(queens) ? queens : []);
  } catch (error) {
    console.error('Get pageant queens error:', error);
    res.status(500).json({ error: 'Failed to load pageant queens' });
  }
});

// ADMIN - PUT /api/admin/about-pageant-queens
router.put('/admin/about-pageant-queens', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const queens = Array.isArray(req.body) ? req.body : req.body.queens;
    if (!Array.isArray(queens)) return res.status(400).json({ error: 'Queens must be an array' });
    const cleaned = queens.map((q, i) => ({
      id: String(q.id || `queen-${Date.now()}-${i}`),
      year: Number(q.year) || new Date().getFullYear(),
      name: String(q.name || '').trim().slice(0, 150),
      photo: typeof q.photo === 'string' ? q.photo : null,
      order: i
    })).filter(q => q.name);
    await execute(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      ['about-pageant-queens', JSON.stringify(cleaned)]
    );
    res.json({ success: true, queens: cleaned });
  } catch (error) {
    console.error('Save pageant queens error:', error);
    res.status(500).json({ error: 'Failed to save pageant queens' });
  }
});

// ADMIN - POST /api/admin/about/pageant-photo  (upload queen photo)
router.post('/admin/about/pageant-photo', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.body.queenId) return res.status(400).json({ error: 'File and queenId required' });
    const pageantDir = path.join(aboutMediaDir, 'pageant');
    if (!fs.existsSync(pageantDir)) fs.mkdirSync(pageantDir, { recursive: true });
    if (!req.file.path.includes('pageant')) {
      const newPath = path.join(pageantDir, req.file.filename);
      fs.renameSync(req.file.path, newPath);
    }
    const photoUrl = `/uploads/about/pageant/${req.file.filename}`;
    const [rows] = await execute(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['about-pageant-queens']
    );
    const queens = rows?.[0]?.setting_value ? JSON.parse(rows[0].setting_value) : [];
    const updated = queens.map(q => q.id === req.body.queenId ? { ...q, photo: photoUrl } : q);
    await execute(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      ['about-pageant-queens', JSON.stringify(updated)]
    );
    res.json({ success: true, photoUrl });
  } catch (error) {
    console.error('Upload pageant photo error:', error);
    res.status(500).json({ error: 'Failed to upload pageant photo' });
  }
});

// PUBLIC - GET /api/about-accomplishments
router.get('/about-accomplishments', async (req, res) => {
  try {
    const [rows] = await execute(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['about-accomplishments']
    );
    const entries = rows?.[0]?.setting_value ? JSON.parse(rows[0].setting_value) : [];
    res.json(Array.isArray(entries) ? entries : []);
  } catch (error) {
    console.error('Get accomplishments error:', error);
    res.status(500).json({ error: 'Failed to load accomplishments' });
  }
});

// ADMIN - PUT /api/admin/about-accomplishments
router.put('/admin/about-accomplishments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const entries = Array.isArray(req.body) ? req.body : req.body.entries;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'Accomplishments must be an array' });
    const cleanedEntries = entries.map((entry, index) => ({
      id: String(entry.id || `accomplishment-${Date.now()}-${index}`),
      date: String(entry.date || '').trim().slice(0, 80),
      category: String(entry.category || 'COMMUNITY').trim().slice(0, 80),
      title: String(entry.title || '').trim().slice(0, 180),
      description: String(entry.description || '').trim().slice(0, 500),
      imageUrl: typeof entry.imageUrl === 'string' ? entry.imageUrl : '',
      order: index
    })).filter((entry) => entry.date && entry.title && entry.description);
    await execute(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      ['about-accomplishments', JSON.stringify(cleanedEntries)]
    );
    res.json({ success: true, entries: cleanedEntries });
  } catch (error) {
    console.error('Save accomplishments error:', error);
    res.status(500).json({ error: 'Failed to save accomplishments' });
  }
});

// ADMIN - POST /api/admin/about/accomplishment-image
router.post('/admin/about/accomplishment-image', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.body.entryId) return res.status(400).json({ error: 'Image and entry ID are required' });
    const imageUrl = `/uploads/about/accomplishments/${req.file.filename}`;
    const [rows] = await execute(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['about-accomplishments']
    );
    const entries = rows?.[0]?.setting_value ? JSON.parse(rows[0].setting_value) : [];
    const updatedEntries = entries.map((entry) => entry.id === req.body.entryId ? { ...entry, imageUrl } : entry);
    await execute(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      ['about-accomplishments', JSON.stringify(updatedEntries)]
    );
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Upload accomplishment image error:', error);
    res.status(500).json({ error: 'Failed to upload accomplishment image' });
  }
});

// ADMIN - PUT /api/admin/about-leadership-roster
router.put('/admin/about-leadership-roster', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const roster = Array.isArray(req.body) ? req.body : req.body.roster;
    if (!Array.isArray(roster)) {
      return res.status(400).json({ error: 'Roster must be an array' });
    }

    const cleanedRoster = roster.map((person, index) => ({
      id: String(person.id || `leader-${Date.now()}-${index}`),
      role: person.role === 'vice-mayor' ? 'vice-mayor' : 'mayor',
      name: String(person.name || '').trim().slice(0, 150),
      term: String(person.term || '').trim().slice(0, 80),
      current: Boolean(person.current),
      order: index
    })).filter((person) => person.name && person.term);

    await execute(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      ['about-leadership-roster', JSON.stringify(cleanedRoster)]
    );
    res.json({ success: true, roster: cleanedRoster });
  } catch (error) {
    console.error('Save leadership roster error:', error);
    res.status(500).json({ error: 'Failed to save leadership roster' });
  }
});

/**
 * ADMIN PROTECTED — PUT /api/admin/about-settings
 * Update about page dynamic content
 */
router.put('/admin/about-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      overview_text, vision_text, mission_text, population, land_area_sq_km, density_per_sq_km, num_barangays,
      municipal_rank, current_mayor_name, current_mayor_term, current_vice_mayor_name, current_vice_mayor_term,
      visitor_arrivals_2022, visitor_arrivals_2023, visitor_arrivals_2024, visitor_arrivals_2025,
      tourism_total_employment, tourism_attractions_count, tourism_accommodation_count,
      tourism_female_employed, tourism_male_employed
    } = req.body;

    // Validate required inputs
    if (!overview_text || !vision_text || !mission_text || !population) {
      return res.status(400).json({ error: 'Missing required fields: overview_text, vision_text, mission_text, population' });
    }

    // Serialize mission_text to JSON if it's an object
    const missionTextJson = typeof mission_text === 'object' 
      ? JSON.stringify(mission_text) 
      : mission_text;

    // Update the settings (update existing record with id=1)
    await execute(
      `UPDATE about_settings 
       SET overview_text = ?, vision_text = ?, mission_text = ?, population = ?, 
           land_area_sq_km = ?, density_per_sq_km = ?, num_barangays = ?,
           municipal_rank = ?, current_mayor_name = ?, current_mayor_term = ?,
           current_vice_mayor_name = ?, current_vice_mayor_term = ?,
           visitor_arrivals_2022 = ?, visitor_arrivals_2023 = ?, visitor_arrivals_2024 = ?,
           visitor_arrivals_2025 = ?, tourism_total_employment = ?, tourism_attractions_count = ?,
           tourism_accommodation_count = ?, tourism_female_employed = ?, tourism_male_employed = ?,
           updated_at = NOW()
       WHERE id = 1`,
      [
        overview_text, vision_text, missionTextJson, population, land_area_sq_km, density_per_sq_km, 
        num_barangays, municipal_rank, current_mayor_name, current_mayor_term, current_vice_mayor_name,
        current_vice_mayor_term, visitor_arrivals_2022, visitor_arrivals_2023, visitor_arrivals_2024,
        visitor_arrivals_2025, tourism_total_employment, tourism_attractions_count, 
        tourism_accommodation_count, tourism_female_employed, tourism_male_employed
      ]
    );

    res.json({
      success: true,
      message: 'About settings updated successfully',
      data: {
        overview_text, vision_text,
        mission_text: typeof mission_text === 'string' ? JSON.parse(mission_text) : mission_text,
        population, land_area_sq_km, density_per_sq_km, num_barangays,
        municipal_rank, current_mayor_name, current_mayor_term,
        current_vice_mayor_name, current_vice_mayor_term,
        visitor_arrivals_2022, visitor_arrivals_2023, visitor_arrivals_2024, visitor_arrivals_2025,
        tourism_total_employment, tourism_attractions_count, tourism_accommodation_count,
        tourism_female_employed, tourism_male_employed
      }
    });
  } catch (err) {
    console.error('Update about settings error:', err);
    res.status(500).json({ error: 'Failed to update about settings', details: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// ENHANCED ENDPOINTS — SECTIONS MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/about/sections
 * Retrieve all About page sections with display order
 */
router.get('/sections', async (req, res) => {
  try {
    // First try the new about_section_content system
    const [sections] = await execute(
      `SELECT 
        s.id, 
        s.section_key, 
        s.section_name, 
        s.section_type, 
        s.description,
        s.display_order, 
        s.is_active, 
        s.is_editable, 
        s.icon_name, 
        s.created_at, 
        s.updated_at,
        sc.content
       FROM about_sections s
       LEFT JOIN about_section_content sc ON s.id = sc.section_id 
         AND sc.is_published = TRUE
       WHERE s.is_active = TRUE
       ORDER BY s.display_order ASC`
    );
    
    // If no results, fall back to custom sections table for backward compatibility
    if (!sections || sections.length === 0) {
      const [customSections] = await execute(
        `SELECT id, section_key, section_name, section_type, content, display_order, is_active
         FROM about_custom_sections
         WHERE is_active = TRUE
         ORDER BY display_order ASC`
      );
      return res.json(customSections || []);
    }
    
    res.json(sections || []);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

/**
 * PUT /api/admin/about/sections/:sectionId/reorder
 * Update display order of sections
 */
router.put('/admin/sections/:sectionId/reorder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { displayOrder } = req.body;

    await execute(
      `UPDATE about_sections
       SET display_order = ?, updated_at = NOW()
       WHERE id = ?`,
      [displayOrder, sectionId]
    );

    await logAudit('update', 'section', sectionId, { displayOrder }, req.user?.id, req.ip);

    res.json({ success: true, message: 'Section order updated' });
  } catch (error) {
    console.error('Error reordering sections:', error);
    res.status(500).json({ error: 'Failed to reorder sections' });
  }
});

/**
 * PUT /api/admin/about/sections/:sectionId/toggle
 * Toggle section visibility
 */
router.put('/admin/sections/:sectionId/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { isActive } = req.body;

    await execute(
      `UPDATE about_sections
       SET is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [isActive, sectionId]
    );

    await logAudit('update', 'section', sectionId, { isActive }, req.user?.id, req.ip);

    res.json({ success: true, message: `Section ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Error toggling section:', error);
    res.status(500).json({ error: 'Failed to toggle section' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// ENHANCED ENDPOINTS — LANGUAGES & CONTENT
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/about/languages
 * Get all available languages
 */
router.get('/languages', async (req, res) => {
  try {
    const [languages] = await execute(
      `SELECT id, language_code, language_name, is_default, is_active
       FROM about_languages
       WHERE is_active = TRUE
       ORDER BY is_default DESC, language_name ASC`
    );
    res.json(languages || []);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

/**
 * PUT /api/admin/about/sections/:sectionKey/content
 * Save or update section content
 */
router.put('/admin/sections/:sectionKey/content', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const { languageCode, content, contentFormat = 'json' } = req.body;

    const [section] = await execute(
      'SELECT id FROM about_sections WHERE section_key = ?',
      [sectionKey]
    );
    const [language] = await execute(
      'SELECT id FROM about_languages WHERE language_code = ?',
      [languageCode]
    );

    if (!section || !section[0] || !language || !language[0]) {
      return res.status(400).json({ error: 'Invalid section or language' });
    }

    const contentStr = contentFormat === 'json' ? JSON.stringify(content) : content;
    const [existing] = await execute(
      'SELECT id, version_number FROM about_section_content WHERE section_id = ? AND language_id = ?',
      [section[0].id, language[0].id]
    );

    let nextVersion;
    if (existing && existing[0]) {
      nextVersion = (existing[0].version_number || 0) + 1;
      await execute(
        `UPDATE about_section_content 
         SET content = ?, version_number = ?, updated_at = NOW()
         WHERE id = ?`,
        [contentStr, nextVersion, existing[0].id]
      );
    } else {
      const result = await execute(
        `INSERT INTO about_section_content 
         (section_id, language_id, content, content_format, version_number)
         VALUES (?, ?, ?, ?, 1)`,
        [section[0].id, language[0].id, contentStr, contentFormat]
      );
      nextVersion = 1;
    }

    await logAudit('update', 'content', existing?.[0]?.id || null, 
      { sectionKey, languageCode, version: nextVersion }, req.user?.id, req.ip);

    res.json({ success: true, message: 'Content saved', version: nextVersion });
  } catch (error) {
    console.error('Error saving section content:', error);
    res.status(500).json({ error: 'Failed to save section content' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// ENHANCED ENDPOINTS — PUBLISHING WORKFLOW
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/about/workflow
 * Get publishing workflow status
 */
router.get('/admin/workflow', authenticateToken, async (req, res) => {
  try {
    const [workflows] = await execute(
      `SELECT id, content_key, status, scheduled_publish_at, 
              published_at, review_requested_at, created_at, updated_at
       FROM about_publish_workflow
       ORDER BY updated_at DESC`
    );
    res.json(workflows || []);
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({ error: 'Failed to fetch workflow status' });
  }
});

/**
 * PUT /api/admin/about/workflow/:contentKey/publish
 * Publish content or schedule for publishing
 */
router.put('/admin/workflow/:contentKey/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { contentKey } = req.params;
    const { publishNow = true, scheduledAt = null } = req.body;

    const status = publishNow ? 'published' : (scheduledAt ? 'scheduled' : 'draft');
    const publishTime = publishNow ? new Date() : scheduledAt;

    await execute(
      `UPDATE about_publish_workflow
       SET status = ?, published_at = ?, published_by = ?, updated_at = NOW()
       WHERE content_key = ?`,
      [status, publishTime, req.user?.id, contentKey]
    );

    await logAudit('publish', 'content', null, 
      { contentKey, status, scheduledAt }, req.user?.id, req.ip);

    res.json({ success: true, message: `Content ${publishNow ? 'published' : 'scheduled'} successfully` });
  } catch (error) {
    console.error('Error publishing content:', error);
    res.status(500).json({ error: 'Failed to publish content' });
  }
});

/**
 * PUT /api/admin/about/workflow/:contentKey/request-review
 * Request review from managers
 */
router.put('/admin/workflow/:contentKey/request-review', authenticateToken, async (req, res) => {
  try {
    const { contentKey } = req.params;
    const { notes = '' } = req.body;

    await execute(
      `UPDATE about_publish_workflow
       SET status = 'review_pending', review_requested_at = NOW(),
           review_requested_by = ?, review_notes = ?, updated_at = NOW()
       WHERE content_key = ?`,
      [req.user?.id, notes, contentKey]
    );

    await logAudit('review_request', 'content', null, 
      { contentKey, notes }, req.user?.id, req.ip);

    res.json({ success: true, message: 'Review requested successfully' });
  } catch (error) {
    console.error('Error requesting review:', error);
    res.status(500).json({ error: 'Failed to request review' });
  }
});

/**
 * PUT /api/admin/about/workflow/:contentKey/approve
 * Approve content for publication
 */
router.put('/admin/workflow/:contentKey/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { contentKey } = req.params;

    await execute(
      `UPDATE about_publish_workflow
       SET status = 'approved', reviewed_at = NOW(),
           reviewed_by = ?, updated_at = NOW()
       WHERE content_key = ?`,
      [req.user?.id, contentKey]
    );

    await logAudit('approve', 'content', null, 
      { contentKey }, req.user?.id, req.ip);

    res.json({ success: true, message: 'Content approved' });
  } catch (error) {
    console.error('Error approving content:', error);
    res.status(500).json({ error: 'Failed to approve content' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// ENHANCED ENDPOINTS — VERSION HISTORY
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/about/versions
 * Get version history
 */
router.get('/admin/versions', authenticateToken, async (req, res) => {
  try {
    const [versions] = await execute(
      `SELECT id, version_number, version_tag, change_summary,
              created_by, created_at, is_current
       FROM about_versions
       ORDER BY version_number DESC
       LIMIT 50`
    );
    res.json(versions || []);
  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({ error: 'Failed to fetch version history' });
  }
});

/**
 * GET /api/admin/about/versions/:versionNumber
 * Get specific version snapshot
 */
router.get('/admin/versions/:versionNumber', authenticateToken, async (req, res) => {
  try {
    const { versionNumber } = req.params;
    const [version] = await execute(
      `SELECT id, version_number, version_tag, content_snapshot,
              change_summary, created_by, created_at, is_current
       FROM about_versions
       WHERE version_number = ?`,
      [versionNumber]
    );

    if (!version || !version[0]) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const v = version[0];
    if (v.content_snapshot && typeof v.content_snapshot === 'string') {
      try {
        v.content_snapshot = JSON.parse(v.content_snapshot);
      } catch (e) {
        // Keep as string if parse fails
      }
    }

    res.json(v);
  } catch (error) {
    console.error('Error fetching version snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch version snapshot' });
  }
});

/**
 * POST /api/admin/about/versions/:versionNumber/rollback
 * Rollback to a previous version
 */
router.post('/admin/versions/:versionNumber/rollback', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { versionNumber } = req.params;

    const [sourceVersion] = await execute(
      'SELECT content_snapshot FROM about_versions WHERE version_number = ?',
      [versionNumber]
    );

    if (!sourceVersion || !sourceVersion[0]) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const snapshot = sourceVersion[0].content_snapshot;
    const [maxVersion] = await execute('SELECT COALESCE(MAX(version_number), 0) as max FROM about_versions');
    const newVersionNumber = (maxVersion[0]?.max || 0) + 1;

    await execute(
      `INSERT INTO about_versions 
       (version_number, version_tag, content_snapshot, change_summary, 
        created_by, is_current, restored_from_version)
       VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
      [newVersionNumber, `Restored from v${versionNumber}`, snapshot, 'Rollback operation', req.user?.id, versionNumber]
    );

    await execute('UPDATE about_versions SET is_current = FALSE WHERE is_current = TRUE AND version_number != ?', [newVersionNumber]);

    await logAudit('rollback', 'version', null, 
      { fromVersion: versionNumber }, req.user?.id, req.ip);

    res.json({ success: true, message: `Rolled back to version ${versionNumber}` });
  } catch (error) {
    console.error('Error rolling back version:', error);
    res.status(500).json({ error: 'Failed to rollback version' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// ENHANCED ENDPOINTS — MEDIA MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/about/:sectionKey/media
 * Get media for a section
 */
router.get('/:sectionKey/media', async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const [media] = await execute(
      `SELECT m.id, m.file_url, m.file_name, m.caption, m.alt_text,
              m.display_order, m.media_type, m.uploaded_at
       FROM about_media m
       JOIN about_sections s ON m.section_id = s.id
       WHERE s.section_key = ? AND m.is_active = TRUE
       ORDER BY m.display_order ASC`,
      [sectionKey]
    );
    res.json(media || []);
  } catch (error) {
    console.error('Error fetching section media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/**
 * POST /api/admin/about/media/:sectionKey
 * Upload media for a section
 */
router.post('/admin/media/:sectionKey', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const { fileUrl, fileName, caption, altText, mediaType = 'image' } = req.body;

    const [section] = await execute(
      'SELECT id FROM about_sections WHERE section_key = ?',
      [sectionKey]
    );

    if (!section || !section[0]) {
      return res.status(400).json({ error: 'Section not found' });
    }

    const [lastMedia] = await execute(
      'SELECT MAX(display_order) as maxOrder FROM about_media WHERE section_id = ?',
      [section[0].id]
    );
    const displayOrder = (lastMedia[0]?.maxOrder || 0) + 10;

    const result = await execute(
      `INSERT INTO about_media 
       (section_id, media_type, file_url, file_name, caption, alt_text, display_order, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [section[0].id, mediaType, fileUrl, fileName, caption, altText, displayOrder, req.user?.id]
    );

    await logAudit('create', 'media', result[0].insertId, 
      { sectionKey, fileName }, req.user?.id, req.ip);

    res.json({ success: true, message: 'Media uploaded successfully', mediaId: result[0].insertId });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

/**
 * DELETE /api/admin/about/media/:mediaId
 * Delete media
 */
router.delete('/admin/media/:mediaId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { mediaId } = req.params;

    await execute('UPDATE about_media SET is_active = FALSE WHERE id = ?', [mediaId]);

    await logAudit('delete', 'media', mediaId, {}, req.user?.id, req.ip);

    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

/**
 * POST /api/admin/about/leader-photo
 * Upload leadership photos (Mayor or Vice Mayor)
 */
router.post('/admin/leader-photo', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type, leaderKey } = req.body; // legacy type or a role:name:term key
    
    if ((!type || !['mayorPhoto', 'viceMayorPhoto'].includes(type)) && !leaderKey) {
      return res.status(400).json({ error: 'Invalid photo type' });
    }

    // Generate file URL path
    const photoUrl = `/uploads/about/leadership/${req.file.filename}`;
    
    // Ensure leadership directory exists
    const leadershipDir = path.join(aboutMediaDir, 'leadership');
    if (!fs.existsSync(leadershipDir)) {
      fs.mkdirSync(leadershipDir, { recursive: true });
    }

    // Move file to leadership directory if not already there
    if (!req.file.path.includes('leadership')) {
      const newPath = path.join(leadershipDir, req.file.filename);
      fs.renameSync(req.file.path, newPath);
    }

    if (leaderKey) {
      const [rows] = await execute(
        'SELECT setting_value FROM site_settings WHERE setting_key = ?',
        ['about-leadership-photos']
      );
      const photos = rows?.[0]?.setting_value ? JSON.parse(rows[0].setting_value) : {};
      photos[leaderKey] = photoUrl;
      await execute(
        `INSERT INTO site_settings (setting_key, setting_value)
         VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        ['about-leadership-photos', JSON.stringify(photos)]
      );
      await logAudit('update', 'leader-photo', leaderKey,
        { fileName: req.file.filename, leaderKey }, req.user?.id, req.ip);
      return res.json({ success: true, message: 'Leadership photo uploaded successfully', photoUrl, leaderKey });
    }

    // Determine which field to update based on the legacy type.
    const photoField = type === 'mayorPhoto' ? 'current_mayor_photo_url' : 'current_vice_mayor_photo_url';

    // Update the about_settings table with the photo URL
    await execute(
      `UPDATE about_settings SET ${photoField} = ? LIMIT 1`,
      [photoUrl]
    );

    await logAudit('update', 'leader-photo', type, 
      { fileName: req.file.filename, type }, req.user?.id, req.ip);

    res.json({ 
      success: true, 
      message: 'Leadership photo uploaded successfully', 
      photoUrl,
      photoField
    });
  } catch (error) {
    console.error('Error uploading leadership photo:', error);
    res.status(500).json({ error: 'Failed to upload leadership photo' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// ENHANCED ENDPOINTS — AUDIT LOG
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/about/audit-log
 * Get audit log entries
 */
router.get('/admin/audit-log', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const [logs] = await execute(
      `SELECT id, action, entity_type, entity_id, changes, user_id, created_at
       FROM about_audit_log
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json(logs || []);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// COMPLETE ABOUT CONTENT (PUBLIC)
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/about
 * Get complete About content with optional language filter
 */
router.get('/', async (req, res) => {
  try {
    const languageCode = req.query.language || 'en';

    const [content] = await execute(
      `SELECT 
        s.id, s.section_key, s.section_name, s.section_type,
        c.content, c.content_format, c.version_number
       FROM about_sections s
       LEFT JOIN about_section_content c ON s.id = c.section_id
       LEFT JOIN about_languages l ON c.language_id = l.id
       WHERE s.is_active = TRUE AND 
             (c.is_published = TRUE OR c.is_published IS NULL) AND
             (l.language_code = ? OR l.language_code IS NULL)
       ORDER BY s.display_order ASC`,
      [languageCode]
    );

    const about = (content || []).map(item => ({
      ...item,
      content: item.content_format === 'json' && item.content ? 
        JSON.parse(item.content) : item.content
    }));

    res.json(about);
  } catch (error) {
    console.error('Error fetching complete about:', error);
    res.status(500).json({ error: 'Failed to fetch about content' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// DYNAMIC SECTIONS MANAGEMENT - ADMIN
// ═════════════════════════════════════════════════════════════════════════════════

/* 
 * NOTE: Duplicate /sections endpoint removed - see main /sections endpoint above
 * which now handles both about_sections and about_custom_sections tables
 */

/**
 * GET /api/admin/sections
 * Get all About sections (admin - includes inactive)
 */
router.get('/admin/sections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [sections] = await execute(
      `SELECT id, section_key, section_name, section_type, content, display_order, is_active, created_at, updated_at
       FROM about_custom_sections
       ORDER BY display_order ASC`
    );

    res.json(sections || []);
  } catch (error) {
    console.error('Error fetching admin sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

/**
 * POST /api/admin/sections
 * Create a new About section
 */
router.post('/admin/sections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { section_key, section_name, section_type, content, display_order } = req.body;

    if (!section_key || !section_name || !section_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if section_key already exists
    const [existing] = await execute(
      'SELECT id FROM about_custom_sections WHERE section_key = ?',
      [section_key]
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Section key already exists' });
    }

    // Get max display order if not provided
    let finalOrder = display_order;
    if (!finalOrder) {
      const [maxOrder] = await execute(
        'SELECT MAX(display_order) as max_order FROM about_custom_sections'
      );
      finalOrder = (maxOrder[0]?.max_order || 0) + 1;
    }

    const contentValue = section_type === 'json' ? JSON.stringify(content || {}) : (content || '');

    const [result] = await execute(
      `INSERT INTO about_custom_sections 
       (section_key, section_name, section_type, content, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [section_key, section_name, section_type, contentValue, finalOrder]
    );

    await logAudit('create', 'custom_section', result[0].insertId, 
      { section_key, section_name, section_type }, req.user?.id, req.ip);

    res.json({ 
      success: true, 
      message: 'Section created successfully',
      sectionId: result[0].insertId 
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

/**
 * PUT /api/admin/sections/:sectId
 * Update an About section
 */
router.put('/admin/sections/:sectId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sectId } = req.params;
    const { section_name, section_type, content, display_order, is_active } = req.body;

    const contentValue = section_type === 'json' ? JSON.stringify(content || {}) : (content || '');

    const updateFields = [];
    const updateValues = [];

    if (section_name !== undefined) {
      updateFields.push('section_name = ?');
      updateValues.push(section_name);
    }
    if (section_type !== undefined) {
      updateFields.push('section_type = ?');
      updateValues.push(section_type);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(contentValue);
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(sectId);

    await execute(
      `UPDATE about_custom_sections 
       SET ${updateFields.join(', ')}
       WHERE id = ?`,
      updateValues
    );

    await logAudit('update', 'custom_section', sectId, req.body, req.user?.id, req.ip);

    res.json({ success: true, message: 'Section updated successfully' });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

/**
 * DELETE /api/admin/sections/:sectId
 * Delete (soft delete) an About section
 */
router.delete('/admin/sections/:sectId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sectId } = req.params;

    await execute(
      'UPDATE about_custom_sections SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [sectId]
    );

    await logAudit('delete', 'custom_section', sectId, {}, req.user?.id, req.ip);

    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

/**
 * PUT /api/admin/sections/reorder
 * Reorder sections
 */
router.put('/admin/reorder-sections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Invalid sections format' });
    }

    for (let i = 0; i < sections.length; i++) {
      await execute(
        'UPDATE about_custom_sections SET display_order = ? WHERE id = ?',
        [i + 1, sections[i].id]
      );
    }

    await logAudit('reorder', 'custom_sections', null, { count: sections.length }, req.user?.id, req.ip);

    res.json({ success: true, message: 'Sections reordered successfully' });
  } catch (error) {
    console.error('Error reordering sections:', error);
    res.status(500).json({ error: 'Failed to reorder sections' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// EDITABLE SECTIONS - MAYORS & VICE MAYORS
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * PUBLIC — GET /about-editable/mayors
 * Fetch customized mayors list (or empty array if using defaults)
 */
router.get('/about-editable/mayors', async (req, res) => {
  try {
    const [rows] = await execute(
      `SELECT content FROM about_editable_sections WHERE section_key = 'mayors'`
    );
    
    if (rows && rows.length > 0) {
      const content = typeof rows[0].content === 'string' 
        ? JSON.parse(rows[0].content) 
        : rows[0].content;
      return res.json(content);
    }
    
    // Return empty array if not customized - frontend will use defaults
    res.json([]);
  } catch (error) {
    console.error('Error fetching mayors:', error);
    res.status(500).json({ error: 'Failed to fetch mayors' });
  }
});

/**
 * PUBLIC — GET /about-editable/vice-mayors
 * Fetch customized vice mayors list (or empty array if using defaults)
 */
router.get('/about-editable/vice-mayors', async (req, res) => {
  try {
    const [rows] = await execute(
      `SELECT content FROM about_editable_sections WHERE section_key = 'viceMayors'`
    );
    
    if (rows && rows.length > 0) {
      const content = typeof rows[0].content === 'string' 
        ? JSON.parse(rows[0].content) 
        : rows[0].content;
      return res.json(content);
    }
    
    // Return empty array if not customized - frontend will use defaults
    res.json([]);
  } catch (error) {
    console.error('Error fetching vice mayors:', error);
    res.status(500).json({ error: 'Failed to fetch vice mayors' });
  }
});

/**
 * ADMIN — POST /about-editable/mayors
 * Update mayors list with pictures and customization
 */
router.post('/about-editable/mayors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { mayors } = req.body;
    
    if (!mayors || !Array.isArray(mayors)) {
      return res.status(400).json({ error: 'Invalid mayors data' });
    }

    await execute(
      `INSERT INTO about_editable_sections (section_key, section_name, content, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content = ?, updated_by = ?, updated_at = NOW()`,
      [
        'mayors',
        'Mayors of Naujan',
        JSON.stringify(mayors),
        req.user?.id,
        JSON.stringify(mayors),
        req.user?.id
      ]
    );

    await logAudit('update', 'mayors_section', null, { count: mayors.length }, req.user?.id, req.ip);

    res.json({ success: true, message: 'Mayors updated successfully', data: mayors });
  } catch (error) {
    console.error('Error updating mayors:', error);
    res.status(500).json({ error: 'Failed to update mayors' });
  }
});

/**
 * ADMIN — POST /about-editable/vice-mayors
 * Update vice mayors list with pictures and customization
 */
router.post('/about-editable/vice-mayors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { viceMayors } = req.body;
    
    if (!viceMayors || !Array.isArray(viceMayors)) {
      return res.status(400).json({ error: 'Invalid vice mayors data' });
    }

    await execute(
      `INSERT INTO about_editable_sections (section_key, section_name, content, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content = ?, updated_by = ?, updated_at = NOW()`,
      [
        'viceMayors',
        'Vice Mayors',
        JSON.stringify(viceMayors),
        req.user?.id,
        JSON.stringify(viceMayors),
        req.user?.id
      ]
    );

    await logAudit('update', 'vice_mayors_section', null, { count: viceMayors.length }, req.user?.id, req.ip);

    res.json({ success: true, message: 'Vice mayors updated successfully', data: viceMayors });
  } catch (error) {
    console.error('Error updating vice mayors:', error);
    res.status(500).json({ error: 'Failed to update vice mayors' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════════
// ADMIN MEDIA GALLERY MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * ADMIN PROTECTED — GET /api/admin/about-media
 * Get all media files for About page management
 */
router.get('/admin/about-media', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { section } = req.query;
    
    let query = `
      SELECT 
        m.id,
        m.section_id,
        s.section_key as section,
        m.file_url as file_path,
        m.file_name as original_name,
        m.file_size,
        m.mime_type,
        m.display_order,
        m.is_active,
        m.uploaded_at,
        m.uploaded_by
      FROM about_media m
      LEFT JOIN about_sections s ON m.section_id = s.id
      WHERE m.is_active = TRUE
    `;
    
    const params = [];
    
    if (section) {
      query += ` AND s.section_key = ?`;
      params.push(section);
    }
    
    query += ` ORDER BY m.section_id, m.display_order ASC`;
    
    const [media] = await execute(query, params);
    
    res.json(media || []);
  } catch (error) {
    console.error('Error fetching about media:', error);
    res.status(500).json({ error: 'Failed to fetch media gallery' });
  }
});

/**
 * ADMIN PROTECTED — POST /api/admin/about-media/upload
 * Upload and store media files with multipart form data
 */
router.post('/admin/about-media/upload', authenticateToken, requireAdmin, upload.array('files'), async (req, res) => {
  try {
    const { section } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }
    
    if (!section) {
      return res.status(400).json({ error: 'Section is required' });
    }
    
    // Get section ID
    const [sectionResult] = await execute(
      'SELECT id FROM about_sections WHERE section_key = ?',
      [section]
    );
    
    if (!sectionResult || sectionResult.length === 0) {
      return res.status(400).json({ error: 'Invalid section' });
    }
    
    const sectionId = sectionResult[0].id;
    const uploadedMedia = [];
    
    // Get current max display order
    const [maxOrderResult] = await execute(
      'SELECT COALESCE(MAX(display_order), 0) as maxOrder FROM about_media WHERE section_id = ?',
      [sectionId]
    );
    let nextDisplayOrder = (maxOrderResult[0]?.maxOrder || 0) + 10;
    
    // Process each file
    for (const file of files) {
      // Construct the file path that will be served
      const fileUrl = `/uploads/about/${section}/${file.filename}`;
      
      // Store metadata in database
      const result = await execute(
        `INSERT INTO about_media 
         (section_id, file_url, file_name, file_size, mime_type, display_order, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sectionId,
          fileUrl,
          file.originalname,
          file.size,
          file.mimetype,
          nextDisplayOrder,
          req.user?.id
        ]
      );
      
      uploadedMedia.push({
        id: result[0].insertId,
        section: section,
        file_path: fileUrl,
        original_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        display_order: nextDisplayOrder,
        uploaded_at: new Date().toISOString()
      });
      
      nextDisplayOrder += 10;
    }
    
    await logAudit('upload', 'media', null, 
      { section: section, fileCount: files.length }, req.user?.id, req.ip);
    
    res.json(uploadedMedia);
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media files' });
  }
});

/**
 * ADMIN PROTECTED — DELETE /api/admin/about-media/:id
 * Delete a media file (soft delete by marking as inactive)
 */
router.delete('/admin/about-media/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get media info before deleting
    const [media] = await execute(
      'SELECT file_url, file_name, section_id FROM about_media WHERE id = ?',
      [id]
    );
    
    if (!media || media.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    // Soft delete
    await execute(
      'UPDATE about_media SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [id]
    );
    
    await logAudit('delete', 'media', id, 
      { fileName: media[0].file_name }, req.user?.id, req.ip);
    
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
