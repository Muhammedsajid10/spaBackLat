const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI is set' : 'URI is not set');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000, // 5 second timeout
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Log registered models
    const models = mongoose.modelNames();
    console.log('🔎 Registered Mongoose models:', models);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    return true; // Success

  } catch (error) {
    console.error('⚠️ Database connection failed:', error.message);
    console.log('⚠️ Server will continue without database connection for testing purposes');
    return false; // Failed but don't exit
  }
};

module.exports = connectDB;

