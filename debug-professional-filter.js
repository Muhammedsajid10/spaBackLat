const mongoose = require('mongoose');
// Make sure we load User model first to avoid reference issues
const User = require('./models/User');
const Employee = require('./models/Employee');
const Service = require('./models/Service');

async function debugProfessionalFilter() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');

    // First, list all services to help find a valid one
    const allServices = await Service.find({}).select('_id name');
    console.log('\n=== Available Services ===');
    allServices.forEach((service, idx) => {
      console.log(`[${idx + 1}] ${service.name} (ID: ${service._id})`);
    });
    
    // Get service ID from command line argument or use the first available service
    const serviceId = process.argv[2] || (allServices.length ? allServices[0]._id.toString() : null);
    const dateStr = process.argv[3] || '2025-09-23';
    
    if (!serviceId) {
      console.log('No service found in database and none provided as argument!');
      process.exit(1);
    }
    
    console.log(`\nDebugging professional filter for serviceId: ${serviceId} and date: ${dateStr}`);
    
    // Find the service
    const service = await Service.findById(serviceId);
    if (!service) {
      console.log('Service not found!');
      process.exit(1);
    }
    console.log(`Found service: ${service.name}`);
    
    // Find all active employees
    const allEmployees = await Employee.find({ isActive: true })
      .populate('user', 'firstName lastName email')
      .select('user position employeeId specializations workSchedule department');
    
    console.log(`Found ${allEmployees.length} active employees total`);
    
    // Print employee details
    allEmployees.forEach((emp, idx) => {
      console.log(`\n[${idx + 1}] Employee: ${emp.user?.firstName} ${emp.user?.lastName} (${emp._id})`);
      console.log(`   Position: ${emp.position}`);
      console.log(`   Department: ${emp.department}`);
      console.log(`   Has workSchedule: ${emp.workSchedule ? (emp.workSchedule instanceof Map ? 'Map with ' + emp.workSchedule.size + ' entries' : 'Object') : 'No'}`);
      
      if (emp.workSchedule instanceof Map) {
        console.log('   workSchedule keys:', Array.from(emp.workSchedule.keys()));
      } else if (emp.workSchedule && typeof emp.workSchedule === 'object') {
        console.log('   workSchedule keys:', Object.keys(emp.workSchedule));
      }
      
      // Check specializations
      console.log(`   Specializations: ${emp.specializations?.length ? emp.specializations.join(', ') : 'None'}`);
    });
    
    // Filter by date availability
    const date = dateStr;
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    console.log(`\nDay of week for ${date} is ${dayName} (${dayOfWeek})`);
    
    const availableEmployees = allEmployees.filter(employee => {
      // Prefer date-specific schedule (YYYY-MM-DD) then fallback to weekday-based
      let schedule;
      try {
        if (employee.workSchedule instanceof Map) {
          // Try specific date key first
          schedule = employee.workSchedule.get(date);
          if (!schedule) schedule = employee.workSchedule.get(dayName);
        } else if (employee.workSchedule && typeof employee.workSchedule === 'object') {
          schedule = employee.workSchedule[date] || employee.workSchedule[dayName];
        } else if (employee.legacyWorkSchedule) {
          // Fallback to legacy schedule if available
          schedule = employee.legacyWorkSchedule[date] || employee.legacyWorkSchedule[dayName] || employee.legacyWorkSchedule[dayName];
        }
      } catch (err) {
        console.error(`Error reading workSchedule for employee ${employee.user?.firstName} ${employee.user?.lastName}`, err);
        schedule = null;
      }

      const isAvailable = schedule && schedule.isWorking;
      console.log(`   ${employee.user?.firstName} ${employee.user?.lastName} is ${isAvailable ? 'AVAILABLE ✅' : 'NOT AVAILABLE ❌'}`);
      if (!isAvailable) {
        console.log(`     Schedule for ${dayName}: ${schedule ? JSON.stringify(schedule) : 'Not found or isWorking=false'}`);
      } else {
        console.log(`     Schedule for ${dayName}: isWorking=true, hours=${schedule.startTime}-${schedule.endTime}`);
      }
      
      return isAvailable;
    });
    
    console.log(`\nAfter availability filtering: ${availableEmployees.length} employees available out of ${allEmployees.length}`);

    // Check for specializations match with service
    if (service.requiredSpecializations && service.requiredSpecializations.length > 0) {
      console.log(`\nService ${service.name} requires specializations:`, service.requiredSpecializations);
      
      const specializedEmployees = availableEmployees.filter(employee => {
        if (!employee.specializations || !employee.specializations.length) {
          console.log(`   ${employee.user?.firstName} ${employee.user?.lastName} has NO specializations ❌`);
          return false;
        }
        
        const hasRequiredSpecialization = employee.specializations.some(spec => 
          service.requiredSpecializations.includes(spec));
        
        console.log(`   ${employee.user?.firstName} ${employee.user?.lastName} specialization match: ${hasRequiredSpecialization ? 'YES ✅' : 'NO ❌'}`);
        return hasRequiredSpecialization;
      });
      
      console.log(`\nAfter specialization filtering: ${specializedEmployees.length} employees with required specialization`);
    }

    console.log('\nSummary of employees who are NOT available:');
    allEmployees.filter(emp => {
      let schedule;
      try {
        if (emp.workSchedule instanceof Map) {
          schedule = emp.workSchedule.get(date) || emp.workSchedule.get(dayName);
        } else if (emp.workSchedule && typeof emp.workSchedule === 'object') {
          schedule = emp.workSchedule[date] || emp.workSchedule[dayName];
        }
      } catch (err) {
        schedule = null;
      }
      return !schedule || !schedule.isWorking;
    }).forEach(emp => {
      console.log(`- ${emp.user?.firstName} ${emp.user?.lastName} is NOT available because:`);
      
      // Check if they have any schedule
      if (!emp.workSchedule || (emp.workSchedule instanceof Map && emp.workSchedule.size === 0)) {
        console.log(`  • No work schedule defined at all`);
        return;
      }
      
      // Check if they have schedule for this day
      let schedule;
      if (emp.workSchedule instanceof Map) {
        schedule = emp.workSchedule.get(date) || emp.workSchedule.get(dayName);
        if (!schedule) {
          console.log(`  • No schedule entry for ${dayName} or ${date}`);
          console.log(`  • Available schedule keys: ${Array.from(emp.workSchedule.keys()).join(', ')}`);
          return;
        }
      } else if (typeof emp.workSchedule === 'object') {
        schedule = emp.workSchedule[date] || emp.workSchedule[dayName];
        if (!schedule) {
          console.log(`  • No schedule entry for ${dayName} or ${date}`);
          console.log(`  • Available schedule keys: ${Object.keys(emp.workSchedule).join(', ')}`);
          return;
        }
      }
      
      // Check isWorking flag
      if (schedule && !schedule.isWorking) {
        console.log(`  • Has schedule for ${dayName} but isWorking=false`);
        return;
      }
      
      console.log(`  • Unknown reason`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error in debugProfessionalFilter:', error);
    process.exit(1);
  }
}

debugProfessionalFilter();