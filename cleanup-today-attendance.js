const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Employee = require('./models/Employee');  
const Attendance = require('./models/Attendance');

const cleanupTodayAttendance = async () => {
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

    // Delete today's attendance record
    const result = await Attendance.deleteOne({
      employee: employee._id,
      date: today
    });

    console.log(`🗑️ Deleted ${result.deletedCount} attendance record(s) for today`);
    console.log('✅ Cleanup complete - ready to test mark absent');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    await mongoose.disconnect();
  }
};

cleanupTodayAttendance();
