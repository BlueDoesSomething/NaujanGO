# Establishment credentials: requirements review and tracking

## Agreed categories

Business Permit and LGU/Mayor's Permit usually name the **same operating permit**. The selected design avoids requiring that document twice:

| Credential | Issuer / meaning | NaujanGO storage |
| --- | --- | --- |
| Business registration | DTI for a business name/sole proprietorship; SEC for a corporation/partnership; CDA for a cooperative, as applicable. This establishes registration, not permission to operate. | New `registration_authority`, `registration_no`, `registration_expiry`, `registration_file`. |
| LGU Business / Mayor's Permit | Local government operating permit. Match the establishment's legal name, location and permitted activity. | Existing `business_permit_no`, `business_permit_expiry`, `business_permit_file`, unchanged. |
| Sanitary Permit | Local health authority's permit for covered accommodation establishments, separate from an individual employee's health certificate. | New `sanitary_permit_no`, `sanitary_permit_expiry`, `sanitary_permit_file`. |
| Department of Tourism accreditation | DOT accreditation for the applicable accommodation category/level. A submitted application is not an issued accreditation. | Existing `dot_no`, `dot_expiry`, `dot_file`, unchanged. |

PhilGEPS remains a separate optional procurement-information group. It is **not a replacement for DOT accreditation, sanitary permission, or an LGU operating permit**.

## Regulatory findings and sources

Research checked November 7, 2026. This is a software requirements review, not an official legal/compliance determination.

