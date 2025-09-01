const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// Load environment variables
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateSchedulesTo24Hours = async () => {
  try {
    console.log('🔄 Starting schedule update to 24-hour defaults...');
    
    // Find all employees
    const employees = await Employee.find({});
    console.log(`📊 Found ${employees.length} employees to update`);

    let updatedCount = 0;

    for (const employee of employees) {
      let hasChanges = false;
      const updates = {};

      // Handle legacy workSchedule (object format)
      if (employee.legacyWorkSchedule) {
        const updatedLegacySchedule = { ...employee.legacyWorkSchedule };
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
          if (updatedLegacySchedule[day]) {
            if (updatedLegacySchedule[day].startTime === '09:00' || !updatedLegacySchedule[day].startTime) {
              updatedLegacySchedule[day].startTime = '00:00';
              hasChanges = true;
            }
            if (updatedLegacySchedule[day].endTime === '17:00' || !updatedLegacySchedule[day].endTime) {
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
        const workScheduleObj = {};
        let scheduleChanged = false;

        for (const [date, schedule] of employee.workSchedule.entries()) {
          const updatedSchedule = { ...schedule };
          
          if (schedule.startTime === '09:00' || !schedule.startTime) {
            updatedSchedule.startTime = '00:00';
            scheduleChanged = true;
          }
          if (schedule.endTime === '17:00' || !schedule.endTime) {
            updatedSchedule.endTime = '23:59';
            scheduleChanged = true;
          }
          
          // Update shifts string if it contains old times
          if (schedule.shifts && schedule.shifts.includes('09:00 - 17:00')) {
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
        await Employee.findByIdAndUpdate(employee._id, updates);
        updatedCount++;
        console.log(`✅ Updated ${employee.user?.firstName || employee._id} - ${employee.user?.lastName || ''}`);
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} employees to 24-hour schedule defaults`);
    console.log('✨ All schedules now default to 00:00 - 23:59 (24 hours)');
    
  } catch (error) {
    console.error('❌ Error updating schedules:', error);
  }
};

const main = async () => {
  await connectDB();
  await updateSchedulesTo24Hours();
  mongoose.connection.close();
  console.log('📝 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
