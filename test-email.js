const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Testing SMTP Configuration...');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);
console.log('Pass:', process.env.SMTP_PASS ? 'Present' : 'Missing');
console.log('From:', process.env.EMAIL_FROM);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function testConnection() {
  try {
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection successful!');
    
    // Test sending a simple email
    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'test@example.com', // This will fail but shows if SMTP works
      subject: 'Test Email',
      text: 'This is a test email.'
    });
    
    console.log('Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
