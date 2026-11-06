# About Us: public guide and content management

## Locations

- Public: `/about` introduces Naujan and links to the topic directory. Existing `/about/:section` links remain valid. **Read all topics** uses `/about?view=all`.
- Admin: **Tourism content → About Us**, `/admin/about`. The existing Customization → About shortcut opens the same dedicated editor.

## What administrators can manage

- **Overview & purpose**: overview, vision and mission points, with a local draft preview.
- **Facts & tourism**: municipal figures, historical visitor totals and fallback current-official details. This is separate from the approved monthly owner tourism-report system; no report, booking or payment records are changed.
- **Leadership & photos**: the existing saved roster, order, current flags and portraits. A current mayor and vice mayor can coexist. Unmarked historical officials are not guessed to be current.
- **Milestones** and **Miss Naujan**: existing saved lists, ordering and images. Empty lists remain empty rather than reappearing as hardcoded examples. Removing every saved entry requires explicit confirmation before saving.

Overview, vision, facts and fallback leader details share the existing settings record and save together. Each list saves separately. **Saving makes changes public immediately**; no new draft/approval database workflow is implied. The draft preview is local to the editor and not a full-page published preview. **View published page** opens the current saved version in a new tab.

Photo uploads use the existing immediate-update endpoints. Updating a photo on an existing entry can go live before text/list changes are saved; the UI says so before uploading. New entries still need their list saved. Uploaded files are not removed by discarding a text draft. Leadership photos remain keyed to role, name and term, so changing those identifiers may require uploading the portrait again.

Each dataset loads independently. A failed request cannot substitute example content and enable a destructive save. Invalid or incomplete lists are rejected before any SQL update, rather than silently filtering out records. Failed saves retain edits. Double-click saves and concurrent uploads are guarded. Internal dashboard navigation/Back/Forward asks before discarding; closing/reloading/leaving the document uses the browser's unsaved-changes warning.

Public Overview, Vision/Mission, Quick Facts and Tourism now read the existing settings API. Historical/cultural narrative chapters remain authored reference content, not a new general-purpose CMS. Saved municipal text is displayed as supplied; this does not create automatic translations. Unknown numeric values are not converted into invented zeros. Editorial descriptions are not presented as attributed resident testimonials.

No new migration is required. The existing `about_settings` and `site_settings` storage must already be available. No migrations, seed scripts, live uploads or production database writes have been performed by this change.

## Offline checks

- `backend`: `node --test tests/about-management.test.js`
- `frontend`: `node --test --test-concurrency=1 tests/about-management.test.mjs tests/about-management-browser.test.mjs`

Browser checks use mocked APIs, saved-content round trips, upload fixtures, error/retry, explicit empty lists, navigation guards and 320/393/768px layouts. Production builds should use a temporary output directory rather than overwriting unrelated tracked `frontend/dist` work.
