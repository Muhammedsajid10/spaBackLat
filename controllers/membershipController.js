const Membership = require('../models/Membership');
const Service = require('../models/Service');
const User = require('../models/User');
const mongoose = require('mongoose');
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.warn('⚠️ Stripe initialization failed:', e && e.message ? e.message : e);
    stripe = null;
  }
} else {
  console.log('⚠️ STRIPE_SECRET_KEY not configured - stripe functionality will be disabled (mock mode).');
}
const { sendMembershipNotificationEmail } = require('./authController');


const getAllMembershipTemplates = async (req, res) => {
  try {
    console.log('📋 Fetching membership templates...');
    
    const memberships = await Membership.find({ isTemplate: true })
      .populate('services', 'name price duration')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      results: memberships.length, 
      data: { memberships } 
    });
  } catch (err) {
    console.error('❌ Error fetching templates:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch membership templates', 
      error: err.message 
    });
  }
};

const getAllPurchasedMemberships = async (req, res) => {
  try {
    let memberships = await Membership.find({ isTemplate: false })
      .populate('client', 'firstName lastName email')
      .populate('services', 'name price duration')
      .sort({ purchaseDate: -1 });

    // Debug: log how many have populated client
    const populatedCount = memberships.filter(m => m.client && typeof m.client === 'object' && m.client.firstName).length;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`👀 Purchased memberships fetched: ${memberships.length}; populated clients: ${populatedCount}`);
    }

    // Fallback manual hydration if some clients not populated (still string/ObjectId)
    const missingClientIds = [...new Set(
      memberships
        .filter(m => m.client && (typeof m.client === 'string' || (m.client instanceof mongoose.Types.ObjectId) || (m.client._id && !m.client.firstName)))
        .map(m => (typeof m.client === 'string' ? m.client : m.client._id ? m.client._id.toString() : m.client.toString()))
    )];

    if (missingClientIds.length) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Performing manual client hydration for IDs:', missingClientIds);
      }
      const users = await User.find({ _id: { $in: missingClientIds } }).select('firstName lastName email');
      const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
      memberships = memberships.map(m => {
        if (m.client && (typeof m.client === 'string' || (m.client instanceof mongoose.Types.ObjectId) || (m.client._id && !m.client.firstName))) {
          const id = typeof m.client === 'string' ? m.client : m.client._id ? m.client._id.toString() : m.client.toString();
          if (userMap[id]) {
            // Replace client with lightweight user object
            m = m.toObject();
            m.client = userMap[id];
            return m;
          }
        }
        return m;
      });
    }

    res.status(200).json({ 
      success: true, 
      results: memberships.length, 
      data: { memberships } 
    });
  } catch (err) {
    console.error('❌ Error fetching purchased memberships:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch purchased memberships', 
      error: err.message 
    });
  }
};


const createMembershipTemplate = async (req, res) => {
  try {
    console.log('🆕 Creating membership template. Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request headers authorization:', req.headers.authorization);
    console.log('🔍 Request user:', req.user ? req.user._id : 'No user');
    
    // Validate required fields
  const requiredFields = ['name', 'description', 'services', 'price', 'validityPeriod', 'validityUnit', 'serviceType'];
  const missingFields = requiredFields.filter(field => !req.body[field] || (Array.isArray(req.body[field]) && req.body[field].length === 0));
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }
    
    // Validate services exist
    if (!req.body.services || !Array.isArray(req.body.services) || req.body.services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service is required for membership template'
      });
    }
    console.log('🔍 Looking for services with IDs:', req.body.services);
    const serviceDocs = await Service.find({ _id: { $in: req.body.services } });
    if (!serviceDocs || serviceDocs.length !== req.body.services.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more services not found'
      });
    }
    const serviceNames = serviceDocs.map(s => s.name);
    console.log('✅ Services found:', serviceNames);
    const membershipData = {
      ...req.body,
      serviceNames,
      isTemplate: true,
      createdBy: req.user ? req.user._id : null,
      status: 'Draft'
    };

    console.log('🔍 Final membership data to create:', JSON.stringify(membershipData, null, 2));

    const membership = await Membership.create(membershipData);
    
    console.log('✅ Membership created successfully:', membership._id);
    
    res.status(201).json({ 
      success: true, 
      data: { membership } 
    });
  } catch (err) {
    console.error('❌ Error creating template - Full error object:', err);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);
    console.error('❌ Validation errors:', err.errors);
    
    let errorMessage = 'Failed to create membership template';
    let statusCode = 400;
    
    if (err.name === 'ValidationError') {
      const validationMessages = Object.values(err.errors).map(e => e.message);
      errorMessage = `Validation failed: ${validationMessages.join(', ')}`;
      console.log('❌ Validation error details:', validationMessages);
    } else if (err.name === 'CastError') {
      errorMessage = 'Invalid data format provided';
      console.log('❌ Cast error - invalid ObjectId or data type');
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: err.message,
      validationErrors: err.errors
    });
  }
};


