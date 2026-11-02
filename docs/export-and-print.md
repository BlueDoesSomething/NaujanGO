# CSV exports and print / Save PDF

## Controls

| Location | Output |
| --- | --- |
| Itinerary Builder → Export CSV | All stops in the current draft, including stops without coordinates. Does not save the draft. |
| Itinerary Builder → Print / Save PDF | Draft details, ordered stops and the displayed daily budget estimates. |
| Saved Itinerary → Overview → Export stops CSV | Saved stops, day/order, estimated costs, notes and visited status. |
| Saved Itinerary → Overview → Print / Save PDF | Trip summary, stops and displayed budget assumptions. |
| Saved Itinerary → Budget | CSV or printable day-by-day budget, including attraction costs, balances and zero values. |
| Owner → Reservations | All loaded records matching the current status/search, not just the current table page. |
| Owner → Payments | Loaded matching payment attempts with filter scope, loaded count and matching server summary count. Not a complete ledger if the server has more matches. |
| Owner → Reviews | All loaded hotel reviews, not just the current card page. |
| Admin/Owner → Reports & Analytics | Chart CSV controls export their own data. Export all CSV and Print / Save PDF include the analytics tables, not embedded Tourism Arrivals or separate room reports. |
| Booking History → Receipt | Structured receipt CSV or print/PDF, including recorded paid/balance amounts, frozen booking policies and approved extension history. |
| Legacy Hotels receipt viewer | CSV, print/PDF and an accurately labeled Download TXT option. |

Choose **Save as PDF** in the browser print dialog for a PDF file. There is no automatic PDF download disguised as CSV. Browser print controls, available destinations and mobile behavior depend on the browser/OS.

## Data and safety

- CSVs use explicit columns, UTF-8 with BOM, CRLF records, quoted cells and doubled embedded quotes. Numeric zero, false and unavailable values are not silently merged. Empty selections still have column headers.
- Spreadsheet formula-like text is prefixed with an apostrophe; real numeric deficits remain numeric. This may intentionally show an apostrophe when reading CSV as plain text.
- Owner/report CSVs include an Export scope column when applicable. Combined analytics CSV is rectangular, with a Report column identifying each dataset. Missing datasets are identified rather than fabricated as zero.
- Daily analytics never fall back to monthly data. Demographics, user totals and hotel performance have their own scopes, independent of the trend selector. Owners do not export admin demographics/roles.
- Payment exports are disabled while either the list or totals belong to an older filter, are still loading, or have failed. Payment attempts are not necessarily successful payments.
- Print documents are isolated from the application, escape all values and do not load external assets. A4 portrait/landscape, proportional columns, repeating table headers, wrapping and page-break rules make tables readable over multiple pages. Navigation, chat, maps, controls and charts are excluded.
- Exports allowlist public/display fields, never raw provider responses, credentials or verification codes. Authorized guest/contact information remains personal data; handle downloaded files accordingly.
- Exports do not change stored budgets, completion checkboxes, booking policies, extensions, payment records or payment recovery. Builder daily estimated need retains its existing fare/food/other calculation; attraction estimates remain separately listed and included in the trip summary. Saved Details exports reflect the displayed breakdown.
- Builder Share now shares only an already-saved itinerary link. Unsaved drafts require an explicit Save first; sharing does not save, change visibility or grant access. Cancelling native sharing does not copy a link. Clipboard is a fallback when sharing is unavailable.
- Booking History Calendar remains an `.ics` calendar download, separate from CSV/PDF.

## Validation

Run from `frontend/`:

```powershell
node --test --test-concurrency=1 tests/exports.test.mjs tests/exports-browser.test.mjs
node --test --test-concurrency=1 tests/itinerary-attractions-responsive.test.mjs tests/register-responsive.test.mjs
```

The browser suite requires Node 22+ and installed Chromium/Chrome/Edge (`CHROME_PATH` may override detection). APIs are mocked, external requests blocked, and business-data writes checked. It downloads actual CSV files; tests Builder, Details, receipt and chart controls; checks owner pagination/filter scope and capped payments; and generates a real multi-page PDF. Browser print calls are intercepted for control/lifecycle assertions, with PDF rendering separately checked through Chromium. It does not validate a physical printer or every mobile OS print dialog.

Browser suites must run serially: older suites share Vite's default development port/cache. The export suite uses an isolated temporary cache/profile. PDF and layout fixtures are saved under the approved OpenCode temporary directory on Windows, not in the repository.

Build to a fresh temporary output directory to leave `frontend/dist/` untouched:

```powershell
npm run build -- --outDir C:/Users/bened/AppData/Local/Temp/opencode/export-build-check
```
