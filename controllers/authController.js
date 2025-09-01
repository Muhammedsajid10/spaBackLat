const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createSendToken } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');

// Helper function to handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Utility to send verification email
async function sendVerificationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/v1/auth/verify-email/${token}`;
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@spa.com',
    to: email,
    subject: 'Verify your email',
    html: `<p>Thank you for registering! Please verify your email by clicking the link below:</p>
           <a href="${verifyUrl}">${verifyUrl}</a>`
  };
  await transporter.sendMail(mailOptions);
}

// Utility to send welcome email to employee
async function sendWelcomeEmail(email, password) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@spa.com',
    to: email,
    subject: 'Welcome to Our Spa - Your Login Details',
    html: `<h2>Welcome to Our Spa!</h2>
      <p>Your account has been created. Here are your login details:</p>
      <ul>
        <li><b>Email:</b> ${email}</li>
        <li><b>Password:</b> ${password}</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Login here</a></p>
      <p>Please change your password after your first login.</p>`
  };
  await transporter.sendMail(mailOptions);
}

// Utility to send welcome+verification email to employee
async function sendEmployeeWelcomeVerificationEmail(email, password, verificationToken) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@spa.com',
    to: email,
    subject: 'Welcome to Our Spa Team - Verify Your Email & Login Details',
    html: `<h2>Welcome to Our Spa Team!</h2>
      <p>Your employee account has been created. Here are your login details:</p>
      <ul>
        <li><b>Email:</b> ${email}</li>
        <li><b>Password:</b> ${password}</li>
      </ul>
      <p><b>Please verify your email to activate your staff account:</b></p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>After verifying, you can <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">login here</a>.</p>
      <p><i>Please change your password after your first login.</i></p>`
  };
  await transporter.sendMail(mailOptions);
}

// Register a new user
const signup = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    dateOfBirth,
    gender,
    address,
    role = 'client',
    adminSecret // Secret key for admin creation
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Determine user role based on admin secret
  let userRole = 'client';
  if (role === 'admin') {
    // Check if admin secret is provided and matches environment variable
    if (adminSecret && adminSecret === process.env.ADMIN_CREATION_SECRET) {
      userRole = 'admin';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Admin creation requires valid secret key'
      });
    }
  }

  // Create new user
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    dateOfBirth,
    gender,
    address,
    role: role === 'admin' ? 'client' : role, // Prevent admin creation through signup
    isEmailVerified: true // All users are auto-verified
  });

  // Original verification code (commented out)
  /*
  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  newUser.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  newUser.isEmailVerified = false;
  await newUser.save({ validateBeforeSave: false });
  
  // Send verification email if enabled
  if (process.env.EMAIL_VERIFICATION_ENABLED === 'true') {
    await sendVerificationEmail(email, verificationToken);
  }
  */
  
  // Verification emails disabled
  let verificationToken;

  // Send customized welcome+verification email to employee
  if (role === 'employee') {
    if (process.env.EMAIL_VERIFICATION_ENABLED === 'true') {
      await sendEmployeeWelcomeVerificationEmail(email, password, verificationToken);
    } else {
      await sendWelcomeEmail(email, password);
    }
  }

  createSendToken(newUser, 201, req, res, 'User registered successfully');
});

// Login user
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect email or password'
    });
  }

  // 3) Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.'
    });
  }

  // 4) Email verification check - DISABLED (commented out)
  /*
  if (!user.isEmailVerified) {
    return res.status(401).json({
      success: false,
      message: 'Please verify your email before logging in'
    });
  }
  */
  
  // Auto-verify users if they're not already verified
  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });
    console.log(`Auto-verified user: ${user.email}`);
  }

  // 5) If everything ok, send token to client
  createSendToken(user, 200, req, res, 'Login successful');
});

// Logout user
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Forgot password
const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'There is no user with that email address'
    });
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    // Use frontend URL for the reset link
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send password reset email using EmailService
    const EmailService = require('../services/emailService');
    const emailService = new EmailService();
    
    await emailService.sendPasswordResetEmail(
      user.email, 
      resetURL, 
      user.firstName || 'User'
    );

    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to your email',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (err) {
    console.error('Password reset email error:', err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'There was an error sending the email. Try again later.'
    });
  }
});

// Reset password
const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token is invalid or has expired'
    });
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  // If user successfully resets password, we can assume email is verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // 3) Log the user in, send JWT
  createSendToken(user, 200, req, res, 'Password reset successful');
});

// Update password for logged in user
const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return res.status(401).json({
      success: false,
      message: 'Your current password is incorrect'
    });
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordChangedAt = new Date();
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res, 'Password updated successfully');
});

// Verify email
const verifyEmail = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken
  });

  // 2) If token is valid, verify the email
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token is invalid'
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// Resend verification email
const resendVerificationEmail = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No user found with that email address'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email
  await sendVerificationEmail(user.email, verificationToken);

  res.status(200).json({
    success: true,
    message: 'Verification email sent',
    verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
  });
});

// Get current user profile
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// Update current user profile
const updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return res.status(400).json({
      success: false,
      message: 'This route is not for password updates. Please use /update-password'
    });
  }

  // 2) Filter out unwanted fields that are not allowed to be updated
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 
    'address', 'profileImage', 'preferences'
  ];
  
  const filteredBody = {};
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) {
      filteredBody[el] = req.body[el];
    }
  });

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
});

// Deactivate current user account
const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  res.status(204).json({
    success: true,
    message: 'Account deactivated successfully',
    data: null
  });
});

// Refresh token
const refreshToken = catchAsync(async (req, res, next) => {
  // Get the current user
  const user = await User.findById(req.user.id);
  
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'User not found or inactive'
    });
  }

  // Generate new token
  createSendToken(user, 200, req, res, 'Token refreshed successfully');
});

// Social authentication - Facebook
const facebookAuth = catchAsync(async (req, res, next) => {
  const { accessToken, userID } = req.body;

  if (!accessToken || !userID) {
    return res.status(400).json({
      success: false,
      message: 'Facebook access token and user ID are required'
    });
  }

  try {
    // In a real implementation, you would verify the Facebook token
    // For now, we'll simulate the process
    // const facebookUser = await verifyFacebookToken(accessToken, userID);
    
    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: req.body.email },
        { 'socialAuth.facebook.id': userID }
      ]
    });

    if (!user) {
      // Create new user
      user = await User.create({
        firstName: req.body.firstName || 'Facebook',
        lastName: req.body.lastName || 'User',
        email: req.body.email,
        password: crypto.randomBytes(32).toString('hex'), // Random password for social auth
        isEmailVerified: true,
        socialAuth: {
          facebook: {
            id: userID,
            accessToken: accessToken
          }
        },
        role: 'client'
      });
    } else {
      // Update existing user's Facebook info
      user.socialAuth = user.socialAuth || {};
      user.socialAuth.facebook = {
        id: userID,
        accessToken: accessToken
      };
      await user.save({ validateBeforeSave: false });
    }

    createSendToken(user, 200, req, res, 'Facebook login successful');
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Facebook authentication failed'
    });
  }
});

// Social authentication - Google
const googleAuth = catchAsync(async (req, res, next) => {
  const { idToken, accessToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'Google ID token is required'
    });
  }

  try {
    // In a real implementation, you would verify the Google token
    // For now, we'll simulate the process
    // const googleUser = await verifyGoogleToken(idToken);
    
    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: req.body.email },
        { 'socialAuth.google.id': req.body.googleId }
      ]
    });

    if (!user) {
      // Create new user
      user = await User.create({
        firstName: req.body.firstName || 'Google',
        lastName: req.body.lastName || 'User',
        email: req.body.email,
        password: crypto.randomBytes(32).toString('hex'), // Random password for social auth
        isEmailVerified: true,
        socialAuth: {
          google: {
            id: req.body.googleId,
            idToken: idToken,
            accessToken: accessToken
          }
        },
        role: 'client'
      });
    } else {
      // Update existing user's Google info
      user.socialAuth = user.socialAuth || {};
      user.socialAuth.google = {
        id: req.body.googleId,
        idToken: idToken,
        accessToken: accessToken
      };
      await user.save({ validateBeforeSave: false });
    }

    createSendToken(user, 200, req, res, 'Google login successful');
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

// Production admin creation (only existing admins can create new admins)
const createAdminUser = catchAsync(async (req, res, next) => {
  // This middleware ensures only admins can access this route
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    dateOfBirth,
    gender,
    address
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create admin user
  const newAdmin = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    dateOfBirth,
    gender,
    address,
    role: 'admin',
    isEmailVerified: true
  });

  res.status(201).json({
    success: true,
    message: 'Admin user created successfully',
    data: {
      user: {
        _id: newAdmin._id,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
        role: newAdmin.role
      }
    }
  });
});

// Admin: Manually verify user email
const adminVerifyUserEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Email verified for user: ${user.email}`,
    data: {
      email: user.email,
      isEmailVerified: user.isEmailVerified
    }
  });
});

module.exports = {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerificationEmail,
  getMe,
  updateMe,
  deleteMe,
  refreshToken,
  facebookAuth,
  googleAuth,
  createAdminUser,
  adminVerifyUserEmail
};

