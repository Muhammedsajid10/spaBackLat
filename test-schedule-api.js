const fetch = require('node-fetch');

const testScheduleAPI = async () => {
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

    // Test schedule endpoint
    console.log('\n📅 Testing schedule endpoint...');
    const scheduleResponse = await fetch('http://localhost:3000/api/v1/employees/my-schedule', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const scheduleData = await scheduleResponse.json();
    console.log('Schedule response:', { 
      status: scheduleResponse.status, 
      success: scheduleData.success,
      results: scheduleData.results
    });

    if (scheduleData.success) {
      console.log('✅ Schedule API successful');
      console.log('\n📊 Schedule data structure:');
      console.log('- Employee info:', scheduleData.data?.employee);
      console.log('- Upcoming appointments count:', scheduleData.data?.upcomingAppointments?.length || 0);
      
      if (scheduleData.data?.upcomingAppointments?.length > 0) {
        console.log('\n📋 First appointment:');
        const firstAppt = scheduleData.data.upcomingAppointments[0];
        console.log('- ID:', firstAppt._id);
        console.log('- Booking Number:', firstAppt.bookingNumber);
        console.log('- Date:', firstAppt.appointmentDate);
        console.log('- Status:', firstAppt.status);
        console.log('- Client:', `${firstAppt.client?.firstName} ${firstAppt.client?.lastName}`);
        console.log('- Service:', firstAppt.services?.[0]?.service?.name);
        console.log('- Duration:', firstAppt.services?.[0]?.service?.duration, 'mins');
        console.log('- Start Time:', firstAppt.services?.[0]?.startTime);
        console.log('- Total Amount:', firstAppt.totalAmount);
      } else {
        console.log('📅 No upcoming appointments found');
      }
    } else {
      console.log('❌ Schedule API failed:', scheduleData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
console.log('🧪 Testing Schedule API Integration...\n');
testScheduleAPI();
