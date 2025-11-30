const mongoose = require('mongoose');

const allergySchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Client reference is required']
  },
  type: {
    type: String,
    enum: ['non-drug', 'drug', 'no-known'],
    required: [true, 'Allergy type is required']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [200, 'Allergy name cannot exceed 200 characters'],
    required: function() {
      // Name is required for drug and non-drug allergies, not for no-known
      return this.type === 'drug' || this.type === 'non-drug';
    }
  },
  reaction: {
    type: String,
    trim: true,
    maxlength: [200, 'Reaction cannot exceed 200 characters'],
    required: function() {
      // Reaction is required for drug and non-drug allergies, not for no-known
      return this.type === 'drug' || this.type === 'non-drug';
    }
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'fatal', ''],
    default: ''
  },
  note: {
    type: String,
    maxlength: [1000, 'Note cannot exceed 1000 characters'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  resolvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
allergySchema.index({ client: 1, status: 1 });
allergySchema.index({ client: 1, type: 1 });
allergySchema.index({ createdAt: -1 });

// Virtual for formatted creation date
allergySchema.virtual('formattedCreatedAt').get(function() {
  if (!this.createdAt) return '';
  return this.createdAt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
});

// Pre-save validation
allergySchema.pre('save', function(next) {
  // If type is 'no-known', clear name and reaction
  if (this.type === 'no-known') {
    this.name = undefined;
    this.reaction = undefined;
    this.severity = '';
  }
  next();
});

const Allergy = mongoose.model('Allergy', allergySchema);

module.exports = Allergy;
