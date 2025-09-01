const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const Employee = require('../models/Employee');

dotenv.config();

async function seedPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Fetch up to 5 bookings and users
    const bookings = await Booking.find().limit(5);
    const users = await User.find().limit(5);

    if (bookings.length === 0 || users.length === 0) {
      console.error('No bookings or users found. Please seed bookings and users first.');
      process.exit(1);
    }

    const paymentMethods = ['card', 'cash', 'bank_transfer', 'digital_wallet'];
    const paymentGateways = ['stripe', 'paypal', 'square', 'adyen'];

    const payments = bookings.map((booking, i) => ({
      booking: booking._id,
      user: users[i % users.length]._id,
      amount: 10000 + i * 500, // in cents
      currency: 'AED',
      paymentMethod: paymentMethods[i % paymentMethods.length],
      paymentGateway: paymentGateways[i % paymentGateways.length],
      status: 'completed',
      processedAt: new Date(),
    }));

    await Payment.deleteMany({});
    const created = await Payment.insertMany(payments);
    console.log('Seeded payments:', created);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding payments:', err);
    process.exit(1);
  }
}

seedPayments(); 