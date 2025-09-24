const mongoose = require('mongoose');
const Service = require('./models/Service');

async function testExistingServices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');
    
    // Find all services
    console.log('Finding all services in the database...');
    const services = await Service.find({}).populate('category');
    
    if (services.length === 0) {
      console.log('No services found in the database');
      process.exit(0);
    }
    
    console.log(`Found ${services.length} services in the database`);
    
    // Display details for each service
    services.forEach((service, index) => {
      console.log(`\nService #${index + 1}:`);
      console.log(`- ID: ${service._id}`);
      console.log(`- Name: ${service.name}`);
      console.log(`- Description: ${service.description}`);
      console.log(`- Price: ${service.price}`);
      console.log(`- Duration: ${service.duration} minutes`);
      console.log(`- Category ID: ${service.category?._id || 'N/A'}`);
      console.log(`- Category Name: ${service.category?.name || 'N/A'}`);
      console.log(`- Is Active: ${service.isActive}`);
      console.log(`- Is Popular: ${service.isPopular || false}`);
    });
    
    // Choose first active service for testing
    const testService = services.find(s => s.isActive === true);
    
    if (testService) {
      console.log('\n=========================================');
      console.log(`You can use the following service for testing:`);
      console.log(`- ID: ${testService._id}`);
      console.log(`- Name: ${testService.name}`);
      console.log(`- Category: ${testService.category?.name || 'N/A'}`);
      console.log('=========================================');
      console.log('Use this ID in your debug-professional-filter.js script');
    } else {
      console.log('\nNo active services found for testing');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing services:', error);
    process.exit(1);
  }
}

testExistingServices();