// Test check-in with detailed debugging
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');

async function debugCheckInDetailed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all attendance records first
    await Attendance.deleteMany({});
    console.log('🧹 Cleared all attendance records');

    // Find employee
    const user = await User.findOne({ role: 'employee' });
    const employee = await Employee.findOne({ user: user._id });
    console.log('👤 Employee:', employee.employeeId);

    // Simulate the backend check-in logic exactly
    console.log('\n🔄 Simulating backend check-in logic...');
    
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    console.log('📅 Today (UTC):', today);

    // Check for existing attendance
    let existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: today
    });
    console.log('🔍 Existing attendance before check-in:', existingAttendance);

    if (existingAttendance && existingAttendance.checkIn) {
      console.log('❌ Should return "Already checked in today"');
    } else {
      console.log('✅ Proceeding with check-in...');
      
      if (existingAttendance) {
        console.log('📝 Updating existing record...');
        existingAttendance.checkIn = new Date();
        await existingAttendance.save();
        console.log('💾 Updated record:', existingAttendance);
      } else {
        console.log('📝 Creating new record...');
        const newRecord = await Attendance.create({
          employee: employee._id,
          date: today,
          checkIn: new Date()
        });
        console.log('💾 Created record:', newRecord);
      }
    }

    // Check the record after operation
    const recordAfter = await Attendance.findOne({
      employee: employee._id,
      date: today
    });
    console.log('\n📊 Record after check-in operation:');
    console.log('  ID:', recordAfter?._id);
    console.log('  Date:', recordAfter?.date);
    console.log('  CheckIn:', recordAfter?.checkIn);
    console.log('  CheckIn exists:', !!recordAfter?.checkIn);

    // Now test duplicate check-in
    console.log('\n🔄 Testing duplicate check-in...');
    
    const existingAttendance2 = await Attendance.findOne({
      employee: employee._id,
      date: today
    });
    
    console.log('🔍 Existing attendance for duplicate check:', existingAttendance2);
    console.log('  CheckIn value:', existingAttendance2?.checkIn);
    console.log('  CheckIn truthy:', !!existingAttendance2?.checkIn);
    
    if (existingAttendance2 && existingAttendance2.checkIn) {
      console.log('✅ Should return "Already checked in today"');
    } else {
      console.log('❌ Logic flaw: Should have detected existing check-in');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugCheckInDetailed();
