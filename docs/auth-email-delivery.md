# Verification email delivery

## What is confirmed

New-account registration uses SMTP through `backend/services/authMailer.js`.
The code-entry screen means the send endpoint returned success; it does **not**
prove arrival in the inbox. SMTP acceptance can still be followed by spam
filtering, quarantine, a delayed bounce, or a provider policy rejection.

The reported flow is **new registration**, on **Railway Pro or higher**, showing
success but no received email. The deployed SMTP result and inbox delivery have
not been inspected. Local SMTP configuration does not prove deployment settings.
No live email, SMTP authentication, credential changes or database migration was
performed for this fix.

## Fixes

- Validate SMTP settings, support `MAIL_FROM` then `SMTP_FROM` then `SMTP_USER`,
  and bound DNS/connection/greeting/socket waits. Do not disable TLS verification.
- Reuse a transporter only while its configuration matches. Missing settings
  are not cached forever. Provider errors return fixed diagnostic codes, not
  raw server responses that might contain secrets or addresses.
- Require SMTP acceptance of the actual recipient. A resolved `sendMail` result
  with no accepted recipient no longer counts as sent.
- Publish a registration candidate only after SMTP acceptance. Failed initial
  attempts leave no unusable session; failed repeat attempts/resends preserve a
  previously sent code and its original expiry.
- Serialize registration sending per email within the process. Resends are
  limited per email/IP. Completing registration during a resend cannot revive
  the already-consumed session.
- Login-page **Resend verification** now actually issues and sends a verification
  **link** through the existing token route. It used to send nothing. Unknown,
  verified, and unverified accounts receive the same generic production response
  so the endpoint does not disclose account state or promise successful delivery.
  Earlier unexpired verification links survive send failure. Password-reset
  token issuance retains its previous invalidation behavior.
- Do not log message bodies, verification/reset links, codes, passwords, or raw
  SMTP responses. Production responses never include development codes/links.
- Registration shows the intended address and spam-folder guidance. The code
  form stays available after an incorrect-code error instead of disappearing.

`delivered: true` in the internal mailer result means **accepted by SMTP**, not
confirmed inbox delivery. No automatic email retry or verification bypass is
introduced. No bookings, payments, or business-document data are changed.

## Production settings (backend service)

Check these privately in Railway's **backend service**, not the frontend:

| Variable | Expected |
| --- | --- |
| `NODE_ENV` | `production` |
| `SMTP_HOST` | Provider host; Gmail: `smtp.gmail.com` |
| `SMTP_PORT` | Gmail: `587` (STARTTLS) or `465` (TLS) |
| `SMTP_SECURE` | Optional: `false` for 587, `true` for 465; defaults from port |
| `SMTP_USER` | Sending account's full login address |
| `SMTP_PASS` | SMTP credential; Gmail requires a valid Google App Password |
| `MAIL_FROM` | Authorized sender; use the Gmail account or an approved alias |
| `SMTP_FROM` | Optional alternative when `MAIL_FROM` is absent |
| `FRONTEND_URL` | Canonical frontend URL for login verification/reset links |

Do not paste credential values into chat or source control. Gmail's App Password
requires two-step verification and may be restricted by Workspace policy. Avoid
accidental quotes or copying visual grouping spaces into the credential.
Redeploy after updating Railway variables. If recently upgrading to Pro, Railway
also requires redeploying the affected service to enable SMTP.

[Railway's outbound networking documentation](https://docs.railway.com/networking/outbound-networking)
states that SMTP is available only on Pro and above. Free, Trial and Hobby
require a transactional email provider's HTTPS API. Do not assume this restriction
is the cause of a failure on Pro or that switching SMTP ports bypasses it.

## Diagnose without sending an email

After deployment, a logged-in **admin** may explicitly open
`/api/auth/test-smtp` on the backend through the authenticated app/API. This
existing endpoint now uses exactly the same configuration/timeouts as sending,
returns `private, no-store`, and reports only configuration-presence flags and
safe status/error codes. It calls Nodemailer's `verify()` (network connection and
authentication); it does **not** send email or prove inbox delivery. It is not
called automatically by registration, and was not called against a live service
during this work.

| Result | Next check |
| --- | --- |
| `SMTP_NOT_CONFIGURED` | Required variable names listed in `missing`; set them privately on the backend |
| `SMTP_CONFIG_INVALID` | Port, boolean TLS setting, or malformed sender/host |
| `EAUTH`, SMTP `535` | Sending account, App Password, Google security events/Workspace policy |
| `ETIMEDOUT`, `ECONNECTION`, `ESOCKET` | Redeployment after Pro upgrade, host/port, TLS, network/provider restrictions |
| `EDNS`, `ENOTFOUND`, `EAI_AGAIN` | Provider hostname and DNS |
| `RECIPIENT_NOT_ACCEPTED`, `EENVELOPE` | Recipient address, authorized sender, provider sending policies/limits |
| `connected` | SMTP authentication works, but send/recipient acceptance and inbox delivery are not proven |

For **success with no email**, first confirm the displayed recipient and check
Spam/Junk, All Mail and organization quarantine. Privately inspect the sending
account/provider for bounce notifications, sending limits and security alerts.
If using a custom sender/domain, confirm sender authorization and SPF/DKIM/DMARC
alignment with that provider. Share only fixed error codes and SMTP response
numbers for diagnosis, never full old logs: older code could log live token URLs.

## Limits and tests

Registration sessions still use process memory: they expire after 10 minutes,
are lost on restart, and are not shared across replicas. This patch does not
introduce a shared registration store or solve post-SMTP inbox filtering.

Run the offline regression tests from `backend/`:

```powershell
node --test tests/auth-mailer.test.js tests/auth-verification.test.js
```

All SMTP methods and databases are mocked; HTTP tests use localhost only.
The tests cover initial send, recipient rejection, SMTP errors, resends,
concurrent requests, code verification/account creation, login-link verification,
token preservation, generic production responses, safe logs and admin diagnostics.
Live end-to-end validation requires the user's explicit approval and a controlled
test recipient; the test suite alone cannot establish inbox delivery.
