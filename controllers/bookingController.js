const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Employee = require('../models/Employee');
const User = require('../models/User');
// const { apiUtils } = require('../utils/apiUtils');





// ========================================
// PUBLIC BOOKING CONTROLLERS (No Auth Required)
// ========================================

// Get available services for booking
const getAvailableServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .select('name description price duration category isPopular')
      .sort({ isPopular: -1, name: 1 });

    res.json({
      success: true,
      results: services.length,
      data: { services }
    });
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available services'
    });
  }
};

// Get available professionals for a specific service and date
const getAvailableProfessionals = async (req, res) => {
  try {
    const { service, date } = req.query;

    console.log('getAvailableProfessionals called with:', req.query);

    if (!service || !date) {
      return res.status(400).json({
        success: false,
        message: 'Service ID and date are required'
      });
    }

    // First, get the service to check its category/type
    const serviceDoc = await Service.findById(service);
    if (!serviceDoc) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Find employees who can perform this type of service based on their specializations
    // For now, we'll get all active employees and filter by position/department
    const employees = await Employee.find({
      isActive: true
    })
    .populate('user', 'firstName lastName email')
    .select('user position employeeId specializations performance workSchedule department');

    console.log('Found employees:', employees.length);

    // Filter employees based on availability for the given date
    const availableEmployees = employees.filter(employee => {
      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      // Handle both Map and Object formats for workSchedule
      let schedule;
      if (employee.workSchedule instanceof Map) {
        schedule = employee.workSchedule.get(dayName);
      } else if (employee.workSchedule && typeof employee.workSchedule === 'object') {
        schedule = employee.workSchedule[dayName];
      } else if (employee.legacyWorkSchedule) {
        // Fallback to legacy schedule if available
        schedule = employee.legacyWorkSchedule[dayName];
      }
      
      return schedule && schedule.isWorking;
    });

    console.log('Available employees:', availableEmployees.length);

    // Transform the data to include necessary information for clients including workSchedule
    const professionals = availableEmployees.map(employee => {
      // Convert Map to plain object for workSchedule
      let workScheduleObj = {};
      if (employee.workSchedule instanceof Map) {
        // Convert Map to plain object
        for (let [key, value] of employee.workSchedule) {
          workScheduleObj[key] = value;
        }
      } else if (employee.workSchedule && typeof employee.workSchedule === 'object') {
        workScheduleObj = employee.workSchedule;
      }

      // Convert Map to plain object for legacyWorkSchedule
      let legacyWorkScheduleObj = {};
      if (employee.legacyWorkSchedule instanceof Map) {
        for (let [key, value] of employee.legacyWorkSchedule) {
          legacyWorkScheduleObj[key] = value;
        }
      } else if (employee.legacyWorkSchedule && typeof employee.legacyWorkSchedule === 'object') {
        legacyWorkScheduleObj = employee.legacyWorkSchedule;
      }

      console.log(`[BookingController] Professional ${employee.user.firstName} workSchedule conversion:`, {
        originalType: employee.workSchedule?.constructor?.name,
        mapSize: employee.workSchedule instanceof Map ? employee.workSchedule.size : 'not-map',
        convertedKeys: Object.keys(workScheduleObj),
        sampleDay: workScheduleObj.thursday || workScheduleObj.monday || 'none'
      });

      return {
        _id: employee._id,
        user: {
          firstName: employee.user.firstName,
          lastName: employee.user.lastName
        },
        position: employee.position,
        employeeId: employee.employeeId,
        specializations: employee.specializations || [],
        performance: {
          ratings: employee.performance?.ratings || { average: 0, count: 0 }
        },
        // Include workSchedule for client-side time slot generation (converted from Map)
        workSchedule: workScheduleObj,
        // Also include legacy schedule as fallback (converted from Map)
        legacyWorkSchedule: legacyWorkScheduleObj
      };
    });
    
    res.json({
      success: true,
      results: professionals.length,
      data: { professionals }
    });
  } catch (error) {
    console.error('Error fetching available professionals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available professionals'
    });
  }
};

// Get available time slots for a professional
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { employeeId, serviceId, date } = req.query;

    console.log('getAvailableTimeSlots called with:', req.query);

    if (!employeeId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, service ID, and date are required'
      });
    }

    // Find the employee
    const employee = await Employee.findById(employeeId)
      .populate('user', 'firstName lastName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    console.log('Found employee:', employee.user.firstName, employee.user.lastName);

    // Get the service to know its duration
    const service = await Service.findById(serviceId);
    if (!service) {
    return res.status(404).json({
      success: false,
        message: 'Service not found'
      });
    }

    console.log('Found service:', service.name, 'Duration:', service.duration);

    // Get the day of week for the given date
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Handle both Map and Object formats for workSchedule with DATE-SPECIFIC PRIORITY
    let schedule;
    if (employee.workSchedule instanceof Map) {
      // First try to get by specific date (new format - PRIORITY)
      const specificDateKey = date; // YYYY-MM-DD format
      schedule = employee.workSchedule.get(specificDateKey);
      console.log('🕒 Trying specific date key (Map):', specificDateKey, 'Result:', schedule ? 'FOUND' : 'NOT FOUND');
      
      // If not found, try by day name (legacy format)
      if (!schedule) {
        schedule = employee.workSchedule.get(dayName);
        console.log('🕒 Fallback to day key (Map):', dayName, 'Result:', schedule ? 'FOUND' : 'NOT FOUND');
      }
    } else if (employee.workSchedule && typeof employee.workSchedule === 'object') {
      // First try specific date (new format - PRIORITY)
      const specificDateKey = date; // YYYY-MM-DD format
      schedule = employee.workSchedule[specificDateKey];
      console.log('🕒 Trying specific date key (Object):', specificDateKey, 'Result:', schedule ? 'FOUND' : 'NOT FOUND');
      
      // If not found, try day name (legacy format)
      if (!schedule) {
        schedule = employee.workSchedule[dayName];
        console.log('🕒 Fallback to day key (Object):', dayName, 'Result:', schedule ? 'FOUND' : 'NOT FOUND');
      }
    } else if (employee.legacyWorkSchedule) {
      // Fallback to legacy schedule if available
      schedule = employee.legacyWorkSchedule[dayName];
      console.log('🕒 Using legacy schedule for:', dayName);
    }

    console.log('Day of week:', dayOfWeek, 'Day name:', dayName);
    console.log('🕒 FINAL Work schedule for this day:', schedule);
    console.log('🕒 Schedule source:', schedule === employee.workSchedule?.[date] ? 'DATE-SPECIFIC ✅' : 'DAY-BASED ❌');

    if (!schedule || !schedule.isWorking) {
      console.log('Employee not working on this day');
      return res.json({
        success: true,
        results: 0,
        data: { timeSlots: [] }
      });
    }

    // Generate time slots based on work schedule
    const timeSlots = generateTimeSlots(schedule, service.duration, date);
    console.log('Generated time slots:', timeSlots.length);

    // Check for existing bookings and mark slots as unavailable
    const existingBookings = await Booking.find({
      employeeId: employeeId,
      date: date,
      status: { $in: ['confirmed', 'pending'] }
    });

    console.log('Existing bookings:', existingBookings.length);

    const availableSlots = timeSlots.map(slot => {
      const isBooked = existingBookings.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });

      return {
        ...slot,
        available: !isBooked
      };
    }); 

    console.log('Available slots:', availableSlots.length);

    res.json({
      success: true,                              
      results: availableSlots.length,
      data: { timeSlots: availableSlots }
    });
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available time slots'
    });
  }
};

// Create booking confirmation (public)
const createBookingConfirmation = async (req, res) => {
  try {
    const { serviceId, employeeId, date, time, customerInfo } = req.body;

    // Validate required fields
    if (!serviceId || !employeeId || !date || !time || !customerInfo) {
      return res.status(400).json({
        success: false,
        message: 'Service ID, employee ID, date, time, and customer info are required'
      });
    }

    // Create a temporary booking confirmation
    const confirmation = {
      serviceId,
      employeeId,
      date,
      time,
      customerInfo,
      confirmationId: generateConfirmationId(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };

    // In a real app, you might save this to a temporary collection
    // For now, we'll just return the confirmation

    res.json({
      success: true,
      data: { confirmation }
    });
  } catch (error) {
    console.error('Error creating booking confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking confirmation'
    });
  }
};

// ========================================
// AUTHENTICATED BOOKING CONTROLLERS
// ========================================

