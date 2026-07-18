# Secure verified booking backend

This Cloudflare Worker implements the direct-booking state machine:

`verification_pending -> owner_review -> invoice_creating -> awaiting_payment -> payment_processing -> paid`

Rejected, failed, and conflict/refund states are terminal. The public calendar is changed only after a signed Stripe `invoice.paid` event. A D1 `payment_holds` table provides the private 24-hour payment lock and prevents overlapping invoices.

## 1. Rotate exposed credentials first

The old Stripe test key and Airbnb iCal token appeared in repository history. Rotate both in Stripe and Airbnb before deployment. Do not reuse them. The current Apps Script reads sensitive values from Script Properties instead of source code.

## 2. Accounts required

- Cloudflare Workers, D1, and Turnstile
- Truvi with Screening + ID Verification and API access
- Stripe Invoicing
- Resend with a verified sending domain
- The existing Google Apps Script and direct-booking calendar

Truvi supplies the production booking endpoint, webhook secret, and exact account payload during onboarding. Its account-specific field mapping is isolated in `src/truvi.js`; confirm those aliases with the documentation Truvi provides before production use.

## 3. Configure Google Apps Script

Replace the deployed script with `../google-apps-script-calendar-sync.gs`. In Apps Script, open **Project Settings -> Script Properties** and add:

- `AIRBNB_ICAL_URL`
- `DIRECT_BOOKING_CALENDAR_ID`
- `OWNER_EMAIL`
- `CALENDAR_COMMAND_TOKEN` (a new random value shared only with the Worker)

Remove any legacy `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_TOKEN` Script Properties. Stripe now communicates only with the signed Worker webhook. Deploy a new web-app version.

## 4. Create and configure the Worker

From this directory:

```sh
npm install
npx wrangler login
npx wrangler d1 create five-elements-bookings
```

Paste the returned database ID into `wrangler.toml`, then set `PUBLIC_API_URL`, `FROM_EMAIL`, and the production site origin. Apply the schema:

```sh
npm run db:remote
```

Store secrets (never put them in `wrangler.toml`):

```sh
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put TRUVI_API_KEY
npx wrangler secret put TRUVI_CREATE_BOOKING_URL
npx wrangler secret put TRUVI_WEBHOOK_SECRET
npx wrangler secret put CALENDAR_API_URL
npx wrangler secret put CALENDAR_COMMAND_TOKEN
```

Deploy with `npm run deploy`.

## 5. Configure callbacks

- Truvi webhook: `https://YOUR-WORKER/webhooks/truvi`
- Stripe webhook: `https://YOUR-WORKER/webhooks/stripe`
- Stripe event: `invoice.paid`

Use the signing secret Stripe generates for this specific webhook. The Worker validates the signature and rejects events older than five minutes.

## 6. Connect the website

In `../calendar-config.js`, set:

- `bookingApiUrl` to the Worker URL
- `turnstileSiteKey` to the public Turnstile site key

Keep the Turnstile secret only in the Worker.

## 7. Test before going live

Run `npm test`, deploy using Stripe test mode, and verify all of these cases:

1. Missing/failed verification cannot reach the owner.
2. Approved and flagged verification reaches the owner with the correct report.
3. Merely opening the owner email does not change state.
4. Reject sends no invoice.
5. Approve sends one invoice even after repeated clicks.
6. Overlapping approved requests cannot both get invoices.
7. Dates stay publicly available before payment.
8. A signed `invoice.paid` event creates one calendar block and sends confirmations.
9. Replayed or forged Stripe and Truvi events are rejected or ignored.
10. A calendar conflict produces an automatic refund and owner/guest alerts.

Do not switch Stripe, Truvi, or Resend to production until the full test matrix passes.
