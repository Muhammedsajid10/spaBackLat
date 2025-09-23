const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('./models/User');

// Connect to database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error:', err));

/**
 * Reset user password directly by updating the hash in the database
 * This bypasses the pre-save hook to avoid double-hashing issues
 */
async function resetUserPasswordDirect(userId, newPlainPassword) {
  try {
    console.log(`Attempting direct password reset for user ID: ${userId}`);
    
    // Hash the password manually
    const hashedPassword = await bcrypt.hash(newPlainPassword, 12);
    
    // Update the password directly in the database
    const result = await User.findByIdAndUpdate(
      userId,
      { 
        password: hashedPassword,
        passwordChangedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      console.log(`User not found with ID: ${userId}`);
      return false;
    }
    
    console.log(`Password reset directly for user: ${result.email}`);
    
    // Verify the password works
    const user = await User.findById(userId).select('+password');
    const isValid = await bcrypt.compare(newPlainPassword, user.password);
    
    console.log(`Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    
    return isValid;
  } catch (err) {
    console.error('Error resetting password:', err);
    return false;
  } finally {
    mongoose.disconnect();
  }
}

// Run the function if called directly
if (require.main === module) {
  const userId = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!userId || !newPassword) {
    console.error('Please provide user ID and new password: node reset-password-direct.js <userId> <newPassword>');
    process.exit(1);
  }
  
  resetUserPasswordDirect(userId, newPassword)
    .then(success => {
      console.log(`Password reset ${success ? 'successful' : 'failed'}`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = resetUserPasswordDirect;