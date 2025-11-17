// DEPRECATED: Flutterwave verification function removed.
// The project no longer supports Flutterwave/IremboPay client-side integrations.
// This endpoint is left as a deprecated stub to avoid runtime 404s if referenced.

exports.handler = async function () {
  return {
    statusCode: 410,
    body: JSON.stringify({
      ok: false,
      message: "Flutterwave verification endpoint has been removed.",
    }),
  };
};
