const mongoose = require('mongoose');
require('dotenv').config();

// Import required models
const Employee = require('./models/Employee');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return fixNinaScheduleSimple();
  })
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

async function fixNinaScheduleSimple() {
  try {
    // Direct update using updateOne
    const result = await Employee.updateOne(
      { _id: '68b692867d727a2aee495fae' },
      {
        $set: {
          'workSchedule.2025-09-04': {
            isWorking: true,
            startTime: '09:00',
            endTime: '17:00',
            shifts: '09:00 - 17:00',
            shiftsData: [{
              startTime: '09:00',
              endTime: '17:00'
            }],
            shiftCount: 1
          }
        }
      }
    );

    console.log('Update result:', result);

    // Verify the update
    const nina = await Employee.findById('68b692867d727a2aee495fae');
    console.log('Nina\'s 2025-09-04 schedule:', nina.workSchedule['2025-09-04']);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
