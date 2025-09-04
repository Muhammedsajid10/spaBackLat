const mongoose = require('mongoose');

console.log('🚀 Starting Nina schedule fix...');

// Load environment variables
try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.error('❌ Error loading .env:', error.message);
}

// Connect to MongoDB using environment variable
const mongoUri = process.env.MONGODB_URI;
console.log('🔗 MongoDB URI found:', mongoUri ? 'Yes' : 'No');

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB successfully');
  
  try {
    // Get Employee model
    const Employee = require('./models/Employee');
    
    console.log('🔍 Finding Nina Kowalski...');
    
    // Find Nina by ID
    const nina = await Employee.findById('68b692867d727a2aee495fae').populate('user');
    
    if (!nina) {
      console.log('❌ Nina not found');
      return;
    }
    
    console.log('✅ Found Nina:', nina.user?.firstName, nina.user?.lastName);
    
    // Initialize workSchedule if needed
    if (!nina.workSchedule) {
      nina.workSchedule = new Map();
    }
    
    // Convert to Map if needed
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
    
    console.log('📅 Current Thursday schedule:', workSchedule.get('thursday'));
    
    // Set Nina's correct Thursday schedule (00:00 - 05:45)
    const correctSchedule = {
      isWorking: true,
      startTime: '00:00',
      endTime: '05:45',
      shifts: '00:00 - 05:45',
      shiftsData: [{
        startTime: '00:00',
        endTime: '05:45'
      }],
      shiftCount: 1
    };
    
    // Save under both day name and specific date
    workSchedule.set('thursday', correctSchedule);
    workSchedule.set('2025-09-04', correctSchedule);
    
    console.log('💾 Updating Nina\'s schedule...');
    console.log('📝 New Thursday schedule:', correctSchedule);
    
    // Save the updated schedule
    nina.workSchedule = workSchedule;
    await nina.save();
    
    console.log('✅ Successfully updated Nina\'s schedule!');
    
    // Verify the update
    const updated = await Employee.findById('68b692867d727a2aee495fae');
    console.log('🔍 Verification - Thursday schedule:', updated.workSchedule?.get('thursday'));
    console.log('🔍 Verification - 2025-09-04 schedule:', updated.workSchedule?.get('2025-09-04'));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Database connection closed');
  }
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error.message);
});
