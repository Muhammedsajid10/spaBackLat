const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://muhammedsajid10:sajidaliazad786@cluster0.qk2ni.mongodb.net/spa', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkEmployees = async () => {
  try {
    console.log('🔍 Checking employees in database...\n');

    // Get total count
    const totalEmployees = await Employee.countDocuments();
    console.log(`📊 Total employees in database: ${totalEmployees}`);

    // Get active employees
    const activeEmployees = await Employee.countDocuments({ isActive: true });
    console.log(`✅ Active employees: ${activeEmployees}`);

    // Get inactive employees  
    const inactiveEmployees = await Employee.countDocuments({ isActive: false });
    console.log(`❌ Inactive employees: ${inactiveEmployees}\n`);

    if (totalEmployees === 0) {
      console.log('⚠️  No employees found! Running seed script might be needed.\n');
      process.exit(0);
    }

    // Get first few employees to check structure
    const employees = await Employee.find({})
      .populate('user', 'firstName lastName email')
      .limit(3);

    console.log('📋 Sample employee data:\n');
    employees.forEach((emp, index) => {
      console.log(`Employee ${index + 1}:`);
      console.log(`  - ID: ${emp._id}`);
      console.log(`  - Employee ID: ${emp.employeeId}`);
      console.log(`  - Name: ${emp.user ? emp.user.firstName + ' ' + emp.user.lastName : 'No user linked'}`);
      console.log(`  - Position: ${emp.position}`);
      console.log(`  - isActive: ${emp.isActive}`);
      console.log(`  - workSchedule type: ${typeof emp.workSchedule}`);
      console.log(`  - workSchedule keys: ${emp.workSchedule ? Object.keys(emp.workSchedule) : 'None'}`);
      
      if (emp.workSchedule) {
        if (emp.workSchedule instanceof Map) {
          console.log(`  - workSchedule Map size: ${emp.workSchedule.size}`);
          console.log(`  - Monday schedule: ${JSON.stringify(emp.workSchedule.get('monday'))}`);
        } else {
          console.log(`  - Monday schedule: ${JSON.stringify(emp.workSchedule.monday)}`);
        }
      }
      
      if (emp.legacyWorkSchedule) {
        console.log(`  - legacyWorkSchedule: ${JSON.stringify(emp.legacyWorkSchedule.monday)}`);
      }
      
      console.log(`  - specializations: [${emp.specializations?.join(', ') || 'None'}]`);
      console.log('');
    });

    // Test specific date availability
    console.log('🗓️  Testing Tuesday (day 2) availability:\n');
    const tuesdayEmployees = employees.filter(emp => {
      let schedule;
      if (emp.workSchedule instanceof Map) {
        schedule = emp.workSchedule.get('tuesday');
      } else if (emp.workSchedule && typeof emp.workSchedule === 'object') {
        schedule = emp.workSchedule.tuesday;
      } else if (emp.legacyWorkSchedule) {
        schedule = emp.legacyWorkSchedule.tuesday;
      }
      
      return schedule && schedule.isWorking;
    });

    console.log(`✅ Employees available on Tuesday: ${tuesdayEmployees.length}`);
    tuesdayEmployees.forEach(emp => {
      console.log(`  - ${emp.user?.firstName} ${emp.user?.lastName} (${emp.position})`);
    });

  } catch (error) {
    console.error('❌ Error checking employees:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

checkEmployees();
