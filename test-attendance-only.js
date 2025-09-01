const fetch = require('node-fetch');

const testAttendanceOnly = async () => {
  try {
    // Use a previously obtained token - let me get one by login first
    console.log('🔐 Getting new login...');
    
    // Wait a bit for rate limit
    await new Promise(resolve => setTimeout(resolve, 5000));
    
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

    if (loginResponse.status === 429) {
      console.log('⏳ Rate limited, waiting 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      return testAttendanceOnly(); // Retry
    }

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // Check attendance to verify transformation
    console.log('\n📊 Fetching attendance...');
    const attendanceResponse = await fetch('http://localhost:3000/api/v1/employees/my-attendance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const attendanceData = await attendanceResponse.json();
    console.log('Attendance API response:');
    console.log('Status:', attendanceResponse.status);
    console.log('Success:', attendanceData.success);
    
    if (attendanceData.success && attendanceData.data?.attendance) {
      console.log('\n📋 Attendance records:');
      attendanceData.data.attendance.forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Date: ${record.date}`);
        console.log(`  Status: ${record.status}`);
        console.log(`  Absent Reason: ${record.absentReason || 'N/A'}`);
        console.log(`  Leave Type: ${record.leaveType || 'N/A'}`);
        console.log(`  Check In: ${record.checkIn || 'N/A'}`);
        console.log(`  Check Out: ${record.checkOut || 'N/A'}`);
        console.log('  ---');
      });
    } else {
      console.log('❌ No attendance data found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAttendanceOnly();
