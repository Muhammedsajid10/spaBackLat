/**
 * Script to list all employees in the system
 * Usage: node list-employees.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the User and Employee models
const User = require('./models/User');
const Employee = require('./models/Employee');

async function listEmployees() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all employees with their user data
    const employees = await Employee.find()
      .populate('user', 'firstName lastName email role isActive')
      .sort({ 'user.firstName': 1 });
    
    if (employees.length === 0) {
      console.log('No employees found in the system.');
      process.exit(0);
    }

    console.log(`Found ${employees.length} employees:\n`);
    
    // Print employee information in a table format
    console.log('ID\tName\t\t\tEmail\t\t\t\tPosition');
    console.log('-'.repeat(100));
    
    employees.forEach(employee => {
      if (!employee.user) {
        console.log(`${employee._id}\t[No user data]\t\t\t${employee.position || 'N/A'}`);
        return;
      }
      
      const user = employee.user;
      const name = `${user.firstName} ${user.lastName}`;
      const formattedName = name.length > 15 ? name.substring(0, 15) + '...' : name.padEnd(15);
      const email = user.email.length > 25 ? user.email.substring(0, 25) + '...' : user.email.padEnd(25);
      const status = user.isActive ? '✅' : '❌';
      
      console.log(`${employee.employeeId || 'N/A'}\t${formattedName}\t${email}\t${employee.position || 'N/A'}\t${status}`);
    });
    
    console.log('\n✅ To reset an employee\'s password, use:');
    console.log('node reset-employee-password.js <employee-email> <new-password>');
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error listing employees:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

listEmployees();