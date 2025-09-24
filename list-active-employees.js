const mongoose = require('mongoose');
// Load both models explicitly to avoid reference issues
const User = require('./models/User');
const Employee = require('./models/Employee');

async function listActiveEmployees() {
  try {
    console.log('Connecting to MongoDB...');
    // Use environment variable or fall back to localhost
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');
    
    // Find all active employees
    console.log('\nFinding all active employees...');
    const employees = await Employee.find({ isActive: true })
      .populate('user', 'firstName lastName email isActive');
    
    console.log(`Found ${employees.length} active employees`);
    
    // Display detailed information for each employee
    employees.forEach((emp, idx) => {
      console.log(`\n[${idx + 1}] ${emp.user?.firstName || 'Unknown'} ${emp.user?.lastName || 'User'}`);
      console.log(`  ID: ${emp._id}`);
      console.log(`  Position: ${emp.position}`);
      console.log(`  Department: ${emp.department}`);
      console.log(`  User active: ${emp.user?.isActive !== false ? 'Yes ✅' : 'No ❌'}`);
      
      // Check workSchedule
      if (emp.workSchedule instanceof Map) {
        console.log(`  workSchedule: Map with ${emp.workSchedule.size} entries`);
        const scheduleEntries = Array.from(emp.workSchedule.entries());
        
        // Get a sample of the entries (first 3)
        const sampleEntries = scheduleEntries.slice(0, 3);
        if (sampleEntries.length > 0) {
          console.log('  Sample schedule entries:');
          sampleEntries.forEach(([key, value]) => {
            console.log(`   - ${key}: isWorking=${value.isWorking}, hours=${value.startTime}-${value.endTime}`);
          });
        }
        
        // Check if day-based schedules exist
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayEntries = dayNames.filter(day => emp.workSchedule.has(day));
        console.log(`  Has day-based schedules: ${dayEntries.length > 0 ? 'Yes (' + dayEntries.join(', ') + ')' : 'No'}`);
      } else if (emp.workSchedule && typeof emp.workSchedule === 'object') {
        console.log(`  workSchedule: Plain object with ${Object.keys(emp.workSchedule).length} entries`);
        
        // Get a sample of the entries (first 3)
        const keys = Object.keys(emp.workSchedule);
        const sampleKeys = keys.slice(0, 3);
        if (sampleKeys.length > 0) {
          console.log('  Sample schedule entries:');
          sampleKeys.forEach(key => {
            const value = emp.workSchedule[key];
            console.log(`   - ${key}: isWorking=${value.isWorking}, hours=${value.startTime}-${value.endTime}`);
          });
        }
        
        // Check if day-based schedules exist
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayEntries = dayNames.filter(day => emp.workSchedule[day]);
        console.log(`  Has day-based schedules: ${dayEntries.length > 0 ? 'Yes (' + dayEntries.join(', ') + ')' : 'No'}`);
      } else {
        console.log('  workSchedule: None or invalid format');
      }
      
      // Check if employee has a user reference
      if (!emp.user) {
        console.log('  WARNING: Employee has no user reference ❌');
      }
      
      // Check for the today's day of week schedule
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = dayNames[dayOfWeek];
      
      console.log(`  Today (${today.toISOString().split('T')[0]}) is ${dayName}`);
      let hasScheduleForToday = false;
      
      if (emp.workSchedule instanceof Map) {
        hasScheduleForToday = emp.workSchedule.has(dayName);
        if (hasScheduleForToday) {
          const schedule = emp.workSchedule.get(dayName);
          console.log(`  Schedule for today: isWorking=${schedule.isWorking}, hours=${schedule.startTime}-${schedule.endTime}`);
        }
      } else if (emp.workSchedule && typeof emp.workSchedule === 'object') {
        hasScheduleForToday = !!emp.workSchedule[dayName];
        if (hasScheduleForToday) {
          const schedule = emp.workSchedule[dayName];
          console.log(`  Schedule for today: isWorking=${schedule.isWorking}, hours=${schedule.startTime}-${schedule.endTime}`);
        }
      }
      
      if (!hasScheduleForToday) {
        console.log('  No schedule defined for today ❌');
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing active employees:', error);
    process.exit(1);
  }
}

listActiveEmployees();