// Load environment variables first
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

async function checkAllEmployeeRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all Employee records
    const employees = await Employee.find({}).populate('user');
    console.log(`Found ${employees.length} Employee records:`);
    
    for (const emp of employees) {
      console.log(`\nEmployee ID: ${emp.employeeId}`);
      console.log(`Position: ${emp.position}`);
      console.log(`Department: ${emp.department}`);
      if (emp.user) {
        console.log(`User: ${emp.user.firstName} ${emp.user.lastName} (${emp.user.email})`);
        console.log(`User role: ${emp.user.role}`);
      } else {
        console.log('❌ No associated User record');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllEmployeeRecords();
