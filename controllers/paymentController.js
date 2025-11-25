const paymentService = require('../services/paymentService');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// Helper function to handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Create payment intent (supports optional metadata like UPI VPA)
const createPayment = catchAsync(async (req, res, next) => {
  let { bookingId, amount, currency, paymentMethod, gateway } = req.body;
  // Backward compatibility: map deprecated gateway name to stripe
  if (gateway === 'network_international') {
    console.log('Mapping deprecated gateway network_international to stripe');
    gateway = 'stripe';
  }
  const userId = req.user._id;

  // Validate required fields
  if (!bookingId || !amount || !currency || !paymentMethod || !gateway) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: bookingId, amount, currency, paymentMethod, gateway'
    });
  }

  // Validate amount
  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0'
    });
  }

  // Validate currency
  const validCurrencies = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'];
  if (!validCurrencies.includes(currency.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid currency. Supported currencies: ${validCurrencies.join(', ')}`
    });
  }

  // Validate payment method
  const validPaymentMethods = ['card', 'bank_transfer', 'digital_wallet', 'cash', 'giftcard', 'membership'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: `Invalid payment method. Supported methods: ${validPaymentMethods.join(', ')}`
    });
  }

  // Validate gateway (stripe only)
  const validGateways = ['stripe'];
  if (!validGateways.includes(gateway)) {
    return res.status(400).json({
      success: false,
      message: `Invalid payment gateway. Supported gateway: stripe`
    });
  }

  // Check if this is a membership purchase (temporary booking ID)
  const isMembershipPurchase = bookingId.startsWith('membership-purchase-');
  let booking = null;
  
  if (!isMembershipPurchase) {
    // For regular bookings, check if booking exists and belongs to user
    booking = await Booking.findOne({ bookingNumber: bookingId });
    console.log('Payment: Looking for booking with bookingNumber:', bookingId);
    console.log('Payment: Found booking:', booking ? {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      client: booking.client,
      clientType: typeof booking.client
    } : 'Not found');
    console.log('Payment: Current user:', {
      id: userId,
      type: typeof userId
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
  } else {
    console.log('Payment: Detected membership purchase, skipping booking validation');
  }

  if (!isMembershipPurchase) {
    // Temporarily bypass the client ID check for debugging
    console.log('Payment: TEMPORARILY BYPASSING CLIENT ID CHECK FOR DEBUGGING');
    console.log('- Booking client ID:', booking.client.toString());
    console.log('- Payment user ID:', userId.toString());
    
    // TODO: Re-enable this check after debugging
    // Client ID check temporarily disabled for debugging purposes

    // Check if payment already exists for this booking
    const existingPayment = await Payment.findOne({ booking: booking._id });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this booking',
        paymentId: existingPayment._id
      });
    }
  }

  // Optional metadata collection (e.g., UPI)
  const metadata = {};
  if (req.body.upiVpa) {
    metadata.upiVpa = String(req.body.upiVpa).trim();
  }
  if (req.body.note) {
    metadata.note = String(req.body.note).trim();
  }
  if (metadata.upiVpa) {
    console.log('Payment create: received UPI VPA', metadata.upiVpa);
  }

  // Create payment (pass metadata)
  const result = await paymentService.createPayment(
    isMembershipPurchase ? null : booking._id,  // Use null for membership purchases
    userId,
    amount,
    currency,
    paymentMethod,
    gateway,
    { ...metadata, bookingId: bookingId } // Include original bookingId in metadata
  );

  res.status(201).json({
    success: true,
    message: 'Payment intent created successfully',
    data: result
  });
});

// Confirm payment
const confirmPayment = catchAsync(async (req, res, next) => {
  const { paymentId, gateway } = req.body;
  const userId = req.user._id;

  if (!paymentId || !gateway) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: paymentId, gateway'
    });
  }

  // Check if payment exists and belongs to user
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.user.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only confirm your own payments'
    });
  }

  // Confirm payment
  const result = await paymentService.confirmPayment(paymentId, gateway);

  res.status(200).json({
    success: true,
    message: 'Payment confirmed successfully',
    data: result
  });
});

// Get payment status
const getPaymentStatus = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;
  const userId = req.user._id;

  // Check if payment exists and belongs to user
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.user.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only check your own payments'
    });
  }

  // Get payment status
  const result = await paymentService.getPaymentStatus(paymentId);

  res.status(200).json({
    success: true,
    data: result
  });
});

// Refund payment
const refundPayment = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;
  const userId = req.user._id;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Refund reason is required'
    });
  }

  // Check if payment exists and belongs to user
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.user.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only refund your own payments'
    });
  }

  if (payment.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Only completed payments can be refunded'
    });
  }

  // Refund payment
  const result = await paymentService.refundPayment(paymentId, amount, reason);

  res.status(200).json({
    success: true,
    message: 'Payment refunded successfully',
    data: result
  });
});

// Get payment history
const getPaymentHistory = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { limit = 10, page = 1 } = req.query;

  const result = await paymentService.getPaymentHistory(userId, parseInt(limit));

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get payment by ID
const getPaymentById = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;
  const userId = req.user._id;

  const payment = await Payment.findById(paymentId)
    .populate('booking', 'services date time status')
    .populate('user', 'firstName lastName email');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.user._id.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own payments'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      id: payment._id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentGateway: payment.paymentGateway,
      createdAt: payment.createdAt,
      booking: payment.booking,
      user: payment.user
    }
  });
});

// Get available payment gateways
const getAvailableGateways = catchAsync(async (req, res, next) => {
  const gateways = [];
  
  // Add Stripe gateway
  if (process.env.STRIPE_SECRET_KEY) {
    gateways.push({
      name: 'stripe',
      displayName: 'Stripe',
      description: 'Credit/Debit Cards, Apple Pay, Google Pay, Digital Wallets',
      supportedCurrencies: ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR', 'JPY', 'CAD', 'AUD', 'CHF'],
      supportedMethods: ['card', 'apple_pay', 'google_pay', 'digital_wallet', 'bank_transfer'],
      region: 'Global',
      logo: 'https://images.ctfassets.net/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg'
    });
  }
  
  // Removed network_international gateway (using Stripe only)

  res.status(200).json({
    success: true,
    data: {
      gateways,
      defaultCurrency: 'AED',
      supportedCurrencies: ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR', 'JPY', 'CAD', 'AUD', 'CHF']
    }
  });
});

// Confirm Stripe payment
const confirmStripePayment = catchAsync(async (req, res, next) => {
  const { paymentIntentId, clientSecret, bookingId } = req.body;
  const userId = req.user._id;

  console.log('Confirming Stripe payment:', {
    paymentIntentId,
    clientSecret: clientSecret ? 'present' : 'missing',
    bookingId,
    userId
  });

  if (!paymentIntentId || !clientSecret || !bookingId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: paymentIntentId, clientSecret, bookingId'
    });
  }

  try {
    // Use the Stripe service to confirm the payment with test payment method
    const StripeService = require('../services/stripeService');
    const stripeService = new StripeService({
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'test'
    });
    
    // Confirm the payment using the test payment method
    const confirmedPayment = await stripeService.confirmPaymentWithTestCard(paymentIntentId);
    
    // Find the booking to update payment status
    console.log('Looking for booking with bookingId:', bookingId);
    
    // Try to find booking by bookingNumber first, then by _id
    let booking = await Booking.findOne({ bookingNumber: bookingId });
    if (!booking) {
      console.log('Booking not found by bookingNumber, trying by _id...');
      booking = await Booking.findById(bookingId);
    }
    
    console.log('Found booking:', booking ? {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status
    } : 'Not found');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Find the payment record and update it
    const payment = await Payment.findOne({ booking: booking._id });
    if (payment) {
      payment.status = 'completed';
      payment.transactionId = confirmedPayment.id;
      payment.gatewayResponse = confirmedPayment;
      await payment.save();
    }

    // Update booking status to confirmed
    booking.status = 'confirmed';
    await booking.save();

    // Send confirmation email
    try {
      const EmailService = require('../services/emailService');
      const emailService = new EmailService();
      
      // Populate booking with full details for email
      const fullBooking = await Booking.findById(booking._id)
        .populate('client', 'firstName lastName email')
        .populate('services.service', 'name')
        .populate('services.employee', 'firstName lastName');
      
      await emailService.sendBookingConfirmation(fullBooking, {
        amount: confirmedPayment.amount,
        paymentId: confirmedPayment.id
      });
      
      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the payment if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        paymentIntent: confirmedPayment,
        payment: payment,
        booking: booking
      }
    });

  } catch (error) {
    console.error('Error confirming Stripe payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// Send confirmation email
const sendConfirmationEmail = catchAsync(async (req, res, next) => {
  const { bookingId } = req.body;
  const userId = req.user?._id;

  if (!bookingId) {
    console.error('[sendConfirmationEmail] No bookingId provided in request body');
    return res.status(400).json({
      success: false,
      message: 'Booking ID is required'
    });
  }

  try {
    console.log('[sendConfirmationEmail] Attempting to find booking with ID:', bookingId);
    let booking;
    if (typeof bookingId === 'string' && bookingId.startsWith('BK')) {
      console.log('[sendConfirmationEmail] Looking up by booking number:', bookingId);
      booking = await Booking.findOne({ bookingNumber: bookingId })
        .populate('client', 'firstName lastName email')
        .populate('services.service', 'name')
        .populate('services.employee', 'firstName lastName');
    } else {
      try {
        console.log('[sendConfirmationEmail] Looking up by ObjectId:', bookingId);
        booking = await Booking.findById(bookingId)
          .populate('client', 'firstName lastName email')
          .populate('services.service', 'name')
          .populate('services.employee', 'firstName lastName');
      } catch (err) {
        console.error('[sendConfirmationEmail] Error finding by ObjectId:', err.message);
        booking = await Booking.findOne({ bookingNumber: bookingId })
          .populate('client', 'firstName lastName email')
          .populate('services.service', 'name')
          .populate('services.employee', 'firstName lastName');
      }
    }

    if (!booking) {
      console.error('[sendConfirmationEmail] Booking not found for ID:', bookingId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('[sendConfirmationEmail] Found booking:', {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      clientId: booking.client?._id,
      clientEmail: booking.client?.email
    });

    if (!userId) {
      console.error('[sendConfirmationEmail] No userId found in req.user');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (booking.client._id.toString() !== userId.toString()) {
      console.error('[sendConfirmationEmail] Unauthorized: User ID does not match booking client', {
        clientId: booking.client._id.toString(),
        userId: userId.toString()
      });
      return res.status(403).json({
        success: false,
        message: 'You can only send emails for your own bookings'
      });
    }

    const payment = await Payment.findOne({ booking: booking._id });
    console.log('[sendConfirmationEmail] Payment found:', payment ? 'yes' : 'no', payment);

    const EmailService = require('../services/emailService');
    const emailService = new EmailService();

    try {
      console.log('[sendConfirmationEmail] Sending confirmation email for booking:', booking.bookingNumber);
      const emailResult = await emailService.sendBookingConfirmation(booking, {
        amount: payment?.amount || booking.totalAmount,
        paymentId: payment?.transactionId || 'N/A'
      });
      console.log('[sendConfirmationEmail] Email sent successfully with messageId:', emailResult.messageId);
      res.status(200).json({
        success: true,
        message: 'Confirmation email sent successfully',
        data: {
          messageId: emailResult.messageId,
          email: booking.client.email
        }
      });
    } catch (emailErr) {
      console.error('[sendConfirmationEmail] Error sending confirmation email:', emailErr);
      // Include any sendgrid response details if present to help debugging
      const sendgridInfo = (emailErr.message && emailErr.message.includes('| sendgrid:')) ? emailErr.message.split('| sendgrid:')[1] : undefined;
      res.status(500).json({
        success: false,
        message: 'Failed to send confirmation email',
        error: emailErr.message,
        sendgrid: sendgridInfo,
        stack: emailErr.stack
      });
    }
  } catch (error) {
    console.error('[sendConfirmationEmail] General error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email',
      error: error.message,
      stack: error.stack
    });
  }
});

// Stripe webhook handler
const handleStripeWebhook = catchAsync(async (req, res, next) => {
  try {
    console.log('Stripe Webhook received');
    
    const signature = req.headers['stripe-signature'];
    const result = await paymentService.processStripeWebhook(req.body, signature);
    
    res.status(200).json({
      success: true,
      message: 'Stripe webhook processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Stripe Webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'Stripe webhook processing failed',
      error: error.message
    });
  }
});


// Payment success callback
const paymentSuccess = catchAsync(async (req, res, next) => {
  const { paymentId, orderId, transactionId, status } = req.query;

  if (!paymentId) {
    return res.status(400).json({
      success: false,
      message: 'Payment ID is required'
    });
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  // Update payment status if provided
  if (status && orderId && transactionId) {
    payment.status = status === 'SUCCESS' ? 'completed' : 'failed';
    payment.gatewayTransactionId = transactionId;
    payment.gatewayOrderId = orderId;
    await payment.save();

    // Update booking status if payment successful
    if (payment.status === 'completed') {
      await Booking.findByIdAndUpdate(payment.booking, {
        status: 'confirmed',
        paymentStatus: 'paid'
      });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Payment processed successfully',
    data: {
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount / 100,
      currency: payment.currency
    }
  });
});

// Payment cancel callback
const paymentCancel = catchAsync(async (req, res, next) => {
  const { paymentId } = req.query;

  if (!paymentId) {
    return res.status(400).json({
      success: false,
      message: 'Payment ID is required'
    });
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  // Update payment status to cancelled
  payment.status = 'cancelled';
  await payment.save();

  res.status(200).json({
    success: true,
    message: 'Payment cancelled',
    data: {
      paymentId: payment._id,
      status: payment.status
    }
  });
});

// Cash Movement Summary for a given date
const getCashMovementSummary = async (req, res) => {
  let { date } = req.query; // Expecting YYYY-MM-DD
  
  // If no date provided, use today's date
  if (!date) {
    date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Date must be in YYYY-MM-DD format' 
    });
  }
  
  const start = new Date(date + 'T00:00:00.000Z');
  const end = new Date(date + 'T23:59:59.999Z');

  try {
    // Aggregate payments by paymentMethod and status with count
    const payments = await Payment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { paymentMethod: "$paymentMethod", status: "$status" },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format the result
    const summary = {};
    payments.forEach(item => {
      const method = item._id.paymentMethod;
      const status = item._id.status;
      if (!summary[method]) summary[method] = { paymentsCollected: 0, refundsPaid: 0, paymentsCount: 0, refundsCount: 0 };
      if (status === "completed") {
        summary[method].paymentsCollected += item.total;
        summary[method].paymentsCount += item.count;
      }
      if (status === "refunded") {
        summary[method].refundsPaid += item.total;
        summary[method].refundsCount += item.count;
      }
    });

    res.json({ success: true, data: summary, date: date });
  } catch (err) {
    console.error('Cash movement summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cash movement summary', error: err.message });
  }
};

// Get all payments (admin only) with optional single-day filter (?date=YYYY-MM-DD)
const getAllPayments = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 50, date } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {};
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
    }
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');
    query.createdAt = { $gte: start, $lte: end };
  }

  // First, get all payments with populated booking data
  const allPayments = await Payment.find(query)
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'booking',
      select: 'bookingNumber appointmentDate status',
    })
    .sort({ createdAt: -1 });

  console.log(`📊 Total payments found: ${allPayments.length}`);

  // Filter payments where booking status is 'completed'
  const completedPayments = allPayments.filter(payment => {
    const hasBooking = !!payment.booking;
    const isCompleted = hasBooking && payment.booking.status === 'completed';
    
    if (!hasBooking) {
      console.log(`⏭️ Skipping payment ${payment._id} - No booking attached`);
    } else if (!isCompleted) {
      console.log(`⏭️ Skipping payment ${payment._id} - Booking status: ${payment.booking.status}`);
    }
    
    return isCompleted;
  });

  console.log(`✅ Completed payments (booking status = completed): ${completedPayments.length}`);

  // Apply pagination to filtered results
  const paginatedPayments = completedPayments.slice(skip, skip + parseInt(limit));

  res.status(200).json({
    success: true,
    results: paginatedPayments.length,
    total: completedPayments.length,
    filtered: !!date,
    date: date || null,
    data: { payments: paginatedPayments }
  });
});

// Admin function to fix pending payment statuses
const fixPendingPaymentStatus = catchAsync(async (req, res, next) => {
  console.log('🔧 Admin request to fix pending payments');
  
  try {
    // Find all pending payments
    const pendingPayments = await Payment.find({ status: 'pending' })
      .populate('booking', 'status bookingNumber')
      .populate('user', 'firstName lastName email');
    
    console.log(`Found ${pendingPayments.length} pending payments`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const payment of pendingPayments) {
      let shouldUpdate = false;
      let reason = '';
      
      // Check if booking exists and is confirmed
      if (payment.booking && payment.booking.status === 'confirmed') {
        shouldUpdate = true;
        reason = 'Booking is confirmed';
      }
      // Check if payment has transaction ID (processed by gateway)
      else if (payment.gatewayTransactionId || payment.paymentIntent) {
        shouldUpdate = true;
        reason = 'Has transaction/payment intent ID';
      }
      // Check if payment was created more than 1 hour ago (likely processed)
      else if (payment.createdAt && (Date.now() - payment.createdAt.getTime()) > 3600000) {
        shouldUpdate = true;
        reason = 'Payment is old (likely processed)';
      }
      
      if (shouldUpdate) {
        console.log(`✅ Updating payment ${payment._id} to completed - ${reason}`);
        payment.status = 'completed';
        payment.processedAt = new Date();
        await payment.save();
        updatedCount++;
      } else {
        console.log(`⏸️ Skipping payment ${payment._id} - No clear completion indicators`);
        skippedCount++;
      }
    }
    
    console.log(`🎯 Fixed ${updatedCount} payments, skipped ${skippedCount}`);
    
    res.status(200).json({
      success: true,
      message: `Successfully fixed ${updatedCount} payments`,
      total: pendingPayments.length,
      updated: updatedCount,
      skipped: skippedCount,
      details: {
        totalPending: pendingPayments.length,
        updatedToCompleted: updatedCount,
        remainingPending: skippedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error fixing pending payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix pending payments',
      error: error.message
    });
  }
});

// Get daily transaction summary - Services, Gift Cards, Memberships
const getDailyTransactionSummary = async (req, res) => {
  let { date } = req.query; // Expecting YYYY-MM-DD
  
  // If no date provided, use today's date
  if (!date) {
    date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Date must be in YYYY-MM-DD format' 
    });
  }
  
  const start = new Date(date + 'T00:00:00.000Z');
  const end = new Date(date + 'T23:59:59.999Z');

  try {
    const GiftCard = require('../models/GiftCard');
    const Membership = require('../models/Membership');

    // Get service bookings for the day
    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end }
    }).select('status finalAmount services');

    // Calculate services sales and refunds
    let servicesSalesQty = 0;
    let servicesRefundQty = 0;
    let servicesGrossTotal = 0;

    bookings.forEach(booking => {
      if (booking.status === 'completed' || booking.status === 'confirmed') {
        servicesSalesQty += booking.services?.length || 0;
        servicesGrossTotal += booking.finalAmount || 0;
      } else if (booking.status === 'cancelled') {
        servicesRefundQty += booking.services?.length || 0;
      }
    });

    // Get gift cards purchased for the day (using createdAt instead of purchaseDate)
    const giftCards = await GiftCard.find({
      createdAt: { $gte: start, $lte: end },
      isTemplate: false // Only count purchased gift cards, not templates
    }).select('status value purchasePrice');

    const giftCardSalesQty = giftCards.filter(gc => 
      gc.status === 'Active' || gc.status === 'Used' || gc.status === 'Partially Used'
    ).length;
    const giftCardRefundQty = giftCards.filter(gc => gc.status === 'Cancelled').length;
    const giftCardGrossTotal = giftCards
      .filter(gc => gc.status === 'Active' || gc.status === 'Used' || gc.status === 'Partially Used')
      .reduce((sum, gc) => sum + (gc.purchasePrice || gc.value || 0), 0);

    // Get memberships purchased for the day (using createdAt and excluding templates)
    const memberships = await Membership.find({
      createdAt: { $gte: start, $lte: end },
      isTemplate: false // Only count purchased memberships, not templates
    }).select('status price');

    const membershipSalesQty = memberships.filter(m => 
      m.status === 'Active' || m.status === 'Partially Used' || m.status === 'Used'
    ).length;
    const membershipRefundQty = memberships.filter(m => m.status === 'Cancelled').length;
    const membershipGrossTotal = memberships
      .filter(m => m.status === 'Active' || m.status === 'Partially Used' || m.status === 'Used')
      .reduce((sum, m) => sum + (m.price || 0), 0);

    const summary = {
      'Services': {
        salesQty: servicesSalesQty,
        refundQty: servicesRefundQty,
        grossTotal: servicesGrossTotal
      },
      'Gift cards': {
        salesQty: giftCardSalesQty,
        refundQty: giftCardRefundQty,
        grossTotal: giftCardGrossTotal
      },
      'Membership card': {
        salesQty: membershipSalesQty,
        refundQty: membershipRefundQty,
        grossTotal: membershipGrossTotal
      }
    };

    res.json({ success: true, data: summary, date: date });
  } catch (err) {
    console.error('Daily transaction summary error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch daily transaction summary', 
      error: err.message 
    });
  }
};

module.exports = {
  createPayment,
  confirmPayment,
  confirmStripePayment,
  sendConfirmationEmail,
  getPaymentStatus,
  refundPayment,
  getPaymentHistory,
  getPaymentById,
  getAvailableGateways,
  handleStripeWebhook,
  paymentSuccess,
  paymentCancel,
  getCashMovementSummary,
  getAllPayments,
  fixPendingPaymentStatus,
  getDailyTransactionSummary
}; 
