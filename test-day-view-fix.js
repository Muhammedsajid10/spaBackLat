require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

const testDayViewFilter = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Test the new date filtering logic
    const startDate = '2025-09-05';
    const endDate = '2025-09-05';
    
    console.log('\n📅 Testing Day View Date Filter');
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    // Original logic (what was failing)
    console.log('\n🔍 Original Logic (services.startTime filter):');
    const originalFilter = {
      'services.startTime': {
        $gte: new Date(startDate + 'T00:00:00.000Z'),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      }
    };
    console.log('Filter:', JSON.stringify(originalFilter, null, 2));
    
    const originalResults = await Booking.find(originalFilter)
      .populate('client', 'firstName lastName')
      .populate('services.service', 'name');
    
    console.log('Results found:', originalResults.length);
    originalResults.forEach((booking, i) => {
      console.log(`  ${i + 1}. Client: ${booking.client?.firstName} ${booking.client?.lastName}`);
      booking.services.forEach((service, j) => {
        console.log(`     Service ${j + 1}: ${service.service?.name} at ${new Date(service.startTime).toISOString()}`);
      });
    });

    // New logic (expanded range + client-side filtering)
    console.log('\n🔍 New Logic (appointmentDate with expanded range):');
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const expandedStart = new Date(startDateObj.getTime() - 24 * 60 * 60 * 1000);
    const expandedEnd = new Date(endDateObj.getTime() + 24 * 60 * 60 * 1000);
    expandedEnd.setHours(23, 59, 59, 999);

    const newFilter = {
      'appointmentDate': {
        $gte: expandedStart,
        $lte: expandedEnd
      }
    };
    console.log('Filter:', JSON.stringify(newFilter, null, 2));
    
    const newResults = await Booking.find(newFilter)
      .populate('client', 'firstName lastName')
      .populate('services.service', 'name');
    
    console.log('Results found (before client-side filtering):', newResults.length);
    
    // Apply client-side filtering
    const filteredResults = newResults.filter(booking => {
      return booking.services.some(service => {
        if (!service.startTime) return false;
        
        const serviceDate = new Date(service.startTime);
        const serviceDateStr = serviceDate.getFullYear() + '-' + 
                                String(serviceDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                String(serviceDate.getDate()).padStart(2, '0');
        
        const appointmentDate = new Date(booking.appointmentDate);
        const appointmentDateStr = appointmentDate.getFullYear() + '-' + 
                                   String(appointmentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                   String(appointmentDate.getDate()).padStart(2, '0');
        
        const startMatch = serviceDateStr >= startDate || appointmentDateStr >= startDate;
        const endMatch = serviceDateStr <= endDate || appointmentDateStr <= endDate;
        
        return startMatch && endMatch;
      });
    });
    
    console.log('Results found (after client-side filtering):', filteredResults.length);
    filteredResults.forEach((booking, i) => {
      console.log(`  ${i + 1}. Client: ${booking.client?.firstName} ${booking.client?.lastName}`);
      const appointmentDate = new Date(booking.appointmentDate);
      console.log(`     Appointment Date: ${appointmentDate.toLocaleDateString()}`);
      booking.services.forEach((service, j) => {
        const serviceDate = new Date(service.startTime);
        console.log(`     Service ${j + 1}: ${service.service?.name} at ${serviceDate.toLocaleDateString()} ${serviceDate.toLocaleTimeString()}`);
      });
    });

    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 MongoDB disconnected');
  }
};

testDayViewFilter();
