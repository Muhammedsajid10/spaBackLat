const express = require('express');
const adminController = require('../controllers/adminController');
const clientController = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isStaff, logUserAction } = require('../middleware/roleMiddleware');
const { getCashMovementSummary } = require('../controllers/paymentController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard and analytics routes (staff and admin)
router.get('/dashboard', isStaff, adminController.getDashboardStats);
router.get('/analytics/revenue', isStaff, adminController.getRevenueAnalytics);
router.get('/analytics/bookings', isStaff, adminController.getBookingAnalytics);
router.get('/analytics/employees', isStaff, adminController.getEmployeeAnalytics);
router.get('/analytics/customers', isStaff, adminController.getCustomerAnalytics);
router.get('/system/health', isAdmin, adminController.getSystemHealth);

// Cash Movement Summary
router.get('/cash-movement-summary', isStaff, getCashMovementSummary);

// Data export routes (admin only)
router.get('/export', isAdmin, adminController.exportData);

// Bulk operations (admin only)
router.patch('/users/bulk-update', isAdmin, logUserAction('bulk_update_users'), adminController.bulkUpdateUsers);

// Client management routes (staff and admin)
router.get('/clients', isStaff, clientController.getAllClients);
router.get('/clients/search', isStaff, clientController.searchClients);

router
  .route('/clients/:id')
  .get(isStaff, clientController.getClient)
  .patch(isStaff, logUserAction('update_client'), clientController.updateClient)
  .delete(isAdmin, logUserAction('delete_client'), clientController.deleteClient);

// Client-specific routes
router.get('/clients/:id/bookings', isStaff, clientController.getClientBookings);
router.get('/clients/:id/stats', isStaff, clientController.getClientStats);
router.get('/clients/:id/preferences', isStaff, clientController.getClientPreferences);
router.patch('/clients/:id/preferences', isStaff, logUserAction('update_client_preferences'), clientController.updateClientPreferences);
router.get('/clients/:id/loyalty-points', isStaff, clientController.getClientLoyaltyPoints);

module.exports = router;

