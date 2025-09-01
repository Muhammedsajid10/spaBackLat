const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const categories = [
  { name: 'facial', displayName: 'Facial' },
  { name: 'massage', displayName: 'Massage' },
  { name: 'body-treatment', displayName: 'Body Treatment' },
  { name: 'nail-care', displayName: 'Nail Care' },
  { name: 'hair-care', displayName: 'Hair Care' },
  { name: 'aromatherapy', displayName: 'Aromatherapy' },
  { name: 'wellness', displayName: 'Wellness' },
  { name: 'package', displayName: 'Package' }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB using the same URI as the main app
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories seeded successfully:', createdCategories.length);
    
    createdCategories.forEach(cat => {
      console.log(`- ${cat.displayName} (${cat._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedCategories();
}

module.exports = { seedCategories, categories };
