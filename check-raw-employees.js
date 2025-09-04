// Simple raw MongoDB check
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const employees = await db.collection('employees').find({}).toArray();
    
    console.log(`Found ${employees.length} employees\n`);
    
    employees.forEach((emp, index) => {
      const name = emp.name || (emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : 'Unknown');
      console.log(`${index + 1}. ${name} (ID: ${emp._id})`);
      
      if (emp.workSchedule) {
        // Look for Friday schedule
        const friday = emp.workSchedule.friday || emp.workSchedule['2025-01-10'];
        if (friday) {
          console.log('  📅 Friday schedule:', JSON.stringify(friday, null, 2));
          
          if (friday.startTime === '09:00' && friday.endTime === '17:00') {
            console.log('  ⚠️  This has default business hours 09:00-17:00');
          } else if (friday.startTime === '00:00' && friday.endTime === '23:59') {
            console.log('  ✅ This has 24/7 hours 00:00-23:59');
          }
        } else {
          console.log('  ❌ No Friday schedule');
        }
        
        // Also check for specific date overrides
        const specificDate = emp.workSchedule['2025-01-10'];
        if (specificDate) {
          console.log('  📅 2025-01-10 specific schedule:', JSON.stringify(specificDate, null, 2));
        }
      }
      console.log('');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
