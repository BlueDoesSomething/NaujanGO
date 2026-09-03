# PayMongo QRPH Production Guide

## Overview
Your hotel booking system now has **fully integrated PayMongo QRPH** (QR Phone) payment method. This guide shows you how to configure it for **production (live)** use.

---

## What is QRPH?
**QRPH** is PayMongo's QR code payment method designed for Philippine e-wallet payments. Users can pay by scanning a QR code displayed in your checkout page.

---

## Current Implementation Status

### ✅ Backend Completed
- `processQRPHPayment()` function in `backend/services/paymentProviders.js`
- QRPH success/failed redirect handlers in `backend/controllers/paymentsController.js`
- PayMongo webhook support for QRPH transactions
- Database integration for QRPH payment tracking

### ✅ Frontend Completed
- QRPH payment method selector in checkout pages
- Security badge for PayMongo QRPH
- User-friendly QR payment UI
- Transaction status tracking

### ✅ Payment Flow
```
1. User selects QRPH at checkout
2. Backend calls PayMongo QRPH API
3. PayMongo returns QR code checkout URL
4. User scans QR and completes payment
5. PayMongo webhook confirms payment
6. Booking marked as paid and confirmed
```

---

## Configuration Steps for Production

### Step 1: Get Production PayMongo API Keys

1. Log in to **PayMongo Dashboard** → https://dashboard.paymongo.com
2. Go to **Settings** → **Developers** → **API Keys**
3. Switch to **Live Mode** (toggle at top right)
4. Copy:
   - **Live Secret Key** (starts with `sk_live_`)
   - **Live Public Key** (starts with `pk_live_`)

### Step 2: Update .env for Production

Edit `backend/.env`:

```env
# PayMongo Production Keys (LIVE MODE)
PAYMONGO_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
PAYMONGO_PUBLIC_KEY=pk_live_YOUR_LIVE_PUBLIC_KEY_HERE

# Set to live mode
PAYMENT_MODE=live

# Production webhook base URL (your live domain)
WEBHOOK_BASE_URL=https://yourdomain.com

# Frontend URL for redirects
FRONTEND_URL=https://yourdomain.com
```

### Step 3: Configure PayMongo Webhooks (IMPORTANT)

1. In **PayMongo Dashboard**: Settings → Developers → **Webhooks**
2. Click **Add Webhook**
3. Enter webhook URL:
   ```
   https://yourdomain.com/api/payments/webhook/paymongo
   ```
4. Select events:
   - ✅ `source.chargeable`
   - ✅ `charge.succeeded`
   - ✅ `charge.failed`
5. Click **Create**

**Important:** Webhooks confirm payment status. Without webhooks, payments will stay as "pending".

### Step 4: Enable QRPH for Your Hotels

In **Owner Dashboard**:
1. Go to your hotel
2. Edit payment methods
3. ✅ Check **QR Phone (QRPH)**
4. Save

**Alternative:** Set in database:
```sql
UPDATE hotels 
SET allowed_payment_methods = 'card,gcash,grabpay,qrph,paypal,bank_transfer,pay_at_property'
WHERE hotel_id = YOUR_HOTEL_ID;
```

### Step 5: Deploy to Production

1. Push code to production server
2. Restart Node.js server
3. Clear browser cache
4. Test with real PayMongo credentials

---

## Testing QRPH in Production

### Test Payment Flow
1. Book a hotel, select **QR Phone** at checkout
2. You'll see a QR code on the page
3. Scan with **PayMongo test app** or real e-wallet
4. Complete the payment
5. Check if payment status updates to "paid"

### Verify Webhook Processing
1. Check server logs: `WEBHOOK_BASE_URL/api/payments/webhook/paymongo`
2. Look for webhook signature verification logs
3. Confirm payment record updates in database

---

## Troubleshooting

### Problem: QRPH payment shows "No checkout URL"
**Solution:**
- Verify `PAYMONGO_SECRET_KEY` is correct for live mode
- Check PayMongo Dashboard for API errors
- Ensure payment method is enabled for the hotel

### Problem: Payment stays "pending" after scanning QR
**Solution:**
- Verify webhook URL is configured correctly
- Check if webhook is registered in PayMongo Dashboard
- Look at server logs for webhook errors
- Test webhook with PayMongo's webhook tester

### Problem: "Unauthorized" error during payment
**Solution:**
- Verify `PAYMONGO_PUBLIC_KEY` is live key
- Check that keys have correct permissions in PayMongo

### Problem: Redirect fails after payment
**Solution:**
- Verify `WEBHOOK_BASE_URL` and `FRONTEND_URL` are correct
- Ensure HTTPS is enabled on production server
- Check browser console for redirect errors

---

## Production Checklist

- [ ] PayMongo account switched to **Live Mode**
- [ ] Production API keys added to `.env`
- [ ] `PAYMENT_MODE=live` set in `.env`
- [ ] Webhook URL configured in PayMongo Dashboard
- [ ] QRPH enabled for your hotels
- [ ] Code deployed to production server
- [ ] HTTPS certificate valid for domain
- [ ] Test payment completed successfully
- [ ] Webhook events received and processed
- [ ] Payment status updated to "paid"
- [ ] Booking status updated to "confirmed"

---

## Payment Status Tracking

### QRPH Payment Lifecycle

```
User initiates payment
         ↓
PayMongo generates QR code (status: pending)
         ↓
User scans QR → completes payment
         ↓
PayMongo webhook → backend receives notification
         ↓
Backend updates payment to "succeeded" + booking to "paid"
         ↓
User redirected to payment success page
```

### Database Query to Check Payment Status

```sql
SELECT p.*, b.booking_id, b.status
FROM hotel_payments p
JOIN hotel_bookings b ON p.booking_id = b.booking_id
WHERE p.provider = 'qrph'
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## Security Features

✅ **Webhook Signature Verification** - Validates PayMongo server authenticity  
✅ **API Key Encryption** - Keys stored in `.env` (git-ignored)  
✅ **Transaction Reference Tracking** - Links payments to bookings  
✅ **Amount Validation** - Prevents amount tampering  
✅ **Redirect URL Validation** - Prevents phishing attacks  

---

## Support & Resources

- **PayMongo Docs:** https://developers.paymongo.com
- **QRPH Docs:** https://developers.paymongo.com/reference/qrph
- **Webhook Guide:** https://developers.paymongo.com/docs/webhooks

---

## Production Deployment Tips

### 1. SSL/HTTPS Certificate
- Ensure valid HTTPS certificate
- PayMongo requires HTTPS for webhooks

### 2. Server Uptime
- Use monitoring service to check server availability
- Set up alerts for payment failures

### 3. Rate Limiting
- PayMongo has rate limits
- Monitor API response codes
- Implement retry logic for failed requests

### 4. Logging
- Log all PayMongo API requests/responses
- Monitor webhook processing logs
- Track payment status changes

### 5. Monitoring
```bash
# Check if webhook endpoint is accessible
curl -X POST https://yourdomain.com/api/payments/webhook/paymongo \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## Next Steps

1. ✅ Get live PayMongo credentials
2. ✅ Update `.env` with production keys
3. ✅ Configure webhook in PayMongo Dashboard
4. ✅ Deploy to production
5. ✅ Test QRPH payment flow
6. ✅ Monitor webhook processing
7. ✅ Handle payments & refunds in dashboard

---

## Questions or Issues?

Review logs at: `backend/logs/payments.log`  
Check PayMongo Dashboard for API errors  
Test webhook at: https://webhook.site (temporary testing)

**You're all set! QRPH is now ready for live payments.** 🚀

