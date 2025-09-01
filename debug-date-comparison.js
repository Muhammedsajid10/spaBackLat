// Debug the date comparison issue
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');

async function debugDateComparison() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an employee
    const user = await User.findOne({ role: 'employee' });
    const employee = await Employee.findOne({ user: user._id });

    console.log('👤 Employee:', employee.employeeId);

    // Show the backend date logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('📅 Backend "today" date:', today);

    // Find attendance using the same logic as backend
    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: today
    });

    console.log('\n🔍 Existing attendance query result:');
    console.log('  Found record:', !!existingAttendance);
    if (existingAttendance) {
      console.log('  Record ID:', existingAttendance._id);
      console.log('  Date:', existingAttendance.date);
      console.log('  CheckIn:', existingAttendance.checkIn);
      console.log('  CheckIn exists:', !!existingAttendance.checkIn);
      console.log('  CheckOut:', existingAttendance.checkOut);
    }

    // Show all attendance records
    const allRecords = await Attendance.find({ employee: employee._id });
    console.log(`\n📊 All attendance records for this employee: ${allRecords.length}`);
    allRecords.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log('  ID:', record._id);
      console.log('  Date:', record.date);
      console.log('  Date type:', typeof record.date);
      console.log('  CheckIn:', record.checkIn);
      console.log('  CheckOut:', record.checkOut);
      
      // Check date comparison
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      console.log('  Record date normalized:', recordDate);
      console.log('  Matches today:', recordDate.getTime() === today.getTime());
    });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugDateComparison();
