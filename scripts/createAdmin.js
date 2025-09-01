const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`Admin email: ${existingAdmin.email}`);
      console.log(`Admin ID: ${existingAdmin._id}`);
      process.exit(0);
    }

    // Admin user data
    const adminData = {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@spa.com',
      password: 'Admin@123',
      phone: '+1234567890',
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    };

    // Create admin user (password will be hashed by pre-save middleware)
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', 'Admin@123');
    console.log('🆔 User ID:', admin._id);
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    // Disconnect from database
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    
    // Handle specific errors
    if (error.code === 11000) {
      console.error('❌ Email already exists in database');
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
createAdmin(); 