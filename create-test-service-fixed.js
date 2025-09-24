const mongoose = require('mongoose');
const Service = require('./models/Service');
const Category = require('./models/Category');

async function createTestService() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');
    
    // First, find or create a category
    console.log('Looking for an existing category...');
    let category = await Category.findOne({});
    
    if (!category) {
      console.log('No category found, creating a new one...');
      category = new Category({
        name: 'Massage',
        description: 'Massage services',
        isActive: true
      });
      await category.save();
      console.log(`Created new category with ID: ${category._id}`);
    } else {
      console.log(`Using existing category: ${category.name} (${category._id})`);
    }
    
    // Create a test service
    const testService = new Service({
      name: 'Test Massage Service',
      description: 'A test massage service for debugging',
      price: 100,
      duration: 60,
      category: category._id,  // Use the category ObjectId
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