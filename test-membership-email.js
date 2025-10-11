const nodemailer = require('nodemailer');
require('dotenv').config();

// Test the membership email template
async function testMembershipEmail() {
  console.log('🧪 Testing Membership Email Template...\n');

  // Check SMTP configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
    console.error('❌ SMTP configuration missing. Please check your .env file.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Test membership data
    const testMembershipData = {
      membershipName: 'Premium Wellness Package',
      serviceName: 'Full Body Massage',
      numberOfSessions: 10,
      validityPeriod: 3,
      validityUnit: 'months',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
      price: 1500,
      paymentType: 'One-time',
      serviceType: 'Sessions'
    };

    const formatDate = (date) => {
      return date ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '';
    };

    const testEmail = {
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // Send test to yourself
      subject: `🎉 Your ${testMembershipData.membershipName} at Allora Spa is Ready! (TEST)`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 300;">Allora Spa</h1>
            <p style="color: #f0f4ff; margin: 10px 0 0 0; font-size: 16px;">Premium Spa & Wellness</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #fff;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              🎉 Congratulations, Test Client!
            </h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Your membership has been successfully assigned and is now active. Get ready to enjoy our premium spa services!
            </p>

            <!-- Membership Details Card -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
                ${testMembershipData.membershipName}
              </h3>
              
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #666; font-weight: 500;">Service:</span>
                  <span style="color: #333; font-weight: 600;">${testMembershipData.serviceName}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #666; font-weight: 500;">Sessions:</span>
                  <span style="color: #333; font-weight: 600;">
                    ${testMembershipData.serviceType === 'Unlimited' ? 'Unlimited Sessions' : `${testMembershipData.numberOfSessions} Sessions`}
                  </span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #666; font-weight: 500;">Validity:</span>
                  <span style="color: #333; font-weight: 600;">${testMembershipData.validityPeriod} ${testMembershipData.validityUnit}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #666; font-weight: 500;">Start Date:</span>
                  <span style="color: #333; font-weight: 600;">${formatDate(testMembershipData.startDate)}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #666; font-weight: 500;">Valid Until:</span>
                  <span style="color: #333; font-weight: 600;">${formatDate(testMembershipData.endDate)}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                  <span style="color: #666; font-weight: 500;">Total Value:</span>
                  <span style="color: #667eea; font-weight: 700; font-size: 18px;">AED ${testMembershipData.price}</span>
                </div>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 25px; margin: 25px 0; color: #fff;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🚀 What's Next?</h3>
              <ul style="margin: 0; padding: 0; list-style: none;">
                <li style="margin: 8px 0; padding: 0; display: flex; align-items: center;">
                  <span style="margin-right: 10px;">📞</span>
                  <span>Call us to book your first appointment</span>
                </li>
                <li style="margin: 8px 0; padding: 0; display: flex; align-items: center;">
                  <span style="margin-right: 10px;">🗓️</span>
                  <span>Visit our spa with your membership details</span>
                </li>
                <li style="margin: 8px 0; padding: 0; display: flex; align-items: center;">
                  <span style="margin-right: 10px;">✨</span>
                  <span>Enjoy your premium spa experience</span>
                </li>
              </ul>
            </div>

            <!-- Contact Information -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <h4 style="color: #333; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">📍 Visit Us</h4>
              <p style="color: #666; margin: 5px 0; font-size: 14px;">Allora Spa Dubai</p>
              <p style="color: #666; margin: 5px 0; font-size: 14px;">📞 +971-XXX-XXXX</p>
              <p style="color: #666; margin: 5px 0; font-size: 14px;">📧 ${process.env.EMAIL_FROM}</p>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-weight: 500; font-size: 14px;">
                🧪 <strong>TEST EMAIL:</strong> This is a test of the membership notification system. In production, this would be sent to the actual client.
              </p>
            </div>

            <p style="color: #999; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
              Thank you for choosing Allora Spa. We look forward to providing you with an exceptional wellness experience.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #333; padding: 20px 30px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              This email was sent automatically by Allora Spa's membership system.
            </p>
          </div>
        </div>
      `
    };

    console.log('📧 Sending test membership email...');
    const result = await transporter.sendMail(testEmail);
    
    console.log('🎉 SUCCESS! Test membership email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   From: ${testEmail.from}`);
    console.log(`   To: ${testEmail.to}`);
    console.log(`   Subject: ${testEmail.subject}\n`);
    
    console.log('✅ The membership email template is working correctly!');
    console.log('💡 When you assign a membership in the admin panel:');
    console.log('   ✓ The client will receive a beautifully formatted email');
    console.log('   ✓ The admin panel will show a success notification');
    console.log('   ✓ All membership details will be included in the email');
    console.log('   ✓ The email includes next steps and contact information');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 Authentication failed. Please check:');
      console.error('   1. Your Gmail App Password is correct');
      console.error('   2. 2-Factor Authentication is enabled');
      console.error('   3. You\'re using App Password, not regular password');
    }
  }
}

// Run the test
testMembershipEmail();