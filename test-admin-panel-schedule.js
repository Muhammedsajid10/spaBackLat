require('dotenv').config();
const mongoose = require('mongoose');
// Make sure we have all models loaded
require('./models/User');
const Employee = require('./models/Employee');
const User = require('./models/User');

async function testCreateEmployeeWithEmptyObject() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // First create a user for the employee
    console.log('Creating a test user...');
    const user = new User({
      firstName: 'Test',
      lastName: 'Admin Panel',
      email: `test-admin-panel-${Date.now()}@test.com`,
      password: 'password123',
      phone: '+12345678901', // Using international format
      role: 'employee'
    });
    
    await user.save();
    console.log(`Created test user with ID: ${user._id}`);
    
    // This simulates what happens when the admin panel creates an employee
    // by explicitly passing an empty object for workSchedule
    console.log('Creating a test employee with EMPTY OBJECT for workSchedule...');
    const employee = new Employee({
      user: user._id,
      employeeId: `EMP-${Date.now()}`,
      position: 'massage-therapist',
      department: 'spa-services',
      hireDate: new Date(),
      salary: 5000,
      commissionRate: 10,
      workSchedule: {}, // Explicitly set as empty object to simulate admin panel
      specializations: ['swedish-massage', 'deep-tissue-massage'],
      isActive: true
    });
    
    // Save the employee - this should trigger the pre-save hook
    await employee.save();
    console.log(`Created test employee with ID: ${employee._id}`);
    
    // Fetch the saved employee to check the workSchedule
    const savedEmployee = await Employee.findById(employee._id);
    
    console.log('\nVerifying workSchedule:');
    console.log(`- workSchedule type: ${savedEmployee.workSchedule instanceof Map ? 'Map' : typeof savedEmployee.workSchedule}`);
    console.log(`- Number of days in schedule: ${savedEmployee.workSchedule.size}`);
    
    if (savedEmployee.workSchedule instanceof Map && savedEmployee.workSchedule.size > 0) {
      // Print out the schedule for each day
      console.log('\nSchedule for each day:');
      for (const [day, schedule] of savedEmployee.workSchedule.entries()) {
        console.log(`${day}: ${JSON.stringify(schedule)}`);
      }
      console.log('\n✅ Test passed! The pre-save hook correctly handled the empty object.');
    } else {
      console.log('\n❌ Test failed! The pre-save hook did not set default schedule for empty object.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCreateEmployeeWithEmptyObject();