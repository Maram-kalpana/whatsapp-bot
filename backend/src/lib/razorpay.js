const Razorpay = require("razorpay");
const crypto = require("crypto");
const { decrypt } = require("./crypto");

function clientFromConfig(config) {
  const keySecret = decrypt(config.key_secret_enc);
  if (!config.key_id || !keySecret) {
    throw new Error("Razorpay keys are not configured");
  }
  return new Razorpay({ key_id: config.key_id, key_secret: keySecret });
}

function verifyWebhookSignature(body, signature, secret) {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

module.exports = { clientFromConfig, verifyWebhookSignature };
