const User = require('../models/User');
const Employee = require('../models/Employee');

// ========================================
// ROLE-BASED ACCESS CONTROL MIDDLEWARE
// ========================================

/**
 * Check if user is admin
 */
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('isAdmin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user is admin only (not employee)
 */
const isAdminOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('isAdminOnly middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user is staff (admin or employee)
 */
const isStaff = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!['admin', 'employee'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Staff access required'
      });
    }

    next();
  } catch (error) {
    console.error('isStaff middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user is employee only
 */
const isEmployeeOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Employee access required'
      });
    }

    next();
  } catch (error) {
    console.error('isEmployeeOnly middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user is client
 */
const isClient = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Client access required'
      });
    }

    next();
  } catch (error) {
    console.error('isClient middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user can view their own appointments
 */
const canViewOwnAppointments = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Employees can view their own appointments
    if (req.user.role === 'employee') {
      return next();
    }

    // Admins can view all appointments
    if (req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  } catch (error) {
    console.error('canViewOwnAppointments middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user can mark their own attendance
 */
const canMarkOwnAttendance = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Employees can mark their own attendance
    if (req.user.role === 'employee') {
      return next();
    }

    // Admins can mark attendance for any employee
    if (req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  } catch (error) {
    console.error('canMarkOwnAttendance middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user can view their own ratings
 */
const canViewOwnRatings = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Employees can view their own ratings
    if (req.user.role === 'employee') {
      return next();
    }

    // Admins can view all ratings
    if (req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  } catch (error) {
    console.error('canViewOwnRatings middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user can manage bookings
 */
const canManageBookings = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admins and employees can manage bookings
    if (['admin', 'employee'].includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  } catch (error) {
    console.error('canManageBookings middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Log user actions for audit trail
 */
const logUserAction = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        console.log(`[AUDIT] User ${req.user._id} (${req.user.role}) performed action: ${action}`, {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.originalUrl,
          body: req.body
        });
      }
      next();
    } catch (error) {
      console.error('logUserAction middleware error:', error);
      // Don't block the request if logging fails
      next();
    }
  };
};

module.exports = {
  isAdmin,
  isAdminOnly,
  isStaff,
  isEmployeeOnly,
  isClient,
  canViewOwnAppointments,
  canMarkOwnAttendance,
  canViewOwnRatings,
  canManageBookings,
  logUserAction
};
