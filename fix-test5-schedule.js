const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

async function fixTest5Schedule() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');
    
    // Find the test5 employee
    console.log('\nLooking for employee "test5"...');
    const test5 = await Employee.findOne({ 'user.firstName': 'test5' }).populate('user');
    
    if (!test5) {
      console.log('Employee "test5" not found in the database!');
      
      // Check if it exists by ID
      console.log('Trying to find employee by ID...');
      const employeeById = await Employee.findById('68d2a300f71af4943d758b34').populate('user');
      
      if (employeeById) {
        console.log(`Found employee by ID: ${employeeById.user?.firstName} ${employeeById.user?.lastName}`);
        updateEmployeeSchedule(employeeById);
      } else {
        console.log('Employee with ID 68d2a300f71af4943d758b34 not found either.');
        
        // List all employees to help identify the right one
        console.log('\nListing all employees:');
        const allEmployees = await Employee.find().populate('user');
        
        allEmployees.forEach((emp, idx) => {
          console.log(`[${idx + 1}] ${emp.user?.firstName || 'Unknown'} ${emp.user?.lastName || 'User'} (ID: ${emp._id})`);
          console.log(`  - Has workSchedule: ${emp.workSchedule ? (emp.workSchedule instanceof Map ? 'Map' : typeof emp.workSchedule) : 'None'}`);
          
          if (emp.workSchedule && typeof emp.workSchedule === 'object' && !Array.isArray(emp.workSchedule) && Object.keys(emp.workSchedule).length === 0) {
            console.log('  - This employee has an empty object as workSchedule and should be fixed!');
            updateEmployeeSchedule(emp);
          }
        });
      }
    } else {
      console.log(`Found employee: ${test5.user?.firstName} ${test5.user?.lastName}`);
      updateEmployeeSchedule(test5);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing test5 schedule:', error);
    process.exit(1);
  }
}

async function updateEmployeeSchedule(employee) {
  try {
    console.log(`Updating schedule for employee: ${employee.user?.firstName} ${employee.user?.lastName}`);
    
    // Check if workSchedule is empty or wrong format
    const isEmpty = 
      !employee.workSchedule || 
      (employee.workSchedule instanceof Map && employee.workSchedule.size === 0) ||
      (employee.workSchedule && typeof employee.workSchedule === 'object' && 
       !Array.isArray(employee.workSchedule) && 
       Object.keys(employee.workSchedule).length === 0);
    
    console.log(`  Is schedule empty? ${isEmpty ? 'Yes' : 'No'}`);
    
    if (isEmpty) {
      // Create default 24-hour schedule
      console.log('  Setting default 24-hour schedule');
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
      
      console.log('  Schedule updated successfully!');
    } else {
      console.log('  Employee already has a schedule. No update needed.');
    }
  } catch (error) {
    console.error('  Error updating employee schedule:', error);
  }
}

fixTest5Schedule();