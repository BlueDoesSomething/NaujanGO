# Hourly stays and owner payment plans

## Owner setup

1. Open **Owner Dashboard → Hotels → Manage Rooms** and edit a room type.
2. Under **Hourly stay packages**, enter optional per-room prices for **3, 12,
   and 24 hours**. An empty price disables that package; existing nightly rates
   are unchanged.
3. Open **Owner Dashboard → Payment Management → Payment Plan Settings**.
   Enable reservation fee, half payment, and/or full payment. Keep at least one
   enabled. Enabling a reservation fee requires a positive fee.
4. Save the settings. Payment methods (GCash, card, etc.) remain separate.

The settings belong to each hotel. Existing reservations retain their package
rate and payment/policy snapshots when settings change. Reservation-fee plans
cannot be used when the fee is greater than or equal to the booking total.

Hourly stays are **opt-in per room type**, not a rule for every hotel. Leave
hourly rates empty for hotels whose owners have not confirmed their policies.
Supported durations are currently limited to 3, 12, and 24 hours; other durations
or overtime rules require a separate, confirmed requirement.

## Travellers pilot reference (not automatically configured)

The supplied Travellers rate-card photo lists these per-room PHP package prices:

| Room type | 3 hours | 12 hours | 24 hours |
| --- | ---: | ---: | ---: |
| Economy Single | 250 | 750 | 1,500 |
| Meliorate Single | 350 | 1,400 | 2,800 |
| Economy Couples | 350 | 1,400 | 2,800 |
| Deluxe Couples | 500 | 2,000 | 4,000 |
| Family | Not listed | 2,000 | 4,000 |
| Duplex | Not listed | 2,300 | 4,600 |

Do not invent 3-hour Family or Duplex rates. The sign advertises breakfast for
12-/24-hour packages; retain that wording in the appropriate room description
or guest information after owner review.

Confirmed operating rules: check-in can be at any time; the package starts at
the guest's chosen check-in time, **not when the online reservation is placed**.
For example, a 24-hour package starting at 09:00 ends at 09:00 the next day.
Staff may approve another offered package or remind the guest to check out.

**Payment-plan acceptance remains unconfirmed.** Do not preset Travellers to
full-payment-only. The photo mentions a 25% reservation first payment, but the
current reservation-fee option is a **fixed amount**, not a percentage deposit.
No 25% deposit calculation or hotel-specific configuration is enabled by this
change. The owner must confirm and save the accepted plans before the pilot.

## Guest booking

Select a room type, choose an offered hourly package, and enter a check-in date
and time. All stay times use **Asia/Manila (Philippine time)**. Checkout is
automatic: 09:00 + 3 hours is 12:00 the same day; 18:00 + 12 hours is 06:00 the
next day; a 24-hour stay ends at the same time the next day.

Only enabled and usable payment plans are shown. The backend rechecks the plan,
room package, stored price, room capacity, exact time overlap, hotel inventory,
room-type inventory, and closed dates inside a transaction. A room can be reused
when a stay ends; another stay cannot overlap beyond available inventory. The
server computes the package price and checkout rather than trusting client
amounts/timestamps. Creating a reservation does not mark it as paid.

Guest booking history, receipts, payment summaries and owner/admin reservation
lists include hourly stay times and duration. Guests can reschedule an upcoming
hourly booking while retaining its original duration and package rate; the total
cannot fall below amounts already paid.

## Staff-approved extensions and checkout reminders

1. In **Owner Dashboard → Reservations**, find a confirmed hourly booking whose
   check-in time has arrived. Authorized owners (and admins through the API) can
   approve extensions; guests cannot extend their own stay.
2. Select **Extend Stay**, then an offered 3-, 12-, or 24-hour package. Prices
   come from that room type's current configuration. The charge applies to all
   rooms on the booking; splitting rooms needs a separate booking workflow.
3. Review the additional charge, new booking total and new checkout. Extensions
   begin at the **existing checkout**, not at the time the approval is submitted.
4. Obtain guest agreement, tick the explicit approval checkbox, and approve.
   Availability, room capacity, closed dates, ownership and the quoted rate and
   checkout are checked again inside a transaction. A conflicting reservation or
   changed quote prevents the update. Reload details and obtain agreement again
   if the price changes. A late approval must extend checkout beyond the present
   time; total stays are capped at 90 days.
5. Approval increases the amount owed and appends an audit entry with the staff
   account, timestamps, duration, rate and charge. It **does not insert a payment,
   charge a gateway, or mark extra money as received**. Collect/record payment
   separately through the existing payment flow. Guest booking history keeps the
   Pay balance action available for confirmed stays with approved extensions.

Original package and payment-policy snapshot fields remain unchanged; effective
checkout and accumulated duration are updated on the booking. Guest history,
receipts and payment summaries display approved extension charges and the latest
checkout. Repeating the same approval request key returns the recorded result
without adding another charge. Payment-status synchronization locks the booking
so a concurrent confirmation uses the latest extended total.

The reservation list shows **Checkout in … min** in the final 30 minutes and
**Checkout due — staff follow-up needed** at/after checkout. These are visible
dashboard reminders refreshed while the page is open, **not automatic email,
SMS, extension approval, or overtime charging**. Staff still contact the guest.
Cancelled, archived, refunded, completed and nightly bookings cannot be extended.

## Database deployment

Back up the backend database. Restarting the backend attempts additive,
idempotent schema setup for migration **050**. If the runtime database account
cannot alter tables, apply `migrations/050_hourly_stays_and_payment_plans.sql`
manually before deploying the frontend. No existing bookings, payment rows,
nightly rates or policy snapshots are backfilled or rewritten.

New nullable columns:

- `hotels.allowed_payment_options`: JSON-encoded list in TEXT; NULL preserves
  legacy defaults. Explicit empty/invalid settings do not re-enable plans.
- `rooms.hourly_rates`: JSON-encoded duration-to-price mapping in TEXT.
- `hotel_bookings.check_in_at`, `check_out_at`: Philippine-local DATETIME.
- `hotel_bookings.stay_duration_hours`, `stay_rate`: frozen package duration/rate.

The date-only `check_in`/`check_out` and legacy fields remain available. Hourly
bookings can have zero nights but still have a positive package total.
Approved extensions are stored in `policy_snapshot.stay_extensions`; they need
no additional migration beyond 050. No hotel-specific rates or payment settings
are seeded by this migration.

## Offline verification

From `backend/`:

```powershell
node --test tests/hourly-stays.test.js tests/hourly-reservations.test.js tests/stay-extensions.test.js tests/payment-sync.test.js tests/room-management.test.js
```

From `frontend/`:

```powershell
node --test tests/hourly-stays.test.mjs
npm run build
```

Tests use fake databases/local HTTP servers. Before production, apply the schema
to isolated staging and test same-day, midnight-crossing and 24-hour bookings,
back-to-back/overlapping stays, extensions blocked by future reservations or
closed dates, repeated approval requests, reminder states, all payment plan
combinations, and payment-provider sandbox checkout/callbacks (including a
payment arriving during an extension). Do not run destructive tests on production.
