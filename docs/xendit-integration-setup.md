# Xendit Integration Setup & Testing Guide

## 1. Configure Xendit Webhook Token

### Get Your Webhook Token from Xendit
1. Log in to Xendit Dashboard
2. Go to **Settings** → **Developers** → **API Keys**
3. Find **Webhook Verification Token** (or create one)
4. Copy the token

### Update Your .env File
```bash
XENDIT_WEBHOOK_TOKEN=your_actual_webhook_token_from_xendit_dashboard
```

**Important:** Without this token, webhook signature verification will fail and you won't be able to confirm payments server-to-server.

---

## 2. Configure Xendit Dashboard for Webhooks

### Add Webhook Endpoint
1. In Xendit Dashboard: **Settings** → **Developers** → **Webhooks**
2. Click **Add Webhook Endpoint**
3. Enter webhook URL:
   ```
   https://yourdomain.com/api/payments/webhook/xendit
   ```
   - For **development**: `https://192.168.10.8:3000/api/payments/webhook/xendit`
   - For **production**: Use your actual domain with HTTPS

4. Select these events:
   - ✅ `charge.succeeded` - Payment completed successfully
   - ✅ `charge.failed` - Payment failed
   - ✅ `charge.expired` - Payment link expired (optional)

5. Click **Save**

---

## 3. Test the Complete GCash Payment Flow

### Start Backend Server
```bash
cd backend
npm start
```

### Test Scenario 1: Successful GCash Payment

**Step 1: Create a Booking**
```bash
curl -X POST https://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "hotel_id": 1,
    "room_id": 1,
    "check_in": "2026-08-01",
    "check_out": "2026-08-02",
    "guests": 2
  }'
# Returns: booking_id
```

**Step 2: Start Payment**
```bash
curl -X POST https://localhost:4000/api/payments/start \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 123,
    "method": "gcash",
    "amount": 1250,
    "currency": "PHP"
  }'
# Returns: { checkout_url: "https://checkout.xendit.co/..." }
```

**Step 3: Redirect to Xendit**
- Open the checkout_url in browser
- You'll see Xendit's GCash payment page
- Enter test GCash details (if using Xendit sandbox credentials)

**Step 4: Verify Success**
```bash
# Check booking status
curl https://localhost:4000/api/bookings/123 \
  -H "Authorization: Bearer your_token"
# Should show: payment_status: "paid", status: "confirmed"
```

### Test Scenario 2: Failed GCash Payment

- Same as above but at Xendit payment page, enter invalid GCash details
- You'll be redirected to `/payments/xendit/failed`
- Booking will remain pending (not cancelled) to allow retry

### Test Scenario 3: Cancelled Payment

- At Xendit payment page, click "Cancel" or close
- You'll be redirected to `/payments/xendit/cancel`
- Booking remains pending for retry

---

## 4. Backend Logs to Look For

### Successful Payment Flow
```
📤 Sending GCash payment to Xendit with data: { ... }
✅ Xendit Payment Successful: Booking 123 confirmed
✅ Xendit webhook received and verified: { chargeId, status: "COMPLETED" }
✅ Xendit Payment Confirmed: Booking 123, Amount: 1250 PHP
```

### Webhook Verification Success
```
✅ Xendit webhook received and verified: {...}
200 OK response sent to Xendit
```

### Common Issues to Check
```
🔴 Xendit is not configured
   → Check XENDIT_SECRET_KEY in .env is real key, not placeholder

⚠️  Xendit signature mismatch
   → XENDIT_WEBHOOK_TOKEN may be wrong or webhook body corrupted

⚠️  Missing X-Xendit-Callback-Verification header
   → Xendit didn't send webhook or header was stripped by middleware

🔴 Xendit payment lookup error
   → Transaction reference not stored correctly, check provider_response JSON
```

---

## 5. Database Queries to Verify Payment Status

### Check Payment Status
```sql
SELECT 
  payment_id,
  booking_id,
  method,
  amount,
  status,
  transaction_reference,
  created_at,
  updated_at
FROM hotel_payments
WHERE booking_id = 123
ORDER BY created_at DESC;
```

### Check Booking Status
```sql
SELECT 
  booking_id,
  hotel_id,
  payment_status,
  status,
  check_in,
  check_out,
  created_at
FROM hotel_bookings
WHERE booking_id = 123;
```

Expected after successful payment:
- `payment_status = 'paid'`
- `status = 'confirmed'`

---

## 6. Troubleshooting

### Issue: "Xendit is not configured"
**Solution:** Verify .env has real Xendit credentials, not placeholders
```bash
echo $XENDIT_SECRET_KEY
# Should start with 'xnd_development_' or 'xnd_live_', not 'your_xendit_secret_key_here'
```

### Issue: User redirected but booking status not updated
**Possible cause:** Webhook signature verification failing
**Solution:** 
1. Check XENDIT_WEBHOOK_TOKEN in .env matches Xendit Dashboard
2. Enable backend debug logs: `DEBUG=xendit:* npm start`
3. Check X-Xendit-Callback-Verification header is being sent

### Issue: Payment shows "pending" instead of "paid"
**Possible causes:**
1. Webhook endpoint not configured in Xendit Dashboard
2. Webhook URL is incorrect or not publicly accessible
3. Webhook signature verification failed

**Solution:**
1. Verify webhook URL in Xendit Dashboard
2. Test webhook manually:
   ```bash
   curl -X POST https://localhost:3000/api/payments/webhook/xendit \
     -H "Content-Type: application/json" \
     -H "X-Xendit-Callback-Verification: $(echo -n '{...}' | openssl dgst -sha256 -hmac $XENDIT_WEBHOOK_TOKEN)" \
     -d '{...}'
   ```

### Issue: 403 Forbidden on webhook endpoint
**Solution:** Check if webhook endpoint auth is required
- The webhook endpoint should NOT require authentication
- It verifies authenticity via signature header instead

---

## 7. Security Checklist

- ✅ Xendit credentials in .env (git-ignored)
- ✅ XENDIT_WEBHOOK_TOKEN properly configured
- ✅ Webhook endpoint is HTTPS (required by Xendit)
- ✅ Webhook URL publicly accessible (not behind firewall)
- ✅ X-Xendit-Callback-Verification header verified before processing
- ✅ No secrets printed in logs
- ✅ CORS configured to allow Xendit redirects

---

## 8. Moving to Production

### Switch Credentials
1. Get production Xendit credentials from Xendit
2. Update .env:
   ```bash
   XENDIT_SECRET_KEY=xnd_live_your_production_key
   PAYMENT_MODE=live
   WEBHOOK_BASE_URL=https://youractualdomain.com
   ```

3. Update Xendit Dashboard webhook URL to production domain

### Verify Production Setup
1. Test payment flow in production environment
2. Monitor logs for webhook signature errors
3. Verify payments appear in Xendit Dashboard
4. Test refund functionality if implemented

---

## 9. Testing with Xendit Test Cards

If using Xendit sandbox/development credentials:

**GCash Test Numbers:**
- `09001234567` - Success
- `09987654321` - Failure (varies by Xendit)

Check Xendit documentation for current test numbers.

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/services/paymentProviders.js` | Xendit API integration |
| `backend/controllers/paymentsController.js` | Payment endpoints & webhooks |
| `backend/server.js` | Webhook route configuration |
| `frontend/src/pages/HotelPayment.jsx` | Payment UI |
| `backend/.env` | Xendit credentials |

---

## Support

For issues:
1. Check Xendit dashboard for failed webhooks
2. Review backend logs in terminal
3. Verify webhook signature via manual test
4. Contact Xendit support with webhook request/response details
