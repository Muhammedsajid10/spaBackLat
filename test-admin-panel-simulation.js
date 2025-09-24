require('dotenv').config();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
// Make sure we have all models loaded
require('./models/User');
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
    
    // Now make the exact API call that the admin panel would make
    console.log('\nSimulating admin panel API call to create employee...');
    const apiUrl = 'http://localhost:3000/api/v1/employees';
    const requestBody = {
      userId: userId.toString(),
      employeeId: `EMP-SIM-${Date.now()}`,
      position: 'massage-therapist',
      department: 'spa-services',
      hireDate: new Date()
      // Note: Intentionally not including workSchedule, just like the admin panel
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2VjOWY3ZTk0ODE4YmIzYWNlMWRlZCIsImlhdCI6MTY5NTc2MDY2NiwiZXhwIjoxNzI3Mjk2NjY2fQ.UUzJ9bhYJJQAPnfYReAikgMVRzLhJ7_EuJLQ6LxsPos' // Replace with your admin token
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseData = await response.json();
    console.log('\nAPI Response:', JSON.stringify(responseData, null, 2));
    
    if (responseData.success) {
      console.log('\nChecking employee workSchedule in response...');
      const employeeData = responseData.data.employee;
      
      if (employeeData.workSchedule) {
        console.log('workSchedule exists in response!');
        const scheduleSize = Object.keys(employeeData.workSchedule).length;
        console.log(`Schedule has ${scheduleSize} day entries`);
        
        if (scheduleSize === 7) {
          console.log('\n✅ SUCCESS: Default 24-hour schedule was correctly applied!');
        } else {
          console.log('\n❌ ERROR: Schedule does not have 7 days.');
        }
      } else {
        console.log('\n❌ ERROR: No workSchedule in response.');
      }
    } else {
      console.log('\n❌ ERROR: API call failed.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminPanelEmployeeCreation();