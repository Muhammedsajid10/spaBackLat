const mongoose = require('mongoose');
require('dotenv').config();

// Import required models
const Employee = require('./models/Employee');
const User = require('./models/User');

console.log('🚀 Starting Nina schedule fix script...');
console.log('📁 Current directory:', process.cwd());
console.log('🔗 MongoDB URI:', process.env.MONGODB_URI ? 'Found in env' : 'Using fallback');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sajidalhijas:zUsF7GJ7Sy7vjy1s@cluster0.govwh3h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

async function fixNinaSchedule() {
  try {
    console.log('🔍 Finding Nina Kowalski...');
    
    // Find Nina Kowalski
    const nina = await Employee.findById('68b692867d727a2aee495fae').populate('user');
    
    if (!nina) {
      console.log('❌ Nina not found');
      return;
    }
    
    console.log('✅ Found Nina:', nina.user?.firstName, nina.user?.lastName);
    console.log('📅 Current workSchedule:', JSON.stringify(nina.workSchedule, null, 2));
    
    // Update Nina's Thursday schedule to match admin panel
    if (!nina.workSchedule) {
      nina.workSchedule = new Map();
    }
    
    // Convert to Map if it's not already
    let workSchedule;
    if (nina.workSchedule instanceof Map) {
      workSchedule = nina.workSchedule;
    } else {
      workSchedule = new Map();
      if (typeof nina.workSchedule === 'object') {
        Object.entries(nina.workSchedule).forEach(([key, value]) => {
          workSchedule.set(key, value);
        });
      }
    }
    
    // Set Thursday's schedule to match the admin panel (00:00 - 05:45)
    workSchedule.set('thursday', {
      isWorking: true,
      startTime: '00:00',
      endTime: '05:45',
      shifts: '00:00 - 05:45',
      shiftsData: [{
        startTime: '00:00',
        endTime: '05:45'
      }],
      shiftCount: 1
    });
    
    // Also set for the specific date (September 4, 2025)
    workSchedule.set('2025-09-04', {
      isWorking: true,
      startTime: '00:00',
      endTime: '05:45',
      shifts: '00:00 - 05:45',
      shiftsData: [{
        startTime: '00:00',
        endTime: '05:45'
      }],
      shiftCount: 1
    });
    
    nina.workSchedule = workSchedule;
    
    console.log('💾 Saving updated schedule...');
    await nina.save();
    
    console.log('✅ Successfully updated Nina\'s schedule!');
    console.log('📅 New workSchedule:', JSON.stringify(nina.workSchedule, null, 2));
    
    // Verify by re-fetching
    const verifyNina = await Employee.findById('68b692867d727a2aee495fae');
    console.log('🔍 Verification - Thursday schedule:', verifyNina.workSchedule.get('thursday'));
    console.log('🔍 Verification - 2025-09-04 schedule:', verifyNina.workSchedule.get('2025-09-04'));
    
  } catch (error) {
    console.error('❌ Error fixing Nina\'s schedule:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixNinaSchedule();
