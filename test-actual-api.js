// Test the actual API endpoint being used by frontend
const axios = require('axios');

async function testEmployeeScheduleAPI() {
  try {
    console.log('🧪 Testing /bookings/schedule/employee-schedule endpoint...\n');

    // You need to replace this with the actual employee ID you're testing
    // You can get this from the browser console or from the employee list
    const employeeId = '68b692867d727a2aee495fae'; // Replace with actual ID
    const date = '2025-01-10'; // Friday
    
    const url = `http://localhost:5000/api/v1/bookings/schedule/employee-schedule?employeeId=${employeeId}&date=${date}`;
    console.log('📞 Calling:', url);
    
    const response = await axios.get(url);
    const data = response.data.data;
    
    console.log('📋 Schedule Response:');
    console.log('  Employee ID:', data.employeeId);
    console.log('  Date:', data.date);
    console.log('  Day of Week:', data.dayOfWeek);
    console.log('  Scheduled Shifts:', JSON.stringify(data.scheduledShifts, null, 2));
    console.log('  Total Slots:', data.totalSlots);
    console.log('  Available Slots:', data.availableSlots);
    
    if (data.availableTimeSlots?.length > 0) {
      console.log('\n⏰ Time Slots:');
      console.log('  First 5 slots:', data.availableTimeSlots.slice(0, 5).map(s => s.time));
      console.log('  Last 5 slots:', data.availableTimeSlots.slice(-5).map(s => s.time));
      
      // Check if it starts from 00:00 or 09:00
      const firstSlot = data.availableTimeSlots[0];
      const lastSlot = data.availableTimeSlots[data.availableTimeSlots.length - 1];
      console.log('\n🔍 Analysis:');
      console.log('  First slot time:', firstSlot.time);
      console.log('  Last slot time:', lastSlot.time);
      
      if (firstSlot.time.startsWith('09:')) {
        console.log('❌ ISSUE: Time slots start from 09:xx instead of 00:00');
      } else if (firstSlot.time.startsWith('00:')) {
        console.log('✅ GOOD: Time slots start from 00:00 as expected');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testEmployeeScheduleAPI();
