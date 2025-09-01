const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const init = async () => {
  console.log('🚀 Starting SPA Backend Initialization...\n');

  // Step 1: Validate environment variables
  console.log('📋 Step 1: Validating environment variables...');
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Please copy env.example to .env and fill in the required values');
    process.exit(1);
  }

  console.log('✅ Environment variables validated\n');

  // Step 2: Test database connection
  console.log('🔌 Step 2: Testing database connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connection successful');
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Please check your MONGODB_URI in .env file');
    process.exit(1);
  }

  // Step 3: Create necessary directories
  console.log('\n📁 Step 3: Creating necessary directories...');
  const directories = [
    'uploads',
    'uploads/images',
    'uploads/documents',
    'logs'
  ];

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`ℹ️  Directory already exists: ${dir}`);
    }
  });

  // Step 4: Create admin user
  console.log('\n👤 Step 4: Creating admin user...');
  try {
    // Import and run admin creation
    const { execSync } = require('child_process');
    execSync('node scripts/createAdmin.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  }

  // Step 5: Security checklist
  console.log('\n🔒 Step 5: Security checklist...');
  const securityChecks = [
    {
      name: 'JWT Secret',
      check: () => process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-super-secret-jwt-key-change-this-in-production',
      message: 'JWT_SECRET should be changed from default value'
    },
    {
      name: 'Environment',
      check: () => process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development',
      message: 'NODE_ENV should be set to production or development'
    },
    {
      name: 'CORS Origins',
      check: () => process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS !== '*',
      message: 'ALLOWED_ORIGINS should be configured for production'
    }
  ];

  securityChecks.forEach(check => {
    if (check.check()) {
      console.log(`✅ ${check.name}: OK`);
    } else {
      console.log(`⚠️  ${check.name}: ${check.message}`);
    }
  });

  // Step 6: Final setup instructions
  console.log('\n🎉 Initialization completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Start the server: npm run dev');
  console.log('2. Test the API: http://localhost:3000/health');
  console.log('3. Login as admin: POST /api/v1/auth/login');
  console.log('4. Change admin password after first login');
  console.log('5. Configure additional environment variables as needed');
  
  console.log('\n🔗 Useful endpoints:');
  console.log('- Health check: GET /health');
  console.log('- API docs: GET /api');
  console.log('- Admin panel: /api/v1/admin');
  console.log('- Booking system: /api/v1/bookings');
  
  console.log('\n⚠️  Security reminders:');
  console.log('- Change default admin password');
  console.log('- Update JWT_SECRET in production');
  console.log('- Configure CORS origins for production');
  console.log('- Set up proper logging and monitoring');
  console.log('- Enable HTTPS in production');
  
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

// Run initialization
init(); 