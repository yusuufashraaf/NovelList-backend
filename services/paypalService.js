const paypal = require('@paypal/checkout-server-sdk')
// Configure PayPal environment
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

// Create PayPal client instance
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client };