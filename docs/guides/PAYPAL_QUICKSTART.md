# PayPal Quick Start Guide

## ✅ Configuration Complete!

Your PayPal credentials have been configured and are ready to use.

## Quick Test (5 minutes)

### 1. Test PayPal Connection
```bash
cd backend
node test_paypal.js
```

This will verify:
- ✓ Credentials are valid
- ✓ Can authenticate with PayPal
- ✓ Can create orders
- ✓ API is accessible

### 2. Restart Backend Server
```bash
# Stop current server (Ctrl+C)
npm start
```

### 3. Test on Website
1. Go to Hotels page
2. Select a hotel and click "Book Now"
3. Fill in booking details
4. Select **PayPal** as payment method
5. Click "Confirm Booking & Pay"
6. You'll be redirected to PayPal sandbox

### 4. Complete Payment
**Sandbox Test Account:**
- Create at: https://developer.paypal.com/dashboard/accounts
- Or use PayPal's test cards directly

## Payment Methods in Your System

| Method | Status | Notes |
|--------|--------|-------|
| 💳 **Card** | Configured | Via Stripe (needs setup) |
| 🅿️ **PayPal** | ✅ **READY** | Sandbox mode active |
| 📱 **GCash** | Configured | Via PayMongo (needs setup) |
| 🏦 **Bank Transfer** | Active | Manual verification |
| 🏨 **Pay at Hotel** | Active | No online payment |

## Current PayPal Settings

```
Environment: Sandbox (Test Mode)
Client ID: ARaOKmktmsCGGaLC794X
Mode: Testing
Currency: PHP (Philippine Peso)
```

## Making a Test Payment

### What happens:
1. User selects PayPal → Creates PayPal order
2. Redirects to PayPal → User logs in and approves
3. Returns to your site → Payment is captured
4. Booking confirmed → Email sent (if configured)

### Test Flow:
```
[Hotel Booking Page]
        ↓
[Select PayPal Payment]
        ↓
[Redirect to PayPal Sandbox]
        ↓
[Login with Test Account]
        ↓
[Approve Payment]
        ↓
[Return to Confirmation Page]
        ↓
[Booking Confirmed! 🎉]
```

## Switching to Production

When ready for real payments:

### 1. Get Live Credentials
- Go to https://developer.paypal.com/
- Create a "Live" app (not sandbox)
- Copy Live Client ID and Secret

### 2. Update backend/.env
```env
PAYPAL_CLIENT_ID=[your_live_client_id]
PAYPAL_CLIENT_SECRET=[your_live_client_secret]
PAYPAL_MODE=live
USE_REAL_PAYMENTS=true
```

### 3. Test thoroughly first!

## Troubleshooting

### "PayPal is not configured"
✅ **Fixed!** Credentials are now in backend/.env

### Can't redirect to PayPal
- Check backend server is running
- Verify PAYPAL_MODE=sandbox in .env
- Check browser console for errors

### Payment not completing
- Ensure you approve payment in PayPal
- Check return URLs are accessible
- Review backend logs

## Files Updated

✅ **Backend:**
- `backend/.env` - PayPal credentials added
- `backend/services/paymentProviders.js` - Already configured
- `backend/routes/payments.js` - PayPal routes ready

✅ **Frontend:**
- `frontend/.env` - PayPal Client ID added
- `frontend/src/pages/Hotels.js` - PayPal option available

✅ **Documentation:**
- `PAYPAL_INTEGRATION_GUIDE.md` - Complete guide
- `PAYPAL_QUICKSTART.md` - This file

## Test Script

Run anytime to verify configuration:
```bash
cd backend
node test_paypal.js
```

## Support

For PayPal integration issues:
1. Check `PAYPAL_INTEGRATION_GUIDE.md`
2. Run `test_paypal.js` diagnostic
3. Check PayPal developer dashboard
4. Review server logs

## Next Steps

1. ✅ Run test script: `node backend/test_paypal.js`
2. ✅ Restart backend server
3. ✅ Make a test booking with PayPal
4. ✅ Verify payment in PayPal dashboard
5. ⏭️ Configure Stripe for card payments (optional)
6. ⏭️ Configure PayMongo for GCash (optional)

---

**Status**: ✅ PayPal Integration Active
**Environment**: Sandbox (Testing)
**Ready**: Yes - Start Testing Now!
