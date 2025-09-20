const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const email = 'admin@spa.com';
  const password = 'Admin@123';

  // Check if admin already exists
  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    console.log('Admin user already exists.');
    process.exit(0);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create admin user
  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email,
    password: hashedPassword,
    phone: '+971000000000',
    role: 'admin',
    isEmailVerified: true,
    isActive: true
  });

  console.log('Admin user created:', admin.email);
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('Error seeding admin:', err);
  process.exit(1);
});
