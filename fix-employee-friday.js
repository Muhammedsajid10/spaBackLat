// Update one employee to have 00:00-23:59 Friday schedule
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get the first employee
    const employee = await db.collection('employees').findOne({});
    const employeeId = employee._id;
    
    console.log('Updating employee:', employeeId);
    
    // Method 1: Update the base Friday schedule
    const result1 = await db.collection('employees').updateOne(
      { _id: employeeId },
      {
        $set: {
          'workSchedule.friday.startTime': '00:00',
          'workSchedule.friday.endTime': '23:59',
          'workSchedule.friday.shifts': '00:00 - 23:59'
        }
      }
    );
    
    console.log('Updated base Friday schedule:', result1.modifiedCount);
    
    // Method 2: Also create a date-specific override for today's Friday (2025-01-10)
    const result2 = await db.collection('employees').updateOne(
      { _id: employeeId },
      {
        $set: {
          'workSchedule.2025-01-10': {
            isWorking: true,
            startTime: '00:00',
            endTime: '23:59',
            shifts: '00:00 - 23:59',
            shiftsData: [{
              startTime: '00:00',
              endTime: '23:59'
            }],
            shiftCount: 1
          }
        }
      }
    );
    
    console.log('Created date-specific override:', result2.modifiedCount);
    
    // Verify the update
    const updated = await db.collection('employees').findOne({ _id: employeeId });
    console.log('\nUpdated Friday schedule:', JSON.stringify(updated.workSchedule.friday, null, 2));
    console.log('\nDate-specific schedule:', JSON.stringify(updated.workSchedule['2025-01-10'], null, 2));
    
    console.log(`\n✅ Employee ${employeeId} updated! Test this employee in the frontend.`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
