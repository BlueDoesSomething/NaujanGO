# CSV exports and custom PDF downloads

## Controls

| Location | Output |
| --- | --- |
| Itinerary Builder → Export CSV | All stops in the current draft, including stops without coordinates. Does not save the draft. |
| Itinerary Builder → Export PDF | A purpose-built itinerary summary with trip metrics, travel dates, day-by-day destinations/notes and daily budget estimates. Downloads `.pdf` directly. |
| Saved Itinerary → Overview → Export stops CSV | Saved stops, day/order, estimated costs, notes and visited status. |
| Saved Itinerary → Overview → Export PDF | Custom trip summary, day-by-day plan, visited progress and displayed budget assumptions. |
| Saved Itinerary → Budget | CSV or custom landscape PDF, including attraction costs, balances and zero values. |
| Owner → Reservations | All loaded records matching the current status/search, not just the current table page. |
| Owner → Payments | Loaded matching payment attempts with filter scope, loaded count and matching server summary count. Not a complete ledger if the server has more matches. |
| Owner → Reviews | All loaded hotel reviews, not just the current card page. |
| Admin/Owner → Reports & Analytics | Chart CSV controls export their own data. Export all CSV and Export PDF include the analytics tables, not embedded Tourism Arrivals or separate room reports. The PDF has its own summary and dataset sections. |
| Booking History → Receipt | CSV or a custom receipt PDF with separate reservation, guest, stay, payment and frozen-policy sections. Recorded paid/balance amounts and approved extensions are retained. |
| Legacy Hotels receipt viewer | CSV, custom PDF and an accurately labeled Download TXT option. |

**Export PDF downloads a real PDF file directly.** It does not open a print dialog, capture the website, rename HTML as PDF, or require choosing “Save as PDF”. To print a document, open the downloaded PDF in a PDF viewer and use its Print command. Browsers may preview or offer a save/share action for a PDF on some mobile platforms.

## Data and safety

- CSVs use explicit columns, UTF-8 with BOM, CRLF records, quoted cells and doubled embedded quotes. Numeric zero, false and unavailable values are not silently merged. Empty selections still have column headers.
- Spreadsheet formula-like text is prefixed with an apostrophe; real numeric deficits remain numeric. This may intentionally show an apostrophe when reading CSV as plain text.
- Owner/report CSVs include an Export scope column when applicable. Combined analytics CSV is rectangular, with a Report column identifying each dataset. Missing datasets are identified rather than fabricated as zero.
- Daily analytics never fall back to monthly data. Demographics, user totals and hotel performance have their own scopes, independent of the trend selector. Owners do not export admin demographics/roles.
- Payment exports are disabled while either the list or totals belong to an older filter, are still loading, or have failed. Payment attempts are not necessarily successful payments.
- Custom PDFs are drawn from explicit report models with `pdf-lib` and locally embedded Noto fonts. They contain selectable text, brand headings, summary cards, structured sections, page numbers and generation timestamps. They do not read or render the website DOM. A4 portrait/landscape, proportional columns, repeated table headers, and split oversized rows prevent clipped content. Navigation, chat, maps, website controls and charts are excluded.
- The PDF engine loads only when exporting. The bundled regular/bold fonts cover peso and accented text. A larger local CJK font loads only when the document contains Chinese/Japanese/Korean characters; only used glyphs are embedded into the file. Unsupported symbols are explicitly rendered as `[U+codepoint]`, not silently omitted. Font licenses and upstream sources are in `frontend/public/fonts/OFL.txt`.
- Export PDF shows “Preparing PDF…” and prevents duplicate clicks. Font/generation failures show an error, unlock the control for retry, and never fall back to printing the website. Fonts are served from the same application origin; report contents are not sent to a PDF service.
- Exports allowlist public/display fields, never raw provider responses, credentials or verification codes. Authorized guest/contact information remains personal data; handle downloaded files accordingly.
- Exports do not change stored budgets, completion checkboxes, booking policies, extensions, payment records or payment recovery. Builder daily estimated need retains its existing fare/food/other calculation; attraction estimates remain separately listed and included in the trip summary. Saved Details exports reflect the displayed breakdown.
- Builder Share now shares only an already-saved itinerary link. Unsaved drafts require an explicit Save first; sharing does not save, change visibility or grant access. Cancelling native sharing does not copy a link. Clipboard is a fallback when sharing is unavailable.
- Booking History Calendar remains an `.ics` calendar download, separate from CSV/PDF.

## Validation

Run from `frontend/`:

```powershell
node --test --test-concurrency=1 tests/exports.test.mjs tests/pdf-exports.test.mjs tests/exports-browser.test.mjs
node --test --test-concurrency=1 tests/itinerary-attractions-responsive.test.mjs tests/register-responsive.test.mjs
```

PDF tests require Node 22.13+ (the development-only PDF.js parser). The browser suite also requires installed Chromium/Chrome/Edge (`CHROME_PATH` may override detection). APIs are mocked, external requests blocked, and business-data writes checked. It downloads actual CSV and PDF files through Builder, Details, receipt, analytics and owner controls; extracts PDF text to check selected content; checks owner pagination/filter scope and capped payments; tests font-failure/retry; and verifies that PDF controls never invoke printing or create print frames. Unit tests check PDF metadata, Unicode, long-row pagination, page numbers, text coordinates, role boundaries and unchanged source data.

Browser suites must run serially: older suites share Vite's default development port/cache. The export suite uses an isolated temporary cache/profile. PDF fixtures are saved under the approved OpenCode temporary directory on Windows, not in the repository. Production builds exclude the PDF.js test parser. The existing project dependency-audit warnings are separate from this feature; none of the added PDF dependencies were flagged by the audit, and no unrelated dependency upgrades were applied.

Build to a fresh temporary output directory to leave `frontend/dist/` untouched:

```powershell
npm run build -- --outDir C:/Users/bened/AppData/Local/Temp/opencode/export-build-check
```
