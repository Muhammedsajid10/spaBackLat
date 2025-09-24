require('dotenv').config();
const mongoose = require('mongoose');
// Make sure we have all models loaded
require('./models/User');
const Employee = require('./models/Employee');

async function listAllEmployees() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees in the database:`);
    
    employees.forEach((emp, index) => {
      console.log(`[${index + 1}] ${emp.firstName} ${emp.lastName} (ID: ${emp._id})`);
      console.log(`  - Email: ${emp.email}`);
      console.log(`  - Active: ${emp.isActive}`);
      console.log(`  - Has workSchedule: ${
        !emp.workSchedule ? 'undefined' :
        emp.workSchedule instanceof Map ? 'Map' : 
        (typeof emp.workSchedule === 'object' && Object.keys(emp.workSchedule).length === 0) ? 
        'Empty Object {}' : typeof emp.workSchedule
      } with ${
        !emp.workSchedule ? 0 :
        emp.workSchedule instanceof Map ? emp.workSchedule.size : 
        (typeof emp.workSchedule === 'object' ? Object.keys(emp.workSchedule).length : 0)
      } entries`);
      
      if (emp.workSchedule instanceof Map && emp.workSchedule.size > 0) {
        console.log('  - Schedule entries:');
        for (const [day, hours] of emp.workSchedule.entries()) {
          console.log(`    * ${day}: ${JSON.stringify(hours)}`);
        }
      }
      console.log('-----------------------------------');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

listAllEmployees();