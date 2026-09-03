import express from 'express';
import {
  createMapRoute,
  getMapRoutes,
  getUserMapRoutes
} from '../controllers/mapRoutesController.js';

const router = express.Router();

// POST /routes - save a new route
router.post('/', createMapRoute);

// GET /routes/user/:userId - fetch user's saved routes
router.get('/user/:userId', getUserMapRoutes);

// GET /routes - fetch all map routes (for admin or general map display)
router.get('/', getMapRoutes);

export default router;