# Order Email Automation Setup

This project now includes:

- `netlify/functions/create-checkout-session.js`
- `netlify/functions/stripe-webhook.js`

The checkout session creates the Stripe payment.
The webhook sends the order confirmation email after Stripe confirms payment.

## 1. Netlify environment variables

Add these in Netlify:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `ORDER_FROM_EMAIL`
- `SUPPORT_EMAIL`
- `STORE_NAME`

Example values:

```env
STRIPE_SECRET_KEY=sk_live_or_test_here
STRIPE_WEBHOOK_SECRET=whsec_here
RESEND_API_KEY=re_here
ORDER_FROM_EMAIL=orders@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
STORE_NAME=London Fit
```

## 2. Create the Stripe webhook

In the Stripe Dashboard:

1. Go to `Developers`
2. Open `Webhooks`
3. Click `Add endpoint`
4. Use this endpoint:

```text
https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/stripe-webhook
```

5. Select this event:

```text
checkout.session.completed
```

6. Save it
7. Copy the webhook signing secret
8. Put that value in Netlify as `STRIPE_WEBHOOK_SECRET`

## 3. Set up Resend

1. Create a Resend account
2. Add and verify your sending domain
3. Create an API key
4. Put the API key in Netlify as `RESEND_API_KEY`
5. Set `ORDER_FROM_EMAIL` to an email from your verified domain

## 4. Redeploy

After saving the environment variables:

1. Go to Netlify `Deploys`
2. Trigger a new deploy

## 5. Test flow

1. Place a test order
2. Complete Stripe checkout
3. Stripe sends `checkout.session.completed`
4. Netlify webhook receives it
5. Resend sends the confirmation email

## 6. What the customer receives

The automatic email says:

- payment was received
- order is being processed
- colour, size and quantity
- total paid
- order reference
- tracking will be sent after dispatch