1. **Registration versus operating permit:** [DTI BNRS FAQ](https://bnrs.dti.gov.ph/faq) explicitly distinguishes Business Name Registration from the Business/Mayor's Permit required to operate. The FAQ gives DTI business-name registration a five-year validity. Do not apply that five-year rule to SEC/CDA records or invent expiry dates absent from a certificate.
2. **Sanitary permission:** [DOH implementing rules for Chapter XIV of P.D. 856](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/39841), sections 3.1–3.7, require a sanitary permit for covered accommodation establishments. Section 3.5 describes validity ending on the last day of December and renewal at the beginning of the next year, unless revoked earlier. Individual employee health certificates are separate under section 4.
3. **DOT:** [R.A. 9593, Tourism Act of 2009](https://lawphil.net/statutes/repacts/ra2009/ra_9593_2009.html), sections 14 and 39, provides mandatory periodic accreditation for primary tourism enterprises, including accommodation establishments. Secondary enterprises have a different accreditation framework; do not apply one universal checklist to every tourist attraction/business.
4. **Accreditation category matters:** [DOT MC 2023-0003, Updated Guidelines on the Progressive Accreditation System, copy published by Visit Central Luzon](https://www.visitcentralluzon.com/wp-content/uploads/2026/03/DOT-MC-No.-2023-0003_Updated-Guidelines-on-the-Progressive-Accreditation-System-UPAS-1.pdf) distinguishes accreditation levels and documentary/physical requirements. Its accommodation documentary table includes a valid Mayor's/Business Permit and, for Hotels/Resorts/Apartment Hotels, comprehensive general liability insurance with the specified minimum coverage. Do not describe these four uploaded credentials as the entire DOT application checklist. Confirm the applicable current checklist/level with DOT MIMAROPA or the [DOT Accreditation Portal](https://accreditation.tourism.gov.ph/).
5. **PhilGEPS:** [PhilGEPS description](https://notices.philgeps.gov.ph/GEPSNONPILOT/aboutGEPS/aboutGEPS.aspx?menuIndex=5) concerns government procurement, not tourism licensing.

**Local confirmation still needed:** The complete current Naujan BPLO/Municipal Health Office accommodation checklist, fees, exceptions and renewal procedures were not independently verified. Obtain their current Citizen's Charter/checklist before declaring any document universally mandatory in NaujanGO. Barangay, zoning/location, fire-safety, occupancy/building, tax, environmental and other requirements may apply; they are outside this four-credential tracking feature. The app records the printed expiry date rather than hardcoding one annual expiry for every credential.

## Owner workflow

Open **Business & Verification → Establishment credentials → Edit Profile**. Enter the registration authority when supplying business-registration data, number, actual expiry if stated, and readable document. The LGU Business/Mayor's Permit uses existing saved permit records; no legacy values are relabeled as DTI registration or copied into the sanitary group.

Accepted files remain **JPG, PNG, WEBP and PDF, up to 6 MB**. All five document types, including optional PhilGEPS, use the existing authenticated, durable document viewer/storage. A successful upload saves immediately and returns profile verification to pending. Saving other fields is separate. Cancelling a draft cannot undo the upload or resurrect its old file reference. Changed credential fields also return the profile to pending review. Owners cannot write or clear administrator flags through profile saves.

Credential data continues to live on the existing owner business profile. The current owner interface links one property per owner. This is not a new multi-establishment licensing registry.

## Badges and administrative follow-up

- Expiry is evaluated on each API read against the **Asia/Manila calendar date**; the printed expiry day is inclusive. Within 30 days is **Expiring soon**; before today is **Expired**.
- A number alone is not a current badge. A current badge requires the number, document reference, applicable registration authority, recorded future expiry, profile review and no active follow-up flag. A platform review is not an issuing agency's certification or an inspection.
- Missing, incomplete, pending/rejected review, unknown expiry and flagged records have distinct non-current states. Expired remains expired even if the profile is verified or a flag is resolved. A missing SEC/CDA expiry is not automatically called expired, but also does not establish indefinite current validity.
- Badges on the property page and accommodation list expose only type/status/expiry and a follow-up indicator. They do not expose uploads, permit numbers, private reasons or reviewer identities. When lookup/setup fails, show **Credential information unavailable**, not fabricated valid/missing badges.
- Admin **Business Verification** supports search, profile review state, credential type, **Expired**, **Expiring within 30 days**, **Flagged**, **Expiry unknown**, **Not submitted**, **Incomplete**, and **Reviewed and current** filters. Type and condition must match the **same credential**. Filtering applies before pagination. The protected API supports corresponding type/condition query filters too.
- **Flag for follow-up** and **Resolve flag** require a reason. The current flag version prevents stale sessions or repeated writes from overwriting a newer decision. A row lock and transaction save the decision and an append-only `business_credential_events` audit row together; failed audit writes roll back the decision. A profile save/upload does not silently clear a flag.
- Failed loads retain stale records with a warning and disable administrative decisions until refresh succeeds. Failed flag decisions retain the typed reason.
- Badges reflect saved data, not unsaved form edits. Refresh/reopen to reevaluate dates; no scheduled email/SMS reminders or background government-record verification is implied.

For a property with multiple existing owner links, public summaries use one coherent owner profile (verified first, then most recently updated, then owner ID). They do not combine different owners' documents into a manufactured complete credential set.

## Existing authorization is not regulatory compliance

This change **does not automatically suspend bookings, cancel reservations, change inventory/payment state, or rewrite existing verification decisions** when an expiry passes or a follow-up flag is set.

The existing technical access rule—admin-verified business permit number plus DOT **or** PhilGEPS information—is retained for backward compatibility, not endorsed as a legal licensing checklist. Correcting that rule, introducing mandatory credentials, restricting future booking access, revocation handling and exemptions need a separately approved operator policy. Pending verification after owner edits/uploads retains its pre-existing access effect. The owner banner now explicitly describes dashboard access rather than claiming all licensing requirements are complete.

## Deployment

1. Back up the **backend** database, including private uploaded-document bytes.
2. Apply `migrations/056_establishment_credentials.sql`. It conditionally adds nullable registration/sanitary/flag fields and creates the flag event table. It does not rename/backfill old permits, set expiries, verify owners, or alter financial/booking data.
3. Ensure the existing migration `051_durable_business_documents.sql` is present for uploaded-file storage.
4. Deploy frontend/backend together. The existing startup business-schema routine also attempts the idempotent additions; if privileges are insufficient, use the migration with an authorized database administrator. Missing schema returns actionable setup errors.
5. In staging, verify old permit preservation, both new upload types, private viewing after redeployment, date boundaries, flags/audit rollback, and filters. Public badges must not disclose document URLs or private notes.

The migration has **not been applied** by this development work. No live documents, government queries, reservations or payment-provider operations were performed.

## Offline validation

From `backend/`:

```powershell
node --test tests/business-credentials.test.js tests/business-documents.test.js tests/admin-payment-controls.test.js tests/owner-booking-payments.test.js
```

From `frontend/`:

```powershell
node --test --test-concurrency=1 tests/business-credentials.test.mjs tests/business-credentials-browser.test.mjs tests/business-documents.test.mjs
```

Tests use mocked storage/APIs and temporary browser fixtures, not live business documents or production data. Production deployment and a real MySQL migration remain separate verification steps.
