# Dashboard archive policy

## What changes the cards?

- **Bookings**: archiving removes a resolved booking from the archiving user's
  active booking list and operational booking counts. It does not archive its
  payment attempts or change booking/payment status, inventory, or balances.
- **Payments**: with archived records hidden (the default), archiving a failed
  attempt reduces **Failed amount (filtered)** and the matching failed-attempt
  count for that user. Restore puts it back. **Show archived** includes it again.
- **Lifetime revenue**: always includes archived payments and ignores dashboard
  filters. Archiving must never reduce revenue or remove money owed. Refunds and
  genuine payment-status changes still affect revenue normally.
- Failed amounts are unsuccessful payment attempts, **not lost revenue**. Each
  payment ID is displayed, including multiple attempts for the same booking.
  List/status/method/date/search filters also apply to operational payment cards.
  The regular Payments list shows up to 500 matches; summary cards aggregate all
  matches. Dedicated Archive lists retain access to all archived records.

Owner and Admin dashboards use the same rules. Admin now has a Payments module,
payment summaries on Overview, and a Payments subsection in Archive.

## Personal visibility versus business state

Booking/payment archives are stored per user in `dashboard_record_archives`.
An owner cannot change another owner's or an admin's view. Each administrator
also has their own view. Explicit archive and restore requests are idempotent;
retrying Archive never restores a record accidentally.

Legacy shared `archived` flags remain the initial default when a user has no
personal override. Migration 049 does not rewrite or unarchive historical rows.
A personal Restore overrides that default only for the requesting dashboard.
Legacy global flags may have affected availability under the previous code;
any pre-existing unresolved legacy archives need explicit administrative review,
not an automatic inventory or financial rewrite during deployment.

Hotels, attractions, and itineraries still use their shared content archives.
These control publication/availability of content, not financial retention.

## Safeguards

- Bookings cannot be archived while pending, while a confirmed stay has not
  passed its checkout date, while a confirmed/completed stay has a balance, or
  while linked payments indicate pending processing/refunds/disputes.
- Pending/disputed/refund-pending payments cannot be archived. Failed/refunded
  attempts are terminal; succeeded payments also require a resolved booking.
  Status values not supported by a gateway should be reviewed rather than hidden.
- Financial records have **View + Restore**, never a permanent-delete action.
  Archive/restore endpoints check authentication and current hotel ownership.
- Admin content **View** checks permanent-deletion eligibility. Content must be
  archived and have no declared foreign-key or known logical references. Hotels
  must also be inactive; itineraries must be draft/planning. Linked rooms,
  ownership, reviews, reservations, and itinerary items block deletion.
- Permanent deletion needs an exact typed confirmation and a 10–500-character
  reason. The server rechecks dependencies under transaction locks and writes a
  durable audit event in the same transaction. No automatic cascade cleanup is
  performed. Failed checks/audit writes retain the record.
- Accounts linked to booking history cannot be permanently deleted through the
  existing user-delete action. Archive them instead. Privacy anonymization and
  legal/accounting retention expiry require a separate controlled process.
- There is no automatic purge or blanket 30-day deletion of financial history.

## Deployment

Back up the backend database. Deploy frontend and backend together. Startup
applies `migrations/049_dashboard_archives.sql` using `CREATE TABLE IF NOT EXISTS`.
If setup is denied, run the whole script against the backend database manually
with suitable privileges and restart. Archive APIs fail closed when the tables
are missing. The script creates only visibility/audit tables; it does not alter
bookings, payments, statuses, amounts, users, or existing archive flags.

## Tests

From `backend/`:

```powershell
node --test tests/dashboard-archive.test.js tests/archive-content.test.js tests/owner-booking-payments.test.js
```

From `frontend/`:

```powershell
node --test tests/dashboard-archive.test.mjs
```

All archive tests use mocked storage/API calls, not a production database or gateway.
