const fetch = require('node-fetch');

const testCompleteMarkAbsentFlow = async () => {
  try {
    console.log('🧪 Testing complete mark absent flow...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
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
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    console.log('✅ Login successful\n');

    const token = loginData.token;

    // Step 2: Check initial attendance (should be empty)
    console.log('2️⃣ Checking initial attendance...');
    let attendanceResponse = await fetch('http://localhost:3000/api/v1/employees/my-attendance', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let attendanceData = await attendanceResponse.json();
    
    console.log(`📊 Initial attendance records: ${attendanceData.data?.attendance?.length || 0}`);
    if (attendanceData.data?.attendance?.length > 0) {
      console.log('⚠️ Found existing records, showing first one:');
      const record = attendanceData.data.attendance[0];
      console.log(`   Status: ${record.status}, Reason: ${record.absentReason || 'N/A'}`);
    }
    console.log('');

    // Step 3: Mark as absent
    console.log('3️⃣ Marking as absent...');
    const markAbsentResponse = await fetch('http://localhost:3000/api/v1/employees/mark-absent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reason: 'Testing mark absent functionality',
        leaveType: 'personal'
      })
    });

    const markAbsentData = await markAbsentResponse.json();
    if (markAbsentData.success) {
      console.log('✅ Mark absent successful');
      console.log(`   Reason: ${markAbsentData.data.reason}`);
      console.log(`   Leave Type: ${markAbsentData.data.leaveType}`);
    } else {
      console.log('❌ Mark absent failed:', markAbsentData.message);
      return;
    }
    console.log('');

    // Step 4: Verify attendance record was created
    console.log('4️⃣ Verifying attendance record was created...');
    attendanceResponse = await fetch('http://localhost:3000/api/v1/employees/my-attendance', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    attendanceData = await attendanceResponse.json();
    
    if (attendanceData.success && attendanceData.data?.attendance?.length > 0) {
      const todayRecord = attendanceData.data.attendance.find(record => 
        record.date.startsWith(new Date().toISOString().split('T')[0])
      );
      
      if (todayRecord && todayRecord.status === 'absent') {
        console.log('✅ Absence record found in database');
        console.log(`   Date: ${todayRecord.date.split('T')[0]}`);
        console.log(`   Status: ${todayRecord.status}`);
        console.log(`   Reason: ${todayRecord.absentReason || 'N/A'}`);
        console.log(`   Leave Type: ${todayRecord.leaveType || 'N/A'}`);
        console.log('\n🎉 MARK ABSENT FLOW WORKING CORRECTLY!');
        console.log('✅ Data is persisting to database');
        console.log('✅ Data is being retrieved correctly');
      } else {
        console.log('❌ No absent record found for today');
      }
    } else {
      console.log('❌ Failed to retrieve attendance records');
    }

    // Step 5: Test prevention of double absence
    console.log('\n5️⃣ Testing prevention of duplicate absence...');
    const duplicateResponse = await fetch('http://localhost:3000/api/v1/employees/mark-absent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reason: 'Trying to mark absent again',
        leaveType: 'sick'
      })
    });

    const duplicateData = await duplicateResponse.json();
    if (duplicateData.success) {
      console.log('✅ Duplicate absence updated existing record');
    } else {
      console.log('ℹ️ Duplicate prevention (if implemented):', duplicateData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testCompleteMarkAbsentFlow();
