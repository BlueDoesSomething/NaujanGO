import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { publicBookingPolicy, routeBookingCreation } from '../controllers/bookingPaymentPolicyController.js';
import { guestBookingMessages, postGuestBookingMessage, bookingMessageLimiter } from '../controllers/bookingMessagesController.js';
import {
  cancelHotelBooking,
  createHotelBooking,
  getHotelBookingReceipt,
  getHotelBookings,
  modifyHotelBooking
} from '../controllers/bookingsController.js';

const router = express.Router();

router.get('/policy', publicBookingPolicy);
router.post('/hotels', authenticateToken, routeBookingCreation, createHotelBooking);
router.get('/hotels', getHotelBookings);
router.get('/hotels/:bookingId/messages', authenticateToken, guestBookingMessages);
router.post('/hotels/:bookingId/messages', authenticateToken, bookingMessageLimiter, postGuestBookingMessage);
router.patch('/hotels/:bookingId/cancel', cancelHotelBooking);
router.patch('/hotels/:bookingId/modify', modifyHotelBooking);
router.get('/hotels/:bookingId/receipt', getHotelBookingReceipt);

export default router;
