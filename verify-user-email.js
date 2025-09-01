const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function verifyUserEmail() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        // Get email from command line argument or use default
        const email = process.argv[2] || 'sajidalhijas@gmail.com';
        
        console.log(`Looking for user with email: ${email}`);
        
        // Find and update user
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log(`Found user: ${user.firstName} ${user.lastName}`);
        console.log(`Current email verification status: ${user.isEmailVerified}`);

        // Update email verification
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        console.log('✅ Email verification updated successfully!');
        console.log(`New email verification status: ${user.isEmailVerified}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
        process.exit(0);
    }
}

// Run the function
verifyUserEmail();
