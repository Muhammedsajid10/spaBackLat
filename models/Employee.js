const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Employee must be linked to a user account']
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Employee position is required'],
    enum: [
      'massage-therapist',
      'esthetician',
      'nail-technician',
      'hair-stylist',
      'wellness-coach',
      'receptionist',
      'manager',
      'supervisor'
    ]
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'spa-services',
      'wellness',
      'beauty',
      'administration',
      'customer-service'
    ]
  },
  hireDate: {
    type: Date,
    required: [true, 'Hire date is required']
  },
  salary: {
    type: Number,
    // required: [true, 'Salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  commissionRate: {
    type: Number,
    default: 0,
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot exceed 100%']
  },
  workSchedule: {
    type: Map,
    of: {
      isWorking: { type: Boolean, default: true },
      startTime: { type: String, default: '00:00' },
      endTime: { type: String, default: '23:59' },
      shifts: { type: String, default: null }, // For multiple shifts: "09:00 - 13:00, 14:00 - 18:00"
      shiftsData: [{ // Alternative array format
        startTime: String,
        endTime: String
      }],
      shiftCount: { type: Number, default: 0 }
    },
    default: () => {
      // Return a new Map with default values for each day
      const defaultMap = new Map();
      ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(day => {
        defaultMap.set(day, {
          isWorking: true,
          startTime: '00:00',
          endTime: '23:59',
          shifts: null,
          shiftsData: [],
          shiftCount: 0
        });
      });
      return defaultMap;
    }
  },
  // Keep legacy weekly template for migration purposes (temporary)
  legacyWorkSchedule: {
    type: {
      monday: { isWorking: Boolean, startTime: String, endTime: String, shifts: String },
      tuesday: { isWorking: Boolean, startTime: String, endTime: String, shifts: String },
      wednesday: { isWorking: Boolean, startTime: String, endTime: String, shifts: String },
      thursday: { isWorking: Boolean, startTime: String, endTime: String, shifts: String },
      friday: { isWorking: Boolean, startTime: String, endTime: String, shifts: String },
      saturday: { isWorking: Boolean, startTime: String, endTime: String, shifts: String },
      sunday: { isWorking: Boolean, startTime: String, endTime: String, shifts: String }
    },
    default: {}
  },
  specializations: [{
    type: String,
    enum: [
      'deep-tissue-massage',
      'swedish-massage',
      'hot-stone-massage',
      'aromatherapy',
      'facial-treatments',
      'anti-aging-treatments',
      'acne-treatments',
      'manicure',
      'pedicure',
      'gel-nails',
      'hair-removal',
      'body-wraps',
      'wellness-coaching'
    ]
  }],
  certifications: [{
    name: { type: String, required: true },
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date,
    certificateNumber: String,
    isActive: { type: Boolean, default: true }
  }],
  skills: [{
    name: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    yearsOfExperience: Number
  }],
  languages: [{
    language: String,
    proficiency: { type: String, enum: ['basic', 'intermediate', 'fluent', 'native'] }
  }],
  availability: {
    isAvailable: { type: Boolean, default: true },
    unavailableDates: [{
      startDate: Date,
      endDate: Date,
      reason: String,
      type: { type: String, enum: ['vacation', 'sick-leave', 'training', 'personal', 'other'] }
    }]
  },
  performance: {
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    lastPerformanceReview: Date
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  bankDetails: {
    accountNumber: String,
    routingNumber: String,
    bankName: String,
    accountHolderName: String
  },
  documents: [{
    type: { type: String, enum: ['contract', 'id-copy', 'certificate', 'tax-form', 'other'] },
    name: String,
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  terminationDate: Date,
  terminationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for years of service
employeeSchema.virtual('yearsOfService').get(function() {
  const endDate = this.terminationDate || new Date();
  const years = (endDate - this.hireDate) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(years * 10) / 10; // Round to 1 decimal place
});

// Virtual for completion rate
employeeSchema.virtual('completionRate').get(function() {
  if (this.performance.totalBookings === 0) return 0;
  return Math.round((this.performance.completedBookings / this.performance.totalBookings) * 100);
});

// Indexes for better query performance
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ position: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ 'availability.isAvailable': 1 });
employeeSchema.index({ specializations: 1 });

// Populate user data when querying
employeeSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email phone profileImage isActive'
  });
  next();
});

// Set default 24-hour availability schedule for new employees
employeeSchema.pre('save', function(next) {
  // Only run this for new documents (not updates)
  if (!this.isNew) {
    return next();
  }

  console.log('Employee pre-save hook: Setting default schedule if needed');
  console.log(`Current workSchedule type: ${this.workSchedule ? (this.workSchedule.constructor ? this.workSchedule.constructor.name : typeof this.workSchedule) : 'undefined'}`);
  
  // Check all possible cases of empty workSchedule
  const isEmpty = 
    !this.workSchedule || 
    (this.workSchedule instanceof Map && this.workSchedule.size === 0) ||
    (this.workSchedule && typeof this.workSchedule === 'object' && 
     !Array.isArray(this.workSchedule) && 
     Object.keys(this.workSchedule).length === 0);
  
  console.log(`Is workSchedule empty? ${isEmpty ? 'Yes' : 'No'}`);
  
  if (isEmpty) {
    console.log('Setting default 24-hour schedule for new employee');
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
    
    this.workSchedule = defaultWorkSchedule;
    console.log(`Default schedule set with ${defaultWorkSchedule.size} days`);
  }
  
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);

