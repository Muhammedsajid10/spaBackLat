require('dotenv').config();
const mongoose = require('mongoose');
// Make sure we have all models loaded
require('./models/User');
const Employee = require('./models/Employee');

async function fixEmptySchedules() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all employees with empty workSchedules
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} total employees in the database.`);
    
    let fixCount = 0;
    
    for (const employee of employees) {
      // Check if workSchedule is empty (either undefined, null, empty Map, or empty object)
      const isEmpty = 
        !employee.workSchedule || 
        (employee.workSchedule instanceof Map && employee.workSchedule.size === 0) ||
        (employee.workSchedule && typeof employee.workSchedule === 'object' && 
         !Array.isArray(employee.workSchedule) && 
         Object.keys(employee.workSchedule).length === 0);

      if (isEmpty) {
        console.log(`Found employee with ID: ${employee._id} with empty workSchedule`);
        
        // Create default 24-hour schedule for all days
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const workSchedule = new Map();
        
        daysOfWeek.forEach(day => {
          workSchedule.set(day, {
            isWorking: true,
            startTime: '00:00',
            endTime: '24:00',
            shifts: null,
            shiftCount: 0,
            shiftsData: []
          });
        });
        
        // Update the employee's workSchedule
        employee.workSchedule = workSchedule;
        await employee.save();
        
        console.log(`✅ Fixed workSchedule for employee with ID: ${employee._id}`);
        fixCount++;
      }
    }

    if (fixCount > 0) {
      console.log(`\n✅ Successfully fixed workSchedules for ${fixCount} employees.`);
    } else {
      console.log('\nNo employees with empty workSchedules were found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixEmptySchedules();