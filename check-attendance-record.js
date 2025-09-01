// Check the exact attendance record structure
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');

async function checkAttendanceRecord() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an employee user
    const user = await User.findOne({ role: 'employee' });
    const employee = await Employee.findOne({ user: user._id });
    
    console.log('👤 User:', user.email);
    console.log('👔 Employee ID:', employee.employeeId);

    // Check all attendance records for this employee
    const allAttendance = await Attendance.find({ employee: employee._id }).sort({ date: -1 });
    
    console.log(`\n📊 Found ${allAttendance.length} total attendance records:`);
    allAttendance.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log('  Date:', record.date);
      console.log('  CheckIn:', record.checkIn);
      console.log('  CheckOut:', record.checkOut);
      console.log('  CheckOut type:', typeof record.checkOut);
      console.log('  CheckOut value:', JSON.stringify(record.checkOut));
    });

    // Test check-in API directly
    console.log('\n🔄 Testing check-in API...');
    
    // Login first
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: 'Employee@123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Try check-in
    const checkinResponse = await fetch('http://localhost:3000/api/v1/employees/check-in', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const checkinResult = await checkinResponse.json();
    
    console.log('\n📍 Check-in API Response:');
    console.log('  Status Code:', checkinResponse.status);
    console.log('  Response:', JSON.stringify(checkinResult, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAttendanceRecord();
