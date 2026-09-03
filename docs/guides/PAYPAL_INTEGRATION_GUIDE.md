# PayPal Integration Guide

## ✅ PayPal Configuration Complete

Your PayPal credentials have been successfully configured in the system.

### Credentials Status
- **Client ID**: `ARaOKmktmsCGGaLC794X`
- **Secret**: Configured ✓
- **Mode**: Sandbox (Testing)
- **Status**: Ready to use

## How PayPal Integration Works

### 1. Backend Configuration
The PayPal credentials are stored in `backend/.env`:
```env
PAYPAL_CLIENT_ID=ARaOKmktmsCGGaLC794X
PAYPAL_CLIENT_SECRET=[YOUR_SECRET]
PAYPAL_MODE=sandbox
```

### 2. Frontend Configuration
The PayPal Client ID is also in `frontend/.env`:
```env
VITE_PAYPAL_CLIENT_ID=ARaOKmktmsCGGaLC794X
VITE_PAYPAL_MODE=sandbox
```

## Payment Flow

### When a User Selects PayPal Payment:

1. **User initiates booking** with PayPal as payment method
2. **Backend creates PayPal order** using the PayPal API
3. **User is redirected** to PayPal to approve the payment
4. **After approval**, user returns to your site
5. **Backend captures the payment** and confirms booking
6. **Confirmation** is shown to the user

## API Endpoints

### Create Payment
```http
POST /payments/process
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "booking_id": 123,
  "amount": 2500.00,
  "currency": "PHP",
  "method": "paypal",
  "customer_email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "payment_id": 456,
  "transaction_reference": "TXN-1234567890-ABCD1234",
  "checkout_url": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "status": "pending"
}
```

### PayPal Callback Endpoints
- **Success**: `/payments/paypal/success?token={order_id}`
- **Cancel**: `/payments/paypal/cancel?token={order_id}`
- **Webhook**: `/payments/webhook/paypal` (for PayPal notifications)

## Testing PayPal Integration

### Option 1: Using Real PayPal Sandbox

1. **Create PayPal Sandbox Account**:
   - Go to https://developer.paypal.com/
   - Create test buyer and seller accounts

2. **Use Sandbox Test Credentials**:
   - **Buyer Email**: Use a sandbox buyer account
   - **Password**: From PayPal Developer Dashboard

3. **Test Payment Flow**:
   ```bash
   # The system is already configured
   # Just make a booking and select PayPal
   ```

### Option 2: Simulated Mode (Current)

If `USE_REAL_PAYMENTS=false` in backend/.env:
- Payments are simulated
- No actual PayPal API calls
- Perfect for UI testing

## Enable Live PayPal Payments

To use real PayPal API calls:

1. **Update backend/.env**:
```env
USE_REAL_PAYMENTS=true
# or
PAYMENT_MODE=live
```

2. **Restart backend server**:
```bash
cd backend
npm start
```

## PayPal Sandbox Testing

### Test Credit Cards (PayPal Sandbox)
PayPal provides test cards for sandbox:

**Visa:**
- Card: 4032 0343 4356 5794
- Exp: Any future date
- CVV: Any 3 digits

**Mastercard:**
- Card: 5425 2334 3010 9903
- Exp: Any future date
- CVV: Any 3 digits

### Test PayPal Accounts
Create at: https://developer.paypal.com/dashboard/accounts

**Buyer Account:**
- Email: buyer@personal.example.com (you create this)
- Password: Set in PayPal Developer Dashboard

## Frontend PayPal Integration

The Hotels.js page already supports PayPal:

```javascript
// User selects PayPal as payment method
<option value="paypal">PayPal</option>

// Payment processing
const response = await axios.post('/payments/process', {
  booking_id: bookingId,
  amount: totalAmount,
  currency: 'PHP',
  method: 'paypal',
  customer_email: user.email
});

// Redirect to PayPal
if (response.data.checkout_url) {
  window.location.href = response.data.checkout_url;
}
```

