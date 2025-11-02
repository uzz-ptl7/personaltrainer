const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FLW_SECRET) {
  console.warn('verify-flutterwave: missing required env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FLUTTERWAVE_SECRET_KEY)');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Minimal Netlify function that verifies a Flutterwave transaction and records it in Supabase
exports.handler = async function (event) {
  try {
    // Accept both webhook payloads and client POSTs with { tx_ref, transaction_id }
    const body = event.body ? JSON.parse(event.body) : {};
    const { tx_ref, transaction_id } = body;

    // Flutterwave verification endpoint (use docs to confirm current URL)
    const verifyUrl = 'https://api.ravepay.co/flwv3-pug/getpaidx/api/v2/verify';
    const verifyPayload = transaction_id ? { id: transaction_id } : { tx_ref };

    const resp = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FLW_SECRET}`,
      },
      body: JSON.stringify(verifyPayload),
    });

    const json = await resp.json();

    // Basic success check — adapt depending on Flutterwave API version
    const ok = json && (json.status === 'success' || (json.data && json.data.status === 'successful'));
    if (!ok) {
      console.warn('Flutterwave verify failed', json);
      return { statusCode: 400, body: JSON.stringify({ ok: false, json }) };
    }

    // Normalize transaction data
    const tx = (json.data && (Array.isArray(json.data) ? json.data[0] : json.data)) || json;

    // Validate expected amount/currency on your side before confirming — omitted here (implement in production)

    // Upsert into purchases table (idempotent)
    const record = {
      tx_ref: tx.tx_ref || tx_ref || tx.flw_ref,
      transaction_id: tx.id || transaction_id || tx.txid || tx.transaction_id,
      amount: tx.amount || tx.amount_paid || tx.charged_amount || null,
      currency: tx.currency || tx.currency_code || null,
      status: 'confirmed',
      metadata: tx,
    };

    const { error } = await supabase.from('purchases').insert(record).throwOnError();
    if (error) {
      console.error('Supabase insert error', error);
      return { statusCode: 500, body: JSON.stringify({ ok: false, error }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('verify-flutterwave error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
