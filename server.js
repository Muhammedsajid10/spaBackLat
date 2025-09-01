// Load environment variables FIRST
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Import app after environment variables are loaded
const app = require('./app');
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Start server
const port = process.env.PORT || 5000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port} in ${process.env.NODE_ENV} mode`);
  console.log(`📱 API available at: http://localhost:${port}/api/v1`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📚 Documentation: http://localhost:${port}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

module.exports = server;

