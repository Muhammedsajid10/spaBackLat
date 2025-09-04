// Check employee's actual database schedule
const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('./models/Employee');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return checkEmployeeSchedules();
  })
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

async function checkEmployeeSchedules() {
  try {
    const employees = await Employee.find({}).lean();
    console.log(`Found ${employees.length} employees\n`);
    
    employees.forEach((emp, index) => {
      const name = emp.name || (emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : 'Unknown');
      console.log(`${index + 1}. ${name} (ID: ${emp._id})`);
      
      if (emp.workSchedule) {
        // Check if it's a Map or Object
        let schedule = emp.workSchedule;
        
        // Look for Friday in various formats
        const fridayKeys = ['friday', 'Friday', '2025-01-10', '5']; // Friday is day 5
        let fridaySchedule = null;
        
        fridayKeys.forEach(key => {
          if (schedule[key]) {
            fridaySchedule = schedule[key];
            console.log(`  Friday schedule (${key}):`, JSON.stringify(fridaySchedule, null, 2));
          }
        });
        
        if (!fridaySchedule) {
          console.log('  ❌ No Friday schedule found');
        }
      } else {
        console.log('  ❌ No workSchedule found');
      }
      console.log(''); // Empty line
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}
