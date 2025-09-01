const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Get available payment gateways (public info) - no authentication required
router.get('/gateways/available', paymentController.getAvailableGateways);

// Apply authentication middleware to protected payment routes
router.use(protect);

// Payment creation and management
router.post('/create', paymentController.createPayment);
router.post('/confirm', paymentController.confirmPayment);
router.post('/confirm/stripe', paymentController.confirmStripePayment);
router.post('/send-confirmation', paymentController.sendConfirmationEmail);
router.get('/status/:paymentId', paymentController.getPaymentStatus);
router.post('/refund/:paymentId', paymentController.refundPayment);
router.get('/history', paymentController.getPaymentHistory);
router.get('/:paymentId', paymentController.getPaymentById);

// Payment callbacks (no authentication required)
router.get('/success', paymentController.paymentSuccess);
router.get('/cancel', paymentController.paymentCancel);

// Webhook endpoints (no authentication required)
router.post('/webhook/stripe', paymentController.handleStripeWebhook);
// Removed legacy network_international webhook (Stripe only)

// Admin: get all payments
router.get('/admin/all', isAdmin, paymentController.getAllPayments);

module.exports = router; 
