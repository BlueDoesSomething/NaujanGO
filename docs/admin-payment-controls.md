# Keep bookings; disable online payments through the admin

## Deployment

Back up the backend database, then apply `migrations/055_admin_payment_controls.sql`. It adds only the payment-policy/audit tables and booking messages. It does not rewrite or delete existing bookings, payments, property settings, or gateway credentials. It has not been applied automatically.

The admin's **Online payments** switch defaults **OFF**. Missing/unreadable policy data never enables payments. Deploy frontend/backend together after preparing the migration. Cached checkout-oriented clients must reload and acknowledge the pay-at-property terms rather than silently having those terms changed.

## Bookings remain the normal booking flow

- Guests keep the existing room/date/guest booking form and **Confirm Booking** button.
- Saving creates a normal pending reservation directly in `hotel_bookings`, under the existing `/bookings/hotels` API and **My Bookings / Owner → Reservations** screens. There is no separate request form, request table, request list, or request-approval lifecycle.
- Room availability/capacity and the rate come from the database. Pending and confirmed reservations both participate in the existing inventory calculations. The hotel lock prevents selling the last room twice; retry keys prevent lost responses from producing duplicate bookings.
- Owners use the existing **Confirm / Cancel** controls. Confirmation does not require online payment or create another booking. It rechecks inventory, excluding the booking's own rooms. Cancelling releases its inventory through the normal status-based calculations.
- New pay-at-property bookings have no unpaid-payment timeout (`expires_at` is NULL). They are not automatically cancelled after 24 hours for failing to pay online. This does not silently extend or convert old gateway bookings.
- The normal upcoming-booking modification flow remains available, with frozen rates and inventory checks. Payment deadlines are not introduced by modifying a pay-at-property stay.

## Payment handling

While OFF, guest payment fields, checkout, advance-deposit choices, reference submissions, and manual-credit actions are unavailable. All collection HTTP endpoints enforce the switch server-side, including the owner's pending-payment confirmation endpoint. Owners cannot override it through property settings.

Payment is made at the property. NaujanGO does not process or verify that payment and does not manufacture a payment attempt, paid flag, or payment receipt. The stored snapshot identifies these bookings as external-payment bookings so they cannot be charged later merely because an admin enables the switch. Quoted booking totals are not presented as verified platform debts or money received.

Existing payment history, valid receipts, provider verification/callbacks and refunds for previously collected money are preserved. **Turning OFF cannot retract gateway checkout pages already opened**: administrators must review active sessions and outstanding charges/refunds in the provider dashboard. Never stop recording genuine earlier provider results.

## Direct booking-linked messages, not a chatbot

- Guests select **Message property** on the booking; owners select **Message guest** on the same reservation (also available from reservation details).
- Only that booking's guest, currently linked authorized owners, and admins through protected endpoints can access its conversation.
- Messages are human-written, text-only, retry-safe, paginated, and send ordinary dashboard notifications. Sending a message never changes booking or payment status. No bot verifies money or confirms a room.
- Failed sends retain the text. Closing an unsent message asks before discarding it; owner navigation includes the existing unsaved-change guard.
- Never send PINs, OTPs, card credentials, banking passwords, or identity-document photos. No merchant QR or advance-transfer/proof workflow is introduced here.

## Admin control

**Admin → Payments → Platform payment policy**. Changing the setting requires a reason and current version; enabling additionally requires explicit acknowledgement of client authorization. Changes are audited. Saved owner payment-method/plan settings are retained but do not override the admin restriction.

## Fast offline checks

From `backend`: `node --test tests/admin-payment-controls.test.js tests/payment-recovery.test.js tests/production-payment-pages.test.js`

From `frontend`: `node --test tests/admin-payment-controls.test.mjs tests/admin-payment-controls-browser.test.mjs`

API/database/gateway access is mocked. Browser tests require Node 22+ and Chromium (`CHROME_PATH` supported). No live records or payments are changed by these checks.
