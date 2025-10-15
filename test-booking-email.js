const axios = require('axios');

require('dotenv').config();

const API_BASE = 'http://localhost:5000/api/v1';

async function testBookingEmail() {
  try {
    console.log('🎯 Testing booking creation and email sending...\n');

    // Step 1: Get available services
    console.log('📋 Step 1: Getting available services...');
    const servicesResponse = await axios.get(`${API_BASE}/bookings/services`);
    const services = servicesResponse.data.data.services;
    
    if (!services || services.length === 0) {
      console.log('❌ No services found. Creating a test service...');
      // You might need to create a test service here
      return;
    }

    const testService = services[0];
    console.log(`✅ Found service: ${testService.name} (${testService.duration} min, AED ${testService.price})`);

    // Step 2: Get available professionals for today
    const today = new Date().toISOString().split('T')[0];
    console.log(`📋 Step 2: Getting available professionals for ${today}...`);
    
    const professionalsResponse = await axios.get(`${API_BASE}/bookings/professionals`, {
      params: {
        service: testService._id,
        date: today
      }
    });
    
    const professionals = professionalsResponse.data.data.professionals;
    
    if (!professionals || professionals.length === 0) {
      console.log('❌ No professionals available for today. Please check employee schedules.');
      return;
    }

    const testProfessional = professionals[0];
    console.log(`✅ Found professional: ${testProfessional.user.firstName} ${testProfessional.user.lastName}`);

    // Step 3: Get available time slots
    console.log('📋 Step 3: Getting available time slots...');
    
    const timeSlotsResponse = await axios.get(`${API_BASE}/bookings/timeslots`, {
      params: {
        employeeId: testProfessional._id,
        serviceId: testService._id,
        date: today
      }
    });
    
    const timeSlots = timeSlotsResponse.data.data.timeSlots;
    const availableSlots = timeSlots.filter(slot => slot.available);
    
    if (!availableSlots || availableSlots.length === 0) {
      console.log('❌ No available time slots for today.');
      return;
    }

    const testTimeSlot = availableSlots[0];
    console.log(`✅ Found available time slot: ${testTimeSlot.time}`);

    // Step 4: Login or create a test user to make the booking
    console.log('📋 Step 4: Authenticating test user...');
    
    const testUser = {
      email: 'test.booking@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+971501234567'
    };

    let authToken;
    
    try {
      // Try to login first
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      authToken = loginResponse.data.token;
      console.log('✅ Logged in as existing test user');
    } catch (loginError) {
      if (loginError.response && loginError.response.status === 401) {
        // User doesn't exist, create new user
        console.log('📝 Creating new test user...');
        const signupResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
        authToken = signupResponse.data.token;
        console.log('✅ Created new test user and logged in');
      } else {
        throw loginError;
      }
    }

    // Step 5: Create the booking
    console.log('📋 Step 5: Creating booking...');
    
    const bookingData = {
      services: [{
        service: testService._id,
        employee: testProfessional._id,
        startTime: testTimeSlot.startTime,
        endTime: testTimeSlot.endTime
      }],
      appointmentDate: today,
      paymentMethod: 'cash',
      client: {
        name: `${testUser.firstName} ${testUser.lastName}`,
        email: testUser.email,
        phone: testUser.phone
      },
      notes: 'Test booking for email verification'
    };

    console.log('📤 Sending booking request...');
    console.log('   Service:', testService.name);
    console.log('   Professional:', `${testProfessional.user.firstName} ${testProfessional.user.lastName}`);
    console.log('   Date:', today);
    console.log('   Time:', testTimeSlot.time);
    console.log('   Client:', testUser.email);

    const bookingResponse = await axios.post(`${API_BASE}/bookings`, bookingData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const booking = bookingResponse.data.data.booking;
    console.log('\n🎉 SUCCESS! Booking created successfully!');
    console.log(`   Booking Number: ${booking.bookingNumber}`);
    console.log(`   Total Amount: AED ${booking.totalAmount}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Client Email: ${booking.client.email}`);

    console.log('\n📧 Email Status:');
    console.log('   ✅ Booking confirmation email should have been sent');
    console.log(`   📮 Check inbox: ${testUser.email}`);
    console.log('   📁 Also check spam/junk folder');
    console.log(`   📧 Email sent from: ${process.env.EMAIL_FROM}`);

    console.log('\n🔍 Next Steps:');
    console.log('   1. Check the terminal where your backend is running for email logs');
    console.log('   2. Check the email inbox for the booking confirmation');
    console.log('   3. If email not received, check SMTP configuration');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || 'Unknown error');
      console.error('   Details:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Run the test
testBookingEmail();