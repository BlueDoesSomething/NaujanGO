Chatbot Goals & Metrics

Primary Goals
- Provide helpful, accurate answers to user queries.
- Enable human-in-the-loop corrections that improve transcript quality and allow moderation.
- Maintain user privacy and allow opt-in persistence for logged-out users.

Key Metrics
- Correctness: percent of agent answers judged correct by human reviewers (target: >80%).
- Helpfulness: mean Likert score (1-5) from users (target: >=4.0).
- Edit Rate: fraction of agent responses receiving a human reply (target: 5-20% depending on workload).
- Time-to-Correct: median time (seconds) between agent reply and human correction (target: <120s for active moderators).
- Safety Flags Rate: flagged messages per 1k messages (monitor for anomalies).
- Persistence Success Rate: percent of human replies successfully persisted (target: 99%).

Operational KPIs
- Uptime: backend uptime (target: 99.9%).
- Latency: median response time for `POST /api/chatbot` (target: <500ms when Python worker cached, <2s worst-case).

Notes
- Start with manual review cycles and small-sample A/B tests comparing agent-only vs agent+human transcripts.
- Use these metrics to iterate on moderation thresholds and persona tuning.