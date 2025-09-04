// Update ALL employees to have 00:00-23:59 Friday schedule
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Update all employees' Friday schedule
    const result = await db.collection('employees').updateMany(
      {}, // All employees
      {
        $set: {
          'workSchedule.friday.startTime': '00:00',
          'workSchedule.friday.endTime': '23:59',
          'workSchedule.friday.shifts': '00:00 - 23:59'
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} employees' Friday schedules to 00:00-23:59`);
    
    // Verify a few updates
    const employees = await db.collection('employees').find({}).limit(3).toArray();
    console.log('\nVerification - First 3 employees Friday schedules:');
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. Employee ${emp._id}:`);
      console.log(`   Friday: ${emp.workSchedule.friday.startTime} - ${emp.workSchedule.friday.endTime}`);
    });
    
    console.log('\n🎉 All employees now have 24/7 Friday availability!');
    console.log('You can now test any employee in the frontend and see 00:00-23:59 time slots.');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
