const Allergy = require('../models/Allergy');
const User = require('../models/User');
const { REACTION_OPTIONS, SEVERITY_LEVELS, ALLERGY_TYPES, ALLERGY_STATUS } = require('../config/allergyReactions');

// Helper function to handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Get configuration data for allergies (reactions, severity levels, etc.)
 * @route GET /admin/allergies/config
 * @access Public (for frontend to fetch dropdown options)
 */
const getAllergyConfig = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      reactions: REACTION_OPTIONS,
      severityLevels: SEVERITY_LEVELS,
      allergyTypes: ALLERGY_TYPES,
      statusOptions: ALLERGY_STATUS
    }
  });
});

/**
 * Get all allergies for a specific client
 * @route GET /admin/clients/:id/allergies
 * @access Private (Staff only)
 */
const getClientAllergies = catchAsync(async (req, res, next) => {
  const clientId = req.params.id;
  const { includeAll } = req.query;

  // Verify client exists
  const client = await User.findById(clientId);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Build query
  let query = { client: clientId };
  
  // By default, only show active allergies unless includeAll=true
  if (!includeAll || includeAll === 'false') {
    query.status = 'active';
  }

  const allergies = await Allergy.find(query)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName'
    })
    .populate({
      path: 'resolvedBy',
      select: 'firstName lastName'
    })
    .sort('-createdAt')
    .limit(100);

  res.status(200).json({
    success: true,
    results: allergies.length,
    data: allergies
  });
});

/**
 * Create a new allergy for a client
 * @route POST /admin/clients/:id/allergies
 * @access Private (Staff only)
 */
const createAllergy = catchAsync(async (req, res, next) => {
  const clientId = req.params.id;
  const { type, name, reaction, severity, note } = req.body;

  // Verify client exists
  const client = await User.findById(clientId);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Validation for drug and non-drug types
  if ((type === 'drug' || type === 'non-drug') && (!name || !reaction)) {
    return res.status(400).json({
      success: false,
      message: 'Name and reaction are required for drug and non-drug allergies'
    });
  }

  // Create allergy
  const allergy = await Allergy.create({
    client: clientId,
    type,
    name: type === 'no-known' ? undefined : name,
    reaction: type === 'no-known' ? undefined : reaction,
    severity: severity || '',
    note,
    createdBy: req.user._id,
    status: 'active'
  });

  // Populate createdBy before sending response
  await allergy.populate({
    path: 'createdBy',
    select: 'firstName lastName'
  });

  res.status(201).json({
    success: true,
    data: allergy
  });
});

/**
 * Update an existing allergy
 * @route PATCH /admin/allergies/:allergyId
 * @access Private (Staff only)
 */
const updateAllergy = catchAsync(async (req, res, next) => {
  const { allergyId } = req.params;
  const { name, reaction, severity, note, status } = req.body;

  // Find allergy
  const allergy = await Allergy.findById(allergyId);
  
  if (!allergy) {
    return res.status(404).json({
      success: false,
      message: 'Allergy not found'
    });
  }

  // Update fields
  if (name !== undefined) allergy.name = name;
  if (reaction !== undefined) allergy.reaction = reaction;
  if (severity !== undefined) allergy.severity = severity;
  if (note !== undefined) allergy.note = note;
  if (status !== undefined) allergy.status = status;

  await allergy.save();

  // Populate references
  await allergy.populate([
    { path: 'createdBy', select: 'firstName lastName' },
    { path: 'resolvedBy', select: 'firstName lastName' }
  ]);

  res.status(200).json({
    success: true,
    data: allergy
  });
});

/**
 * Delete (archive) an allergy
 * @route DELETE /admin/allergies/:allergyId
 * @access Private (Staff only)
 */
const deleteAllergy = catchAsync(async (req, res, next) => {
  const { allergyId } = req.params;

  const allergy = await Allergy.findById(allergyId);
  
  if (!allergy) {
    return res.status(404).json({
      success: false,
      message: 'Allergy not found'
    });
  }

  // Soft delete: change status to archived
  allergy.status = 'archived';
  await allergy.save();

  res.status(200).json({
    success: true,
    message: 'Allergy archived successfully'
  });
});

/**
 * Resolve an allergy
 * @route PATCH /admin/allergies/:allergyId/resolve
 * @access Private (Staff only)
 */
const resolveAllergy = catchAsync(async (req, res, next) => {
  const { allergyId } = req.params;

  const allergy = await Allergy.findById(allergyId);
  
  if (!allergy) {
    return res.status(404).json({
      success: false,
      message: 'Allergy not found'
    });
  }

  // Mark as resolved
  allergy.status = 'resolved';
  allergy.resolvedBy = req.user._id;
  allergy.resolvedAt = new Date();
  
  await allergy.save();

  // Populate references
  await allergy.populate([
    { path: 'createdBy', select: 'firstName lastName' },
    { path: 'resolvedBy', select: 'firstName lastName' }
  ]);

  res.status(200).json({
    success: true,
    data: allergy
  });
});

module.exports = {
  getAllergyConfig,
  getClientAllergies,
  createAllergy,
  updateAllergy,
  deleteAllergy,
  resolveAllergy
};
