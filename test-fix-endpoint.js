const axios = require('axios');

async function testFixPendingStatus() {
  try {
    console.log('🔄 Testing login and fix endpoint...');
    
    // First login to get admin token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@spa.com',
      password: 'Admin@123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful, token received');
      console.log('👤 User:', loginResponse.data.data.user.fullName, '(' + loginResponse.data.data.user.role + ')');
      
      // Test the fix pending status endpoint
      console.log('🔄 Testing fix pending status endpoint...');
      const fixResponse = await axios.post(
        'http://localhost:3000/api/v1/payments/admin/fix-pending-status',
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Fix endpoint works!');
      console.log('📊 Response:', fixResponse.data);
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ Error status:', error.response.status);
      console.log('❌ Error data:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testFixPendingStatus();