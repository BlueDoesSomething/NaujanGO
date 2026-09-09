import express from 'express';
import bcrypt from 'bcryptjs';
import { spawn } from 'child_process';
import db from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHATBOT_TRAINING_SCRIPT = path.resolve(__dirname, '../MULTILINGUAL_CHATBOT/enhanced_train_multilingual.py');
const CHATBOT_WORKING_DIR = path.resolve(__dirname, '../MULTILINGUAL_CHATBOT');
const CHATBOT_TRAINING_LANGUAGES = ['all', 'en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de'];
const PYTHON_EXECUTABLE = process.env.PYTHON_PATH || 'python';

const chatbotTrainingJobs = new Map();

function createChatbotTrainingJob(language) {
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const job = {
    jobId,
    status: 'running',
    language,
    startedAt: new Date().toISOString(),
    completedAt: null,
    exitCode: null,
    logs: [],
    error: null,
  };

  chatbotTrainingJobs.set(jobId, job);
  return job;
}

function appendChatbotTrainingLog(jobId, line) {
  const job = chatbotTrainingJobs.get(jobId);
  if (!job || !line) return;
  job.logs.push(line);
  if (job.logs.length > 80) {
    job.logs.splice(0, job.logs.length - 80);
  }
}

function startChatbotTraining(language = 'all') {
  const selectedLanguage = CHATBOT_TRAINING_LANGUAGES.includes(language) ? language : 'all';
  const job = createChatbotTrainingJob(selectedLanguage);
  const env = {
    ...process.env,
    PYTHONUNBUFFERED: '1',
    TF_ENABLE_ONEDNN_OPTS: '0',
    TF_CPP_MIN_LOG_LEVEL: '3',
    PYTHONWARNINGS: 'ignore',
  };

  if (selectedLanguage !== 'all') {
    env.CHATBOT_TRAIN_LANGUAGES = selectedLanguage;
  }

  const child = spawn(PYTHON_EXECUTABLE, [CHATBOT_TRAINING_SCRIPT], {
    cwd: CHATBOT_WORKING_DIR,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/).filter(Boolean);
    lines.forEach((line) => appendChatbotTrainingLog(job.jobId, line));
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/).filter(Boolean);
    lines.forEach((line) => appendChatbotTrainingLog(job.jobId, `[stderr] ${line}`));
  });

  child.on('error', (error) => {
    const currentJob = chatbotTrainingJobs.get(job.jobId);
    if (!currentJob) return;
    currentJob.status = 'failed';
    currentJob.completedAt = new Date().toISOString();
    currentJob.error = error.message;
    appendChatbotTrainingLog(job.jobId, `[error] ${error.message}`);
  });

  child.on('close', (exitCode) => {
    const currentJob = chatbotTrainingJobs.get(job.jobId);
    if (!currentJob) return;
    currentJob.exitCode = exitCode;
    currentJob.completedAt = new Date().toISOString();
    currentJob.status = exitCode === 0 ? 'completed' : 'failed';
    if (exitCode !== 0 && !currentJob.error) {
      currentJob.error = `Training process exited with code ${exitCode}`;
    }
  });

  return job;
}

const HERO_DEFAULT_SETTINGS = {
  images: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
  ],
  overlayColor: '#16a34a',
  overlayOpacity: 0.5,
};

const HOME_SLIDESHOW_DEFAULT = {
  overlayColor: '#000000',
  overlayOpacity: 0.4,
  tagText: 'Featured Destination',
  buttonTextGuest: 'Start Your Journey',
  buttonTextUser: 'Explore Now',
  titleColor: '#ffffff',
  descriptionColor: '#e5e7eb',
  tagTextColor: '#ffffff',
  tagBgColor: '#ffffff',
  buttonColor: '#ffffff',
  buttonTextColor: '#111827',
  buttonTransparent: false,
};

const SITE_THEME_DEFAULT = {
  primary: '#16a34a',
  primaryDark: '#15803d',
  primaryLight: '#22c55e',
  secondary: '#0891b2',
  secondaryDark: '#0e7490',
  navBg: '#15803d',
};

const HERO_EXTENDED_DEFAULT = {
  title: 'Discover Naujan',
  subtitle: 'Oriental Mindoro, Philippines',
  autoplay: true,
  intervalSeconds: 5,
};

const ATTRACTION_HERO_DEFAULT = {
  backButtonLabel: 'Back',
  heroMinHeightDesktop: 480,
  heroMinHeightMobile: 420,
  overlayStart: 0.78,
  overlayMid: 0.52,
  overlayEnd: 0.64,
  addToItineraryText: 'Add to Itinerary',
  saveToFavoritesText: 'Save to Favorites',
  savedToFavoritesText: 'Saved to Favorites',
  shareText: 'Share',
  viewOnMapText: 'View on Map',
  heroTitleColor: '#f8fafc',
  heroMetaTextColor: '#ecfeff',
  heroKickerColor: '#dcfce7',
  heroBadgeTextColor: '#ecfdf5',
  backButtonTextColor: '#0f172a',
  backButtonBgColor: '#ffffff',
  backButtonTransparent: false,
  primaryButtonColor: '#16a34a',
  primaryButtonTextColor: '#ffffff',
  primaryButtonTransparent: false,
  secondaryButtonColor: '#ffffff',
  secondaryButtonTextColor: '#111827',
  secondaryButtonTransparent: false,
  tertiaryButtonColor: '#0f172a',
  tertiaryButtonTextColor: '#ecfeff',
  tertiaryButtonTransparent: true,
};

const HOME_SLIDESHOW_EXTENDED_DEFAULT = {
  intervalSeconds: 4,
  showArrows: true,
  transition: 'fade',
};

const TYPOGRAPHY_DEFAULT = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  fontScale: 'medium',
  headingWeight: '800',
  bodyWeight: '400',
  headingLineHeight: '1.15',
  bodyLineHeight: '1.7',
  headingLetterSpacing: '-0.02',
  bodyLetterSpacing: '0',
  h1Size: '3.5rem',
  h2Size: '2.5rem',
  h3Size: '1.75rem',
  bodySize: '1rem',
  navFontSize: '0.95rem',
  buttonFontSize: '0.95rem',
  contentMaxWidth: '1200px',
  preset: 'balanced',
};

const ANNOUNCEMENT_DEFAULT = {
  enabled: false,
  message: 'Welcome to NaujanGO — your official tourism guide!',
  bgColor: '#16a34a',
  textColor: '#ffffff',
  linkUrl: '',
  linkLabel: '',
  dismissible: true,
};

const FOOTER_DEFAULT = {
  tagline: 'Your gateway to the beauty of Naujan, Oriental Mindoro.',
  copyright: 'NaujanGO. All rights reserved.',
  contactEmail: 'info@naujango.ph',
  contactPhone: '+63 43 XXX-XXXX',
  contactAddress: 'Naujan, Oriental Mindoro',

  facebook: 'https://facebook.com/naujantourism',
  instagram: 'https://instagram.com/naujantourism',
  twitter: '',
  youtube: '',
};

