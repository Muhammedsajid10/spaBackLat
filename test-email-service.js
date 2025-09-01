const EmailService = require('./services/emailService');
require('dotenv').config();

async function testEmailService() {
  console.log('Testing Email Service...');
  
  try {
    const emailService = new EmailService();
    console.log('EmailService created successfully');
    
    // Create a mock booking object for testing
    const mockBooking = {
      bookingNumber: 'TEST-001',
      client: {
        firstName: 'Test',
        lastName: 'User',
        email: 'sajidalhijas@gmail.com' // Use your actual email for testing
      },
      services: [{
        service: { name: 'Test Service' },
        employee: { firstName: 'Test', lastName: 'Employee' },
        price: 100,
        duration: 60
      }],
      date: new Date().toDateString(),
      time: '10:00 AM',
      totalAmount: 100
    };
    
    const mockPayment = {
      amount: 100,
      paymentId: 'test_payment_123'
    };
    
    console.log('Sending test email...');
    const result = await emailService.sendBookingConfirmation(mockBooking, mockPayment);
    console.log('✅ Email sent successfully!', result);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmailService();
