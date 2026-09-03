import express from 'express';
import { 
  getRestaurants,
  getRestaurantById,
  getFeaturedRestaurants,
  getRestaurantsByCuisine,
  searchRestaurants
} from '../controllers/restaurantsController.js';

const router = express.Router();

// Main endpoints
router.get('/', getRestaurants);
router.get('/featured', getFeaturedRestaurants);
router.get('/search', searchRestaurants);
router.get('/cuisine/:cuisine', getRestaurantsByCuisine);
router.get('/:id', getRestaurantById);

export default router;
