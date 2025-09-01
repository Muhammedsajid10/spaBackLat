const mongoose = require('mongoose');
const crypto = require('crypto');

const giftCardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Gift card name is required'],
    trim: true,
    maxlength: [100, 'Gift card name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  value: {
    type: Number,
    required: [true, 'Gift card value is required'],
    min: [1, 'Gift card value must be at least $1']
  },
  price: {
    type: Number,
    required: [true, 'Gift card price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['Active', 'Used', 'Expired', 'Cancelled', 'Partially Used'],
    default: 'Active'
  },
  remainingValue: {
    type: Number,
    required: true
  },
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  recipientName: {
    type: String,
    trim: true
  },
  recipientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  recipientPhone: {
    type: String,
    trim: true
  },
  personalMessage: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageHistory: [{
    usedDate: {
      type: Date,
      default: Date.now
    },
    amountUsed: {
      type: Number,
      required: true
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    notes: String
  }],
  isTemplate: {
    type: Boolean,
    default: false
  },
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

giftCardSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

giftCardSchema.virtual('isFullyUsed').get(function() {
  return this.remainingValue <= 0;
});

giftCardSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    this.code = this.generateUniqueCode();
  }
  
  if (this.isNew && !this.remainingValue) {
    this.remainingValue = this.value;
  }

  if (this.isNew && !this.purchasePrice) {
    this.purchasePrice = this.price;
  }

  next();
});

giftCardSchema.methods.generateUniqueCode = function() {
  const prefix = 'GC';
  const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}${randomString}${timestamp}`;
};

giftCardSchema.methods.useGiftCard = function(amount, userId, bookingId, notes) {
  if (this.isExpired) {
    throw new Error('Gift card has expired');
  }
  
  if (this.remainingValue < amount) {
    throw new Error('Insufficient gift card balance');
  }

  if (this.status === 'Used' || this.status === 'Cancelled') {
    throw new Error('Gift card is not available for use');
  }

  this.usageHistory.push({
    amountUsed: amount,
    usedBy: userId,
    bookingId: bookingId,
    notes: notes
  });

  this.remainingValue -= amount;

  if (this.remainingValue <= 0) {
    this.status = 'Used';
  } else {
    this.status = 'Partially Used';
  }

  return this.save();
};

giftCardSchema.methods.validateForUse = function() {
  const errors = [];
  
  if (this.isExpired) {
    errors.push('Gift card has expired');
  }
  
  if (this.remainingValue <= 0) {
    errors.push('Gift card has no remaining balance');
  }
  
  if (!this.isActive) {
    errors.push('Gift card is not active');
  }
  
  if (this.status === 'Cancelled') {
    errors.push('Gift card has been cancelled');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

giftCardSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

module.exports = mongoose.model('GiftCard', giftCardSchema);
