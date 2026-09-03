import Stripe from 'stripe';
import axios from 'axios';
import crypto from 'crypto';

// Initialize payment providers
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// PayPal configuration
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// PayMongo configuration
const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1';

// Xendit configuration
const XENDIT_API_BASE = 'https://api.xendit.co';

/**
 * Get PayPal access token
 */
const getPayPalAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data.access_token;
};

/**
 * Process Stripe payment (Credit/Debit Cards)
 */
export const processStripePayment = async (paymentData) => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to .env');
  }

  const { amount, currency, customerEmail, customerName, description, metadata } = paymentData;

  try {
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      description: description || 'Hotel Booking Payment',
      receipt_email: customerEmail,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      provider: 'stripe',
      transaction_reference: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
      provider_response: {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created
      }
    };
  } catch (error) {
    return {
      success: false,
      provider: 'stripe',
      status: 'failed',
      error: error.message,
      provider_response: {
        error_code: error.code,
        error_message: error.message
      }
    };
  }
};

export const processStripeCheckout = async (paymentData) => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to .env');
  }

  const { amount, currency, description, returnUrl, cancelUrl, customerEmail } = paymentData;
  const normalizedCurrency = String(currency || 'USD').toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: normalizedCurrency,
          unit_amount: Math.round(Number(amount) * 100),
          product_data: {
            name: description || 'Hotel Booking Payment'
          }
        }
      }
    ],
    success_url: returnUrl,
    cancel_url: cancelUrl
  });

  return {
    success: true,
    provider: 'stripe',
    transaction_reference: session.id,
    status: 'pending',
    checkout_url: session.url,
    provider_response: {
      session_id: session.id,
      payment_intent: session.payment_intent
    }
  };
};

/**
 * Process PayPal payment
 */
export const processPayPalPayment = async (paymentData) => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal is not configured. Please add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env');
  }

  const { amount, currency, customerEmail, description, returnUrl, cancelUrl } = paymentData;

  try {
    const accessToken = await getPayPalAccessToken();

    // Create order
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          },
          description: description || 'Hotel Booking Payment'
        }],
        payer: {
          email_address: customerEmail
        },
        application_context: {
          return_url: returnUrl || `${process.env.WEBHOOK_BASE_URL}/payments/paypal/success`,
          cancel_url: cancelUrl || `${process.env.WEBHOOK_BASE_URL}/payments/paypal/cancel`,
          brand_name: 'Naujan Tourism',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const order = response.data;
    const approveLink = order.links.find(link => link.rel === 'approve');

    return {
      success: true,
      provider: 'paypal',
      transaction_reference: order.id,
      status: 'pending',
      approval_url: approveLink?.href,
      provider_response: {
        order_id: order.id,
        status: order.status,
        links: order.links
      }
    };
  } catch (error) {
    return {
      success: false,
      provider: 'paypal',
      status: 'failed',
      error: error.response?.data?.message || error.message,
      provider_response: {
        error: error.response?.data || { message: error.message }
      }
    };
  }
};

/**
 * Capture PayPal payment after approval
 */
export const capturePayPalPayment = async (orderId) => {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const capture = response.data;

    return {
      success: true,
      provider: 'paypal',
      transaction_reference: orderId,
      status: capture.status === 'COMPLETED' ? 'succeeded' : 'pending',
      provider_response: capture
    };
  } catch (error) {
    return {
      success: false,
      provider: 'paypal',
      status: 'failed',
      error: error.response?.data?.message || error.message,
      provider_response: error.response?.data
    };
  }
};

/**
 * Process GCash payment via PayMongo
 */
