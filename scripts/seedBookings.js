const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('../models/Booking');
const Employee = require('../models/Employee');
const Service = require('../models/Service');
const User = require('../models/User');

dotenv.config();

async function seedBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Fetch employees, services, and a client
    const employees = await Employee.find({ isActive: true }).limit(3);
    const services = await Service.find({ isActive: true }).limit(3);
    const client = await User.findOne({ role: 'client' });

    if (!client) {
      console.error('No client found in the database. Please create a client user first.');
      process.exit(1);
    }
    if (employees.length === 0 || services.length === 0) {
      console.error('Not enough employees or services found.');
      process.exit(1);
    }

    // Create 5 bookings
    const bookingsToCreate = [];
    for (let i = 0; i < 5; i++) {
      const employee = employees[i % employees.length];
      const service = services[i % services.length];
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() - i); // spread out dates

      // Service timing
      const duration = service.duration || 60; // in minutes
      const startTime = new Date(appointmentDate);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      // Booking number
      const bookingNumber = `BK-${Date.now()}-${i}`;

      bookingsToCreate.push({
        client: client._id,
        appointmentDate,
        status: 'completed',
        bookingNumber,
        paymentMethod: 'cash',
        totalAmount: service.price || 100,
        finalAmount: service.price || 100,
        totalDuration: duration,
        paymentStatus: 'paid',
        createdAt: appointmentDate,
        updatedAt: appointmentDate,
        services: [
          {
            service: service._id,
            employee: employee._id,
            price: service.price || 100,
            status: 'completed',
            startTime,
            endTime,
            duration,
          },
        ],
      });
    }

    const created = await Booking.insertMany(bookingsToCreate);
    console.log('Seeded bookings:', created);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding bookings:', err);
    process.exit(1);
  }
}

seedBookings(); 