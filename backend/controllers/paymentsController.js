import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';
import * as paymentProviders from '../services/paymentProviders.js';
import nodemailer from 'nodemailer';
import { authenticateToken, requireAdmin, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();
import { JWT_SECRET } from '../config/security.js';
import { FRONTEND_URL, WEBHOOK_BASE_URL } from '../config/publicUrls.js';
// Treat 'sandbox' as real payments mode (uses provider test keys) so sandbox can exercise real provider flows
const USE_REAL_PAYMENTS = process.env.PAYMENT_MODE === 'live' || process.env.PAYMENT_MODE === 'sandbox' || process.env.USE_REAL_PAYMENTS === 'true';

// 🟢 SMART FRONTEND ORIGIN DETECTION
// Intelligently detects the frontend origin from multiple sources
const detectFrontendOrigin = (req) => {
  const { frontend_origin, origin_override } = req.query;
  
  // Priority 1: Explicit query parameter
  if (frontend_origin && typeof frontend_origin === 'string' && frontend_origin.length > 0) {
    try {
      new URL(frontend_origin); // Validate it's a valid URL
      return frontend_origin;
    } catch (e) {
      // Invalid URL, try next option
    }
  }
  
  // Priority 2: Referer header (URL that initiated the payment redirect)
  if (req.headers.referer) {
    try {
      const refererUrl = new URL(req.headers.referer);
      const origin = `${refererUrl.protocol}//${refererUrl.host}`;
      console.log(`🔍 Detected frontend origin from Referer header: ${origin}`);
      return origin;
    } catch (e) {
      // Invalid referer, continue
    }
  }
  
  // Priority 3: Origin header (CORS origin)
  if (req.headers.origin) {
    try {
      new URL(req.headers.origin); // Validate it's a valid URL
      console.log(`🔍 Detected frontend origin from Origin header: ${req.headers.origin}`);
      return req.headers.origin;
    } catch (e) {
      // Invalid origin, continue
    }
  }
  
  // Priority 4: Environment FRONTEND_URL
  console.log(`🔍 Using default FRONTEND_URL: ${FRONTEND_URL}`);
  return FRONTEND_URL;
};

const buildRedirectUrl = (path, params = {}, baseUrl) => {
  const resolved = baseUrl || FRONTEND_URL;
  const base = resolved.endsWith('/') ? resolved : `${resolved}/`;
  const url = new URL(path.replace(/^\//, ''), base);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => url.searchParams.append(key, String(entry)));
      return;
    }
    url.searchParams.append(key, String(value));
  });
  return url.toString();
};

const getUserIdFromToken = (req) => {
  // Check for token in HttpOnly cookie FIRST (more secure)
  let token = req.cookies?.auth_token;
  
  // Fall back to Authorization header for backwards compatibility
  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.user_id;
  } catch (err) {
    return null;
  }
};

const generateTransactionReference = () => {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

// Generate a short-lived signed lookup token for frontend to fetch payment without user auth
const generateLookupToken = (bookingId, expiresInSeconds = 900) => {
  try {
    const payload = { booking_id: bookingId };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.error('Failed to generate lookup token:', err);
    return null;
  }
};

const insertPaymentRecord = async ({
  bookingId,
  amount,
  currency,
  method,
  provider,
  status,
  transactionReference,
  cardLast4,
  providerResponse
}) => {
  try {
    const [result] = await db.promise().query(
      `INSERT INTO hotel_payments
        (booking_id, amount, currency, method, provider, status, transaction_reference, card_last4, provider_response, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        bookingId,
        amount,
        currency,
        method,
        provider,
        status,
        transactionReference,
        cardLast4 || null,
        providerResponse
      ]
    );
    return result;
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR' && String(err.message).includes('provider_response')) {
      const [result] = await db.promise().query(
        `INSERT INTO hotel_payments
          (booking_id, amount, currency, method, provider, status, transaction_reference, card_last4, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          bookingId,
          amount,
          currency,
          method,
          provider,
          status,
          transactionReference,
          cardLast4 || null
        ]
      );
      return result;
    }
    throw err;
  }
};

const parseProviderResponse = (payment) => {
  if (!payment || !payment.provider_response || typeof payment.provider_response !== 'string') {
    return payment;
  }

  try {
    return {
      ...payment,
      provider_response: JSON.parse(payment.provider_response)
    };
  } catch (error) {
    return payment;
  }
};

const isValidReferenceNumber = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  if (normalized.length < 6 || normalized.length > 64) return false;
  return /^[a-zA-Z0-9_-]+$/.test(normalized);
};

const isExternalCheckoutMethod = (method) => {
  return ['paypal', 'gcash', 'grabpay', 'qrph', 'card'].includes(method);
};

const DEFAULT_PAYMENT_METHODS = ['card', 'gcash', 'grabpay', 'qrph', 'paypal', 'bank_transfer', 'pay_at_property'];

const parseAllowedPaymentMethods = (value) => {
  if (!value) return DEFAULT_PAYMENT_METHODS;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return DEFAULT_PAYMENT_METHODS;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch (error) {
        // Fall back to CSV
      }
    }
    const csv = trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    return csv.length ? csv : DEFAULT_PAYMENT_METHODS;
  }
  return DEFAULT_PAYMENT_METHODS;
};

const getAllowedMethodsForHotel = async (hotelId) => {
  if (!hotelId) return DEFAULT_PAYMENT_METHODS;
  try {
    const [rows] = await db.promise().query(
      'SELECT allowed_payment_methods FROM hotels WHERE hotel_id = ? LIMIT 1',
      [hotelId]
    );
    if (!rows.length) return DEFAULT_PAYMENT_METHODS;
    return parseAllowedPaymentMethods(rows[0].allowed_payment_methods);
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return DEFAULT_PAYMENT_METHODS;
    }
    throw error;
  }
};

// Simulate payment processing for different payment methods
const processPayment = async (paymentData) => {
  const { method, amount, currency, cardLast4, email, phone, customerName, bookingId, useCheckout, frontendOrigin } = paymentData;
  
  // Use real payment providers if configured
  if (USE_REAL_PAYMENTS) {
    return await processRealPayment(paymentData);
  }
  
  // Simulate processing time for testing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const transactionRef = generateTransactionReference();
  const timestamp = new Date().toISOString();
  
  // Simulate different payment providers
  let provider = 'simulated';
  let status = 'succeeded';
  let providerResponse = {};
  let checkoutUrl = null;
  
  switch(method) {
    case 'card':
      provider = 'stripe_simulated';
      providerResponse = {
        card_brand: 'visa',
        card_last4: cardLast4,
        payment_intent: `pi_${crypto.randomBytes(12).toString('hex')}`,
        charge_id: `ch_${crypto.randomBytes(12).toString('hex')}`
      };
      if (useCheckout) {
        checkoutUrl = buildRedirectUrl('/bookings', { payment: 'success', provider: 'card' }, frontendOrigin);
      }
      break;
      
    case 'gcash':
      // Even in simulated mode, use real Xendit sandbox for GCash so user sees actual flow
      return await processRealPayment(paymentData);
      
    case 'paypal':
      provider = 'paypal';
      providerResponse = {
        paypal_transaction_id: crypto.randomBytes(16).toString('hex').toUpperCase(),
        payer_email: email,
        payment_status: 'COMPLETED'
      };
      if (useCheckout) {
        checkoutUrl = buildRedirectUrl('/bookings', { payment: 'success', provider: 'paypal' }, frontendOrigin);
      }
      break;
      
    case 'bank_transfer':
      provider = 'bank_transfer';
      providerResponse = {
        bank_reference: `BT${Date.now()}`,
        account_number: '**** **** 1234',
        clearing_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      };
      break;
      
    case 'pay_at_property':
      provider = 'manual';
      status = 'pending';
      providerResponse = {
        payment_instructions: 'Please pay at the hotel reception upon arrival'
      };
      break;
      
    default:
      provider = 'unknown';
      status = 'failed';
      providerResponse = {
        error: 'Unsupported payment method'
      };
  }
  
  return {
    status,
    provider,
    transaction_reference: transactionRef,
    provider_response: providerResponse,
    checkout_url: checkoutUrl,
    processed_at: timestamp,
    amount,
    currency
  };
};

