// Load environment variables FIRST
const dotenv = require('dotenv');
const path = require('path');

// Explicitly set the path to the .env file
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

const mongoose = require('mongoose');

// Import app after environment variables are loaded
const app = require('./app');
const connectDB = require('./config/db');

// Connect to database (but don't exit if it fails)
const startServer = async () => {
  const dbConnected = await connectDB();
  
  if (!dbConnected) {
    console.log('📡 Starting server without database connection...');
  }

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
    console.log('UNHANDLED REJECTION! ⚠️ Continuing...');
    console.log(err.name, err.message);
    // Don't exit the process, just log the error
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  });

  return server;
};

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = startServer;

