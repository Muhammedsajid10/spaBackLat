const mongoose = require('mongoose');
const Category = require('./models/Category');
const Service = require('./models/Service');

async function createTestCategoriesAndServices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-management');
    console.log('Connected to MongoDB');
    
    // Create categories if they don't exist
    console.log('\nChecking for existing categories...');
    const existingCategories = await Category.find();
    
    let categories = existingCategories;
    if (existingCategories.length === 0) {
      console.log('No categories found. Creating test categories...');
      
      const categoryData = [
        {
          name: 'massage_therapy',
          displayName: 'Massage Therapy',
          description: 'Various massage therapy treatments for relaxation and healing'
        },
        {
          name: 'facial_treatments',
          displayName: 'Facial Treatments',
          description: 'Rejuvenating facial treatments for all skin types'
        },
        {
          name: 'body_treatments',
          displayName: 'Body Treatments',
          description: 'Luxurious body treatments for relaxation and detoxification'
        }
      ];
      
      const createdCategories = [];
      for (const catData of categoryData) {
        const category = new Category(catData);
        await category.save();
        createdCategories.push(category);
        console.log(`Created category: ${category.name}`);
      }
      
      categories = createdCategories;
    } else {
      console.log(`Found ${existingCategories.length} existing categories`);
    }
    
    // Create services if they don't exist
    console.log('\nChecking for existing services...');
    const existingServices = await Service.find();
    
    if (existingServices.length === 0) {
      console.log('No services found. Creating test services...');
      
      // Map category names to their IDs
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.displayName] = cat._id;
      });
      
      const serviceData = [
        {
          name: 'Swedish Massage',
          description: 'A gentle, relaxing massage that uses long strokes, kneading, and circular movements to ease tension and promote relaxation.',
          category: categoryMap['Massage Therapy'],
          duration: 60,
          price: 85,
          isActive: true,
          isPopular: true
        },
        {
          name: 'Deep Tissue Massage',
          description: 'A therapeutic massage that uses more pressure to target deeper layers of muscle and connective tissue.',
          category: categoryMap['Massage Therapy'],
          duration: 60,
          price: 95,
          isActive: true,
          isPopular: true
        },
        {
          name: 'Hot Stone Massage',
          description: 'A massage therapy that uses smooth, heated stones placed on specific points of the body to warm and relax muscles.',
          category: categoryMap['Massage Therapy'],
          duration: 90,
          price: 120,
          isActive: true,
          isPopular: false
        },
        {
          name: 'Classic Facial',
          description: 'A basic facial that cleanses, exfoliates, and nourishes the skin for a refreshed appearance.',
          category: categoryMap['Facial Treatments'],
          duration: 45,
          price: 65,
          isActive: true,
          isPopular: true
        },
        {
          name: 'Body Scrub',
          description: 'An exfoliating treatment that removes dead skin cells and improves circulation for smoother, more radiant skin.',
          category: categoryMap['Body Treatments'],
          duration: 45,
          price: 75,
          isActive: true,
          isPopular: false
        }
      ];
      
      for (const svcData of serviceData) {
        const service = new Service(svcData);
        await service.save();
        console.log(`Created service: ${service.name} ($${service.price}, ${service.duration} mins)`);
      }
    } else {
      console.log(`Found ${existingServices.length} existing services`);
    }
    
    // Final counts
    console.log('\nSetup complete!');
    console.log(`Categories in database: ${await Category.countDocuments()}`);
    console.log(`Services in database: ${await Service.countDocuments()}`);
    
    // List all services
    console.log('\nServices available:');
    const services = await Service.find().populate('category');
    services.forEach((service, idx) => {
      console.log(`[${idx + 1}] ${service.name}`);
      console.log(`  - ID: ${service._id}`);
      console.log(`  - Category: ${service.category?.name}`);
      console.log(`  - Price: $${service.price}`);
      console.log(`  - Duration: ${service.duration} minutes`);
      console.log(`  - Active: ${service.isActive ? 'Yes' : 'No'}`);
      console.log(`  - Popular: ${service.isPopular ? 'Yes' : 'No'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test categories and services:', error);
    process.exit(1);
  }
}

createTestCategoriesAndServices();