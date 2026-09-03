import express from 'express';
import {
  createLanguage,
  getLanguagePreference,
  getLanguages,
  updateLanguagePreference
} from '../controllers/languagesController.js';

const router = express.Router();

// Get all supported languages
router.get('/', getLanguages);

// Add a new language (admin only)
router.post('/', createLanguage);

// Update user's preferred language
router.put('/preference/:userId', updateLanguagePreference);

// Get user's preferred language
router.get('/preference/:userId', getLanguagePreference);

export default router;