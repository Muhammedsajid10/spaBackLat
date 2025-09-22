const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Create feedback (protected route)
router.post('/create', protect, feedbackController.createFeedback);

// Get user's feedback
router.get('/my-feedback', protect, feedbackController.getUserFeedback);

// Get feedback by booking ID
router.get('/booking/:bookingId', protect, feedbackController.getFeedbackByBooking);

// Get single feedback by ID
router.get('/:id', protect, feedbackController.getFeedback);

// Update feedback
router.put('/:id', protect, feedbackController.updateFeedback);

// Delete feedback
router.delete('/:id', protect, feedbackController.deleteFeedback);

// Admin routes
router.get('/admin/all', protect, isAdmin, feedbackController.getAllFeedback);
router.get('/admin/stats', protect, isAdmin, feedbackController.getFeedbackStats);

module.exports = router;
