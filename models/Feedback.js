const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required']
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Client is required']
  },
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required']
  },
  ratings: {
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    serviceQuality: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    staffBehavior: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    cleanliness: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    ambiance: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    valueForMoney: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    punctuality: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    }
  },
  comment: {
    type: String,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    trim: true
  },
  wouldRecommend: {
    type: Boolean,
    required: [true, 'Recommendation preference is required']
  },
  wouldReturnAsCustomer: {
    type: Boolean,
    required: [true, 'Return preference is required']
  },
  improvements: [{
    category: {
      type: String,
      enum: [
        'service-quality',
        'staff-training',
        'facility-cleanliness',
        'booking-process',
        'waiting-time',
        'pricing',
        'communication',
        'amenities',
        'accessibility',
        'other'
      ]
    },
    suggestion: String
  }],
  compliments: [{
    category: {
      type: String,
      enum: [
        'excellent-service',
        'professional-staff',
        'clean-facility',
        'great-ambiance',
        'value-for-money',
        'punctual-service',
        'friendly-staff',
        'relaxing-experience',
        'skilled-therapist',
        'other'
      ]
    },
    comment: String
  }],
  visitFrequency: {
    type: String,
    enum: ['first-time', 'occasional', 'regular', 'frequent'],
    required: [true, 'Visit frequency is required']
  },
  discoveryMethod: {
    type: String,
    enum: [
      'search-engine',
      'social-media',
      'friend-referral',
      'advertisement',
      'walk-by',
      'repeat-customer',
      'online-review',
      'promotional-offer',
      'other'
    ]
  },
  anonymousSubmission: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationNotes: String,
  moderatedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  moderatedAt: Date,
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  reportedCount: {
    type: Number,
    default: 0
  },
  reports: [{
    reportedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    reason: {
      type: String,
      enum: ['inappropriate-content', 'spam', 'fake-review', 'offensive-language', 'other']
    },
    description: String,
    reportedAt: { type: Date, default: Date.now }
  }],
  response: {
    content: String,
    respondedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    respondedAt: Date,
    isPublic: { type: Boolean, default: true }
  },
  tags: [String],
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  language: {
    type: String,
    default: 'en'
  },
  deviceInfo: {
    platform: String,
    browser: String,
    ipAddress: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for average rating across all categories
feedbackSchema.virtual('averageRating').get(function() {
  const ratings = this.ratings;
  const ratingValues = [
    ratings.overall,
    ratings.serviceQuality,
    ratings.staffBehavior,
    ratings.cleanliness,
    ratings.ambiance,
    ratings.valueForMoney,
    ratings.punctuality
  ].filter(rating => rating !== undefined && rating !== null);
  
  if (ratingValues.length === 0) return 0;
  
  const sum = ratingValues.reduce((total, rating) => total + rating, 0);
  return Math.round((sum / ratingValues.length) * 10) / 10;
});

// Virtual for feedback age in days
feedbackSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const createdDate = new Date(this.createdAt);
  const diffTime = now - createdDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is recent (within 30 days)
feedbackSchema.virtual('isRecent').get(function() {
  return this.ageInDays <= 30;
});

// Indexes for better query performance
feedbackSchema.index({ booking: 1 }, { unique: true });
feedbackSchema.index({ client: 1 });
feedbackSchema.index({ service: 1 });
feedbackSchema.index({ employee: 1 });
feedbackSchema.index({ 'ratings.overall': -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ isPublic: 1 });
feedbackSchema.index({ isFeatured: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ sentiment: 1 });

// Pre-save middleware to determine sentiment based on overall rating
feedbackSchema.pre('save', function(next) {
  if (this.ratings.overall) {
    if (this.ratings.overall >= 4) {
      this.sentiment = 'positive';
    } else if (this.ratings.overall >= 3) {
      this.sentiment = 'neutral';
    } else {
      this.sentiment = 'negative';
    }
  }
  next();
});

// Static method to calculate average ratings for a service
feedbackSchema.statics.calculateServiceRatings = async function(serviceId) {
  const stats = await this.aggregate([
    {
      $match: { 
        service: serviceId,
        status: 'approved',
        isPublic: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$ratings.overall' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$ratings.overall'
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const result = stats[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratingDistribution.forEach(rating => {
      distribution[Math.floor(rating)]++;
    });
    
    return {
      average: Math.round(result.averageRating * 10) / 10,
      count: result.totalReviews,
      distribution
    };
  }
  
  return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
};

// Static method to calculate average ratings for an employee
feedbackSchema.statics.calculateEmployeeRatings = async function(employeeId) {
  const stats = await this.aggregate([
    {
      $match: { 
        employee: employeeId,
        status: 'approved',
        isPublic: true
      }
    },
    {
      $group: {
        _id: null,
        averageOverall: { $avg: '$ratings.overall' },
        averageServiceQuality: { $avg: '$ratings.serviceQuality' },
        averageStaffBehavior: { $avg: '$ratings.staffBehavior' },
        averagePunctuality: { $avg: '$ratings.punctuality' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const result = stats[0];
    return {
      overall: Math.round(result.averageOverall * 10) / 10,
      serviceQuality: Math.round(result.averageServiceQuality * 10) / 10,
      staffBehavior: Math.round(result.averageStaffBehavior * 10) / 10,
      punctuality: Math.round(result.averagePunctuality * 10) / 10,
      count: result.totalReviews
    };
  }
  
  return { overall: 0, serviceQuality: 0, staffBehavior: 0, punctuality: 0, count: 0 };
};

// Populate related data when querying
feedbackSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'client',
    select: 'firstName lastName profileImage'
  }).populate({
    path: 'service',
    select: 'name category'
  }).populate({
    path: 'employee',
    select: 'user',
    populate: {
      path: 'user',
      select: 'firstName lastName'
    }
  });
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema);

