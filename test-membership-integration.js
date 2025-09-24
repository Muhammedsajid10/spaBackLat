const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api'; // Adjust port if needed
const TEST_USER_ID = '507f1f77bcf86cd799439011'; // Replace with actual user ID
const TEST_SERVICE_ID = '507f1f77bcf86cd799439012'; // Replace with actual service ID
const TEST_MEMBERSHIP_ID = '507f1f77bcf86cd799439013'; // Replace with actual membership ID

// Test token - replace with actual token from authentication
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Add real token here

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testMembershipEndpoints() {
  console.log('🧪 Testing Membership API Endpoints...\n');

  try {
    // Test 1: Get user memberships
    console.log('1️⃣ Testing GET /memberships/my-memberships/:userId');
    try {
      const response = await axios.get(`${BASE_URL}/memberships/my-memberships/${TEST_USER_ID}`, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // Test 2: Check membership for service
    console.log('2️⃣ Testing GET /memberships/check-service/:serviceId');
    try {
      const response = await axios.get(`${BASE_URL}/memberships/check-service/${TEST_SERVICE_ID}`, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // Test 3: Use membership session
    console.log('3️⃣ Testing POST /memberships/:membershipId/use-session');
    try {
      const response = await axios.post(`${BASE_URL}/memberships/${TEST_MEMBERSHIP_ID}/use-session`, {}, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // Test 4: Purchase membership with payment integration
    console.log('4️⃣ Testing POST /memberships/purchase (with payment integration)');
    try {
      const purchaseData = {
        templateId: 'TEMPLATE_ID_HERE', // Replace with actual template ID
        clientId: TEST_USER_ID,
        startDate: new Date().toISOString(),
        price: 100,
        paymentType: 'One-time',
        paymentIntentId: 'pi_test_1234567890' // Test Stripe payment intent ID
      };
      
      const response = await axios.post(`${BASE_URL}/memberships/purchase`, purchaseData, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    console.log('🎯 All tests completed!');
    
  } catch (error) {
    console.error('💥 Testing failed:', error.message);
  }
}

// Test connection to server
async function testConnection() {
  console.log('🔗 Testing connection to backend...');
  try {
    const response = await axios.get(`${BASE_URL}/memberships/test`, { headers });
    console.log('✅ Connection successful:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Connection failed:', error.response?.data || error.message);
    console.log('💡 Make sure your backend server is running on the correct port');
    return false;
  }
}

// Main execution
async function runTests() {
  console.log('🚀 Membership System Integration Test\n');
  console.log('📝 Instructions:');
  console.log('1. Update the TEST_USER_ID, TEST_SERVICE_ID, and TEST_MEMBERSHIP_ID with real IDs');
  console.log('2. Update the TEST_TOKEN with a valid JWT token');
  console.log('3. Make sure your backend server is running');
  console.log('4. Run: node test-membership-integration.js\n');

  const connected = await testConnection();
  if (connected) {
    console.log('');
    await testMembershipEndpoints();
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testMembershipEndpoints, testConnection };