import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createHotelReview,
  getCanReviewHotel,
  getHotelAvailability,
  getHotelAverageRating,
  getHotelById,
  getHotelReviews,
  getHotels,
  getHotelRooms,
  markHotelReviewHelpful
} from '../controllers/hotelsController.js';

const router = express.Router();

router.get('/', getHotels);
router.get('/:id', getHotelById);
router.get('/:id/availability', getHotelAvailability);
router.get('/:id/rooms', getHotelRooms);  // Public rooms endpoint
router.get('/:id/reviews', getHotelReviews);
router.get('/:id/can-review', getCanReviewHotel);
router.post('/:id/reviews', authenticateToken, createHotelReview);
router.get('/:id/average-rating', getHotelAverageRating);
router.put('/:id/reviews/:reviewId/helpful', markHotelReviewHelpful);

export default router;
