const Note = require('../models/Note');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Helper function to handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Get all notes for a specific client
 * @route GET /admin/clients/:id/notes
 * @access Private (Staff only)
 */
const getClientNotes = catchAsync(async (req, res, next) => {
  const clientId = req.params.id;
  const { type } = req.query; // 'client' or 'appointment'

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
  if (type) {
    query.type = type;
  }

  const notes = await Note.find(query)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName'
    })
    .populate({
      path: 'booking',
      select: 'bookingNumber appointmentDate services',
      populate: {
        path: 'services.service',
        select: 'name'
      }
    })
    .sort('-isPinned -createdAt')
    .limit(100);

  res.status(200).json({
    success: true,
    results: notes.length,
    data: notes
  });
});

/**
 * Create a new note for a client
 * @route POST /admin/clients/:id/notes
 * @access Private (Staff only)
 */
const createNote = catchAsync(async (req, res, next) => {
  const clientId = req.params.id;
  const { content, type, bookingId, isPinned, isPrivate } = req.body;

  // Verify client exists
  const client = await User.findById(clientId);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Validation
  if (!content || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Note content is required'
    });
  }

  // If appointment note, verify booking exists
  if (type === 'appointment' && bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
  }

  // Create note
  const note = await Note.create({
    client: clientId,
    type: type || 'client',
    content,
    booking: type === 'appointment' ? bookingId : undefined,
    createdBy: req.user._id,
    isPinned: isPinned || false,
    isPrivate: isPrivate || false
  });

  // Populate createdBy before sending response
  await note.populate([
    { path: 'createdBy', select: 'firstName lastName' },
    { 
      path: 'booking', 
      select: 'bookingNumber appointmentDate services',
      populate: { path: 'services.service', select: 'name' }
    }
  ]);

  res.status(201).json({
    success: true,
    data: note
  });
});

/**
 * Update an existing note
 * @route PATCH /admin/notes/:noteId
 * @access Private (Staff only)
 */
const updateNote = catchAsync(async (req, res, next) => {
  const { noteId } = req.params;
  const { content, isPinned, isPrivate } = req.body;

  const note = await Note.findById(noteId);
  
  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }

  // Update fields
  if (content !== undefined) note.content = content;
  if (isPinned !== undefined) note.isPinned = isPinned;
  if (isPrivate !== undefined) note.isPrivate = isPrivate;

  await note.save();

  // Populate references
  await note.populate([
    { path: 'createdBy', select: 'firstName lastName' },
    { 
      path: 'booking', 
      select: 'bookingNumber appointmentDate services',
      populate: { path: 'services.service', select: 'name' }
    }
  ]);

  res.status(200).json({
    success: true,
    data: note
  });
});

/**
 * Delete a note
 * @route DELETE /admin/notes/:noteId
 * @access Private (Staff only)
 */
const deleteNote = catchAsync(async (req, res, next) => {
  const { noteId } = req.params;

  const note = await Note.findByIdAndDelete(noteId);
  
  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Note deleted successfully'
  });
});

/**
 * Toggle pin status of a note
 * @route PATCH /admin/notes/:noteId/toggle-pin
 * @access Private (Staff only)
 */
const togglePinNote = catchAsync(async (req, res, next) => {
  const { noteId } = req.params;

  const note = await Note.findById(noteId);
  
  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }

  note.isPinned = !note.isPinned;
  await note.save();

  await note.populate([
    { path: 'createdBy', select: 'firstName lastName' },
    { 
      path: 'booking', 
      select: 'bookingNumber appointmentDate services',
      populate: { path: 'services.service', select: 'name' }
    }
  ]);

  res.status(200).json({
    success: true,
    data: note
  });
});

module.exports = {
  getClientNotes,
  createNote,
  updateNote,
  deleteNote,
  togglePinNote
};
