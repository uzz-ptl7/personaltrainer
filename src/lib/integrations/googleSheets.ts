/*
  Google Sheets integration helper

  This file provides two lightweight helpers and examples:
  1) appendRowViaAppsScript - a simple browser-friendly POST to a published Google Apps Script webapp URL (recommended for quick setup)
  2) serverAppendRowWithServiceAccount - server-side example using Google Sheets API and a service account (Node.js)

  NOTE: This file only provides examples and utilities; credentials must NOT be stored in client code.
*/

export async function appendRowViaAppsScript(webAppUrl: string, rowValues: Array<string | number | null>) {
  // webAppUrl: the published Google Apps Script "web app" URL which accepts POST requests and appends rows.
  // Example payload expected by your Apps Script: { values: ["name","email","goal","level"] }
  const body = { values: rowValues };
  const res = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Apps Script append failed: ${res.status} ${text}`);
  }

  return res.json();
}

/*
  Server-side Node.js example (not for browsers) using googleapis and a service account.
  Save as server code or a serverless function; DO NOT run this in the browser.

  npm install googleapis

  Example usage:

  const result = await serverAppendRowWithServiceAccount(process.env.GSA_KEY_JSON, 'your-sheet-id', 'Sheet1!A:A', ['Alice','alice@example.com','weight_loss']);

*/

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function serverAppendRowWithServiceAccount(gsaKeyJson: string | object, spreadsheetId: string, range: string, values: Array<string | number | null>) {
  // This function is intentionally written as an example and is synchronous-friendly for server code.
  // The googleapis package is only used in server-side code. Suppress TS errors when types aren't installed.
  // @ts-ignore
  const { google } = await import('googleapis');

  const key = typeof gsaKeyJson === 'string' ? JSON.parse(gsaKeyJson) : gsaKeyJson;

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });

  return res.data;
}

export default { appendRowViaAppsScript, serverAppendRowWithServiceAccount };
