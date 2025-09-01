// Test the improved check-in functionality
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');

async function testImprovedCheckIn() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an employee user
    const employee = await User.findOne({ role: 'employee' });
    console.log(`🧪 Testing improved check-in for: ${employee.email}`);

    // Login first
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

    // Test 1: First check-in (should succeed)
    console.log('\n🔄 Test 1: First check-in...');
    const checkin1Response = await fetch('http://localhost:3000/api/v1/employees/check-in', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const checkin1Data = await checkin1Response.json();
    console.log('📍 First Check-in:');
    console.log('  Status:', checkin1Response.status);
    console.log('  Success:', checkin1Data.success);
    console.log('  Message:', checkin1Data.message);

    // Test 2: Duplicate check-in (should fail gracefully)
    console.log('\n🔄 Test 2: Duplicate check-in...');
    const checkin2Response = await fetch('http://localhost:3000/api/v1/employees/check-in', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const checkin2Data = await checkin2Response.json();
    console.log('📍 Duplicate Check-in:');
    console.log('  Status:', checkin2Response.status);
    console.log('  Success:', checkin2Data.success);
    console.log('  Message:', checkin2Data.message);

    // Test 3: Get attendance data
    console.log('\n🔄 Test 3: Get attendance data...');
    const attendanceResponse = await fetch('http://localhost:3000/api/v1/employees/my-attendance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const attendanceData = await attendanceResponse.json();
    console.log('📊 Attendance Data:');
    console.log('  Status:', attendanceResponse.status);
    console.log('  Success:', attendanceData.success);
    console.log('  Records:', attendanceData.data?.attendance?.length || 0);
    
    if (attendanceData.data?.attendance?.length > 0) {
      const todayRecord = attendanceData.data.attendance[0];
      console.log('  Today\'s record:');
      console.log('    Date:', todayRecord.date);
      console.log('    CheckIn:', todayRecord.checkIn);
      console.log('    CheckOut:', todayRecord.checkOut);
    }

    console.log('\n🎉 Testing completed!');
    console.log('🖥️  Frontend should now:');
    console.log('   ✅ Show success message on first check-in');
    console.log('   ⚠️  Show "Already checked in today" error on duplicate');
    console.log('   🔄 Update button states correctly');
    console.log('   📊 Display current attendance status');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testImprovedCheckIn();
