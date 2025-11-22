const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: [true, 'Booking number is required'],
    unique: true,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client is required']
  },
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required']
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required']
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [0, 'Price cannot be negative']
    },
    duration: {
      type: Number,
      required: [true, 'Service duration is required'],
      min: [15, 'Duration must be at least 15 minutes']
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    },
    notes: String
  }],
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  totalDuration: {
    type: Number,
    required: [true, 'Total duration is required']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  customDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Custom discount cannot be negative']
  },
  discountedTotal: {
    type: Number,
    min: [0, 'Discounted total cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0, 'Final amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
  enum: ['cash', 'card', 'online', 'wallet', 'bank-transfer', 'giftcard', 'membership'],
    required: function() {
      return this.paymentStatus === 'paid' || this.paymentStatus === 'partial';
    }
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    paidAmount: { type: Number, default: 0 },
    paymentDate: Date,
    refundAmount: { type: Number, default: 0 },
    refundDate: Date,
    refundReason: String,
    // Added fields for internal benefit tracking
    giftCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'GiftCard' },
    redeemAmount: { type: Number, default: 0 },
    membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership' },
    // Admin membership application (when admin applies client's membership)
    adminMembership: {
      membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership' },
      discountAmount: { type: Number, default: 0 },
      membershipName: String,
      sessionDeduction: { type: Boolean, default: false },
      remainingSessionsBefore: Number
    }
  },
  status: {
    type: String,
    // Expanded enum to align with frontend workflow terminology
    // booked ~ pending, started ~ in-progress, arrived is a new explicit stage before service start
    enum: [
      'booked',        // synonym of previous 'pending'
      'confirmed',
      'arrived',       // client arrived / checked in
      'started',       // synonym of previous 'in-progress'
      'in-progress',   // kept for backward compatibility
      'completed',
      'cancelled',
      'no-show',
      'rescheduled',
      'pending'        // kept legacy last to migrate out later
    ],
    default: 'booked'
  },
  bookingSource: {
    type: String,
    enum: ['website', 'mobile-app', 'phone', 'walk-in', 'admin'],
    default: 'website'
  },
  clientNotes: String,
  internalNotes: String,
  specialRequests: [String],
  cancellation: {
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    reason: String,
    refundAmount: Number,
    cancellationFee: { type: Number, default: 0 }
  },
  reschedule: {
    originalDate: Date,
    rescheduledAt: Date,
    rescheduledBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    reason: String,
    rescheduleCount: { type: Number, default: 0 }
  },
  reminders: [{
    type: { type: String, enum: ['email', 'sms', 'push'] },
    sentAt: Date,
    status: { type: String, enum: ['sent', 'delivered', 'failed'] }
  }],
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date,
    wouldRecommend: Boolean
  },
  checkIn: {
    checkedInAt: Date,
    checkedInBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    isEarlyArrival: Boolean,
    waitTime: Number // in minutes
  },
  checkOut: {
    checkedOutAt: Date,
    checkedOutBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    actualDuration: Number, // in minutes
    additionalCharges: Number,
    tips: Number
  },
  room: {
    roomNumber: String,
    roomType: String,
    assignedAt: Date
  },
  promotions: [{
    code: String,
    description: String,
    discountType: { type: String, enum: ['percentage', 'fixed'] },
    discountValue: Number,
    appliedAmount: Number
  }],
  loyaltyPoints: {
    earned: { type: Number, default: 0 },
    redeemed: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for booking duration in hours
bookingSchema.virtual('durationInHours').get(function() {
  return Math.round((this.totalDuration / 60) * 100) / 100;
});

// Virtual for days until appointment
bookingSchema.virtual('daysUntilAppointment').get(function() {
  const now = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  const diffTime = appointmentDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is upcoming
bookingSchema.virtual('isUpcoming').get(function() {
  const upcomingStatuses = ['booked','pending','confirmed'];
  return this.appointmentDate > new Date() && upcomingStatuses.includes(this.status);
});

// Virtual for can cancel
bookingSchema.virtual('canCancel').get(function() {
  const now = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
  const cancellable = ['booked','pending','confirmed'];
  return hoursUntilAppointment > 24 && cancellable.includes(this.status);
});

// Virtual for can reschedule
bookingSchema.virtual('canReschedule').get(function() {
  const now = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
  const reschedulable = ['booked','pending','confirmed'];
  return hoursUntilAppointment > 12 && reschedulable.includes(this.status) && 
         (!this.reschedule || this.reschedule.reschedule < 2);
});

// Virtual for client name - handle both ObjectId (populated) and string
bookingSchema.virtual('clientName').get(function() {
  if (typeof this.client === 'string') {
    return this.client; // Direct string name
  } else if (this.client && this.client.firstName) {
    return `${this.client.firstName} ${this.client.lastName || ''}`.trim(); // Populated ObjectId
  }
  return 'Unknown Client';
});

// Virtual for client email - handle both ObjectId (populated) and string
bookingSchema.virtual('clientEmail').get(function() {
  if (typeof this.client === 'string') {
    return null; // String clients don't have email
  } else if (this.client && this.client.email) {
    return this.client.email; // Populated ObjectId
  }
  return null;
});

// Method to get service name - handle both ObjectId (populated) and string
bookingSchema.methods.getServiceName = function(serviceIndex = 0) {
  const service = this.services[serviceIndex];
  if (!service) return 'Unknown Service';
  
  if (typeof service.service === 'string') {
    return service.service; // Direct string name
  } else if (service.service && service.service.name) {
    return service.service.name; // Populated ObjectId
  }
  return 'Unknown Service';
};

// Method to get employee name - handle both ObjectId (populated) and string
bookingSchema.methods.getEmployeeName = function(serviceIndex = 0) {
  const service = this.services[serviceIndex];
  if (!service) return 'Unknown Employee';
  
  if (typeof service.employee === 'string') {
    return service.employee; // Direct string name
  } else if (service.employee && service.employee.user) {
    const user = service.employee.user;
    return `${user.firstName} ${user.lastName || ''}`.trim(); // Populated ObjectId
  }
  return 'Unknown Employee';
};

// Indexes for better query performance
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ client: 1 });
bookingSchema.index({ appointmentDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ 'services.employee': 1 });
bookingSchema.index({ 'services.service': 1 });
bookingSchema.index({ createdAt: -1 });

// Pre-save middleware to generate booking number
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last booking of the day
    const lastBooking = await this.constructor.findOne({
      bookingNumber: new RegExp(`^BK${year}${month}${day}`)
    }).sort({ bookingNumber: -1 });
    
    let sequence = 1;
    if (lastBooking) {
      const lastSequence = parseInt(lastBooking.bookingNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.bookingNumber = `BK${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
  }
  
  // Calculate final amount - ONLY if not already set by controller
  // Controller sets finalAmount when custom discount/gift card/membership is applied
  if (this.finalAmount === undefined || this.finalAmount === null) {
    // No finalAmount set - calculate it
    if (this.customDiscount && this.customDiscount > 0) {
      // Custom discount applied - use discountedTotal if provided, otherwise calculate
      if (this.discountedTotal !== undefined && this.discountedTotal !== null) {
        this.finalAmount = this.discountedTotal;
      } else {
        this.finalAmount = this.totalAmount - this.customDiscount + this.taxAmount;
      }
      // Set discountAmount to match customDiscount for consistency
      this.discountAmount = this.customDiscount;
    } else {
      // No custom discount - calculate normally
      this.finalAmount = this.totalAmount - this.discountAmount + this.taxAmount;
    }
  }
  // If finalAmount is already set (from controller), respect it - don't overwrite
  
  next();
});

// Pre-save middleware to validate service times
bookingSchema.pre('save', function(next) {
  for (let service of this.services) {
    if (service.endTime <= service.startTime) {
      return next(new Error('Service end time must be after start time'));
    }
  }
  next();
});

// Populate related data when querying - handle both ObjectIds and strings
// DISABLED: Auto-population middleware causing issues with legacy data
// We now manually populate in controllers to handle invalid ObjectIds gracefully
/*
bookingSchema.pre(/^find/, function(next) {
  // Only populate if the field is an ObjectId, skip if it's a string
  this.populate({
    path: 'client',
    select: 'firstName lastName email phone',
    match: function(doc) {
      return mongoose.Types.ObjectId.isValid(doc.client);
    }
  }).populate({
    path: 'services.service',
    select: 'name category duration price',
    match: function(doc) {
      return doc.services && doc.services.some(s => mongoose.Types.ObjectId.isValid(s.service));
    }
  }).populate({
    path: 'services.employee',
    select: 'employeeId user',
    populate: {
      path: 'user',
      select: 'firstName lastName'
    },
    match: function(doc) {
      return doc.services && doc.services.some(s => mongoose.Types.ObjectId.isValid(s.employee));
    }
  });
  next();
});
*/

module.exports = mongoose.model('Booking', bookingSchema);

