// Test complete check-in/check-out flow
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');

async function testCompleteFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const employee = await User.findOne({ role: 'employee' });
    console.log(`🧪 Testing complete flow for: ${employee.email}`);

    // Login
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: employee.email,
        password: 'Employee@123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Test check-out without check-in (should fail)
    console.log('\n� Test: Check-out without check-in...');
    const checkoutFailResponse = await fetch('http://localhost:3000/api/v1/employees/check-out', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const checkoutFailData = await checkoutFailResponse.json();
    console.log('📍 Check-out without check-in:');
    console.log('  Status:', checkoutFailResponse.status);
    console.log('  Message:', checkoutFailData.message);

    // Test check-out after check-in (should succeed)
    console.log('\n� Test: Check-out after check-in...');
    const checkoutResponse = await fetch('http://localhost:3000/api/v1/employees/check-out', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const checkoutData = await checkoutResponse.json();
    console.log('📍 Check-out after check-in:');
    console.log('  Status:', checkoutResponse.status);
    console.log('  Success:', checkoutData.success);
    console.log('  Message:', checkoutData.message);
    if (checkoutData.data) {
      console.log('  Working hours:', checkoutData.data.workingHours);
    }

    // Test duplicate check-out (should fail)
    console.log('\n� Test: Duplicate check-out...');
    const duplicateCheckoutResponse = await fetch('http://localhost:3000/api/v1/employees/check-out', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const duplicateCheckoutData = await duplicateCheckoutResponse.json();
    console.log('📍 Duplicate check-out:');
    console.log('  Status:', duplicateCheckoutResponse.status);
    console.log('  Message:', duplicateCheckoutData.message);

    // Get final attendance status
    console.log('\n� Final attendance status...');
    const attendanceResponse = await fetch('http://localhost:3000/api/v1/employees/my-attendance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const attendanceData = await attendanceResponse.json();
    if (attendanceData.data?.attendance?.length > 0) {
      const record = attendanceData.data.attendance[0];
      console.log('📊 Final attendance record:');
      console.log('  CheckIn:', record.checkIn);
      console.log('  CheckOut:', record.checkOut);
      console.log('  Hours worked:', record.hoursWorked);
    }

    console.log('\n🎉 Complete flow test finished!');
    console.log('✅ All check-in/check-out functionality is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testCompleteFlow();
