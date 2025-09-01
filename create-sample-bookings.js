const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Employee = require('./models/Employee');
const Service = require('./models/Service');
const Booking = require('./models/Booking');

const createSampleBookings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📱 Connected to MongoDB');

    // Find Sarah Johnson (our test employee)
    const sarahUser = await User.findOne({ email: 'sarah.johnson@spa.com' });
    if (!sarahUser) {
      console.log('❌ Sarah Johnson user not found');
      return;
    }

    const sarahEmployee = await Employee.findOne({ user: sarahUser._id });
    if (!sarahEmployee) {
      console.log('❌ Sarah Johnson employee record not found');
      return;
    }

    console.log(`👤 Found employee: ${sarahUser.firstName} ${sarahUser.lastName}`);

    // Find a test client
    const testClient = await User.findOne({ role: 'client', isActive: true });
    if (!testClient) {
      console.log('❌ No test client found');
      return;
    }

    console.log(`👥 Found client: ${testClient.firstName} ${testClient.lastName}`);

    // Find available services
    const services = await Service.find({ isActive: true }).limit(3);
    if (services.length === 0) {
      console.log('❌ No services found');
      return;
    }

    console.log(`🛎️ Found ${services.length} services`);

    // Create sample bookings for the next few days
    const bookings = [];
    const today = new Date();
    
    for (let i = 1; i <= 3; i++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + i);
      appointmentDate.setHours(10 + i, 0, 0, 0); // 11:00, 12:00, 13:00

      const service = services[i - 1];
      const startTime = new Date(appointmentDate);
      const endTime = new Date(startTime.getTime() + (service.duration * 60000)); // Add duration in milliseconds

      const booking = {
        bookingNumber: `BK${Date.now()}${i}`,
        client: testClient._id,
        services: [{
          service: service._id,
          employee: sarahEmployee._id,
          price: service.price,
          duration: service.duration,
          startTime: startTime,
          endTime: endTime,
          status: 'scheduled'
        }],
        appointmentDate: appointmentDate,
        totalDuration: service.duration,
        totalAmount: service.price,
        status: i === 1 ? 'confirmed' : 'pending',
        paymentStatus: 'pending',
        bookingSource: 'admin'
      };

      bookings.push(booking);
    }

    // Insert the bookings
    const createdBookings = await Booking.insertMany(bookings);
    console.log(`✅ Created ${createdBookings.length} sample bookings:`);
    
    createdBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.bookingNumber} - ${booking.appointmentDate.toLocaleDateString()} at ${booking.services[0].startTime.toLocaleTimeString()}`);
    });

    await mongoose.disconnect();
    console.log('🏁 Sample bookings created successfully!');

  } catch (error) {
    console.error('❌ Error creating sample bookings:', error.message);
    await mongoose.disconnect();
  }
};

createSampleBookings();
