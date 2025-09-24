const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  // Basic Information
  name: { 
    type: String, 
    required: [true, 'Membership name is required'],
    trim: true,
    maxlength: [100, 'Membership name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Membership description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Service Configuration
  serviceType: {
    type: String,
    enum: ['Limited', 'Unlimited'],
    required: [true, 'Service type is required'],
    default: 'Limited'
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  serviceName: String, // Store service name for reference
  numberOfSessions: {
    type: Number,
    required: function() {
      return this.serviceType === 'Limited';
    },
    min: [1, 'Number of sessions must be at least 1']
  },


  paymentType: {
    type: String,
    enum: ['One-time', 'Recurring'],
    required: [true, 'Payment type is required'],
    default: 'One-time'
  },
  price: {
    type: Number,
    required: [true, 'Membership price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },

  
  validityPeriod: {
    type: Number,
    required: [true, 'Validity period is required'],
    min: [1, 'Validity period must be at least 1']
  },

  validityUnit: {
    type: String,
    enum: ['days', 'months', 'years'],
    required: [true, 'Validity unit is required'],
    default: 'months'
  },

  // Client Assignment (for purchased memberships)
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  // Status and Dates
  status: { 
    type: String, 
    enum: ['Draft', 'Active', 'Partially Used', 'Used', 'Expired', 'Cancelled'], 
    default: 'Draft' 
  },
  startDate: { 
    type: Date,
    default: Date.now
  },
  endDate: { 
    type: Date
  },
  purchaseDate: {
    type: Date
  },

  // Usage Tracking
  usedSessions: {
    type: Number,
    default: 0
  },
  lastUsedDate: {
    type: Date
  },

  // Payment Information
  paymentIntentId: {
    type: String,
    sparse: true // Allow multiple null values but unique non-null values
  },

  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: true // True for membership templates, false for purchased memberships
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for remaining sessions
membershipSchema.virtual('remainingSessions').get(function() {
  if (this.serviceType === 'Unlimited') {
    return 'Unlimited';
  }
  return Math.max(0, this.numberOfSessions - this.usedSessions);
});

// Virtual for days remaining
membershipSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const today = new Date();
  const diffTime = this.endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Pre-save middleware for calculating end date, populating service name, and updating status
membershipSchema.pre('save', async function(next) {
  // Calculate end date
  if (this.isNew && this.startDate && this.validityPeriod && this.validityUnit) {
    const startDate = new Date(this.startDate);
    let endDate = new Date(startDate);
    
    switch (this.validityUnit) {
      case 'days':
        endDate.setDate(endDate.getDate() + this.validityPeriod);
        break;
      case 'months':
        endDate.setMonth(endDate.getMonth() + this.validityPeriod);
        break;
      case 'years':
        endDate.setFullYear(endDate.getFullYear() + this.validityPeriod);
        break;
    }
    
    this.endDate = endDate;
  }
  
  // Populate service name if we have a service ID but no service name
  if (this.service && !this.serviceName) {
    try {
      const Service = mongoose.model('Service');
      const serviceDoc = await Service.findById(this.service);
      if (serviceDoc) {
        this.serviceName = serviceDoc.name;
      }
    } catch (err) {
      console.error('Error fetching service name:', err);
    }
  }
  
  // Update status based on usage and expiry
  if (!this.isTemplate) {
    const isExpired = this.isExpired();
    const isSessionsExhausted = this.isSessionsExhausted();
    
    if (isExpired) {
      this.status = 'Expired';
    } else if (isSessionsExhausted) {
      this.status = 'Used';
    } else if (this.usedSessions > 0) {
      this.status = 'Partially Used';
    } else if (this.status !== 'Active') {
      this.status = 'Active';
    }
  }
  
  next();
});


membershipSchema.methods.isExpired = function() {
  return this.endDate && new Date() > this.endDate;
};


membershipSchema.methods.isSessionsExhausted = function() {
  if (this.serviceType === 'Unlimited') return false;
  return this.usedSessions >= this.numberOfSessions;
};

membershipSchema.methods.useSession = function() {
  if (this.serviceType === 'Limited' && this.usedSessions < this.numberOfSessions) {
    this.usedSessions += 1;
    this.lastUsedDate = new Date();
    
    if (this.isSessionsExhausted()) {
      this.status = 'Used';
    } else if (this.usedSessions > 0) {
      this.status = 'Partially Used';
    }
  }
  return this.save();
};

module.exports = mongoose.model('Membership', membershipSchema);
