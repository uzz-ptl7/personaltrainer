## Quick summary

-- Tech: React + TypeScript (Vite), Supabase (DB + Storage + Auth), Netlify or Vercel for serverless functions, payments via Mobile Money and Bank Transfer, optional SendGrid/Postmark for email.

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

-- A SendGrid or Postmark account (optional, for emails). Payments are processed manually via Mobile Money or Bank Transfer.

---

## Environment variables (all required keys and where used)

Set these in your host (Netlify / Vercel / environment file) or in `index.html` bootstrap for quick local testing. Never commit secrets in source control.

- `SUPABASE_URL` — public Supabase URL (client & server) — used by `src/integrations/supabase/client.ts`.
- `SUPABASE_ANON_KEY` — Supabase anon (client) key — used by client code.
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server only). Use in serverless functions to write trusted data.
  -- `PAYPAL_CHECKOUT_URL` or `PAYPAL_CLIENT_ID` — optional PayPal runtime values (if you choose to re-add PayPal).
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

## Payments

This project currently supports manual payment workflows: Mobile Money (MoMo) and Bank Transfer.

- Clients create a purchase which is saved with `payment_method` (either `momo` or `bank`) and `payment_status: 'pending'`.
- Admins can view the purchase and mark `payment_status` as `completed` once they confirm receipt of funds via the chosen channel.

If you want to re-add or integrate a third-party checkout provider (cards/online gates), implement a server-side verification function and update `src/components/ServicePurchase.tsx` accordingly.

---

## Example webhook handling (signature verification)

If you integrate a third-party payment gateway in future, follow that provider's webhook/signature verification docs.

---

## PDF delivery and email wiring (SendGrid example)

Approach A — Email a secure Supabase storage link after confirming purchase (recommended):

1. After server verifies payment, generate a signed URL for the PDF in Supabase Storage, save it in `purchases` row, and email it to the buyer.

Netlify function example (simplified):

```javascript
// netlify/functions/deliver-pdf.js
const sgMail = require("@sendgrid/mail");
const { createClient } = require("@supabase/supabase-js");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const { purchaseId, pdfPath, userEmail } = JSON.parse(event.body);
  // Create a signed URL
  const { data, error } = await supabase.storage
    .from("pdfs")
    .createSignedUrl(pdfPath, 60 * 60 * 24); // 24 hrs
  if (error) return { statusCode: 500, body: JSON.stringify(error) };

  const msg = {
    to: userEmail,
    from: "no-reply@yourdomain.com",
    subject: "Your purchased plan",
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

4. Test payments (Mobile Money / Bank Transfer):

- Create a purchase from the client UI. The purchase will be saved with `payment_status: 'pending'` and the selected `payment_method`.
- Complete a manual Mobile Money or Bank transfer outside the app using the provided purchase ID as reference.
- As admin, confirm receipt and mark the purchase `payment_status: 'completed'` in the Admin Dashboard.

5. Test PDF delivery:

- After confirming a purchase, run the deliver function (or allow webhook to trigger it) and confirm the user receives the signed download link via email.

---

## Deployment checklist (staging → production)

1. Apply migrations to target Supabase project.
2. Regenerate types and fix TypeScript errors.
3. Add environment variables to the host (Netlify/Vercel): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SENDGRID_API_KEY`, Formspree keys.
4. Deploy serverless functions (deliver-pdf) to the host and set env vars there.
5. Seed default plans and test admin UI flows.
6. Run production smoke tests (form submissions, purchase, email delivery).

---

## Security notes

-- Never put `SUPABASE_SERVICE_ROLE_KEY` or any secret keys in client code or commit them in source.

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

1. Implement `deliver-pdf` Netlify function which sends signed Supabase links via SendGrid or Postmark after admin confirms purchase payment.
2. Regenerate Supabase types and replace `as any` casts.
3. Add an automated seed script (`npm run seed:plans`) to create the default services if you prefer automatic seeding.

Tell me which one you want me to do next and I will implement it and run local validation.
