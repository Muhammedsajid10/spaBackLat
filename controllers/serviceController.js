const mongoose = require('mongoose');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');
const Category = require('../models/Category');

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

// Create new service
const createService = catchAsync(async (req, res, next) => {
  const service = await Service.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: {
      service
    }
  });
});

// Get all services
const getAllServices = catchAsync(async (req, res, next) => {
  let filter = {};
  // For clients, only show active services
  if (req.user && req.user.role === 'client') {
    filter.isActive = true;
  }
  try {
    const features = new APIFeatures(Service.find(filter).populate('category', 'name displayName'), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const services = await features.query;

    res.status(200).json({
      success: true,
      results: services.length,
      data: {
        services
      }
    });
  } catch (err) {
    console.error('Error in getAllServices:', err);
    next(err);
  }
});

// Get single service
const getService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id)
    .populate('category', 'name displayName')
    .populate('availableEmployees', 'employeeId user')
    .populate('availableEmployees.user', 'firstName lastName');

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'No service found with that ID'
    });
  }

  // For clients, only show active services
  if (req.user && req.user.role === 'client' && !service.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Service not available'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      service
    }
  });
});

// Update service
const updateService = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'No service found with that ID'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Service updated successfully',
    data: {
      service
    }
  });
});

// Delete service
const deleteService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'No service found with that ID'
    });
  }

  // Check for active bookings
  const activeBookings = await Booking.find({
    'services.service': service._id,
    status: { $in: ['confirmed', 'pending', 'in-progress'] }
  });

  if (activeBookings.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete service with active bookings. Deactivate instead.'
    });
  }

  // Soft delete by deactivating
  service.isActive = false;
  await service.save();

  res.status(200).json({
    success: true,
    message: 'Service deactivated successfully',
    data: null
  });
});

// Get services by category
const getServicesByCategory = catchAsync(async (req, res, next) => {
  const { category } = req.params;

  let filter = { category };
  
  // For clients, only show active services
  if (req.user && req.user.role === 'client') {
    filter.isActive = true;
  }

  const services = await Service.find(filter).populate('category', 'name displayName').sort('name');

  res.status(200).json({
    success: true,
    results: services.length,
    data: {
      services
    }
  });
});

// Get popular services
const getPopularServices = catchAsync(async (req, res, next) => {
  let filter = { isPopular: true };
  
  // For clients, only show active services
  if (req.user && req.user.role === 'client') {
    filter.isActive = true;
  }

  const services = await Service.find(filter)
    .populate('category', 'name displayName')
    .sort('-ratings.average')
    .limit(10);

  res.status(200).json({
    success: true,
    results: services.length,
    data: {
      services
    }
  });
});

// Search services
const searchServices = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  let filter = {
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ]
  };

  // For clients, only show active services
  if (req.user && req.user.role === 'client') {
    filter.isActive = true;
  }

  const services = await Service.find(filter).populate('category', 'name displayName').limit(20);

  res.status(200).json({
    success: true,
    results: services.length,
    data: {
      services
    }
  });
});

// Get service statistics
const getServiceStats = catchAsync(async (req, res, next) => {
  const serviceId = req.params.id;

  // Get booking statistics
  const bookingStats = await Booking.aggregate([
    { $unwind: '$services' },
    { $match: { 'services.service': mongoose.Types.ObjectId(serviceId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$services.price' }
      }
    }
  ]);

  // Get monthly booking trends
  const monthlyStats = await Booking.aggregate([
    { $unwind: '$services' },
    { 
      $match: { 
        'services.service': mongoose.Types.ObjectId(serviceId),
        createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        bookings: { $sum: 1 },
        revenue: { $sum: '$services.price' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get feedback statistics
  const feedbackStats = await Feedback.aggregate([
    { $match: { service: mongoose.Types.ObjectId(serviceId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$ratings.overall' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$ratings.overall'
        }
      }
    }
  ]);

  // Calculate rating distribution
  let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (feedbackStats.length > 0) {
    feedbackStats[0].ratingDistribution.forEach(rating => {
      ratingDistribution[Math.floor(rating)]++;
    });
  }

  res.status(200).json({
    success: true,
    data: {
      bookingStats,
      monthlyStats,
      feedbackStats: feedbackStats[0] || { averageRating: 0, totalReviews: 0 },
      ratingDistribution
    }
  });
});

// Get service reviews
const getServiceReviews = catchAsync(async (req, res, next) => {
  const serviceId = req.params.id;

  const features = new APIFeatures(
    Feedback.find({ 
      service: serviceId,
      status: 'approved',
      isPublic: true
    }), 
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reviews = await features.query;

  res.status(200).json({
    success: true,
    results: reviews.length,
    data: {
      reviews
    }
  });
});

// Update service ratings
const updateServiceRatings = catchAsync(async (req, res, next) => {
  const serviceId = req.params.id;

  const ratings = await Feedback.calculateServiceRatings(serviceId);

  const service = await Service.findByIdAndUpdate(
    serviceId,
    {
      'ratings.average': ratings.average,
      'ratings.count': ratings.count
    },
    { new: true }
  );

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Service ratings updated successfully',
    data: {
      ratings: service.ratings
    }
  });
});

// Get service categories
const getServiceCategories = catchAsync(async (req, res, next) => {
  const Category = require('../models/Category');
  const categories = await Category.find().sort('displayName');

  res.status(200).json({
    success: true,
    results: categories.length,
    data: {
      categories: categories.map(cat => ({
        _id: cat._id,
        name: cat.name,
        displayName: cat.displayName
      }))
    }
  });
});

// Get services with availability
const getServicesWithAvailability = catchAsync(async (req, res, next) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required'
    });
  }

  const services = await Service.find({ isActive: true })
    .populate('availableEmployees', 'employeeId user availability')
    .populate('availableEmployees.user', 'firstName lastName');

  // Check availability for each service
  const servicesWithAvailability = [];

  for (const service of services) {
    const availableEmployees = [];

    for (const employee of service.availableEmployees) {
      if (employee.availability.isAvailable) {
        // Check if employee has any bookings on this date
        const bookingsCount = await Booking.countDocuments({
          'services.employee': employee._id,
          appointmentDate: {
            $gte: new Date(date),
            $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
          },
          status: { $in: ['confirmed', 'pending', 'in-progress'] }
        });

        if (bookingsCount < (employee.bookingSettings?.maxBookingsPerDay || 10)) {
          availableEmployees.push(employee);
        }
      }
    }

    if (availableEmployees.length > 0) {
      servicesWithAvailability.push({
        ...service.toObject(),
        availableEmployees
      });
    }
  }

  res.status(200).json({
    success: true,
    results: servicesWithAvailability.length,
    data: {
      services: servicesWithAvailability
    }
  });
});

module.exports = {
  createService,
  getAllServices,
  getService,
  updateService,
  deleteService,
  getServicesByCategory,
  getPopularServices,
  searchServices,
  getServiceStats,
  getServiceReviews,
  updateServiceRatings,
  getServiceCategories,
  getServicesWithAvailability
};

