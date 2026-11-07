# Business verification document viewing and durable uploads

## Why old links show `Cannot GET /uploads/permits/...`

Previously, owner verification uploads were written only to the backend's local
`uploads/permits` directory. The database stored a URL, not the file bytes.
An ephemeral deployment/redeployment can remove those files while leaving the
saved URL behind. A 404 from both the website and backend indicates a missing
backend file, not merely a frontend link-resolution problem.

Missing files cannot be reconstructed from their filenames or database links.
Restore them from a backup or have the owner re-upload the original document.
Do not mark a missing document as verified just to dismiss the error.

## Changes

The additional business-registration and sanitary-permit fields, expiry-aware
badges and admin follow-up filters use the same private upload mechanism. See
`establishment-credentials.md` and migration `056_establishment_credentials.sql`.
Existing Business Permit fields represent the LGU Business/Mayor's Permit;
they are not duplicate DTI/SEC/CDA registration fields.

- New JPG, PNG, WEBP and PDF uploads (maximum 6MB) are stored in the existing
  MySQL database, in `business_documents`, instead of the container filesystem.
  No new cloud account, storage credentials, or public file bucket is required.
- File bytes and the business-profile document reference are committed together.
  Failure leaves the old document and verification state intact. Successful
  replacement follows the existing rule: verification returns to **pending**.
- File contents must match the declared supported MIME type. HTML/SVG and
  unsupported uploads are rejected. Names in stored URLs are random UUIDs.
- `/uploads/permits/...` now requires login and is limited to administrators or
  the submitting owner. Owners awaiting business verification can view their
  own submissions; another owner or guest account cannot access them.
- Private document paths cannot fall through to the public upload handler.
  Responses use `private, no-store`, the detected MIME type and `nosniff`.
- Admin Business Verification and the owner Business Profile share an image/PDF
  viewer. It fetches with the existing authenticated client, displays missing
  file / expired session / permission errors, and offers a full-size view.
  Existing external HTTP(S) document links remain separate external links.

## Deploy and recover

1. Back up the backend database, including any existing upload-file backup.
2. Apply `migrations/051_durable_business_documents.sql` to the **backend**
   database and deploy/restart the backend and rebuilt frontend. This is
   separate from booking migration 050. Backend startup also attempts the
   idempotent `CREATE TABLE` when its database account has permission.
3. In Owner Dashboard → Business Profile, use the existing document Upload
   control to replace missing business permit / DOT / PhilGEPS attachments.
   Each successful upload is immediately persisted; use Save for other edited
   business details. The administrator must re-review replaced submissions.
4. Open the uploaded attachment from both owner and admin dashboards. Test a
   JPG/PNG/WEBP and a PDF, unauthorized access, and viewing again after a backend
   redeployment. The bytes should still be in MySQL, independent of local disk.

Migration 051 only creates the document table. It does **not** modify existing
business-profile fields, verification decisions, bookings, payments, or hotel
settings. It cannot restore already-missing files.

Legacy relative `/uploads/permits/...` files that remain on the backend disk
still open through the authenticated route. They are not automatically copied
or rewritten. Re-upload those too to move them into durable storage before a
future redeployment, or restore a file backup on a persistent volume. Old file
references are retained unless explicitly replaced/cleared by the owner.

Keep database backups private: they now contain the actual verification files.
Budget database storage for these bounded documents, and ensure MySQL
`max_allowed_packet` allows a 6MB file plus statement overhead (for example,
16MB or more). Large-volume document storage should use private object storage
instead. No live database or storage configuration is changed by the tests.

## Offline checks

```powershell
# backend/
node --test tests/business-documents.test.js

# frontend/
node --test tests/business-documents.test.mjs
npm run build
```

Backend tests use fake databases and temporary fixture files, not production
documents or credentials. Live MySQL migration and browser/PDF rendering checks
still need isolated staging verification before production use.
