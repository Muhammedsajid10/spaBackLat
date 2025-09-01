const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Employee = require('./models/Employee');  
const Attendance = require('./models/Attendance');

const checkAttendanceRecord = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📱 Connected to MongoDB');

    // Find Sarah Johnson's user
    const user = await User.findOne({ email: 'sarah.johnson@spa.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Find employee record
    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      console.log('❌ Employee record not found');
      return;
    }

    console.log(`👤 Found employee: ${user.firstName} ${user.lastName}`);

    // Get today's date in UTC
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: today
    });

    if (attendance) {
      console.log('📊 Today\'s attendance record in database:');
      console.log('- ID:', attendance._id);
      console.log('- Date:', attendance.date);
      console.log('- Status:', attendance.status);
      console.log('- Leave Reason:', attendance.leaveReason);
      console.log('- Leave Type:', attendance.leaveType);
      console.log('- Clock In:', attendance.clockIn);
      console.log('- Clock Out:', attendance.clockOut);
      console.log('\n📄 Full record:', JSON.stringify(attendance, null, 2));
    } else {
      console.log('❌ No attendance record found for today');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    await mongoose.disconnect();
  }
};

checkAttendanceRecord();
