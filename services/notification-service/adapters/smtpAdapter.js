// services/notification-service/adapters/smtpAdapter.js
// SMTP Email Integration Adapter
// ----------------------------------------------------------
// Supports real SMTP via nodemailer or falls back to a clean Mock mode
// when external SMTP credentials are not configured.
// ----------------------------------------------------------
const nodemailer = require('nodemailer');

const isRealConfig = process.env.SMTP_HOST && 
  process.env.SMTP_HOST !== 'smtp.example.com' && 
  process.env.SMTP_USER !== 'noreply@example.com' &&
  process.env.SMTP_PASS !== 'your_smtp_password';

const PROVIDER = isRealConfig ? 'smtp' : 'mock';

let transporter = null;
if (PROVIDER === 'smtp') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Send email notification
 * @param {object} options - { to, subject, text, html }
 * @returns {Promise<{ sent: boolean, provider: string, messageId?: string }>}
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (PROVIDER === 'mock') {
    console.log(`[SMTP Adapter] MOCK MODE - Email notification (mock dispatch):`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text || html?.replace(/<[^>]*>?/gm, '')}`);
    return {
      sent: true,
      provider: 'mock',
      note: 'Mock adapter: email logged locally; configure real SMTP in .env for production delivery'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Smart Workload System <noreply@example.com>',
      to,
      subject,
      text,
      html
    });
    console.log(`[SMTP Adapter] Email delivered: ${info.messageId}`);
    return { sent: true, provider: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error(`[SMTP Adapter] Failed to deliver email to ${to}:`, error.message);
    return { sent: false, provider: 'smtp', error: error.message };
  }
};

module.exports = { sendEmail, PROVIDER };
