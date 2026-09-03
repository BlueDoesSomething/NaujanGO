Agent–Human Chat UX Flow

Goal
- Provide a clear, lightweight interface where an automated agent and a human collaborator can alternate turns, record corrections, and produce a single transcript that distinguishes agent and human contributions.

Actors
- Visitor (site user): interacts with the chat UI.
- Agent (automated chatbot): existing chatbot responses.
- Human collaborator: a logged-in moderator or user who can add human replies when demo mode is enabled.
- Admin/Moderator: reviews human replies, can remove or edit entries.

Key Screens / Elements
- Chat widget toggle: open/close chat bubble.
- Header controls: language selector, history, "Agent–Human demo" toggle (visible to logged-in users), new conversation, clear chat.
- Messages area: messages labelled with sender badges (`bot`, `user`, `human`) and timestamps.
- Human reply CTA: when demo mode is ON and bot replies, show a highlighted "Reply as human" button or enable an input with label "Add human reply".
- Persist toggle: (optional) checkbox to persist human replies to DB.
- Transcript export: admin action to export conversation with sender labels.

Turn-taking rules
- Default flow: user -> agent -> user.
- In demo mode: user -> agent -> (UI prompts human) -> agent may be re-invoked by sending a new message.
- Human replies are explicitly labelled and saved as `sender: human`.

Error & Edge Cases
- If backend is unavailable when saving human reply, fallback to local append and flag message as unsaved (toast + retry).
- Respect user privacy: only persist human replies when the user is logged in or when the user explicitly opts in.

Accessibility
- Keyboard-accessible controls for toggling demo and sending human replies.
- ARIA labels for sender badges and input fields.

Logging & Audit
- Each persisted message stores: conversation_id, sender, message_text, user_id (if available), timestamp, language.
- Admin interface: view per-conversation messages, filter by sender, delete or flag messages.

Implementation Notes
- Frontend: reuse existing `Chatbot.jsx` UI; add `Send as Human` flow and demo toggle (already implemented).
- Backend: add `POST /chatbot/human` to save the human reply and update `GET /conversation/:id` to return normalized messages (done).
- DB: add `sender` column to `chatbot_messages` (you will run migration).


Testing
- Manual test: enable demo, have bot reply, click "Send as Human", confirm message persists and appears with `human` badge.
- Admin test: delete a human message and confirm removal from UI and DB.