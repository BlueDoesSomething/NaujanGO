import express from 'express';
import { detectWildlife } from '../controllers/wildlifeController.js';

const router = express.Router();

// GET /wildlife/detect - Detect dangerous wildlife near coordinates
router.get('/detect', detectWildlife);

export default router;
