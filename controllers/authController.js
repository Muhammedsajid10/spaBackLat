const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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
  // Skip email sending if SMTP is not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
    console.log('📧 Email sending skipped - SMTP not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Use Gmail App Password
    },
  });

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
  // Skip email sending if SMTP is not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
    console.log('📧 Welcome email skipped - SMTP not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Use Gmail App Password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@spa.com',
    to: email,
    subject: 'Welcome to Allora Spa - Your Account Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Allora Spa!</h2>
        <p>Your  account has been created. Here are your login details:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>Please log in to the employee panel and change your password for security.</p>
        <p>Best regards,<br>Allora Spa Team</p>
      </div>
    `
  };
  try {
    console.log(`📧 Attempting to send welcome email to ${email} using SMTP host ${process.env.SMTP_HOST}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', { to: email, messageId: info.messageId });
  } catch (sendErr) {
    console.error('❌ Failed to send welcome email to:', email, 'Error:', sendErr && sendErr.message ? sendErr.message : sendErr);
    // Re-throwing is not necessary; upstream callers should handle failure without failing signup
  }
}

// Utility to send a client-facing welcome email (friendly, includes login link)
async function sendClientWelcomeEmail(email, password) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
    console.log('📧 Client welcome email skipped - SMTP not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://localhost:5173/login';
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@spa.com',
    to: email,
    subject: 'Welcome to Allora Spa — Your Account is Ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;">
        <h2 style="color:#333;">Welcome to Allora Spa!</h2>
        <p>Thanks for joining Allora Spa. Your account has been created and you can now book appointments online.</p>

        <div style="background:#f5f5f5;padding:15px;border-radius:6px;margin:20px 0;">
          <p style="margin:0"><strong>Login email:</strong> ${email}</p>
          <p style="margin:0"><strong>Temporary password:</strong> ${password}</p>
        </div>

        <p style="margin:0 0 10px 0;">To sign in and manage your bookings, please visit:</p>
        <p><a href="${loginUrl}" style="color:#1d4ed8">${loginUrl}</a></p>

        <p style="color:#666;margin-top:20px;">For security, please change your password after logging in.</p>
        <p style="margin-top:24px;">Best regards,<br/>Allora Spa Team</p>
      </div>
    `
  };

  try {
    console.log(`📧 Attempting to send client welcome email to ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Client welcome email sent:', { to: email, messageId: info.messageId });
  } catch (err) {
    console.error('❌ Failed to send client welcome email to:', email, err && err.message ? err.message : err);
  }
}

// Utility to send membership assignment notification email
async function sendMembershipNotificationEmail(clientEmail, clientName, membershipDetails) {
  // Skip email sending if SMTP is not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
    console.log('📧 Membership notification email skipped - SMTP not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const {
    membershipName,
    serviceName,
    numberOfSessions,
    validityPeriod,
    validityUnit,
    startDate,
    endDate,
    price,
    paymentType,
    serviceType
  } = membershipDetails;

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';
  };

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@spa.com',
    to: clientEmail,
    subject: `🎉 Your ${membershipName} at Allora Spa is Ready!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 300;">Allora Spa</h1>
          <p style="color: #f0f4ff; margin: 10px 0 0 0; font-size: 16px;">Premium Spa & Wellness</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px; background-color: #fff;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            🎉 Congratulations, ${clientName}!
          </h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Your membership has been successfully assigned and is now active. Get ready to enjoy our premium spa services!
          </p>

          <!-- Membership Details Card -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
              ${membershipName}
            </h3>
            
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #666; font-weight: 500;">Service:</span>
                <span style="color: #333; font-weight: 600;">${serviceName}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #666; font-weight: 500;">Sessions:</span>
                <span style="color: #333; font-weight: 600;">
                  ${serviceType === 'Unlimited' ? 'Unlimited Sessions' : `${numberOfSessions} Sessions`}
                </span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #666; font-weight: 500;">Validity:</span>
                <span style="color: #333; font-weight: 600;">${validityPeriod} ${validityUnit}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #666; font-weight: 500;">Start Date:</span>
                <span style="color: #333; font-weight: 600;">${formatDate(startDate)}</span>
              </div>
              
              ${endDate ? `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #666; font-weight: 500;">Valid Until:</span>
                <span style="color: #333; font-weight: 600;">${formatDate(endDate)}</span>
              </div>
              ` : ''}
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                <span style="color: #666; font-weight: 500;">Total Value:</span>
                <span style="color: #667eea; font-weight: 700; font-size: 18px;">AED ${price}</span>
              </div>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 25px; margin: 25px 0; color: #fff;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🚀 What's Next?</h3>
            <ul style="margin: 0; padding: 0; list-style: none;">
              <li style="margin: 8px 0; padding: 0; display: flex; align-items: center;">
                <span style="margin-right: 10px;">📞</span>
                <span>Call us to book your first appointment</span>
              </li>
              <li style="margin: 8px 0; padding: 0; display: flex; align-items: center;">
                <span style="margin-right: 10px;">🗓️</span>
                <span>Visit our spa with your membership details</span>
              </li>
              <li style="margin: 8px 0; padding: 0; display: flex; align-items: center;">
                <span style="margin-right: 10px;">✨</span>
                <span>Enjoy your premium spa experience</span>
              </li>
            </ul>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
            <h4 style="color: #333; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">📍 Visit Us</h4>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Allora Spa Dubai</p>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">📞 +971-XXX-XXXX</p>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">📧 ${process.env.EMAIL_FROM}</p>
          </div>

          <p style="color: #999; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
            Thank you for choosing Allora Spa. We look forward to providing you with an exceptional wellness experience.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #333; padding: 20px 30px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            This email was sent automatically by Allora Spa's membership system.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log('✅ Membership notification email sent to:', clientEmail);
}

// Utility to send gift card notification email
async function sendGiftCardNotificationEmail(recipientEmail, recipientName, giftCardDetails, personalMessage = '') {
  // Skip email sending if SMTP is not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
    console.log('📧 Gift card notification email skipped - SMTP not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const {
    name,
    code,
    value,
    currency,
    expiryDate,
    purchaserName,
    description
  } = giftCardDetails;

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';
  };

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@spa.com',
    to: recipientEmail,
    subject: `🎁 You've Received a Gift Card from Allora Spa!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 300;">🎁 Gift Card</h1>
          <p style="color: #fff; margin: 10px 0 0 0; font-size: 16px;">From Allora Spa Dubai</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px; background-color: #fff;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            🎉 Congratulations, ${recipientName}!
          </h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            You've received a wonderful gift card from ${purchaserName || 'someone special'}! Treat yourself to our premium spa services and enjoy a relaxing experience.
          </p>

          ${personalMessage ? `
          <!-- Personal Message -->
          <div style="background-color: #fef7ff; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #ff9a9e;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💝 Personal Message</h3>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0; font-style: italic;">
              "${personalMessage}"
            </p>
          </div>
          ` : ''}

          <!-- Gift Card Details -->
          <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); border-radius: 12px; padding: 25px; margin: 25px 0; color: #fff; text-align: center;">
            <h3 style="color: #fff; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
              ${name}
            </h3>
            
            <div style="background-color: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="font-size: 14px; color: #fff; opacity: 0.9; margin-bottom: 5px;">Gift Card Code</div>
              <div style="font-size: 24px; font-weight: 700; letter-spacing: 2px; color: #fff;">${code}</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
              <div style="text-align: left;">
                <div style="font-size: 14px; opacity: 0.9;">Value</div>
                <div style="font-size: 28px; font-weight: 700;">${currency} ${value}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 14px; opacity: 0.9;">Expires</div>
                <div style="font-size: 16px; font-weight: 600;">${formatDate(expiryDate)}</div>
              </div>
            </div>
          </div>

          ${description ? `
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0; text-align: center;">
              ${description}
            </p>
          </div>
          ` : ''}

          <!-- How to Use -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; color: #fff;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🛍️ How to Redeem</h3>
            <ul style="margin: 0; padding: 0; list-style: none;">
              <li style="margin: 8px 0; padding: 0; display: flex; align-items: center;">
                <span style="margin-right: 10px;">📞</span>
                <span>Call us to book your appointment</span>
              </li>
              <li style="margin: 8px 0; padding: 0; display: flex; align-items: center;">
                <span style="margin-right: 10px;">🎫</span>
                <span>Present your gift card code: <strong>${code}</strong></span>
              </li>
              <li style="margin: 8px 0; padding: 0; display: flex; align-items: center;">
                <span style="margin-right: 10px;">✨</span>
                <span>Enjoy your spa experience</span>
              </li>
            </ul>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
            <h4 style="color: #333; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">📍 Visit Us</h4>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Allora Spa Dubai</p>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">📞 +971-XXX-XXXX</p>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">📧 ${process.env.EMAIL_FROM}</p>
            <p style="color: #999; margin: 15px 0 5px 0; font-size: 12px;">
              <strong>Terms:</strong> Valid until ${formatDate(expiryDate)}. Cannot be exchanged for cash.
            </p>
          </div>

          <p style="color: #999; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
            We can't wait to pamper you! This gift card is your key to relaxation and wellness at Allora Spa.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #333; padding: 20px 30px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            This gift card was sent automatically by Allora Spa's system.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log('✅ Gift card notification email sent to:', recipientEmail);
}

