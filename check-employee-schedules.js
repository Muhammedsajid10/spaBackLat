const mongoose = require('mongoose');
const Employee = require('./models/Employee');

mongoose.connect('mongodb://localhost:27017/spa-management')
  .then(() => {
    console.log('Connected to MongoDB');
    return Employee.find({ isActive: true }).select('user workSchedule').populate('user', 'firstName lastName');
  })
  .then(employees => {
    console.log('=== EMPLOYEE SCHEDULE ANALYSIS ===');
    console.log(`Found ${employees.length} active employees\n`);
    
    employees.forEach(emp => {
      console.log(`Employee: ${emp.user?.firstName} ${emp.user?.lastName}`);
      if (emp.workSchedule) {
        Object.keys(emp.workSchedule).forEach(day => {
          const schedule = emp.workSchedule[day];
          if (schedule.isWorking) {
            const duration = schedule.startTime + '-' + schedule.endTime;
            const hasShifts = schedule.shifts ? `has shifts: ${schedule.shifts}` : 'no shifts';
            console.log(`  ${day}: ${duration} (${hasShifts})`);
          } else {
            console.log(`  ${day}: OFF`);
          }
        });
      } else {
        console.log('  No workSchedule found');
      }
      console.log(''); // Empty line between employees
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
