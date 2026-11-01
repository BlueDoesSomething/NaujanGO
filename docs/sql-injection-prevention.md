# SQL injection prevention

## Runtime protections

- `backend/db.js` disables multiple SQL statements per call. Dashboard archive
  startup DDL runs as two separate statements, preserving automatic setup.
- The shared `execute(sql, params)` helper uses mysql2 server-side prepared
  statements. Authentication, OAuth lookups, registration, profile updates,
  verification and reset tokens use this helper, as do its existing callers.
- Bind parameters are scalar values, dates or buffers. Optional `undefined`
  becomes `NULL` as before. Serialize intentional JSON with `JSON.stringify`.
  Objects and nested arrays are not accepted by the shared prepared helper.
- Booking totals, owner payment details, hotel legitimacy checks, chatbot
  history deletion and content deletion checks use one placeholder per list
  item. Empty lists are handled before generating an `IN` clause.
- Machine-translation source tables, primary keys and columns are allowlisted.
  Other dynamic SQL identifiers remain fixed internal mappings/allowlists;
  identifiers cannot be protected by putting them in value placeholders.
- Admin log pagination and time windows are bound values, not SQL fragments.
- Existing correctly parameterized `query(sql, values)` calls are retained for
  compatibility. `stringifyObjects: true` prevents request objects from becoming
  SQL column assignments. Never concatenate request input or use `mysql.raw`
  with untrusted data. These text-protocol calls require standard MySQL string
  escaping: do not enable `NO_BACKSLASH_ESCAPES` on their connections. If that
  SQL mode is required, migrate those calls to prepared execution first.

There is no blacklist that removes apostrophes, semicolons or SQL words from
normal names, reviews, descriptions or search text.

## Verification

From `backend/`, run these offline security and feature regression tests:

```powershell
node --test tests/sql-injection.test.js tests/sql-injection-features.test.js tests/archive-content.test.js tests/booking-payments.test.js tests/owner-booking-payments.test.js tests/dashboard-archive.test.js tests/room-content-schema.test.js tests/room-content.test.js tests/room-fields.test.js tests/room-management.test.js
```

Tests use fake databases and local HTTP servers; they do not run migrations or
contact real payment, email or translation services. They verify binding and
feature behavior, not execution against a live MySQL server.

Before production rollout, use an isolated staging database to check:

1. Startup, registration, normal/OAuth login, profile updates and password reset.
2. Search and reviews containing apostrophes and multilingual text.
3. My Bookings and owner reservations with multiple bookings, paid totals,
   outstanding balances and payment references.
4. Hotel badges and booking eligibility; clear empty and populated chat history.
5. Admin log filters/pagination and archive/restore/deletion dependency checks.
6. Payment checkout and sandbox callbacks, confirming booking/payment state is
   unchanged by the database-driver hardening.

Use a separate, least-privileged database account for the web application, not
the database administrator. Apply schema migrations separately before removing
DDL privileges from that account; the current application also attempts schema
setup at startup. Keep backups and never run destructive injection tests against
production. No production database changes are needed for this code change.
