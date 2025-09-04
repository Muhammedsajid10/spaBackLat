const express = require('express');
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { isClient, canManageBookings, logUserAction, isAdmin, isEmployeeOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

// ========================================
// PUBLIC BOOKING ROUTES (No Authentication Required)
// ========================================

// Get available services for booking
router.get('/services', bookingController.getAvailableServices);

// Get available professionals for a specific service and date
router.get('/professionals', bookingController.getAvailableProfessionals);

// Get available time slots for a professional
router.get('/time-slots', bookingController.getAvailableTimeSlots);

// Get employee schedule and available time slots for a specific date
router.use('/schedule', require('./publicBookingSchedule'));

// Create booking confirmation (public)
router.post('/confirmation', bookingController.createBookingConfirmation);

// ========================================
// AUTHENTICATED BOOKING ROUTES
// ========================================

// All routes below require authentication
router.use(protect);

// Create booking
router.post('/', bookingController.createBooking);

// Get user's bookings
router.get('/my-bookings', bookingController.getUserBookings);

// Get specific booking
router.get('/:id', bookingController.getBooking);

// Cancel booking
router.patch('/:id/cancel', bookingController.cancelBooking);

// Reschedule booking
router.patch('/:id/reschedule', bookingController.rescheduleBooking);

// Complete booking after authentication
router.post('/complete', bookingController.completeBooking);

// ========================================
// ADMIN ROUTES
// ========================================

// Admin can view all bookings
router.get('/admin/all', isAdmin, bookingController.getAllBookings);

// Admin can manage bookings
router.patch('/admin/:id', isAdmin, bookingController.updateBooking);
// Delete booking (admin or employee via generic path)
router.delete('/:id', canManageBookings, bookingController.deleteBooking);
// Admin alias delete path (some legacy frontend calls may use /admin/:id with DELETE)
router.delete('/admin/:id', isAdmin, bookingController.deleteBooking);
// Per-service operations
router.patch('/admin/:bookingId/service/:serviceId/status', isAdmin, bookingController.updateServiceStatus);
router.delete('/admin/:bookingId/service/:serviceId', isAdmin, bookingController.deleteServiceFromBooking);

module.exports = router;

