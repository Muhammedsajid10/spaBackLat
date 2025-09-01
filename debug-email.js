require('dotenv').config();

console.log('Environment Variables Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not Set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// Test if nodemailer is available
try {
  const nodemailer = require('nodemailer');
  console.log('✅ Nodemailer loaded successfully');
  
  // Test transporter creation
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  console.log('✅ Transporter created successfully');
  
  // Test connection
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ SMTP Connection Error:', error.message);
    } else {
      console.log('✅ SMTP Connection successful!');
    }
  });
  
} catch (error) {
  console.error('❌ Error loading nodemailer:', error.message);
}
