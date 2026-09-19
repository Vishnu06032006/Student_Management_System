const { getTransporter } = require('../config/mail');

async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@student-management.local',
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };
