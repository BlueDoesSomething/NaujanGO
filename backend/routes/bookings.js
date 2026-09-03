import express from 'express';
import {
  cancelHotelBooking,
  createHotelBooking,
  getHotelBookingReceipt,
  getHotelBookings
} from '../controllers/bookingsController.js';

const router = express.Router();

router.post('/hotels', createHotelBooking);
router.get('/hotels', getHotelBookings);
router.patch('/hotels/:bookingId/cancel', cancelHotelBooking);
router.get('/hotels/:bookingId/receipt', getHotelBookingReceipt);

export default router;
