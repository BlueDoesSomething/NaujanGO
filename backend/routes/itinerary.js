import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createItinerary,
  createItineraryWeather,
  deleteItinerary,
  getItineraries,
  getItineraryById,
  getItineraryStatistics,
  getItineraryBudgetBreakdown,
  saveItineraryAssumptions,
  getItineraryTemplates,
  getItineraryWeather,
  getItineraryReviews,
  recalculateItineraryBudget,
  updateItinerary
} from '../controllers/itineraryController.js';

const router = express.Router();

// Public: itinerary templates (static inspiration content shown on the home page)
router.get('/templates/list', getItineraryTemplates);

// Apply authentication to all other itinerary routes
router.use(authenticateToken);

// Get user's itineraries
router.get('/', getItineraries);

// Save itinerary
router.post('/', createItinerary);

// Get single itinerary by ID
router.get('/:id', getItineraryById);

// Get itinerary statistics
router.get('/:id/statistics', getItineraryStatistics);

// Get per-day budget breakdown (optionally pass farePerDay, foodPerDay, otherPerDay as query params)
router.get('/:id/budget-breakdown', getItineraryBudgetBreakdown);

// Persist per-day budget assumptions onto itinerary (safely adds budget_assumptions JSON column if missing)
router.post('/:id/save-assumptions', saveItineraryAssumptions);

// Update itinerary
router.put('/:id', updateItinerary);

// Delete itinerary
router.delete('/:id', deleteItinerary);

// Get weather data
router.get('/weather/:attractionId', getItineraryWeather);

// Save weather data
router.post('/weather', createItineraryWeather);

// Get itinerary reviews
router.get('/:id/reviews', getItineraryReviews);

// Recalculate itinerary budget from items
router.post('/:id/recalculate-budget', recalculateItineraryBudget);

export default router;