const { sendMail } = require("../services/emailService");

/**
 * Send Email action.
 *
 * Config shape ({{variable}} tokens are resolved before this runs):
 * {
 *   to:      "user@example.com",   // supports {{body.email}}, {{email}}, etc.
 *   subject: "Your order {{body.order_id}} is confirmed",
 *   body:    "Hi {{name}}, thanks for your order!"
 * }
 */
async function execute(config) {
  const { to, subject, body = "" } = config;

  if (!to || !subject) {
    throw new Error("sendEmail requires 'to' and 'subject' fields");
  }

  const { messageId } = await sendMail({ to, subject, text: body });
  return { status: "email_sent", messageId };
}

module.exports = { execute };