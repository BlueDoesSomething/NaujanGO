# Owner-editable room guest content

In **Owner Dashboard → Room Management**, add or edit a room and use:

- **Perfect For**: add up to four guest categories. Each has a category name
  (up to 80 characters) and an optional description (up to 160 characters).
- **Common Questions**: add up to ten question/answer pairs. Questions allow
  200 characters and answers allow 1,000 characters, including line breaks.

Click **Save Changes** (or **Add Room Type**). The public room modal displays
only that room's saved entries. These sections are hidden for rooms without
content; there are no automatic claims about breakfast, Wi-Fi, or modifications.
Remove every entry and save to hide a section again. Completely blank new rows
are ignored; partially filled FAQs must be completed or removed before saving.

## Deployment

Deploy the updated frontend and backend together. The backend adds nullable
`rooms.perfect_for` and `rooms.common_questions` TEXT columns on startup.
No existing room content or bookings are changed, and no sample data is seeded.

If the backend database account cannot alter tables, back up the database,
select the database used by the deployed backend, and execute the whole
`migrations/048_room_guest_content.sql` script before restarting. It can be
rerun safely and only adds missing columns. Do not use booking/payment migrations
for this feature.

The room create/update endpoints accept JSON arrays in the multipart fields
`perfect_for` (`{ label, detail }` entries) and `common_questions`
(`{ question, answer }` entries). Omitted fields preserve existing content on
updates; explicit `[]` clears it. Ownership checks apply to both fields. Both
owner reads and `GET /api/hotels/:id/rooms` return parsed arrays. User-provided
content is rendered as text, not HTML.

## Regression tests

From `backend/`:

```powershell
node --test tests/room-fields.test.js tests/room-content.test.js tests/room-content-schema.test.js tests/room-management.test.js
```

From `frontend/`:

```powershell
node --test tests/room-content.test.mjs
```

Tests do not connect to a real database or production API.
