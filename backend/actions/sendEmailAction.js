const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function execute(config) {
  const { to, subject, body = "" } = config;

  if (!to || !subject) {
    throw new Error("sendEmail requires 'to' and 'subject' fields");
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS environment variables are not set");
  }

  const info = await transporter.sendMail({
    from: `"FlowForge" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text: body
  }).catch((err) => {
    if (err.code === "EAUTH") {
      throw new Error(
        "Gmail authentication failed. You must use an App Password, not your regular Gmail password. " +
        "Generate one at: https://myaccount.google.com/apppasswords"
      );
    }
    throw err;
  });

  console.log("Email sent:", info.messageId);

  return { status: "email_sent", messageId: info.messageId };
}

module.exports = { execute };