## Backend PayPal Processing

The system uses PayPal REST API v2:

```javascript
// paymentProviders.js handles:
1. Get OAuth access token
2. Create order
3. Capture payment
4. Handle webhooks
```

## Webhook Setup (Production)

For production, configure PayPal webhooks:

1. **Go to PayPal Developer Dashboard**
2. **Select your app**
3. **Add webhook URL**: `https://yourdomain.com/payments/webhook/paypal`
4. **Select events**:
   - PAYMENT.CAPTURE.COMPLETED
   - PAYMENT.CAPTURE.DENIED
   - PAYMENT.CAPTURE.REFUNDED

## Supported PayPal Features

✅ **Currently Implemented:**
- PayPal order creation
- Payment capture
- Return URL handling
- Webhook processing
- Currency conversion (PHP, USD, EUR)
- Transaction tracking

🔜 **Future Enhancements:**
- PayPal Express Checkout button
- PayPal Credit
- Recurring payments/subscriptions
- Refund processing UI
- Enhanced fraud detection

## Payment Methods Comparison

| Method | Provider | Processing Time | Fees |
|--------|----------|----------------|------|
| **PayPal** | PayPal | Instant | ~3.9% + ₱15 |
| Card | Stripe | Instant | ~3.4% + ₱15 |
| GCash | PayMongo | Instant | ~2.5% |
| Bank Transfer | Manual | 1-3 days | Free |
| At Property | Manual | On arrival | Free |

## Troubleshooting

### Issue: "PayPal is not configured"
**Solution**: Check that credentials are in backend/.env

### Issue: Redirect URL not working
**Solution**: Ensure WEBHOOK_BASE_URL is correct in .env

### Issue: Payment not captured
**Solution**: Check PayPal dashboard for order status

### Issue: Sandbox payments failing
**Solution**: 
- Verify you're using sandbox credentials
- Check PAYPAL_MODE=sandbox
- Use PayPal test accounts

## Security Best Practices

1. **Never expose the Secret** in frontend code
2. **Always verify webhook signatures** in production
3. **Use HTTPS** for all payment endpoints
4. **Validate all amounts** server-side
5. **Log all transactions** for audit trail
6. **Set up fraud monitoring** in PayPal dashboard

## Testing Checklist

- [ ] PayPal credentials configured in .env
- [ ] Backend server restarted
- [ ] Make a test booking
- [ ] Select PayPal as payment method
- [ ] Redirected to PayPal sandbox
- [ ] Login with test account
- [ ] Approve payment
- [ ] Redirected back to confirmation
- [ ] Booking status = confirmed
- [ ] Payment record created in database
- [ ] Transaction reference generated

## Production Deployment

### Before Going Live:

1. **Get Production Credentials**:
   - Go to https://developer.paypal.com/
   - Create a Live app
   - Get production Client ID and Secret

2. **Update .env**:
```env
PAYPAL_CLIENT_ID=[your_live_client_id]
PAYPAL_CLIENT_SECRET=[your_live_client_secret]
PAYPAL_MODE=live
USE_REAL_PAYMENTS=true
```

3. **Test thoroughly** in sandbox first!

4. **Configure webhooks** with production URL

5. **Monitor transactions** in PayPal dashboard

## Support Resources

- **PayPal Developer Docs**: https://developer.paypal.com/docs/
- **PayPal API Reference**: https://developer.paypal.com/api/rest/
- **Sandbox Dashboard**: https://developer.paypal.com/dashboard/
- **Integration Support**: https://developer.paypal.com/support/

## Contact Information

For issues with PayPal integration:
1. Check this guide
2. Review PayPal Developer documentation
3. Check server logs in `backend/server.js`
4. Verify webhook logs in PayPal dashboard

---

**Status**: ✅ PayPal Integration Ready
**Last Updated**: February 5, 2026
**Environment**: Sandbox (Testing)
