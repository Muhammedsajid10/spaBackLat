require('dotenv').config();
const mongoose = require('mongoose');
// Make sure we have all models loaded
require('./models/User');
const Employee = require('./models/Employee');
const User = require('./models/User');

// Connect to the database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testDefaultSchedule() {
  try {
    // First, create a test user if they don't exist
    let testUser = await User.findOne({ email: 'test-schedule@example.com' });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await User.create({
        firstName: 'Test',
        lastName: 'Schedule',
        email: 'test-schedule@example.com',
        password: 'password123', // In a real scenario, hash this
        phone: '+1234567890', // Adding required phone field
        role: 'client'
      });
      console.log('Test user created with ID:', testUser._id);
    }
    
    // Check if employee already exists with this user
    const existingEmployee = await Employee.findOne({ user: testUser._id });
    if (existingEmployee) {
      console.log('Employee already exists. Deleting it to test fresh creation...');
      await Employee.findByIdAndDelete(existingEmployee._id);
    }

    // Create a new employee without specifying workSchedule
    console.log('Creating new employee with default schedule...');
    const newEmployee = await Employee.create({
      user: testUser._id,
      employeeId: `TEST-${Date.now()}`,
      position: 'massage-therapist',
      department: 'spa-services',
      hireDate: new Date()
    });
    
    console.log('Employee created with ID:', newEmployee._id);
    
    // Retrieve the employee to see the schedule
    const savedEmployee = await Employee.findById(newEmployee._id);
    
    console.log('\n==== WORK SCHEDULE CHECK ====');
    console.log('Does workSchedule exist?', !!savedEmployee.workSchedule);
    console.log('workSchedule type:', savedEmployee.workSchedule ? savedEmployee.workSchedule.constructor.name : 'N/A');
    
    if (savedEmployee.workSchedule instanceof Map) {
      console.log('Schedule entries:', savedEmployee.workSchedule.size);
      
      console.log('\nSchedule details:');
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      days.forEach(day => {
        const schedule = savedEmployee.workSchedule.get(day);
        if (schedule) {
          console.log(`\n${day.toUpperCase()}:`);
          console.log(`  isWorking: ${schedule.isWorking}`);
          console.log(`  Hours: ${schedule.startTime} - ${schedule.endTime}`);
        } else {
          console.log(`\n${day.toUpperCase()}: No schedule found`);
        }
      });
    } else {
      console.log('workSchedule is not a Map:', savedEmployee.workSchedule);
    }
    
    console.log('\n==== TEST COMPLETE ====');
  } catch (error) {
    console.error('Error testing default schedule:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDefaultSchedule();