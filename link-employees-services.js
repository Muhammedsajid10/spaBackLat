const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Service = require('./models/Service');

async function linkEmployeesAndServices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');
    
    // Get all employees
    const employees = await Employee.find({ isActive: true }).populate('user');
    console.log(`Found ${employees.length} active employees`);
    
    // Get all services
    const services = await Service.find({ isActive: true });
    console.log(`Found ${services.length} active services`);
    
    if (employees.length === 0 || services.length === 0) {
      console.log('No employees or services found. Cannot continue.');
      process.exit(1);
    }
    
    // Define specializations for employees based on position
    const specializations = {
      'massage-therapist': ['deep-tissue-massage', 'swedish-massage', 'hot-stone-massage', 'aromatherapy'],
      'esthetician': ['facial-treatments', 'anti-aging-treatments', 'acne-treatments', 'hair-removal', 'body-wraps'],
      'nail-technician': ['manicure', 'pedicure', 'gel-nails'],
      'wellness-coach': ['wellness-coaching']
    };
    
    // Update employees with specializations based on their position
    for (const employee of employees) {
      const position = employee.position;
      if (position && specializations[position]) {
        // Assign all specializations for the position
        employee.specializations = specializations[position];
        console.log(`Assigning specializations to ${employee.user?.firstName} ${employee.user?.lastName}: ${employee.specializations.join(', ')}`);
        await employee.save();
      }
    }
    
    // Check if the Employee schema has a services field
    const employeeSchema = Employee.schema;
    const hasServicesField = employeeSchema.path('services');
    
    console.log(`\nEmployee schema has services field: ${hasServicesField ? 'Yes' : 'No'}`);
    
    // If there's no services field, we'll handle the relationship differently
    // We'll use a simple list to track which employees can perform which services
    console.log('\nEmployees and their specializations:');
    for (const employee of employees) {
      console.log(`${employee.user?.firstName} ${employee.user?.lastName}: ${employee.specializations?.join(', ') || 'None'}`);
    }
    
    // Now for debugging purposes, let's check the requirements for each service
    console.log('\nServices and required specializations:');
    for (const service of services) {
      console.log(`${service.name}: ${service.requiredSpecializations?.join(', ') || 'No specific requirements'}`);
    }
    
    console.log('\nEmployee-Service linking complete!');
    
    // Show the final result
    const updatedEmployees = await Employee.find({ isActive: true })
      .populate('user');
    
    console.log('\nFinal employee details:');
    for (const employee of updatedEmployees) {
      console.log(`\n${employee.user?.firstName} ${employee.user?.lastName}:`);
      console.log(`  Position: ${employee.position}`);
      console.log(`  Department: ${employee.department}`);
      console.log(`  Specializations: ${employee.specializations?.length ? employee.specializations.join(', ') : 'None'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error linking employees and services:', error);
    process.exit(1);
  }
}

linkEmployeesAndServices();