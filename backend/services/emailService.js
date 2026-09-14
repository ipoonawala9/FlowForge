const nodemailer = require("nodemailer");

// Single shared transporter — created once, reused everywhere.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email.
 * @param {object} opts
 * @param {string}   opts.to
 * @param {string}   opts.subject
 * @param {string}   opts.text       plain-text body
 * @param {string}  [opts.html]      optional HTML body
 * @param {string}  [opts.from]      defaults to "FlowForge <SMTP_USER>"
 */
async function sendMail({ to, subject, text, html, from }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      "SMTP_USER and SMTP_PASS are not set — check your .env file."
    );
  }

  const info = await transporter
    .sendMail({
      from: from || `"FlowForge" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    })
    .catch((err) => {
      if (err.code === "EAUTH") {
        throw new Error(
          "Gmail authentication failed. Use an App Password, not your regular password. " +
            "Generate one at: https://myaccount.google.com/apppasswords"
        );
      }
      throw err;
    });

  console.log(`[email] sent to ${to} — messageId: ${info.messageId}`);
  return { messageId: info.messageId };
}

/**
 * Send a welcome email to a newly registered user.
 * @param {{ name: string, email: string }} user
 */
async function sendWelcomeEmail({ name, email }) {
  const displayName = name || email.split("@")[0];

  const text = [
    `Hi ${displayName},`,
    "",
    "Welcome to FlowForge! 🎉",
    "",
    "Your account is ready. Here's what you can do right now:",
    "  • Create a workflow — connect a trigger to one or more actions",
    "  • Use the Webhook Trigger to fire a workflow from any external service",
    "  • Schedule workflows to run automatically on a cron schedule",
    "  • Chain actions with Condition and Delay nodes for complex automations",
    "",
    "If you ever need help, just reply to this email.",
    "",
    "— The FlowForge Team",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#13151f;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:560px;width:100%;">

        <!-- header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 10px;margin-right:12px;">
                  <span style="font-size:20px;">⚡</span>
                </td>
                <td style="padding-left:12px;">
                  <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">FlowForge</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- body -->
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
              Welcome, ${displayName}! 🎉
            </h1>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
              Your FlowForge account is ready. Start building your first automation in minutes.
            </p>

            <!-- feature list -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
              ${[
                ["🔗", "Webhook Trigger", "Fire workflows from any external service"],
                ["🕐", "Cron Scheduler", "Run workflows on a repeating schedule"],
                ["🔀", "Condition Nodes", "Branch your automation on any data field"],
                ["📧", "Email & WhatsApp", "Notify people the moment something happens"],
              ]
                .map(
                  ([icon, title, desc]) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="width:36px;font-size:18px;">${icon}</td>
                    <td>
                      <div style="color:#e2e8f0;font-size:14px;font-weight:600;">${title}</div>
                      <div style="color:#64748b;font-size:13px;margin-top:2px;">${desc}</div>
                    </td>
                  </tr></table>
                </td>
              </tr>`
                )
                .join("")}
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#4f46e5;border-radius:12px;">
                  <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard"
                     style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                    Open Dashboard →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;color:#334155;font-size:12px;">
              You're receiving this because you signed up for FlowForge. 
              Registered with: ${email}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail({ to: email, subject: "Welcome to FlowForge ⚡", text, html });
}

module.exports = { sendMail, sendWelcomeEmail };