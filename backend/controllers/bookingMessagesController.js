import { bookingRoute } from './bookingPaymentPolicyController.js';
import { getBookingMessages, sendBookingMessage } from '../services/bookingMessages.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

export const bookingMessageLimiter = createRateLimiter({ name: 'booking-message-send', windowMs: 60000, maxRequests: 30, message: 'Please wait before sending more booking messages.', keyGenerator: req => `${req.user.user_id}:${Number(req.params.bookingId)}` });
export const guestBookingMessages = bookingRoute(req => getBookingMessages(req.user, req.params.bookingId, req.query));
export const postGuestBookingMessage = bookingRoute(req => sendBookingMessage(req.user, req.params.bookingId, req.body));
export const ownerBookingMessages = bookingRoute(req => getBookingMessages(req.user, req.params.bookingId, req.query, true));
export const postOwnerBookingMessage = bookingRoute(req => sendBookingMessage(req.user, req.params.bookingId, req.body, true));
