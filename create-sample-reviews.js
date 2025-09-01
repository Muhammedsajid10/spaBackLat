const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Employee = require('./models/Employee');
const Booking = require('./models/Booking');
const Service = require('./models/Service');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URI || 'mongodb://localhost:27017/spa_management')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function createSampleReviews() {
  try {
    console.log('\n🎯 Creating Sample Review Data...\n');

    // Find an employee and service
    const employee = await Employee.findOne().populate('user');
    if (!employee) {
      console.log('❌ No employee found. Please create an employee first.');
      return;
    }

    const service = await Service.findOne();
    if (!service) {
      console.log('❌ No service found. Please create a service first.');
      return;
    }

    console.log(`👤 Creating reviews for: ${employee.user.firstName} ${employee.user.lastName}`);
    console.log(`🏷️  Service: ${service.name}`);

    // Find or create client users
    const clientEmails = [
      'john.doe@client.com',
      'jane.smith@client.com', 
      'mike.johnson@client.com',
      'sarah.wilson@client.com',
      'david.brown@client.com'
    ];

    const clientData = [
      { firstName: 'John', lastName: 'Doe', email: 'john.doe@client.com' },
      { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@client.com' },
      { firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@client.com' },
      { firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@client.com' },
      { firstName: 'David', lastName: 'Brown', email: 'david.brown@client.com' }
    ];

    const clients = [];
    for (let i = 0; i < clientData.length; i++) {
      let client = await User.findOne({ email: clientData[i].email });
      if (!client) {
        client = await User.create({
          ...clientData[i],
          role: 'client',
          password: 'password123',
          phone: `+1555000000${i}`,
          isActive: true
        });
        console.log(`👥 Created client: ${client.firstName} ${client.lastName}`);
      } else {
        console.log(`👥 Found existing client: ${client.firstName} ${client.lastName}`);
      }
      clients.push(client);
    }

    // Sample reviews data
    const reviewsData = [
      {
        rating: 5,
        comment: "Absolutely amazing massage! Very professional and relaxing experience.",
        wouldRecommend: true
      },
      {
        rating: 5,
        comment: "Outstanding service quality. Will definitely come back again!",
        wouldRecommend: true
      },
      {
        rating: 4,
        comment: "Great massage, very skilled therapist. Minor room for improvement.",
        wouldRecommend: true
      },
      {
        rating: 5,
        comment: "Perfect session! Exactly what I needed after a stressful week.",
        wouldRecommend: true
      },
      {
        rating: 4,
        comment: "Very good service overall. Professional and courteous staff.",
        wouldRecommend: true
      }
    ];

    // Create bookings with feedback
    console.log('\n📅 Creating bookings with feedback...');
    
    for (let i = 0; i < Math.min(clients.length, reviewsData.length); i++) {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() - (i + 1) * 3); // Spread over past days

      const booking = await Booking.create({
        bookingNumber: `BK${Date.now()}${i}`,
        client: clients[i]._id,
        appointmentDate,
        status: 'completed',
        services: [{
          service: service._id,
          employee: employee._id,
          price: service.price,
          duration: service.duration,
          startTime: new Date(appointmentDate.getTime() + 9 * 60 * 60 * 1000), // 9 AM
          endTime: new Date(appointmentDate.getTime() + 9 * 60 * 60 * 1000 + service.duration * 60 * 1000)
        }],
        totalAmount: service.price,
        totalDuration: service.duration,
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        feedback: {
          ...reviewsData[i],
          submittedAt: new Date(appointmentDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      });

      console.log(`   ✅ Created booking ${booking.bookingNumber} with ${reviewsData[i].rating}★ rating`);
    }

    console.log('\n🎉 Sample review data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Employee: ${employee.user.firstName} ${employee.user.lastName}`);
    console.log(`   📝 Reviews created: ${reviewsData.length}`);
    console.log(`   ⭐ Ratings: ${reviewsData.map(r => r.rating + '★').join(', ')}`);
    console.log('\n💡 You can now test the reviews API integration in the frontend!');

  } catch (error) {
    console.error('❌ Error creating sample reviews:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createSampleReviews();
