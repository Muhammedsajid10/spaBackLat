// test-email-send.js
// Standalone script to test SMTP config and email sending
require('dotenv').config();
const EmailService = require('./services/emailService');

async function main() {
  const emailService = new EmailService();
  const testEmail = process.env.TEST_EMAIL_TO || process.env.EMAIL_FROM;
  try {
    const result = await emailService.sendEmail(
      testEmail,
      'Test Email from Allora Spa Backend',
      '<h2>This is a test email from your backend SMTP configuration.</h2><p>If you received this, your SMTP is working!</p>'
    );
    console.log('✅ Test email sent successfully:', result);
  } catch (err) {
    console.error('❌ Failed to send test email:', err);
  }
}

main();
