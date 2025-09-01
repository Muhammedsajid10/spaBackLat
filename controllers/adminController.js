const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');

// Helper function to handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Get dashboard statistics
const getDashboardStats = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Today's statistics
  const todayStats = await Promise.all([
    Booking.countDocuments({
      appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    }),
    Booking.countDocuments({
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    }),
    Booking.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startOfDay, $lte: endOfDay },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' }
        }
      }
    ]),
    User.countDocuments({
      role: 'client',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
  ]);

  // Monthly statistics
  const monthlyStats = await Promise.all([
    Booking.countDocuments({
      createdAt: { $gte: startOfMonth }
    }),
    Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' }
        }
      }
    ]),
    User.countDocuments({
      role: 'client',
      createdAt: { $gte: startOfMonth }
    })
  ]);

  // Overall statistics
  const overallStats = await Promise.all([
    User.countDocuments({ role: 'client', isActive: true }),
    Employee.countDocuments({ isActive: true }),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Booking.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' }
        }
      }
    ])
  ]);

  // Recent activities
  const recentBookings = await Booking.find()
    .sort('-createdAt')
    .limit(5)
    .populate('client', 'firstName lastName')
    .populate('services.service', 'name');

  const recentClients = await User.find({ role: 'client' })
    .sort('-createdAt')
    .limit(5)
    .select('firstName lastName email createdAt');

  res.status(200).json({
    success: true,
    data: {
      today: {
        totalBookings: todayStats[0],
        completedBookings: todayStats[1],
        revenue: todayStats[2][0]?.totalRevenue || 0,
        newClients: todayStats[3]
      },
      thisMonth: {
        totalBookings: monthlyStats[0],
        revenue: monthlyStats[1][0]?.totalRevenue || 0,
        newClients: monthlyStats[2]
      },
      overall: {
        totalClients: overallStats[0],
        totalEmployees: overallStats[1],
        totalServices: overallStats[2],
        totalBookings: overallStats[3],
        totalRevenue: overallStats[4][0]?.totalRevenue || 0
      },
      recentActivities: {
        recentBookings,
        recentClients
      }
    }
  });
});

