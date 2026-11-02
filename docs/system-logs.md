# System Logs listing and error states

## Reported issue

The admin dashboard showed nonzero 24-hour log counters but an empty table and
zero matching entries. The browser confirmed that
`GET /api/admin/logs?page=1&limit=50` returned HTTP 500.

Counters and rows come from separate endpoints. A successful stats request does
not mean the paginated list request succeeded. Previously, the dashboard caught
a list error, cleared its local display state, and showed “No log entries found.”
That was a misleading empty state, not evidence that the stored logs were gone.

## Changes

- The dashboard shows a visible load error for failed requests. The matching
  total is unknown (`—`), not an invented zero. **Refresh** retries the request.
- Only a successful, valid response can show an empty result. An out-of-range
  page with a nonzero matching total offers **Return to first page**.
- Older responses cannot overwrite a newer filter/page request. Closing the
  module cancels pending display updates. Responses with an unexpected shape
  are treated as load errors rather than empty log tables.
- The list query keeps search/level values and pagination parameterized. `mysql2`
  encodes JavaScript numbers as DOUBLE, which some MySQL versions reject for
  `LIMIT ? OFFSET ?` with `ER_WRONG_ARGUMENTS`. Validated limit/offset values are
  now bound as decimal integer strings. Raw request values are never inserted
  into SQL syntax. Unsafe page/offset ranges are rejected before querying logs.
- List failures return HTTP 500 with `SYSTEM_LOGS_UNAVAILABLE`, not a successful
  empty result. List and stats responses use `private, no-store`.

The deployed database's exact 500 error was not provided. Pagination type
compatibility is addressed, but another schema/database failure would still need
the sanitized Railway backend error code from **Get system logs error**.
No live MySQL query was performed to confirm that error's cause.

## Data and access

No migration, log deletion, retention change, or logging-table rewrite is needed.
Viewing, searching and refreshing remain read-only. Existing **Clear all** behavior
is unchanged and was not exercised during this work. Admin authentication remains
required for both endpoints. No payment, booking, email credential, or business
document data is changed.

The three severity counters cover the last 24 hours; **Matching entries** counts
all retained logs matching the current list filters. Those totals do not have to
match exactly, even when every endpoint succeeds.

## Validation

Offline tests use localhost HTTP, fake databases and controlled responses. They
cover existing rows, multiple/out-of-range pages, level/search filters, bounds,
SQL-looking input, authorization, list/count failures, recovery, malformed
responses, and overlapping requests. The database fixture models rejection of
DOUBLE pagination bindings; it is not a live MySQL integration test.

After deploying backend and frontend, verify:

1. `GET /api/admin/logs?page=1&limit=50` returns 200 with rows and a matching total.
2. All/Error/Warn/Info, search, pagination, details and Refresh work.
3. A request failure displays an error, not “No log entries found.”
4. An actual no-match search displays a genuine empty state.

If the list still returns 500, share only its sanitized backend error code (for
example, `ER_BAD_FIELD_ERROR`), not full log contents, tokens, cookies or passwords.
