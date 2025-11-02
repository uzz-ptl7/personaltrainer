const sgMail = require("@sendgrid/mail");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SENDGRID_API_KEY) {
  console.warn(
    "deliver-pdf: missing required env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SENDGRID_API_KEY)"
  );
}

sgMail.setApiKey(SENDGRID_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async function (event) {
  try {
    const { purchaseId, pdfPath, userEmail } = JSON.parse(event.body || "{}");
    if (!purchaseId || !pdfPath || !userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "purchaseId, pdfPath and userEmail required",
        }),
      };
    }

    // Create a signed URL valid for 24 hours
    const { data, error } = await supabase.storage
      .from("pdfs")
      .createSignedUrl(pdfPath, 60 * 60 * 24);
    if (error) {
      console.error("createSignedUrl error", error);
      return { statusCode: 500, body: JSON.stringify({ error }) };
    }

    const msg = {
      to: userEmail,
      from: process.env.EMAIL_FROM || "no-reply@yourdomain.com",
      subject: "Your purchased plan",
      html: `<p>Thanks — download your plan here: <a href="${data.signedUrl}">Download</a></p>`,
    };

    await sgMail.send(msg);

    // Optionally update purchase row to mark delivered
    await supabase
      .from("purchases")
      .update({ delivered: true, delivered_at: new Date().toISOString() })
      .eq("id", purchaseId);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("deliver-pdf error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