const HOMEPAGE_SECTIONS_DEFAULT = {
  showHeroSlideshow: true,
  showWelcome: true,
  showWeather: true,
  showAttractions: true,
  showHotels: true,
  showQuickActions: true,
  showCta: true,
  showBenefits: true,
  showInspiration: true,
  welcomeTitle: 'Welcome to Naujan',
  welcomeSubtitle: 'Discover Paradise',
  attractionsTitle: 'Featured Attractions',
  attractionsSubtitle: 'Explore our top destinations',
  hotelsTitle: 'Recommended Hotels',
  hotelsSubtitle: 'Find your perfect stay',
};

const BRANDING_DEFAULT = {
  siteName: 'NaujanGO',
  logoUrl: '',
  faviconUrl: '',
  tagline: 'Your Official Tourism Guide',
};

const AUTH_PAGES_DEFAULT = {
  loginBgType: 'gradient',
  loginSolidColor: '#f5f7fa',
  loginGradient: { color1: '#f5f7fa', color2: '#c3cfe2', angle: 135 },
  loginImage: '',
  loginOverlayOpacity: 0.5,
  registerBgType: 'gradient',
  registerSolidColor: '#f5f7fa',
  registerGradient: { color1: '#f5f7fa', color2: '#c3cfe2', angle: 135 },
  registerImage: '',
  registerOverlayOpacity: 0.5,
};

