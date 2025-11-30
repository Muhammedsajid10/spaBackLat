const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Client reference is required']
  },
  type: {
    type: String,
    enum: ['client', 'appointment'],
    default: 'client'
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    maxlength: [5000, 'Note cannot exceed 5000 characters'],
    trim: true
  },
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: function() {
      return this.type === 'appointment';
    }
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
noteSchema.index({ client: 1, type: 1, createdAt: -1 });
noteSchema.index({ booking: 1 });
noteSchema.index({ createdBy: 1 });

// Virtual for formatted creation date
noteSchema.virtual('formattedCreatedAt').get(function() {
  if (!this.createdAt) return '';
  return this.createdAt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
