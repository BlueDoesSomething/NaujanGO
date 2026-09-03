# Payment Checkout Flow Fix

## Problem
After confirming a booking with external payment methods (PayPal, GCash, Stripe), the system was redirecting directly back to hotels page without processing the actual payment transaction. Users never saw the payment provider's checkout page.

## Root Cause
In `HotelDetail.jsx`, the booking flow was:
1. Create booking with `pay_now: false` for external checkouts
2. Call `startPaymentCheckout` to get checkout URL
3. Set checkout state but then navigate away before redirect

The issue was that after getting the checkout URL, the code was setting state and then immediately navigating to a different page, preventing the payment redirect from happening.

## Solution

### Frontend Changes (`frontend/src/pages/HotelDetail.jsx`)

**Simplified booking flow:**
```javascript
// Create booking with pay_now: false (always for external checkouts)
const bookingResponse = await createHotelBooking({
  ...payload,
  pay_now: false  // Don't mark as paid yet
});

// For external checkouts (PayPal, GCash, Card)
if (isExternalCheckout) {
  // Get checkout URL from payment provider
  const checkoutResponse = await startPaymentCheckout({
    booking_id: bookingId,
    payment_method: bookingForm.paymentMethod,
    amount: totalAmount,
    currency: hotel.currency,
    customer_email: bookingForm.customerEmail,
    customer_phone: bookingForm.customerPhone
  });

  // Redirect to payment provider immediately
  window.location.href = checkoutUrl;
  return;  // Stop here, don't navigate elsewhere
}

// For other payment methods, go to bookings page
navigate('/bookings');
```

### Payment Success Handling (`frontend/src/pages/BookingHistory.jsx`)

**Added payment notification:**
```javascript
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const paymentStatus = params.get('payment');
  const provider = params.get('provider');
  
  if (paymentStatus === 'success') {
    setPaymentNotification({ 
      type: 'success', 
      message: `Payment successful via ${provider}!` 
    });
  } else if (paymentStatus === 'cancelled') {
    setPaymentNotification({ 
      type: 'error', 
      message: 'Payment was cancelled.' 
    });
  }
}, [location.search]);
```

## Payment Flow

### 1. User Books Hotel
```
User fills booking form → Selects payment method (PayPal/GCash/Card)
                       ↓
                  Clicks "Confirm Booking"
```

### 2. Backend Creates Booking & Payment
```
POST /api/bookings/hotels
  → Creates booking record (status: pending, payment_status: unpaid)
  → Creates payment record (status: pending)
  → Returns booking_id
```

### 3. Frontend Initiates Checkout
```
POST /api/payments/checkout
  → Backend calls payment provider API
  → Gets checkout URL from provider
  → Returns checkout_url to frontend
```

### 4. User Completes Payment
```
Frontend redirects to checkout_url
                       ↓
User sees PayPal/GCash/Stripe checkout page
                       ↓
User completes payment
                       ↓
Provider redirects back to: /bookings?payment=success&provider=paypal
```

### 5. Backend Webhook Updates Status
```
Payment provider sends webhook
                       ↓
Backend receives webhook at /api/payments/webhook/{provider}
                       ↓
Updates payment status to 'succeeded'
                       ↓
Updates booking status to 'confirmed'
                       ↓
Updates booking payment_status to 'paid'
```

### 6. User Sees Confirmation
```
User lands on /bookings page
                       ↓
Sees success notification
                       ↓
Can view receipt and booking details
```

## Key Changes

1. **Removed intermediate navigation:** No longer navigates to `/hotels/payment/${bookingId}` for external checkouts
2. **Direct redirect:** Uses `window.location.href` to immediately redirect to payment provider
3. **Simplified flow:** Booking → Payment Checkout → Provider → Success
4. **Better UX:** User sees actual payment provider interface (PayPal, GCash, Stripe)
5. **Success notification:** Clear feedback when payment completes

## Payment Methods

### External Checkout (Redirects to provider)
- **PayPal:** Redirects to PayPal checkout
- **GCash:** Redirects to GCash payment page  
- **Card:** Redirects to Stripe checkout

### Manual Payment (No redirect)
- **Bank Transfer:** Shows bank details, pending status
- **Pay at Property:** Confirmed, pay on arrival

## Testing

1. **Test PayPal checkout:**
   ```
   - Book a hotel
   - Select PayPal
   - Confirm booking
   - Should redirect to PayPal
   - Complete payment
   - Should return to /bookings with success message
   ```

2. **Test GCash checkout:**
   ```
   - Book a hotel
   - Select GCash
   - Confirm booking
   - Should redirect to GCash
   - Complete payment
   - Should return to /bookings with success message
   ```

3. **Test Card checkout:**
   ```
   - Book a hotel
   - Select Credit/Debit Card
   - Confirm booking
   - Should redirect to Stripe
   - Complete payment
   - Should return to /bookings with success message
   ```

## Backend Endpoints

- `POST /api/bookings/hotels` - Create booking
- `POST /api/payments/checkout` - Start payment checkout
- `GET /api/payments/success` - Payment success callback
- `GET /api/payments/cancel` - Payment cancel callback
- `POST /api/payments/webhook/:provider` - Provider webhooks

## Related Files
- `frontend/src/pages/HotelDetail.jsx` - Booking form and checkout initiation
- `frontend/src/pages/BookingHistory.jsx` - Success page with notifications
- `backend/routes/bookings.js` - Booking creation
- `backend/routes/payments.js` - Payment processing and webhooks