// Updated utility to send welcome+verification email to employee  
async function sendEmployeeWelcomeVerificationEmail(email, password, verificationToken) {
  // Skip email sending if SMTP is not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
    console.log('📧 Employee welcome email skipped - SMTP not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Use Gmail App Password
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
     
      <p>After verifying, you can <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">login here</a>.</p>
      <p><i>Please change your password after your first login.</i></p>`
  };
  await transporter.sendMail(mailOptions);


   // <p><b>Please verify your email to activate your staff account:</b></p>
      // <a href="${verifyUrl}">${verifyUrl}</a>
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

  // Send welcome email to the new client (if SMTP configured)
  // For admin-created clients we send credentials so they can log in.
  if (email && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await sendWelcomeEmail(email, password);
      console.log('✅ Welcome email sent to new user:', email);
    } catch (emailErr) {
      console.error('❌ Failed to send welcome email to new user:', email, emailErr.message || emailErr);
      // Do not throw — user creation should succeed even if email fails
    }
  } else {
    console.log('⚠️ SMTP not configured or email missing — skipping welcome email for:', email);
  }

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

  // Send customized welcome+verification email to employee (only if email is enabled and configured)
  if (role === 'employee' && process.env.EMAIL_VERIFICATION_ENABLED === 'true') {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        await sendEmployeeWelcomeVerificationEmail(email, password, verificationToken);
        console.log('✅ Welcome email sent to employee:', email);
      } else {
        console.log('⚠️ SMTP not configured, skipping welcome email for employee:', email);
      }
    } catch (emailError) {
      console.error('❌ Failed to send welcome email to employee:', email, emailError.message);
      // Don't throw error - user creation should still succeed even if email fails
    }
  }

  // Send a client-facing welcome email when a client account is created
  if (role === 'client') {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        await sendClientWelcomeEmail(email, password);
        console.log('✅ Client welcome email sent to:', email);
      } else {
        console.log('⚠️ SMTP not configured, skipping client welcome email for:', email);
      }
    } catch (clientEmailErr) {
      console.error('❌ Failed to send client welcome email to:', email, clientEmailErr && clientEmailErr.message ? clientEmailErr.message : clientEmailErr);
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

  if (!user) {
    console.log(`Login attempt: User not found for email: ${email}`);
    return res.status(401).json({
      success: false,
      message: 'Incorrect email or password'
    });
  }
  
  // Additional debug information
  console.log(`Login attempt for: ${email}`);
  console.log(`Password provided: ${password ? '********' : 'empty'}`);
  console.log(`User has password: ${user.password ? 'Yes' : 'No'}`);
  
  // Explicitly check password
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  
  if (!isPasswordCorrect) {
    console.log(`Login attempt failed: Password incorrect for user: ${email}`);
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

// Admin: Update any user's profile
const adminUpdateUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }

  // Filter out unwanted fields that are not allowed to be updated
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'email', 'dateOfBirth', 'gender', 
    'address', 'profileImage', 'preferences'
  ];
  
  const filteredBody = {};
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) {
      filteredBody[el] = req.body[el];
    }
  });

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(userId, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'User profile updated successfully',
    data: {
      user: updatedUser
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
  adminVerifyUserEmail,
  adminUpdateUser,
  sendMembershipNotificationEmail,
  sendGiftCardNotificationEmail
};

