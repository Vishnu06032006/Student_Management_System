const nodemailer = require('nodemailer');

let transporter = null;

// Falls back to logging the email to the server console when SMTP isn't
// configured, so the OTP flow is fully testable in local dev without real
// credentials. Set SMTP_HOST/PORT/USER/PASS in .env for real delivery.
function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  } else {
    transporter = {
      sendMail: async (options) => {
        console.log('\n=== DEV EMAIL (no SMTP_HOST configured - not actually sent) ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log(options.text || options.html);
        console.log('================================================================\n');
        return { messageId: 'dev-fallback' };
      },
    };
  }

  return transporter;
}

module.exports = { getTransporter };
