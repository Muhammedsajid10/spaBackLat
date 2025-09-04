// Test script to check specific employee with Friday 00:00-23:59 shift
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testSpecificEmployeeSchedule() {
  try {
    console.log('🧪 Testing employee with Friday 00:00-23:59 shift...\n');

    // Step 1: Get all employees
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Backend health:', healthResponse.data.message);

    // Step 2: Test the public booking schedule API
    console.log('\n2️⃣ Testing available employees without auth...');
    
    try {
      // Test the debug endpoint first
      const debugResponse = await axios.get(`${BASE_URL}/booking-schedule/debug/employees`);
      const employees = debugResponse.data.employees;
      
      console.log(`Found ${employees.length} employees:`);
      employees.forEach(emp => {
        console.log(`  - ${emp.name} (ID: ${emp._id}) - Has schedule: ${emp.hasWorkSchedule}`);
        if (emp.workScheduleKeys?.length > 0) {
          console.log(`    Schedule keys: ${emp.workScheduleKeys.join(', ')}`);
        }
      });

      // Find an employee to test with
      if (employees.length === 0) {
        console.log('❌ No employees found');
        return;
      }

      const testEmployee = employees[0];
      console.log(`\n3️⃣ Testing schedule for: ${testEmployee.name}`);

      // Test specific dates
      const testDates = [
        '2025-01-10', // Friday - the day you mentioned
        '2025-01-09', // Thursday
        '2025-01-11', // Saturday
      ];

      for (const testDate of testDates) {
        console.log(`\n📅 Testing ${testDate} (${new Date(testDate).toLocaleDateString('en', { weekday: 'long' })}):`);
        
        try {
          const scheduleResponse = await axios.get(`${BASE_URL}/booking-schedule/employee-schedule`, {
            params: {
              employeeId: testEmployee._id,
              date: testDate
            }
          });
          
          const data = scheduleResponse.data.data;
          console.log(`  📋 Scheduled shifts:`, data.scheduledShifts);
          console.log(`  🕒 Available slots: ${data.availableSlots} / ${data.totalSlots}`);
          
          if (data.availableTimeSlots?.length > 0) {
            const firstSlots = data.availableTimeSlots.slice(0, 5);
            const lastSlots = data.availableTimeSlots.slice(-3);
            console.log(`  ⏰ First slots: ${firstSlots.map(s => s.time).join(', ')}`);
            console.log(`  ⏰ Last slots: ${lastSlots.map(s => s.time).join(', ')}`);
          }
          
        } catch (apiError) {
          console.log(`  ❌ API Error:`, apiError.response?.data?.error || apiError.message);
        }
      }

    } catch (debugError) {
      console.log('❌ Debug endpoint failed:', debugError.response?.data || debugError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSpecificEmployeeSchedule();
