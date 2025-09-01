const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Employee = require('../models/Employee');

const employees = [
  // Massage Therapists
  {
    user: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@spa.com',
      password: 'Employee@123',
      phone: '+971501234567',
      role: 'employee',
      isEmailVerified: true,
      isActive: true,
      gender: 'female',
      address: {
        street: 'Sheikh Zayed Road',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '12345',
        country: 'UAE'
      }
    },
    employee: {
      employeeId: 'EMP00',
      position: 'massage-therapist',
      department: 'spa-services',
      hireDate: new Date('2022-01-15'),
      salary: 8000,
      commissionRate: 10,
      workSchedule: {
        monday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        wednesday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        thursday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        friday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        saturday: { isWorking: true, startTime: '10:00', endTime: '16:00' },
        sunday: { isWorking: true, startTime: '10:00', endTime: '16:00' }
      },
      specializations: ['deep-tissue-massage', 'swedish-massage', 'hot-stone-massage'],
      skills: [
        { name: 'Swedish Massage', level: 'expert', yearsOfExperience: 5 },
        { name: 'Deep Tissue Massage', level: 'expert', yearsOfExperience: 5 },
        { name: 'Hot Stone Massage', level: 'advanced', yearsOfExperience: 3 },
        { name: 'Thai Massage', level: 'advanced', yearsOfExperience: 4 }
      ],
      certifications: [
        {
          name: 'Licensed Massage Therapist',
          issuingOrganization: 'Dubai Health Authority',
          issueDate: new Date('2020-03-15'),
          certificateNumber: 'DHA-MT-2020-001'
        },
        {
          name: 'Thai Massage Certification',
          issuingOrganization: 'Thai Massage Institute',
          issueDate: new Date('2021-06-20'),
          certificateNumber: 'TMI-2021-045'
        }
      ],
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Arabic', proficiency: 'intermediate' }
      ],
      availability: {
        isAvailable: true
      },
      emergencyContact: {
        name: 'John Johnson',
        relationship: 'Spouse',
        phone: '+971501234568',
        email: 'john.johnson@email.com'
      }
    }
  },
  {
    user: {
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      email: 'ahmed.alrashid@spa.com',
      password: 'Employee@123',
      phone: '+971502345678',
      role: 'employee',
      isEmailVerified: true,
      isActive: true,
      gender: 'male',
      address: {
        street: 'Jumeirah Beach Road',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '12346',
        country: 'UAE'
      }
    },
    employee: {
      employeeId: 'EMP002',
      position: 'massage-therapist',
      department: 'spa-services',
      hireDate: new Date('2021-08-10'),
      salary: 8500,
      commissionRate: 12,
      workSchedule: {
        monday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        tuesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        wednesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        thursday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        friday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        saturday: { isWorking: true, startTime: '09:00', endTime: '15:00' },
        sunday: { isWorking: true, startTime: '09:00', endTime: '15:00' }
      },
      specializations: ['deep-tissue-massage', 'aromatherapy'],
      skills: [
        { name: 'Sports Massage', level: 'expert', yearsOfExperience: 7 },
        { name: 'Deep Tissue Massage', level: 'expert', yearsOfExperience: 7 },
        { name: 'Reflexology', level: 'advanced', yearsOfExperience: 5 },
        { name: 'Stretching', level: 'advanced', yearsOfExperience: 6 }
      ],
      certifications: [
        {
          name: 'Sports Massage Therapist',
          issuingOrganization: 'International Sports Massage Association',
          issueDate: new Date('2019-05-10'),
          certificateNumber: 'ISMA-2019-078'
        },
        {
          name: 'Reflexology Certification',
          issuingOrganization: 'Dubai Health Authority',
          issueDate: new Date('2020-11-15'),
          certificateNumber: 'DHA-REF-2020-023'
        }
      ],
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Arabic', proficiency: 'native' },
        { language: 'French', proficiency: 'intermediate' }
      ],
      availability: {
        isAvailable: true
      },
      emergencyContact: {
        name: 'Fatima Al-Rashid',
        relationship: 'Sister',
        phone: '+971502345679',
        email: 'fatima.alrashid@email.com'
      }
    }
  },
  {
    user: {
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@spa.com',
      password: 'Employee@123',
      phone: '+971503456789',
      role: 'employee',
      isEmailVerified: true,
      isActive: true,
      gender: 'female',
      address: {
        street: 'Palm Jumeirah',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '12347',
        country: 'UAE'
      }
    },
    employee: {
      employeeId: 'EMP003',
      specialization: 'Aromatherapy & Wellness',
      skills: ['Aromatherapy Massage', 'Hot Oil Massage', 'Balinese Massage', 'Meditation'],
      experience: 4,
      certifications: ['Aromatherapy Specialist', 'Wellness Coach'],
      languages: ['English', 'Spanish'],
      bio: 'Wellness specialist with expertise in aromatherapy and holistic healing approaches.',
      workingHours: {
        monday: { start: '10:00', end: '19:00' },
        tuesday: { start: '10:00', end: '19:00' },
        wednesday: { start: '10:00', end: '19:00' },
        thursday: { start: '10:00', end: '19:00' },
        friday: { start: '10:00', end: '19:00' },
        saturday: { start: '11:00', end: '17:00' },
        sunday: { start: '11:00', end: '17:00' }
      },
      hourlyRate: 160,
      isAvailable: true
    }
  },

  // Facial Specialists
  {
    user: {
      firstName: 'Fatima',
      lastName: 'Al-Zahra',
      email: 'fatima.alzahra@spa.com',
      password: 'Employee@123',
      phone: '+971504567890',
      role: 'employee',
      isEmailVerified: true,
      isActive: true,
      gender: 'female',
      address: {
        street: 'Dubai Marina',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '12348',
        country: 'UAE'
      }
    },
    employee: {
      employeeId: 'EMP004',
      position: 'esthetician',
      department: 'beauty',
      hireDate: new Date('2022-03-20'),
      salary: 7500,
      commissionRate: 15,
      workSchedule: {
        monday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        wednesday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        thursday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        friday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        saturday: { isWorking: true, startTime: '10:00', endTime: '16:00' },
        sunday: { isWorking: true, startTime: '10:00', endTime: '16:00' }
      },
      specializations: ['facial-treatments', 'anti-aging-treatments', 'acne-treatments'],
      skills: [
        { name: 'Anti-aging Facials', level: 'expert', yearsOfExperience: 6 },
        { name: 'Hydrating Facials', level: 'expert', yearsOfExperience: 6 },
        { name: 'Brightening Facials', level: 'advanced', yearsOfExperience: 5 },
        { name: 'Acne Treatment', level: 'advanced', yearsOfExperience: 4 }
      ],
      certifications: [
        {
          name: 'Licensed Esthetician',
          issuingOrganization: 'Dubai Health Authority',
          issueDate: new Date('2018-09-15'),
          certificateNumber: 'DHA-EST-2018-056'
        },
        {
          name: 'Advanced Facial Specialist',
          issuingOrganization: 'International Esthetics Institute',
          issueDate: new Date('2020-02-10'),
          certificateNumber: 'IEI-AFS-2020-034'
        }
      ],
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Arabic', proficiency: 'native' },
        { language: 'Urdu', proficiency: 'intermediate' }
      ],
      availability: {
        isAvailable: true
      },
      emergencyContact: {
        name: 'Mohammed Al-Zahra',
        relationship: 'Brother',
        phone: '+971504567891',
        email: 'mohammed.alzahra@email.com'
      }
    }
  },
  {
    user: {
      firstName: 'Elena',
      lastName: 'Petrova',
      email: 'elena.petrova@spa.com',
      password: 'Employee@123',
      phone: '+971505678901',
      role: 'employee',
      isEmailVerified: true,
      isActive: true,
      gender: 'female',
      address: {
        street: 'Downtown Dubai',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '12349',
        country: 'UAE'
      }
    },
    employee: {
      employeeId: 'EMP005',
      specialization: 'Advanced Skincare',
      skills: ['Chemical Peels', 'Microdermabrasion', 'LED Therapy', 'Facial Massage'],
      experience: 8,
      certifications: ['Advanced Esthetician', 'Medical Aesthetics'],
      languages: ['English', 'Russian'],
      bio: 'Advanced skincare specialist with expertise in medical-grade treatments and anti-aging procedures.',
      workingHours: {
        monday: { start: '10:00', end: '19:00' },
        tuesday: { start: '10:00', end: '19:00' },
        wednesday: { start: '10:00', end: '19:00' },
        thursday: { start: '10:00', end: '19:00' },
        friday: { start: '10:00', end: '19:00' },
        saturday: { start: '11:00', end: '17:00' },
        sunday: { start: '11:00', end: '17:00' }
      },
      hourlyRate: 170,
      isAvailable: true
    }
  },

  // Body Treatment Specialists
  {
    user: {
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@spa.com',
      password: 'Employee@123',
      phone: '+971506789012',
      role: 'employee',
      isEmailVerified: true,
      isActive: true,
      gender: 'male',
      address: {
        street: 'Al Barsha',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '12350',
        country: 'UAE'
      }
    },
    employee: {
      employeeId: 'EMP006',
      specialization: 'Body Treatments',
      skills: ['Body Scrubs', 'Body Wraps', 'Cellulite Treatment', 'Lymphatic Drainage'],
      experience: 5,
      certifications: ['Body Treatment Specialist', 'Lymphatic Drainage Therapist'],
      languages: ['English'],
      bio: 'Body treatment specialist with expertise in detoxifying and contouring treatments.',
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: { start: '10:00', end: '16:00' },
        sunday: { start: '10:00', end: '16:00' }
      },
      hourlyRate: 155,
      isAvailable: true
    }
  },

  // Nail Care Specialists
  {
    user: {
      firstName: 'Nina',
      lastName: 'Kowalski',
      email: 'nina.kowalski@spa.com',
      password: 'Employee@123',
      phone: '+971507890123',
      role: 'employee',
      isEmailVerified: true,
      isActive: true,
      gender: 'female',
      address: {
        street: 'JLT',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '12351',
        country: 'UAE'
      }
    },
    employee: {
      employeeId: 'EMP007',
      position: 'nail-technician',
      department: 'beauty',
      hireDate: new Date('2022-06-15'),
      salary: 6000,
      commissionRate: 20,
      workSchedule: {
        monday: { isWorking: true, startTime: '10:00', endTime: '19:00' },
        tuesday: { isWorking: true, startTime: '10:00', endTime: '19:00' },
        wednesday: { isWorking: true, startTime: '10:00', endTime: '19:00' },
        thursday: { isWorking: true, startTime: '10:00', endTime: '19:00' },
        friday: { isWorking: true, startTime: '10:00', endTime: '19:00' },
        saturday: { isWorking: true, startTime: '11:00', endTime: '17:00' },
        sunday: { isWorking: true, startTime: '11:00', endTime: '17:00' }
      },
      specializations: ['manicure', 'pedicure', 'gel-nails'],
      skills: [
        { name: 'Manicure', level: 'expert', yearsOfExperience: 4 },
        { name: 'Pedicure', level: 'expert', yearsOfExperience: 4 },
        { name: 'Gel Nails', level: 'advanced', yearsOfExperience: 3 },
        { name: 'Nail Art', level: 'advanced', yearsOfExperience: 3 }
      ],
      certifications: [
        {
          name: 'Licensed Nail Technician',
          issuingOrganization: 'Dubai Municipality',
          issueDate: new Date('2020-12-05'),
          certificateNumber: 'DM-NT-2020-089'
        },
        {
          name: 'Gel Nail Specialist',
          issuingOrganization: 'Professional Beauty Academy',
          issueDate: new Date('2021-08-20'),
          certificateNumber: 'PBA-GNS-2021-067'
        }
      ],
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Polish', proficiency: 'native' }
      ],
      availability: {
        isAvailable: true
      },
      emergencyContact: {
        name: 'Piotr Kowalski',
        relationship: 'Husband',
        phone: '+971507890124',
        email: 'piotr.kowalski@email.com'
      }
    }
  },

  // Wellness Specialists
  {
    user: {
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@spa.com',
      password: 'Employee@123',
      phone: '+971508901234',
      role: 'employee',
      isEmailVerified: true,
      isActive: true,
      gender: 'female',
      address: {
        street: 'Silicon Oasis',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '12352',
        country: 'UAE'
      }
    },
    employee: {
      employeeId: 'EMP008',
      position: 'wellness-coach',
      department: 'wellness',
      hireDate: new Date('2021-11-10'),
      salary: 7000,
      commissionRate: 8,
      workSchedule: {
        monday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        tuesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        wednesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        thursday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        friday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
        saturday: { isWorking: true, startTime: '09:00', endTime: '15:00' },
        sunday: { isWorking: true, startTime: '09:00', endTime: '15:00' }
      },
      specializations: ['wellness-coaching'],
      skills: [
        { name: 'Meditation', level: 'expert', yearsOfExperience: 6 },
        { name: 'Yoga', level: 'expert', yearsOfExperience: 6 },
        { name: 'Reiki Healing', level: 'advanced', yearsOfExperience: 4 },
        { name: 'Breathing Techniques', level: 'advanced', yearsOfExperience: 5 }
      ],
      certifications: [
        {
          name: 'Yoga Instructor',
          issuingOrganization: 'Yoga Alliance International',
          issueDate: new Date('2019-03-15'),
          certificateNumber: 'YAI-2019-123'
        },
        {
          name: 'Reiki Master',
          issuingOrganization: 'International Reiki Association',
          issueDate: new Date('2020-07-20'),
          certificateNumber: 'IRA-RM-2020-045'
        },
        {
          name: 'Meditation Teacher',
          issuingOrganization: 'Mindfulness Institute',
          issueDate: new Date('2021-01-10'),
          certificateNumber: 'MI-MT-2021-078'
        }
      ],
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Hindi', proficiency: 'native' },
        { language: 'Gujarati', proficiency: 'native' }
      ],
      availability: {
        isAvailable: true
      },
      emergencyContact: {
        name: 'Raj Patel',
        relationship: 'Husband',
        phone: '+971508901235',
        email: 'raj.patel@email.com'
      }
    }
  }
];

const seedEmployees = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing employees (optional - remove if you want to keep existing)
    await Employee.deleteMany({});
    console.log('🗑️  Cleared existing employees');

    const createdEmployees = [];

    for (const employeeData of employees) {
      try {
        // Create user first
        const user = new User(employeeData.user);
        await user.save();

        // Create employee record
        const employee = new Employee({
          ...employeeData.employee,
          user: user._id
        });
        await employee.save();

        createdEmployees.push({
          user: user,
          employee: employee
        });

        console.log(`✅ Created employee: ${user.firstName} ${user.lastName} (${employee.employeeId})`);
      } catch (error) {
        console.error(`❌ Error creating employee ${employeeData.user.email}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully seeded ${createdEmployees.length} employees!`);
    
    // Display summary by position
    const positions = [...new Set(employees.map(emp => emp.employee.position))];
    console.log('\n📊 Employees by Position:');
    positions.forEach(pos => {
      const count = employees.filter(emp => emp.employee.position === pos).length;
      console.log(`   ${pos}: ${count} employees`);
    });

    console.log('\n🔑 Employee Login Credentials:');
    createdEmployees.forEach(({ user }) => {
      console.log(`   ${user.email} / Employee@123`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding employees:', err.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedEmployees(); 