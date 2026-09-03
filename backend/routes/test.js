import express from 'express';
import { testPois, testRoutes } from '../controllers/testController.js';

const router = express.Router();

// Test POIs endpoint
router.get('/pois', testPois);

// Test routes endpoint
router.get('/routes', testRoutes);

export default router;