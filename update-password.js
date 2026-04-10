/**
 * Script to update any user's password
 * Usage: node update-password.js <email> <new-password>
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('./models/User');

async function updatePassword() {
  // Get email and password from command line arguments
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  // Validate inputs
  if (!email || !newPassword) {
    console.error('❌ Error: Please provide both email and new password');
    console.log('Usage: node update-password.js <email> <new-password>');
    process.exit(1);
  }

  try {
    // Connect to the database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.error(`❌ Error: No user found with email ${email}`);
      process.exit(1);
    }

    // Update the user's password
    // The pre-save middleware in models/User.js will handle the hashing
    user.password = newPassword;
    await user.save();

    console.log(`✅ Successfully updated password for: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log('New login credentials:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${newPassword}`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

updatePassword();
