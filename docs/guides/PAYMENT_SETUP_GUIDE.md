# Real Payment Integration Setup Guide

## Overview
This guide will help you integrate real payment providers (Stripe, PayPal, GCash via PayMongo/Xendit) into your hotel booking system.

## Prerequisites
- Node.js installed
- Backend server running
- Database configured
- Payment provider accounts created

## Step 1: Install Required Dependencies

```bash
cd backend
npm install stripe
```

The Stripe package is already added to package.json. Other providers (PayPal, PayMongo, Xendit) use REST APIs via axios (already installed).

## Step 2: Create Payment Provider Accounts

### A. Stripe (for Credit/Debit Cards)
1. Go to https://stripe.com
2. Sign up for a free account
3. Navigate to Developers → API keys
4. Copy your **Secret key** (starts with `sk_test_` for test mode)
5. Copy your **Publishable key** (starts with `pk_test_`)
6. Go to Developers → Webhooks
7. Add endpoint: `https://yourdomain.com/payments/webhook/stripe`
8. Copy the **Signing secret** (starts with `whsec_`)

### B. PayPal
1. Go to https://developer.paypal.com
2. Sign in and go to Dashboard
3. Create an app (My Apps & Credentials → Create App)
4. Choose **Merchant** app type
5. Copy **Client ID** and **Secret**
6. For testing, use **Sandbox** credentials
7. For production, switch to **Live** credentials

### C. PayMongo (for GCash in Philippines)
1. Go to https://paymongo.com
2. Sign up for an account
3. Complete business verification
4. Go to Developers → API Keys
5. Copy **Secret Key** (starts with `sk_test_`)
6. Copy **Public Key** (starts with `pk_test_`)
7. Set up webhooks for payment confirmations

### D. Xendit (Alternative for Philippines)
1. Go to https://dashboard.xendit.co/register
2. Sign up and verify your account
3. Go to Settings → API Keys
4. Copy your **Secret API Key**
5. Generate **Webhook Verification Token**

## Step 3: Configure Environment Variables

1. Copy the example file:
```bash
cd backend
cp .env.payment.example .env
```

2. Edit `.env` file and add your keys:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51AbCdEfGh...
STRIPE_PUBLISHABLE_KEY=pk_test_51IjKlMn...
STRIPE_WEBHOOK_SECRET=whsec_xyz123...

# PayPal Configuration
PAYPAL_CLIENT_ID=AaBbCcDdEeFfGg...
PAYPAL_CLIENT_SECRET=EHhIiJjKkLlMm...
PAYPAL_MODE=sandbox

# PayMongo Configuration (Philippines)
PAYMONGO_SECRET_KEY=sk_test_abcd1234...
PAYMONGO_PUBLIC_KEY=pk_test_efgh5678...

# Xendit Configuration (Optional)
XENDIT_SECRET_KEY=xnd_development_abc123...
XENDIT_WEBHOOK_TOKEN=xyz789...

# Payment Mode
USE_REAL_PAYMENTS=true
PAYMENT_MODE=sandbox

# Webhook Base URL
WEBHOOK_BASE_URL=https://yourdomain.com
```

## Step 4: Test Payment Integration

### Testing in Sandbox Mode

#### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Auth Required: 4000 0025 0000 3155
```

#### PayPal Test Accounts
Use PayPal sandbox accounts from your Developer Dashboard

#### PayMongo/GCash Test
Use test mode in PayMongo dashboard

## Step 5: Run Database Migration

```bash
cd backend
node run_migration_006.js
```

This creates the `hotel_payments` table with all necessary fields.

## Step 6: Update Frontend Environment

Create or update `frontend/.env`:

```bash
# Add Stripe publishable key for client-side
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51...

# Add PayMongo public key
REACT_APP_PAYMONGO_PUBLIC_KEY=pk_test_...
```

## Step 7: Start the Server

```bash
cd backend
npm start
```

The server will now use real payment providers when `USE_REAL_PAYMENTS=true`

## Payment Flow for Each Method

### 1. Credit/Debit Card (Stripe)

**Server-side:**
- Creates PaymentIntent on Stripe
- Returns `client_secret` to frontend
- Frontend uses Stripe.js to confirm payment
- Webhook confirms success/failure

**Frontend Integration:**
```javascript
// Install Stripe.js
npm install @stripe/stripe-js @stripe/react-stripe-js

// Use in component
import { loadStripe } from '@stripe/stripe-js';
const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Confirm payment with client_secret from server
const result = await stripe.confirmCardPayment(client_secret);
```

### 2. GCash (PayMongo)

