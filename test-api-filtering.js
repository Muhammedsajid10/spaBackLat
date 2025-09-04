// Test script to verify date filtering behavior
const axios = require('axios');

const testDateFiltering = async () => {
  try {
    console.log('🔍 Testing date filtering behavior...');
    
    // Setup auth headers (you'll need to provide a valid token)
    const headers = {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzVmNTVhNTg2NzIzNGY1OTUzMzE2ZTciLCJlbWFpbCI6InNhamlkYWxoaWphc0BnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzcwNDU1NTMsImV4cCI6MTczNzEzMTk1M30.v3gNbPaRWyb_rRfP6uf_I0a3OOxnvVdoMBcq6wn4lIs'
    };
    
    // Test 1: Get all bookings without date filter
    console.log('\n📊 Test 1: All bookings (no date filter)');
    const allBookingsResponse = await axios.get('http://localhost:5000/api/v1/bookings/admin/all', { headers });
    const allBookings = allBookingsResponse.data?.data?.bookings || [];
    console.log(`Found ${allBookings.length} total bookings`);
    
    // Show sample booking structure
    if (allBookings.length > 0) {
      const sample = allBookings[0];
      console.log('\nSample booking structure:');
      console.log('appointmentDate:', sample.appointmentDate);
      console.log('services count:', sample.services?.length);
      if (sample.services && sample.services.length > 0) {
        console.log('First service startTime:', sample.services[0].startTime);
        console.log('First service endTime:', sample.services[0].endTime);
      }
    }
    
    // Test 2: Get bookings with date filter
    console.log('\n📊 Test 2: Bookings with date filter (2025-09-04 to 2025-09-05)');
    const filteredResponse = await axios.get('http://localhost:5000/api/v1/bookings/admin/all?startDate=2025-09-04&endDate=2025-09-05', { headers });
    const filteredBookings = filteredResponse.data?.data?.bookings || [];
    console.log(`Found ${filteredBookings.length} filtered bookings`);
    
    // Analyze the filtered results
    if (filteredBookings.length > 0) {
      console.log('\nFiltered booking analysis:');
      filteredBookings.forEach((booking, i) => {
        console.log(`Booking ${i+1}:`);
        console.log(`  appointmentDate: ${booking.appointmentDate}`);
        booking.services?.forEach((service, j) => {
          console.log(`  Service ${j+1}: ${service.startTime} to ${service.endTime}`);
        });
      });
    }
    
    // Test 3: Check if filtering is working correctly
    console.log('\n🔍 Analysis: Should date filtering restrict results?');
    if (allBookings.length === filteredBookings.length) {
      console.log('❌ ISSUE: Date filtering is not working - same number of results');
    } else {
      console.log('✅ Date filtering appears to be working');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testDateFiltering();
