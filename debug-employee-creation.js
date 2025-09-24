require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Make sure we have all models loaded
require('./models/User');
const Employee = require('./models/Employee');
const User = require('./models/User');

// Create a simple Express app to listen to requests
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Debug endpoint to log the request body
app.post('/debug-employee-creation', async (req, res) => {
  console.log('\n===== EMPLOYEE CREATION DEBUG =====');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const {
      userId,
      employeeId,
      position,
      department,
      hireDate,
      workSchedule
    } = req.body;

    console.log('Extracted fields:');
    console.log('- userId:', userId);
    console.log('- employeeId:', employeeId);
    console.log('- position:', position);
    console.log('- department:', department);
    console.log('- hireDate:', hireDate);
    console.log('- workSchedule:', workSchedule);
    console.log('- workSchedule type:', typeof workSchedule);
    
    // Check if workSchedule is empty
    const isEmpty = 
      !workSchedule || 
      (workSchedule instanceof Map && workSchedule.size === 0) ||
      (workSchedule && typeof workSchedule === 'object' && 
       !Array.isArray(workSchedule) && 
       Object.keys(workSchedule).length === 0);
    
    console.log('Is workSchedule empty?', isEmpty ? 'Yes' : 'No');
    
    let employeeWorkSchedule = workSchedule;
    
    if (isEmpty) {
      console.log('Creating default 24-hour schedule...');
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
    
    // Now create the employee
    console.log('\nCreating employee...');
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const employee = new Employee({
      user: userId,
      employeeId,
      position,
      department,
      hireDate,
      workSchedule: employeeWorkSchedule
    });
    
    // Save the employee with console logs
    console.log('Before saving:');
    console.log('- workSchedule type:', employee.workSchedule ? 
      (employee.workSchedule instanceof Map ? 'Map' : typeof employee.workSchedule) : 'undefined');
    console.log('- workSchedule size:', employee.workSchedule instanceof Map ? employee.workSchedule.size : 'N/A');
    
    await employee.save();
    console.log('\nAfter saving:');
    console.log('- workSchedule type:', employee.workSchedule ? 
      (employee.workSchedule instanceof Map ? 'Map' : typeof employee.workSchedule) : 'undefined');
    console.log('- workSchedule size:', employee.workSchedule instanceof Map ? employee.workSchedule.size : 'N/A');
    
    // Get the saved employee to verify
    const savedEmployee = await Employee.findById(employee._id);
    console.log('\nVerifying saved employee:');
    console.log('- workSchedule type:', savedEmployee.workSchedule ? 
      (savedEmployee.workSchedule instanceof Map ? 'Map' : typeof savedEmployee.workSchedule) : 'undefined');
    console.log('- workSchedule size:', savedEmployee.workSchedule instanceof Map ? savedEmployee.workSchedule.size : 'N/A');
    
    res.status(201).json({
      success: true,
      message: 'Debug employee created successfully',
      data: {
        employee: savedEmployee
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Connect to MongoDB and start server
async function startDebugServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const PORT = 3001;
    app.listen(PORT, () => {
      console.log(`Debug server listening on port ${PORT}`);
      console.log(`\nTo test the employee creation, use this command in a separate terminal:`);
      console.log(`curl -X POST http://localhost:${PORT}/debug-employee-creation -H "Content-Type: application/json" -d '{"userId":"REPLACE_WITH_USER_ID","employeeId":"EMP-DEBUG-1","position":"massage-therapist","department":"spa-services","hireDate":"2025-09-23"}'`);
      console.log(`\nOr update your admin panel frontend to point to this endpoint temporarily for testing.`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

startDebugServer();