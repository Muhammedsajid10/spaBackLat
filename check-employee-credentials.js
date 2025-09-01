// Load environment variables first
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

async function checkEmployeeCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all employee users
    const employees = await User.find({ role: 'employee' }).select('+password');
    console.log(`Found ${employees.length} employee users:`);
    
    for (const emp of employees) {
      console.log(`\nEmployee: ${emp.email}`);
      console.log(`Password hash: ${emp.password}`);
      console.log(`Is active: ${emp.isActive}`);
      console.log(`Email verified: ${emp.emailVerified}`);
      
      // Check if Employee record exists
      const empRecord = await Employee.findOne({ userId: emp._id });
      if (empRecord) {
        console.log(`Employee record exists: ID ${empRecord.employeeId}`);
      } else {
        console.log('❌ No Employee record found');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkEmployeeCredentials();
