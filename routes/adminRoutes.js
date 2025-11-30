const express = require('express');
const adminController = require('../controllers/adminController');
const clientController = require('../controllers/clientController');
const allergyController = require('../controllers/allergyController');
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isStaff, logUserAction } = require('../middleware/roleMiddleware');
const { getCashMovementSummary, getDailyTransactionSummary } = require('../controllers/paymentController');

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

// Finance summary (raw collection) - supports optional date range and paging
router.get('/finance-summary', isStaff, adminController.getFinanceSummary);

// Attendance records - supports optional date range, paging, and all=true
router.get('/attendance', isStaff, adminController.getAllAttendance);

// Cash Movement Summary
router.get('/cash-movement-summary', isStaff, getCashMovementSummary);

// Daily Transaction Summary
router.get('/daily-transaction-summary', isStaff, getDailyTransactionSummary);

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

// Allergy management routes
router.get('/allergies/config', allergyController.getAllergyConfig); // Public config endpoint
router.get('/clients/:id/allergies', isStaff, allergyController.getClientAllergies);
router.post('/clients/:id/allergies', isStaff, logUserAction('add_allergy'), allergyController.createAllergy);
router.patch('/allergies/:allergyId', isStaff, logUserAction('update_allergy'), allergyController.updateAllergy);
router.delete('/allergies/:allergyId', isStaff, logUserAction('delete_allergy'), allergyController.deleteAllergy);
router.patch('/allergies/:allergyId/resolve', isStaff, logUserAction('resolve_allergy'), allergyController.resolveAllergy);

// Note management routes
router.get('/clients/:id/notes', isStaff, noteController.getClientNotes);
router.post('/clients/:id/notes', isStaff, logUserAction('add_note'), noteController.createNote);
router.patch('/notes/:noteId', isStaff, logUserAction('update_note'), noteController.updateNote);
router.delete('/notes/:noteId', isStaff, logUserAction('delete_note'), noteController.deleteNote);
router.patch('/notes/:noteId/toggle-pin', isStaff, logUserAction('toggle_pin_note'), noteController.togglePinNote);

module.exports = router;

