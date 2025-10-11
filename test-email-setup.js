const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables
require('dotenv').config();

console.log('🔧 Testing Gmail SMTP Configuration...\n');

// Check if all required environment variables are set
const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease update your .env file and try again.\n');
  process.exit(1);
}

console.log('✅ Environment variables loaded:');
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '***configured***' : 'NOT SET'}`);
console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM}\n`);

async function testEmailSetup() {
  try {
    console.log('📧 Creating email transporter...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('✅ Transporter created successfully\n');

    console.log('🔐 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Ask user if they want to send a test email
    console.log('📧 Testing email sending...');
    
    const testEmail = {
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // Send test email to yourself
      subject: '🎉 Allora Spa Email Test - Success!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">✅ Email Setup Successful!</h2>
          <p>Congratulations! Your Gmail SMTP configuration is working perfectly.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || '587'}</li>
              <li><strong>From Email:</strong> ${process.env.EMAIL_FROM}</li>
              <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <p>Your Allora Spa backend can now send emails for:</p>
          <ul>
            <li>✅ Employee welcome emails</li>
            <li>✅ Email verification</li>
            <li>✅ Password reset emails</li>
            <li>✅ Booking confirmations</li>
          </ul>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This test email was sent automatically by your Allora Spa backend system.
          </p>
        </div>
      `,
    };

    console.log(`📤 Sending test email to: ${testEmail.to}`);
    const result = await transporter.sendMail(testEmail);
    
    console.log('🎉 SUCCESS! Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(result)}\n`);
    
    console.log('🚀 Your email configuration is ready for production!');
    console.log('💡 Tips:');
    console.log('   - Check your inbox (and spam folder) for the test email');
    console.log('   - The employee creation process will now send welcome emails');
    console.log('   - Email verification will work for new user signups');
    console.log('   - All emails will come from:', process.env.EMAIL_FROM);

  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 Authentication failed. Please check:');
      console.error('   1. Your Gmail App Password is correct (16 characters)');
      console.error('   2. 2-Factor Authentication is enabled on your Google account');
      console.error('   3. You\'re using the App Password, not your regular Gmail password');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🔧 Connection failed. Please check:');
      console.error('   1. Your internet connection');
      console.error('   2. SMTP host and port settings');
      console.error('   3. Firewall settings');
    } else {
      console.error('\n🔧 Please check your .env configuration and try again.');
    }
    
    console.error('\n📖 See GMAIL_SETUP_GUIDE.md for detailed setup instructions.');
  }
}

// Run the test
testEmailSetup();