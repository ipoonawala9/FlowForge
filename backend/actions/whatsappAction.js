/**
 * WhatsApp Action (Twilio)
 *
 * config shape:
 * {
 *   to: "+919876543210",   // recipient phone with country code
 *   message: "Hello!"     // message body
 * }
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_FROM   // e.g. whatsapp:+14155238886 (Twilio sandbox number)
 */

const twilio = require("twilio");

async function execute(config) {
  const { to, message } = config;

  if (!to || !message) {
    throw new Error("whatsapp action requires 'to' and 'message'");
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    throw new Error(
      "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in .env"
    );
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  // normalize: ensure number has whatsapp: prefix
  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const msg = await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: toFormatted,
    body: message
  });

  console.log(`[whatsapp] sent to ${to}, SID: ${msg.sid}`);

  return { status: "whatsapp_sent", sid: msg.sid };
}

module.exports = { execute };
