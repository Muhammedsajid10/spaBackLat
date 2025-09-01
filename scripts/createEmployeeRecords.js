const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
require('dotenv').config();

const createEmployeeRecords = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all users with employee role who don't have Employee records
    const employeeUsers = await User.find({ role: 'employee' });
    console.log(`Found ${employeeUsers.length} employee users`);

    for (let i = 0; i < employeeUsers.length; i++) {
      const user = employeeUsers[i];

      // Check if employee record already exists
      const existingEmployee = await Employee.findOne({ user: user._id });
      if (existingEmployee) {
        console.log(`Employee record already exists for ${user.firstName} ${user.lastName}`);
        continue;
      }

      // Create employee record
      const employeeData = {
        user: user._id,
        employeeId: `EMP${String(1001 + i).padStart(4, '0')}`,
        position: 'massage-therapist',
        department: 'spa-services',
        hireDate: user.createdAt || new Date(),
        salary: 3000,
        commissionRate: 10,
        workSchedule: {
          monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          saturday: { isWorking: false },
          sunday: { isWorking: false }
        },
        specializations: ['swedish-massage', 'deep-tissue-massage'],
        skills: [
          { name: 'Customer Service', level: 'advanced', yearsOfExperience: 3 },
          { name: 'Massage Therapy', level: 'advanced', yearsOfExperience: 5 }
        ],
        languages: [
          { language: 'English', proficiency: 'fluent' },
          { language: 'Arabic', proficiency: 'intermediate' }
        ],
        isActive: true,
        performance: {
          rating: 4.5,
          totalClients: 0,
          totalRevenue: 0,
          averageServiceRating: 4.5
        }
      };

      try {
        const employee = new Employee(employeeData);
        await employee.save();
        console.log(`✅ Created employee record for ${user.firstName} ${user.lastName} (ID: ${employeeData.employeeId})`);
      } catch (error) {
        console.error(`❌ Failed to create employee record for ${user.firstName} ${user.lastName}:`, error.message);
      }
    }

    console.log('✅ Employee record creation completed');
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
};

createEmployeeRecords();
