require('dotenv').config();
const mongoose = require('mongoose');
// Make sure we have all models loaded
require('./models/User');
const Employee = require('./models/Employee');
const User = require('./models/User');

async function testDefaultScheduleMap() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // First create a user for the employee
    console.log('Creating a test user...');
    const user = new User({
      firstName: 'Map',
      lastName: 'Default Test',
      email: `map-default-${Date.now()}@test.com`,
      password: 'password123',
      phone: '+12345678901', // Using international format
      role: 'employee'
    });
    
    await user.save();
    console.log(`Created test user with ID: ${user._id}`);
    
    // Create an employee with minimal fields to test the default workSchedule
    console.log('Creating a minimal test employee to test defaults...');
    const employee = new Employee({
      user: user._id,
      employeeId: `EMP-MAP-${Date.now()}`,
      position: 'massage-therapist',
      department: 'spa-services',
      hireDate: new Date(),
      isActive: true
      // Note: intentionally NOT providing workSchedule to test default
    });
    
    await employee.save();
    console.log(`Created test employee with ID: ${employee._id}`);
    
    // Fetch the saved employee to check the workSchedule
    const savedEmployee = await Employee.findById(employee._id);
    
    console.log('\nVerifying workSchedule:');
    console.log(`- workSchedule exists: ${!!savedEmployee.workSchedule}`);
    console.log(`- workSchedule type: ${savedEmployee.workSchedule ? 
      (savedEmployee.workSchedule instanceof Map ? 'Map' : typeof savedEmployee.workSchedule) : 'undefined'}`);
    console.log(`- Number of days in schedule: ${savedEmployee.workSchedule ? 
      (savedEmployee.workSchedule instanceof Map ? savedEmployee.workSchedule.size : 
       (typeof savedEmployee.workSchedule === 'object' ? Object.keys(savedEmployee.workSchedule).length : 'N/A'))
      : 'N/A'}`);
    
    // Print out the schedule for each day
    if (savedEmployee.workSchedule) {
      console.log('\nSchedule details:');
      if (savedEmployee.workSchedule instanceof Map) {
        for (const [day, schedule] of savedEmployee.workSchedule.entries()) {
          console.log(`${day}: ${JSON.stringify(schedule)}`);
        }
      } else if (typeof savedEmployee.workSchedule === 'object') {
        for (const day in savedEmployee.workSchedule) {
          console.log(`${day}: ${JSON.stringify(savedEmployee.workSchedule[day])}`);
        }
      }
    }
    
    console.log('\nTEST RESULT:');
    if (savedEmployee.workSchedule && 
        (savedEmployee.workSchedule instanceof Map ? savedEmployee.workSchedule.size === 7 : 
         Object.keys(savedEmployee.workSchedule).length === 7)) {
      console.log('✅ PASS: Default workSchedule was applied successfully!');
    } else {
      console.log('❌ FAIL: Default workSchedule was not applied correctly.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDefaultScheduleMap();