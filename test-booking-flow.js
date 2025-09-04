// Test the fixes end-to-end
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testBookingFlow() {
  try {
    console.log('🧪 Testing booking flow with timezone and duration fixes...\n');

    // Step 1: Get employees
    console.log('1️⃣ Getting employees...');
    const employeesResponse = await axios.get(`${BASE_URL}/employees`);
    const employees = employeesResponse.data;
    console.log(`Found ${employees.length} employees`);
    
    if (employees.length === 0) {
      console.log('❌ No employees found');
      return;
    }

    // Find Nina or use first employee
    let employee = employees.find(emp => emp.name?.toLowerCase().includes('nina'));
    if (!employee) {
      employee = employees[0];
    }
    console.log(`Using employee: ${employee.name} (ID: ${employee._id})`);

    // Step 2: Get services
    console.log('\n2️⃣ Getting services...');
    const servicesResponse = await axios.get(`${BASE_URL}/services`);
    const services = servicesResponse.data;
    console.log(`Found ${services.length} services`);
    
    if (services.length === 0) {
      console.log('❌ No services found');
      return;
    }

    // Find a service with 60-minute duration
    let service = services.find(s => s.duration === 60);
    if (!service) {
      service = services[0];
    }
    console.log(`Using service: ${service.name} (Duration: ${service.duration} minutes)`);

    // Step 3: Test time slot generation
    console.log('\n3️⃣ Testing time slot generation...');
    const testDate = '2025-01-09'; // Use a date we know has schedule
    
    try {
      const timeSlotsResponse = await axios.get(`${BASE_URL}/available-times`, {
        params: {
          employeeId: employee._id,
          date: testDate,
          serviceId: service._id
        }
      });
      
      const timeSlots = timeSlotsResponse.data;
      console.log(`Generated ${timeSlots.length} time slots for ${testDate}:`);
      
      // Show first few time slots
      timeSlots.slice(0, 5).forEach((slot, index) => {
        console.log(`  ${index + 1}. ${slot.time} (${slot.formattedTime})`);
      });

      // Check if any slots start from 00:00 (the original problem)
      const earlySlots = timeSlots.filter(slot => 
        slot.time.startsWith('00:') || 
        slot.time.startsWith('01:') || 
        slot.time.startsWith('02:') || 
        slot.time.startsWith('03:') || 
        slot.time.startsWith('04:')
      );
      
      if (earlySlots.length > 0) {
        console.log(`⚠️  Found ${earlySlots.length} early morning slots (potential issue):`);
        earlySlots.forEach(slot => console.log(`    ${slot.time}`));
      } else {
        console.log('✅ No early morning slots found - time slot generation looks good!');
      }

    } catch (error) {
      console.log('❌ Error getting time slots:', error.response?.data || error.message);
    }

    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBookingFlow();
