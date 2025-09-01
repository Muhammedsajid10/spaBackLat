const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const testClients = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    phone: '+1234567890',
    role: 'client',
    isEmailVerified: true,
    isActive: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    phone: '+1234567891',
    role: 'client',
    isEmailVerified: true,
    isActive: true
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    password: 'password123',
    phone: '+1234567892',
    role: 'client',
    isEmailVerified: true,
    isActive: true
  },
  {
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.williams@example.com',
    password: 'password123',
    phone: '+1234567893',
    role: 'client',
    isEmailVerified: true,
    isActive: true
  },
  {
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@example.com',
    password: 'password123',
    phone: '+1234567894',
    role: 'client',
    isEmailVerified: true,
    isActive: true
  }
];

const seedClients = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected');

    console.log('🧹 Clearing existing test clients...');
    await User.deleteMany({ 
      email: { $in: testClients.map(client => client.email) }
    });
    console.log('✅ Existing test clients cleared');

    console.log('👥 Creating test clients...');
    const createdClients = await User.create(testClients);
    console.log(`✅ Created ${createdClients.length} test clients`);

    console.log('📋 Test clients created:');
    createdClients.forEach(client => {
      console.log(`   - ${client.firstName} ${client.lastName} (${client.email})`);
    });

    console.log('\n🎉 Client seeding completed successfully!');
    console.log('💡 You can now test the client search functionality in the booking modal.');

  } catch (error) {
    console.error('❌ Error seeding clients:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

// Run seeding
seedClients(); 