const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper function to handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Reset password for a user (admin only)
 */
const nodemailer = require('nodemailer');

// Helper function to send password reset email
const sendPasswordResetNotification = async (email, newPassword) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SENDGRID_API_KEY,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'no-reply@spa.com',
      to: email,
      subject: 'Your Password Has Been Reset',
      html: `<h2>Password Reset Notification</h2>
        <p>Your password has been reset by an administrator.</p>
        <p>Your new password is: <strong>${newPassword}</strong></p>
        <p>Please login with this new password and consider changing it to something you'll remember.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Login here</a></p>
        <p><i>If you did not request this change, please contact your administrator immediately.</i></p>`
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

const resetUserPassword = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  
  // Check if admin privilege exists
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }
  
  // Validate request body
  if (!req.body.newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password is required'
    });
  }
  
  // Validate password requirements
  const password = req.body.newPassword;
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  // Find the user
  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Update user password using direct method to avoid any double-hashing issues
  const plainPassword = req.body.newPassword;
  
  // Directly hash and set the password to bypass any pre-save hooks
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  
  // Direct update using findByIdAndUpdate to avoid pre-save hooks completely
  await User.findByIdAndUpdate(
    userId,
    {
      password: hashedPassword,
      passwordChangedAt: new Date()
    }
  );
  
  // Double-check that the password was saved correctly
  const updatedUser = await User.findById(userId).select('+password');
  const passwordValid = await bcrypt.compare(plainPassword, updatedUser.password);
  
  if (!passwordValid) {
    console.error(`WARNING: Password reset for user ${userId} may have failed validation check!`);
  } else {
    console.log(`Password reset for user ${userId} was successful and validated.`);
  }
  
  // Send email notification with the new password
  try {
    await sendPasswordResetNotification(user.email, plainPassword);
    console.log(`Password reset notification email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Continue execution even if email fails
  }
  
  // Log successful password reset for debugging
  console.log(`Password reset by admin (${req.user.email}) for user: ${user.email}`);
  console.log(`New password (plaintext): ${plainPassword}`);
  console.log(`User ID: ${userId}, Role: ${user.role}`);
  console.log('---------------------------------------');
  
  res.status(200).json({
    success: true,
    message: `Password reset successfully. A notification has been sent to ${user.email}.`
  });
});

/**
 * Generate a random password
 */
const generateRandomPassword = catchAsync(async (req, res, next) => {
  const length = req.query.length || 10;
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  res.status(200).json({
    success: true,
    data: {
      password
    }
  });
});

module.exports = {
  resetUserPassword,
  generateRandomPassword
};