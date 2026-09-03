Logging & Privacy Plan for Agent–Human Chat

What to log
- Required: conversation_id, message_id, sender, message_text, timestamp, language.
- Optional: user_id (if logged-in), user agent, IP (hashed), and country (derived) for analytics.

PII handling
- Do not store sensitive PII in message_text unless explicitly required and consented.
- If message_text contains clear PII (emails, phone numbers), redact or hash before persisting and flag for review.

Retention & Access
- Default retention: 90 days for message content, 365 days for aggregated metrics.
- Admins can export transcripts; exports should be logged.
- Access control: only users with `moderator` or `admin` role can view raw transcripts.

Encryption & Transport
- Use HTTPS for all transport (frontend → backend).
- At rest: ensure DB has encryption at rest (DB provider feature).

Consent & Opt-in
- For logged-out users, do not persist messages unless the user explicitly opts in (show a small checkbox "Save this conversation for research and help improve the assistant").

Breach & Deletion
- Provide API to delete a conversation (already exists) and a workflow for GDPR-style data deletion requests.

Audit & Monitoring
- Log administrative actions (deletes/edits) with admin user ID, timestamp, and action reason.
- Monitor for unusual volumes or flagged content (alerts).

Developer notes
- Implement server-side redaction helper to detect emails/phones and mask them before DB insertion.
- Consider a secondary "raw" store for admin-only review if strict redaction is enforced in primary DB.