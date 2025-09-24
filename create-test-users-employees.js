const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

async function createTestUsersAndEmployees() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');
    
    // Create some test users
    const users = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'employee',
        isActive: true
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: 'password123',
        phone: '2345678901',
        role: 'employee',
        isActive: true
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '3456789012',
        role: 'admin',
        isActive: true
      },
      {
        firstName: 'Client',
        lastName: 'User',
        email: 'client@example.com',
        password: 'client123',
        phone: '4567890123',
        role: 'client',
        isActive: true
      }
    ];
    
    // Check if any users already exist
    const existingUsers = await User.find();
    if (existingUsers.length > 0) {
      console.log(`Found ${existingUsers.length} existing users. Skipping user creation.`);
    } else {
      console.log('Creating test users...');
      
      const createdUsers = [];
      for (const userData of users) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`Created user: ${user.firstName} ${user.lastName} (${user.email})`);
      }
      
      // Create employees for employee users
      console.log('\nCreating test employees...');
      for (const user of createdUsers) {
        if (user.role === 'employee') {
          const employee = new Employee({
            user: user._id,
            employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
            position: 'massage-therapist',
            department: 'spa-services',
            hireDate: new Date(),
            isActive: true
          });
          
          // Employee is saved with default 24-hour schedule thanks to pre-save hook
          await employee.save();
          console.log(`Created employee for: ${user.firstName} ${user.lastName} (${employee.employeeId})`);
        }
      }
    }
    
    // Check if employees exist and add workSchedule if needed
    const employees = await Employee.find().populate('user');
    console.log(`\nFound ${employees.length} employees`);
    
    if (employees.length > 0) {
      // Ensure all employees have proper workSchedule
      console.log('Updating employee schedules...');
      for (const emp of employees) {
        if (!emp.workSchedule || (emp.workSchedule instanceof Map && emp.workSchedule.size === 0)) {
          console.log(`Adding default schedule for employee: ${emp.user?.firstName} ${emp.user?.lastName}`);
          
          const defaultWorkSchedule = new Map();
          const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          
          // Create default 24-hour schedule for each day
          daysOfWeek.forEach(day => {
            defaultWorkSchedule.set(day, {
              isWorking: true,
              startTime: '00:00',
              endTime: '23:59',
              shifts: null,
              shiftsData: [],
              shiftCount: 0
            });
          });
          
          emp.workSchedule = defaultWorkSchedule;
          await emp.save();
          console.log(`Updated schedule for: ${emp.user?.firstName} ${emp.user?.lastName}`);
        } else {
          console.log(`Employee ${emp.user?.firstName} ${emp.user?.lastName} already has a schedule`);
        }
      }
    }
    
    console.log('\nSetup complete!');
    console.log(`Users created: ${await User.countDocuments()}`);
    console.log(`Employees created: ${await Employee.countDocuments()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestUsersAndEmployees();