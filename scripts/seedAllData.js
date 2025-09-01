const mongoose = require('mongoose');
const Category = require('../models/Category');
const Service = require('../models/Service');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
   await mongoose.connect(process.env.MONGODB_URI, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
       });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Categories data
const categoriesData = [
  {
    name: 'facial',
    displayName: 'Facial'
  },
  {
    name: 'massage',
    displayName: 'Massage'
  },
  {
    name: 'body-treatment',
    displayName: 'Body Treatment'
  },
  {
    name: 'nail-care',
    displayName: 'Nail Care'
  },
  {
    name: 'hair-care',
    displayName: 'Hair Care'
  },
  {
    name: 'aromatherapy',
    displayName: 'Aromatherapy'
  },
  {
    name: 'wellness',
    displayName: 'Wellness'
  },
  {
    name: 'package',
    displayName: 'Package'
  }
];

// Services data (will be created with proper category references)
const servicesData = [
  // Facial Services
  {
    name: 'Deep Cleansing Facial',
    description: 'A thorough facial treatment that cleanses, exfoliates, and purifies your skin.',
    categoryName: 'facial',
    duration: 60,
    price: 150,
    discountPrice: 120,
    isActive: true,
    isPopular: true
  },
  {
    name: 'Anti-Aging Facial',
    description: 'Advanced facial treatment targeting fine lines and wrinkles for youthful skin.',
    categoryName: 'facial',
    duration: 75,
    price: 200,
    isActive: true
  },
  {
    name: 'Hydrating Facial',
    description: 'Moisturizing facial treatment perfect for dry and dehydrated skin.',
    categoryName: 'facial',
    duration: 50,
    price: 130,
    isActive: true
  },

  // Massage Services
  {
    name: 'Swedish Massage',
    description: 'Classic relaxing massage using long, flowing strokes to reduce tension.',
    categoryName: 'massage',
    duration: 60,
    price: 180,
    isActive: true,
    isPopular: true
  },
  {
    name: 'Deep Tissue Massage',
    description: 'Therapeutic massage targeting deep muscle layers to relieve chronic pain.',
    categoryName: 'massage',
    duration: 90,
    price: 250,
    discountPrice: 220,
    isActive: true
  },
  {
    name: 'Hot Stone Massage',
    description: 'Relaxing massage using heated stones to melt away tension and stress.',
    categoryName: 'massage',
    duration: 75,
    price: 220,
    isActive: true
  },
  {
    name: 'Couples Massage',
    description: 'Romantic massage experience for two people in a shared room.',
    categoryName: 'massage',
    duration: 60,
    price: 300,
    isActive: true
  },

  // Body Treatment Services
  {
    name: 'Body Scrub & Wrap',
    description: 'Exfoliating body scrub followed by a nourishing wrap treatment.',
    categoryName: 'body-treatment',
    duration: 90,
    price: 200,
    isActive: true
  },
  {
    name: 'Detox Body Wrap',
    description: 'Purifying body treatment to eliminate toxins and improve skin texture.',
    categoryName: 'body-treatment',
    duration: 75,
    price: 180,
    isActive: true
  },
  {
    name: 'Cellulite Treatment',
    description: 'Specialized body treatment targeting cellulite and improving skin firmness.',
    categoryName: 'body-treatment',
    duration: 60,
    price: 160,
    isActive: true
  },

  // Nail Care Services
  {
    name: 'Classic Manicure',
    description: 'Traditional manicure with nail shaping, cuticle care, and polish.',
    categoryName: 'nail-care',
    duration: 45,
    price: 80,
    isActive: true,
    isPopular: true
  },
  {
    name: 'Gel Manicure',
    description: 'Long-lasting gel manicure with UV/LED curing for chip-free nails.',
    categoryName: 'nail-care',
    duration: 60,
    price: 120,
    isActive: true
  },
  {
    name: 'Classic Pedicure',
    description: 'Relaxing pedicure with foot soak, nail care, and polish application.',
    categoryName: 'nail-care',
    duration: 50,
    price: 90,
    isActive: true
  },
  {
    name: 'Deluxe Pedicure',
    description: 'Luxurious pedicure with extended massage and premium treatments.',
    categoryName: 'nail-care',
    duration: 75,
    price: 130,
    discountPrice: 110,
    isActive: true
  },

  // Hair Care Services
  {
    name: 'Hair Cut & Style',
    description: 'Professional haircut with styling to enhance your natural beauty.',
    categoryName: 'hair-care',
    duration: 60,
    price: 100,
    isActive: true
  },
  {
    name: 'Hair Color & Highlights',
    description: 'Complete hair coloring service with highlights for a fresh new look.',
    categoryName: 'hair-care',
    duration: 120,
    price: 250,
    isActive: true
  },
  {
    name: 'Deep Conditioning Treatment',
    description: 'Intensive hair treatment to restore moisture and shine to damaged hair.',
    categoryName: 'hair-care',
    duration: 45,
    price: 80,
    isActive: true
  },

  // Aromatherapy Services
  {
    name: 'Aromatherapy Massage',
    description: 'Therapeutic massage using essential oils for relaxation and healing.',
    categoryName: 'aromatherapy',
    duration: 75,
    price: 190,
    isActive: true
  },
  {
    name: 'Essential Oil Facial',
    description: 'Facial treatment incorporating essential oils for skin rejuvenation.',
    categoryName: 'aromatherapy',
    duration: 60,
    price: 160,
    isActive: true
  },

  // Wellness Services
  {
    name: 'Meditation Session',
    description: 'Guided meditation session to reduce stress and promote mental well-being.',
    categoryName: 'wellness',
    duration: 30,
    price: 60,
    isActive: true
  },
  {
    name: 'Yoga Class',
    description: 'Private yoga session tailored to your fitness level and goals.',
    categoryName: 'wellness',
    duration: 60,
    price: 100,
    isActive: true
  },
  {
    name: 'Sound Therapy',
    description: 'Healing sound therapy session using singing bowls and other instruments.',
    categoryName: 'wellness',
    duration: 45,
    price: 80,
    isActive: true
  },

  // Package Services
  {
    name: 'Wellness Package',
    description: 'Holistic wellness package including massage, meditation, and healthy refreshments. Nurture your mind, body, and spirit.',
    categoryName: 'package',
    duration: 150,
    price: 350,
    discountPrice: 300,
    isActive: true,
    isPopular: true
  },
  {
    name: 'Couples Retreat',
    description: 'Romantic package for couples including massages and champagne. Perfect for celebrating special moments together.',
    categoryName: 'package',
    duration: 120,
    price: 400,
    isActive: true
  },
  {
    name: 'Bridal Package',
    description: 'Complete bridal beauty package with facial, manicure, pedicure, and hair styling.',
    categoryName: 'package',
    duration: 240,
    price: 500,
    discountPrice: 450,
    isActive: true
  },
  {
    name: 'Spa Day Package',
    description: 'Full day spa experience with multiple treatments and lunch included.',
    categoryName: 'package',
    duration: 360,
    price: 600,
    isActive: true
  }
];

