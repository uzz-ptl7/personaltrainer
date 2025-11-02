Client features summary and integration notes

This document lists what the repository already contains (based on a quick scan) and the small additions added here to cover gaps in the client's requirements. Payments are intentionally ignored because there is currently no gateway configured.

What the repo already includes (found in codebase)

- Fitness assessment flow: `src/components/FitnessAssessment.tsx` and dashboard support in `src/components/Dashboard.tsx`.
- Admin managers for Diet and Service plans (upload/download): `src/components/DietPlanManager.tsx`, `src/components/ServicePlanManager.tsx`.
- Video/testimonial placeholders and gallery usage: `src/components/Testimonials.tsx`, `src/components/FitnessGallery` referenced in `src/pages/Index.tsx`.
- Service purchase and store components: `src/components/ServicePurchase.tsx`, `src/components/ServicesStore.tsx`.
- Supabase integration types appear under `src/integrations/supabase/types.ts` (the project appears to use Supabase for backend storage).

What I added (no existing files were modified):

1. `src/components/OneTimeIntakeForm.tsx` — a small, accessible form for one-time/custom-plan buyers. It posts to a configurable endpoint (defaults to `/api/one-time-intake`). Use it on a product page or after a successful one-time purchase to collect short intake info.

2. `src/lib/integrations/googleSheets.ts` — helper + examples for two common flows:

   - `appendRowViaAppsScript(webAppUrl, values)` — browser- or client-friendly POST to a Google Apps Script web-app URL. Easiest for quickly pushing form submissions to Sheets without server credentials.
   - `serverAppendRowWithServiceAccount` — server-side Node example showing how a server function could append rows using a service account and `googleapis` (must run on server, do not include service account keys in client code).

3. `README_CLIENT.md` (this file) — explains what's present, what I added, and configuration notes below.

How to wire things up (recommended minimal setups)

A) One-time purchase + custom plan (no payment gateway changes)

- Use `OneTimeIntakeForm` component on your one-time purchase confirmation page.
- Configure `(window).ONE_TIME_INTAKE_ENDPOINT` to point to either:
  - A Supabase function (store submission into a table), or
  - A serverless function (Netlify/Vercel/Azure) that: appends to Google Sheets, notifies the trainer by email, and optionally stores a record in Supabase.
- Trainer manually creates the custom PDF and uploads it to the admin area (DietPlanManager/ServicePlanManager) or sends it by email.

B) Daily logs and trainers monitoring (Google Sheets option)

- Fast setup: create a Google Form that writes to a Google Sheet; share the Sheet with the trainer.
- If you prefer programmatic writes (form submissions from website): publish a Google Apps Script web app which accepts POST JSON and appends rows to the target Sheet. Use `appendRowViaAppsScript` to call the web app URL from the client or from a server endpoint.
- For a secure, robust setup, create a server endpoint that uses a Google service account + `googleapis` to append rows server-side (see `serverAppendRowWithServiceAccount`). Don't store credentials in frontend.

C) Delivering PDFs to clients

- Manual flow (simple): Trainer uploads the generated PDF to the admin area (`DietPlanManager` or `ServicePlanManager`) and uses the existing download links to send to clients (copy link + email it).
- Automatic email delivery (recommended later): add a small serverless function that takes the submission ID and sends the PDF using an email provider (SendGrid, Postmark). The repo already contains upload managers, so add a server route to trigger email delivery.

D) Video content

- The repo already has a gallery/testimonials with placeholder videos. Replace placeholder URLs with recorded videos (host on a CDN, YouTube unlisted, or cloud storage) and update `FitnessGallery`/`Testimonials` entries.

Security and notes

- Do NOT put Google service-account JSON into client code. Use server functions or Google Apps Script web apps for safe handling.
- Payments: intentionally not implemented here. Hook whatever gateway you choose into the checkout flow; the existing `ServicePurchase`/`ServicesStore` components are a good place to call your gateway and then show forms after successful purchase.

Next steps I recommend (optional)

- Wire `OneTimeIntakeForm` submissions to a Supabase table or serverless function.
- Add a serverless endpoint for sending PDFs by email after trainer uploads them (connect to SendGrid/Postmark).
- Create a small admin UI page for "pending one-time requests" (lists form submissions) if you want a fully automated flow.

If you want, I can:

