# Dashboard notifications and sidebar guide

- **Admin → Notifications** (`/admin/notifications`) and **Owner → Notifications** (`/owner/notifications`) show the signed-in account's existing notifications. Owners' direct messages remain under **Messages**.
- Each sidebar shows the unread count among the latest 50 alerts. The page supports search, unread filtering, refresh, individual read actions and **Mark all read**. Mark all also affects older alerts for that account; it never deletes records.
- Alerts refresh when the dashboard opens, when Notifications is selected, with the Refresh button, and on window focus. There is no browser/push permission prompt, polling loop or fabricated activity.
- Known booking, payment and owner-message alerts link to their respective modules, not arbitrary URLs. Opening a module does not confirm a booking, verify money or send a message. Limited owners can read their own alerts without gaining restricted module access.
- Failed loads and read updates are retryable. Previously loaded data stays visible with a stale-data warning instead of an invented empty list.
- The admin sidebar groups existing modules under **Daily work**, **People & verification**, **Tourism content**, and **Insights & system**, with short explanations. The guide is scrollable on mobile and supports the existing menu toggle plus Escape to close.

This uses the existing authenticated `/messages/notifications` APIs and tables. No database migration or new notification-generation workflow is introduced. Admins see notifications addressed to their own account, not every owner's private alerts.

Offline checks:

- `backend`: `node --test tests/dashboard-notifications.test.js`
- `frontend`: `node --test --test-concurrency=1 tests/dashboard-notifications.test.mjs tests/dashboard-notifications-browser.test.mjs tests/owner-dashboard.test.mjs`
