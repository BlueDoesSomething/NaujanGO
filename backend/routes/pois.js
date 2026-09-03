import express from 'express';
import { getPois } from '../controllers/poisController.js';

const router = express.Router();

// GET /pois - fetch all points of interest
router.get('/', getPois);

export default router;