**Flow:**
1. Server creates GCash source
2. Returns `checkout_url`
3. Redirect user to PayMongo GCash page
4. User completes payment on their phone
5. Webhook notifies server of success
6. Redirect user back to success page

### 3. PayPal

**Flow:**
1. Server creates PayPal order
2. Returns `approval_url`
3. Redirect user to PayPal login
4. User approves payment
5. PayPal redirects back with order_id
6. Server captures payment
7. Webhook confirms completion

### 4. Bank Transfer

**Flow:**
1. Server generates bank details
2. Display instructions to user
3. User transfers manually
4. Admin marks payment as received
5. Booking confirmed

## Webhook Setup

### Stripe Webhooks
```bash
# Test webhooks locally with Stripe CLI
stripe listen --forward-to localhost:3000/payments/webhook/stripe

# In production, add webhook in Stripe Dashboard:
https://yourdomain.com/payments/webhook/stripe

# Events to listen for:
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
```

### PayPal Webhooks
```bash
# Add webhook in PayPal Dashboard:
https://yourdomain.com/payments/webhook/paypal

# Events:
- PAYMENT.CAPTURE.COMPLETED
- PAYMENT.CAPTURE.DENIED
```

### PayMongo Webhooks
```bash
# Add in PayMongo Dashboard:
https://yourdomain.com/payments/webhook/paymongo

# Events:
- source.chargeable
- payment.paid
- payment.failed
```

## Testing the Integration

### 1. Test Card Payment
```bash
# Use Stripe test card
curl -X POST http://localhost:3000/payments/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "payment_method": "card",
    "amount": 3500,
    "currency": "PHP",
    "customer_email": "test@example.com"
  }'
```

### 2. Test GCash Payment
```bash
curl -X POST http://localhost:3000/payments/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "payment_method": "gcash",
    "amount": 3500,
    "currency": "PHP",
    "customer_email": "test@example.com",
    "customer_name": "John Doe"
  }'

# Response includes checkout_url - redirect user there
```

### 3. Test PayPal Payment
```bash
curl -X POST http://localhost:3000/payments/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "payment_method": "paypal",
    "amount": 3500,
    "currency": "PHP",
    "customer_email": "test@example.com"
  }'

# Response includes approval_url - redirect user there
```

## Security Best Practices

1. **Never expose secret keys in frontend**
   - Only use publishable/public keys in React
   - Keep secret keys in backend .env only

2. **Verify webhook signatures**
   - Always verify webhooks are from the real provider
   - Use provided signature verification methods

3. **Use HTTPS in production**
   - All payment APIs require HTTPS
   - Set up SSL certificate for your domain

4. **Validate amounts**
   - Always verify payment amount matches booking
   - Check currency is correct

5. **Log everything**
   - Log all payment attempts
   - Store provider responses for auditing

## Going Live (Production)

### 1. Switch to Live Mode
```bash
# Update .env
PAYMENT_MODE=live
PAYPAL_MODE=live

# Use live API keys
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_ID=<live_client_id>
```

### 2. Complete Provider Verification
- **Stripe**: Activate account (provide business details)
- **PayPal**: Complete merchant verification
- **PayMongo**: Submit business documents

### 3. Update Webhook URLs
Replace localhost URLs with your production domain

### 4. Test in Production
Use small real amounts to test end-to-end flow

## Troubleshooting

### "Stripe is not configured" error
- Check STRIPE_SECRET_KEY in .env
- Restart server after adding keys

### "PayPal authentication failed"
- Verify CLIENT_ID and CLIENT_SECRET
- Check PAYPAL_MODE (sandbox vs live)

### GCash payment not working
- Ensure PAYMONGO_SECRET_KEY is set
- Verify account is activated for GCash
- Check webhook is receiving events

### Webhooks not firing
- Use ngrok for local testing: `ngrok http 3000`
- Add ngrok URL as webhook endpoint
- Check webhook logs in provider dashboard

## Support

### Stripe Support
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

### PayPal Support
- Docs: https://developer.paypal.com/docs
- Support: https://developer.paypal.com/support

### PayMongo Support
- Docs: https://developers.paymongo.com
- Email: support@paymongo.com

## Cost Overview

### Stripe
- 3.4% + ₱15 per successful card charge (Philippines)
- No setup or monthly fees

### PayPal
- 3.9% + fixed fee per transaction
- No monthly fees

### PayMongo
- 3.5% + ₱15 per successful transaction
- GCash: 2.5% + ₱15

### Xendit
- Custom pricing based on volume
- Contact sales for rates

## Next Steps

1. Set up payment provider accounts
2. Add API keys to .env
3. Test in sandbox mode
4. Implement frontend payment confirmation UI
5. Set up webhooks
6. Test thoroughly
7. Go live!
