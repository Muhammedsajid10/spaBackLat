const express = require('express');
const mongoose = require('mongoose');

// Force-load models early to avoid any timing/circular issues with registration (temporary safeguard)
require('./models/Category');
require('./models/Service');
require('./models/Booking');
require('./models/Feedback');
require('./models/User');
require('./models/Employee');
require('./models/Attendance');
require('./models/Payment');
require('./models/Membership');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const membershipRoutes = require('./routes/membershipRoutes'); // Membership routes
const paymentRoutes = require('./routes/paymentRoutes'); // Payment routes
const giftCardRoutes = require('./routes/giftCardRoutes'); // Gift card routes

// Import middleware
const { isLoggedIn } = require('./middleware/authMiddleware');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Global middleware

// Security HTTP headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Default allowed origins for development and common deployment platforms
    const defaultAllowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:5173',
      'https://tourmaline-choux-90907f.netlify.app'
    ];
    
    // Get allowed origins from environment or use defaults
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
      defaultAllowedOrigins;
    
    // Allow all origins in development or if wildcard is specified
    if (process.env.NODE_ENV === 'development' || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('CORS: Origin not allowed:', origin);
    console.log('CORS: Allowed origins:', allowedOrigins);
    return callback(null, true); // Allow for now during deployment debugging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control']
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  max: process.env.RATE_LIMIT_MAX || 5000, // Increased from 1000 to 5000
  windowMs: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // Changed from 1 hour to 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json({ 
  limit: process.env.JSON_LIMIT || '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'sort',
    'fields',
    'page',
    'limit',
    'category',
    'price',
    'duration',
    'rating'
  ]
}));

// Compression middleware
app.use(compression());

// Serve static files
app.use(express.static('public'));

// Note: Authentication middleware is applied per route as needed
// isLoggedIn middleware is for rendered pages, not API routes
// Email verification is currently disabled - all users are auto-verified
// The verification code has been commented out but preserved for future use if needed

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/memberships', membershipRoutes); // Add this line
app.use('/api/v1/payments', paymentRoutes); // Mount payment routes
app.use('/api/v1/giftcards', giftCardRoutes); // Mount gift card routes

// Debug route to inspect registered mongoose models (temporary - remove in production once issue resolved)
app.get('/api/v1/debug/models', (req, res) => {
  try {
    const modelNames = mongoose.modelNames();
    res.status(200).json({ success: true, models: modelNames });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Log registered models on startup for debugging the missing Category model issue
setTimeout(() => {
  try {
    console.log('🔎 Registered Mongoose models:', mongoose.modelNames());
  } catch (e) {
    console.log('Failed to list mongoose models:', e.message);
  }
}, 1000);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Spa Booking & Management System API',
    version: 'v1',
    documentation: {
      auth: '/api/v1/auth',
      bookings: '/api/v1/bookings',
      services: '/api/v1/services',
      employees: '/api/v1/employees',
      admin: '/api/v1/admin'
    },
    endpoints: {
      health: '/health',
      documentation: '/api'
    }
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`,
    availableEndpoints: {
      auth: '/api/v1/auth',
      bookings: '/api/v1/bookings',
      services: '/api/v1/services',
      employees: '/api/v1/employees',
      admin: '/api/v1/admin',
      health: '/health',
      documentation: '/api'
    }
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥:', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    err.message = 'Invalid ID format';
    err.statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    err.message = `Duplicate field value: ${value}. Please use another value!`;
    err.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    err.message = `Invalid input data. ${errors.join('. ')}`;
    err.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err.message = 'Invalid token. Please log in again!';
    err.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    err.message = 'Your token has expired! Please log in again.';
    err.statusCode = 401;
  }

  // Send error response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack
    })
  });
});

module.exports = app;

