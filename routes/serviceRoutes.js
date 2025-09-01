const express = require('express');
const serviceController = require('../controllers/serviceController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { isAdminOnly, logUserAction } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes (no authentication required)
router.get('/', optionalAuth, serviceController.getAllServices);
router.get('/categories', serviceController.getServiceCategories);
router.get('/popular', optionalAuth, serviceController.getPopularServices);
router.get('/search', optionalAuth, serviceController.searchServices);
router.get('/with-availability', optionalAuth, serviceController.getServicesWithAvailability);
router.get('/category/:category', optionalAuth, serviceController.getServicesByCategory);

// Public route for individual service (with optional auth for personalization)
router.get('/:id', optionalAuth, serviceController.getService);
router.get('/:id/reviews', serviceController.getServiceReviews);

// Protected routes (require authentication)
router.use(protect);

// Admin-only routes (employees cannot manage services)
router.post('/', isAdminOnly, logUserAction('create_service'), serviceController.createService);
router.patch('/:id', isAdminOnly, logUserAction('update_service'), serviceController.updateService);
router.delete('/:id', isAdminOnly, logUserAction('delete_service'), serviceController.deleteService);

// Analytics routes (admin only)
router.get('/:id/stats', isAdminOnly, serviceController.getServiceStats);
router.patch('/:id/update-ratings', isAdminOnly, serviceController.updateServiceRatings);

module.exports = router;