// Process real payment using actual payment providers
const processRealPayment = async (paymentData) => {
  const { method, amount, currency, cardLast4, email, phone, customerName, bookingId, useCheckout, frontendOrigin } = paymentData;
  
  let result;
  const description = `Hotel Booking Payment - Booking #${bookingId}`;
  const originParam = frontendOrigin ? `?frontend_origin=${encodeURIComponent(frontendOrigin)}` : '';
  const returnUrl = `${WEBHOOK_BASE_URL}/payments/success${originParam}`;
  const cancelUrl = `${WEBHOOK_BASE_URL}/payments/cancel${originParam}`;
  
  try {
    switch(method) {
      case 'card':
        if (useCheckout) {
          result = await paymentProviders.processStripeCheckout({
            amount,
            currency,
            customerEmail: email,
            description,
            returnUrl,
            cancelUrl
          });
        } else {
          // Use Stripe for card payments (direct)
          result = await paymentProviders.processStripePayment({
            amount,
            currency,
            customerEmail: email,
            customerName,
            description,
            metadata: { booking_id: bookingId, card_last4: cardLast4 }
          });
        }
        break;
        
      case 'gcash':
        // Use PayMongo for GCash (same endpoint as GrabPay & QRPH, different type)
        console.log('📤 Sending GCash payment to PayMongo with data:', {
          amount,
          currency,
          customerEmail: email,
          customerName,
          description,
          bookingId
        });
        result = await paymentProviders.processGCashPayment({
          amount,
          currency,
          customerEmail: email,
          customerName,
          description
        });
        console.log('📥 GCash response from PayMongo:', JSON.stringify(result, null, 2));
        if (!result.checkout_url) {
          console.error('❌ ERROR: PayMongo returned no checkout_url!', {
            success: result.success,
            status: result.status,
            error: result.error,
            provider: result.provider
          });
        }
        break;

      case 'paypal':
        // Use PayPal
        result = await paymentProviders.processPayPalPayment({
          amount,
          currency,
          customerEmail: email,
          description,
          returnUrl,
          cancelUrl
        });
        break;
        
      case 'grabpay':
        // Use PayMongo for GrabPay
        console.log('📤 Sending GrabPay payment to PayMongo with data:', {
          amount,
          currency,
          customerEmail: email,
          customerName,
          description,
          bookingId
        });
        result = await paymentProviders.processGrabPayPayment({
          amount,
          currency,
          customerEmail: email,
          customerName,
          description
        });
        console.log('📥 GrabPay response:', result);
        break;
        
      case 'qrph':
        // Use PayMongo for QRPH
        console.log('📤 Sending QRPH payment to PayMongo with data:', {
          amount,
          currency,
          customerEmail: email,
          customerName,
          description,
          bookingId
        });
        result = await paymentProviders.processQRPHPayment({
          amount,
          currency,
          customerEmail: email,
          customerName,
          description
        });
        console.log('📥 QRPH response:', result);
        break;
        break;
        
      case 'bank_transfer':
        // Bank transfer is manual - return pending status
        result = {
          success: true,
          provider: 'bank_transfer',
          transaction_reference: generateTransactionReference(),
          status: 'pending',
          provider_response: {
            instructions: 'Please transfer to the provided bank account',
            bank_name: 'Philippine National Bank',
            account_number: '1234-5678-9012',
            account_name: 'Naujan Tourism',
            reference: `BT${Date.now()}`
          }
        };
        break;
        
      case 'pay_at_property':
        result = {
          success: true,
          provider: 'manual',
          transaction_reference: generateTransactionReference(),
          status: 'pending',
          provider_response: {
            payment_instructions: 'Please pay at the hotel reception upon arrival'
          }
        };
        break;
        
      default:
        result = {
          success: false,
          provider: 'unknown',
          status: 'failed',
          error: 'Unsupported payment method',
          provider_response: { error: 'Unsupported payment method' }
        };
    }
    
    return {
      status: result.status,
      provider: result.provider,
      transaction_reference: result.transaction_reference,
      provider_response: result.provider_response,
      checkout_url: result.checkout_url || result.approval_url,
      client_secret: result.client_secret,
      processed_at: new Date().toISOString(),
      amount,
      currency
    };
    
  } catch (error) {
    console.error('Real payment processing error:', error);
    return {
      status: 'failed',
      provider: method,
      transaction_reference: generateTransactionReference(),
      provider_response: {
        error: error.message,
        details: error.response?.data || error
      },
      processed_at: new Date().toISOString(),
      amount,
      currency
    };
  }
};

// Process payment for a booking
router.post('/checkout', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    booking_id,
    payment_method,
    amount,
    currency = 'PHP',
    customer_email,
    customer_phone
  } = req.body;

  console.log('🔵 Checkout request:', { booking_id, payment_method, amount, user_id: userId });

  if (!booking_id || !payment_method || !amount) {
    console.error('🔴 Missing required fields in checkout request');
    return res.status(400).json({ error: 'Booking ID, payment method, and amount are required' });
  }

  if (!isExternalCheckoutMethod(payment_method)) {
    console.error('🔴 Invalid checkout payment method:', payment_method);
    return res.status(400).json({ error: 'Checkout is only supported for PayPal/GCash/GrabPay' });
  }

  try {
    const [bookings] = await db.promise().query(
      'SELECT * FROM hotel_bookings WHERE booking_id = ? AND user_id = ?',
      [booking_id, userId]
    );

    if (bookings.length === 0) {
      console.error('🔴 Booking not found:', { booking_id, user_id: userId });
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    console.log('✅ Booking found:', { booking_id, user_id: userId, total_amount: booking.total_amount });

    // SECURITY: Validate amount against booking's actual total
    const bookingAmount = parseFloat(booking.total_amount);
    const submittedAmount = parseFloat(amount);
    const amountDifference = Math.abs(submittedAmount - bookingAmount);
    
    if (amountDifference > 0.01) {
      return res.status(400).json({ 
        error: 'Amount mismatch. Expected ₱' + bookingAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        expected_amount: bookingAmount,
        submitted_amount: submittedAmount
      });
    }

    const allowedMethods = await getAllowedMethodsForHotel(booking.hotel_id);
    if (!allowedMethods.includes(payment_method)) {
      return res.status(400).json({
        error: `Payment method '${payment_method}' is not available for this hotel`,
        allowed_payment_methods: allowedMethods
      });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ error: 'Booking already paid' });
    }

    const clientOrigin = req.headers.origin || FRONTEND_URL;
    const paymentResult = await processPayment({
      method: payment_method,
      amount: bookingAmount,
      currency,
      email: customer_email || booking.customer_email,
      phone: customer_phone || booking.customer_phone,
      customerName: booking.customer_name,
      bookingId: booking_id,
      useCheckout: true,
      frontendOrigin: clientOrigin
    });

    if (paymentResult.status === 'failed' || !paymentResult.checkout_url) {
      return res.status(400).json({
        error: paymentResult.provider_response?.error || 'Checkout URL not available',
        provider: paymentResult.provider,
        status: paymentResult.status
      });
    }

    const paymentInsert = await insertPaymentRecord({
      bookingId: booking_id,
      amount: bookingAmount,
      currency,
      method: payment_method,
      provider: paymentResult.provider,
      status: paymentResult.status,
      transactionReference: paymentResult.transaction_reference,
      cardLast4: null,
      providerResponse: JSON.stringify(paymentResult.provider_response)
    });

    if (paymentResult.status === 'succeeded') {
      await db.promise().query(
        `UPDATE hotel_bookings 
         SET payment_status = 'paid',
             payment_method = ?,
             status = 'confirmed',
             updated_at = NOW()
         WHERE booking_id = ?`,
        [payment_method, booking_id]
      );
    } else if (paymentResult.status === 'pending') {
      await db.promise().query(
        `UPDATE hotel_bookings 
         SET payment_status = 'pending',
             payment_method = ?,
             status = 'pending',
             updated_at = NOW()
         WHERE booking_id = ?`,
        [payment_method, booking_id]
      );
    } else if (paymentResult.status === 'failed') {
      await db.promise().query(
        `UPDATE hotel_bookings 
         SET payment_status = 'failed',
             payment_method = ?,
             updated_at = NOW()
         WHERE booking_id = ?`,
        [payment_method, booking_id]
      );
    }

    res.json({
      success: paymentResult.status === 'succeeded',
      payment_id: paymentInsert.insertId,
      transaction_reference: paymentResult.transaction_reference,
      status: paymentResult.status,
      provider: paymentResult.provider,
      checkout_url: paymentResult.checkout_url,
      message: paymentResult.status === 'pending'
        ? 'Payment pending - continue to payment provider'
        : paymentResult.status === 'succeeded'
        ? 'Payment processed successfully'
        : paymentResult.provider_response.error || 'Payment failed'
    });
  } catch (err) {
    console.error('Checkout payment error:', err);
    res.status(500).json({
      error: 'Failed to start checkout',
      details: err.response?.data || err.message
    });
  }
});

router.post('/xendit/test', async (req, res) => {
  const {
    amount = 1000,
    currency = 'PHP',
    customer_name = 'Test Guest',
    customer_phone = '+639171234567',
    ewallet_type = 'GCASH',
    description = 'Sandbox Xendit Test Payment'
  } = req.body;

  try {
    const result = await paymentProviders.processXenditEWallet({
      amount,
      currency,
      customerName: customer_name,
      customerPhone: customer_phone,
      ewalletType: ewallet_type,
      description
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to start Xendit sandbox test',
      details: err.message
    });
  }
});

