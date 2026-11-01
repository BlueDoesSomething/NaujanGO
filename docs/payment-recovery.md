# PayMongo return verification and interrupted checkout recovery

## Guest behavior

Returning from PayMongo is **not** proof of payment. The `/payment-success`
route is retained for compatibility, but it is now a return/status page:

- **Payment received** appears only for a server-confirmed succeeded payment.
  Partial payments show the remaining balance; payment receipt does not promise
  a confirmed room if the reservation needs staff review.
- Backing out of an unpaid checkout shows **Payment not completed**, not success.
  PayMongo's cancel URL only returns the browser; it does not cancel the session
  or the hotel reservation.
- An unavailable gateway/network leaves the result **unverified/pending**. It
  does not manufacture a success, failure, or another received payment.
- Missing booking IDs do not fall back to an unrelated payment in user history.
  The guest opens the correct booking instead.

In **Booking History**, an eligible unpaid reservation has **Resume payment**
(or Complete payment / Pay balance) and **Check payment status**. QR PH recovery
first checks the current provider session, then reuses that session's checkout
URL. Browser sessionStorage is no longer trusted as a ready-to-pay session.
This works after a lost response, page reload, or later sign-in on another
device: the payment attempt belongs to the booking in the database.

If money was deducted, the guest should check payment status before retrying.
The return page preserves an explicit **Money was deducted and I have a receipt**
reference-submission option. That requests merchant review; it never marks money
received on its own. Pending reference review blocks another QR payment.

Cancelled/archived/expired reservations cannot be paid again through this flow.
The existing reservation hold/deadline still applies; leaving checkout does not
create another reservation, extend the hold, or automatically cancel it. A late
verified payment is recorded but does **not** revive an expired/cancelled room
reservation. Staff must reconcile room availability and the guest's funds.

## Server safeguards (hosted QR PH)

- `POST /api/payments/checkout` and the legacy `/process` QR PH path use the same
  booking-locked start/resume service, with server-side amounts, currency, hotel
  method settings, ownership, and reservation-state checks.
- Creating an attempt stores a `processing` payment record with `paid_at = NULL`
  and a random idempotency key **before** contacting PayMongo. Amounts and return
  URLs are taken from the stored booking/configuration, not the client origin.
- A lost gateway response is retried with the **same recorded request body and
  idempotency key**, not a fresh attempt. Simultaneous clicks are blocked while
  creation is in progress. Ambiguous attempts older than 23 hours require staff
  reconciliation rather than reusing a key after PayMongo's 24-hour expiry.
- An active unpaid session is reused. Only a provider-confirmed terminal session
  may be replaced with a new attempt. Multiple legacy active sessions or a quote
  mismatch are blocked for reconciliation; no history is deleted or merged.
- `GET /api/payments/booking/:bookingId/status` requires the booking's logged-in
  guest, is rate-limited and private/no-store, and retrieves PayMongo's current
  Checkout Session using the server's secret key. A paid payment object must
  match the stored attempt's amount, currency, booking, and environment.
- Updates lock the booking/payment rows. Replayed paid webhooks do not insert
  another payment or add its amount twice. Delayed failure events cannot replace
  a provider-confirmed payment with a failed state.
- GCash/GrabPay/QR PH browser success/failure callbacks no longer write monetary
  or reservation status. Source `chargeable` is not treated as paid. The removed
  catch-all simulated webhook cannot bypass/shadow the real PayMongo handler.
- The UI refuses repayment when verification is unavailable, manual reference
  review is pending, or stored payment history needs reconciliation. Previously
  incorrect paid flags/rows are not automatically erased or financially rewritten.

This safe session-resume/idempotency implementation targets **hosted QR PH
checkout**. Other provider integrations retain their existing checkout APIs and
need separate end-to-end provider testing. The common return UI no longer
assumes a URL means success. Switching away from an unresolved QR PH attempt is
blocked until it is checked, to avoid overlapping provider flows.

## Deployment and webhook setup

No new migration is required: attempts use the existing `hotel_payments`
statuses and `provider_response` JSON. Do not change live financial records as a
deployment step. Deploy the backend and rebuilt frontend together.

Configure the server environment (never frontend bundles):

- `FRONTEND_URL`: the canonical site URL for provider returns.
- `PAYMONGO_SECRET_KEY`: the matching `sk_test_…` or `sk_live_…` secret key.
- `PAYMONGO_WEBHOOK_SECRET`: the signing secret for account 1's endpoint.
- If account 2 is used: its own `PAYMONGO_SECRET_KEY_2` and
  `PAYMONGO_WEBHOOK_SECRET_2`; account 1 credentials are not substituted.

Register `/api/payments/webhook/paymongo` (or `/paymongo-2` for account 2) in the
PayMongo dashboard and subscribe to `checkout_session.payment.paid` and the
checkout failure event if available for the account. Missing signing configuration
fails closed. JSON middleware preserves raw bytes for signature checking.
The signature verifies `HMAC_SHA256(secret, timestamp + '.' + raw_body)` against
the correct `te`/`li` field with timing-safe comparison and a 5-minute tolerance.
Check server clock synchronization. Unrecognized signed events are acknowledged
without changing money. Failed verification/persistence returns a non-2xx so the
provider can retry; no financial work is fire-and-forget.

Before live release, use isolated staging and PayMongo test keys to verify:

1. Back out without paying: no successful payment or automatic confirmation.
2. Lose connectivity before/after checkout creation; resume the same booking and
   session after reconnecting without creating a duplicate attempt.
3. Complete payment then lose the return redirect: webhook/status reconciliation
   records the payment, and repayment is blocked.
4. Repeat a paid webhook; send a delayed failure; confirm paid totals do not double.
5. Verify signature bytes/mode/secrets and that invalid signatures change nothing.
6. Test actual QR payment, provider timeout, session expiry, manual review, partial
   payment/balance, cancellation/hold expiry, and paid-but-late staff reconciliation.

Offline tests use fake databases and mocked gateway calls; no real payments,
webhook registrations, live database updates, or provider credentials are used.

## Provider references

- [Hosted Checkout quick start](https://docs.paymongo.com/docs/payment-channels-hosted-checkout-quick-start)
- [Checkout Session fields and cancel behavior](https://docs.paymongo.com/reference/checkout-session-resource)
- [Retrieve Checkout Session](https://docs.paymongo.com/reference/get_checkout_sessions)
- [Idempotent requests and 24-hour key expiry](https://docs.paymongo.com/reference/idempotent-requests)
- [Webhook signatures](https://docs.paymongo.com/docs/developer-tools-webhook-setup-management)
