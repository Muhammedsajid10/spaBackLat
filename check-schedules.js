const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Service = require('./models/Service');

mongoose.connect('mongodb://localhost:27017/test')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Check employee work schedules
    const employees = await Employee.find({}).populate('user', 'firstName lastName');
    console.log('\n📋 Employee Work Schedules:');
    
    employees.forEach(emp => {
      console.log(`\n👤 ${emp.user.firstName} ${emp.user.lastName}:`);
      console.log('   Work Schedule:');
      Object.keys(emp.workSchedule).forEach(day => {
        const schedule = emp.workSchedule[day];
        console.log(`     ${day}: ${schedule.isWorking ? 'Working' : 'Off'} ${schedule.startTime ? `(${schedule.startTime}-${schedule.endTime})` : ''}`);
      });
    });
    
    // Test time slots for a specific employee and service
    console.log('\n🧪 Testing Time Slots:');
    const employee = employees[0]; // First employee
    const service = await Service.findById('6868b0b3f61f0c2b0481fb8c');
    const testDate = '2025-07-05'; // Saturday
    
    console.log(`\nTesting for: ${employee.user.firstName} ${employee.user.lastName}`);
    console.log(`Service: ${service.name} (${service.duration} minutes)`);
    console.log(`Date: ${testDate}`);
    
    const dayOfWeek = new Date(testDate).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const schedule = employee.workSchedule[dayName];
    
    console.log(`Day: ${dayName} (${dayOfWeek})`);
    console.log(`Schedule:`, schedule);
    
    if (schedule && schedule.isWorking) {
      console.log('✅ Employee is working on this day');
    } else {
      console.log('❌ Employee is not working on this day');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    mongoose.connection.close();
  }); 