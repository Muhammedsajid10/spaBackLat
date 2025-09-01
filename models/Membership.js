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
  selectedServices: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    name: String,
    // For limited memberships
    sessionsAllowed: {
      type: Number,
      default: 1
    }
  }],
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
  
  // Membershipnte  Status and Dates
  status: { 
    type: String, 
    enum: ['Draft', 'Active', 'Used', 'Expired', 'Cancelled'], 
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
  sessionsUsed: {
    type: Number,
    default: 0
  },
  lastUsedDate: {
    type: Date
  },


  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: true // True membership templatestin, pinne false for purchased memberships
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
  return Math.max(0, this.numberOfSessions - this.sessionsUsed);
});

// Virtual for days remaining
membershipSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const today = new Date();
  const diffTime = this.endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Pre-save middleware end date calculate chayyan
membershipSchema.pre('save', function(next) {
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
  next();
});


membershipSchema.methods.isExpired = function() {
  return this.endDate && new Date() > this.endDate;
};


membershipSchema.methods.isSessionsExhausted = function() {
  if (this.serviceType === 'Unlimited') return false;
  return this.sessionsUsed >= this.numberOfSessions;
};


membershipSchema.methods.useSession = function() {
  if (this.serviceType === 'Limited' && this.sessionsUsed < this.numberOfSessions) {
    this.sessionsUsed += 1;
    this.lastUsedDate = new Date();
    
    if (this.isSessionsExhausted()) {
      this.status = 'Used';
    }
  }
  return this.save();
};

module.exports = mongoose.model('Membership', membershipSchema);
