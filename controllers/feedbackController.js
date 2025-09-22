const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create feedback
exports.createFeedback = catchAsync(async (req, res, next) => {
  // Add user ID from the authenticated user
  req.body.user = req.user.id;

  // Verify that the booking exists and belongs to the user
  const booking = await Booking.findById(req.body.booking);
  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.client.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You can only create feedback for your own bookings', 403));
  }

  // Check if feedback already exists for this booking
  const existingFeedback = await Feedback.findOne({ booking: req.body.booking });
  if (existingFeedback) {
    return next(new AppError('Feedback already exists for this booking', 400));
  }

  const feedback = await Feedback.create(req.body);
  await feedback.populate('booking service employee user');

  res.status(201).json({
    success: true,
    data: feedback
  });
});

// Get user's feedback
exports.getUserFeedback = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.find({ user: req.user.id })
    .populate('booking service employee')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    results: feedback.length,
    data: feedback
  });
});

// Get feedback by booking ID
exports.getFeedbackByBooking = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.findOne({ booking: req.params.bookingId })
    .populate('booking service employee user');

  if (!feedback) {
    return next(new AppError('Feedback not found for this booking', 404));
  }

  res.status(200).json({
    success: true,
    data: feedback
  });
});

// Get single feedback
exports.getFeedback = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id)
    .populate('booking service employee user');

  if (!feedback) {
    return next(new AppError('Feedback not found', 404));
  }

  res.status(200).json({
    success: true,
    data: feedback
  });
});

// Update feedback
exports.updateFeedback = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new AppError('Feedback not found', 404));
  }

  // Check if user owns this feedback or is admin
  if (feedback.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You can only update your own feedback', 403));
  }

  const updatedFeedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('booking service employee user');

  res.status(200).json({
    success: true,
    data: updatedFeedback
  });
});

// Delete feedback
exports.deleteFeedback = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new AppError('Feedback not found', 404));
  }

  // Check if user owns this feedback or is admin
  if (feedback.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own feedback', 403));
  }

  await Feedback.findByIdAndDelete(req.params.id);

  res.status(204).json({
    success: true,
    data: null
  });
});

// Get all feedback (admin only)
exports.getAllFeedback = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.find()
    .populate('booking service employee user')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    results: feedback.length,
    data: feedback
  });
});

// Get feedback stats (admin only)
exports.getFeedbackStats = catchAsync(async (req, res, next) => {
  const stats = await Feedback.aggregate([
    {
      $group: {
        _id: null,
        avgOverallRating: { $avg: '$ratings.overall' },
        avgServiceQuality: { $avg: '$ratings.serviceQuality' },
        avgStaffBehavior: { $avg: '$ratings.staffBehavior' },
        avgCleanliness: { $avg: '$ratings.cleanliness' },
        avgAmbiance: { $avg: '$ratings.ambiance' },
        avgValueForMoney: { $avg: '$ratings.valueForMoney' },
        avgPunctuality: { $avg: '$ratings.punctuality' },
        totalFeedback: { $sum: 1 },
        recommendationRate: {
          $avg: {
            $cond: [{ $eq: ['$wouldRecommend', true] }, 1, 0]
          }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: stats[0] || {}
  });
});
