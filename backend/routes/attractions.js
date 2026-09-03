import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  createAttractionReview,
  getAttractionAverageRating,
  getAttractionReviews,
  getAttractions,
  getAttractionsMeta,
  getAttractionSuggestions,
  getMapMarkers,
  deleteAttraction,
  restoreAttraction
} from '../controllers/attractionsController.js';

const router = express.Router();

// GET /attractions/meta - filter metadata (municipalities)
router.get('/meta', getAttractionsMeta);

// GET /attractions/search/suggestions - autocomplete suggestions
router.get('/search/suggestions', getAttractionSuggestions);

// GET /attractions - fetch all attractions with avg_rating and municipality
router.get('/', getAttractions);

// GET /attractions/:id/reviews - fetch reviews for an attraction
router.get('/:id/reviews', getAttractionReviews);

// POST /attractions/:id/reviews - submit a review (requires authentication)
router.post('/:id/reviews', authenticateToken, createAttractionReview);

// GET /attractions/:id/average-rating - get average rating
router.get('/:id/average-rating', getAttractionAverageRating);

// GET /attractions/map/markers - unified endpoint for map markers (attractions + POI with optional category filter)
router.get('/map/markers', getMapMarkers);

// DELETE /attractions/:id - delete (archive) an attraction (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteAttraction);

// POST /attractions/:id/restore - restore an archived attraction (admin only)
router.post('/:id/restore', authenticateToken, requireAdmin, restoreAttraction);

export default router;