const updateMembership = async (req, res) => {
  try {
    const membership = await Membership.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!membership) {
      return res.status(404).json({ 
        success: false, 
        message: 'Membership not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: { membership } 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false, 
      message: 'Failed to update membership', 
      error: err.message 
    });
  }
};


const deleteMembership = async (req, res) => {
  try {
    const membership = await Membership.findByIdAndDelete(req.params.id);
    if (!membership) {
      return res.status(404).json({ 
        success: false, 
        message: 'Membership not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Membership deleted successfully' 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false, 
      message: 'Failed to delete membership', 
      error: err.message 
    });
  }
};

// Purchase/Assign membership to a client from an existing template
const purchaseMembership = async (req, res) => {
  try {
    const { templateId, clientId, startDate, price, paymentType, paymentIntentId } = req.body;
    
    console.log('🎯 Purchase membership request:', {
      templateId,
      clientId,
      startDate,
      price,
      paymentType,
      paymentIntentId
    });
    
    if (!templateId || !clientId) {
      return res.status(400).json({ 
        success: false, 
        message: 'templateId and clientId are required' 
      });
    }

    // If payment is involved, verify Stripe payment first
    if (paymentIntentId) {
      if (!stripe) {
        console.warn('⚠️ Payment verification requested but stripe is not configured.');
        return res.status(500).json({
          success: false,
          message: 'Server not configured for Stripe payments. Contact administrator or set STRIPE_SECRET_KEY in environment.'
        });
      }

      try {
        console.log('🔍 Verifying Stripe payment:', paymentIntentId);

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            message: 'Payment verification failed. Payment has not been completed.',
            paymentStatus: paymentIntent.status
          });
        }

        console.log('✅ Payment verified successfully:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status
        });

      } catch (stripeError) {
        console.error('❌ Stripe verification error:', stripeError);
        return res.status(400).json({
          success: false,
          message: 'Failed to verify payment with Stripe',
          error: stripeError.message
        });
      }
    }

    // Fetch template
    const template = await Membership.findOne({ _id: templateId, isTemplate: true })
      .populate('services', 'name');
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }

    // Validate user
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }
    console.log('Assigning membership to client:', clientId, client._id, client.email);

    const purchaseStart = startDate ? new Date(startDate) : new Date();

    const purchasedData = {
      name: template.name,
      description: template.description,
      serviceType: template.serviceType,
      services: template.services,
      serviceNames: template.serviceNames,
      numberOfSessions: template.numberOfSessions,
      paymentType: paymentType || template.paymentType,
      price: price != null ? price : template.price,
      currency: template.currency,
      validityPeriod: template.validityPeriod,
      validityUnit: template.validityUnit,
      client: client._id, // Ensure this is set
      status: 'Active',
      startDate: purchaseStart,
      purchaseDate: purchaseStart,
      isTemplate: false,
      createdBy: req.user ? req.user._id : null,
      paymentIntentId: paymentIntentId || null
    };
    console.log('Purchased membership data:', purchasedData);

    let membership = await Membership.create(purchasedData);
    // populate client for immediate frontend display
    membership = await membership.populate([
      { path: 'client', select: 'firstName lastName email' },
      { path: 'services', select: 'name' }
    ]);

    // Calculate end date for email
    const calculateEndDate = (startDate, period, unit) => {
      const start = new Date(startDate);
      switch (unit.toLowerCase()) {
        case 'days':
          return new Date(start.getTime() + (period * 24 * 60 * 60 * 1000));
        case 'weeks':
          return new Date(start.getTime() + (period * 7 * 24 * 60 * 60 * 1000));
        case 'months':
          return new Date(start.setMonth(start.getMonth() + period));
        case 'years':
          return new Date(start.setFullYear(start.getFullYear() + period));
        default:
          return null;
      }
    };

    const endDate = calculateEndDate(
      membership.startDate, 
      membership.validityPeriod, 
      membership.validityUnit
    );

    // Send membership notification email
    try {
      await sendMembershipNotificationEmail(
        client.email,
        `${client.firstName} ${client.lastName}`,
        {
          membershipName: membership.name,
          serviceNames: membership.serviceNames,
          numberOfSessions: membership.numberOfSessions,
          validityPeriod: membership.validityPeriod,
          validityUnit: membership.validityUnit,
          startDate: membership.startDate,
          endDate: endDate,
          price: membership.price,
          paymentType: membership.paymentType,
          serviceType: membership.serviceType
        }
      );
      console.log('✅ Membership notification email sent to:', client.email);
    } catch (emailError) {
      console.error('❌ Failed to send membership notification email:', emailError.message);
      // Don't fail the membership creation if email fails
    }
      
    console.log('🎉 Membership created successfully:', {
      id: membership._id,
      client: `${client.firstName} ${client.lastName}`,
  services: membership.serviceNames,
      sessions: membership.numberOfSessions,
      paymentVerified: !!paymentIntentId,
      emailSent: true
    });
      
    res.status(201).json({ 
      success: true, 
      data: { membership },
      message: paymentIntentId ? 'Membership purchased and payment verified successfully. Confirmation email sent!' : 'Membership assigned successfully. Confirmation email sent!',
      emailSent: true
    });
  } catch (err) {
    console.error('❌ Error purchasing membership:', err);
    console.error('❌ Error details:', {
      message: err.message,
      stack: err.stack,
      validationErrors: err.errors
    });
    res.status(400).json({ 
      success: false, 
      message: 'Failed to purchase membership', 
      error: err.message,
      details: err.errors || err.details
    });
  }
};

