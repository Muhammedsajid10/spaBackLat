require('dotenv').config();
const mongoose = require('mongoose');
// Make sure we have all models loaded
require('./models/User');
const Employee = require('./models/Employee');
const User = require('./models/User');

async function testAdminPanelEmployeeCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // First create a test user
    console.log('Creating a test user...');
    const user = new User({
      firstName: 'Admin',
      lastName: 'Panel Simulation',
      email: `admin-panel-sim-${Date.now()}@test.com`,
      password: 'password123',
      phone: '+12345678901',
      role: 'client' // Start as client, will be updated to employee
    });
    
    await user.save();
    const userId = user._id;
    console.log(`Created test user with ID: ${userId}`);
    
    // Now simulate the exact data sent from the admin panel
    console.log('\nSimulating admin panel employee creation...');
    const employeeData = {
      user: userId,
      employeeId: `EMP-SIM-${Date.now()}`,
      position: 'massage-therapist',
      department: 'spa-services',
      hireDate: new Date(),
      isActive: true
      // Intentionally NOT providing workSchedule
    };
    
    console.log('Creating employee with data:', JSON.stringify(employeeData, null, 2));
    
    // Create the employee
    const employee = await Employee.create(employeeData);
    console.log(`Created employee with ID: ${employee._id}`);
    
    // Fetch the saved employee to check if the schedule was properly set
    const savedEmployee = await Employee.findById(employee._id);
    
    console.log('\nVerifying workSchedule:');
    if (savedEmployee.workSchedule) {
      console.log('✅ workSchedule exists');
      console.log(`Type: ${savedEmployee.workSchedule instanceof Map ? 'Map' : typeof savedEmployee.workSchedule}`);
      
      if (savedEmployee.workSchedule instanceof Map) {
        console.log(`Size: ${savedEmployee.workSchedule.size} days`);
        
        if (savedEmployee.workSchedule.size === 7) {
          console.log('\n✅ SUCCESS: Default schedule with 7 days was correctly created!');
          
          // Print the schedule for a few days
          console.log('\nSample schedule entries:');
          const days = ['monday', 'friday', 'sunday'];
          days.forEach(day => {
            if (savedEmployee.workSchedule.has(day)) {
              console.log(`${day}: ${JSON.stringify(savedEmployee.workSchedule.get(day))}`);
            } else {
              console.log(`${day}: Not found in schedule`);
            }
          });
        } else {
          console.log('\n❌ ERROR: Schedule does not have 7 days.');
        }
      } else {
        console.log('\n❌ ERROR: workSchedule is not a Map.');
      }
    } else {
      console.log('\n❌ ERROR: No workSchedule found.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminPanelEmployeeCreation();