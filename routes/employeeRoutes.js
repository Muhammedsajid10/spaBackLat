const express = require('express');
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { 
  isAdmin, 
  isEmployeeOnly, 
  canViewOwnAppointments, 
  canMarkOwnAttendance, 
  canViewOwnRatings,
  logUserAction 
} = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ========================================
// EMPLOYEE PANEL ROUTES (Restricted Access)
// ========================================

// Schedule Dashboard - Employee can only view their own appointments
router.get('/my-schedule', isEmployeeOnly, canViewOwnAppointments, employeeController.getMySchedule);

// Attendance Management - Employee can only manage their own attendance
router.get('/my-attendance', isEmployeeOnly, canMarkOwnAttendance, employeeController.getMyAttendance);
router.post('/check-in', isEmployeeOnly, canMarkOwnAttendance, logUserAction('employee_checkin'), employeeController.checkIn);
router.post('/check-out', isEmployeeOnly, canMarkOwnAttendance, logUserAction('employee_checkout'), employeeController.checkOut);
router.post('/mark-absent', isEmployeeOnly, canMarkOwnAttendance, logUserAction('employee_mark_absent'), employeeController.markAbsent);

// Ratings & Feedback - Employee can only view their own ratings
router.get('/my-ratings', isEmployeeOnly, canViewOwnRatings, employeeController.getMyRatings);

// Performance Summary - Employee can only view their own performance
router.get('/my-performance', isEmployeeOnly, employeeController.getMyPerformance);

// ========================================
// ADMIN ROUTES (Full Access)
// ========================================

// Admin can create employee profiles
router.post('/', isAdmin, logUserAction('create_employee'), employeeController.createEmployee);

// Admin can access all employee data
router.get('/', isAdmin, employeeController.getAllEmployees);
router.get('/stats', isAdmin, employeeController.getEmployeeStats);
router.get('/search', isAdmin, employeeController.searchEmployees);

router
  .route('/:id')
  .get(isAdmin, employeeController.getEmployee)
  .patch(isAdmin, logUserAction('update_employee'), employeeController.updateEmployee)
  .delete(isAdmin, logUserAction('delete_employee'), employeeController.deleteEmployee);

// Admin can manage employee availability
router.patch('/:id/availability', isAdmin, logUserAction('update_employee_availability'), employeeController.updateEmployeeAvailability);

// Admin can view all available employees
router.get('/available/list', isAdmin, employeeController.getAvailableEmployees);

module.exports = router;

