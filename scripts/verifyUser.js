const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const verifyUserEmail = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sajidalhijas:mymu@cluster0.ykseuffb.mongodb.net/?retryWrites=true&w=majority&appName=spa-booking');
    console.log('✅ Connected to MongoDB');

    // Import User model
    const User = require('../models/User');

    // Find and update the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    console.log('👤 Found user:', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    });

    // Verify email if not already verified
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
      console.log('✅ Email verified successfully for:', email);
    } else {
      console.log('✅ Email already verified for:', email);
    }

    console.log('📧 User email verification status:', user.isEmailVerified);
    console.log('👑 User role:', user.role);

    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node verifyUser.js <email>');
  process.exit(1);
}

// Run the verification
verifyUserEmail(email); 