- Implement a small serverless function (Netlify/Vercel) that accepts the intake form and appends to Google Sheets via Apps Script or sends an email automatically.
- Hook the intake form to Supabase (I can add the client call if you want me to use the repo's Supabase integration patterns).

(Work done in this pass: created `OneTimeIntakeForm.tsx` and `src/lib/integrations/googleSheets.ts` and this README.)

## Formspree + Supabase wiring (what I changed)

I added Formspree POSTs (placeholder URLs) and Supabase saves to the public-facing forms so you get both an email notification (via Formspree) and a stored record (via Supabase). Below are the exact places and how to change the Formspree link.

Files and where to change the Formspree placeholder URL

- `src/components/Contact.tsx`

  - Constant used at runtime: `(window as any).CONTACT_FORMSPREE`
  - Placeholder: `https://formspree.io/f/your-form-id`
  - What this form is: "Book Your Free Consultation" — collects name, phone, email, message. Submits to Formspree and is inserted into Supabase `contacts` table.

- `src/components/OneTimeIntakeForm.tsx`

  - Constant used at runtime: `(window as any).ONE_TIME_FORMSPREE`
  - Placeholder: `https://formspree.io/f/your-form-id`
  - What this form is: short intake for one-time/custom-plan buyers. Submits to Formspree, inserts into Supabase `one_time_requests`, and (keeps) calls the original endpoint (`(window).ONE_TIME_INTAKE_ENDPOINT`)

- `src/components/FitnessAssessment.tsx`

  - Constant used at runtime: `(window as any).FITNESS_ASSESSMENT_FORMSPREE`
  - Placeholder: `https://formspree.io/f/your-form-id`
  - What this form is: fitness assessment (health metrics). It already saved to Supabase table `fitness_assessments`; I added an optional Formspree POST to notify you by email.

- `src/components/EmailMarketing.tsx`

  - Constant used at runtime: `(window as any).NEWSLETTER_FORMSPREE`
  - Placeholder: `https://formspree.io/f/your-form-id`
  - What this form is: newsletter signup. It still invokes `save-to-sheets` Supabase function and also posts to Formspree.

- `src/components/Testimonials.tsx`
  - Constant used at runtime: `(window as any).TESTIMONIALS_FORMSPREE`
  - Placeholder: `https://formspree.io/f/your-form-id`
  - What this form is: text testimonial submission modal used by authenticated users. Submits to Supabase `text_testimonials` and posts to Formspree.

Notes and security

- I intentionally did NOT change authentication or admin-only forms (signin/signup in `Auth.tsx`, admin upload forms in `DietPlanManager.tsx` and `ServicePlanManager.tsx`) because those handle sensitive data and should not be relayed through third-party form endpoints.
- I also cast some Supabase calls to `as any` to avoid TypeScript errors where the project's generated DB types don't include the example tables (`contacts`, `one_time_requests`). Please create those tables in Supabase or update the repo's `src/integrations/supabase/types.ts` accordingly.
- Replace each `https://formspree.io/f/your-form-id` with your actual Formspree form URL. I provided the exact window property names above to make runtime configuration easy (you can set them from a script or environment bootstrapping code).

How to change the Formspree link (quick steps)

1. Open the file for the form you want to change (paths above).
2. Replace the placeholder runtime constant in your environment before app boot, for example in `index.html` or a small script that runs before React mounts:

```html
<script>
  window.CONTACT_FORMSPREE = "https://formspree.io/f/your-real-id";
  window.ONE_TIME_FORMSPREE = "https://formspree.io/f/your-real-id";
  window.FITNESS_ASSESSMENT_FORMSPREE = "https://formspree.io/f/your-real-id";
  window.NEWSLETTER_FORMSPREE = "https://formspree.io/f/your-real-id";
  window.TESTIMONIALS_FORMSPREE = "https://formspree.io/f/your-real-id";
</script>
```

3. Alternatively, edit the file directly and replace the placeholder string `"https://formspree.io/f/your-form-id"` with your real URL.

Phone / WhatsApp updates

- I updated the public contact number and WhatsApp link to `+250788624496` across the site. Files changed: `src/components/Contact.tsx`, `src/components/FitnessAssessment.tsx`, `src/components/Dashboard.tsx`.

If you'd like, I can also:

- Create the Supabase tables `contacts` and `one_time_requests` migration SQL and add it to `migrations/`.
- Wire a small serverless endpoint that validates the form data before forwarding to Formspree (helps with spam and adds reCAPTCHA).
