# Five Elements Smoky Calendar Setup

This setup uses one inbound calendar and one outbound calendar:

- Inbound: Airbnb iCal export. Airbnb already syncs with Vrbo, so the website only needs to read Airbnb.
- Outbound: Google Calendar for paid direct bookings. Airbnb imports this Google Calendar iCal URL and blocks pending or approved website bookings.

## 1. Get The Airbnb iCal URL

1. Log in to Airbnb.
2. Go to your listing calendar.
3. Open availability or calendar sync settings.
4. Choose export calendar.
5. Copy the Airbnb iCal URL.
6. Paste it into `google-apps-script-calendar-sync.gs`:

```js
AIRBNB_ICAL_URL: "PASTE_AIRBNB_ICAL_URL_HERE",
```

## 2. Get The Google Calendar ID

Use the Google Calendar you already made for approved website/direct-booking blocks.

1. Open Google Calendar on desktop.
2. In the left sidebar, hover over the direct-booking calendar.
3. Click the three dots, then Settings and sharing.
4. Scroll to Integrate calendar.
5. Copy Calendar ID.
6. Paste it into `google-apps-script-calendar-sync.gs`:

```js
DIRECT_BOOKING_CALENDAR_ID: "PASTE_GOOGLE_CALENDAR_ID_HERE",
```

## 3. Get The Google Calendar iCal Link For Airbnb

1. In the same Google Calendar settings page, find Integrate calendar.
2. Copy Secret address in iCal format.
3. In Airbnb, import this Google Calendar iCal URL.

This is what lets Airbnb see dates you approve and add to the direct-booking calendar. You do not need to make the calendar public if you use the secret iCal address.

## 4. Create The Google Apps Script Web App

1. Go to [script.google.com](https://script.google.com/).
2. Create a new project.
3. Replace the starter code with the contents of `google-apps-script-calendar-sync.gs`.
4. Paste your Airbnb iCal URL, Google Calendar ID, owner email, Stripe secret key, website URL, and public price calendar URL in the `CONFIG` block.
5. Click Deploy, then New deployment.
6. Choose Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. Deploy and authorize the requested permissions.
10. Copy the Web app URL.

## 5. Connect The Website

Paste the Web app URL into `calendar-config.js`:

```js
apiUrl: "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE",
```

Upload these changed files to Hostinger:

- `index.html`
- `styles.css`
- `script.js`
- `calendar-config.js`

The `.gs` file is only for Google Apps Script and does not need to be uploaded to Hostinger.

## 6. Connect Stripe Checkout

1. In Stripe, copy your secret key. Use a `sk_test_...` key while testing, then switch to a live `sk_live_...` key.
2. Paste it into `google-apps-script-calendar-sync.gs`:

```js
STRIPE_SECRET_KEY: "PASTE_STRIPE_SECRET_KEY_HERE",
```

3. Confirm these URLs match the live website:

```js
SITE_URL: "https://fiveelementsdestin.com",
PRICE_CALENDAR_URL: "https://fiveelementsdestin.com/price-calendar.js",
```

4. Set a long random webhook token:

```js
STRIPE_WEBHOOK_TOKEN: "PASTE_RANDOM_WEBHOOK_TOKEN_HERE",
```

5. Redeploy the Apps Script web app after changing the script.
6. In Stripe, add a webhook endpoint:

```text
PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE?action=stripeWebhook&token=PASTE_RANDOM_WEBHOOK_TOKEN_HERE
```

Listen for this event:

```text
checkout.session.completed
```

7. Make a short test booking with Stripe test card `4242 4242 4242 4242`, any future expiration date, any CVC, and any ZIP code.

## Important Notes

- iCal syncing is not instant. Airbnb and Vrbo poll imported calendars on their own schedule.
- Departure dates are checkout dates, so they are not blocked as a booked night.
- Stripe Checkout is created by Apps Script so the Stripe secret key is never exposed in the browser.
- After Stripe confirms payment through the webhook, Apps Script creates a pending Google Calendar hold. The owner approval email has links to approve or reject/refund the booking.
- Rejecting a booking deletes the Google Calendar hold and creates a full Stripe refund.
- Pricing is loaded from the public `price-calendar.js` file for Checkout. Keep that file published with the website whenever rates change.
