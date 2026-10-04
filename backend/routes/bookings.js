import express from 'express';
import {
  cancelHotelBooking,
  createHotelBooking,
  getHotelBookingReceipt,
  getHotelBookings,
  modifyHotelBooking
} from '../controllers/bookingsController.js';

const router = express.Router();

router.post('/hotels', createHotelBooking);
router.get('/hotels', getHotelBookings);
router.patch('/hotels/:bookingId/cancel', cancelHotelBooking);
router.patch('/hotels/:bookingId/modify', modifyHotelBooking);
router.get('/hotels/:bookingId/receipt', getHotelBookingReceipt);

export default router;
