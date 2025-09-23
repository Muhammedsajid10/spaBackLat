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

// Test password for a user
async function checkPassword(email, password) {
  try {
    // Find the user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return;
    }
    
    console.log('User found:');
    console.log({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    });
    
    // Check if the password is valid
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`\nPassword check for "${password}": ${isPasswordValid ? 'VALID' : 'INVALID'}`);
    
    // If invalid, try to debug
    if (!isPasswordValid) {
      console.log('\nDebugging password:');
      console.log('Stored hashed password:', user.password);
      console.log('Password hash length:', user.password.length);
      
      // Try a direct hash comparison
      const directHash = await bcrypt.hash(password, 12);
      console.log('Direct hash of provided password:', directHash);
      console.log('Direct hash length:', directHash.length);
    }
  } catch (err) {
    console.error('Error checking password:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Please provide email and password: node check-password.js <email> <password>');
  process.exit(1);
}

checkPassword(email, password);