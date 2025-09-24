const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

async function fixEmployeeSchedules() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');
    
    // Find all employees
    const employees = await Employee.find().populate('user');
    console.log(`Found ${employees.length} employees`);
    
    let updatedCount = 0;
    
    // Loop through each employee and check their workSchedule
    for (const employee of employees) {
      console.log(`Checking employee: ${employee.user?.firstName} ${employee.user?.lastName} (ID: ${employee._id})`);
      
      const hasWorkSchedule = employee.workSchedule && 
                            ((employee.workSchedule instanceof Map && employee.workSchedule.size > 0) ||
                             (typeof employee.workSchedule === 'object' && Object.keys(employee.workSchedule).length > 0));
      
      console.log(`  Has work schedule: ${hasWorkSchedule ? 'Yes' : 'No'}`);
      
      if (!hasWorkSchedule) {
        console.log(`  Setting default 24-hour schedule for employee: ${employee.user?.firstName} ${employee.user?.lastName}`);
        
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
        
        // Update the employee
        employee.workSchedule = defaultWorkSchedule;
        await employee.save();
        updatedCount++;
        
        console.log(`  Successfully updated employee schedule`);
      }
    }
    
    console.log(`\nUpdate complete! Fixed ${updatedCount} employees with missing schedules.`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing employee schedules:', error);
    process.exit(1);
  }
}

fixEmployeeSchedules();