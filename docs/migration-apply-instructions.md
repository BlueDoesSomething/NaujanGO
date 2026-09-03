Applying Chatbot Migrations

You added `migrations/034_add_sender_to_chatbot_messages.sql`. I also added `migrations/035_add_moderation_fields.sql`.

To apply both (run in your DB server machine):

1. From shell (example):

```bash
mysql -u <db_user> -p <database_name> < migrations/034_add_sender_to_chatbot_messages.sql
mysql -u <db_user> -p <database_name> < migrations/035_add_moderation_fields.sql
```

2. Restart backend:

```bash
cd backend
npm run dev
```

3. Validate:
- Send a human reply via the UI (demo mode) and confirm it persists without errors.
- Check schema: `DESCRIBE chatbot_messages;` should show `sender`, `flagged`, `flag_reason`, `moderated_by`, `moderated_at`.

If you only ran `034` earlier, run `035` now before testing moderation behavior.
