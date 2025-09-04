const mongoose = require('mongoose');
require('dotenv').config();

// Import required models
const Employee = require('./models/Employee');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return verifyNinaSchedule();
  })
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

async function verifyNinaSchedule() {
  try {
    const nina = await Employee.findById('68b692867d727a2aee495fae').lean();
    
    console.log('\n🔍 Nina\'s complete workSchedule:');
    console.log(JSON.stringify(nina.workSchedule, null, 2));
    
    // Check specific dates
    console.log('\n📅 Key dates:');
    console.log('2025-09-04:', nina.workSchedule['2025-09-04']);
    console.log('2025-01-09:', nina.workSchedule['2025-01-09']);
    console.log('2025-01-10:', nina.workSchedule['2025-01-10']);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
