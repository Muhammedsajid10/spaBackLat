const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

async function updateEmployeeSchedule() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');

    // Find the employee named "test5"
    const employee = await Employee.findOne().populate({
      path: 'user',
      match: { firstName: 'test5' }
    });

    if (!employee || !employee.user) {
      console.log('Employee "test5" not found');
      process.exit(1);
    }

    console.log(`Found employee: ${employee.user.firstName} ${employee.user.lastName} (${employee._id})`);
    console.log('Current workSchedule:', 
      employee.workSchedule instanceof Map 
        ? `Map with ${employee.workSchedule.size} entries` 
        : typeof employee.workSchedule === 'object' 
          ? `Object with ${Object.keys(employee.workSchedule).length} keys` 
          : employee.workSchedule);

    // Create default schedule
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

    // Update the employee's workSchedule
    employee.workSchedule = defaultWorkSchedule;
    
    // Save the employee
    await employee.save();
    console.log('Employee schedule updated successfully');

    // Verify the update
    const updatedEmployee = await Employee.findById(employee._id);
    console.log('Updated workSchedule:', 
      updatedEmployee.workSchedule instanceof Map 
        ? `Map with ${updatedEmployee.workSchedule.size} entries` 
        : typeof updatedEmployee.workSchedule === 'object' 
          ? `Object with ${Object.keys(updatedEmployee.workSchedule).length} keys` 
          : updatedEmployee.workSchedule);

    // Show day entries if it's a Map
    if (updatedEmployee.workSchedule instanceof Map) {
      console.log('\nWork schedule entries:');
      for (const [day, schedule] of updatedEmployee.workSchedule.entries()) {
        console.log(`- ${day}: isWorking=${schedule.isWorking}, hours=${schedule.startTime}-${schedule.endTime}`);
      }
    }

    console.log('\nEmployee schedule update complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating employee schedule:', error);
    process.exit(1);
  }
}

updateEmployeeSchedule();