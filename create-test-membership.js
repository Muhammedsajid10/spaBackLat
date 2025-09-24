const mongoose = require('mongoose');
const Membership = require('./models/Membership');
const Service = require('./models/Service');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sajidalhijas:zUsF7GJ7Sy7vjy1s@cluster0.govwh3h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

async function createTestMembership() {
  try {
    // First, let's see if there are any services
    const services = await Service.find().limit(1);
    if (services.length === 0) {
      // Create a test service
      const testService = await Service.create({
        name: 'Full Body Massage',
        description: 'Relaxing full body massage',
        duration: 60,
        price: 200,
        category: 'Massage',
        isActive: true
      });
      console.log('✅ Created test service:', testService._id);
    }

    // Get the first service
    const service = await Service.findOne();
    
    // Create a test membership template
    const membershipTemplate = await Membership.create({
      name: 'Premium Massage Package',
      description: 'Premium massage package with 10 sessions',
      serviceType: 'Limited',
      service: service._id,
      serviceName: service.name,
      numberOfSessions: 10,
      paymentType: 'One-time',
      price: 1500,
      currency: 'AED',
      validityPeriod: 6,
      validityUnit: 'months',
      isTemplate: true,
      status: 'Active'
    });
    
    console.log('✅ Created membership template:', membershipTemplate._id);
    console.log('Template details:', {
      name: membershipTemplate.name,
      service: membershipTemplate.serviceName,
      sessions: membershipTemplate.numberOfSessions,
      price: membershipTemplate.price
    });

  } catch (error) {
    console.error('❌ Error creating test membership:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestMembership();