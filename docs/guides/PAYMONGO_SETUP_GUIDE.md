# PayMongo Integration Setup Guide

This guide explains how to properly set up PayMongo for real GCash/GrabPay payments and why mock data doesn't work.

## Quick Answer: Why Mock Data Doesn't Work with PayMongo

**Mock data only works when `USE_REAL_PAYMENTS=false`.** When you enable real payments, PayMongo expects:

1. ✅ Real API credentials (Secret Key + Public Key)
2. ✅ Authentication via `Authorization: Basic` header with encoded secret key
3. ✅ Real API calls to PayMongo's servers (not mocked responses)

PayMongo's sandbox is NOT a mock environment - it's a real test server that requires real test credentials.

---

## Step 1: Create a PayMongo Account

1. Go to **https://paymongo.com**
2. Click **Sign Up** (or use Google/Microsoft login)
3. Complete your profile with business information
4. Verify your email address
5. You'll be redirected to the PayMongo Dashboard

---

## Step 2: Get Your Test/Sandbox Credentials

1. In your PayMongo Dashboard, go to **Developers** → **API Keys**
2. You'll see two keys in the **TEST MODE** section:
   - **Secret Key** (starts with `sk_test_`)
   - **Public Key** (starts with `pk_test_`)

> **⚠️ Important:** Keep your Secret Key private! Never commit it to version control.

3. Copy both keys

---

## Step 3: Configure Backend Environment Variables

Update your `.env` file in the `/backend` directory:

```env
# PayMongo Configuration
PAYMONGO_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
PAYMONGO_PUBLIC_KEY=pk_test_YOUR_TEST_PUBLIC_KEY_HERE

# Enable real payment processing
USE_REAL_PAYMENTS=true
PAYMENT_MODE=test

# Webhook base URL (for payment callbacks)
WEBHOOK_BASE_URL=http://localhost:5000

# Frontend URL (where users will be redirected after payment)
FRONTEND_URL=http://localhost:4000
```

---

## Step 4: Configure Frontend Environment Variables

Update `.env` in the `/frontend` directory:

```env
REACT_APP_PAYMONGO_PUBLIC_KEY=pk_test_YOUR_TEST_PUBLIC_KEY_HERE
```

---

## Step 5: Test with PayMongo Test Numbers

PayMongo provides test credentials for the sandbox. Use these in the GCash/GrabPay test environment:

### GCash Test Account
- **Mobile Number:** Any valid Philippine number during testing
- **Amount:** Any amount (test credits used)
- **OTP:** Any 6-digit code during testing

### GrabPay Test Account
- Similar test credentials available in dashboard

> 📖 Full test credentials: https://developers.paymongo.com/docs/testing

---

## Step 6: How Mock vs. Real Payments Work

### When `USE_REAL_PAYMENTS=false` (Mock Mode)
```javascript
// Your payment request returns a simulated response
{
  success: true,
  provider: 'gcash_simulated',
  checkout_url: 'http://localhost:4000/bookings?payment=success'
}
// No actual API call to PayMongo
```

### When `USE_REAL_PAYMENTS=true` (Real Mode)
```javascript
// Your payment request calls PayMongo's real API
const response = await axios.post(
  'https://api.paymongo.com/v1/sources',
  {
    data: {
      attributes: {
        type: 'gcash',
        amount: 50000, // in cents (PHP 500.00)
        currency: 'PHP',
        redirect: { success: '...', failed: '...' }
      }
    }
  },
  {
    headers: {
      'Authorization': `Basic ${base64(PAYMONGO_SECRET_KEY)}`
    }
  }
);
// Returns actual PayMongo checkout URL
```

---

## Step 7: Payment Flow in Your Application

### 1. User Books Hotel
- Fills booking details in HotelDetail.jsx
- Selects GCash as payment method

### 2. Backend Creates Payment
```javascript
POST /api/bookings
→ Creates booking record
→ Calls startPaymentCheckout with payment_method='gcash'
→ Calls processGCashPayment() from paymentProviders.js
```

### 3. Backend Calls PayMongo API
```javascript
// paymentProviders.js → processGCashPayment()
axios.post('https://api.paymongo.com/v1/sources', {...})
// PayMongo responds with:
{
  data: {
    id: 'src_...',
    attributes: {
      redirect: {
        checkout_url: 'https://paymongo.com/checkout/...'
      }
    }
  }
}
```

### 4. User is Redirected to PayMongo
- Frontend receives checkout URL
- User is redirected to PayMongo's GCash page
- User enters GCash/GrabPay credentials

### 5. Payment Success/Failure
- User returns to your app at `/payment-success` page
- Backend updates booking payment status
- Auto-redirect to `/bookings` after 5 seconds

---

## Step 8: Verify Setup with Debug Log

Add temporary logging to verify PayMongo is being called:

```javascript
// backend/services/paymentProviders.js
export const processGCashPayment = async (paymentData) => {
  console.log('🔍 Processing GCash payment...');
  console.log('📌 Using Secret Key:', process.env.PAYMONGO_SECRET_KEY?.substring(0, 10) + '...');
  
  // ... rest of code
};
```

Check the backend console output:
```
🔍 Processing GCash payment...
📌 Using Secret Key: sk_test_1a2b...
```

If you see `undefined` for the secret key, your `.env` is not loaded properly.

---

## Step 9: Common Issues and Solutions

### Issue: "PayMongo is not configured"
**Cause:** `PAYMONGO_SECRET_KEY` is missing or not set
**Solution:** 
- Add `PAYMONGO_SECRET_KEY` to your `.env`
- Restart your backend server with `npm start` or `node server.js`
- Verify the key doesn't have quotes: `sk_test_xxx` (not `'sk_test_xxx'`)

### Issue: "Mock data but expecting real PayMongo"
**Cause:** You're using mock mode but expecting real PayMongo responses
**Solution:**
- Set `USE_REAL_PAYMENTS=true` in `.env`
- Provide real PayMongo credentials
- OR stay in mock mode for testing

### Issue: "Checkout URL is undefined"
**Cause:** PayMongo API call failed or credentials are wrong
**Solution:**
- Verify `PAYMONGO_SECRET_KEY` is correctly set
- Check PayMongo dashboard for API status
- Look for error messages in backend console

### Issue: "Payment redirects but doesn't update booking status"
**Cause:** Backend webhook didn't process the source_id properly
**Solution:**
- Ensure `WEBHOOK_BASE_URL` is accessible
- For local testing, use ngrok: `ngrok http 5000`
- Update `WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io`

---

## Step 10: Transitioning to Live/Production Mode

When ready for real customers:

### 1. Get Production Credentials
- In PayMongo Dashboard, switch to **LIVE MODE**
- Copy your live Secret Key and Public Key

### 2. Update .env
```env
PAYMONGO_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
PAYMONGO_PUBLIC_KEY=pk_live_YOUR_LIVE_PUBLIC_KEY
PAYMENT_MODE=live
USE_REAL_PAYMENTS=true
WEBHOOK_BASE_URL=https://your-production-domain.com
FRONTEND_URL=https://your-production-domain.com
```

### 3. Update Frontend .env
```env
REACT_APP_PAYMONGO_PUBLIC_KEY=pk_live_YOUR_LIVE_PUBLIC_KEY
```

### 4. Test with Real Customers
- Your production server will now process real payments
- No test cards needed

---

## Step 11: Alternative Methods for Testing

### Option A: Keep Mock Mode for Development
```env
USE_REAL_PAYMENTS=false
```
- Faster testing
- No PayMongo credentials needed
- Redirects to `/payment-success` page immediately

### Option B: PayMongo Sandbox (Recommended for realistic testing)
```env
USE_REAL_PAYMENTS=true
PAYMONGO_SECRET_KEY=sk_test_xxx
```
- Tests real API integration
- Helps catch bugs before production
- Use at any time - test credits are free

---

## Success! 🎉

After completing these steps, your payment flow will:

1. ✅ Create bookings
2. ✅ Call PayMongo's real API
3. ✅ Display GCash/GrabPay checkout
4. ✅ Process payments
5. ✅ Show success page with details
6. ✅ Update booking status
7. ✅ Auto-redirect to booking history

---

## Reference Files

- **Backend Payment Service:** `backend/services/paymentProviders.js`
- **Backend Payment Controller:** `backend/controllers/paymentsController.js`
- **Frontend Booking:** `frontend/src/pages/HotelDetail.jsx`
- **Frontend Payment Success:** `frontend/src/pages/PaymentSuccess.jsx`
- **Frontend Bookings:** `frontend/src/pages/BookingHistory.jsx`

---

## Support

- PayMongo Documentation: https://developers.paymongo.com/docs
- Test Credentials: https://developers.paymongo.com/docs/testing
- Dashboard: https://dashboard.paymongo.com/
