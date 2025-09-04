const connectDB = require('./config/db');
const Booking = require('./models/Booking');

(async () => {
  try {
    await connectDB();
    console.log('🔍 Testing date filtering logic...');
    
    const startDate = '2025-09-04';
    const endDate = '2025-09-05';
    
    console.log('📅 Original date params:', { startDate, endDate });
    
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T23:59:59.999Z');
    
    console.log('🔍 Date filter boundaries:');
    console.log('  start:', start.toISOString());
    console.log('  end:', end.toISOString());
    
    // Query by appointmentDate (current implementation)
    const dateFilter1 = { appointmentDate: { $gte: start, $lte: end } };
    const bookingsByAppointmentDate = await Booking.find(dateFilter1)
      .populate('client', 'firstName lastName')
      .select('appointmentDate services client bookingNumber status');
    
    console.log('📊 Results by appointmentDate:', bookingsByAppointmentDate.length);
    bookingsByAppointmentDate.forEach((booking, i) => {
      console.log(`  ${i+1}. Date: ${booking.appointmentDate?.toISOString()}`);
      booking.services.forEach((service, j) => {
        console.log(`     Service ${j+1}: ${service.startTime} to ${service.endTime}`);
      });
    });
    
    // Query by service startTime (new implementation) 
    const dateFilter2 = { 'services.startTime': { $gte: start, $lte: end } };
    const bookingsByServiceTime = await Booking.find(dateFilter2)
      .populate('client', 'firstName lastName')
      .select('appointmentDate services client bookingNumber status');
    
    console.log('📊 Results by services.startTime:', bookingsByServiceTime.length);
    bookingsByServiceTime.forEach((booking, i) => {
      console.log(`  ${i+1}. Date: ${booking.appointmentDate?.toISOString()}`);
      booking.services.forEach((service, j) => {
        console.log(`     Service ${j+1}: ${service.startTime} to ${service.endTime}`);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
