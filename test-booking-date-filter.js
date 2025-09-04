// Test the fixed booking date filtering API
const axios = require('axios');

async function testBookingDateFilter() {
  try {
    console.log('🧪 Testing booking date filter API...\n');

    const baseURL = 'http://localhost:5000/api/v1/bookings';
    
    // You'll need to get a valid admin token for this test
    // For now, let's test without auth to see if we get a 401 or the actual filtering
    
    console.log('1️⃣ Testing without date parameters (should return all bookings):');
    try {
      const response1 = await axios.get(`${baseURL}/admin/all`);
      console.log(`   Found ${response1.data.results} total bookings`);
    } catch (error) {
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n2️⃣ Testing with specific date range (2025-09-05 only):');
    try {
      const response2 = await axios.get(`${baseURL}/admin/all?startDate=2025-09-05&endDate=2025-09-05`);
      console.log(`   Found ${response2.data.results} bookings for 2025-09-05`);
    } catch (error) {
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n3️⃣ Testing with date range (2025-09-04 to 2025-09-05):');
    try {
      const response3 = await axios.get(`${baseURL}/admin/all?startDate=2025-09-04&endDate=2025-09-05`);
      console.log(`   Found ${response3.data.results} bookings for 2025-09-04 to 2025-09-05`);
    } catch (error) {
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n4️⃣ Testing with only startDate (from 2025-09-05 onwards):');
    try {
      const response4 = await axios.get(`${baseURL}/admin/all?startDate=2025-09-05`);
      console.log(`   Found ${response4.data.results} bookings from 2025-09-05 onwards`);
    } catch (error) {
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n✅ Test completed. If you see 401 errors, you need to authenticate first.');
    console.log('📋 The backend logs will show the actual date filtering being applied.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBookingDateFilter();
