## Quick summary

- Tech: React + TypeScript (Vite), Supabase (DB + Storage + Auth), Netlify or Vercel for serverless functions, Flutterwave for payments (recommended for Rwanda), optional SendGrid/Postmark for email.
- Goal: intake forms (Formspree optional), Supabase storage, secure payments (server-side verification), PDF delivery, admin dashboard for managing services and requests.

---

## Prerequisites (locally)

- Node.js (>=18 recommended) and npm or bun. Install dependencies:

```powershell
npm install
```

- Supabase CLI (for migrations & types):

```powershell
# Install globally (or use npx)
npm install -g supabase
# Verify
supabase --version
```

- An account on Flutterwave (for Rwanda support) and a SendGrid or Postmark account (optional, for emails).

---

## Environment variables (all required keys and where used)

Set these in your host (Netlify / Vercel / environment file) or in `index.html` bootstrap for quick local testing. Never commit secrets in source control.

- `SUPABASE_URL` — public Supabase URL (client & server) — used by `src/integrations/supabase/client.ts`.
- `SUPABASE_ANON_KEY` — Supabase anon (client) key — used by client code.
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server only). Use in serverless functions to write trusted data.
- `FLUTTERWAVE_PUBLIC_KEY` — Flutterwave JS public key for client checkout (client only).
- `FLUTTERWAVE_SECRET_KEY` — Flutterwave secret key (server only) for verify requests.
- `PAYPAL_CHECKOUT_URL` or `PAYPAL_CLIENT_ID` — optional PayPal runtime values.
- `CONTACT_FORMSPREE`, `ONE_TIME_FORMSPREE`, `FITNESS_ASSESSMENT_FORMSPREE`, `NEWSLETTER_FORMSPREE`, `TESTIMONIALS_FORMSPREE` — Formspree endpoints (optional, for email notification fallback).
- `SENDGRID_API_KEY` or `POSTMARK_API_KEY` — for email delivery of PDFs.
- `NETLIFY_AUTH_TOKEN` or equivalent — for automated deployments if you script them.

Where to set: Netlify → Site settings → Build & deploy → Environment; Vercel → Project Settings → Environment Variables.

---

## Database: apply migrations (must do this first)

The repository already contains SQL migrations under `supabase/migrations/`. Apply them to the Supabase project referenced in the repo (`ngunjnbhmvccsnurwsjm`) or your own project.

Recommended (local) using Supabase CLI:

```powershell
# Login (GUI opens)
supabase login
# From repo root, push migrations
supabase db push --project-ref ngunjnbhmvccsnurwsjm
```

If you can't use the CLI, open the Supabase dashboard → SQL Editor and run the `.sql` files one-by-one.

After migrations are applied, confirm tables exist (`contacts`, `one_time_requests`, `purchases`, `services` if present) and that RLS policies are set as expected.

---

## Regenerate Supabase TypeScript types

Regenerate DB types and store them in `src/types/supabase.ts`. This allows the app to use proper types and lets you remove `as any` casts.

```powershell
# Uses helper in package.json
npm run gen:supabase-types
# OR directly with npx
npx supabase gen types typescript --project-id ngunjnbhmvccsnurwsjm > src/types/supabase.ts

# Then run build to surface types errors
npm run build
```

Fix any TypeScript errors, replace `as any` usages, and re-run `npm run build` until green.

---

## Seed default plans / products

Option A — Admin UI (quick):
- Start the app locally (`npm run dev`) and sign in as admin. Open the Admin dashboard and use the "Seed Default Plans" button in Services tab (function `seedDefaultPlans()` exists) to create the 90-Day program and one-time products.

Option B — Manual SQL (if you prefer direct DB seed):
- Use Supabase SQL Editor and run INSERT statements into the `services` table. Example (adjust columns to your schema):

```sql
INSERT INTO services (name, price_cents, currency, description, duration_days, is_recurring, metadata)
VALUES
('90-Day Customized Program', 25000, 'USD', 'Personalized 90-day program — weekly check-ins', 90, true, '{}'),
('One-time Customized Diet Plan', 2500, 'USD', 'Custom diet plan — delivered by trainer', NULL, false, '{}');
```

---

## Implement server-side Flutterwave verification (critical)

Why: client-side checkout can be faked. You must verify each transaction server-side (or via webhook) with your `FLUTTERWAVE_SECRET_KEY` and then mark the purchase confirmed in Supabase.

Two options:
- Poll / verify after client redirects back (server endpoint verifies tx_ref). Good for immediate confirmations.
- Configure a webhook in Flutterwave dashboard to call your serverless function on status change. Webhook is more reliable (async).

Minimal Netlify function (Node + fetch). Save as `netlify/functions/verify-flutterwave.js` or implement as a Supabase Edge Function.

```javascript
// netlify/functions/verify-flutterwave.js
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async function (event) {
  try {
    const { tx_ref, transaction_id } = JSON.parse(event.body || '{}');
    // Prefer transaction_id if provided by Flutterwave webhook, otherwise verify tx_ref

    const verifyUrl = `https://api.ravepay.co/flwv3-pug/getpaidx/api/v2/verify`;
    const body = transaction_id ? { id: transaction_id } : { tx_ref };

    const resp = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FLW_SECRET}`,
      },
      body: JSON.stringify(body),
    });
    const json = await resp.json();

    if (!json || json.status !== 'success') {
      return { statusCode: 400, body: JSON.stringify({ ok: false, json }) };
    }

    const data = json.data || json;
    const tx = data[0] || data; // adjust depending on route
    // Validate amount, currency, and matching service metadata from tx.

    // Example: insert/update purchases table
    await supabase.from('purchases').insert({
      tx_ref: tx.tx_ref || tx_ref,
      transaction_id: tx.id || transaction_id,
      amount: tx.amount || tx.amount_paid,
      currency: tx.currency,
      status: 'confirmed',
      metadata: tx,
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
```

