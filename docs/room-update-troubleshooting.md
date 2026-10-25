# Room update returns HTTP 500

The HTTP entry for `PUT /api/owner/hotels/8/rooms/7` only proves that the
backend failed. It does not identify the database error. The room handler's
`Update room error:` entry in the backend hosting logs contains that detail.

## Deploy the room fixes

Deploy `backend/controllers/ownerController.js` together with
`backend/utils/roomFields.js`, then restart the backend. Refresh Room Management
and retry the update. Changing local files does not update `naujango.com`.

The old handler split JSON form fields on commas and JSON-encoded the fragments
again. Repeated saves could grow `image_urls` until its first entry exceeded the
500-character `primary_image_url` column. The list helper recovers legacy nested
lists on reads and writes, without clearing valid gallery images. A successful
save persists normalized lists.

## Identify any remaining failure

New failures also create a **rooms** source entry in Admin → System Logs.
Search for `rooms` or an error code. Validation errors appear at **warn** level,
not **error**, so include warnings in the filter. Expand the entry for the
request path, hotel/room IDs, status, safe reason, and `database_code`.
SQL, raw database messages, and room form values are not copied into that entry.

| Code | Next action |
| --- | --- |
| `ER_BAD_FIELD_ERROR` / response `ROOM_SCHEMA_MISSING` | Check the backend startup log for `Schema ensure (room fields) failed` or `Schema ensure (room guest content) failed`. Back up the database, select the database used by the deployed backend, and execute `migrations/046_repair_room_fields.sql` and `migrations/048_room_guest_content.sql` as complete scripts. They add only missing room-policy/content columns. Retry afterward. |
| `ER_DATA_TOO_LONG` | Check the backend error for the offending column. For `primary_image_url`, confirm the list helper is deployed and refresh the room before saving again. Do not truncate URLs or delete gallery data to hide the error. |
| `ER_TRUNCATED_WRONG_VALUE` / `ER_TRUNCATED_WRONG_VALUE_FOR_FIELD` | Check numeric fields and check-in/check-out times against the database types. |
| Other code | Use the code and timestamp to locate `Update room error:` in backend hosting logs. Do not run a schema repair unless the error indicates missing room columns. |

The schema-repair script does not fix oversized galleries; that needs the backend
list fix. Do not run unrelated booking-date/payment scripts for a room-save error.

## Local regression tests

From `backend/`:

```powershell
node --test tests/room-fields.test.js tests/room-management.test.js
```

The tests use a fake database and make no production changes. They cover repeated
saves, legacy lists, empty galleries, ownership, schema errors, and safe logging.
