# Monthly owner tourism arrival reports

## Enable

Back up the backend database, then apply `migrations/054_owner_tourism_arrival_reports.sql` to that database before using this feature. It creates two new InnoDB tables only. It does not change existing arrivals, bookings, payments, hotels, or accounts. Missing tables produce an actionable reporting error instead of fabricated zero totals.

The migration has not been applied automatically. No gateway settings or scheduled reporting deadlines are added.

## Reporting rules

- Owner route: `/owner/tourism-arrivals`. Available to linked owners, including owners awaiting business verification.
- One report per property/month, not in the future.
- Six counts: Male/Female within Resident (lives in Naujan), Local (Filipino visitor from outside Naujan), and Foreigner (non-Filipino visitor).
- Manually count actual guest arrivals, including reportable walk-ins. Do not use rooms, future reservations, cancellations, no-shows, or account demographics. These are establishment arrivals, not deduplicated visitors across Naujan.
- Blank draft fields are incomplete. Submission requires all six non-negative integers; enter `0` for a genuine zero.
- Draft → Submitted → Approved, or Submitted → Returned for correction → Resubmitted. Owners cannot edit submitted or approved reports. Returns require admin feedback.
- Each submission retains its own count/notes snapshot and review decision. Concurrent/stale edits and repeated submissions are rejected. Admins cannot see in-progress corrections to returned reports until resubmission.

## Admin review and totals

Admin → Reports → Tourism Arrivals → Owner submissions (also `/admin/tourist-arrivals`). Summary cards and yearly trends use approved owner reports only. The property/status filters apply to the submission list; summary cards cover all approved properties for the month.

Approved CSV/PDF are custom file downloads, never browser print dialogs. They cover the selected month/property across all pages and exclude guest identities, payment details, owner notes, and historical/manual totals.

The Historical / manual log preserves existing `tourist_arrivals` records separately. No Resident counts are inferred and neither data source is added to the other. Reminder coverage uses current active owned properties created before the selected month ended, plus properties with an existing report. It is not a legal deadline/compliance assessment. Missing reports are not zero-arrival reports.

Submitted history has no cascading foreign keys; admins retain reporting snapshots if an account/property is removed. Owner access always requires a current property link. Approved reports are intentionally locked; this workflow does not provide an admin override/reopening action.

## Fast offline checks

From `backend`: `node --test tests/tourism-arrival-reports.test.js`

From `frontend`: `node --test tests/tourism-arrivals.test.mjs tests/tourism-arrivals-browser.test.mjs`

Browser checks require Node 22+ and Chromium (`CHROME_PATH` can override detection). API/database calls are mocked; these tests never write to a real database or contact payment gateways.
