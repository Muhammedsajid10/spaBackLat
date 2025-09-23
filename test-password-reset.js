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

// Test functions
async function findUserByEmail(email) {
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return null;
    }
    
    console.log('User found:');
    console.log({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    return user;
  } catch (err) {
    console.error('Error finding user:', err);
    return null;
  }
}

async function testPasswordReset(email, newPassword) {
  try {
    // Find the user
    const user = await findUserByEmail(email);
    if (!user) return;
    
    // Test 1: Manually save plain text password
    console.log('\nTest 1: Setting password directly (this will trigger pre-save hook)');
    const originalPassword = user.password;
    user.password = newPassword;
    await user.save();
    
    // Verify the password was hashed
    const updatedUser = await User.findOne({ email }).select('+password');
    console.log('Password before:', originalPassword);
    console.log('Password after:', updatedUser.password);
    console.log('Are passwords different?', originalPassword !== updatedUser.password);
    
    // Test if login would work with this password
    const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
    console.log('Would login work?', isPasswordValid);
    
    // Test 2: Manual hashing and then saving
    console.log('\nTest 2: Manually hashing password and then saving');
    const manuallyHashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = manuallyHashedPassword;
    await user.save({ validateBeforeSave: false });
    
    // Verify if this causes double-hashing
    const doubleHashedUser = await User.findOne({ email }).select('+password');
    const isDoubleHashedValid = await bcrypt.compare(newPassword, doubleHashedUser.password);
    console.log('Is manually hashed password valid?', isDoubleHashedValid);
    
    // Reset back to original password
    console.log('\nResetting password to a known value');
    user.password = 'Test@123';
    await user.save();
    
    const finalUser = await User.findOne({ email }).select('+password');
    const isFinalPasswordValid = await bcrypt.compare('Test@123', finalUser.password);
    console.log('Final password valid?', isFinalPasswordValid);
    
    console.log('\nTest completed. The password has been reset to "Test@123".');
  } catch (err) {
    console.error('Error in test:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test
const email = process.argv[2];
const newPassword = process.argv[3] || 'TestPassword123';

if (!email) {
  console.error('Please provide an email address: node test-password-reset.js <email> [password]');
  process.exit(1);
}

testPasswordReset(email, newPassword);