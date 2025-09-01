const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all feedback routes
router.use(protect);

// Feedback routes
router.post('/create', feedbackController.createFeedback);
router.get('/my-feedback', feedbackController.getUserFeedback);
router.get('/booking/:bookingId', feedbackController.getFeedbackByBooking);
router.put('/:feedbackId', feedbackController.updateFeedback);
router.delete('/:feedbackId', feedbackController.deleteFeedback);
router.get('/:feedbackId', feedbackController.getFeedbackById);

module.exports = router;