export const processGCashPayment = async (paymentData) => {
  if (!process.env.PAYMONGO_SECRET_KEY) {
    throw new Error('PayMongo is not configured. Please add PAYMONGO_SECRET_KEY to .env');
  }

  const { amount, currency, customerEmail, customerName, description } = paymentData;

  try {
    const auth = Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString('base64');

    // 🟢 FIXED: PayMongo e-wallet API structure
    const response = await axios.post(
      `${PAYMONGO_API_BASE}/sources`,
      {
        data: {
          attributes: {
            type: 'gcash',  // 🟢 FIXED: PayMongo uses 'type' not 'source_type'
            amount: Math.round(amount * 100), // PayMongo uses cents
            currency: currency || 'PHP',
            description: description || 'GCash Payment',
            redirect: {
              success: `${process.env.WEBHOOK_BASE_URL || 'https://localhost:3000'}/payments/gcash/success`,
              failed: `${process.env.WEBHOOK_BASE_URL || 'https://localhost:3000'}/payments/gcash/failed`
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ GCash PayMongo API Response:', JSON.stringify(response.data, null, 2));

    const source = response.data.data;

    if (!source || !source.attributes) {
      console.error('🔴 Invalid PayMongo response structure - no source.attributes');
      return {
        success: false,
        provider: 'gcash',
        status: 'failed',
        error: 'Invalid response from PayMongo API',
        provider_response: {
          error: 'Missing source attributes in PayMongo response',
          received: response.data
        }
      };
    }

    const checkout_url = source.attributes.redirect?.checkout_url;
    if (!checkout_url) {
      console.error('🔴 No checkout URL in PayMongo response');
      console.error('Response attributes:', source.attributes);
      return {
        success: false,
        provider: 'gcash',
        status: 'failed',
        error: 'No checkout URL from PayMongo',
        provider_response: {
          error: 'Missing checkout_url in redirect',
          attributes: source.attributes
        }
      };
    }

    return {
      success: true,
      provider: 'gcash',
      transaction_reference: source.id,
      status: 'pending',
      checkout_url: checkout_url,
      provider_response: {
        source_id: source.id,
        type: source.attributes.type,
        status: source.attributes.status,
        amount: source.attributes.amount,
        currency: source.attributes.currency
      }
    };
  } catch (error) {
    const errorDetail = error.response?.data?.errors?.[0];
    console.error('🔴 GCash payment error:', {
      message: error.message,
      status: error.response?.status,
      errorDetail: errorDetail,
      fullErrorData: JSON.stringify(error.response?.data, null, 2),
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data ? JSON.parse(error.config?.data) : null
      }
    });
    return {
      success: false,
      provider: 'gcash',
      status: 'failed',
      error: errorDetail?.detail || error.message,
      provider_response: {
        error: error.response?.data || { message: error.message },
        status: error.response?.status,
        errors: error.response?.data?.errors
      }
    };
  }
};

/**
 * Process GrabPay payment via PayMongo
 */
export const processGrabPayPayment = async (paymentData) => {
  if (!process.env.PAYMONGO_SECRET_KEY) {
    throw new Error('PayMongo is not configured. Please add PAYMONGO_SECRET_KEY to .env');
  }

  const { amount, currency, customerEmail, customerName, description } = paymentData;

  try {
    const auth = Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString('base64');

    // 🟢 FIXED: PayMongo e-wallet API structure
    const response = await axios.post(
      `${PAYMONGO_API_BASE}/sources`,
      {
        data: {
          attributes: {
            type: 'grab_pay',  // 🟢 FIXED: PayMongo uses 'type' not 'source_type'
            amount: Math.round(amount * 100),
            currency: currency || 'PHP',
            description: description || 'GrabPay Payment',
            redirect: {
              success: `${process.env.WEBHOOK_BASE_URL || 'https://localhost:3000'}/payments/grabpay/success`,
              failed: `${process.env.WEBHOOK_BASE_URL || 'https://localhost:3000'}/payments/grabpay/failed`
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const source = response.data.data;

    return {
      success: true,
      provider: 'grabpay',
      transaction_reference: source.id,
      status: 'pending',
      checkout_url: source.attributes.redirect.checkout_url,
      provider_response: source
    };
  } catch (error) {
    const errorDetail = error.response?.data?.errors?.[0];
    console.error('🔴 GrabPay payment error - Full Details:', {
      message: error.message,
      status: error.response?.status,
      errorDetail: errorDetail,
      fullResponse: error.response?.data,
      request: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data ? JSON.parse(error.config?.data) : null
      }
    });
    return {
      success: false,
      provider: 'grabpay',
      status: 'failed',
      error: errorDetail?.detail || error.message,
      provider_response: error.response?.data
    };
  }
};

/**
 * Process QRPH payment via PayMongo
 * QRPH is PayMongo's QR code payment method for Philippine payments
 */
export const processQRPHPayment = async (paymentData) => {
  if (!process.env.PAYMONGO_SECRET_KEY) {
    throw new Error('PayMongo is not configured. Please add PAYMONGO_SECRET_KEY to .env');
  }

  const { amount, currency, customerEmail, customerName, description } = paymentData;

  try {
    const auth = Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString('base64');

    // 🟢 PayMongo QRPH API structure
    const response = await axios.post(
      `${PAYMONGO_API_BASE}/sources`,
      {
        data: {
          attributes: {
            type: 'qrph',  // QRPH is PayMongo's QR code payment
            amount: Math.round(amount * 100), // PayMongo uses cents
            currency: currency || 'PHP',
            description: description || 'QRPH Payment',
            redirect: {
              success: `${process.env.WEBHOOK_BASE_URL || 'https://localhost:3000'}/payments/qrph/success`,
              failed: `${process.env.WEBHOOK_BASE_URL || 'https://localhost:3000'}/payments/qrph/failed`
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ QRPH PayMongo API Response:', JSON.stringify(response.data, null, 2));

    const source = response.data.data;

    if (!source || !source.attributes) {
      console.error('🔴 Invalid PayMongo response structure - no source.attributes');
      return {
        success: false,
        provider: 'qrph',
        status: 'failed',
        error: 'Invalid response from PayMongo API',
        provider_response: {
          error: 'Missing source attributes in PayMongo response',
          received: response.data
        }
      };
    }

    const checkout_url = source.attributes.redirect?.checkout_url;
    if (!checkout_url) {
      console.error('🔴 No checkout URL in PayMongo QRPH response');
      console.error('Response attributes:', source.attributes);
      return {
        success: false,
        provider: 'qrph',
        status: 'failed',
        error: 'No checkout URL from PayMongo',
        provider_response: {
          error: 'Missing checkout_url in redirect',
          attributes: source.attributes
        }
      };
    }

    return {
      success: true,
      provider: 'qrph',
      transaction_reference: source.id,
      status: 'pending',
      checkout_url: checkout_url,
      provider_response: {
        source_id: source.id,
        type: source.attributes.type,
        status: source.attributes.status,
        amount: source.attributes.amount,
        currency: source.attributes.currency
      }
    };
  } catch (error) {
    const errorDetail = error.response?.data?.errors?.[0];
    console.error('🔴 QRPH payment error:', {
      message: error.message,
      status: error.response?.status,
      errorDetail: errorDetail,
      fullErrorData: JSON.stringify(error.response?.data, null, 2),
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data ? JSON.parse(error.config?.data) : null
      }
    });
    return {
      success: false,
      provider: 'qrph',
      status: 'failed',
      error: errorDetail?.detail || error.message,
      provider_response: {
        error: error.response?.data || { message: error.message },
        status: error.response?.status,
        errors: error.response?.data?.errors
      }
    };
  }
};

/**
 * Create PayMongo payment intent for cards
 */
export const createPayMongoPaymentIntent = async (paymentData) => {
  if (!process.env.PAYMONGO_SECRET_KEY) {
    throw new Error('PayMongo is not configured');
  }

  const { amount, currency, description, metadata } = paymentData;

  try {
    const auth = Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString('base64');

    const response = await axios.post(
      `${PAYMONGO_API_BASE}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency: currency,
            payment_method_allowed: ['card'],
            description: description || 'Hotel Booking Payment',
            statement_descriptor: 'Naujan Tourism',
            metadata: metadata || {}
          }
        }
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentIntent = response.data.data;

    return {
      success: true,
      provider: 'paymongo',
      payment_intent_id: paymentIntent.id,
      client_key: paymentIntent.attributes.client_key,
      status: paymentIntent.attributes.status,
      provider_response: paymentIntent
    };
  } catch (error) {
    return {
      success: false,
      provider: 'paymongo',
      status: 'failed',
      error: error.response?.data?.errors?.[0]?.detail || error.message,
      provider_response: error.response?.data
    };
  }
};

/**
 * Verify PayMongo webhook signature using HMAC-SHA256
 * PayMongo may send a signature header; we expect a shared secret in PAYMONGO_WEBHOOK_SECRET
 */
export const verifyPaymongoWebhook = (rawBody, signatureHeader) => {
  if (!process.env.PAYMONGO_WEBHOOK_SECRET) {
    return { valid: false, reason: 'PAYMONGO_WEBHOOK_SECRET not configured' };
  }

  try {
    const hmac = crypto.createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET);
    hmac.update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));
    const expected = hmac.digest('hex');

    if (!signatureHeader) return { valid: false, reason: 'Missing signature header' };

    // Signature header may contain multiple parts; do a contains check
    if (signatureHeader.includes(expected) || signatureHeader === expected) {
      return { valid: true };
    }
    return { valid: false, reason: 'Signature mismatch' };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
};

/**
 * Verify Xendit webhook signature using HMAC-SHA256
 * Xendit sends a signature header calculated with XENDIT_WEBHOOK_TOKEN
 */
export const verifyXenditWebhook = (rawBody, signatureHeader) => {
  if (!process.env.XENDIT_WEBHOOK_TOKEN || process.env.XENDIT_WEBHOOK_TOKEN.includes('your_xendit_webhook_token_here')) {
    console.warn('⚠️  XENDIT_WEBHOOK_TOKEN not properly configured - webhook verification will fail');
    return { valid: false, reason: 'XENDIT_WEBHOOK_TOKEN not configured' };
  }

  try {
    // Xendit signs the body with the webhook token
    const hmac = crypto.createHmac('sha256', process.env.XENDIT_WEBHOOK_TOKEN);
    const bodyString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    hmac.update(bodyString);
    const calculatedSignature = hmac.digest('hex');

    if (!signatureHeader) {
      console.warn('⚠️  Missing X-Xendit-Callback-Verification header');
      return { valid: false, reason: 'Missing signature header' };
    }

    // Compare signatures
    if (calculatedSignature === signatureHeader) {
      return { valid: true };
    }
    
    console.warn('⚠️  Xendit signature mismatch', { 
      expected: calculatedSignature.substring(0, 10) + '...', 
      received: signatureHeader.substring(0, 10) + '...' 
    });
    return { valid: false, reason: 'Signature mismatch' };
  } catch (err) {
    console.error('❌ Xendit webhook verification error:', err);
    return { valid: false, reason: err.message };
  }
};

export const processXenditEWallet = async (paymentData) => {
  const { amount, currency, customerName, customerPhone, ewalletType, description } = paymentData;

  // Always use the real Xendit API with provided credentials
  if (!process.env.XENDIT_SECRET_KEY || process.env.XENDIT_SECRET_KEY.includes('your_xendit_secret_key_here')) {
    throw new Error('Xendit is not configured. Please add XENDIT_SECRET_KEY to .env with your real development or production key.');
  }

  try {
    // Generate unique reference ID
    const referenceId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payload = {
      reference_id: referenceId,
      currency: currency,
      amount: amount,
      checkout_method: 'ONE_TIME_PAYMENT',
      channel_code: ewalletType, // PH_GCASH, PH_GRABPAY, etc.
      channel_properties: {
        success_redirect_url: `${process.env.WEBHOOK_BASE_URL || 'https://localhost:3000'}/payments/xendit/success?reference_id=${referenceId}`,
        failure_redirect_url: `${process.env.WEBHOOK_BASE_URL || 'https://localhost:3000'}/payments/xendit/failed?reference_id=${referenceId}`,
        cancel_redirect_url: `${process.env.WEBHOOK_BASE_URL || 'https://localhost:3000'}/payments/xendit/cancel?reference_id=${referenceId}`
      },
      customer: {
        given_names: customerName,
        mobile_number: customerPhone
      },
      metadata: {
        description: description || 'Hotel Booking Payment'
      }
    };

    console.log('📤 Xendit eWallets/charges request:', {
      reference_id: referenceId,
      channel_code: ewalletType,
      amount: amount,
      currency: currency,
      webhook_base_url: process.env.WEBHOOK_BASE_URL
    });

    const response = await axios.post(
      `${XENDIT_API_BASE}/ewallets/charges`,
      payload,
      {
        auth: {
          username: process.env.XENDIT_SECRET_KEY,
          password: ''
        },
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': referenceId  // Prevent duplicate charges
        }
      }
    );

    console.log('📤 Xendit API Response Status:', response.status);
    console.log('📤 Xendit API Response Data:', JSON.stringify(response.data, null, 2));

    // Extract the checkout URL from Xendit's response
    // Try multiple possible response structures
    let checkoutUrl = response.data.actions?.desktop_web_checkout_url 
                   || response.data.actions?.mobile_web_checkout_url
                   || response.data.desktop_web_checkout_url
                   || response.data.mobile_web_checkout_url
                   || response.data.checkout_url;

    if (!checkoutUrl) {
      console.error('❌ No checkout URL found in Xendit response', {
        hasActions: !!response.data.actions,
        actionsKeys: response.data.actions ? Object.keys(response.data.actions) : [],
        topLevelKeys: Object.keys(response.data),
        fullResponse: response.data
      });
      
      return {
        success: false,
        provider: 'xendit',
        status: 'failed',
        error: 'No checkout URL returned from Xendit. Check response structure in logs.',
        provider_response: response.data
      };
    }

    console.log('✅ Xendit checkout URL extracted:', checkoutUrl);

    return {
      success: true,
      provider: 'xendit',
      transaction_reference: response.data.id || referenceId,
      status: response.data.status === 'SUCCEEDED' ? 'succeeded' : 'pending',
      checkout_url: checkoutUrl, // Direct link to Xendit's hosted checkout page
      provider_response: response.data
    };
  } catch (error) {
    // Check if it's a callback URL error
    if (error.response?.status === 404 && error.response?.data?.error_code === 'CALLBACK_URL_NOT_FOUND') {
      console.error('❌ Xendit Callback URL Not Configured', {
        error: error.response.data.message,
        solution: 'Configure webhook callback URLs in Xendit Dashboard: Settings > Developers > Webhooks'
      });
      
      return {
        success: false,
        provider: 'xendit',
        status: 'failed',
        error: 'Xendit webhook callback URL not configured in dashboard. Please add callback URL in Xendit dashboard.',
        error_code: 'CALLBACK_URL_NOT_CONFIGURED',
        provider_response: error.response?.data
      };
    }

    console.error('❌ Xendit API Call Failed:', {
      statusCode: error.response?.status,
      errorCode: error.response?.data?.error_code,
      message: error.message,
      data: error.response?.data
    });

    return {
      success: false,
      provider: 'xendit',
      status: 'failed',
      error: error.response?.data?.message || error.message,
      error_code: error.response?.status,
      provider_response: error.response?.data
    };
  }
};

/**
 * Verify Stripe webhook signature
 */
export const verifyStripeWebhook = (payload, signature) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe webhook verification not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return { valid: true, event };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Refund Stripe payment
 */
export const refundStripePayment = async (paymentIntentId, amount) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });

    return {
      success: true,
      refund_id: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
      provider_response: refund
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      provider_response: { error: error.message }
    };
  }
};

/**
 * Refund PayPal payment
 */
export const refundPayPalPayment = async (captureId, amount, currency) => {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`,
      {
        amount: {
          value: amount.toFixed(2),
          currency_code: currency
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      refund_id: response.data.id,
      status: response.data.status,
      provider_response: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      provider_response: error.response?.data
    };
  }
};

export default {
  processStripePayment,
  processStripeCheckout,
  processPayPalPayment,
  capturePayPalPayment,
  processGCashPayment,
  processGrabPayPayment,
  processQRPHPayment,
  createPayMongoPaymentIntent,
  processXenditEWallet,
  verifyStripeWebhook,
  verifyPaymongoWebhook,
  verifyXenditWebhook,
  refundStripePayment,
  refundPayPalPayment
};
