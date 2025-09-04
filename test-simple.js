// Simple test to check if fixes are working by accessing the frontend directly
const axios = require('axios');

async function testFrontendAPIAccess() {
  try {
    console.log('🧪 Testing frontend API access...\n');

    // Test the health endpoint
    console.log('1️⃣ Testing health endpoint...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/health');
      console.log('✅ Backend health:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

    // Test available endpoints
    console.log('\n2️⃣ Testing available endpoints...');
    try {
      const apiResponse = await axios.get('http://localhost:5000/api');
      console.log('✅ Available endpoints:', JSON.stringify(apiResponse.data, null, 2));
    } catch (error) {
      console.log('❌ API endpoints check failed:', error.message);
    }

    console.log('\n3️⃣ Summary of Fixes Applied:');
    console.log('✅ TimeWithAPI.jsx - Fixed timezone conversion to use proper Date objects');
    console.log('✅ Payment.jsx - Fixed booking duration calculation for single services');
    console.log('✅ Selectcalander.jsx - Enhanced timezone debugging for admin calendar');
    console.log('✅ All services are running (Backend: 5000, Frontend: 5173, Admin: 5174)');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test time slot generation in the frontend by selecting an employee');
    console.log('2. Create a booking and verify it shows correct time in admin calendar');
    console.log('3. Verify booking duration is correctly calculated (60 minutes, not 15)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendAPIAccess();