// Create booking (supports multiple services & professionals + gift card / membership payment)
const createBooking = async (req, res) => {
  try {
  let { services: incomingServices, appointmentDate, notes, paymentMethod, client: clientData, selectionMode, paymentDetails: incomingPaymentDetails, finalAmount: incomingFinalAmount, giftCardCode } = req.body;
    if (!incomingServices || !Array.isArray(incomingServices) || incomingServices.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one service is required' });
    }
    if (!appointmentDate) {
      return res.status(400).json({ success: false, message: 'appointmentDate is required' });
    }
    // Normalize date (store midnight for day clarity)
    const apptDateObj = new Date(appointmentDate);
    if (isNaN(apptDateObj.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid appointmentDate' });
    }

    // Prepare day bounds for availability lookups
    const dayStart = new Date(apptDateObj); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

    // Find or create the client user
    let clientUser;
    if (clientData && clientData.email) {
      clientUser = await User.findOne({ email: clientData.email });

      if (!clientUser) {
        // Create a new user for the client
        let firstName = '';
        let lastName = '';
        if (clientData.name) {
          const parts = clientData.name.split(' ');
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else {
          firstName = clientData.firstName || '';
          lastName = clientData.lastName || '';
        }

        clientUser = new User({
          firstName,
          lastName,
          email: clientData.email,
          phone: clientData.phone,
          password: 'defaultPassword123', // A temporary default password
          role: 'client',
          isVerified: true, // Or false, depending on your flow
        });
        await clientUser.save();
      }
    } else {
      // If no client data provided, use the current authenticated user as the client
      clientUser = req.user;
      console.log('Using authenticated user as client:', {
        id: clientUser._id,
        email: clientUser.email,
        name: `${clientUser.firstName} ${clientUser.lastName}`,
        objectIdType: clientUser._id.constructor.name
      });
    }

    // Ensure we have a valid client
    if (!clientUser || !clientUser._id) {
      return res.status(400).json({ 
        message: 'Unable to determine client information. Please try logging in again.' 
      });
    }

    // Load all active employees once for potential auto-assignment ('any')
    const allActiveEmployees = await Employee.find({ isActive: true })
      .populate('user', 'firstName lastName')
      .select('user position employeeId specializations performance workSchedule');

    // Preload existing bookings for the day to avoid conflicts
    const existingDayBookings = await Booking.find({ appointmentDate: { $gte: dayStart, $lt: dayEnd } })
      .select('services.startTime services.endTime services.employee');
    const bookingsByEmployee = new Map();
    existingDayBookings.forEach(b => {
      (b.services || []).forEach(svc => {
        if (!svc.employee) return;
        const key = String(svc.employee);
        if (!bookingsByEmployee.has(key)) bookingsByEmployee.set(key, []);
        bookingsByEmployee.get(key).push({ start: new Date(svc.startTime), end: new Date(svc.endTime) });
      });
    });

    const overlaps = (ranges, start, end) => ranges.some(r => start < r.end && end > r.start);
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const isWorking = (employee, dateObj) => {
      const sched = employee.workSchedule?.[dayNames[dateObj.getDay()]];
      return sched && sched.isWorking;
    };

    // Transform each incoming service: validate service exists; override price & duration; validate/assign employee
    const transformedServices = [];
    for (const raw of incomingServices) {
      const serviceId = raw.service || raw.serviceId || raw._id;
      if (!serviceId) {
        return res.status(400).json({ success: false, message: 'Service id missing on one of the service entries' });
      }
      const serviceDoc = await Service.findById(serviceId).select('price duration name');
      if (!serviceDoc) {
        return res.status(404).json({ success: false, message: `Service not found: ${serviceId}` });
      }
      // Determine start/end times (use provided or default sequential based on provided)
      let startTime = raw.startTime ? new Date(raw.startTime) : new Date(apptDateObj);
      if (isNaN(startTime.getTime())) startTime = new Date(apptDateObj);
      let endTime = raw.endTime ? new Date(raw.endTime) : new Date(startTime.getTime() + serviceDoc.duration * 60000);
      if (isNaN(endTime.getTime())) endTime = new Date(startTime.getTime() + serviceDoc.duration * 60000);
      if (endTime <= startTime) {
        endTime = new Date(startTime.getTime() + serviceDoc.duration * 60000);
      }

      let employeeId = raw.employee || raw.employeeId; // expected field from frontend
      if (!employeeId || employeeId === 'any') {
        // Auto assign first available employee not overlapping
        const candidate = allActiveEmployees.find(emp => {
          if (!isWorking(emp, startTime)) return false;
          const existing = bookingsByEmployee.get(String(emp._id)) || [];
          return !overlaps(existing, startTime, endTime);
        });
        if (!candidate) {
          return res.status(409).json({ success: false, message: `No available professional for '${serviceDoc.name}' at selected time.` });
        }
        employeeId = candidate._id;
        if (!bookingsByEmployee.has(String(employeeId))) bookingsByEmployee.set(String(employeeId), []);
        bookingsByEmployee.get(String(employeeId)).push({ start: startTime, end: endTime });
      } else {
        // Validate employee exists
        const empDoc = allActiveEmployees.find(e => String(e._id) === String(employeeId));
        if (!empDoc) {
          return res.status(404).json({ success: false, message: `Employee not found or inactive: ${employeeId}` });
        }
        // Overlap check for this employee
        const existingRanges = bookingsByEmployee.get(String(employeeId)) || [];
        if (overlaps(existingRanges, startTime, endTime)) {
          return res.status(409).json({ success: false, message: `Employee has a conflicting booking for service '${serviceDoc.name}'.` });
        }
        if (!bookingsByEmployee.has(String(employeeId))) bookingsByEmployee.set(String(employeeId), []);
        bookingsByEmployee.get(String(employeeId)).push({ start: startTime, end: endTime });
      }

      transformedServices.push({
        service: serviceDoc._id,
        employee: employeeId,
        price: serviceDoc.price,
        duration: serviceDoc.duration,
        startTime,
        endTime,
        notes: raw.notes || ''
      });
    }

    const totalAmount = transformedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = transformedServices.reduce((sum, s) => sum + s.duration, 0);

    console.log('Creating booking (multi-service) client:', clientUser._id, 'services:', transformedServices.length, 'mode:', selectionMode);

    const newBooking = new Booking({
      client: clientUser._id,
      services: transformedServices,
      appointmentDate: apptDateObj,
      totalAmount,
      totalDuration,
      paymentMethod,
      status: 'confirmed',
      notes,
      bookedBy: clientUser._id,
    });

    // Attach payment details if provided (gift card, membership, etc.)
    if (incomingPaymentDetails && typeof incomingPaymentDetails === 'object') {
      newBooking.paymentDetails = { ...incomingPaymentDetails };
    }
    if (typeof incomingFinalAmount === 'number') {
      newBooking.finalAmount = incomingFinalAmount;
    }
    if (giftCardCode && !newBooking.giftCardCode) {
      newBooking.giftCardCode = giftCardCode;
    }

    // Ensure finalAmount is set (pre-save will also calculate it, but set here for validation)
    if (!newBooking.finalAmount) {
      newBooking.finalAmount = newBooking.totalAmount - (newBooking.discountAmount || 0) + (newBooking.taxAmount || 0);
    }

    // If gift card/membership details provided, adjust finalAmount prior to save for accuracy
    if (paymentMethod === 'giftcard' && newBooking.paymentDetails?.redeemAmount) {
      const redeem = Number(newBooking.paymentDetails.redeemAmount) || 0;
      newBooking.finalAmount = Math.max(0, newBooking.finalAmount - redeem);
    }
    if (paymentMethod === 'membership') {
      // Assume membership covers entire amount (adjust rules if partial later)
      newBooking.finalAmount = 0;
    }

    // Ensure bookingNumber is set (in case pre-save hook is not triggered)
    if (!newBooking.bookingNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Use timestamp to avoid race conditions
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const randomSuffix = Math.floor(Math.random() * 99).toString().padStart(2, '0');
      
      // Try with timestamp-based approach first
      let bookingNumber = `BK${year}${month}${day}${timestamp}${randomSuffix}`;
      
      // Check if this exact number exists (very unlikely but just in case)
      const existingBooking = await Booking.findOne({ bookingNumber });
      if (existingBooking) {
        // Fallback to sequential approach with retry logic
        let attempts = 0;
        let sequence = 1;
        
        while (attempts < 10) { // Max 10 attempts to avoid infinite loop
          try {
            const lastBooking = await Booking.findOne({
              bookingNumber: new RegExp(`^BK${year}${month}${day}`)
            }).sort({ bookingNumber: -1 });
            
            if (lastBooking) {
              const lastSequence = parseInt(lastBooking.bookingNumber.slice(-4));
              if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
              }
            }
            
            bookingNumber = `BK${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
            
            // Test if this number is available
            const testBooking = await Booking.findOne({ bookingNumber });
            if (!testBooking) {
              break; // Found available number
            }
            
            sequence++; // Try next number
            attempts++;
          } catch (error) {
            console.error('Error in booking number generation attempt', attempts, error);
            attempts++;
          }
        }
        
        if (attempts >= 10) {
          // Ultimate fallback: use timestamp
          bookingNumber = `BK${year}${month}${day}${Date.now().toString().slice(-4)}`;
        }
      }
      
      newBooking.bookingNumber = bookingNumber;
      console.log('Generated booking number:', bookingNumber);
    }

    await newBooking.save();

    // If gift card payment: redeem / deduct immediately so card cannot be re-used
    if (paymentMethod === 'giftcard') {
      try {
        const GiftCard = require('../models/GiftCard');
        let gc = null;
        if (newBooking.paymentDetails?.giftCardId) {
          gc = await GiftCard.findById(newBooking.paymentDetails.giftCardId);
        } else if (giftCardCode) {
          gc = await GiftCard.findOne({ code: giftCardCode.toUpperCase() });
          if (gc) {
            newBooking.paymentDetails = newBooking.paymentDetails || {};
            newBooking.paymentDetails.giftCardId = gc._id;
            await newBooking.save();
          }
        }
        if (gc) {
          // Skip if already fully used/expired/cancelled
            if (['Used','Expired','Cancelled'].includes(gc.status) || gc.remainingValue <= 0) {
              console.warn('Gift card provided is not usable (status or balance). Skipping redemption.');
            } else {
              // Recalculate safe redeem amount: if frontend sent redeemAmount use min of booking total
              const requestedRedeem = Number(newBooking.paymentDetails?.redeemAmount) || 0;
              const maxAllowed = Math.min(gc.remainingValue, totalAmount);
              const redeemAmount = Math.min(requestedRedeem || maxAllowed, maxAllowed);
              if (redeemAmount > 0) {
                gc.remainingValue -= redeemAmount;
                gc.usageHistory.push({
                  amountUsed: redeemAmount,
                  usedBy: clientUser._id,
                  bookingId: newBooking._id,
                  notes: 'Redeemed at booking creation'
                });
                if (gc.remainingValue <= 0) gc.status = 'Used';
                else if (gc.remainingValue < gc.value) gc.status = 'Partially Used';
                await gc.save();
              }
            }
        }
      } catch (gcErr) {
        console.error('Gift card redemption error (createBooking):', gcErr.message);
      }
    }

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('client', 'firstName lastName email phone')
      .populate({
        path: 'services.service',
        model: 'Service',
      })
      .populate({
        path: 'services.employee',
        model: 'Employee',
        populate: {
          path: 'user',
          model: 'User',
          select: 'firstName lastName',
        },
      });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: populatedBooking },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ client: userId })
      .populate('services.service', 'name price duration')
      .populate({
        path: 'services.employee',
        model: 'Employee',
        select: 'user position employeeId',
        populate: {
          path: 'user',
          model: 'User',
          select: 'firstName lastName email'
        }
      })
      .sort({ appointmentDate: -1 });

    res.json({
      success: true,
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
};

// Get specific booking
const getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findOne({ _id: id, client: userId })
      .populate('services.service', 'name price duration')
      .populate('services.employee', 'user position');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findOneAndUpdate(
      { _id: id, client: userId },
      { status: 'cancelled' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
};

// Reschedule booking
const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDateTime } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findOneAndUpdate(
      { _id: id, client: userId },
      { 
        date: new Date(newDateTime),
        startTime: new Date(newDateTime),
        endTime: new Date(new Date(newDateTime).getTime() + 60 * 60 * 1000) // Add 1 hour
      },
      { new: true }
    );

  if (!booking) {
    return res.status(404).json({
      success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking'
    });
  }
};

// Complete booking after authentication
const completeBooking = async (req, res) => {
  try {
    const { confirmationId } = req.body;
    const userId = req.user._id;

    // In a real app, you would validate the confirmation and create the actual booking
    // For now, we'll just return success

    res.json({
    success: true,
      message: 'Booking completed successfully'
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking'
    });
  }
};

// ========================================
// ADMIN BOOKING CONTROLLERS
// ========================================

// Get all bookings (admin only)
const getAllBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('📅 Date filter params received:', { startDate, endDate });
    
    // Build the query filter
    let dateFilter = {};
    
    if (startDate || endDate) {
      // TIMEZONE FIX: Filter by appointmentDate instead of services.startTime
      // since appointmentDate represents the intended booking date regardless of timezone storage
      dateFilter['appointmentDate'] = {};
      
      if (startDate) {
        // TIMEZONE FIX: Expand the range to account for timezone differences
        // Go back 24 hours to catch bookings that might be stored in different timezones
        const startDateObj = new Date(startDate);
        const expandedStart = new Date(startDateObj.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
        dateFilter['appointmentDate'].$gte = expandedStart;
        console.log('🔍 Filtering bookings from (expanded):', expandedStart.toISOString());
      }
      
      if (endDate) {
        // TIMEZONE FIX: Expand the range to account for timezone differences
        // Go forward 24 hours to catch bookings that might be stored in different timezones
        const endDateObj = new Date(endDate);
        const expandedEnd = new Date(endDateObj.getTime() + 24 * 60 * 60 * 1000); // 24 hours after
        expandedEnd.setHours(23, 59, 59, 999); // End of expanded day
        dateFilter['appointmentDate'].$lte = expandedEnd;
        console.log('🔍 Filtering bookings until (expanded):', expandedEnd.toISOString());
      }
    }
    
    console.log('📋 Final date filter applied:', JSON.stringify(dateFilter, null, 2));
    
    const bookings = await Booking.find(dateFilter)
      .populate('client', 'firstName lastName email')
      .populate('services.service', 'name price')
      .populate({
        path: 'services.employee',
        select: 'employeeId user',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .sort({ appointmentDate: -1 }); // Sort by appointmentDate instead of services.startTime

    console.log(`📊 Found ${bookings.length} bookings matching date filter (before client-side filtering)`);
    
    // TIMEZONE FIX: Apply client-side filtering to only return bookings that actually match the requested date range
    let filteredBookings = bookings;
    if (startDate || endDate) {
      filteredBookings = bookings.filter(booking => {
        // Check if any service in the booking falls within the requested date range
        return booking.services.some(service => {
          if (!service.startTime) return false;
          
          // Extract the date part from the service start time (ignoring timezone)
          const serviceDate = new Date(service.startTime);
          const serviceDateStr = serviceDate.getFullYear() + '-' + 
                                  String(serviceDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                  String(serviceDate.getDate()).padStart(2, '0');
          
          // Also extract the local date part from appointmentDate
          const appointmentDate = new Date(booking.appointmentDate);
          const appointmentDateStr = appointmentDate.getFullYear() + '-' + 
                                     String(appointmentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                     String(appointmentDate.getDate()).padStart(2, '0');
          
          // Check if either the service date or appointment date matches the requested range
          const startMatch = !startDate || serviceDateStr >= startDate || appointmentDateStr >= startDate;
          const endMatch = !endDate || serviceDateStr <= endDate || appointmentDateStr <= endDate;
          
          return startMatch && endMatch;
        });
      });
    }
    
    console.log(`📊 After client-side date filtering: ${filteredBookings.length} bookings`);
    
    // Debug: Log the date ranges of found bookings
    if (filteredBookings.length > 0) {
      filteredBookings.forEach((booking, index) => {
        const appointmentDate = new Date(booking.appointmentDate);
        console.log(`📝 Booking ${index + 1}: Appointment date ${appointmentDate.toLocaleDateString()}`);
        booking.services.forEach((service, serviceIndex) => {
          if (service.startTime) {
            const serviceDate = new Date(service.startTime);
            console.log(`   Service ${serviceIndex + 1}: ${serviceDate.toLocaleDateString()} ${serviceDate.toLocaleTimeString()}`);
          }
        });
      });
    }

    res.json({
      success: true,
      results: filteredBookings.length,
      data: { bookings: filteredBookings }
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
};

// Update booking (admin only)
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const prevBooking = await Booking.findById(id).select('paymentMethod paymentDetails finalAmount status');
    const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Gift card forfeiture on no-show: if booking transitions to no-show and was giftcard paid but gift card not yet fully consumed
    if (prevBooking && updateData.status === 'no-show' && prevBooking.status !== 'no-show' && prevBooking.paymentMethod === 'giftcard') {
      try {
        const giftCardId = prevBooking.paymentDetails?.giftCardId;
        const redeemAmount = prevBooking.paymentDetails?.redeemAmount || prevBooking.finalAmount || 0;
        if (giftCardId && redeemAmount > 0) {
          const GiftCard = require('../models/GiftCard');
          const gc = await GiftCard.findById(giftCardId);
          if (gc && gc.remainingValue > 0) {
            const amountToUse = Math.min(redeemAmount, gc.remainingValue);
            // Directly adjust remaining value (forfeiture) and push history entry
            gc.usageHistory.push({
              amountUsed: amountToUse,
              usedBy: booking.client,
              bookingId: booking._id,
              notes: 'Auto-forfeited due to no-show'
            });
            gc.remainingValue -= amountToUse;
            if (gc.remainingValue <= 0) {
              gc.status = 'Used';
            } else if (gc.remainingValue < gc.value) {
              gc.status = 'Partially Used';
            }
            await gc.save();
          }
        }
      } catch (giftErr) {
        console.error('Gift card forfeiture error (booking update):', giftErr.message);
      }
    }

    res.json({
    success: true,
      data: { booking }
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking'
    });
  }
};

// Update single service status within a booking
const updateServiceStatus = async (req, res) => {
  try {
    const { bookingId, serviceId } = req.params;
    let { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    // Map extended statuses to service-level statuses
    const statusMap = {
      booked: 'scheduled',
      pending: 'scheduled',
      confirmed: 'confirmed',  // Keep confirmed as distinct status
      arrived: 'arrived',      // Keep arrived as distinct status  
      started: 'in-progress',
      'in-progress': 'in-progress',
      completed: 'completed',
      cancelled: 'cancelled',
      'no-show': 'no-show'
    };
    const serviceStatus = statusMap[status] || status;
    const allowed = ['scheduled','confirmed','arrived','in-progress','completed','cancelled','no-show'];
    if (!allowed.includes(serviceStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid service status' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const svc = booking.services.id(serviceId);
    if (!svc) return res.status(404).json({ success: false, message: 'Service not found in booking' });

    svc.status = serviceStatus;

    // UPDATE OVERALL BOOKING STATUS BASED ON SERVICE STATUSES
    const serviceCounts = {
      scheduled: 0,
      confirmed: 0,
      arrived: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0,
      'no-show': 0
    };

    // Count statuses of all services
    booking.services.forEach(service => {
      const status = service.status || 'scheduled';
      if (serviceCounts.hasOwnProperty(status)) {
        serviceCounts[status]++;
      }
    });

    const totalServices = booking.services.length;
    
    // Determine overall booking status based on service statuses
    // Map service-level statuses to valid booking-level statuses
    if (serviceCounts.completed === totalServices) {
      // All services completed
      booking.status = 'completed';
    } else if (serviceCounts['no-show'] === totalServices) {
      // All services no-show
      booking.status = 'no-show';
    } else if (serviceCounts.cancelled === totalServices) {
      // All services cancelled
      booking.status = 'cancelled';
    } else if (serviceCounts['in-progress'] > 0) {
      // At least one service in progress
      booking.status = 'started';  // Use 'started' instead of 'in-progress'
    } else if (serviceCounts.completed > 0) {
      // Some services completed, but not all
      booking.status = 'started';  // Use 'started' instead of 'in-progress'
    } else if (serviceCounts.arrived > 0) {
      // At least one service arrived - map to booking 'arrived'
      booking.status = 'arrived';
    } else if (serviceCounts.confirmed > 0) {
      // At least one service confirmed - map to booking 'confirmed'  
      booking.status = 'confirmed';
    } else {
      // Default to booked if all services are scheduled
      booking.status = 'booked';  // Use 'booked' instead of 'scheduled'
    }

    console.log(`📊 Booking ${booking._id} status updated to: ${booking.status} (based on service statuses)`);

    await booking.save();

    // If all services now no-show and booking was giftcard, auto-forfeit
    if (serviceStatus === 'no-show') {
      const allNoShow = booking.services.every(s => s.status === 'no-show');
      if (allNoShow && booking.paymentMethod === 'giftcard') {
        try {
          const giftCardId = booking.paymentDetails?.giftCardId;
          const redeemAmount = booking.paymentDetails?.redeemAmount || booking.finalAmount || 0;
          if (giftCardId && redeemAmount > 0) {
            const GiftCard = require('../models/GiftCard');
            const gc = await GiftCard.findById(giftCardId);
            if (gc && gc.remainingValue > 0) {
              const amountToUse = Math.min(redeemAmount, gc.remainingValue);
              gc.usageHistory.push({
                amountUsed: amountToUse,
                usedBy: booking.client,
                bookingId: booking._id,
                notes: 'Auto-forfeited due to no-show (service-level)'
              });
              gc.remainingValue -= amountToUse;
              if (gc.remainingValue <= 0) gc.status = 'Used'; else if (gc.remainingValue < gc.value) gc.status = 'Partially Used';
              await gc.save();
            }
          }
        } catch (giftErr) {
          console.error('Gift card forfeiture error (service update):', giftErr.message);
        }
      }
    }

    return res.json({ success: true, message: 'Service status updated', data: { bookingId, serviceId, status: serviceStatus } });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ success: false, message: 'Failed to update service status' });
  }
};

// Delete single service from booking
const deleteServiceFromBooking = async (req, res) => {
  try {
    const { bookingId, serviceId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const originalLen = booking.services.length;
    booking.services = booking.services.filter(s => String(s._id) !== String(serviceId));
    if (booking.services.length === originalLen) {
      return res.status(404).json({ success: false, message: 'Service not found in booking' });
    }

    if (booking.services.length === 0) {
      await Booking.findByIdAndDelete(bookingId);
      return res.json({ success: true, message: 'Service deleted and booking removed (no remaining services)', data: { bookingId, serviceId, bookingDeleted: true } });
    }

    // Recompute totals after removal
    booking.totalAmount = booking.services.reduce((sum, s) => sum + s.price, 0);
    booking.totalDuration = booking.services.reduce((sum, s) => sum + s.duration, 0);
    booking.finalAmount = booking.totalAmount - (booking.discountAmount || 0) + (booking.taxAmount || 0);
    await booking.save();

    return res.json({ success: true, message: 'Service deleted from booking', data: { bookingId, serviceId, bookingDeleted: false } });
  } catch (error) {
    console.error('Error deleting service from booking:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service from booking' });
  }
};

// Delete booking (admin / employee via canManageBookings route)
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Booking deleted successfully', data: { bookingId: id } });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

// Generate time slots based on work schedule
const generateTimeSlots = (schedule, serviceDuration, date) => {
  const slots = [];
  
  // Handle both shiftsData array and single startTime/endTime
  let workingPeriods = [];
  
  if (schedule?.shiftsData && Array.isArray(schedule.shiftsData) && schedule.shiftsData.length > 0) {
    // Use shiftsData array (admin format) - PRIORITY
    workingPeriods = schedule.shiftsData.map(shift => ({
      startTime: shift.startTime,
      endTime: shift.endTime
    }));
    console.log('🕒 Using shiftsData array for time generation:', workingPeriods);
  } else if (schedule?.startTime && schedule?.endTime && schedule?.isWorking) {
    // Use single startTime/endTime (fallback)
    workingPeriods = [{
      startTime: schedule.startTime,
      endTime: schedule.endTime
    }];
    console.log('🕒 Using startTime/endTime for time generation:', workingPeriods);
  }
  
  // Generate slots for each working period
  workingPeriods.forEach(period => {
    const startTime = new Date(`${date}T${period.startTime}`);
    const endTime = new Date(`${date}T${period.endTime}`);
    
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      // Use fixed 15-minute slot duration to generate all possible slots
      // The actual service duration will be handled at booking validation time
      const slotDuration = 15; // Fixed 15-minute slots
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
      
      // Generate slots as long as the slot start time is within the shift
      if (currentTime < endTime) {
        // Format time as "HH:MM" (24-hour format)
        const timeString = currentTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        slots.push({
          time: timeString,
          startTime: currentTime.toISOString(),
          endTime: slotEnd.toISOString(),
          available: true
        });
      }

      // ✅ CHANGED: Use 15-minute intervals instead of 30-minute
      currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000); // 15-minute intervals
    }
  });
  
  console.log('🕒 Generated', slots.length, 'time slots with 15-minute intervals');
  return slots;
};

// Generate confirmation ID
const generateConfirmationId = () => {
  return 'CONF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

module.exports = {
  // Public routes
  getAvailableServices,
  getAvailableProfessionals,
  getAvailableTimeSlots,
  createBookingConfirmation,
  
  // Authenticated routes
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  rescheduleBooking,
  completeBooking,
  
  // Admin routes
  getAllBookings,
  updateBooking,
  updateServiceStatus,
  deleteServiceFromBooking,
  deleteBooking
};

