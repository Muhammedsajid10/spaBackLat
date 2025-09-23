const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const passwordController = require('../controllers/passwordController');

const router = express.Router();

// Protect all routes
router.use(protect);

// Generate random password (admin only)
router.get('/generate', restrictTo('admin'), passwordController.generateRandomPassword);

// Reset user password (admin only)
router.post('/reset/:userId', restrictTo('admin'), passwordController.resetUserPassword);

module.exports = router;