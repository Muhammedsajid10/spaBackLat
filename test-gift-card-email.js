const { sendGiftCardNotificationEmail } = require('./controllers/authController');

async function testGiftCardEmail() {
  console.log('🧪 Testing gift card email functionality...');
  
  const testRecipientEmail = 'test@example.com';
  const testRecipientName = 'John Doe';
  const testGiftCardDetails = {
    name: 'Relaxation Package',
    code: 'GC12345678',
    value: 250,
    currency: 'AED',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    purchaserName: 'Jane Smith',
    description: 'Perfect for a full spa day experience'
  };
  const testPersonalMessage = 'Happy Birthday! Enjoy this special treat at our spa.';

  try {
    await sendGiftCardNotificationEmail(
      testRecipientEmail,
      testRecipientName,
      testGiftCardDetails,
      testPersonalMessage
    );
    console.log('✅ Gift card email test completed successfully!');
  } catch (error) {
    console.error('❌ Gift card email test failed:', error.message);
  }
}

testGiftCardEmail();