const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create feedback
const createFeedback = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  // If client provided multiple items, delegate to batch handler so the same
  // route can be used for single or multiple service feedback submissions.
  if (Array.isArray(req.body.items)) {
    return createFeedbackBatch(req, res, next);
  }
  const {
    bookingId,
    serviceId,
    employeeId,
    rating, // overall rating number (1-5)
    comment
  } = req.body;

  // Validate booking exists and belongs to user
  const booking = await Booking.findById(bookingId).populate('client');
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.client._id.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only provide feedback for your own bookings'
    });
  }

  // Check if feedback already exists for this booking
  const existingFeedback = await Feedback.findOne({
    booking: bookingId,
    client: userId,
    service: serviceId,
    employee: employeeId
  });

  if (existingFeedback) {
    return res.status(400).json({
      success: false,
      message: 'Feedback already exists for this booking and service'
    });
  }

  // Create simplified feedback record
  const feedback = await Feedback.create({
    booking: bookingId,
    client: userId,
    service: serviceId,
    employee: employeeId,
    ratings: { overall: Number(rating) || 0 },
    comment: comment || '',
    submittedAt: new Date()
  });

  await feedback.populate([
    { path: 'booking', select: 'bookingNumber appointmentDate' },
    { path: 'service', select: 'name' },
    { path: 'employee', populate: { path: 'user', select: 'firstName lastName' } }
  ]);

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: {
      feedback
    }
  });
});

// Create multiple feedback entries for services within a single booking
const createFeedbackBatch = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { bookingId: topBookingId, items } = req.body; // items: [{ bookingId?, serviceId, employeeId, rating, comment }]
  const topLevelComment = req.body.comment;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No feedback items provided' });
  }

  // Collect bookingIds to validate. If a top-level bookingId is provided, prefer it.
  const bookingIds = new Set();
  if (topBookingId) bookingIds.add(topBookingId.toString());
  for (const it of items) {
    if (it.bookingId) bookingIds.add(it.bookingId.toString());
  }

  // Fetch bookings for validation (only those provided)
  const bookingIdArray = Array.from(bookingIds);
  const bookings = bookingIdArray.length > 0
    ? await Booking.find({ _id: { $in: bookingIdArray } }).populate('client')
    : [];

  const bookingsMap = {};
  for (const b of bookings) bookingsMap[b._id.toString()] = b;

  const results = [];

  for (const item of items) {
  const bid = (topBookingId && !item.bookingId) ? topBookingId : item.bookingId || topBookingId;
  const { serviceId, employeeId, rating } = item;
  // Prefer per-item comment, otherwise use top-level comment if provided
  const itemComment = (item.comment !== undefined && item.comment !== null) ? item.comment : (topLevelComment || '');

    // Validate booking presence for this item
    if (!bid) {
      results.push({ item, success: false, message: 'bookingId missing for item' });
      continue;
    }

    const booking = bookingsMap[bid.toString()];
    if (!booking) {
      results.push({ item, success: false, message: 'Booking not found' });
      continue;
    }

    // Validate booking ownership
    if (booking.client._id.toString() !== userId.toString()) {
      results.push({ item, success: false, message: 'You can only provide feedback for your own bookings' });
      continue;
    }

    // Basic per-item validation before attempting DB create
    if (!serviceId) {
      results.push({ item, success: false, message: 'Service is required' });
      continue;
    }

    if (!employeeId) {
      results.push({ item, success: false, message: 'Employee is required' });
      continue;
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      results.push({ item, success: false, message: 'Invalid input data. Rating must be between 1 and 5' });
      continue;
    }

    try {
      // Skip if duplicate exists (unique index protects, but check to return friendly message)
      const existing = await Feedback.findOne({ booking: bid, service: serviceId, employee: employeeId, client: userId });
      if (existing) {
        results.push({ item, success: false, message: 'Feedback already exists for this booking/service/employee' });
        continue;
      }

      const fb = await Feedback.create({
        booking: bid,
        client: userId,
        service: serviceId,
        employee: employeeId,
        ratings: { overall: numericRating },
        comment: itemComment || '',
        submittedAt: new Date()
      });

      await fb.populate([
        { path: 'booking', select: 'bookingNumber appointmentDate' },
        { path: 'service', select: 'name' },
        { path: 'employee', populate: { path: 'user', select: 'firstName lastName' } }
      ]);

      results.push({ item, success: true, feedback: fb });
    } catch (err) {
      // In case of unique index race or validation error, return failure for that item
      results.push({ item, success: false, message: err.message });
    }
  }

  // Summary
  const created = results.filter(r => r.success).length;
  const failed = results.length - created;

  res.status(207).json({ // 207 Multi-Status: per-item results
    success: failed === 0,
    summary: { total: results.length, created, failed },
    results
  });
});

// Get user's feedback
const getUserFeedback = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const feedback = await Feedback.find({ client: userId })
    .populate([
      { path: 'booking', select: 'bookingNumber appointmentDate' },
      { path: 'service', select: 'name' },
      { path: 'employee', populate: { path: 'user', select: 'firstName lastName' } }
    ])
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Feedback.countDocuments({ client: userId });

  res.status(200).json({
    success: true,
    data: {
      feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get feedback by booking
const getFeedbackByBooking = catchAsync(async (req, res, next) => {
  const { bookingId } = req.params;
  const userId = req.user._id;

  // Validate booking belongs to user
  const booking = await Booking.findById(bookingId).populate('client');
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.client._id.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only view feedback for your own bookings'
    });
  }

  const feedback = await Feedback.find({ booking: bookingId })
    .populate([
      { path: 'service', select: 'name' },
      { path: 'employee', populate: { path: 'user', select: 'firstName lastName' } }
    ])
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      feedback
    }
  });
});

// Update feedback
const updateFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params;
  const userId = req.user._id;
  const updates = req.body;

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    return res.status(404).json({
      success: false,
      message: 'Feedback not found'
    });
  }

  if (feedback.client.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own feedback'
    });
  }

  // Update feedback
  const updatedFeedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate([
    { path: 'booking', select: 'bookingNumber appointmentDate' },
    { path: 'service', select: 'name' },
    { path: 'employee', populate: { path: 'user', select: 'firstName lastName' } }
  ]);

  res.status(200).json({
    success: true,
    message: 'Feedback updated successfully',
    data: {
      feedback: updatedFeedback
    }
  });
});

// Delete feedback
const deleteFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params;
  const userId = req.user._id;

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    return res.status(404).json({
      success: false,
      message: 'Feedback not found'
    });
  }

  if (feedback.client.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own feedback'
    });
  }

  await Feedback.findByIdAndDelete(feedbackId);

  res.status(200).json({
    success: true,
    message: 'Feedback deleted successfully'
  });
});

// Get feedback by ID
const getFeedbackById = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params;
  const userId = req.user._id;

  const feedback = await Feedback.findById(feedbackId)
    .populate([
      { path: 'booking', select: 'bookingNumber appointmentDate' },
      { path: 'service', select: 'name' },
      { path: 'employee', populate: { path: 'user', select: 'firstName lastName' } }
    ]);

  if (!feedback) {
    return res.status(404).json({
      success: false,
      message: 'Feedback not found'
    });
  }

  if (feedback.client.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own feedback'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      feedback
    }
  });
});

module.exports = {
  createFeedback,
  createFeedbackBatch,
  getUserFeedback,
  getFeedbackByBooking,
  updateFeedback,
  deleteFeedback,
  getFeedbackById
};
