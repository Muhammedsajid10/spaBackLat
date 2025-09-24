require('dotenv').config();
const mongoose = require('mongoose');
// Make sure we have all models loaded
require('./models/User');
const Employee = require('./models/Employee');
const User = require('./models/User');

// Mock of the createEmployee controller function
async function mockCreateEmployeeController() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // First create a test user
    const user = new User({
      firstName: 'Admin',
      lastName: 'Panel Test',
      email: `admin-panel-${Date.now()}@test.com`,
      password: 'password123',
      phone: '+12345678901',
      role: 'client' // Start as client, will be updated to employee
    });
    
    await user.save();
    const userId = user._id;
    console.log(`Created test user with ID: ${userId}`);
    
    // Simulate the request body from the admin panel frontend
    // Note: workSchedule is not included here, as it's not sent by the frontend
    const reqBody = {
      userId: userId,
      employeeId: `EMP-${Date.now()}`,
      position: 'massage-therapist',
      department: 'spa-services',
      hireDate: new Date()
    };
    
    console.log('Simulating employee creation from admin panel with this data:');
    console.log(JSON.stringify(reqBody, null, 2));
    
    // Extract fields from the request body
    const {
      employeeId,
      position,
      department,
      hireDate
    } = reqBody;
    
    // This is the exact logic from the controller
    // If no workSchedule provided, create default 24-hour schedule for all days
    let employeeWorkSchedule = reqBody.workSchedule;
    console.log('Received workSchedule:', employeeWorkSchedule, 'Type:', typeof employeeWorkSchedule);
    
    // Check all possible cases of empty workSchedule
    const isEmpty = 
      !employeeWorkSchedule || 
      (employeeWorkSchedule instanceof Map && employeeWorkSchedule.size === 0) ||
      (employeeWorkSchedule && typeof employeeWorkSchedule === 'object' && 
       !Array.isArray(employeeWorkSchedule) && 
       Object.keys(employeeWorkSchedule).length === 0);
    
    console.log('Is workSchedule empty?', isEmpty ? 'Yes' : 'No');
    
    if (isEmpty) {
      console.log('Creating default 24-hour schedule for new employee in controller');
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
      
      employeeWorkSchedule = defaultWorkSchedule;
      console.log('Default schedule created with', defaultWorkSchedule.size, 'days');
    }

    // Create employee
    console.log('Creating employee with workSchedule type:', 
      employeeWorkSchedule ? 
      (employeeWorkSchedule instanceof Map ? 'Map' : typeof employeeWorkSchedule) : 
      'undefined');
    
    const employee = await Employee.create({
      user: userId,
      employeeId,
      position,
      department,
      hireDate,
      workSchedule: employeeWorkSchedule
    });
    
    console.log(`Created test employee with ID: ${employee._id}`);
    
    // Update user role to employee (as done in controller)
    await User.findByIdAndUpdate(userId, { role: 'employee' });
    
    // Fetch the saved employee to check the workSchedule
    const savedEmployee = await Employee.findById(employee._id);
    
    console.log('\nVerifying final employee workSchedule:');
    console.log(`- workSchedule type: ${savedEmployee.workSchedule instanceof Map ? 'Map' : typeof savedEmployee.workSchedule}`);
    console.log(`- Number of days in schedule: ${savedEmployee.workSchedule.size}`);
    
    // Print out the schedule for each day
    console.log('\nSchedule for each day:');
    for (const [day, schedule] of savedEmployee.workSchedule.entries()) {
      console.log(`${day}: ${JSON.stringify(schedule)}`);
    }
    
    if (savedEmployee.workSchedule.size === 7) {
      console.log('\n✅ TEST PASSED: Default schedule was correctly set for the employee.');
    } else {
      console.log('\n❌ TEST FAILED: Default schedule was not set properly.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

mockCreateEmployeeController();