const mongoose = require('mongoose');
const Service = require('./models/Service');

async function createTestService() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://sajidalhijas:zUsF7GJ7Sy7vjy1s@cluster0.govwh3h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');
    
    // Create a test service
    const testService = new Service({
      name: 'Test Massage Service',
      description: 'A test massage service for debugging',
      price: 100,
      duration: 60,
      category: 'massage',
      isActive: true,
      isPopular: true
    });
    
    await testService.save();
    console.log(`Created test service with ID: ${testService._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test service:', error);
    process.exit(1);
  }
}

createTestService();