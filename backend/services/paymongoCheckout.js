import crypto from 'node:crypto';
import axios from 'axios';
import db from '../db.js';
import { FRONTEND_URL } from '../config/publicUrls.js';
import { balanceOf, dueNow, MIN_GATEWAY_AMOUNT, statusAfterPayment } from '../utils/paymentAmounts.js';
import { readJson, serializeStay } from '../utils/stayOptions.js';

const errorFor = (message, status = 409, code = 'PAYMENT_VERIFICATION_REQUIRED') => Object.assign(new Error(message), { status, code });
const money = value => Math.round(Number(value) * 100);
const metaFor = payment => readJson(payment.provider_response) || {};
const validId = value => {
  const id = Number(value);
  if (!['number', 'string'].includes(typeof value) || !Number.isSafeInteger(id) || id < 1) throw errorFor('Invalid booking ID.', 400);
  return id;
};
export const isPaymongoSession = payment => /^cs_[a-z0-9]+$/i.test(payment.transaction_reference || '')
  && ['qrph', 'paymongo'].includes(payment.provider);
const accountKey = payment => {
  const key = Number(metaFor(payment).paymongo_account || 1) === 2 ? process.env.PAYMONGO_SECRET_KEY_2 : process.env.PAYMONGO_SECRET_KEY;
  if (!/^sk_(test|live)_/.test(key || '')) throw errorFor('Payment verification is unavailable. Please try checking again later.', 503, 'GATEWAY_UNAVAILABLE');
  return key;
};
const headersFor = key => ({ Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`, 'Content-Type': 'application/json' });
const safeCheckoutUrl = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'checkout.paymongo.com' && !url.username && !url.password ? value : null; }
  catch { return null; }
};

export const inspectPaymongoSession = (session, payment, key) => {
  if (!session || session.id !== payment.transaction_reference || !session.attributes) throw errorFor('Payment session could not be verified.', 503);
  const attrs = session.attributes;
  if (typeof attrs.livemode !== 'boolean' || attrs.livemode !== key.startsWith('sk_live_')) throw errorFor('Payment environment does not match this checkout.', 409);
  if (attrs.metadata?.booking_id != null && Number(attrs.metadata.booking_id) !== Number(payment.booking_id)) throw errorFor('Payment booking does not match.', 409);
  const paid = [...(attrs.payments || []), ...(attrs.payment_intent?.attributes?.payments || [])]
    .filter(item => item?.attributes?.status === 'paid');
  if (paid.length) {
    const unique = [...new Map(paid.map(item => [item.id, item])).values()];
    if (unique.length !== 1 || !unique[0].id || unique[0].attributes.amount !== money(payment.amount)
        || unique[0].attributes.currency !== payment.currency || unique[0].attributes.disputed
        || unique[0].attributes.refunds?.length) throw errorFor('Payment amount, currency or refund history needs reconciliation.', 409);
    return { state: 'succeeded', payment_id: unique[0].id, checkout_url: null };
  }
  // A redirect, chargeable source, succeeded-looking URL, or active session is
  // not evidence that money arrived. Expiry is an actual provider state only.
  if (['expired', 'cancelled', 'canceled'].includes(attrs.status)) return { state: 'cancelled', checkout_url: null };
  if (attrs.status !== 'active') throw errorFor('PayMongo has not returned a conclusive payment status.', 503);
  return { state: 'pending', checkout_url: safeCheckoutUrl(attrs.checkout_url) };
};

const loadBooking = async (connection, userId, id) => {
  const [rows] = await connection.execute(
    `SELECT *, (expires_at IS NOT NULL AND expires_at <= NOW()) AS reservation_expired
     FROM hotel_bookings WHERE booking_id = ? AND user_id = ? FOR UPDATE`, [id, userId]);
  if (!rows.length) throw errorFor('Booking not found.', 404, 'BOOKING_NOT_FOUND');
  return rows[0];
};
const paymentRows = async (connection, id) => (await connection.execute(
  'SELECT * FROM hotel_payments WHERE booking_id = ? ORDER BY payment_id DESC FOR UPDATE', [id]))[0];
const paidTotal = payments => payments.filter(item => item.status === 'succeeded').reduce((sum, item) => sum + Number(item.amount), 0);
const needsReconciliation = (booking, payments) => (booking.payment_status === 'paid'
    && paidTotal(payments) + 0.01 < Number(booking.total_amount))
  || payments.some(payment => payment.status === 'succeeded' && /^src_/.test(payment.transaction_reference || '')
    && ['gcash', 'grabpay'].includes(payment.provider) && payment.reference_status !== 'verified' && !payment.verified_by);
const payable = (booking, paid) => ['pending', 'confirmed'].includes(booking.status) && Number(booking.archived) !== 1
  && booking.payment_status !== 'refunded' && !(Number(booking.reservation_expired) === 1 && paid <= 0);

const refreshSession = async (connection, booking, payment) => {
  const key = accountKey(payment);
  let response;
  try { response = await axios.get(`https://api.paymongo.com/v1/checkout_sessions/${payment.transaction_reference}`, { headers: headersFor(key), timeout: 8000 }); }
  catch { throw errorFor('Unable to verify the earlier payment. Do not pay again if money was deducted; check again when your connection returns.', 503, 'GATEWAY_UNAVAILABLE'); }
  const result = inspectPaymongoSession(response.data?.data, payment, key);
  if (payment.status === 'succeeded' && result.state !== 'succeeded') throw errorFor('This payment record needs reconciliation with PayMongo before another payment is allowed.', 409, 'PAYMENT_RECONCILIATION_REQUIRED');
  if (payment.status === 'refunded') return result;
  const meta = { ...metaFor(payment), checkout_url: result.checkout_url || metaFor(payment).checkout_url,
    gateway_verified_at: new Date().toISOString(), gateway_status: result.state,
    gateway_payment_id: result.payment_id || null,
    late_payment: Boolean(metaFor(payment).late_payment || (result.state === 'succeeded'
      && (Number(booking.reservation_expired) === 1 || !['pending', 'confirmed'].includes(booking.status)))) };
  if (result.state === 'succeeded') {
    await connection.execute(
      `UPDATE hotel_payments SET status = 'succeeded', paid_at = COALESCE(paid_at, NOW()),
       provider_response = ?, updated_at = NOW() WHERE payment_id = ? AND status <> 'refunded'`,
      [JSON.stringify(meta), payment.payment_id]);
    payment.status = 'succeeded';
  } else if (result.state === 'cancelled') {
    await connection.execute(
      `UPDATE hotel_payments SET status = 'cancelled', provider_response = ?, updated_at = NOW()
       WHERE payment_id = ? AND status NOT IN ('succeeded', 'refunded')`, [JSON.stringify(meta), payment.payment_id]);
    payment.status = 'cancelled';
  }
  payment.provider_response = meta;
  return result;
};

const syncPaidBooking = async (connection, booking, payments) => {
  const paid = paidTotal(payments);
  if (paid <= 0 || booking.payment_status === 'refunded') return;
  const paymentStatus = statusAfterPayment(booking.total_amount, paid, booking.payment_status);
  // Record actual money even if late, but never resurrect a cancelled/expired
  // reservation or promise a room whose hold has ended.
  const canConfirm = payable(booking, paid) && Number(booking.reservation_expired) !== 1
    && (booking.status === 'confirmed' || !payments.some(payment => metaFor(payment).late_payment));
  await connection.execute(
    `UPDATE hotel_bookings SET payment_status = ?, status = ?,
     expires_at = CASE WHEN ? = 1 THEN NULL ELSE expires_at END, updated_at = NOW() WHERE booking_id = ?`,
    [paymentStatus, canConfirm ? 'confirmed' : booking.status, canConfirm ? 1 : 0, booking.booking_id]);
  booking.payment_status = paymentStatus;
  if (canConfirm) { booking.status = 'confirmed'; booking.expires_at = null; }
};

const amountDue = (booking, hotel, payments) => {
  const paid = paidTotal(payments);
  if (paid > 0) return balanceOf(booking.total_amount, paid, booking.payment_status);
  return dueNow(booking.payment_option || 'full', booking.total_amount, readJson(booking.policy_snapshot)?.reservation_fee ?? hotel.reservation_fee);
};
const statusResult = (booking, payments, unavailable = false, review = false) => {
  if (readJson(booking.policy_snapshot)?.payment_handling === 'external') return { booking: serializeStay(booking), payment: null, state: 'external', can_retry: false, needs_staff_review: false, verification_unavailable: false };
  const payment = payments[0] || null;
  const paid = paidTotal(payments);
  const allowed = payable(booking, paid);
  const late = booking.status !== 'confirmed' && payments.some(item => metaFor(item).late_payment);
  const manualReview = payments.some(item => item.status !== 'succeeded' && item.customer_reference_number && item.reference_status === 'pending');
  const state = review || manualReview ? 'review' : unavailable ? 'checking' : payment?.status === 'succeeded' ? 'succeeded'
    : ['failed', 'cancelled'].includes(payment?.status) ? 'not_completed' : payment ? 'pending' : 'not_started';
  return { booking: { ...serializeStay(booking), amount_paid: paid, balance_due: balanceOf(booking.total_amount, paid, booking.payment_status) },
    payment: payment ? { payment_id: payment.payment_id, status: payment.status, method: payment.method, provider: payment.provider } : null,
    state, can_retry: allowed && !unavailable && !review && !late && !manualReview && booking.payment_status !== 'paid',
    needs_staff_review: review || manualReview || late || (!allowed && paid > 0), verification_unavailable: unavailable };
};

export const getBookingPaymentStatus = async (userId, value) => {
  const id = validId(value);
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const booking = await loadBooking(connection, userId, id);
    const payments = await paymentRows(connection, id);
    let unavailable = false, review = needsReconciliation(booking, payments);
    for (const payment of payments.filter(isPaymongoSession)) {
      if (payment.status === 'refunded') continue;
      try { await refreshSession(connection, booking, payment); }
      catch (error) { if (error.status === 503) unavailable = true; else if (error.status === 409) review = true; else throw error; }
    }
    if (!unavailable && !review) await syncPaidBooking(connection, booking, payments);
    await connection.commit();
    return statusResult(booking, payments, unavailable, review);
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};

export const startOrResumeQrCheckout = async (userId, input) => {
  const id = validId(input.booking_id);
  const connection = await db.promise().getConnection();
  let attempt, body, key, booking, requestKey;
  try {
    await connection.beginTransaction();
    booking = await loadBooking(connection, userId, id);
    if (readJson(booking.policy_snapshot)?.payment_handling === 'external') throw errorFor('This reservation is pay-at-property. NaujanGO does not collect its payment.', 409, 'EXTERNAL_PAYMENT_BOOKING');
    const [hotels] = await connection.execute('SELECT reservation_fee, allowed_payment_methods FROM hotels WHERE hotel_id = ?', [booking.hotel_id]);
    if (!hotels.length) throw errorFor('Hotel not found.', 404);
    const payments = await paymentRows(connection, id);
    if (needsReconciliation(booking, payments)) throw errorFor('Payment history needs reconciliation before another online payment.', 409, 'PAYMENT_RECONCILIATION_REQUIRED');
    const sessions = [];
    for (const payment of payments.filter(isPaymongoSession)) {
      if (payment.status === 'refunded') continue;
      const result = await refreshSession(connection, booking, payment);
      sessions.push({ payment, result });
    }
    await syncPaidBooking(connection, booking, payments);
    if (booking.status !== 'confirmed' && payments.some(item => metaFor(item).late_payment)) throw errorFor('A late payment needs hotel confirmation. Do not pay again.', 409);
    if (payments.some(item => item.status !== 'succeeded' && item.customer_reference_number && item.reference_status === 'pending')) throw errorFor('Your submitted payment reference is awaiting hotel review. Do not pay again while it is being checked.');
    if (!payable(booking, paidTotal(payments))) throw errorFor('This reservation is cancelled, expired or no longer payable. Contact the hotel before paying.', 409, 'BOOKING_NOT_PAYABLE');
    if (booking.payment_status === 'paid') { await connection.commit(); return { ...statusResult(booking, payments), status: 'succeeded', success: true, checkout_url: null }; }
    const methods = readJson(hotels[0].allowed_payment_methods) || String(hotels[0].allowed_payment_methods || 'qrph').split(',').map(item => item.trim());
    if (!Array.isArray(methods) || !methods.includes('qrph')) throw errorFor('QR PH is not enabled for this hotel.', 400);
    const amount = amountDue(booking, hotels[0], payments);
    if (!Number.isFinite(amount) || amount < MIN_GATEWAY_AMOUNT) throw errorFor('This amount cannot be paid through online checkout.', 400);
    if (input.amount != null && (!Number.isFinite(Number(input.amount)) || money(input.amount) !== money(amount))) throw errorFor('The amount due changed. Reload your booking before paying.', 409);
    if (input.currency && input.currency !== booking.currency) throw errorFor('The payment currency does not match this booking.', 400);
    const active = sessions.filter(item => item.result.state === 'pending');
    if (active.length > 1) throw errorFor('More than one earlier checkout needs verification. Contact the hotel before paying again.');
    if (active.length) {
      const { payment, result } = active[0];
      if (money(payment.amount) !== money(amount) || payment.currency !== booking.currency || !result.checkout_url) throw errorFor('The earlier checkout needs reconciliation before a new payment can be started.');
      await connection.commit();
      return { payment_id: payment.payment_id, status: 'pending', success: false, checkout_url: result.checkout_url, resumed: true, provider: 'qrph' };
    }
    // Do not start a second provider flow while a previous real payment or a
    // submitted manual reference may still settle.
    const unresolved = payments.find(payment => ['pending', 'processing'].includes(payment.status)
      && !isPaymongoSession(payment) && !['pending', 'manual'].includes(payment.provider)
      && !metaFor(payment).request_key);
    if (unresolved) throw errorFor('An earlier payment is awaiting verification. Check its status before starting another checkout.');
    attempt = payments.find(payment => metaFor(payment).request_key && !isPaymongoSession(payment)
      && ['pending', 'processing'].includes(payment.status));
    const existing = attempt && metaFor(attempt);
    if (existing) {
      if (!Number.isFinite(Date.parse(existing.request_created_at)) || Date.now() - Date.parse(existing.request_created_at) >= 23 * 3600000
          || money(attempt.amount) !== money(amount)) throw errorFor('The interrupted checkout needs staff reconciliation before another attempt.');
      if (existing.checkout_state === 'creating' && Date.now() - Date.parse(existing.last_request_at) < 30000) throw errorFor('Checkout is still being prepared. Check again in a moment.', 409, 'CHECKOUT_IN_PROGRESS');
      body = existing.creation_body; requestKey = existing.request_key;
      if (!body) throw errorFor('The interrupted checkout needs staff reconciliation.');
    } else {
      requestKey = crypto.randomUUID();
      const [insert] = await connection.execute(
        `INSERT INTO hotel_payments (booking_id, amount, currency, method, provider, status, transaction_reference, provider_response, paid_at)
         VALUES (?, ?, ?, 'qrph', 'qrph', 'processing', ?, ?, NULL)`,
        [id, amount, booking.currency, `QR-${requestKey}`, JSON.stringify({ request_key: requestKey })]);
      attempt = { payment_id: insert.insertId, booking_id: id, amount, currency: booking.currency, provider_response: {} };
      const returnUrl = new URL('/payment-success', FRONTEND_URL);
      returnUrl.search = new URLSearchParams({ booking_id: String(id), payment_id: String(attempt.payment_id), provider: 'qrph' }).toString();
      const cancelUrl = new URL(returnUrl); cancelUrl.searchParams.set('status', 'cancelled');
      body = { data: { attributes: {
        line_items: [{ name: `Hotel booking #${id}`, amount: money(amount), currency: booking.currency, quantity: 1 }],
        payment_method_types: ['qrph'], success_url: returnUrl.toString(), cancel_url: cancelUrl.toString(),
        reference_number: `BOOK-${id}-${attempt.payment_id}`,
        metadata: { booking_id: String(id), payment_id: String(attempt.payment_id) }
      } } };
    }
    const meta = { ...metaFor(attempt), request_key: requestKey, request_created_at: existing?.request_created_at || new Date().toISOString(),
      last_request_at: new Date().toISOString(), checkout_state: 'creating', creation_body: body, paymongo_account: 1 };
    key = accountKey(attempt);
    await connection.execute('UPDATE hotel_payments SET provider_response = ?, updated_at = NOW() WHERE payment_id = ?', [JSON.stringify(meta), attempt.payment_id]);
    attempt.provider_response = meta;
    await connection.execute(
      `UPDATE hotel_bookings SET payment_status = 'pending', payment_method = 'qrph', updated_at = NOW()
       WHERE booking_id = ? AND payment_status IN ('unpaid', 'failed')`, [id]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }

  // Persist the attempt BEFORE contacting PayMongo. Lost browser responses or
  // gateway timeouts reuse the same key/body, never create a blind second charge.
  try {
    const response = await axios.post('https://api.paymongo.com/v2/checkout_sessions', body,
      { headers: { ...headersFor(key), 'Idempotency-Key': requestKey }, timeout: 12000 });
    const session = response.data?.data;
    const checkoutUrl = safeCheckoutUrl(session?.attributes?.checkout_url);
    if (!/^cs_[a-z0-9]+$/i.test(session?.id || '') || !checkoutUrl) throw errorFor('PayMongo returned an incomplete checkout. Check status before trying again.', 503);
    await db.promise().execute(
      `UPDATE hotel_payments SET transaction_reference = ?, provider_response = ?,
       status = CASE WHEN status = 'succeeded' THEN status ELSE 'pending' END, updated_at = NOW() WHERE payment_id = ?`,
      [session.id, JSON.stringify({ ...attempt.provider_response, id: session.id, checkout_url: checkoutUrl, checkout_state: 'ready' }), attempt.payment_id]);
    return { payment_id: attempt.payment_id, status: 'pending', success: false, checkout_url: checkoutUrl, resumed: Boolean(metaFor(attempt).id), provider: 'qrph' };
  } catch (error) {
    const rejected = [400, 401, 403, 422].includes(error.response?.status);
    await db.promise().execute(
      `UPDATE hotel_payments SET status = ?, provider_response = ?, updated_at = NOW() WHERE payment_id = ? AND status <> 'succeeded'`,
      [rejected ? 'failed' : 'processing', JSON.stringify({ ...attempt.provider_response, checkout_state: rejected ? 'rejected' : 'unknown' }), attempt.payment_id]);
    throw errorFor(rejected ? 'PayMongo could not start checkout. Please try again later.' : 'Checkout could not be confirmed yet. You can resume it from Booking History; do not pay again if money was deducted.', 503, 'GATEWAY_UNAVAILABLE');
  }
};

export const capturePaymentWebhookBody = (req, res, buffer) => {
  if (/^\/api\/payments\/webhook\/paymongo(?:-2)?(?:\?|$)/.test(req.originalUrl || '')) req.rawBody = Buffer.from(buffer);
};

export const assertNoUnverifiedQrCheckout = async (userId, bookingId) => {
  const id = validId(bookingId);
  const [rows] = await db.promise().execute(
    `SELECT p.payment_id FROM hotel_payments p JOIN hotel_bookings b ON b.booking_id = p.booking_id
     WHERE b.booking_id = ? AND b.user_id = ? AND p.provider = 'qrph'
       AND p.status IN ('pending', 'processing') LIMIT 1`, [id, userId]);
  if (rows.length) throw errorFor('An earlier QR PH checkout is awaiting verification. Resume or check that payment before switching methods.');
};

export const verifyPaymongoSignature = (raw, header, secret, live, now = Date.now()) => {
  if (!secret || !Buffer.isBuffer(raw) || typeof header !== 'string') return false;
  const parts = Object.fromEntries(header.split(',').map(part => part.trim().split('=')));
  if (!/^\d+$/.test(parts.t || '') || Math.abs(now / 1000 - Number(parts.t)) > 300) return false;
  const received = parts[live ? 'li' : 'te'];
  if (!/^[a-f0-9]{64}$/i.test(received || '')) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.`).update(raw).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(received, 'hex'));
};

export const handlePaymongoWebhook = async (raw, signature, account = 1) => {
  const secret = account === 2 ? process.env.PAYMONGO_WEBHOOK_SECRET_2 : process.env.PAYMONGO_WEBHOOK_SECRET;
  const key = account === 2 ? process.env.PAYMONGO_SECRET_KEY_2 : process.env.PAYMONGO_SECRET_KEY;
  if (!secret || !/^sk_(test|live)_/.test(key || '')) throw errorFor('PayMongo webhook verification is not configured.', 503);
  if (!verifyPaymongoSignature(raw, signature, secret, key.startsWith('sk_live_'))) throw errorFor('Invalid webhook signature.', 400);
  const payload = JSON.parse(raw.toString('utf8'));
  const attrs = payload.data?.attributes;
  if (!['checkout_session.payment.paid', 'checkout_session.payment.failed'].includes(attrs?.type)) return { received: true, ignored: true };
  if (attrs.livemode !== key.startsWith('sk_live_')) throw errorFor('Webhook environment mismatch.', 400);
  const sessionId = attrs.data?.id;
  if (!/^cs_[a-z0-9]+$/i.test(sessionId || '')) throw errorFor('Invalid checkout session.', 400);
  const [rows] = await db.promise().execute(
    `SELECT p.*, b.user_id FROM hotel_payments p JOIN hotel_bookings b ON b.booking_id = p.booking_id
     WHERE p.transaction_reference = ? LIMIT 1`, [sessionId]);
  if (!rows.length) throw errorFor('The checkout record is not ready. Retry this event.', 503);
  if (Number(metaFor(rows[0]).paymongo_account || 1) !== account) throw errorFor('Webhook account does not match the checkout.', 400);
  // Always retrieve the current session: late/duplicate failure events cannot
  // overwrite a payment that is now paid. Updates are serialized by booking.
  const result = await getBookingPaymentStatus(rows[0].user_id, rows[0].booking_id);
  if (result.verification_unavailable || result.state === 'review') throw errorFor('Payment verification is not complete. Retry this event.', 503);
  return { received: true };
};
