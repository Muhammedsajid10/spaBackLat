// Test the check-in functionality with proper error handling
// Load environment variables first
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');

async function testCheckInFeedback() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an employee user
    const employee = await User.findOne({ role: 'employee' });
    if (!employee) {
      console.log('❌ No employee found');
      return;
    }

    console.log(`🧪 Testing check-in feedback for: ${employee.email}`);

    // Test 1: Login to get token
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: employee.email,
        password: 'Employee@123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // Test 2: Check current attendance status
    const attendanceResponse = await fetch('http://localhost:3000/api/v1/employees/my-attendance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const attendanceData = await attendanceResponse.json();
    console.log('📊 Current attendance status:', {
      success: attendanceData.success,
      totalRecords: attendanceData.data?.attendance?.length || 0
    });

    // Test 3: Perform check-in
    console.log('\n🔄 Performing check-in...');
    
    const checkinResponse = await fetch('http://localhost:3000/api/v1/employees/check-in', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const checkinResult = await checkinResponse.json();
    
    console.log('📍 Check-in Response:');
    console.log('  Status:', checkinResponse.status);
    console.log('  Success:', checkinResult.success);
    console.log('  Message:', checkinResult.message);
    
    if (checkinResult.success) {
      console.log('  ✅ Check-in time:', checkinResult.data?.checkInTime);
      console.log('\n🎉 Check-in functionality is working correctly!');
      console.log('🖥️  Frontend should now show:');
      console.log('     - Success message: "Successfully checked in!"');
      console.log('     - Button text: "Already Checked In" (disabled)');
      console.log('     - Check-out button: enabled');
      console.log('     - Status indicator: "Checked In" with green dot');
    } else {
      console.log('  ❌ Check-in failed:', checkinResult.message);
    }

    // Test 4: Try duplicate check-in (should fail gracefully)
    console.log('\n🔄 Testing duplicate check-in...');
    
    const duplicateResponse = await fetch('http://localhost:3000/api/v1/employees/check-in', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const duplicateResult = await duplicateResponse.json();
    console.log('📍 Duplicate Check-in Response:');
    console.log('  Status:', duplicateResponse.status);
    console.log('  Success:', duplicateResult.success);
    console.log('  Message:', duplicateResult.message);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testCheckInFeedback();