router.get('/xendit/sandbox', async (req, res) => {
  const { reference } = req.query;
  const frontendUrl = FRONTEND_URL;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xendit GCash Sandbox Test</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .container { background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; width: 100%; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; margin-bottom: 10px; }
        .title { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 5px; }
        .subtitle { font-size: 14px; color: #6b7280; }
        .divider { height: 1px; background: #e5e7eb; margin: 25px 0; }
        .details { background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-label { font-size: 14px; color: #6b7280; font-weight: 500; }
        .detail-value { font-size: 14px; color: #1f2937; font-weight: 600; }
        .amount { font-size: 28px; font-weight: 700; color: #667eea; text-align: center; margin: 20px 0; }
        .qr-section { text-align: center; margin: 25px 0; }
        .qr-placeholder { width: 200px; height: 200px; background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; margin: 15px auto; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; }
        .buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        button { padding: 12px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; }
        .btn-cancel { background: #ef4444; color: white; }
        .btn-cancel:hover { background: #dc2626; }
        .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 10px; }
        .info { background: #ech5f5; border-left: 4px solid #667eea; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; color: #374151; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">💳</div>
          <div class="title">GCash Payment</div>
          <div class="subtitle">Xendit Sandbox Mode</div>
        </div>

        <div class="info">ℹ️ This is a test payment in Xendit sandbox. No actual charges will be made.</div>

        <div class="badge">TEST TRANSACTION</div>

        <div class="details">
          <div class="detail-row">
            <span class="detail-label">Payment Method</span>
            <span class="detail-value">GCash</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Provider</span>
            <span class="detail-value">Xendit</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Transaction ID</span>
            <span class="detail-value" style="font-family: monospace; font-size: 12px;">${reference || 'pending'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value" style="color: #f59e0b;">⏳ Pending</span>
          </div>
        </div>

        <div class="amount">₱ 1,000.00</div>

        <div class="qr-section">
          <strong style="font-size: 14px; color: #374151; display: block; margin-bottom: 10px;">Scan QR Code or Enter Amount</strong>
          <div class="qr-placeholder">📱 QR Code Display Area</div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Use your GCash app to scan this code</p>
        </div>

        <div class="divider"></div>

        <div class="buttons">
          <button class="btn-success" onclick="completePayment()">✓ Complete Payment</button>
          <button class="btn-cancel" onclick="cancelPayment()">✕ Cancel</button>
        </div>
      </div>

      <script>
        const reference = '${reference || ''}';
        const frontendUrl = '${frontendUrl}';

        function completePayment() {
          // Redirect to payment success page
          window.location.href = frontendUrl + '/payment-success?provider=gcash&reference=' + encodeURIComponent(reference);
        }

        function cancelPayment() {
          // Redirect to payment canceled page
          window.location.href = frontendUrl + '/payment-cancel?provider=gcash&reference=' + encodeURIComponent(reference);
        }
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

router.post('/process', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    booking_id,
    payment_method,
    amount,
    currency = 'PHP',
    card_last4,
    customer_email,
    customer_phone
  } = req.body;

  if (!booking_id || !payment_method || !amount) {
    return res.status(400).json({ error: 'Booking ID, payment method, and amount are required' });
  }

  try {
    // Verify booking exists and belongs to user
    const [bookings] = await db.promise().query(
      'SELECT * FROM hotel_bookings WHERE booking_id = ? AND user_id = ?',
      [booking_id, userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    const allowedMethods = await getAllowedMethodsForHotel(booking.hotel_id);
    if (!allowedMethods.includes(payment_method)) {
      return res.status(400).json({
        error: `Payment method '${payment_method}' is not available for this hotel`,
        allowed_payment_methods: allowedMethods
      });
    }

    // Check if already paid
    if (booking.payment_status === 'paid') {
      return res.status(400).json({ error: 'Booking already paid' });
    }

    // Process payment
    const paymentResult = await processPayment({
      method: payment_method,
      amount: parseFloat(amount),
      currency,
      cardLast4: card_last4,
      email: customer_email || booking.customer_email,
      phone: customer_phone || booking.customer_phone,
      customerName: booking.customer_name,
      bookingId: booking_id,
      useCheckout: false
    });

    // Save payment record
    const paymentInsert = await insertPaymentRecord({
      bookingId: booking_id,
      amount,
      currency,
      method: payment_method,
      provider: paymentResult.provider,
      status: paymentResult.status,
      transactionReference: paymentResult.transaction_reference,
      cardLast4: card_last4 || null,
      providerResponse: JSON.stringify(paymentResult.provider_response)
    });

    // Update booking status if payment succeeded
    if (paymentResult.status === 'succeeded') {
      await db.promise().query(
        `UPDATE hotel_bookings 
         SET payment_status = 'paid', 
             payment_method = ?,
             status = 'confirmed',
             updated_at = NOW()
         WHERE booking_id = ?`,
        [payment_method, booking_id]
      );
    } else if (paymentResult.status === 'failed') {
      await db.promise().query(
        `UPDATE hotel_bookings 
         SET payment_status = 'failed',
             updated_at = NOW()
         WHERE booking_id = ?`,
        [booking_id]
      );
    }

    res.json({
      success: paymentResult.status === 'succeeded',
      payment_id: paymentInsert.insertId,
      transaction_reference: paymentResult.transaction_reference,
      status: paymentResult.status,
      provider: paymentResult.provider,
      checkout_url: paymentResult.checkout_url, // For GCash, PayPal redirect
      client_secret: paymentResult.client_secret, // For Stripe client-side confirmation
      message: paymentResult.status === 'succeeded' 
        ? 'Payment processed successfully' 
        : paymentResult.status === 'pending'
        ? 'Payment pending - please complete the payment process'
        : paymentResult.provider_response.error || 'Payment failed'
    });

  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

router.get('/success', async (req, res) => {
  const { token, PayerID } = req.query;
  
  let payment = null;
  
  // If PayPal payment, get payment details for background processing
  if (token && PayerID) {
    try {
      // 🟢 OPTIMIZED: Only await the SELECT query
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE p.provider_response LIKE ? AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${token}%`]
      );

      if (payments.length > 0) {
        payment = payments[0];
      }
    } catch (error) {
      console.error('Payment lookup error:', error);
    }
  }
  
  // 🟢 SMART ORIGIN DETECTION: Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);
  
  // 🟢 CRITICAL FIX: Build redirect URL immediately WITHOUT waiting for API calls or DB updates
  const { frontend_origin, ...restQuery } = req.query;
  const redirectUrl = buildRedirectUrl('/bookings', {
    payment: 'success',
    provider: 'generic',
    ...restQuery
  }, frontendOrigin);  // 🟢 Use smart detected origin instead of query param
  res.redirect(redirectUrl);
  
  // 🟢 OPTIMIZATION: Run PayPal capture and DB updates asynchronously (fire-and-forget)
  if (payment && token && PayerID) {
    setImmediate(async () => {
      try {
        // Capture PayPal payment without blocking response
        if (USE_REAL_PAYMENTS) {
          const captureResult = await paymentProviders.capturePayPalPayment(token);
          if (!captureResult.success) {
            console.error('🔴 PayPal capture failed:', captureResult);
            return;
          }
        }
        
        // Update payment and booking status
        await Promise.all([
          db.promise().query(
            `UPDATE hotel_payments SET status = 'succeeded', updated_at = NOW() WHERE payment_id = ?`,
            [payment.payment_id]
          ),
          db.promise().query(
            `UPDATE hotel_bookings SET payment_status = 'paid', updated_at = NOW() WHERE booking_id = ?`,
            [payment.booking_id]
          )
        ]);
        
        console.log(`✅ Payment Success: Booking ${payment.booking_id} confirmed`);
      } catch (error) {
        console.error('🔴 Background payment processing error:', error);
      }
    });
  }
});

router.get('/cancel', (req, res) => {
  const { frontend_origin, ...restQuery } = req.query;
  const redirectUrl = buildRedirectUrl('/bookings', {
    payment: 'cancelled',
    provider: 'generic',
    ...restQuery
  }, frontend_origin);
  res.redirect(redirectUrl);
});

router.get('/paypal/success', async (req, res) => {
  const { token, PayerID } = req.query;
  
  let bookingId = null;
  let payment = null;
  
  if (token && PayerID) {
    try {
      // 🟢 OPTIMIZED: Only await the SELECT query to get booking ID
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE p.provider_response LIKE ? AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${token}%`]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('PayPal payment lookup error:', error);
    }
  }
  
  // 🟢 SMART ORIGIN DETECTION: Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);
  
  // 🟢 CRITICAL FIX: Build redirect URL immediately WITHOUT waiting for API calls or DB updates
  const { frontend_origin: po, ...paypalRestQuery } = req.query;
  const lookupToken = bookingId ? generateLookupToken(bookingId) : null;
  const redirectUrl = buildRedirectUrl('/payment-success', {
    booking_id: bookingId,
    provider: 'paypal',
    token: token,
    lookup_token: lookupToken,
    ...paypalRestQuery
  }, frontendOrigin);  // 🟢 Use smart detected origin instead of query param
  res.redirect(redirectUrl);
  
  // 🟢 OPTIMIZATION: Run PayPal capture and DB updates asynchronously (fire-and-forget)
  // This prevents blocking on external API calls (500-2000ms)
  if (payment && token && PayerID) {
    setImmediate(async () => {
      try {
        if (USE_REAL_PAYMENTS) {
          // Call external PayPal API without blocking the response
          const captureResult = await paymentProviders.capturePayPalPayment(token);
          if (!captureResult.success) {
            console.error('🔴 PayPal capture failed:', captureResult);
            return;
          }
        }
        
        // Update payment and booking status
        await Promise.all([
          db.promise().query(
            `UPDATE hotel_payments SET status = 'succeeded', updated_at = NOW() WHERE payment_id = ?`,
            [payment.payment_id]
          ),
          db.promise().query(
            `UPDATE hotel_bookings SET payment_status = 'paid', updated_at = NOW() WHERE booking_id = ?`,
            [payment.booking_id]
          )
        ]);
        
        console.log(`✅ PayPal Payment Success: Booking ${payment.booking_id} confirmed`);
      } catch (error) {
        console.error('🔴 PayPal background processing error:', error);
      }
    });
  }
});

router.get('/paypal/cancel', (req, res) => {
  const { frontend_origin: pc, ...paypalCancelQuery } = req.query;
  const redirectUrl = buildRedirectUrl('/bookings', {
    payment: 'cancelled',
    provider: 'paypal',
    ...paypalCancelQuery
  }, pc);
  res.redirect(redirectUrl);
});

router.get('/gcash/success', async (req, res) => {
  const { source_id } = req.query;
  
  let bookingId = null;
  let payment = null;
  
  if (source_id) {
    try {
      // 🟢 OPTIMIZED: Only await the SELECT query to get booking ID
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id, b.rooms, b.hotel_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE p.provider_response LIKE ? AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${source_id}%`]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('GCash payment lookup error:', error);
    }
  }
  
  // 🟢 SMART ORIGIN DETECTION: Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);
  
  // 🟢 CRITICAL FIX: Build redirect URL immediately WITHOUT waiting for DB updates
  const { frontend_origin: gs, ...gcashSuccessQuery } = req.query;
  const lookupToken = bookingId ? generateLookupToken(bookingId) : null;
  const redirectUrl = buildRedirectUrl('/payment-success', {
    booking_id: bookingId,
    provider: 'gcash',
    source_id: source_id,
    requires_reference: '1',
    lookup_token: lookupToken,
    ...gcashSuccessQuery
  }, frontendOrigin);  // 🟢 Use smart detected origin instead of query param
  res.redirect(redirectUrl);
  
  // 🟢 OPTIMIZATION: Run DB updates asynchronously in background (fire-and-forget)
  // This doesn't block the response - user redirects immediately (~50ms instead of ~400ms)
  if (payment) {
    setImmediate(async () => {
      try {
        // Run all updates in parallel instead of sequentially
        await Promise.all([
          // Keep payment pending until customer submits a reference and merchant verifies it.
          db.promise().query(
            `UPDATE hotel_payments
             SET status = 'pending',
                 reference_status = CASE
                   WHEN method = 'gcash' AND (reference_status = 'not_required' OR reference_status IS NULL) THEN 'pending'
                   ELSE reference_status
                 END,
                 updated_at = NOW()
             WHERE payment_id = ?`,
            [payment.payment_id]
          ),
          // Booking remains pending until reference verification.
          db.promise().query(
            `UPDATE hotel_bookings SET payment_status = 'pending', status = 'pending', updated_at = NOW() WHERE booking_id = ?`,
            [payment.booking_id]
          )
        ]);

        console.log(`✅ GCash redirect success: Booking ${payment.booking_id} awaiting reference verification`);
      } catch (error) {
        console.error('🔴 GCash background update error:', error);
        // Log error but don't fail - user already redirected successfully
      }
    });
  }
});

router.get('/gcash/failed', async (req, res) => {
  const { source_id } = req.query;
  
  let bookingId = null;
  let payment = null;
  
  if (source_id) {
    try {
      // 🟢 OPTIMIZED: Only await the SELECT query to get booking ID
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE p.provider_response LIKE ? AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${source_id}%`]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('GCash payment lookup error:', error);
    }
  }
  
  // 🟢 SMART ORIGIN DETECTION: Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);
  
  // 🟢 CRITICAL FIX: Build redirect URL immediately WITHOUT waiting for DB updates
  const { frontend_origin: gf, ...gcashFailedQuery } = req.query;
  const redirectUrl = buildRedirectUrl('/bookings', {
    payment: 'failed',
    provider: 'gcash',
    booking_id: bookingId,
    source_id: source_id,
    ...gcashFailedQuery
  }, frontendOrigin);  // 🟢 Use smart detected origin instead of query param
  res.redirect(redirectUrl);
  
  // 🟢 OPTIMIZATION: Run DB updates asynchronously in background (fire-and-forget)
  if (payment) {
    setImmediate(async () => {
      try {
        // Update payment status to failed
        await db.promise().query(
          `UPDATE hotel_payments SET status = 'failed', updated_at = NOW() WHERE payment_id = ?`,
          [payment.payment_id]
        );
        
        // Update booking: keep as pending to allow retry, mark payment as failed
        await db.promise().query(
          `UPDATE hotel_bookings SET payment_status = 'failed', status = 'pending', updated_at = NOW() WHERE booking_id = ?`,
          [payment.booking_id]
        );
        
        console.log(`❌ GCash Payment Failed: Booking ${payment.booking_id} failed, rooms remain available for retry`);
      } catch (error) {
        console.error('🔴 GCash failed background update error:', error);
      }
    });
  }
});

// 🟢 NEW: GrabPay payment success handler
router.get('/grabpay/success', async (req, res) => {
  const { source_id } = req.query;
  
  let bookingId = null;
  let payment = null;

  if (source_id) {
    try {
      // Find payment by source_id from provider_response
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE p.provider_response LIKE ? AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${source_id}%`]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('GrabPay payment lookup error:', error);
    }
  }

  // Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);

  // Build redirect URL
  const { frontend_origin: gf, ...grabpaySuccessQuery } = req.query;
  const lookupToken = bookingId ? generateLookupToken(bookingId) : null;
  const redirectUrl = buildRedirectUrl('/payment-success', {
    booking_id: bookingId,
    provider: 'grabpay',
    source_id: source_id,
    lookup_token: lookupToken,
    ...grabpaySuccessQuery
  }, frontendOrigin);

  res.redirect(redirectUrl);

  // Run DB updates asynchronously in background
  if (payment) {
    setImmediate(async () => {
      try {
        // Mark payment as successful
        await db.promise().query(
          `UPDATE hotel_payments SET status = 'succeeded', updated_at = NOW() WHERE payment_id = ?`,
          [payment.payment_id]
        );

        // Update booking: mark payment as paid
        await db.promise().query(
          `UPDATE hotel_bookings SET payment_status = 'paid', status = 'confirmed', updated_at = NOW() WHERE booking_id = ?`,
          [payment.booking_id]
        );

        console.log(`✅ GrabPay Payment Successful: Booking ${payment.booking_id} confirmed`);
      } catch (error) {
        console.error('🔴 GrabPay success background update error:', error);
      }
    });
  }
});

// 🟢 NEW: GrabPay payment failed handler
router.get('/grabpay/failed', async (req, res) => {
  const { source_id } = req.query;

  let bookingId = null;
  let payment = null;

  if (source_id) {
    try {
      // Find payment by source_id
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE p.provider_response LIKE ? AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${source_id}%`]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('GrabPay payment lookup error:', error);
    }
  }

  // Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);

  // Build redirect URL
  const { frontend_origin: gf, ...grabpayFailedQuery } = req.query;
  const redirectUrl = buildRedirectUrl('/bookings', {
    payment: 'failed',
    provider: 'grabpay',
    booking_id: bookingId,
    source_id: source_id,
    ...grabpayFailedQuery
  }, frontendOrigin);

  res.redirect(redirectUrl);

  // Run DB updates asynchronously in background
  if (payment) {
    setImmediate(async () => {
      try {
        // Mark payment as failed
        await db.promise().query(
          `UPDATE hotel_payments SET status = 'failed', updated_at = NOW() WHERE payment_id = ?`,
          [payment.payment_id]
        );

        // Update booking: keep as pending to allow retry
        await db.promise().query(
          `UPDATE hotel_bookings SET payment_status = 'failed', status = 'pending', updated_at = NOW() WHERE booking_id = ?`,
          [payment.booking_id]
        );

        console.log(`❌ GrabPay Payment Failed: Booking ${payment.booking_id} failed, rooms remain available for retry`);
      } catch (error) {
        console.error('🔴 GrabPay failed background update error:', error);
      }
    });
  }
});

// 🟢 NEW: GrabPay payment failed handler
router.get('/grabpay/failed', async (req, res) => {
  const { source_id } = req.query;

  let bookingId = null;
  let payment = null;

  if (source_id) {
    try {
      // Find payment by source_id
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE p.provider_response LIKE ? AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${source_id}%`]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('GrabPay payment lookup error:', error);
    }
  }

  // Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);

  // Build redirect URL
  const { frontend_origin: gf, ...grabpayFailedQuery } = req.query;
  const redirectUrl = buildRedirectUrl('/bookings', {
    payment: 'failed',
    provider: 'grabpay',
    booking_id: bookingId,
    source_id: source_id,
    ...grabpayFailedQuery
  }, frontendOrigin);

  res.redirect(redirectUrl);

  // Run DB updates asynchronously in background
  if (payment) {
    setImmediate(async () => {
      try {
        // Mark payment as failed
        await db.promise().query(
          `UPDATE hotel_payments SET status = 'failed', updated_at = NOW() WHERE payment_id = ?`,
          [payment.payment_id]
        );

        // Update booking: keep as pending to allow retry
        await db.promise().query(
          `UPDATE hotel_bookings SET payment_status = 'failed', status = 'pending', updated_at = NOW() WHERE booking_id = ?`,
          [payment.booking_id]
        );

        console.log(`❌ GrabPay Payment Failed: Booking ${payment.booking_id} failed, rooms remain available for retry`);
      } catch (error) {
        console.error('🔴 GrabPay failed background update error:', error);
      }
    });
  }
});

// 🟢 NEW: QRPH payment success handler
router.get('/qrph/success', async (req, res) => {
  const { source_id } = req.query;
  
  let bookingId = null;
  let payment = null;

  if (source_id) {
    try {
      // 🟢 OPTIMIZED: Only await the SELECT query to get booking ID
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id, b.rooms, b.hotel_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE p.provider_response LIKE ? AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${source_id}%`]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('QRPH payment lookup error:', error);
    }
  }
  
  // 🟢 SMART ORIGIN DETECTION: Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);
  
  // 🟢 CRITICAL FIX: Build redirect URL immediately WITHOUT waiting for DB updates
  const { frontend_origin: qf, ...qrphSuccessQuery } = req.query;
  const lookupToken = bookingId ? generateLookupToken(bookingId) : null;
  const redirectUrl = buildRedirectUrl('/payment-success', {
    booking_id: bookingId,
    provider: 'qrph',
    source_id: source_id,
    lookup_token: lookupToken,
    ...qrphSuccessQuery
  }, frontendOrigin);  // 🟢 Use smart detected origin instead of query param
  res.redirect(redirectUrl);
  
  // 🟢 OPTIMIZATION: Run DB updates asynchronously in background (fire-and-forget)
  // This doesn't block the response - user redirects immediately
  if (payment) {
    setImmediate(async () => {
      try {
        // Mark payment as successful
        await db.promise().query(
          `UPDATE hotel_payments
           SET status = 'succeeded',
               updated_at = NOW()
           WHERE payment_id = ?`,
          [payment.payment_id]
        );

        // Update booking: mark payment as paid
        await db.promise().query(
          `UPDATE hotel_bookings SET payment_status = 'paid', status = 'confirmed', updated_at = NOW() WHERE booking_id = ?`,
          [payment.booking_id]
        );

        console.log(`✅ QRPH Payment Successful: Booking ${payment.booking_id} confirmed`);
      } catch (error) {
        console.error('🔴 QRPH success background update error:', error);
        // Log error but don't fail - user already redirected successfully
      }
    });
  }
});

// 🟢 NEW: QRPH payment failed handler
router.get('/qrph/failed', async (req, res) => {
  const { source_id } = req.query;
  
  let bookingId = null;
  let payment = null;
  
  if (source_id) {
    try {
      // 🟢 OPTIMIZED: Only await the SELECT query to get booking ID
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE p.provider_response LIKE ? AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${source_id}%`]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('QRPH payment lookup error:', error);
    }
  }
  
  // 🟢 SMART ORIGIN DETECTION: Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);
  
  // 🟢 CRITICAL FIX: Build redirect URL immediately WITHOUT waiting for DB updates
  const { frontend_origin: qf, ...qrphFailedQuery } = req.query;
  const redirectUrl = buildRedirectUrl('/bookings', {
    payment: 'failed',
    provider: 'qrph',
    booking_id: bookingId,
    source_id: source_id,
    ...qrphFailedQuery
  }, frontendOrigin);  // 🟢 Use smart detected origin
  res.redirect(redirectUrl);
  
  // 🟢 OPTIMIZATION: Run DB updates asynchronously in background (fire-and-forget)
  if (payment) {
    setImmediate(async () => {
      try {
        // Update payment status to failed
        await db.promise().query(
          `UPDATE hotel_payments SET status = 'failed', updated_at = NOW() WHERE payment_id = ?`,
          [payment.payment_id]
        );
        
        // Update booking: keep as pending to allow retry, mark payment as failed
        await db.promise().query(
          `UPDATE hotel_bookings SET payment_status = 'failed', status = 'pending', updated_at = NOW() WHERE booking_id = ?`,
          [payment.booking_id]
        );
        
        console.log(`❌ QRPH Payment Failed: Booking ${payment.booking_id} failed, rooms remain available for retry`);
      } catch (error) {
        console.error('🔴 QRPH failed background update error:', error);
      }
    });
  }
});

// 🟢 NEW: Xendit payment success redirect handler
router.get('/xendit/success', async (req, res) => {
  const { charge_id, reference_id } = req.query;
  
  let bookingId = null;
  let payment = null;

  if (charge_id) {
    try {
      // 🟢 OPTIMIZED: Only await the SELECT query to get booking ID
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE (p.provider_response LIKE ? OR p.transaction_reference = ?) AND p.status IN ('pending', 'succeeded')
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${charge_id}%`, charge_id]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('🔴 Xendit payment lookup error:', error);
    }
  }
  
  // 🟢 SMART ORIGIN DETECTION: Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);
  
  // 🟢 CRITICAL FIX: Build redirect URL immediately WITHOUT waiting for DB updates
  const { frontend_origin: xf, ...xenditSuccessQuery } = req.query;
  const lookupToken = bookingId ? generateLookupToken(bookingId) : null;
  const redirectUrl = buildRedirectUrl('/payment-success', {
    booking_id: bookingId,
    provider: 'xendit',
    charge_id: charge_id,
    lookup_token: lookupToken,
    ...xenditSuccessQuery
  }, frontendOrigin);  // 🟢 Use smart detected origin
  res.redirect(redirectUrl);
  
  // 🟢 OPTIMIZATION: Run DB updates asynchronously in background (fire-and-forget)
  if (payment) {
    setImmediate(async () => {
      try {
        // Mark payment as succeeded (will be confirmed by webhook)
        await db.promise().query(
          `UPDATE hotel_payments SET status = 'succeeded', updated_at = NOW() WHERE payment_id = ?`,
          [payment.payment_id]
        );

        // Update booking: mark payment as paid
        await db.promise().query(
          `UPDATE hotel_bookings SET payment_status = 'paid', status = 'confirmed', updated_at = NOW() WHERE booking_id = ?`,
          [payment.booking_id]
        );

        console.log(`✅ Xendit Payment Successful: Booking ${payment.booking_id} confirmed`);
      } catch (error) {
        console.error('🔴 Xendit success background update error:', error);
        // Log error but don't fail - user already redirected successfully
      }
    });
  }
});

// 🟢 NEW: Xendit payment failed redirect handler
router.get('/xendit/failed', async (req, res) => {
  const { charge_id, reference_id } = req.query;
  
  let bookingId = null;
  let payment = null;
  
  if (charge_id) {
    try {
      // 🟢 OPTIMIZED: Only await the SELECT query to get booking ID
      const [payments] = await db.promise().query(
        `SELECT p.*, b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE (p.provider_response LIKE ? OR p.transaction_reference = ?) AND p.status IN ('pending', 'failed')
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${charge_id}%`, charge_id]
      );

      if (payments.length > 0) {
        payment = payments[0];
        bookingId = payment.booking_id;
      }
    } catch (error) {
      console.error('🔴 Xendit payment lookup error:', error);
    }
  }
  
  // 🟢 SMART ORIGIN DETECTION: Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);
  
  // 🟢 CRITICAL FIX: Build redirect URL immediately WITHOUT waiting for DB updates
  const { frontend_origin: xf, ...xenditFailedQuery } = req.query;
  const redirectUrl = buildRedirectUrl('/bookings', {
    payment: 'failed',
    provider: 'xendit',
    booking_id: bookingId,
    charge_id: charge_id,
    ...xenditFailedQuery
  }, frontendOrigin);  // 🟢 Use smart detected origin
  res.redirect(redirectUrl);
  
  // 🟢 OPTIMIZATION: Run DB updates asynchronously in background (fire-and-forget)
  if (payment) {
    setImmediate(async () => {
      try {
        // Update payment status to failed
        await db.promise().query(
          `UPDATE hotel_payments SET status = 'failed', updated_at = NOW() WHERE payment_id = ?`,
          [payment.payment_id]
        );
        
        // Update booking: keep as pending to allow retry, mark payment as failed
        await db.promise().query(
          `UPDATE hotel_bookings SET payment_status = 'failed', status = 'pending', updated_at = NOW() WHERE booking_id = ?`,
          [payment.booking_id]
        );
        
        console.log(`❌ Xendit Payment Failed: Booking ${payment.booking_id} failed, rooms remain available for retry`);
      } catch (error) {
        console.error('🔴 Xendit failed background update error:', error);
      }
    });
  }
});

// 🟢 NEW: Xendit payment cancel redirect handler
router.get('/xendit/cancel', async (req, res) => {
  const { charge_id, reference_id } = req.query;
  
  let bookingId = null;
  
  if (charge_id) {
    try {
      const [payments] = await db.promise().query(
        `SELECT b.booking_id 
         FROM hotel_payments p
         JOIN hotel_bookings b ON p.booking_id = b.booking_id
         WHERE (p.provider_response LIKE ? OR p.transaction_reference = ?) AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [`%${charge_id}%`, charge_id]
      );

      if (payments.length > 0) {
        bookingId = payments[0].booking_id;
      }
    } catch (error) {
      console.error('🔴 Xendit cancel lookup error:', error);
    }
  }
  
  // Use intelligent origin detection
  const frontendOrigin = detectFrontendOrigin(req);
  
  // Build redirect URL
  const { frontend_origin: xc, ...xenditCancelQuery } = req.query;
  const redirectUrl = buildRedirectUrl('/bookings', {
    payment: 'cancelled',
    provider: 'xendit',
    booking_id: bookingId,
    charge_id: charge_id,
    ...xenditCancelQuery
  }, frontendOrigin);
  res.redirect(redirectUrl);

  console.log(`⚠️  Xendit Payment Cancelled by user for booking ${bookingId}`);
});

// Get latest payment for a booking (used by payment-success reference confirmation flow)
router.get('/booking/:bookingId/latest', async (req, res) => {
  const userId = getUserIdFromToken(req);

  const bookingId = Number(req.params.bookingId);
  if (!Number.isFinite(bookingId) || bookingId <= 0) {
    return res.status(400).json({ error: 'Invalid booking id' });
  }

  try {
    let query;
    let params;

    // If the frontend included a short-lived lookup_token, validate it and allow guest lookup
    const lookupToken = req.query?.lookup_token || req.headers['x-lookup-token'];
    if (!userId && lookupToken) {
      try {
        const decoded = jwt.verify(String(lookupToken), JWT_SECRET);
        if (decoded && decoded.booking_id && Number(decoded.booking_id) === bookingId) {
          // allow guest lookup via token
          userId = null; // explicit
        } else {
          return res.status(401).json({ error: 'Invalid lookup token' });
        }
      } catch (err) {
        console.warn('Lookup token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid or expired lookup token' });
      }
    }

    if (userId) {
      // Normal authenticated path: ensure booking belongs to the user
      query = `SELECT p.*, b.user_id
               FROM hotel_payments p
               JOIN hotel_bookings b ON p.booking_id = b.booking_id
               WHERE p.booking_id = ? AND b.user_id = ?
               ORDER BY p.payment_id DESC
               LIMIT 1`;
      params = [bookingId, userId];
    } else {
      // Quick-fix: allow unauthenticated frontend redirect requests to fetch latest payment
      // if the request Origin or Referer matches FRONTEND_URL, or when in development.
      const origin = (req.get('Origin') || '').replace(/\/$/, '');
      const referer = (req.get('Referer') || req.get('Referrer') || '').replace(/\/$/, '');
      const frontend = FRONTEND_URL;

      const devAllowed = process.env.NODE_ENV === 'development' || process.env.ALLOW_GUEST_LOOKUP === 'true';

      if (origin !== frontend && referer !== frontend && !devAllowed) {
        console.warn(`Guest lookup denied for booking ${bookingId}. origin='${origin}' referer='${referer}' expected='${frontend}' devAllowed=${devAllowed}`);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.warn(`Guest lookup allowed for booking ${bookingId} from origin='${origin}' referer='${referer}'`);

      query = `SELECT p.*, b.user_id
               FROM hotel_payments p
               JOIN hotel_bookings b ON p.booking_id = b.booking_id
               WHERE p.booking_id = ?
               ORDER BY p.payment_id DESC
               LIMIT 1`;
      params = [bookingId];
    }

    const [rows] = await db.promise().query(query, params);

    if (!rows.length) {
      return res.status(404).json({ error: 'Payment not found for booking' });
    }

    res.json(parseProviderResponse(rows[0]));
  } catch (err) {
    console.error('Fetch latest payment by booking error:', err);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// Customer submits GCash/InstaPay reference number for merchant confirmation
router.post('/:paymentId/submit-reference', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const paymentId = Number(req.params.paymentId);
  const referenceNumber = String(req.body?.reference_number || '').trim();

  if (!Number.isFinite(paymentId) || paymentId <= 0) {
    return res.status(400).json({ error: 'Invalid payment id' });
  }

  if (!isValidReferenceNumber(referenceNumber)) {
    return res.status(400).json({
      error: 'Reference number must be 6-64 characters and contain only letters, numbers, underscore, or dash'
    });
  }

  try {
    const [payments] = await db.promise().query(
      `SELECT p.payment_id, p.method, p.status, p.reference_status, b.booking_id, b.user_id
       FROM hotel_payments p
       JOIN hotel_bookings b ON p.booking_id = b.booking_id
       WHERE p.payment_id = ? AND b.user_id = ?
       LIMIT 1`,
      [paymentId, userId]
    );

    if (!payments.length) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = payments[0];
    if (payment.method !== 'gcash') {
      return res.status(400).json({ error: 'Reference confirmation is only supported for GCash payments' });
    }

    if (payment.status === 'succeeded') {
      return res.status(400).json({ error: 'Payment already confirmed' });
    }

    await db.promise().query(
      `UPDATE hotel_payments
       SET customer_reference_number = ?,
           reference_submitted_at = NOW(),
           reference_status = 'pending',
           status = CASE WHEN status = 'failed' THEN 'pending' ELSE status END,
           updated_at = NOW()
       WHERE payment_id = ?`,
      [referenceNumber, paymentId]
    );

    await db.promise().query(
      `UPDATE hotel_bookings
       SET payment_status = 'pending',
           status = CASE WHEN status = 'cancelled' THEN status ELSE 'pending' END,
           updated_at = NOW()
       WHERE booking_id = ?`,
      [payment.booking_id]
    );

    // Notify hotel owners about submitted reference (attempt email, fallback to log)
    try {
      const [owners] = await db.promise().query(
        `SELECT u.email, u.first_name, u.last_name
         FROM users u
         JOIN hotel_owners ho ON ho.user_id = u.user_id
         WHERE ho.hotel_id = ? AND u.email IS NOT NULL`,
        [payment.booking_id ? payment.booking_id : payment.booking_id]
      );

      const ownerEmails = (owners || []).map(o => o.email).filter(Boolean);
      const bookingLink = `${FRONTEND_URL}/owner/payments`;

      if (ownerEmails.length) {
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });

          const mailOptions = {
            from: process.env.SMTP_FROM || 'no-reply@naujango.local',
            to: ownerEmails.join(','),
            subject: 'New payment reference submitted',
            text: `A customer submitted a reference number for booking #${payment.booking_id}.
Reference: ${referenceNumber}
Please verify the payment in your Owner Dashboard: ${bookingLink}`
          };

          transporter.sendMail(mailOptions).then(() => {
            console.log('Owner notification emails sent to:', ownerEmails.join(','));
          }).catch((err) => {
            console.error('Failed to send owner notification emails:', err);
            console.log('Owner emails:', ownerEmails.join(','));
          });
        } else {
          console.log('Owner notification (SMTP not configured) - would notify:', ownerEmails.join(','));
          console.log(`Booking ${payment.booking_id} reference submitted: ${referenceNumber}`);
        }
      } else {
        console.log('No owner emails found to notify for booking:', payment.booking_id);
      }
    } catch (notifyErr) {
      console.error('Error notifying owners about submitted reference:', notifyErr);
    }

    res.json({
      success: true,
      message: 'Reference number submitted. Waiting for merchant verification.',
      payment_id: paymentId,
      reference_status: 'pending'
    });
  } catch (err) {
    console.error('Submit payment reference error:', err);
    res.status(500).json({ error: 'Failed to submit reference number' });
  }
});

// Merchant/admin verifies submitted payment reference
router.post('/:paymentId/verify-reference', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  const paymentId = Number(req.params.paymentId);
  const verified = Boolean(req.body?.verified);
  const notes = req.body?.notes ? String(req.body.notes).trim() : null;
  const isAdmin = req.user.role === 'admin';

  if (!Number.isFinite(paymentId) || paymentId <= 0) {
    return res.status(400).json({ error: 'Invalid payment id' });
  }

  if (req.body?.verified === undefined) {
    return res.status(400).json({ error: 'verified flag is required' });
  }

  try {
    const [rows] = await db.promise().query(
      `SELECT p.payment_id, p.booking_id, p.status, p.method, p.reference_status,
              b.hotel_id, b.rooms
       FROM hotel_payments p
       JOIN hotel_bookings b ON p.booking_id = b.booking_id
       WHERE p.payment_id = ?
       LIMIT 1`,
      [paymentId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = rows[0];

    if (!isAdmin) {
      const [ownershipRows] = await db.promise().query(
        `SELECT 1
         FROM hotel_owners
         WHERE user_id = ? AND hotel_id = ?
         LIMIT 1`,
        [req.user.user_id, payment.hotel_id]
      );

      if (!ownershipRows.length) {
        return res.status(403).json({ error: 'Access denied for this payment verification' });
      }
    }

    if (payment.method !== 'gcash') {
      return res.status(400).json({ error: 'Reference verification is only supported for GCash payments' });
    }

    if (verified) {
      await db.promise().query(
        `UPDATE hotel_payments
         SET status = 'succeeded',
             reference_status = 'verified',
             reference_notes = ?,
             verified_by = ?,
             verified_at = NOW(),
             paid_at = COALESCE(paid_at, NOW()),
             updated_at = NOW()
         WHERE payment_id = ?`,
        [notes, req.user.user_id, paymentId]
      );

      await db.promise().query(
        `UPDATE hotel_bookings
         SET payment_status = 'paid',
             status = 'confirmed',
             updated_at = NOW()
         WHERE booking_id = ?`,
        [payment.booking_id]
      );

      await db.promise().query(
        `UPDATE hotels
         SET rooms_available = GREATEST(rooms_available - ?, 0)
         WHERE hotel_id = ?`,
        [payment.rooms || 1, payment.hotel_id]
      );

      return res.json({
        success: true,
        payment_id: paymentId,
        reference_status: 'verified',
        payment_status: 'succeeded'
      });
    }

    await db.promise().query(
      `UPDATE hotel_payments
       SET status = 'failed',
           reference_status = 'rejected',
           reference_notes = ?,
           verified_by = ?,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE payment_id = ?`,
      [notes, req.user.user_id, paymentId]
    );

    await db.promise().query(
      `UPDATE hotel_bookings
       SET payment_status = 'failed',
           status = 'pending',
           updated_at = NOW()
       WHERE booking_id = ?`,
      [payment.booking_id]
    );

    return res.json({
      success: true,
      payment_id: paymentId,
      reference_status: 'rejected',
      payment_status: 'failed'
    });
  } catch (err) {
    console.error('Verify payment reference error:', err);
    res.status(500).json({ error: 'Failed to verify reference number' });
  }
});

// Get payment details
router.get('/:paymentId', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [payments] = await db.promise().query(
      `SELECT p.*, b.hotel_name, b.receipt_number, b.check_in, b.check_out
       FROM hotel_payments p
       JOIN hotel_bookings b ON p.booking_id = b.booking_id
       WHERE p.payment_id = ? AND b.user_id = ?`,
      [req.params.paymentId, userId]
    );
    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    const payment = parseProviderResponse(payments[0]);
    res.json(payment);
  } catch (err) {
    console.error('Fetch payment error:', err);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});
// Manual payment status update endpoint (admin functionality)
router.post('/:paymentId/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status || !['succeeded', 'pending', 'failed', 'refunded'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  try {
    // Get payment details
    const [payments] = await db.promise().query(
      `SELECT p.*, b.booking_id FROM hotel_payments p JOIN hotel_bookings b ON p.booking_id = b.booking_id WHERE p.payment_id = ?`,
      [req.params.paymentId]
    );
    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    const payment = payments[0];
    // Update payment status
    await db.promise().query(
      `UPDATE hotel_payments SET status = ?, updated_at = NOW() WHERE payment_id = ?`,
      [status, req.params.paymentId]
    );
    // Update booking status if needed
    if (status === 'succeeded') {
      await db.promise().query(
        `UPDATE hotel_bookings SET payment_status = 'paid', updated_at = NOW() WHERE booking_id = ?`,
        [payment.booking_id]
      );
    } else if (status === 'failed') {
      await db.promise().query(
        `UPDATE hotel_bookings SET payment_status = 'failed', updated_at = NOW() WHERE booking_id = ?`,
        [payment.booking_id]
      );
    } else if (status === 'pending') {
      await db.promise().query(
        `UPDATE hotel_bookings SET payment_status = 'pending', updated_at = NOW() WHERE booking_id = ?`,
        [payment.booking_id]
      );
    } else if (status === 'refunded') {
      await db.promise().query(
        `UPDATE hotel_bookings SET payment_status = 'refunded', status = 'cancelled', updated_at = NOW() WHERE booking_id = ?`,
        [payment.booking_id]
      );
    }

    res.json({ success: true, message: 'Payment status updated manually.' });
  } catch (err) {
    console.error('Manual status update error:', err);
    res.status(500).json({ error: 'Failed to update payment status manually' });
  }
});

// Parse provider response if it's stored as JSON string
router.get('/payment/:paymentId', async (req, res) => {
  try {
    // ...existing code...
    if (payment.provider_response && typeof payment.provider_response === 'string') {
      try {
        payment.provider_response = JSON.parse(payment.provider_response);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
    res.json(payment);
  } catch (err) {
    console.error('Fetch payment error:', err);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// Get all payments for a user
router.get('/user/history', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [payments] = await db.promise().query(
      `SELECT p.*, b.hotel_name, b.receipt_number, b.check_in, b.check_out
       FROM hotel_payments p
       JOIN hotel_bookings b ON p.booking_id = b.booking_id
       WHERE b.user_id = ?
       ORDER BY p.paid_at DESC`,
      [userId]
    );

    // Parse provider responses
    payments.forEach(payment => {
      if (payment.provider_response && typeof payment.provider_response === 'string') {
        try {
          payment.provider_response = JSON.parse(payment.provider_response);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    });

    res.json(payments);
  } catch (err) {
    console.error('Fetch payment history error:', err);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Refund payment (owner/admin functionality with ownership checks)
router.post('/:paymentId/refund', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  const { reason, amount } = req.body;

  try {
    let query;
    let params;

    if (isAdmin) {
      query = `SELECT p.*, b.user_id, b.booking_id
       FROM hotel_payments p
       JOIN hotel_bookings b ON p.booking_id = b.booking_id
       WHERE p.payment_id = ?`;
      params = [req.params.paymentId];
    } else {
      query = `SELECT p.*, b.user_id, b.booking_id
       FROM hotel_payments p
       JOIN hotel_bookings b ON p.booking_id = b.booking_id
       JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
       WHERE p.payment_id = ? AND ho.user_id = ?`;
      params = [req.params.paymentId, userId];
    }

    // Get payment details
    const [payments] = await db.promise().query(query, params);

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found or access denied' });
    }

    const payment = payments[0];

    if (payment.status !== 'succeeded') {
      return res.status(400).json({ error: 'Can only refund successful payments' });
    }

    const parsedAmount = amount !== undefined && amount !== null && amount !== '' ? Number(amount) : payment.amount;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Refund amount must be a positive number' });
    }
    if (parsedAmount > Number(payment.amount)) {
      return res.status(400).json({ error: 'Refund amount cannot exceed original payment amount' });
    }

    const refundAmount = parsedAmount;
    const refundRef = `REF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Update payment status
    await db.promise().query(
      `UPDATE hotel_payments 
       SET status = 'refunded',
           refund_amount = ?,
           refund_reference = ?,
           refund_reason = ?,
           refunded_at = NOW()
       WHERE payment_id = ?`,
      [refundAmount, refundRef, reason || 'Customer request', req.params.paymentId]
    );

    // Update booking status
    await db.promise().query(
      `UPDATE hotel_bookings 
       SET payment_status = 'refunded',
           status = 'cancelled',
           updated_at = NOW()
       WHERE booking_id = ?`,
      [payment.booking_id]
    );

    res.json({
      success: true,
      refund_reference: refundRef,
      refund_amount: refundAmount,
      message: 'Refund processed successfully'
    });

  } catch (err) {
    console.error('Refund processing error:', err);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// 🟢 NEW: Xendit webhook handler for payment status updates
router.post('/webhook/xendit', express.json(), async (req, res) => {
  const signature = req.headers['x-xendit-callback-verification'];
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  
  try {
    // Verify Xendit webhook signature
    const verification = paymentProviders.verifyXenditWebhook(rawBody, signature);
    
    if (!verification.valid) {
      console.warn('⚠️  Invalid Xendit webhook signature:', verification.reason);
      return res.status(400).json({ error: 'Invalid signature', reason: verification.reason });
    }
    
    const payload = req.body;
    const { id: chargeId, status, reference_id, amount, currency } = payload;
    
    console.log('✅ Xendit webhook received and verified:', { chargeId, status, reference_id });
    
    // Map Xendit status to our internal status
    let internalStatus = 'pending';
    if (status === 'COMPLETED' || status === 'SUCCEEDED') {
      internalStatus = 'succeeded';
    } else if (status === 'FAILED' || status === 'FAILED_FRAUD') {
      internalStatus = 'failed';
    } else if (status === 'CANCELLED') {
      internalStatus = 'cancelled';
    }
    
    // Find payment by charge_id or reference_id
    const [payments] = await db.promise().query(
      `SELECT p.*, b.booking_id FROM hotel_payments p
       JOIN hotel_bookings b ON p.booking_id = b.booking_id
       WHERE p.transaction_reference = ? OR p.provider_response LIKE ?
       LIMIT 1`,
      [chargeId, `%${chargeId}%`]
    );
    
    if (payments.length > 0) {
      const payment = payments[0];
      
      // Update payment status
      await db.promise().query(
        `UPDATE hotel_payments 
         SET status = ?,
             provider_response = ?,
             updated_at = NOW()
         WHERE payment_id = ?`,
        [internalStatus, JSON.stringify(payload), payment.payment_id]
      );
      
      // If payment succeeded, update booking
      if (internalStatus === 'succeeded') {
        await db.promise().query(
          `UPDATE hotel_bookings 
           SET payment_status = 'paid',
               status = 'confirmed',
               updated_at = NOW()
           WHERE booking_id = ?`,
          [payment.booking_id]
        );
        console.log(`✅ Xendit Payment Confirmed: Booking ${payment.booking_id}, Amount: ${amount} ${currency}`);
      } else if (internalStatus === 'failed') {
        // Mark booking back to pending to allow retry
        await db.promise().query(
          `UPDATE hotel_bookings 
           SET payment_status = 'failed',
               status = 'pending',
               updated_at = NOW()
           WHERE booking_id = ?`,
          [payment.booking_id]
        );
        console.log(`❌ Xendit Payment Failed: Booking ${payment.booking_id}`);
      }
    } else {
      console.warn('⚠️  No payment found for Xendit charge:', chargeId);
    }
    
    // Always return 200 OK to acknowledge receipt (prevents Xendit from retrying)
    res.status(200).json({ received: true, processed: payments.length > 0 });
    
  } catch (err) {
    console.error('🔴 Xendit webhook processing error:', err);
    // Still return 200 to prevent Xendit from retrying with bad data
    res.status(200).json({ received: true, error: err.message });
  }
});

// Webhook endpoint for payment providers (simulated)
router.post('/webhook/:provider', async (req, res) => {
  const { provider } = req.params;
  const payload = req.body;

  console.log(`Received webhook from ${provider}:`, payload);

  // In a real implementation, you would:
  // 1. Verify webhook signature
  // 2. Process the payment status update
  // 3. Update database accordingly

  try {
    // Simulate webhook processing
    const { transaction_reference, status, booking_id } = payload;

    if (transaction_reference && status && booking_id) {
      // Update payment status
      await db.promise().query(
        `UPDATE hotel_payments 
         SET status = ?,
             updated_at = NOW()
         WHERE transaction_reference = ?`,
        [status, transaction_reference]
      );

      // Update booking if payment succeeded
      if (status === 'succeeded') {
        await db.promise().query(
          `UPDATE hotel_bookings 
           SET payment_status = 'paid',
               updated_at = NOW()
           WHERE booking_id = ?`,
          [booking_id]
        );
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Stripe webhook handler
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    const verification = paymentProviders.verifyStripeWebhook(req.body, signature);
    
    if (!verification.valid) {
      console.error('Invalid Stripe webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    const event = verification.event;
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await updatePaymentStatus(paymentIntent.id, 'succeeded', paymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        await updatePaymentStatus(failedIntent.id, 'failed', failedIntent);
        break;
        
      case 'charge.refunded':
        const refundedCharge = event.data.object;
        await handleRefundWebhook(refundedCharge.payment_intent, refundedCharge);
        break;
        
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

// PayPal webhook handler
router.post('/webhook/paypal', async (req, res) => {
  const event = req.body;
  
  try {
    // In production, verify PayPal webhook signature here
    
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        const captureId = event.resource.id;
        await updatePaymentStatusByProvider(captureId, 'succeeded', event.resource);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await updatePaymentStatusByProvider(event.resource.id, 'failed', event.resource);
        break;
        
      default:
        console.log(`Unhandled PayPal event: ${event.event_type}`);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('PayPal webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

// PayMongo webhook handler (for GCash, GrabPay)
router.post('/webhook/paymongo', express.raw({ type: 'application/json' }), async (req, res) => {
  const rawBody = req.body && req.body.toString ? req.body.toString('utf8') : '';
  const signature = req.headers['paymongo-signature'] || req.headers['x-paymongo-signature'] || '';

  try {
    // Verify signature if configured
    if (process.env.PAYMONGO_WEBHOOK_SECRET) {
      const verification = paymentProviders.verifyPaymongoWebhook(rawBody, signature);
      if (!verification.valid) {
        console.error('Invalid PayMongo webhook signature:', verification.reason);
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = payload.data;

    if (!event) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    if (event.attributes && event.attributes.type === 'source.chargeable') {
      const sourceData = event.attributes.data || event.attributes;
      const sourceId = sourceData.id;
      // Update provider response and mark payment chargeable
      await updatePaymentStatusByProvider(sourceId, 'chargeable', sourceData);

      // Try to auto-match submitted customer_reference_number with provider metadata (if any)
      const possibleRef = sourceData.data?.reference || sourceData.reference || null;
      if (possibleRef) {
        try {
          const [rows] = await db.promise().query(
            `SELECT p.payment_id, p.booking_id, p.amount, p.currency, p.customer_reference_number
             FROM hotel_payments p
             WHERE p.transaction_reference = ? OR p.customer_reference_number = ?
             LIMIT 1`,
            [sourceId, possibleRef]
          );

          if (rows.length) {
            const p = rows[0];
            // If amounts match, auto-verify (best-effort)
            const providerAmount = (sourceData.amount || sourceData.amount_in_cents || 0) / 100;
            if (Math.abs(Number(p.amount) - providerAmount) < 0.01) {
              await db.promise().query(
                `UPDATE hotel_payments SET customer_reference_number = ?, reference_submitted_at = NOW(), reference_status = 'verified', status = 'succeeded', provider_response = ?, verified_at = NOW(), verified_by = NULL, paid_at = NOW(), updated_at = NOW() WHERE payment_id = ?`,
                [possibleRef, JSON.stringify(sourceData), p.payment_id]
              );
              await db.promise().query(
                `UPDATE hotel_bookings SET payment_status = 'paid', status = 'confirmed', updated_at = NOW() WHERE booking_id = ?`,
                [p.booking_id]
              );
              console.log(`Auto-verified payment ${p.payment_id} via PayMongo webhook (reference match)`);
            }
          }
        } catch (err) {
          console.error('Error attempting auto-verify from PayMongo webhook:', err);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('PayMongo webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Helper function to update payment status
const updatePaymentStatus = async (transactionRef, status, providerData) => {
  try {
    await db.promise().query(
      `UPDATE hotel_payments 
       SET status = ?,
           provider_response = ?,
           updated_at = NOW()
       WHERE transaction_reference = ?`,
      [status, JSON.stringify(providerData), transactionRef]
    );
    
    // Get booking_id for this payment
    const [payments] = await db.promise().query(
      'SELECT booking_id FROM hotel_payments WHERE transaction_reference = ?',
      [transactionRef]
    );
    
    if (payments.length > 0 && status === 'succeeded') {
      await db.promise().query(
        `UPDATE hotel_bookings 
         SET payment_status = 'paid',
             updated_at = NOW()
         WHERE booking_id = ?`,
        [payments[0].booking_id]
      );
    }
  } catch (err) {
    console.error('Error updating payment status:', err);
  }
};

const updatePaymentStatusByProvider = async (providerRef, status, providerData) => {
  try {
    await db.promise().query(
      `UPDATE hotel_payments 
       SET status = ?,
           provider_response = ?,
           updated_at = NOW()
       WHERE JSON_EXTRACT(provider_response, '$.id') = ? OR JSON_EXTRACT(provider_response, '$.order_id') = ?`,
      [status, JSON.stringify(providerData), providerRef, providerRef]
    );
  } catch (err) {
    console.error('Error updating payment by provider ref:', err);
  }
};

const handleRefundWebhook = async (paymentIntentId, refundData) => {
  try {
    await db.promise().query(
      `UPDATE hotel_payments 
       SET status = 'refunded',
           refund_amount = ?,
           provider_response = ?,
           refunded_at = NOW()
       WHERE transaction_reference = ?`,
      [refundData.amount / 100, JSON.stringify(refundData), paymentIntentId]
    );
  } catch (err) {
    console.error('Error handling refund webhook:', err);
  }
};

// 🔵 DEBUG ENDPOINT: Test QRPH/GCash Payment Creation
// This helps diagnose what PayMongo actually returns in sandbox mode
router.post('/debug/test-qrph', async (req, res) => {
  try {
    const testAmount = 100; // PHP 1.00 for testing
    
    console.log('\n🧪 === QRPH DEBUG TEST ===');
    console.log('Testing QRPH payment creation with PayMongo...');
    
    const result = await paymentProviders.processQRPHPayment({
      amount: testAmount,
      currency: 'PHP',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      description: 'QRPH Debug Test'
    });
    
    console.log('✅ QRPH Result:', JSON.stringify(result, null, 2));
    
    return res.json({
      success: true,
      message: 'QRPH test completed',
      result: result,
      environment: {
        PAYMENT_MODE: process.env.PAYMENT_MODE,
        PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY ? 'SET' : 'NOT_SET',
        WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL
      }
    });
  } catch (error) {
    console.error('🔴 QRPH Debug Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// 🔵 DEBUG ENDPOINT: Test GCash Payment Creation
router.post('/debug/test-gcash', async (req, res) => {
  try {
    const testAmount = 100; // PHP 1.00 for testing
    
    console.log('\n🧪 === GCash DEBUG TEST ===');
    console.log('Testing GCash payment creation with PayMongo...');
    
    const result = await paymentProviders.processGCashPayment({
      amount: testAmount,
      currency: 'PHP',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      description: 'GCash Debug Test'
    });
    
    console.log('✅ GCash Result:', JSON.stringify(result, null, 2));
    
    return res.json({
      success: true,
      message: 'GCash test completed',
      result: result,
      environment: {
        PAYMENT_MODE: process.env.PAYMENT_MODE,
        PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY ? 'SET' : 'NOT_SET',
        WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL
      }
    });
  } catch (error) {
    console.error('🔴 GCash Debug Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;
