import { createPayAtPropertyBooking } from '../services/payAtPropertyBookings.js';
import { getBookingPolicy, changeBookingPolicy, respondBookingPolicyError } from '../services/bookingPaymentPolicy.js';

export const bookingRoute = run => async (req, res) => {
  try {
    res.set('Cache-Control', 'private, no-store');
    if (req.method !== 'GET' && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return res.status(400).json({ error: 'Send a JSON object.' });
    res.json(await run(req));
  } catch (error) { respondBookingPolicyError(res, error); }
};
export const publicBookingPolicy = bookingRoute(() => getBookingPolicy());
export const saveBookingPolicy = bookingRoute(req => changeBookingPolicy(req.user, req.body));
export const routeBookingCreation = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ error: 'Send the booking fields as a JSON object.' });
    const manualDirect = ['gcash', 'maya'].includes(req.body.payment_method);
    if ((await getBookingPolicy()).online_payments_enabled && !manualDirect && req.body.payment_handling !== 'external') return next();
    if (req.body.payment_handling !== 'external') return res.status(409).json({ error: 'Reload the property and review the direct-to-owner payment terms before booking.', code: 'PAYMENT_MODE_CHANGED' });
    res.status(201).json(await createPayAtPropertyBooking(req.user, req.body));
  } catch (error) { respondBookingPolicyError(res, error); }
};