Notes:
- Replace `verifyUrl` as per Flutterwave docs (they have different endpoints per region/version). Use the docs for current endpoints.
- Use `SUPABASE_SERVICE_ROLE_KEY` in server code only (never in client bundles).
- Validate `amount` and `currency` match expected product price to prevent spoofed transactions.

Configure this endpoint in Flutterwave dashboard (or use the client-side flow to call it after checkout). If using Netlify functions, set `FLUTTERWAVE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Netlify env.

---

## Example webhook handling (signature verification)

Flutterwave supports a signature header for webhooks. Verify that signature if available. See Flutterwave docs for exact header names and verification steps.

---

## PDF delivery and email wiring (SendGrid example)

Approach A — Email a secure Supabase storage link after confirming purchase (recommended):

1. After server verifies payment, generate a signed URL for the PDF in Supabase Storage, save it in `purchases` row, and email it to the buyer.

Netlify function example (simplified):

```javascript
// netlify/functions/deliver-pdf.js
const sgMail = require('@sendgrid/mail');
const { createClient } = require('@supabase/supabase-js');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  const { purchaseId, pdfPath, userEmail } = JSON.parse(event.body);
  // Create a signed URL
  const { data, error } = await supabase.storage.from('pdfs').createSignedUrl(pdfPath, 60 * 60 * 24); // 24 hrs
  if (error) return { statusCode: 500, body: JSON.stringify(error) };

  const msg = {
    to: userEmail,
    from: 'no-reply@yourdomain.com',
    subject: 'Your purchased plan',
    html: `<p>Thanks — download your plan here: <a href="${data.signedUrl}">Download</a></p>`,
  };
  await sgMail.send(msg);
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
```

Approach B — Attach PDF directly to email (not recommended for large files).

---

## Local development and testing steps

1. Install deps:

```powershell
npm install
```

2. Start dev server:

```powershell
npm run dev
```

3. Test forms:
- Open the site locally and submit Contact, One-time Intake and Assessment forms. Confirm records appear in Supabase tables and Formspree emails arrive (if configured).

4. Test payments (Flutterwave sandbox):
- Obtain test `FLUTTERWAVE_PUBLIC_KEY` and `FLUTTERWAVE_SECRET_KEY` from dashboard.
- Use the client flow in `src/components/ServicePurchase.tsx` to run a sandbox transaction. Use the verify function to validate and mark `purchases` as confirmed.

5. Test PDF delivery:
- After confirming a purchase, run the deliver function (or allow webhook to trigger it) and confirm the user receives the signed download link via email.

---

## Deployment checklist (staging → production)

1. Apply migrations to target Supabase project.
2. Regenerate types and fix TypeScript errors.
3. Add environment variables to the host (Netlify/Vercel): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FLUTTERWAVE_SECRET_KEY` (server only), `FLUTTERWAVE_PUBLIC_KEY`, `SENDGRID_API_KEY`, Formspree keys.
4. Deploy serverless functions (verify, deliver-pdf) to the host and set env vars there.
5. Configure Flutterwave webhook to point at your `verify` function URL. Test with a sandbox tx and confirm webhook delivery.
6. Seed default plans and test admin UI flows.
7. Run production smoke tests (form submissions, purchase, email delivery).

---

## Security notes

- Never put `SUPABASE_SERVICE_ROLE_KEY` or `FLUTTERWAVE_SECRET_KEY` in client code or commit them in source.
- Validate amounts/currency when verifying transactions.
- Use signed URLs for PDF delivery and set appropriate expiry times.
- Use CAPTCHA or server-side spam checks for public forms if you get abuse.

---

## Troubleshooting

- If `npx supabase gen types ...` fails, ensure `supabase` is installed or use the Supabase web UI to export types. Check network and that `SUPABASE_URL`/project id are correct.
- If admin UI shows no data, confirm migrations were applied to the same Supabase project referenced in the frontend env vars.

---

## Minimal examples and quick commands

Apply migrations:

```powershell
supabase login
supabase db push --project-ref ngunjnbhmvccsnurwsjm
```

Generate types:

```powershell
npm run gen:supabase-types
npm run build
```

Start local dev server:

```powershell
npm run dev
```

Deploy (Netlify): create site, set env vars, add functions, then push branch to Git and Netlify will build/deploy.

---

## Next recommended actions (what I can implement for you)

1. Implement and add a working serverless `verify-flutterwave` function for Netlify/Supabase Edge Functions and wire it to the repo.
2. Implement `deliver-pdf` Netlify function which sends signed Supabase links via SendGrid.
3. Regenerate Supabase types and replace `as any` casts.
4. Add an automated seed script (`npm run seed:plans`) to create the default services if you prefer automatic seeding.

Tell me which one you want me to do next and I will implement it and run local validation. If you want the full implementation now, I’ll start with the server-side payment verification (recommended priority).
