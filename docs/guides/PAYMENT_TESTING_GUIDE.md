# Payment Testing Guide

## What Was Fixed

The payment checkout flow now properly redirects users to the actual payment provider (PayPal, GCash, Stripe) instead of just going back to the hotels page.

## How to Test

### 1. Start the Application

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Test PayPal Payment

1. Go to http://localhost:4000
2. Login to your account
3. Browse hotels and select one
4. Click "Book Now"
5. Fill in booking details:
   - Check-in date
   - Check-out date
   - Number of guests
   - Number of rooms
6. Select **PayPal** as payment method
7. Click "Confirm Booking"
8. **You should be redirected to PayPal's checkout page**
9. Login with PayPal sandbox account:
   - Email: sb-buyer@personal.example.com (or your sandbox buyer account)
   - Password: (your sandbox password)
10. Complete the payment
11. **You should be redirected back to /bookings with a success message**

### 3. Test GCash Payment

1. Follow steps 1-6 above
2. Select **GCash** as payment method
3. Click "Confirm Booking"
4. **You should be redirected to GCash/PayMongo checkout page**
5. Complete the payment
6. **You should be redirected back to /bookings with a success message**

### 4. Test Card Payment (Stripe)

1. Follow steps 1-6 above
2. Select **Credit/Debit Card** as payment method
3. Enter last 4 digits of card (e.g., "4242")
4. Click "Confirm Booking"
5. **You should be redirected to Stripe checkout page**
6. Use test card: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
7. Complete the payment
8. **You should be redirected back to /bookings with a success message**

### 5. Test Bank Transfer (Manual)

1. Follow steps 1-6 above
2. Select **Bank Transfer** as payment method
3. Click "Confirm Booking"
4. **You should be redirected to /bookings page**
5. Booking status should be "pending"
6. Payment status should be "pending"

### 6. Test Pay at Property

1. Follow steps 1-6 above
2. Select **Pay at Property** as payment method
3. Click "Confirm Booking"
4. **You should be redirected to /bookings page**
5. Booking status should be "pending"
6. Payment status should be "pending"

## Expected Behavior

### External Payments (PayPal, GCash, Card)
✅ User is redirected to payment provider's checkout page  
✅ User completes payment on provider's site  
✅ User is redirected back to /bookings  
✅ Success notification appears  
✅ Booking status is "confirmed"  
✅ Payment status is "paid"  

### Manual Payments (Bank Transfer, Pay at Property)
✅ User stays on the site  
✅ Redirected to /bookings immediately  
✅ Booking status is "pending"  
✅ Payment status is "pending"  
✅ Admin can manually update payment status later  

## Troubleshooting

### Issue: Not redirecting to payment provider
**Solution:** Check browser console for errors. Verify `FRONTEND_URL` in backend `.env` is correct.

### Issue: Payment succeeds but booking not updated
**Solution:** Check backend logs for webhook errors. Verify payment provider webhooks are configured.

### Issue: "Checkout URL not available" error
**Solution:** 
- Check if `USE_REAL_PAYMENTS=true` in backend `.env`
- Verify payment provider API keys are correct
- Check backend console for API errors

### Issue: Redirect loop
**Solution:** Clear browser cache and cookies. Check that `FRONTEND_URL` matches your actual frontend URL.

## Payment Provider Sandbox Accounts

### PayPal Sandbox
- Login: https://www.sandbox.paypal.com/
- Create test accounts: https://developer.paypal.com/dashboard/accounts

### Stripe Test Mode
- Dashboard: https://dashboard.stripe.com/test/dashboard
- Test cards: https://stripe.com/docs/testing

### PayMongo Test Mode
- Dashboard: https://dashboard.paymongo.com/
- Test cards: https://developers.paymongo.com/docs/testing

## Verification Checklist

- [ ] Booking is created in database
- [ ] Payment record is created in database
- [ ] User is redirected to payment provider
- [ ] Payment is completed on provider's site
- [ ] User is redirected back to application
- [ ] Success notification is displayed
- [ ] Booking status is updated to "confirmed"
- [ ] Payment status is updated to "paid"
- [ ] Receipt can be viewed
- [ ] Email confirmation is sent (if configured)

## Database Verification

Check the database to verify payment flow:

```sql
-- Check booking
SELECT * FROM hotel_bookings WHERE booking_id = <your_booking_id>;

-- Check payment
SELECT * FROM hotel_payments WHERE booking_id = <your_booking_id>;

-- Verify status
-- booking.status should be 'confirmed'
-- booking.payment_status should be 'paid'
-- payment.status should be 'succeeded'
```

## Notes

- All external payments use sandbox/test mode by default
- No real money is charged during testing
- Webhook processing may take a few seconds
- If webhook fails, admin can manually update payment status
