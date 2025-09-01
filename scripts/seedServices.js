const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

const services =  [
  {
    name: 'Relaxing Massage',
    description: 'Indulge in a blissful escape with a relaxing massage. Feel tension melt away as skilled therapists work their magic on your tired muscles.',
    category: 'Massage',
    duration: 60,
    price: 410,
    discountPrice: 350,
    isActive: true,
    isPopular: true,
    benefits: ['Reduces stress', 'Improves circulation', 'Relieves muscle tension'],
    preparationInstructions: ['Arrive 10 minutes early', 'Wear comfortable clothing'],
    aftercareInstructions: ['Drink plenty of water', 'Rest for 30inutes']
  },
  {
    name: 'Swedish Massage',
    description: 'Experience the therapeutic benefits of Swedish massage techniques designed to promote relaxation and improve overall well-being.',
    category: 'Massage',
    duration: 60,
    price: 410,
    isActive: true,
    isPopular: false,
    benefits: ['Promotes relaxation', 'Improves flexibility', 'Enhances circulation'],
    preparationInstructions: ['Avoid heavy meals', 'Stay hydrated'],
    aftercareInstructions: ['Rest for 20', 'Avoid strenuous activity']
  },
  {
    name: 'Deep Tissue Massage',
    description: 'Intensive massage targeting deep muscle layers for ultimate relief from chronic pain and muscle tension.',
    category: 'Massage',
    duration: 60,
    price: 450,
    isActive: true,
    isPopular: true,
    benefits: ['Relieves chronic pain', 'Breaks down scar tissue', 'Improves posture'],
    preparationInstructions: ['Communicate pain levels', 'Stay hydrated'],
    aftercareInstructions: ['Apply ice if needed', 'Gentle stretching']
  },
  {
    name: 'Turkish Bath',
    description: 'Traditional Turkish bath experience with steam and exfoliation for deep cleansing and relaxation.',
    category: 'Body Treatment',
    duration: 45,
    price: 350,
    isActive: true,
    isPopular: false,
    benefits: ['Deep cleansing', 'Improves skin texture', 'Relaxation'],
    preparationInstructions: ['Remove all jewelry', 'Bring swimwear'],
    aftercareInstructions: ['Moisturize skin', 'Stay hydrated']
  },
  {
    name: 'Hydrating Facial',
    description: 'Rejuvenating facial treatment for glowing, hydrated skin using premium skincare products.',
    category: 'Facial',
    duration: 60,
    price: 380,
    discountPrice: 320,
    isActive: true,
    isPopular: true,
    benefits: ['Deep hydration', 'Improves skin texture', 'Anti-aging effects'],
    preparationInstructions: ['Remove makeup', 'Clean face thoroughly'],
    aftercareInstructions: ['Avoid sun exposure', 'Use gentle cleanser']
  },
  {
    name: 'Classic Manicure',
    description: 'Professional nail care service including shaping, cuticle care, and polish application.',
    category: 'Nail Care',
    duration: 30,
    price: 120,
    isActive: true,
    isPopular: false,
    benefits: ['Healthy nails', 'Improved appearance', 'Relaxation'],
    preparationInstructions: ['Remove old polish', 'Clean hands'],
    aftercareInstructions: ['Avoid water for 2 hours', 'Apply cuticle oil']
  },
  {
    name: 'Aromatherapy Session',
    description: 'Therapeutic session using essential oils to promote physical and emotional well-being.',
    category: 'Aromatherapy',
    duration: 45,
    price: 280,
    isActive: true,
    isPopular: false,
    benefits: ['Stress relief', 'Mood enhancement', 'Better sleep'],
    preparationInstructions: ['Avoid strong perfumes', 'Wear comfortable clothes'],
    aftercareInstructions: ['Rest for 15es', 'Avoid strong scents']
  },
  {
    name: 'Wellness Package',
    description: 'Comprehensive wellness package including massage, facial, and aromatherapy for complete rejuvenation.',
    category: 'Package',
    duration: 120,
    price: 850,
    discountPrice: 720,
    isActive: true,
    isPopular: true,
    benefits: ['Complete relaxation', 'Multiple treatments', 'Long-lasting effects'],
    preparationInstructions: ['Arrive 15 minutes early', 'Bring comfortable clothes'],
    aftercareInstructions: ['Rest for 1 hour', 'Stay hydrated', 'Avoid strenuous activity']
  }
];

const seedServices = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing services
    await Service.deleteMany({});
    console.log('Cleared existing services');
    // Insert new services
    const createdServices = await Service.insertMany(services);
    console.log(`Successfully seeded ${createdServices.length} services`);

    // Display created services
    createdServices.forEach(service => {
      console.log(`- ${service.name} (${service.category}) - AED ${service.price}`);
    });

    console.log('Service seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding services:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedServices();