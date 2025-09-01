// Debug the attendance state issue
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');

async function debugAttendanceState() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an employee user
    const employee = await User.findOne({ role: 'employee' });
    if (!employee) {
      console.log('❌ No employee found');
      return;
    }

    console.log(`🔍 Debugging attendance for: ${employee.email}`);

    // Check today's attendance records
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today\'s date:', today);

    const attendanceRecords = await Attendance.find({
      employee: { $exists: true },
      date: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('employee');

    console.log(`📊 Found ${attendanceRecords.length} attendance records for today:`);
    
    attendanceRecords.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log('  ID:', record._id);
      console.log('  Employee:', record.employee?.employeeId || 'No employee linked');
      console.log('  Date:', record.date);
      console.log('  CheckIn:', record.checkIn);
      console.log('  CheckOut:', record.checkOut);
      console.log('  CheckOut type:', typeof record.checkOut);
      console.log('  CheckOut is empty object:', record.checkOut && typeof record.checkOut === 'object' && Object.keys(record.checkOut).length === 0);
      console.log('  Is Late:', record.isLate);
      console.log('  Status:', record.status);
    });

    // Test the API response
    console.log('\n🔧 Testing API response...');
    
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
    if (!loginData.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginData.token;

    // Test attendance API
    const attendanceResponse = await fetch('http://localhost:3000/api/v1/employees/my-attendance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const attendanceData = await attendanceResponse.json();
    console.log('\n📡 API Response:');
    console.log('  Success:', attendanceData.success);
    console.log('  Total records:', attendanceData.data?.attendance?.length || 0);
    
    if (attendanceData.data?.attendance?.length > 0) {
      const todayRecord = attendanceData.data.attendance.find(att => 
        att.date && att.date.split('T')[0] === today
      );
      
      if (todayRecord) {
        console.log('\n📅 Today\'s record from API:');
        console.log('  Date:', todayRecord.date);
        console.log('  CheckIn:', todayRecord.checkIn);
        console.log('  CheckOut:', todayRecord.checkOut);
        console.log('  Should be checked in:', !!(todayRecord.checkIn && !todayRecord.checkOut));
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugAttendanceState();
