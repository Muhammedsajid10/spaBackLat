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
  console.log('[GiftCard.useGiftCard] Called with:', { amount, userId, bookingId, notes });
  if (this.isExpired) {
    console.error('[GiftCard.useGiftCard] Gift card expired:', this.code);
    throw new Error('Gift card has expired');
  }
  if (this.remainingValue < amount) {
    console.error('[GiftCard.useGiftCard] Insufficient balance:', { code: this.code, remainingValue: this.remainingValue, amount });
    throw new Error('Insufficient gift card balance');
  }
  if (this.status === 'Used' || this.status === 'Cancelled') {
    console.error('[GiftCard.useGiftCard] Gift card not available for use:', { code: this.code, status: this.status });
    throw new Error('Gift card is not available for use');
  }
  this.usageHistory.push({
    amountUsed: amount,
    usedBy: userId,
    bookingId: bookingId,
    notes: notes
  });
  this.remainingValue -= amount;
  
  // Round to 2 decimal places to avoid floating point precision issues
  this.remainingValue = Math.round(this.remainingValue * 100) / 100;
  
  console.log('[GiftCard.useGiftCard] After deduction:', { code: this.code, remainingValue: this.remainingValue });
  
  // Use tolerance check for floating point comparison
  if (this.remainingValue < 0.01) {
    this.remainingValue = 0; // Set exactly to 0
    this.status = 'Used';
    console.log('[GiftCard.useGiftCard] Status updated to Used:', this.code);
  } else {
    this.status = 'Partially Used';
    console.log('[GiftCard.useGiftCard] Status updated to Partially Used:', this.code);
  }
  return this.save().then(result => {
    console.log('[GiftCard.useGiftCard] Saved:', { code: this.code, status: this.status, remainingValue: this.remainingValue });
    return result;
  });
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
