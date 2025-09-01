const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// Load environment variables
require('dotenv').config();

console.log('📊 Environment check:');
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('- NODE_ENV:', process.env.NODE_ENV);

const connectDB = async () => {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateSchedulesTo24Hours = async () => {
  try {
    console.log('\n🔄 Starting schedule update to 24-hour defaults...');
    
    // Find all employees
    const employees = await Employee.find({});
    console.log(`📊 Found ${employees.length} employees to update`);

    if (employees.length === 0) {
      console.log('⚠️  No employees found in database');
      return;
    }

    let updatedCount = 0;

    for (const employee of employees) {
      console.log(`\n👤 Processing: ${employee.user?.firstName || 'Unknown'} ${employee.user?.lastName || ''}`);
      
      let hasChanges = false;
      const updates = {};

      // Handle legacy workSchedule (object format)
      if (employee.legacyWorkSchedule) {
        console.log('  📅 Found legacy schedule');
        const updatedLegacySchedule = { ...employee.legacyWorkSchedule };
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
          if (updatedLegacySchedule[day]) {
            if (updatedLegacySchedule[day].startTime === '09:00' || !updatedLegacySchedule[day].startTime) {
              console.log(`    ⏰ ${day}: ${updatedLegacySchedule[day].startTime} -> 00:00`);
              updatedLegacySchedule[day].startTime = '00:00';
              hasChanges = true;
            }
            if (updatedLegacySchedule[day].endTime === '17:00' || !updatedLegacySchedule[day].endTime) {
              console.log(`    ⏰ ${day}: ${updatedLegacySchedule[day].endTime} -> 23:59`);
              updatedLegacySchedule[day].endTime = '23:59';
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          updates.legacyWorkSchedule = updatedLegacySchedule;
        }
      }

      // Handle new workSchedule (Map format)
      if (employee.workSchedule && employee.workSchedule.size > 0) {
        console.log(`  🗓️  Found Map schedule with ${employee.workSchedule.size} entries`);
        const workScheduleObj = {};
        let scheduleChanged = false;

        for (const [date, schedule] of employee.workSchedule.entries()) {
          const updatedSchedule = { ...schedule };
          
          if (schedule.startTime === '09:00' || !schedule.startTime) {
            console.log(`    ⏰ ${date}: startTime ${schedule.startTime} -> 00:00`);
            updatedSchedule.startTime = '00:00';
            scheduleChanged = true;
          }
          if (schedule.endTime === '17:00' || !schedule.endTime) {
            console.log(`    ⏰ ${date}: endTime ${schedule.endTime} -> 23:59`);
            updatedSchedule.endTime = '23:59';
            scheduleChanged = true;
          }
          
          // Update shifts string if it contains old times
          if (schedule.shifts && schedule.shifts.includes('09:00 - 17:00')) {
            console.log(`    📝 ${date}: updating shifts string`);
            updatedSchedule.shifts = schedule.shifts.replace('09:00 - 17:00', '00:00 - 23:59');
            scheduleChanged = true;
          }

          workScheduleObj[date] = updatedSchedule;
        }

        if (scheduleChanged) {
          updates.workSchedule = new Map(Object.entries(workScheduleObj));
          hasChanges = true;
        }
      }

      // Apply updates if any changes were made
      if (hasChanges) {
        try {
          await Employee.findByIdAndUpdate(employee._id, updates);
          updatedCount++;
          console.log(`  ✅ Updated successfully`);
        } catch (updateError) {
          console.log(`  ❌ Failed to update: ${updateError.message}`);
        }
      } else {
        console.log(`  ⏭️  No changes needed`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} out of ${employees.length} employees`);
    console.log('✨ All schedules now default to 00:00 - 23:59 (24 hours)');
    
  } catch (error) {
    console.error('❌ Error updating schedules:', error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await updateSchedulesTo24Hours();
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    console.log('\n📝 Closing database connection...');
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
main();