const ensureSiteSettingsTable = async () => {
  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value MEDIUMTEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

// PUBLIC — no auth required (read hero settings for frontend display)
router.get('/hero-settings', async (req, res) => {
  try {
    await ensureSiteSettingsTable();
    const [rows] = await db.promise().query(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'hero_settings'"
    );
    if (rows.length && rows[0].setting_value) {
      return res.json(JSON.parse(rows[0].setting_value));
    }
    return res.json(HERO_DEFAULT_SETTINGS);
  } catch (err) {
    console.error('Get hero settings error:', err);
    res.status(500).json({ error: 'Failed to load hero settings' });
  }
});

// PUBLIC — get home slideshow settings
router.get('/home-slideshow', async (req, res) => {
  try {
    await ensureSiteSettingsTable();
    const [rows] = await db.promise().query(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'home_slideshow'"
    );
    if (rows.length && rows[0].setting_value) {
      return res.json({ ...HOME_SLIDESHOW_DEFAULT, ...JSON.parse(rows[0].setting_value) });
    }
    return res.json(HOME_SLIDESHOW_DEFAULT);
  } catch (err) {
    console.error('Get home slideshow error:', err);
    res.status(500).json({ error: 'Failed to load home slideshow settings' });
  }
});

// PUBLIC — get site theme
router.get('/site-theme', async (req, res) => {
  try {
    await ensureSiteSettingsTable();
    const [rows] = await db.promise().query(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'site_theme'"
    );
    if (rows.length && rows[0].setting_value) {
      return res.json(JSON.parse(rows[0].setting_value));
    }
    return res.json(SITE_THEME_DEFAULT);
  } catch (err) {
    console.error('Get site theme error:', err);
    res.status(500).json({ error: 'Failed to load site theme' });
  }
});

// PUBLIC — generic GET for extended settings
const makePublicGet = (key, defaults) => {
  router.get(`/${key}`, async (req, res) => {
    try {
      await ensureSiteSettingsTable();
      const [rows] = await db.promise().query(
        'SELECT setting_value FROM site_settings WHERE setting_key = ?', [key]
      );
      return res.json(rows.length && rows[0].setting_value
        ? { ...defaults, ...JSON.parse(rows[0].setting_value) }
        : defaults);
    } catch (err) {
      console.error(`Get ${key} error:`, err);
      res.status(500).json({ error: `Failed to load ${key}` });
    }
  });
};

makePublicGet('hero-extended', HERO_EXTENDED_DEFAULT);
makePublicGet('attraction-hero', ATTRACTION_HERO_DEFAULT);
makePublicGet('home-slideshow-extended', HOME_SLIDESHOW_EXTENDED_DEFAULT);
makePublicGet('typography', TYPOGRAPHY_DEFAULT);
makePublicGet('announcement', ANNOUNCEMENT_DEFAULT);
makePublicGet('footer-settings', FOOTER_DEFAULT);
makePublicGet('homepage-sections', HOMEPAGE_SECTIONS_DEFAULT);
makePublicGet('branding', BRANDING_DEFAULT);
makePublicGet('auth-pages', AUTH_PAGES_DEFAULT);

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ── helper: admin PUT for simple JSON settings ──────────────────────────────
const makeAdminPut = (key, defaults) => {
  router.put(`/${key}`, async (req, res) => {
    try {
      await ensureSiteSettingsTable();
      const settings = { ...defaults, ...req.body };
      await db.promise().query(
        `INSERT INTO site_settings (setting_key, setting_value)
         VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, JSON.stringify(settings)]
      );
      res.json({ success: true, settings });
    } catch (err) {
      console.error(`Save ${key} error:`, err);
      res.status(500).json({ error: `Failed to save ${key}` });
    }
  });
};

const normalizeBooleanSetting = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
  }
  return fallback;
};

const sanitizeColorHex = (value, fallback) => {
  const hexRe = /^#[0-9A-Fa-f]{6}$/;
  return typeof value === 'string' && hexRe.test(value) ? value : fallback;
};

const sanitizeNumberRange = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

makeAdminPut('hero-extended', HERO_EXTENDED_DEFAULT);
makeAdminPut('home-slideshow-extended', HOME_SLIDESHOW_EXTENDED_DEFAULT);
makeAdminPut('typography', TYPOGRAPHY_DEFAULT);
makeAdminPut('announcement', ANNOUNCEMENT_DEFAULT);
makeAdminPut('footer-settings', FOOTER_DEFAULT);
makeAdminPut('homepage-sections', HOMEPAGE_SECTIONS_DEFAULT);
makeAdminPut('branding', BRANDING_DEFAULT);
makeAdminPut('auth-pages', AUTH_PAGES_DEFAULT);

router.put('/attraction-hero', async (req, res) => {
  try {
    await ensureSiteSettingsTable();
    const body = req.body || {};
    const settings = {
      ...ATTRACTION_HERO_DEFAULT,
      ...body,
      overlayStart: sanitizeNumberRange(body.overlayStart, ATTRACTION_HERO_DEFAULT.overlayStart, 0.25, 0.95),
      overlayMid: sanitizeNumberRange(body.overlayMid, ATTRACTION_HERO_DEFAULT.overlayMid, 0.2, 0.9),
      overlayEnd: sanitizeNumberRange(body.overlayEnd, ATTRACTION_HERO_DEFAULT.overlayEnd, 0.25, 0.95),
      heroMinHeightDesktop: sanitizeNumberRange(body.heroMinHeightDesktop, ATTRACTION_HERO_DEFAULT.heroMinHeightDesktop, 360, 760),
      heroMinHeightMobile: sanitizeNumberRange(body.heroMinHeightMobile, ATTRACTION_HERO_DEFAULT.heroMinHeightMobile, 300, 620),
      heroTitleColor: sanitizeColorHex(body.heroTitleColor, ATTRACTION_HERO_DEFAULT.heroTitleColor),
      heroMetaTextColor: sanitizeColorHex(body.heroMetaTextColor, ATTRACTION_HERO_DEFAULT.heroMetaTextColor),
      heroKickerColor: sanitizeColorHex(body.heroKickerColor, ATTRACTION_HERO_DEFAULT.heroKickerColor),
      heroBadgeTextColor: sanitizeColorHex(body.heroBadgeTextColor, ATTRACTION_HERO_DEFAULT.heroBadgeTextColor),
      backButtonTextColor: sanitizeColorHex(body.backButtonTextColor, ATTRACTION_HERO_DEFAULT.backButtonTextColor),
      backButtonBgColor: sanitizeColorHex(body.backButtonBgColor, ATTRACTION_HERO_DEFAULT.backButtonBgColor),
      primaryButtonColor: sanitizeColorHex(body.primaryButtonColor, ATTRACTION_HERO_DEFAULT.primaryButtonColor),
      primaryButtonTextColor: sanitizeColorHex(body.primaryButtonTextColor, ATTRACTION_HERO_DEFAULT.primaryButtonTextColor),
      secondaryButtonColor: sanitizeColorHex(body.secondaryButtonColor, ATTRACTION_HERO_DEFAULT.secondaryButtonColor),
      secondaryButtonTextColor: sanitizeColorHex(body.secondaryButtonTextColor, ATTRACTION_HERO_DEFAULT.secondaryButtonTextColor),
      tertiaryButtonColor: sanitizeColorHex(body.tertiaryButtonColor, ATTRACTION_HERO_DEFAULT.tertiaryButtonColor),
      tertiaryButtonTextColor: sanitizeColorHex(body.tertiaryButtonTextColor, ATTRACTION_HERO_DEFAULT.tertiaryButtonTextColor),
      backButtonTransparent: normalizeBooleanSetting(body.backButtonTransparent, ATTRACTION_HERO_DEFAULT.backButtonTransparent),
      primaryButtonTransparent: normalizeBooleanSetting(body.primaryButtonTransparent, ATTRACTION_HERO_DEFAULT.primaryButtonTransparent),
      secondaryButtonTransparent: normalizeBooleanSetting(body.secondaryButtonTransparent, ATTRACTION_HERO_DEFAULT.secondaryButtonTransparent),
      tertiaryButtonTransparent: normalizeBooleanSetting(body.tertiaryButtonTransparent, ATTRACTION_HERO_DEFAULT.tertiaryButtonTransparent),
      backButtonLabel: String(body.backButtonLabel ?? ATTRACTION_HERO_DEFAULT.backButtonLabel).slice(0, 24),
      addToItineraryText: String(body.addToItineraryText ?? ATTRACTION_HERO_DEFAULT.addToItineraryText).slice(0, 36),
      saveToFavoritesText: String(body.saveToFavoritesText ?? ATTRACTION_HERO_DEFAULT.saveToFavoritesText).slice(0, 36),
      savedToFavoritesText: String(body.savedToFavoritesText ?? ATTRACTION_HERO_DEFAULT.savedToFavoritesText).slice(0, 36),
      shareText: String(body.shareText ?? ATTRACTION_HERO_DEFAULT.shareText).slice(0, 24),
      viewOnMapText: String(body.viewOnMapText ?? ATTRACTION_HERO_DEFAULT.viewOnMapText).slice(0, 24),
    };

    await db.promise().query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ('attraction-hero', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(settings)]
    );

    res.json({ success: true, settings });
  } catch (err) {
    console.error('Save attraction-hero error:', err);
    res.status(500).json({ error: 'Failed to save attraction-hero' });
  }
});

router.put('/hero-settings', async (req, res) => {
  const { images, overlayColor, overlayOpacity } = req.body;
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'At least one image URL is required' });
  }
  try {
    await ensureSiteSettingsTable();
    const settings = {
      images: images.filter(Boolean),
      overlayColor: overlayColor || HERO_DEFAULT_SETTINGS.overlayColor,
      overlayOpacity: Math.max(0, Math.min(1, Number(overlayOpacity) || HERO_DEFAULT_SETTINGS.overlayOpacity)),
    };
    await db.promise().query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ('hero_settings', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(settings)]
    );
    res.json({ success: true, message: 'Hero settings saved successfully', settings });
  } catch (err) {
    console.error('Save hero settings error:', err);
    res.status(500).json({ error: 'Failed to save hero settings' });
  }
});

// ADMIN — save home slideshow settings
router.put('/home-slideshow', async (req, res) => {
  const {
    overlayColor,
    overlayOpacity,
    tagText,
    buttonTextGuest,
    buttonTextUser,
    titleColor,
    descriptionColor,
    tagTextColor,
    tagBgColor,
    buttonColor,
    buttonTextColor,
    buttonTransparent,
  } = req.body;
  const hexRe = /^#[0-9A-Fa-f]{6}$/;
  const validateHex = (value, fallback) => (typeof value === 'string' && hexRe.test(value) ? value : fallback);
  try {
    await ensureSiteSettingsTable();
    const settings = {
      overlayColor: validateHex(overlayColor, HOME_SLIDESHOW_DEFAULT.overlayColor),
      overlayOpacity: Math.max(0, Math.min(1, Number(overlayOpacity) ?? HOME_SLIDESHOW_DEFAULT.overlayOpacity)),
      tagText: String(tagText || HOME_SLIDESHOW_DEFAULT.tagText).slice(0, 100),
      buttonTextGuest: String(buttonTextGuest || HOME_SLIDESHOW_DEFAULT.buttonTextGuest).slice(0, 100),
      buttonTextUser: String(buttonTextUser || HOME_SLIDESHOW_DEFAULT.buttonTextUser).slice(0, 100),
      titleColor: validateHex(titleColor, HOME_SLIDESHOW_DEFAULT.titleColor),
      descriptionColor: validateHex(descriptionColor, HOME_SLIDESHOW_DEFAULT.descriptionColor),
      tagTextColor: validateHex(tagTextColor, HOME_SLIDESHOW_DEFAULT.tagTextColor),
      tagBgColor: validateHex(tagBgColor, HOME_SLIDESHOW_DEFAULT.tagBgColor),
      buttonColor: validateHex(buttonColor, HOME_SLIDESHOW_DEFAULT.buttonColor),
      buttonTextColor: validateHex(buttonTextColor, HOME_SLIDESHOW_DEFAULT.buttonTextColor),
      buttonTransparent: Boolean(buttonTransparent),
    };
    await db.promise().query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ('home_slideshow', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(settings)]
    );
    res.json({ success: true, message: 'Home slideshow settings saved', settings });
  } catch (err) {
    console.error('Save home slideshow error:', err);
    res.status(500).json({ error: 'Failed to save home slideshow settings' });
  }
});

// ADMIN — save site theme
router.put('/site-theme', async (req, res) => {
  const { primary, primaryDark, primaryLight, secondary, secondaryDark, navBg } = req.body;
  const hexRe = /^#[0-9A-Fa-f]{6}$/;
  const validate = (val, def) => (typeof val === 'string' && hexRe.test(val) ? val : def);
  try {
    await ensureSiteSettingsTable();
    const settings = {
      primary: validate(primary, SITE_THEME_DEFAULT.primary),
      primaryDark: validate(primaryDark, SITE_THEME_DEFAULT.primaryDark),
      primaryLight: validate(primaryLight, SITE_THEME_DEFAULT.primaryLight),
      secondary: validate(secondary, SITE_THEME_DEFAULT.secondary),
      secondaryDark: validate(secondaryDark, SITE_THEME_DEFAULT.secondaryDark),
      navBg: validate(navBg, SITE_THEME_DEFAULT.navBg),
    };
    await db.promise().query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ('site_theme', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(settings)]
    );
    res.json({ success: true, message: 'Site theme saved', settings });
  } catch (err) {
    console.error('Save site theme error:', err);
    res.status(500).json({ error: 'Failed to save site theme' });
  }
});

const normalizeIsActive = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value === true || value === 'true' || value === 1 || value === '1') return 1;
  if (value === false || value === 'false' || value === 0 || value === '0') return 0;
  return undefined;
};

let userColumnCache = null;
const getUserColumns = async () => {
  if (userColumnCache) return userColumnCache;
  const targetColumns = ['phone', 'phone_number'];
  const [rows] = await db.promise().query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'users'
       AND column_name IN (?, ?)`
    , targetColumns
  );

  const present = new Set(rows.map((row) => row.COLUMN_NAME));
  userColumnCache = {
    phone: present.has('phone') ? 'phone' : present.has('phone_number') ? 'phone_number' : null
  };
  return userColumnCache;
};

let hotelColumnCache = null;
const getHotelColumns = async () => {
  if (hotelColumnCache) return hotelColumnCache;

  const [rows] = await db.promise().query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'hotels'
       AND column_name IN ('image_urls')`
  );

  const present = new Set(rows.map((row) => row.COLUMN_NAME));
  hotelColumnCache = {
    imageUrls: present.has('image_urls')
  };
  return hotelColumnCache;
};

const parseAmenitiesInput = (amenities) => {
  if (amenities === undefined) return undefined;
  if (amenities === null || amenities === '') return null;
  if (Array.isArray(amenities)) return JSON.stringify(amenities);
  if (typeof amenities === 'string') {
    const trimmed = amenities.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return JSON.stringify(parsed);
      } catch (error) {
        // Fall back to comma-separated parsing
      }
    }
    const list = trimmed.split(',').map(item => item.trim()).filter(Boolean);
    return JSON.stringify(list);
  }
  return JSON.stringify([String(amenities)]);
};

const parseImageUrlsInput = (imageUrls) => {
  if (imageUrls === undefined) return undefined;
  if (imageUrls === null || imageUrls === '') return null;
  if (Array.isArray(imageUrls)) return JSON.stringify(imageUrls.filter(Boolean));
  if (typeof imageUrls === 'string') {
    const trimmed = imageUrls.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return JSON.stringify(parsed.filter(Boolean));
      } catch (error) {
        // Fall back to comma-separated parsing
      }
    }
    const list = trimmed.split(',').map(item => item.trim()).filter(Boolean);
    return JSON.stringify(list);
  }
  return JSON.stringify([String(imageUrls)]);
};

// Get archived users
router.get('/users/archived', async (req, res) => {
  try {
    const [users] = await db.promise().query(`
      SELECT user_id, username, email, role, first_name, last_name, 
             phone, archived, archived_at, archived_by, created_at, updated_at 
      FROM users 
      WHERE archived = 1
      ORDER BY archived_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error('Get archived users error:', error);
    res.status(500).json({ error: 'Failed to fetch archived users' });
  }
});

// Get archived bookings
router.get('/bookings/archived', async (req, res) => {
  try {
    const [bookings] = await db.promise().query(`
      SELECT 
        b.*,
        u.username,
        u.email,
        b.hotel_name,
        b.check_in as check_in_date,
        b.check_out as check_out_date,
        b.guests as number_of_guests,
        b.created_at as booking_date
      FROM hotel_bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.archived = 1
      ORDER BY b.archived_at DESC
    `);
    res.json(bookings);
  } catch (error) {
    console.error('Get archived bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch archived bookings' });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get total counts
    const [userCount] = await db.promise().query('SELECT COUNT(*) as count FROM users');
    const [hotelCount] = await db.promise().query('SELECT COUNT(*) as count FROM hotels');
    const [bookingCount] = await db.promise().query('SELECT COUNT(*) as count FROM hotel_bookings');
    const [attractionCount] = await db.promise().query('SELECT COUNT(*) as count FROM attractions');

    // Get role distribution
    const [roleDistribution] = await db.promise().query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    // Get recent users
    const [recentUsers] = await db.promise().query(`
      SELECT user_id, username, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    // Get booking statistics
    const [bookingStats] = await db.promise().query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM hotel_bookings
    `);

    res.json({
      totals: {
        users: userCount[0].count,
        hotels: hotelCount[0].count,
        bookings: bookingCount[0].count,
        attractions: attractionCount[0].count
      },
      roleDistribution,
      recentUsers,
      bookingStats: bookingStats[0]
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get all users (including archived)
router.get('/users', async (req, res) => {
  try {
    const showArchived = req.query.archived === 'true';
    const whereClause = showArchived ? '' : 'WHERE archived = 0';
    
    const [users] = await db.promise().query(`
      SELECT user_id, username, email, role, first_name, last_name, 
             phone, archived, archived_at, created_at, updated_at, profile_picture 
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (admin)
router.post('/users', async (req, res) => {
  const { username, email, password, role, first_name, last_name, phone } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (!['user', 'owner', 'admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be user, owner, admin, or agent' });
  }

  try {
    // Check if email already exists
    const [emailCheck] = await db.promise().query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );
    if (emailCheck.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Check if username already exists
    const [usernameCheck] = await db.promise().query(
      'SELECT user_id FROM users WHERE username = ?',
      [username]
    );
    if (usernameCheck.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await db.promise().query(
      `INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, role, first_name || null, last_name || null, phone || null]
    );

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const adminId = req.user.user_id;

  if (!['user', 'owner', 'admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    // Get current role
    const [currentUser] = await db.promise().query(
      'SELECT role FROM users WHERE user_id = ?',
      [userId]
    );

    if (currentUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role
    await db.promise().query(
      'UPDATE users SET role = ? WHERE user_id = ?',
      [role, userId]
    );

    // Log role change
    await db.promise().query(
      'INSERT INTO role_changes (user_id, old_role, new_role, changed_by) VALUES (?, ?, ?, ?)',
      [userId, currentUser[0].role, role, adminId]
    );

    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Update user profile (admin)
router.put('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const {
    username,
    email,
    first_name,
    last_name,
    phone,
    role,
    password
  } = req.body;

  if (role !== undefined && !['user', 'owner', 'admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const [existingUser] = await db.promise().query(
      'SELECT user_id FROM users WHERE user_id = ?'
      , [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email) {
      const [emailCheck] = await db.promise().query(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?'
        , [email, userId]
      );
      if (emailCheck.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    if (username) {
      const [userCheck] = await db.promise().query(
        'SELECT user_id FROM users WHERE username = ? AND user_id != ?'
        , [username, userId]
      );
      if (userCheck.length > 0) {
        return res.status(409).json({ error: 'Username already in use' });
      }
    }

    const updates = [];
    const values = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username || null);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email || null);
    }
    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name || null);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name || null);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    const { phone: phoneColumn } = await getUserColumns();
    if (phoneColumn && phone !== undefined) {
      updates.push(`${phoneColumn} = ?`);
      values.push(phone || null);
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    values.push(userId);
    await db.promise().query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`
      , values
    );

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Archive user (soft delete)
router.patch('/users/:userId/archive', async (req, res) => {
  const { userId } = req.params;
  const adminId = req.user.user_id;

  // Prevent self-archiving
  if (parseInt(userId) === adminId) {
    return res.status(400).json({ error: 'Cannot archive your own account' });
  }

  try {
    await db.promise().query(
      'UPDATE users SET archived = 1, archived_at = NOW(), archived_by = ? WHERE user_id = ?',
      [adminId, userId]
    );
    res.json({ success: true, message: 'User archived successfully' });
  } catch (error) {
    console.error('Archive user error:', error);
    res.status(500).json({ error: 'Failed to archive user' });
  }
});

// Restore archived user
router.patch('/users/:userId/restore', async (req, res) => {
  const { userId } = req.params;

  try {
    await db.promise().query(
      'UPDATE users SET archived = 0, archived_at = NULL, archived_by = NULL WHERE user_id = ?',
      [userId]
    );
    res.json({ success: true, message: 'User restored successfully' });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({ error: 'Failed to restore user' });
  }
});

// Delete user (permanent deletion)
router.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const adminId = req.user.user_id;

  if (parseInt(userId) === adminId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  try {
    const [existing] = await db.promise().query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Permanently delete the user from database
    await db.promise().query(
      'DELETE FROM users WHERE user_id = ?',
      [userId]
    );

    res.json({ success: true, message: 'User deleted permanently' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all bookings with details
router.get('/bookings', async (req, res) => {
  try {
    const [bookings] = await db.promise().query(`
      SELECT 
        b.*,
        u.username,
        u.email,
        b.hotel_name,
        b.check_in as check_in_date,
        b.check_out as check_out_date,
        b.guests as number_of_guests,
        b.created_at as booking_date
      FROM hotel_bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.archived = 0
      ORDER BY b.created_at DESC
    `);
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status (admin)
router.put('/bookings/:bookingId/status', async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const [existing] = await db.promise().query(
      'SELECT booking_id, status, rooms, hotel_id FROM hotel_bookings WHERE booking_id = ?',
      [bookingId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const current = existing[0];
    await db.promise().query(
      'UPDATE hotel_bookings SET status = ? WHERE booking_id = ?',
      [status, bookingId]
    );

    if (current.hotel_id && current.status !== status) {
      const roomDelta = Number(current.rooms) || 0;
      if (roomDelta > 0) {
        try {
          if (status === 'confirmed' && current.status !== 'confirmed') {
            await db.promise().query(
              'UPDATE hotels SET rooms_available = GREATEST(rooms_available - ?, 0) WHERE hotel_id = ? AND rooms_available IS NOT NULL',
              [roomDelta, current.hotel_id]
            );
          }

          if (status === 'cancelled' && current.status === 'confirmed') {
            await db.promise().query(
              'UPDATE hotels SET rooms_available = rooms_available + ? WHERE hotel_id = ? AND rooms_available IS NOT NULL',
              [roomDelta, current.hotel_id]
            );
          }
        } catch (availabilityError) {
          if (availabilityError.code !== 'ER_BAD_FIELD_ERROR') {
            throw availabilityError;
          }
        }
      }
    }

    res.json({ success: true, message: 'Booking status updated successfully' });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Delete booking (admin) - Changed to archive
router.delete('/bookings/:bookingId', async (req, res) => {
  const { bookingId } = req.params;

  try {
    await db.promise().query(
      'UPDATE hotel_bookings SET archived = 1, archived_at = NOW() WHERE booking_id = ?',
      [bookingId]
    );

    res.json({ success: true, message: 'Booking archived successfully' });
  } catch (error) {
    console.error('Archive booking error:', error);
    res.status(500).json({ error: 'Failed to archive booking' });
  }
});

// Get role change history
router.get('/role-changes', async (req, res) => {
  try {
    const [changes] = await db.promise().query(`
      SELECT 
        rc.*,
        u.username,
        u.email,
        admin.username as changed_by_username
      FROM role_changes rc
      JOIN users u ON rc.user_id = u.user_id
      JOIN users admin ON rc.changed_by = admin.user_id
      ORDER BY rc.changed_at DESC
      LIMIT 50
    `);
    res.json(changes);
  } catch (error) {
    console.error('Get role changes error:', error);
    res.status(500).json({ error: 'Failed to fetch role changes' });
  }
});

// Get all attractions
router.get('/attractions', async (req, res) => {
  try {
    const [attractions] = await db.promise().query(`
      SELECT 
        a.*,
        COUNT(DISTINCT r.review_id) as review_count,
        AVG(r.rating) as avg_rating
      FROM attractions a
      LEFT JOIN reviews r ON a.id = r.poi_id AND r.moderated = 1
      WHERE a.archived = 0
      GROUP BY a.id
      ORDER BY a.name ASC
    `);
    res.json(attractions);
  } catch (error) {
    console.error('Get attractions error:', error);
    res.status(500).json({ error: 'Failed to fetch attractions' });
  }
});

// Create attraction
router.post('/attractions', async (req, res) => {
  const { name, description, location, image_url, latitude, longitude } = req.body;

  if (!name || !location) {
    return res.status(400).json({ error: 'Name and location are required' });
  }

  try {
    const [result] = await db.promise().query(
      'INSERT INTO attractions (name, description, location, image_url, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, location, image_url, latitude, longitude]
    );

    res.json({ success: true, attractionId: result.insertId });
  } catch (error) {
    console.error('Create attraction error:', error);
    res.status(500).json({ error: 'Failed to create attraction' });
  }
});

// Update attraction
router.put('/attractions/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, location, image_url, latitude, longitude } = req.body;

  try {
    await db.promise().query(
      'UPDATE attractions SET name = ?, description = ?, location = ?, image_url = ?, latitude = ?, longitude = ? WHERE id = ?',
      [name, description, location, image_url, latitude, longitude, id]
    );

    res.json({ success: true, message: 'Attraction updated successfully' });
  } catch (error) {
    console.error('Update attraction error:', error);
    res.status(500).json({ error: 'Failed to update attraction' });
  }
});

// Delete attraction - Changed to archive
router.delete('/attractions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.promise().query(
      'UPDATE attractions SET archived = 1, archived_at = NOW() WHERE id = ?',
      [id]
    );
    res.json({ success: true, message: 'Attraction archived successfully' });
  } catch (error) {
    console.error('Archive attraction error:', error);
    res.status(500).json({ error: 'Failed to archive attraction' });
  }
});

// Get all hotels with owners
router.get('/hotels', async (req, res) => {
  try {
    const [hotels] = await db.promise().query(`
      SELECT 
        h.*,
        GROUP_CONCAT(DISTINCT u.user_id) as owner_ids,
        GROUP_CONCAT(DISTINCT CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) SEPARATOR ', ') as owner_names,
        GROUP_CONCAT(DISTINCT u.email SEPARATOR ', ') as owner_emails
      FROM hotels h
      LEFT JOIN hotel_owners ho ON h.hotel_id = ho.hotel_id
      LEFT JOIN users u ON ho.user_id = u.user_id
      WHERE h.archived = 0
      GROUP BY h.hotel_id
      ORDER BY h.created_at DESC
    `);

    const formatted = hotels.map(hotel => {
      let amenities = [];
      let image_urls = [];
      if (hotel.amenities) {
        try {
          amenities = JSON.parse(hotel.amenities);
        } catch (error) {
          amenities = [];
        }
      }
      if (hotel.image_urls) {
        try {
          image_urls = JSON.parse(hotel.image_urls);
        } catch (error) {
          image_urls = [];
        }
      }

      return {
        ...hotel,
        amenities,
        image_urls,
        owner_ids: hotel.owner_ids ? hotel.owner_ids.split(',').map(id => Number(id)) : [],
        owner_names: hotel.owner_names ? hotel.owner_names.replace(/\s+,/g, ',').trim() : '',
        owner_emails: hotel.owner_emails || ''
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

// Create hotel (admin)
router.post('/hotels', async (req, res) => {
  const {
    name,
    location,
    description,
    price_per_night,
    currency,
    rating,
    rooms_total,
    rooms_available,
    amenities,
    image_url,
    image_urls,
    map_url,
    latitude,
    longitude,
    contact_phone,
    contact_email,
    is_active
  } = req.body;

  if (!name || !location) {
    return res.status(400).json({ error: 'Hotel name and location are required' });
  }

  const price = Number(price_per_night);
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'Price per night must be a valid number' });
  }

  try {
    const parsedAmenities = parseAmenitiesInput(amenities);
    const parsedImageUrls = parseImageUrlsInput(image_urls);
    const hotelColumns = await getHotelColumns();
    const primaryImage = image_url || (parsedImageUrls ? JSON.parse(parsedImageUrls)[0] : null);
    const normalizedStatus = normalizeIsActive(is_active);

    const insertColumns = [
      'name', 'location', 'description', 'price_per_night', 'currency', 'rating',
      'rooms_total', 'rooms_available', 'amenities', 'image_url', 'map_url',
      'latitude', 'longitude', 'contact_phone', 'contact_email', 'is_active'
    ];
    const insertValues = [
      name,
      location,
      description || null,
      price,
      currency || 'PHP',
      rating ?? null,
      rooms_total ?? null,
      rooms_available ?? null,
      parsedAmenities ?? null,
      primaryImage || null,
      map_url || null,
      latitude ?? null,
      longitude ?? null,
      contact_phone || null,
      contact_email || null,
      normalizedStatus === undefined ? 1 : normalizedStatus
    ];

    if (hotelColumns.imageUrls) {
      insertColumns.splice(10, 0, 'image_urls');
      insertValues.splice(10, 0, parsedImageUrls ?? null);
    }

    const [result] = await db.promise().query(
      `INSERT INTO hotels
        (${insertColumns.join(', ')})
       VALUES (${insertColumns.map(() => '?').join(', ')})`
      , insertValues
    );

    res.status(201).json({ success: true, hotel_id: result.insertId });
  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({ error: 'Failed to create hotel' });
  }
});

// Update hotel details
router.put('/hotels/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    location,
    description,
    price_per_night,
    currency,
    rating,
    rooms_total,
    rooms_available,
    amenities,
    image_url,
    image_urls,
    map_url,
    latitude,
    longitude,
    contact_phone,
    contact_email,
    is_active
  } = req.body;

  try {
    const fields = [];
    const values = [];
    const hotelColumns = await getHotelColumns();

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (price_per_night !== undefined) { fields.push('price_per_night = ?'); values.push(price_per_night); }
    if (currency !== undefined) { fields.push('currency = ?'); values.push(currency); }
    if (rating !== undefined) { fields.push('rating = ?'); values.push(rating); }
    if (rooms_total !== undefined) { fields.push('rooms_total = ?'); values.push(rooms_total); }
    if (rooms_available !== undefined) { fields.push('rooms_available = ?'); values.push(rooms_available); }
    if (image_url !== undefined) { fields.push('image_url = ?'); values.push(image_url); }
    const parsedImageUrls = parseImageUrlsInput(image_urls);
    if (hotelColumns.imageUrls && parsedImageUrls !== undefined) {
      fields.push('image_urls = ?');
      values.push(parsedImageUrls);
    }
    if (map_url !== undefined) { fields.push('map_url = ?'); values.push(map_url); }
    if (latitude !== undefined) { fields.push('latitude = ?'); values.push(latitude); }
    if (longitude !== undefined) { fields.push('longitude = ?'); values.push(longitude); }
    if (contact_phone !== undefined) { fields.push('contact_phone = ?'); values.push(contact_phone); }
    if (contact_email !== undefined) { fields.push('contact_email = ?'); values.push(contact_email); }

    const parsedAmenities = parseAmenitiesInput(amenities);
    if (parsedAmenities !== undefined) {
      fields.push('amenities = ?');
      values.push(parsedAmenities);
    }

    const normalizedStatus = normalizeIsActive(is_active);
    if (normalizedStatus !== undefined) {
      fields.push('is_active = ?');
      values.push(normalizedStatus);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    values.push(id);

    await db.promise().query(
      `UPDATE hotels SET ${fields.join(', ')} WHERE hotel_id = ?`,
      values
    );

    res.json({ success: true, message: 'Hotel updated successfully' });
  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({ error: 'Failed to update hotel' });
  }
});

// Update hotel status
router.patch('/hotels/:id/status', async (req, res) => {
  const { id } = req.params;
  const normalizedStatus = normalizeIsActive(req.body?.is_active);

  if (normalizedStatus === undefined) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    await db.promise().query(
      'UPDATE hotels SET is_active = ? WHERE hotel_id = ?',
      [normalizedStatus, id]
    );
    res.json({ success: true, message: 'Hotel status updated successfully' });
  } catch (error) {
    console.error('Update hotel status error:', error);
    res.status(500).json({ error: 'Failed to update hotel status' });
  }
});

// Delete hotel - Changed to archive
router.delete('/hotels/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.promise().query(
      'UPDATE hotels SET archived = 1, archived_at = NOW() WHERE hotel_id = ?',
      [id]
    );
    res.json({ success: true, message: 'Hotel archived successfully' });
  } catch (error) {
    console.error('Archive hotel error:', error);
    res.status(500).json({ error: 'Failed to archive hotel' });
  }
});

// Get archived hotels
router.get('/hotels/archived', async (req, res) => {
  try {
    const [hotels] = await db.promise().query(`
      SELECT h.*, 
        GROUP_CONCAT(DISTINCT u.user_id) as owner_ids,
        GROUP_CONCAT(DISTINCT CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) SEPARATOR ', ') as owner_names
      FROM hotels h
      LEFT JOIN hotel_owners ho ON h.hotel_id = ho.hotel_id
      LEFT JOIN users u ON ho.user_id = u.user_id
      WHERE h.archived = 1
      GROUP BY h.hotel_id
      ORDER BY h.archived_at DESC
    `);
    res.json(hotels);
  } catch (error) {
    console.error('Get archived hotels error:', error);
    res.status(500).json({ error: 'Failed to fetch archived hotels' });
  }
});

// Get archived itineraries
router.get('/itineraries/archived', async (req, res) => {
  try {
    const [itineraries] = await db.promise().query(`
      SELECT i.*, u.username, u.email
      FROM itineraries i
      JOIN users u ON i.user_id = u.user_id
      WHERE i.archived = 1
      ORDER BY i.archived_at DESC
    `);
    res.json(itineraries);
  } catch (error) {
    console.error('Get archived itineraries error:', error);
    res.status(500).json({ error: 'Failed to fetch archived itineraries' });
  }
});

// Get archived attractions
router.get('/attractions/archived', async (req, res) => {
  try {
    const [attractions] = await db.promise().query(`
      SELECT * FROM attractions
      WHERE archived = 1
      ORDER BY archived_at DESC
    `);
    res.json(attractions);
  } catch (error) {
    console.error('Get archived attractions error:', error);
    res.status(500).json({ error: 'Failed to fetch archived attractions' });
  }
});

// Get archived payments
router.get('/payments/archived', async (req, res) => {
  try {
    const [payments] = await db.promise().query(`
      SELECT hp.*, hb.hotel_name, hb.customer_name, hb.customer_email
      FROM hotel_payments hp
      INNER JOIN hotel_bookings hb ON hp.booking_id = hb.booking_id
      WHERE hp.archived = 1
      ORDER BY hp.archived_at DESC
    `);
    res.json(payments);
  } catch (error) {
    console.error('Get archived payments error:', error);
    res.status(500).json({ error: 'Failed to fetch archived payments' });
  }
});

// Get chatbot conversations
router.get('/chatbot/conversations', async (req, res) => {
  try {
    const [conversations] = await db.promise().query(`
      SELECT 
        c.conversation_id,
        c.user_id,
        c.started_at,
        u.username,
        u.email,
        u.profile_picture,
        COUNT(m.message_id) as message_count,
        MAX(m.sent_at) as last_message_at,
        (
          SELECT m2.message_text FROM chatbot_messages m2
          WHERE m2.conversation_id = c.conversation_id
          ORDER BY m2.sent_at ASC LIMIT 1
        ) as first_message,
        (
          SELECT m2.language FROM chatbot_messages m2
          WHERE m2.conversation_id = c.conversation_id
          ORDER BY m2.sent_at DESC LIMIT 1
        ) as language
      FROM chatbot_conversations c
      LEFT JOIN users u ON c.user_id = u.user_id
      LEFT JOIN chatbot_messages m ON c.conversation_id = m.conversation_id
      GROUP BY c.conversation_id
      ORDER BY c.started_at DESC
      LIMIT 100
    `);
    res.json(conversations);
  } catch (error) {
    console.error('Get chatbot conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch chatbot conversations' });
  }
});

// Get messages for a specific chatbot conversation (admin)
router.get('/chatbot/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const [messages] = await db.promise().query(`
      SELECT message_id, message_text, response_text, language, sent_at
      FROM chatbot_messages
      WHERE conversation_id = ?
      ORDER BY sent_at ASC
    `, [conversationId]);
    res.json(messages);
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation messages' });
  }
});

// Delete a chatbot conversation (admin)
router.delete('/chatbot/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    await db.promise().query('DELETE FROM chatbot_messages WHERE conversation_id = ?', [conversationId]);
    await db.promise().query('DELETE FROM user_last_conversation WHERE conversation_id = ?', [conversationId]);
    await db.promise().query('DELETE FROM chatbot_conversations WHERE conversation_id = ?', [conversationId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Get chatbot statistics
router.get('/chatbot/stats', async (req, res) => {
  try {
    const [totalConversations] = await db.promise().query(
      'SELECT COUNT(*) as count FROM chatbot_conversations'
    );
    const [totalMessages] = await db.promise().query(
      'SELECT COUNT(*) as count FROM chatbot_messages'
    );
    const [avgMessagesPerConvo] = await db.promise().query(
      'SELECT AVG(msg_count) as avg FROM (SELECT COUNT(*) as msg_count FROM chatbot_messages GROUP BY conversation_id) as sub'
    );
    const [todayConversations] = await db.promise().query(
      'SELECT COUNT(*) as count FROM chatbot_conversations WHERE DATE(started_at) = CURDATE()'
    );

    const [languageDistribution] = await db.promise().query(
      `SELECT language, COUNT(*) as count FROM chatbot_messages WHERE language IS NOT NULL GROUP BY language ORDER BY count DESC LIMIT 10`
    );
    const [activeUsers] = await db.promise().query(
      `SELECT COUNT(DISTINCT user_id) as count FROM chatbot_conversations WHERE user_id IS NOT NULL`
    );
    const [weeklyTrend] = await db.promise().query(
      `SELECT DATE(started_at) as day, COUNT(*) as count
       FROM chatbot_conversations
       WHERE started_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(started_at)
       ORDER BY day ASC`
    );

    res.json({
      totalConversations: totalConversations[0].count,
      totalMessages: totalMessages[0].count,
      avgMessagesPerConvo: avgMessagesPerConvo[0].avg || 0,
      todayConversations: todayConversations[0].count,
      activeUsers: activeUsers[0].count,
      languageDistribution,
      weeklyTrend
    });
  } catch (error) {
    console.error('Get chatbot stats error:', error);
    res.status(500).json({ error: 'Failed to fetch chatbot statistics' });
  }
});

// Start chatbot retraining job
router.post('/chatbot/retrain', async (req, res) => {
  try {
    const { language = 'all' } = req.body || {};

    const hasRunningJob = Array.from(chatbotTrainingJobs.values()).some((job) => job.status === 'running');
    if (hasRunningJob) {
      return res.status(409).json({ error: 'A chatbot training job is already running' });
    }

    const job = startChatbotTraining(language);
    res.json({
      success: true,
      message: language === 'all'
        ? 'Chatbot retraining started for all languages'
        : `Chatbot retraining started for ${language.toUpperCase()}`,
      job,
    });
  } catch (error) {
    console.error('Start chatbot retraining error:', error);
    res.status(500).json({ error: 'Failed to start chatbot retraining' });
  }
});

// Get chatbot retraining job status
router.get('/chatbot/retrain/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = chatbotTrainingJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Training job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get chatbot retraining status error:', error);
    res.status(500).json({ error: 'Failed to fetch chatbot retraining status' });
  }
});

// Get all itineraries (admin)
router.get('/itineraries', async (req, res) => {
  try {
    const [itineraries] = await db.promise().query(`
      SELECT 
        i.*,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT ia.id) as item_count
      FROM itineraries i
      JOIN users u ON i.user_id = u.user_id
      LEFT JOIN itinerary_attractions ia ON i.itinerary_id = ia.itinerary_id
      WHERE i.archived = 0
      GROUP BY i.itinerary_id
      ORDER BY i.created_at DESC
    `);
    res.json(itineraries);
  } catch (error) {
    console.error('Get itineraries error:', error);
    res.status(500).json({ error: 'Failed to fetch itineraries' });
  }
});

// Get single itinerary details (admin)
router.get('/itineraries/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [itineraries] = await db.promise().query(`
      SELECT i.*, u.username, u.email, u.first_name, u.last_name
      FROM itineraries i
      JOIN users u ON i.user_id = u.user_id
      WHERE i.itinerary_id = ?
    `, [id]);
    
    if (itineraries.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    
    const itinerary = itineraries[0];
    
    const [items] = await db.promise().query(`
      SELECT ia.*, a.name as attraction_name, a.location as attraction_location
      FROM itinerary_attractions ia
      LEFT JOIN attractions a ON ia.attraction_id = a.id
      WHERE ia.itinerary_id = ?
      ORDER BY ia.order_sequence
    `, [id]);
    
    itinerary.items = items;
    res.json(itinerary);
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({ error: 'Failed to fetch itinerary' });
  }
});

// Delete itinerary (admin) - Changed to archive
router.delete('/itineraries/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.promise().query(
      'UPDATE itineraries SET archived = 1, archived_at = NOW() WHERE itinerary_id = ?',
      [id]
    );
    
    res.json({ success: true, message: 'Itinerary archived successfully' });
  } catch (error) {
    console.error('Archive itinerary error:', error);
    res.status(500).json({ error: 'Failed to archive itinerary' });
  }
});

// Restore archived booking
router.put('/bookings/:bookingId/restore', async (req, res) => {
  const { bookingId } = req.params;

  try {
    await db.promise().query(
      'UPDATE hotel_bookings SET archived = 0, archived_at = NULL WHERE booking_id = ?',
      [bookingId]
    );
    res.json({ success: true, message: 'Booking restored successfully' });
  } catch (error) {
    console.error('Restore booking error:', error);
    res.status(500).json({ error: 'Failed to restore booking' });
  }
});

// Restore archived hotel
router.put('/hotels/:hotelId/restore', async (req, res) => {
  const { hotelId } = req.params;

  try {
    await db.promise().query(
      'UPDATE hotels SET archived = 0, archived_at = NULL WHERE hotel_id = ?',
      [hotelId]
    );
    res.json({ success: true, message: 'Hotel restored successfully' });
  } catch (error) {
    console.error('Restore hotel error:', error);
    res.status(500).json({ error: 'Failed to restore hotel' });
  }
});

// Restore archived itinerary
router.put('/itineraries/:itineraryId/restore', async (req, res) => {
  const { itineraryId } = req.params;

  try {
    await db.promise().query(
      'UPDATE itineraries SET archived = 0, archived_at = NULL WHERE itinerary_id = ?',
      [itineraryId]
    );
    res.json({ success: true, message: 'Itinerary restored successfully' });
  } catch (error) {
    console.error('Restore itinerary error:', error);
    res.status(500).json({ error: 'Failed to restore itinerary' });
  }
});

// Restore archived attraction
router.put('/attractions/:attractionId/restore', async (req, res) => {
  const { attractionId } = req.params;

  try {
    await db.promise().query(
      'UPDATE attractions SET archived = 0, archived_at = NULL WHERE id = ?',
      [attractionId]
    );
    res.json({ success: true, message: 'Attraction restored successfully' });
  } catch (error) {
    console.error('Restore attraction error:', error);
    res.status(500).json({ error: 'Failed to restore attraction' });
  }
});

// Restore archived payment
router.put('/payments/:paymentId/restore', async (req, res) => {
  const { paymentId } = req.params;

  try {
    await db.promise().query(
      'UPDATE hotel_payments SET archived = 0, archived_at = NULL WHERE payment_id = ?',
      [paymentId]
    );
    res.json({ success: true, message: 'Payment restored successfully' });
  } catch (error) {
    console.error('Restore payment error:', error);
    res.status(500).json({ error: 'Failed to restore payment' });
  }
});

// Get visitor analytics - gender and user type statistics
router.get('/visitor-analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total unique visitors
    const [visitorCount] = await db.promise().query(`
      SELECT COUNT(DISTINCT user_id) as total_visitors,
             SUM(visit_count) as total_visits
      FROM users
      WHERE role = 'user'
    `);

    // Get gender distribution
    const [genderDistribution] = await db.promise().query(`
      SELECT 
        CASE 
          WHEN gender IS NULL OR gender = '' THEN 'Not Specified'
          ELSE CONCAT(UCASE(LEFT(gender, 1)), LCASE(SUBSTRING(gender, 2)))
        END as gender,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100 / (SELECT COUNT(*) FROM users WHERE role = 'user'), 2) as percentage
      FROM users
      WHERE role = 'user'
      GROUP BY gender
      ORDER BY count DESC
    `);

    // Get user type distribution (local, resident, foreigner)
    const [userTypeDistribution] = await db.promise().query(`
      SELECT 
        CASE 
          WHEN user_type IS NULL OR user_type = '' THEN 'Not Specified'
          ELSE CONCAT(UCASE(LEFT(user_type, 1)), LCASE(SUBSTRING(user_type, 2)))
        END as user_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100 / (SELECT COUNT(*) FROM users WHERE role = 'user'), 2) as percentage
      FROM users
      WHERE role = 'user'
      GROUP BY user_type
      ORDER BY count DESC
    `);

    // Get combined gender and user type breakdown
    const [combinedBreakdown] = await db.promise().query(`
      SELECT 
        CASE 
          WHEN gender IS NULL OR gender = '' THEN 'Not Specified'
          ELSE CONCAT(UCASE(LEFT(gender, 1)), LCASE(SUBSTRING(gender, 2)))
        END as gender,
        CASE 
          WHEN user_type IS NULL OR user_type = '' THEN 'Not Specified'
          ELSE CONCAT(UCASE(LEFT(user_type, 1)), LCASE(SUBSTRING(user_type, 2)))
        END as user_type,
        COUNT(*) as count
      FROM users
      WHERE role = 'user'
      GROUP BY gender, user_type
      ORDER BY count DESC
    `);

    // Get visitor trends over time (last 12 months)
    const [visitorTrends] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-01') as month,
        COUNT(*) as new_visitors,
        SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as female_count,
        SUM(CASE WHEN gender = 'other' THEN 1 ELSE 0 END) as other_count,
        SUM(CASE WHEN user_type = 'local' THEN 1 ELSE 0 END) as local_count,
        SUM(CASE WHEN user_type = 'resident' THEN 1 ELSE 0 END) as resident_count,
        SUM(CASE WHEN user_type = 'foreigner' THEN 1 ELSE 0 END) as foreigner_count
      FROM users
      WHERE role = 'user' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-01')
      ORDER BY month DESC
    `);

    // Get top regions/locations if available from phone numbers or other data
    const [visitsByRegion] = await db.promise().query(`
      SELECT user_type, COUNT(*) as count
      FROM users
      WHERE role = 'user'
      GROUP BY user_type
    `);

    res.json({
      totals: {
        total_visitors: visitorCount[0]?.total_visitors || 0,
        total_visits: visitorCount[0]?.total_visits || 0
      },
      gender_distribution: genderDistribution,
      user_type_distribution: userTypeDistribution,
      combined_breakdown: combinedBreakdown,
      visitor_trends: visitorTrends,
      visits_by_type: visitsByRegion
    });
  } catch (error) {
    console.error('Get visitor analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch visitor analytics', details: error.message });
  }
});

export default router;
