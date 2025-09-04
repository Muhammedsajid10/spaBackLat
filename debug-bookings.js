const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Service = require('./models/Service');
const Employee = require('./models/Employee');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sajidalhijas:zUsF7GJ7Sy7vjy1s@cluster0.govwh3h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return checkBookings();
  })
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

async function checkBookings() {
  try {
    console.log('\n📋 FETCHING RECENT BOOKINGS...\n');
    
    const bookings = await Booking.find()
      .populate('client', 'firstName lastName email')
      .populate('services.service', 'name')
      .populate('services.employee', 'employeeId user')
      .sort({ appointmentDate: -1 })
      .limit(10);

    console.log(`Found ${bookings.length} bookings\n`);

    bookings.forEach((booking, index) => {
      console.log(`🔸 BOOKING ${index + 1}:`);
      console.log(`   ID: ${booking._id}`);
      console.log(`   Client: ${booking.client?.firstName} ${booking.client?.lastName}`);
      console.log(`   Appointment Date: ${booking.appointmentDate}`);
      console.log(`   Status: ${booking.status}`);
      
      if (booking.services && booking.services.length > 0) {
        console.log(`   Services:`);
        booking.services.forEach((service, serviceIndex) => {
          console.log(`     ${serviceIndex + 1}. ${service.service?.name || 'Unknown Service'}`);
          console.log(`        Start Time: ${service.startTime}`);
          console.log(`        End Time: ${service.endTime}`);
          console.log(`        Duration: ${service.duration} minutes`);
          console.log(`        Employee: ${service.employee?.user?.firstName || 'Unknown'} ${service.employee?.user?.lastName || ''}`);
        });
      }
      console.log('   ---');
    });

    // Check today's bookings specifically
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    console.log(`\n📅 TODAY'S BOOKINGS (${todayStart.toDateString()}):\n`);

    const todayBookings = await Booking.find({
      appointmentDate: {
        $gte: todayStart,
        $lt: todayEnd
      }
    })
      .populate('client', 'firstName lastName')
      .populate('services.service', 'name')
      .populate('services.employee', 'employeeId user');

    console.log(`Found ${todayBookings.length} bookings for today\n`);

    todayBookings.forEach((booking, index) => {
      console.log(`📍 TODAY'S BOOKING ${index + 1}:`);
      console.log(`   Appointment Date (Raw): ${booking.appointmentDate}`);
      console.log(`   Appointment Date (ISO): ${booking.appointmentDate.toISOString()}`);
      console.log(`   Appointment Date (Local): ${booking.appointmentDate.toString()}`);
      
      if (booking.services && booking.services.length > 0) {
        booking.services.forEach((service, serviceIndex) => {
          console.log(`   Service ${serviceIndex + 1}:`);
          console.log(`     Start Time (Raw): ${service.startTime}`);
          console.log(`     Start Time (ISO): ${service.startTime ? new Date(service.startTime).toISOString() : 'null'}`);
          console.log(`     Start Time (Local): ${service.startTime ? new Date(service.startTime).toString() : 'null'}`);
          console.log(`     Duration: ${service.duration} minutes`);
        });
      }
      console.log('   ---');
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
  }
}