// Get revenue analytics
const getRevenueAnalytics = catchAsync(async (req, res, next) => {
  const { period = 'monthly', year = new Date().getFullYear() } = req.query;

  let groupBy, matchCondition;

  if (period === 'daily') {
    // Last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' }
    };
    matchCondition = { createdAt: { $gte: thirtyDaysAgo } };
  } else if (period === 'monthly') {
    // Monthly for the specified year
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' }
    };
    matchCondition = {
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1)
      }
    };
  } else {
    // Yearly
    groupBy = { year: { $year: '$createdAt' } };
    matchCondition = {};
  }

  const revenueData = await Booking.aggregate([
    {
      $match: {
        ...matchCondition,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: groupBy,
        revenue: { $sum: '$finalAmount' },
        bookings: { $sum: 1 },
        avgBookingValue: { $avg: '$finalAmount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Revenue by service category
  const categoryRevenue = await Booking.aggregate([
    { $unwind: '$services' },
    {
      $match: {
        ...matchCondition,
        status: 'completed'
      }
    },
    {
      $lookup: {
        from: 'services',
        localField: 'services.service',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    { $unwind: '$serviceDetails' },
    {
      $group: {
        _id: '$serviceDetails.category',
        revenue: { $sum: '$services.price' },
        bookings: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      revenueData,
      categoryRevenue
    }
  });
});

// Get booking analytics
const getBookingAnalytics = catchAsync(async (req, res, next) => {
  // Booking status distribution
  const statusDistribution = await Booking.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        percentage: { $sum: 1 }
      }
    }
  ]);

  // Calculate percentages
  const totalBookings = statusDistribution.reduce((sum, item) => sum + item.count, 0);
  statusDistribution.forEach(item => {
    item.percentage = Math.round((item.count / totalBookings) * 100);
  });

  // Booking trends (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const bookingTrends = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalBookings: { $sum: 1 },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Peak hours analysis
  const peakHours = await Booking.aggregate([
    {
      $group: {
        _id: { $hour: '$appointmentDate' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Popular services
  const popularServices = await Booking.aggregate([
    { $unwind: '$services' },
    {
      $group: {
        _id: '$services.service',
        bookings: { $sum: 1 },
        revenue: { $sum: '$services.price' }
      }
    },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    { $unwind: '$serviceDetails' },
    {
      $project: {
        serviceName: '$serviceDetails.name',
        category: '$serviceDetails.category',
        bookings: 1,
        revenue: 1
      }
    },
    { $sort: { bookings: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      statusDistribution,
      bookingTrends,
      peakHours,
      popularServices
    }
  });
});

// Get employee analytics
const getEmployeeAnalytics = catchAsync(async (req, res, next) => {
  // Employee performance
  const employeePerformance = await Booking.aggregate([
    { $unwind: '$services' },
    {
      $match: {
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$services.employee',
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$services.price' },
        avgBookingValue: { $avg: '$services.price' }
      }
    },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: '_id',
        as: 'employeeDetails'
      }
    },
    { $unwind: '$employeeDetails' },
    {
      $lookup: {
        from: 'users',
        localField: 'employeeDetails.user',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    { $unwind: '$userDetails' },
    {
      $project: {
        employeeName: {
          $concat: ['$userDetails.firstName', ' ', '$userDetails.lastName']
        },
        employeeId: '$employeeDetails.employeeId',
        position: '$employeeDetails.position',
        totalBookings: 1,
        totalRevenue: 1,
        avgBookingValue: 1
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Attendance summary
  const attendanceSummary = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      employeePerformance,
      attendanceSummary
    }
  });
});

// Get customer analytics
const getCustomerAnalytics = catchAsync(async (req, res, next) => {
  // Customer acquisition trends
  const acquisitionTrends = await User.aggregate([
    {
      $match: {
        role: 'client',
        createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        newCustomers: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Customer lifetime value
  const customerLTV = await Booking.aggregate([
    {
      $match: { status: 'completed' }
    },
    {
      $group: {
        _id: '$client',
        totalSpent: { $sum: '$finalAmount' },
        totalBookings: { $sum: 1 },
        avgBookingValue: { $avg: '$finalAmount' },
        firstBooking: { $min: '$createdAt' },
        lastBooking: { $max: '$createdAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'customerDetails'
      }
    },
    { $unwind: '$customerDetails' },
    {
      $project: {
        customerName: {
          $concat: ['$customerDetails.firstName', ' ', '$customerDetails.lastName']
        },
        email: '$customerDetails.email',
        totalSpent: 1,
        totalBookings: 1,
        avgBookingValue: 1,
        customerLifetime: {
          $divide: [
            { $subtract: ['$lastBooking', '$firstBooking'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 20 }
  ]);

  // Customer retention analysis
  const retentionAnalysis = await Booking.aggregate([
    {
      $group: {
        _id: '$client',
        bookingCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $eq: ['$bookingCount', 1] }, then: 'One-time' },
              { case: { $lte: ['$bookingCount', 3] }, then: 'Occasional' },
              { case: { $lte: ['$bookingCount', 10] }, then: 'Regular' },
              { case: { $gt: ['$bookingCount', 10] }, then: 'Loyal' }
            ],
            default: 'Unknown'
          }
        },
        customerCount: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      acquisitionTrends,
      customerLTV,
      retentionAnalysis
    }
  });
});

// Get system health
const getSystemHealth = catchAsync(async (req, res, next) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Database health checks
  const healthChecks = await Promise.all([
    User.countDocuments(),
    Booking.countDocuments(),
    Service.countDocuments(),
    Employee.countDocuments(),
    Feedback.countDocuments()
  ]);

  // Recent activity
  const recentActivity = await Promise.all([
    User.countDocuments({ createdAt: { $gte: last24Hours } }),
    Booking.countDocuments({ createdAt: { $gte: last24Hours } }),
    Feedback.countDocuments({ createdAt: { $gte: last24Hours } })
  ]);

  // Error rates (you would implement error logging)
  const errorRates = {
    last24Hours: 0, // Placeholder
    lastWeek: 0,    // Placeholder
    lastMonth: 0    // Placeholder
  };

  res.status(200).json({
    success: true,
    data: {
      databaseHealth: {
        totalUsers: healthChecks[0],
        totalBookings: healthChecks[1],
        totalServices: healthChecks[2],
        totalEmployees: healthChecks[3],
        totalFeedback: healthChecks[4]
      },
      recentActivity: {
        newUsers: recentActivity[0],
        newBookings: recentActivity[1],
        newFeedback: recentActivity[2]
      },
      errorRates,
      systemStatus: 'healthy',
      lastUpdated: now
    }
  });
});

// Bulk operations
const bulkUpdateUsers = catchAsync(async (req, res, next) => {
  const { userIds, updateData } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User IDs array is required'
    });
  }

  const result = await User.updateMany(
    { _id: { $in: userIds } },
    updateData,
    { runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: `Updated ${result.modifiedCount} users`,
    data: {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    }
  });
});

// Export data
const exportData = catchAsync(async (req, res, next) => {
  const { type, startDate, endDate } = req.query;

  let data;
  let filename;

  switch (type) {
    case 'bookings':
      data = await Booking.find({
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).populate('client', 'firstName lastName email')
        .populate('services.service', 'name category');
      filename = `bookings_${startDate}_${endDate}.json`;
      break;

    case 'customers':
      data = await User.find({
        role: 'client',
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).select('-password');
      filename = `customers_${startDate}_${endDate}.json`;
      break;

    case 'revenue':
      data = await Booking.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalRevenue: { $sum: '$finalAmount' },
            bookingCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
      filename = `revenue_${startDate}_${endDate}.json`;
      break;

    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid export type'
      });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.status(200).json({
    success: true,
    exportDate: new Date(),
    type,
    dateRange: { startDate, endDate },
    recordCount: data.length,
    data
  });
});

module.exports = {
  getDashboardStats,
  getRevenueAnalytics,
  getBookingAnalytics,
  getEmployeeAnalytics,
  getCustomerAnalytics,
  getSystemHealth,
  bulkUpdateUsers,
  exportData
};

