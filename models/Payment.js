const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    required: true,
  // Note: 'giftcard' and 'membership' are accepted for bookings but typically not persisted
  // as standalone Payment documents (no gateway). Extend enum if you plan to store them here.
  enum: ['card', 'bank_transfer', 'digital_wallet', 'cash']
  },
  paymentGateway: {
    type: String,
    required: true,
  enum: ['stripe', 'paypal', 'square', 'adyen', 'payu', '2c2p', 'mercadopago', 'razorpay']
  },
  gatewayTransactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  gatewayOrderId: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentIntent: {
    type: String,
    unique: true,
    sparse: true
  },
  clientSecret: {
    type: String
  },
  paymentUrl: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  errorMessage: {
    type: String
  },
  processedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gatewayTransactionId: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount / 100);
});

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.processedAt) {
    this.processedAt = new Date();
  }
  if (this.status === 'refunded' && !this.refundedAt) {
    this.refundedAt = new Date();
  }
  next();
});

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount
    };
    return acc;
  }, {});
};

module.exports = mongoose.model('Payment', paymentSchema); 
