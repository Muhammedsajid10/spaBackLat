const Membership = require('../models/Membership');
const Service = require('../models/Service');
const User = require('../models/User');
const mongoose = require('mongoose');


const getAllMembershipTemplates = async (req, res) => {
  try {
    console.log('📋 Fetching membership templates...');
    
    const memberships = await Membership.find({ isTemplate: true })
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
    console.log('🆕 Creating membership template:', req.body);
    
    const membershipData = {
      ...req.body,
      isTemplate: true,
      createdBy: req.user ? req.user._id : null,
      status: 'Draft'
    };

    const membership = await Membership.create(membershipData);
    
    res.status(201).json({ 
      success: true, 
      data: { membership } 
    });
  } catch (err) {
    console.error('❌ Error creating template:', err);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to create membership template', 
      error: err.message 
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
    const { templateId, clientId, startDate, price, paymentType } = req.body;
    if (!templateId || !clientId) {
      return res.status(400).json({ success: false, message: 'templateId and clientId are required' });
    }

    // Fetch template
    const template = await Membership.findOne({ _id: templateId, isTemplate: true });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Validate user
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const purchaseStart = startDate ? new Date(startDate) : new Date();

    const purchasedData = {
      name: template.name,
      description: template.description,
      serviceType: template.serviceType,
      selectedServices: template.selectedServices,
      numberOfSessions: template.numberOfSessions,
      paymentType: paymentType || template.paymentType,
      price: price != null ? price : template.price,
      currency: template.currency,
      validityPeriod: template.validityPeriod,
      validityUnit: template.validityUnit,
      client: client._id,
      status: 'Active',
      startDate: purchaseStart,
      purchaseDate: purchaseStart,
      isTemplate: false,
      createdBy: req.user ? req.user._id : null
    };

  let membership = await Membership.create(purchasedData);
  // populate client for immediate frontend display
  membership = await membership.populate('client', 'firstName lastName email');
  res.status(201).json({ success: true, data: { membership } });
  } catch (err) {
    console.error('❌ Error purchasing membership:', err);
    res.status(400).json({ success: false, message: 'Failed to purchase membership', error: err.message });
  }
};

module.exports = {
  getAllMembershipTemplates,
  getAllPurchasedMemberships,
  createMembershipTemplate,
  updateMembership,
  deleteMembership,
  purchaseMembership
};
