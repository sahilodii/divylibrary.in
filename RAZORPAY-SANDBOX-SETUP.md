# Razorpay Test Mode setup

The site is a static HTML/JavaScript page using Supabase Auth. Payment credentials and verification run in Supabase Edge Functions; the Razorpay secret is never sent to the browser. This integration is deliberately locked to Razorpay Test Mode. The website's existing individual collection prices (₹12, ₹15, ₹17 or ₹19) and ₹79 full-access price are retained and enforced by server-side package definitions.

## Before using checkout

1. In the Razorpay Dashboard, switch to **Test Mode** and generate a Test Key ID and Test Key Secret. The Key ID must begin with `rzp_test_`.
2. In the Supabase Dashboard for project `kupggdxtgkgxahnuypsc`, open **Edge Functions → Secrets** and set:
   - `PAYMENT_MODE=test`
   - `ENABLE_LIVE_PAYMENTS=false`
   - `RAZORPAY_TEST_KEY_ID` (the Test Key ID)
   - `RAZORPAY_TEST_KEY_SECRET` (the Test Key Secret)
   - `RAZORPAY_TEST_WEBHOOK_SECRET` (a new secret value you choose in Razorpay's Test Mode webhook configuration)
   - `PAYMENT_ALLOWED_ORIGINS=http://localhost,https://divylibrary.in,https://www.divylibrary.in` (adjust to the exact website origins you use)
3. Never put a key secret in `auth-config.js`, JavaScript, a committed `.env`, or chat. Keep `.env.example` blank; actual secrets belong in Supabase Edge Function Secrets.
4. Apply `supabase/migrations/202611250002_razorpay_sandbox.sql` in the Supabase SQL Editor. It creates separate test orders, transactions, access grants, refunds, webhook events, and audit records. It does not alter the legacy purchase table or eBooks.
5. Deploy the Edge Functions from the repository root with the Supabase CLI:

   ```powershell
   supabase functions deploy razorpay-create-order
   supabase functions deploy razorpay-verify-payment
   supabase functions deploy razorpay-record-failure
   supabase functions deploy razorpay-payment-history
   supabase functions deploy razorpay-cancel-checkout
   supabase functions deploy razorpay-admin
   supabase functions deploy razorpay-webhook --no-verify-jwt
   ```

   The webhook function also has `verify_jwt = false` in `supabase/config.toml`; Razorpay authenticates webhook requests with its HMAC signature instead. All customer functions still validate a Supabase user session themselves.

## Configure Test Mode webhooks

The webhook is hosted on Supabase Edge Functions, so the URL is already public HTTPS; localhost/ngrok is not needed for this architecture. In Razorpay Test Mode, add:

`https://kupggdxtgkgxahnuypsc.supabase.co/functions/v1/razorpay-webhook`

Use the exact same webhook secret configured above. Subscribe to `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed`, and `refund.failed`. Razorpay signs the raw request body. The endpoint verifies that signature before parsing, deduplicates on `x-razorpay-event-id`, and stores a sanitized event summary without card, VPA, phone, or email details.

## Test packages and checkout

- Every collection has an individual **View pack** dialog and checkout at the exact price shown on its website card (₹12, ₹15, ₹17 or ₹19); a successful captured test payment unlocks only that collection.
- The existing **Complete Library – 12 Collections** offer is ₹79 and grants all 12 shelf IDs.

The book totals shown on the cards are calculated from the existing website pack data. User selection never supplies the amount: the Edge Function looks up the fixed package amount, creates a Razorpay Order in paise, saves the returned Order ID, and supplies the public Test Key ID to Razorpay Standard Checkout. Checkout signatures are verified server-side, payment details are fetched from Razorpay, and only a captured payment creates sandbox access.

Use Razorpay's official test methods and test values from its [Test Card Details](https://razorpay.com/docs/payments/payments/test-card-details/) and [Test UPI ID Details](https://razorpay.com/docs/payments/payments/test-upi-details/) pages. Do not enter real card data, UPI PINs, or bank credentials. Razorpay Test Mode produces genuine test Order/Payment IDs but does not debit real money. Test data never enters the legacy production purchase table.

## Admin access

The Payment Sandbox panel is shown only when a Supabase user's trusted `app_metadata.role` is `admin`. Set that claim from a trusted Supabase administrative workflow (never from a browser profile or `user_metadata`). The admin Edge Function rechecks the claim on every request. Admin refund actions call Razorpay's Test Mode Refund API; a fully processed refund revokes grants from that payment, while a partial refund leaves access intact. Reset clears only local test records, not Razorpay Dashboard records, users, or books.

## What is needed before real end-to-end payment tests

- The migration must be applied to the configured Supabase project.
- Edge Functions must be deployed.
- Razorpay Test Key ID/Secret and Test webhook secret must be entered in Supabase Edge Function Secrets.
- To test webhook delivery, the Test Mode webhook URL/events above must be saved in Razorpay.
- For admin dashboard/refunds, grant the admin app-metadata role through a trusted admin workflow.

Without those project credentials and deployment steps, the local source code cannot create actual Razorpay test orders. Do not treat a checkout UI render or unit-level signature check as a successful payment. Live keys are not read by these functions, and live payments remain disabled.

## Current content access limit

The website repository contains pack/catalog metadata and cover art, but not the source eBook PDFs. The migration records durable sandbox collection grants; it cannot provide or securely gate PDF downloads until the eBook files are stored behind authenticated storage or a protected download service. The current site preview/pack cards remain browseable as before.

## Official references

- [Razorpay Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/standard/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [Razorpay API](https://razorpay.com/docs/api/)
- [Create an Order](https://hdfcbank-collectnow-docs.razorpay.com/api/orders/create/)
- [Create a Normal Refund](https://hdfcbank-collectnow-docs.razorpay.com/api/refunds/create-normal/)
