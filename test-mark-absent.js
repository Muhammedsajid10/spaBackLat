const fetch = require('node-fetch');

const testMarkAbsent = async () => {
  try {
    // First, login to get a token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'sarah.johnson@spa.com',
        password: 'Employee@123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', { status: loginResponse.status, success: loginData.success });
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // Test mark absent endpoint
    console.log('\n📅 Testing mark absent...');
    const markAbsentResponse = await fetch('http://localhost:3000/api/v1/employees/mark-absent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reason: 'Feeling unwell',
        leaveType: 'sick'
      })
    });

    const markAbsentData = await markAbsentResponse.json();
    console.log('Mark absent response:', { 
      status: markAbsentResponse.status, 
      success: markAbsentData.success,
      message: markAbsentData.message,
      data: markAbsentData.data
    });

    if (markAbsentData.success) {
      console.log('✅ Mark absent successful');
      
      // Check attendance to verify it was recorded
      console.log('\n📊 Fetching attendance to verify...');
      const attendanceResponse = await fetch('http://localhost:3000/api/v1/employees/my-attendance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const attendanceData = await attendanceResponse.json();
      console.log('Today\'s attendance records:');
      if (attendanceData.success && attendanceData.data?.attendance) {
        attendanceData.data.attendance.forEach(record => {
          console.log(`- Date: ${record.date}, Status: ${record.status}, Reason: ${record.absentReason}, Leave Type: ${record.leaveType || 'N/A'}`);
        });
      } else {
        console.log('No attendance data found or API error');
      }
    } else {
      console.log('❌ Mark absent failed:', markAbsentData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testMarkAbsent();
