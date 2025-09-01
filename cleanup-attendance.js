// Clean up problematic attendance records
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');

async function cleanupAttendanceRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all attendance records with undefined or empty checkIn/checkOut
    const problematicRecords = await Attendance.find({
      $or: [
        { checkIn: { $exists: false } },
        { checkIn: null },
        { checkIn: undefined },
        { checkOut: {} }
      ]
    });

    console.log(`🔍 Found ${problematicRecords.length} problematic records`);

    if (problematicRecords.length > 0) {
      // Delete these records
      const result = await Attendance.deleteMany({
        _id: { $in: problematicRecords.map(r => r._id) }
      });

      console.log(`🧹 Deleted ${result.deletedCount} problematic attendance records`);
    }

    // Show remaining attendance records
    const remainingRecords = await Attendance.find({}).populate('employee');
    console.log(`\n📊 Remaining attendance records: ${remainingRecords.length}`);
    
    remainingRecords.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log('  Employee:', record.employee?.employeeId || 'No employee');
      console.log('  Date:', record.date);
      console.log('  CheckIn:', record.checkIn);
      console.log('  CheckOut:', record.checkOut);
    });

    console.log('\n✅ Cleanup completed!');
    console.log('🔧 The frontend should now work correctly for check-in/check-out');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupAttendanceRecords();
