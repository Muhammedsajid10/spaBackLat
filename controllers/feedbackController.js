const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create feedback
const createFeedback = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const {
    bookingId,
    serviceId,
    employeeId,
    ratings,
    comments,
    suggestions,
    wouldRecommend,
    wouldReturnAsCustomer,
    visitFrequency,
    discoveryMethod
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

  // Create feedback
  const feedback = await Feedback.create({
    booking: bookingId,
    client: userId,
    service: serviceId,
    employee: employeeId,
    ratings,
    comments,
    suggestions,
    wouldRecommend,
    wouldReturnAsCustomer,
    visitFrequency,
    discoveryMethod,
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
  getUserFeedback,
  getFeedbackByBooking,
  updateFeedback,
  deleteFeedback,
  getFeedbackById
};
