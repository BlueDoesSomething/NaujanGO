Chatbot + Agent–Human Evaluation Plan

Objectives
- Measure correctness, helpfulness, clarity, and human correction impact.
- Capture failure modes and improvement opportunities.

Metrics
- Correctness: % of agent answers judged factually correct by human reviewers.
- Helpfulness: Likert-scale 1–5 from users in a small study.
- Edit rate: fraction of agent responses that receive a human reply/correction.
- Time-to-correct: median time between agent reply and human reply.
- Safety flags: number of flagged messages per 1000 messages.

Test Types
1. Unit tests
  - Backend: POST /chatbot/human stores message with sender='human'.
  - GET /chatbot/conversation/:id returns messages array with proper sender labels.
2. Integration tests
  - Simulate user->agent->human flow and verify DB entries and UI reflect changes.
3. Manual user study
  - Recruit 8–12 participants: half play the human role; others evaluate agent-only vs agent–human transcripts.
  - Tasks: plan a day trip, ask about lodging, ask for cultural notes.
  - Collect ratings and qualitative feedback.

Acceptance Criteria for MVP
- Human replies persist and appear in the chat UI within 2s.
- Admin can view conversation and filter by `sender`.
- No accidental exposure of PII in saved transcripts.

Implementation checklist
- Add DB migration (you will apply this).
- Add backend endpoint and normalize conversation responses (done).
- Frontend save flow and UI updates (done).
- Add server-side logging for human reply events (next step).

Optional: add automated QA checks that run through sample prompts and detect hallucinations by comparing returned facts against the site DB.