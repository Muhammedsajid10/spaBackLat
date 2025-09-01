// Load environment variables first (same as server.js)
const dotenv = require('dotenv');
dotenv.config();

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const mongoose = require('mongoose');
const User = require('./models/User');

console.log('JWT_SECRET from environment:', process.env.JWT_SECRET);

async function testJWTFlow() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an employee user
    const employee = await User.findOne({ role: 'employee' });
    if (!employee) {
      console.log('No employee found in database');
      return;
    }

    console.log('Testing with employee:', employee.email);

    // Create token (same way as login)
    const token = jwt.sign(
      { id: employee._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Created token:', token);

    // Verify token (same way as middleware)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log('Token verified successfully! Decoded:', decoded);

    // Test API call to employee-specific endpoint
    const response = await fetch('http://localhost:3000/api/v1/employees/my-schedule', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API Response status:', response.status);
    const data = await response.json();
    console.log('API Response data:', data);

    // Test check-in endpoint too
    const checkinResponse = await fetch('http://localhost:3000/api/v1/employees/check-in', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Check-in Response status:', checkinResponse.status);
    const checkinData = await checkinResponse.json();
    console.log('Check-in Response data:', checkinData);

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testJWTFlow();