// Get user's memberships (for user-side API)
const getUserMemberships = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const memberships = await Membership.find({ 
      client: userId, 
      isTemplate: false,
      status: { $in: ['Active', 'Partially Used'] }
    })
  .populate('services', 'name price duration')
    .sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      data: { memberships }
    });
  } catch (err) {
    console.error('❌ Error fetching user memberships:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user memberships',
      error: err.message
    });
  }
};

// Check if user has membership for specific service
const checkMembershipForService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const membership = await Membership.findOne({
      client: userId,
      services: serviceId,
      isTemplate: false,
      status: { $in: ['Active', 'Partially Used'] },
      remainingSessions: { $gt: 0 }
    }).populate('services', 'name price duration');

    res.status(200).json({
      success: true,
      data: { 
        hasMembership: !!membership,
        membership: membership || null
      }
    });
  } catch (err) {
    console.error('❌ Error checking membership for service:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to check membership for service',
      error: err.message
    });
  }
};

// Use a session from membership
const useMembershipSession = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const membership = await Membership.findOne({
      _id: membershipId,
      client: userId,
      isTemplate: false
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    if (membership.remainingSessions <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No remaining sessions in this membership'
      });
    }

    // Update membership - use pre-save middleware to handle session logic
    membership.usedSessions += 1;
    await membership.save();

    console.log('🎯 Membership session used:', {
      membershipId: membership._id,
      remainingSessions: membership.remainingSessions,
      status: membership.status
    });

    res.status(200).json({
      success: true,
      data: { 
        membership: {
          _id: membership._id,
          remainingSessions: membership.remainingSessions,
          usedSessions: membership.usedSessions,
          status: membership.status
        }
      },
      message: 'Session deducted successfully'
    });
  } catch (err) {
    console.error('❌ Error using membership session:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to use membership session',
      error: err.message
    });
  }
};

module.exports = {
  getAllMembershipTemplates,
  getAllPurchasedMemberships,
  createMembershipTemplate,
  updateMembership,
  deleteMembership,
  purchaseMembership,
  getUserMemberships,
  checkMembershipForService,
  useMembershipSession
};