const seedAllData = async () => {
  try {
    console.log('🚀 Starting fresh data seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Service.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Existing services and categories cleared');

    // Create categories
    console.log('📂 Creating categories...');
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create a map of category names to IDs
    const categoryMap = {};
    createdCategories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // Create services with proper category references
    console.log('🛠️ Creating services...');
    const servicesWithCategoryIds = servicesData.map(service => {
      const { categoryName, ...serviceData } = service;
      return {
        ...serviceData,
        category: categoryMap[categoryName]
      };
    });

    const createdServices = await Service.insertMany(servicesWithCategoryIds);
    console.log(`✅ Created ${createdServices.length} services`);

    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log(`Categories: ${createdCategories.length}`);
    console.log(`Services: ${createdServices.length}`);
    
    // Show services by category
    for (const category of createdCategories) {
      const serviceCount = createdServices.filter(service => 
        service.category.toString() === category._id.toString()
      ).length;
      console.log(`  - ${category.displayName}: ${serviceCount} services`);
    }

    console.log('\n🎉 Fresh data seeding completed successfully!');
    console.log('💡 You can now refresh your frontend to see the new data with proper category counts.');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
};

// Run the seeding
const runSeeding = async () => {
  await connectDB();
  await seedAllData();
};

// Check if script is run directly
if (require.main === module) {
  runSeeding();
}

module.exports = { seedAllData };
