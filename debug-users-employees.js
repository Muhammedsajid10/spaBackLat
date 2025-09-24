const mongoose = require('mongoose');
// Make sure we load User model first to avoid reference issues
const User = require('./models/User');
const Employee = require('./models/Employee');

async function debugUsersAndEmployees() {
  try {
    console.log('Connecting to MongoDB...');
    // Use environment variable or fall back to localhost
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');
    
    // Find all users
    console.log('\nFinding all users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database`);
    
    // Count active and inactive users
    const activeUsers = users.filter(user => user.isActive === true);
    const inactiveUsers = users.filter(user => user.isActive === false);
    console.log(`- Active users: ${activeUsers.length}`);
    console.log(`- Inactive users: ${inactiveUsers.length}`);
    
    // Check user roles
    const clientUsers = users.filter(user => user.role === 'client');
    const employeeUsers = users.filter(user => user.role === 'employee');
    const adminUsers = users.filter(user => user.role === 'admin');
    console.log(`\nUser roles:`);
    console.log(`- Clients: ${clientUsers.length}`);
    console.log(`- Employees: ${employeeUsers.length}`);
    console.log(`- Admins: ${adminUsers.length}`);
    
    // Find all employees
    console.log('\nFinding all employees...');
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees in the database`);
    
    // Count active and inactive employees
    const activeEmployees = employees.filter(emp => emp.isActive === true);
    const inactiveEmployees = employees.filter(emp => emp.isActive === false);
    console.log(`- Active employees: ${activeEmployees.length}`);
    console.log(`- Inactive employees: ${inactiveEmployees.length}`);
    
    // Count employees with workSchedule
    const employeesWithSchedule = employees.filter(emp => {
      if (emp.workSchedule instanceof Map) {
        return emp.workSchedule.size > 0;
      } else if (emp.workSchedule && typeof emp.workSchedule === 'object') {
        return Object.keys(emp.workSchedule).length > 0;
      }
      return false;
    });
    console.log(`- Employees with work schedules: ${employeesWithSchedule.length}`);
    
    // Display details for each employee
    console.log('\n=== EMPLOYEE DETAILS ===');
    employees.forEach((emp, idx) => {
      console.log(`\n[${idx + 1}] Employee ID: ${emp._id}`);
      console.log(`  Active: ${emp.isActive === true ? 'Yes ✅' : 'No ❌'}`);
      
      // Get user info
      if (emp.user) {
        const user = users.find(u => String(u._id) === String(emp.user));
        if (user) {
          console.log(`  User: ${user.firstName} ${user.lastName} (${user.email})`);
          console.log(`  User active: ${user.isActive === true ? 'Yes ✅' : 'No ❌'}`);
        } else {
          console.log(`  User reference exists but user not found: ${emp.user}`);
        }
      } else {
        console.log(`  No user reference`);
      }
      
      // Check workSchedule
      let hasSchedule = false;
      let scheduleSize = 0;
      
      if (emp.workSchedule instanceof Map) {
        scheduleSize = emp.workSchedule.size;
        hasSchedule = scheduleSize > 0;
      } else if (emp.workSchedule && typeof emp.workSchedule === 'object') {
        scheduleSize = Object.keys(emp.workSchedule).length;
        hasSchedule = scheduleSize > 0;
      }
      
      console.log(`  Has work schedule: ${hasSchedule ? 'Yes (' + scheduleSize + ' entries)' : 'No'}`);
      
      // Check day-based schedules
      const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const daySchedules = [];
      
      if (emp.workSchedule instanceof Map) {
        dayNames.forEach(day => {
          if (emp.workSchedule.has(day)) {
            const schedule = emp.workSchedule.get(day);
            if (schedule && schedule.isWorking) {
              daySchedules.push(day);
            }
          }
        });
      } else if (emp.workSchedule && typeof emp.workSchedule === 'object') {
        dayNames.forEach(day => {
          if (emp.workSchedule[day] && emp.workSchedule[day].isWorking) {
            daySchedules.push(day);
          }
        });
      }
      
      console.log(`  Working days: ${daySchedules.length > 0 ? daySchedules.join(', ') : 'None'}`);
      
      // Employee position and department
      console.log(`  Position: ${emp.position || 'Not specified'}`);
      console.log(`  Department: ${emp.department || 'Not specified'}`);
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total users: ${users.length}`);
    console.log(`Total employees: ${employees.length}`);
    console.log(`Active employees: ${activeEmployees.length}`);
    console.log(`Employees with schedules: ${employeesWithSchedule.length}`);
    console.log(`Employee users marked active: ${employeeUsers.filter(u => u.isActive === true).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error debugging users and employees:', error);
    process.exit(1);
  }
}

debugUsersAndEmployees();