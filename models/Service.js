const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Service category is required']
  },
  duration: {
    type: Number,
    required: [true, 'Service duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(val) {
        return !val || val < this.price;
      },
      message: 'Discount price must be less than regular price'
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  requirements: {
    minAge: { type: Number, min: 0, max: 100 },
    maxAge: { type: Number, min: 0, max: 100 },
    gender: { type: String, enum: ['male', 'female', 'any'], default: 'any' },
    specialInstructions: String
  },
  benefits: [String],
  contraindications: [String],
  preparationInstructions: [String],
  aftercareInstructions: [String],
  equipment: [String],
  products: [String],
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  availableEmployees: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  bookingSettings: {
    advanceBookingDays: { type: Number, default: 30 },
    cancellationPolicy: { type: Number, default: 24 }, // hours before appointment
    reschedulePolicy: { type: Number, default: 12 }, // hours before appointment
    maxBookingsPerDay: { type: Number, default: 10 },
    bufferTime: { type: Number, default: 15 } // minutes between appointments
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  tags: [String],
  seoData: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for effective price (considering discount)
serviceSchema.virtual('effectivePrice').get(function() {
  return this.discountPrice || this.price;
});

// Virtual for discount percentage
serviceSchema.virtual('discountPercentage').get(function() {
  if (this.discountPrice && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// Indexes for better query performance
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ isPopular: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ 'ratings.average': -1 });
serviceSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to ensure only one primary image
serviceSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    let primaryCount = 0;
    this.images.forEach(image => {
      if (image.isPrimary) primaryCount++;
    });
    
    if (primaryCount === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryCount > 1) {
      let firstPrimaryFound = false;
      this.images.forEach(image => {
        if (image.isPrimary && firstPrimaryFound) {
          image.isPrimary = false;
        } else if (image.isPrimary) {
          firstPrimaryFound = true;
        }
      });
    }
  }
  next();
});

module.exports = mongoose.model('Service', serviceSchema);

