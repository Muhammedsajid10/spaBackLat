const User = require('../models/User');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');

// Helper function to handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Helper function for API features
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

// Get all clients (admin/employee only) with optional batch id filtering (?ids=comma,separated)
const getAllClients = catchAsync(async (req, res, next) => {
  const { ids } = req.query;
  let baseQuery;
  if (ids) {
    const idArray = ids.split(',').map(id => id.trim()).filter(Boolean);
    if (idArray.length) {
      // When explicit ids requested, don't restrict by role so enrichment works even if role mismatch
      baseQuery = { _id: { $in: idArray } };
    } else {
      baseQuery = { role: 'client' };
    }
  } else {
    baseQuery = { role: 'client' };
  }

  const features = new APIFeatures(
    User.find(baseQuery), 
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const clients = await features.query;

  res.status(200).json({
    success: true,
    results: clients.length,
    data: {
      clients
    }
  });
});

// Get single client
const getClient = catchAsync(async (req, res, next) => {
  const client = await User.findById(req.params.id);

  if (!client || client.role !== 'client') {
    return res.status(404).json({
      success: false,
      message: 'No client found with that ID'
    });
  }

  // Check if user can access this client data
  if (req.user.role === 'client' && client._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own profile'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      client
    }
  });
});

// Update client
const updateClient = catchAsync(async (req, res, next) => {
  const client = await User.findById(req.params.id);

  if (!client || client.role !== 'client') {
    return res.status(404).json({
      success: false,
      message: 'No client found with that ID'
    });
  }

  // Check if user can update this client
  if (req.user.role === 'client' && client._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own profile'
    });
  }

  // Filter out fields that shouldn't be updated
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 
    'address', 'profileImage', 'preferences'
  ];

  // Admin can update additional fields
  if (req.user.role === 'admin') {
    allowedFields.push('isActive', 'isEmailVerified');
  }

  const filteredBody = {};
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) {
      filteredBody[el] = req.body[el];
    }
  });

  const updatedClient = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Client updated successfully',
    data: {
      client: updatedClient
    }
  });
});

// Delete/Deactivate client
const deleteClient = catchAsync(async (req, res, next) => {
  const client = await User.findById(req.params.id);

  if (!client || client.role !== 'client') {
    return res.status(404).json({
      success: false,
      message: 'No client found with that ID'
    });
  }

  // Check for active bookings
  const activeBookings = await Booking.find({
    client: client._id,
    status: { $in: ['confirmed', 'pending', 'in-progress'] }
  });

  if (activeBookings.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete client with active bookings'
    });
  }

  // Hard delete - remove from database
  await User.findByIdAndDelete(req.params.id);

  res.status(204).json({
    success: true,
    message: 'Client deleted successfully',
    data: null
  });
});

// Get client booking history
const getClientBookings = catchAsync(async (req, res, next) => {
  const clientId = req.params.id;

  // Check if user can access this client's bookings
  if (req.user.role === 'client' && clientId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own bookings'
    });
  }

  const features = new APIFeatures(
    Booking.find({ client: clientId }), 
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const bookings = await features.query;

  res.status(200).json({
    success: true,
    results: bookings.length,
    data: {
      bookings
    }
  });
});

// Get client statistics
const getClientStats = catchAsync(async (req, res, next) => {
  const clientId = req.params.id;

  // Check if user can access this client's stats
  if (req.user.role === 'client' && clientId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own statistics'
    });
  }

  // Get booking statistics
  const bookingStats = await Booking.aggregate([
    { $match: { client: mongoose.Types.ObjectId(clientId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalSpent: { $sum: '$finalAmount' }
      }
    }
  ]);

  // Get total bookings and spending
  const totalStats = await Booking.aggregate([
    { $match: { client: mongoose.Types.ObjectId(clientId) } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalSpent: { $sum: '$finalAmount' },
        avgBookingValue: { $avg: '$finalAmount' }
      }
    }
  ]);

  // Get favorite services
  const favoriteServices = await Booking.aggregate([
    { $match: { client: mongoose.Types.ObjectId(clientId) } },
    { $unwind: '$services' },
    {
      $group: {
        _id: '$services.service',
        count: { $sum: 1 },
        totalSpent: { $sum: '$services.price' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
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
        count: 1,
        totalSpent: 1
      }
    }
  ]);

  // Get recent feedback
  const recentFeedback = await Feedback.find({ client: clientId })
    .sort('-createdAt')
    .limit(5)
    .populate('service', 'name')
    .populate('employee', 'user')
    .populate('employee.user', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: {
      bookingStats,
      totalStats: totalStats[0] || { totalBookings: 0, totalSpent: 0, avgBookingValue: 0 },
      favoriteServices,
      recentFeedback
    }
  });
});

// Get client preferences
const getClientPreferences = catchAsync(async (req, res, next) => {
  const clientId = req.params.id;

  // Check if user can access this client's preferences
  if (req.user.role === 'client' && clientId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own preferences'
    });
  }

  const client = await User.findById(clientId).select('preferences');

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      preferences: client.preferences
    }
  });
});

// Update client preferences
const updateClientPreferences = catchAsync(async (req, res, next) => {
  const clientId = req.params.id;

  // Check if user can update this client's preferences
  if (req.user.role === 'client' && clientId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own preferences'
    });
  }

  const client = await User.findByIdAndUpdate(
    clientId,
    { preferences: req.body },
    { new: true, runValidators: true }
  ).select('preferences');

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      preferences: client.preferences
    }
  });
});

// Search clients (admin/employee only)
const searchClients = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const clients = await User.find({
    role: 'client',
    $or: [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } }
    ]
  }).limit(20);

  res.status(200).json({
    success: true,
    results: clients.length,
    data: {
      clients
    }
  });
});

// Get client loyalty points
const getClientLoyaltyPoints = catchAsync(async (req, res, next) => {
  const clientId = req.params.id;

  // Check if user can access this client's loyalty points
  if (req.user.role === 'client' && clientId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own loyalty points'
    });
  }

  const loyaltyStats = await Booking.aggregate([
    { $match: { client: mongoose.Types.ObjectId(clientId) } },
    {
      $group: {
        _id: null,
        totalEarned: { $sum: '$loyaltyPoints.earned' },
        totalRedeemed: { $sum: '$loyaltyPoints.redeemed' }
      }
    }
  ]);

  const stats = loyaltyStats[0] || { totalEarned: 0, totalRedeemed: 0 };
  const currentBalance = stats.totalEarned - stats.totalRedeemed;

  res.status(200).json({
    success: true,
    data: {
      totalEarned: stats.totalEarned,
      totalRedeemed: stats.totalRedeemed,
      currentBalance
    }
  });
});

module.exports = {
  getAllClients,
  getClient,
  updateClient,
  deleteClient,
  getClientBookings,
  getClientStats,
  getClientPreferences,
  updateClientPreferences,
  searchClients,
  getClientLoyaltyPoints
};

