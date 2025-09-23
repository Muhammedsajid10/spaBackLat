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

// Create a test employee with a known password
async function createTestEmployee() {
  try {
    // Check if the test employee already exists
    const existingUser = await User.findOne({ email: 'testemployee@spa.com' });
    
    if (existingUser) {
      console.log('Test employee already exists. Updating password...');
      existingUser.password = 'TestPassword123';
      await existingUser.save();
      console.log('Password updated to "TestPassword123"');
      return;
    }
    
    // Create a new test employee
    const newUser = new User({
      firstName: 'Test',
      lastName: 'Employee',
      email: 'testemployee@spa.com',
      password: 'TestPassword123',
      phone: '1234567890',
      role: 'employee',
      isActive: true,
      isEmailVerified: true,
      position: 'Test Position',
      department: 'Test Department'
    });
    
    await newUser.save();
    console.log('Test employee created with email: testemployee@spa.com and password: TestPassword123');
    
    // Verify the password
    const user = await User.findOne({ email: 'testemployee@spa.com' }).select('+password');
    const isValid = await bcrypt.compare('TestPassword123', user.password);
    console.log('Password verification:', isValid ? 'SUCCESSFUL' : 'FAILED');
    
  } catch (err) {
    console.error('Error creating test employee:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the function
createTestEmployee();