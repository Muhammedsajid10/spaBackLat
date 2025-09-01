const express = require('express');
const authController = require('../controllers/authController');
const { protect, loginLimiter, signupLimiter, passwordResetLimiter } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.post('/signup', signupLimiter, authController.signup);
router.post('/login', loginLimiter, authController.login);
router.post('/facebook', loginLimiter, authController.facebookAuth);
router.post('/google', loginLimiter, authController.googleAuth);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware are protected

// Admin-only routes
// router.post('/create-admin', protect, authController.createAdminUser); // Only existing admins can create new admins

router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.patch('/update-me', authController.updateMe);
router.delete('/delete-me', authController.deleteMe);
router.patch('/update-password', authController.updatePassword);
router.post('/refresh-token', authController.refreshToken);

// Admin routes
router.post('/admin/verify-email', isAdmin, authController.adminVerifyUserEmail);

module.exports = router;

