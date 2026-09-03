Moderation & Safety Plan

Goals
- Prevent harmful content, enable human moderation, and allow escalation.

Realtime filters
- Apply client-side quick filters (profanity, XSS sanitization) before sending.
- Server-side filter: run a lightweight classifier to flag sexual, violent, or hate content and mark messages as `flagged` in DB.

Human moderation
- Admin dashboard: view flagged messages, filter by sender, and take actions: delete, edit, or mark as reviewed.
- Recording the moderator action: admin_id, action, reason, timestamp.

Escalation
- For high-severity flags, immediately notify admin via configured channel (email or Slack).

Safety UX
- When a message is flagged, show an unobtrusive notice in the chat: "This message has been flagged for review." Do not automatically remove content unless it violates policy.

Data model additions (optional)
- Add `flagged BOOLEAN DEFAULT 0`, `flag_reason VARCHAR(255) NULL`, `moderated_by INT NULL`, `moderated_at DATETIME NULL` to `chatbot_messages`.

Testing
- Create unit tests for filter rules and integration tests for admin moderation flows.

Notes
- Balance safety with user privacy — prefer flagging and reviewing over automatic deletion where possible.
- Use a small, local classifier or regex-based filters initially; consider integrating a moderation API later.