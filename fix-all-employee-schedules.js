require('dotenv').config();
const mongoose = require('mongoose');
// Make sure we have all models loaded
require('./models/User');
const Employee = require('./models/Employee');

async function fixAllEmployeeSchedules() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all employees
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees in the database`);
    
    let updated = 0;
    let alreadyHadSchedule = 0;
    
    for (const employee of employees) {
      // Check if the employee has an empty or missing workSchedule
      const hasValidSchedule = employee.workSchedule && 
                              (employee.workSchedule instanceof Map ? 
                                employee.workSchedule.size > 0 : 
                                Object.keys(employee.workSchedule).length > 0);
      
      if (!hasValidSchedule) {
        console.log(`Updating employee ${employee._id} - empty workSchedule found`);
        
        // Create default 24-hour schedule
        const defaultWorkSchedule = new Map();
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        daysOfWeek.forEach(day => {
          defaultWorkSchedule.set(day, {
            isWorking: true,
            startTime: '00:00',
            endTime: '23:59',
            shifts: null,
            shiftsData: [],
            shiftCount: 0
          });
        });
        
        // Direct database update to ensure we bypass any schema validation issues
        await Employee.updateOne(
          { _id: employee._id },
          { $set: { workSchedule: defaultWorkSchedule } }
        );
        
        updated++;
        console.log(`✅ Schedule updated for employee ${employee._id}`);
      } else {
        alreadyHadSchedule++;
      }
    }
    
    console.log('\n===== SUMMARY =====');
    console.log(`Total employees: ${employees.length}`);
    console.log(`Employees with valid schedules: ${alreadyHadSchedule}`);
    console.log(`Employees updated: ${updated}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix function
fixAllEmployeeSchedules();