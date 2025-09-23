/**
 * Script to reset an employee's password
 * Usage: node reset-employee-password.js <employee-email> <new-password>
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('./models/User');

async function resetEmployeePassword() {
  // Get email and password from command line arguments
  const employeeEmail = process.argv[2];
  const newPassword = process.argv[3];
  
  // Validate inputs
  if (!employeeEmail || !newPassword) {
    console.error('❌ Error: Please provide both email and new password');
    console.log('Usage: node reset-employee-password.js <employee-email> <new-password>');
    process.exit(1);
  }

  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the employee user
    const user = await User.findOne({ email: employeeEmail, role: 'employee' });
    
    if (!user) {
      console.error(`❌ Error: No employee found with email ${employeeEmail}`);
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ Successfully reset password for employee: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log('New login credentials:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${newPassword}`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

resetEmployeePassword();