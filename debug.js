const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

dotenv.config();

async function debugDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-backend');
    console.log('✅ Connected to MongoDB');

    // Check users
    const userCount = await User.countDocuments();
    console.log(`👥 Users in database: ${userCount}`);
    
    if (userCount > 0) {
      const adminUsers = await User.find({ role: 'admin' }).limit(3);
      console.log('🔐 Admin users:', adminUsers.map(u => ({ 
        id: u._id, 
        email: u.email, 
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName
      })));
    }

    // Check payments
    const paymentCount = await Payment.countDocuments();
    console.log(`💳 Payments in database: ${paymentCount}`);
    
    if (paymentCount > 0) {
      const samplePayments = await Payment.find().limit(3);
      console.log('💰 Sample payments:', samplePayments.map(p => ({
        id: p._id,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        status: p.status,
        createdAt: p.createdAt
      })));
    }

    // Check bookings
    const bookingCount = await Booking.countDocuments();
    console.log(`📅 Bookings in database: ${bookingCount}`);

    // Test cash movement summary aggregation
    console.log('\n🔍 Testing cash movement aggregation...');
    const today = new Date().toISOString().split('T')[0];
    const start = new Date(today + 'T00:00:00.000Z');
    const end = new Date(today + 'T23:59:59.999Z');
    
    const payments = await Payment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { paymentMethod: "$paymentMethod", status: "$status" },
          total: { $sum: "$amount" }
        }
      }
    ]);
    
    console.log(`📊 Today's payment aggregation (${today}):`, payments);

    // Test for recent payments (last 7 days)
    console.log('\n🔍 Testing recent payments (last 7 days)...');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentPayments = await Payment.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { paymentMethod: "$paymentMethod", status: "$status" },
          total: { $sum: "$amount" }
        }
      }
    ]);
    
    console.log('📊 Recent payment aggregation:', recentPayments);

    console.log('\n✅ Database debug completed!');
  } catch (error) {
    console.error('❌ Database debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Create a test admin user if none exists
async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-backend');
    
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    const testAdmin = new User({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'admin@test.com',
      password: 'password123', // This will be hashed by the model
      role: 'admin',
      isVerified: true
    });

    await testAdmin.save();
    console.log('✅ Test admin user created:', testAdmin.email);
  } catch (error) {
    console.error('❌ Error creating test admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the debug
if (process.argv[2] === 'create-admin') {
  createTestAdmin();
} else {
  debugDatabase();
}
