const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const verifyEmail = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📧 MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    const User = require('./models/User');
    
    // Find the user
    const user = await User.findOne({ email: 'akarsh348@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found with email: akarsh348@gmail.com');
      return;
    }

    console.log('👤 Found user:', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive
    });

    // Verify the email if not already verified
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();
      console.log('✅ Email verified successfully!');
    } else {
      console.log('✅ Email is already verified');
    }

    console.log('📧 Final verification status:', user.isEmailVerified);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

verifyEmail(); 