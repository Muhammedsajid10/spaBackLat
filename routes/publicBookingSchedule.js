const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Booking = require('../models/Booking');

// Helper: Get all employees for debugging
router.get('/debug/employees', async (req, res) => {
  try {
    const employees = await Employee.find({}).lean();
    res.json({
      success: true,
      count: employees.length,
      employees: employees.map(emp => ({
        _id: emp._id,
        name: emp.name || (emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : 'Unknown'),
        email: emp.user?.email,
        hasWorkSchedule: !!emp.workSchedule,
        workScheduleKeys: emp.workSchedule ? Object.keys(emp.workSchedule) : []
      }))
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Fix Nina's schedule (temporary solution)
router.get('/debug/fix-nina', async (req, res) => {
  try {
    // Find Nina Kowalski
    const nina = await Employee.findOne({
      $or: [
        { 'user.firstName': 'Nina', 'user.lastName': 'Kowalski' },
        { name: { $regex: /nina.*kowalski/i } }
      ]
    });
    
    if (!nina) {
      return res.status(404).json({ success: false, error: 'Nina Kowalski not found' });
    }

    console.log('Found Nina:', nina._id, nina.user?.firstName, nina.user?.lastName);

    // Update Thursday schedule with 00:00 - 05:45 shift
    const thursdaySchedule = {
      isWorking: true,
      startTime: '00:00',
      endTime: '05:45',
      shifts: null,
      shiftsData: [
        {
          startTime: '00:00',
          endTime: '05:45'
        }
      ],
      shiftCount: 1
    };

    // Update workSchedule using Mongoose's Map methods
    if (!nina.workSchedule) {
      nina.workSchedule = new Map();
    }
    
    nina.workSchedule.set('thursday', thursdaySchedule);
    
    await nina.save();
    
    console.log('Updated Nina\'s Thursday schedule to 00:00 - 05:45');
    
    res.json({
      success: true,
      message: 'Nina\'s Thursday schedule updated successfully',
      ninaId: nina._id,
      thursdaySchedule
    });
  } catch (error) {
    console.error('Error fixing Nina\'s schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Subtract booked slots from scheduled shifts
function subtractBookedSlots(shifts, bookings) {
  const toMinutes = t => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  let available = [];
  shifts.forEach(shift => {
    let start = toMinutes(shift.startTime);
    let end = toMinutes(shift.endTime);
    let intervals = [[start, end]];
    bookings.forEach(bk => {
      const bStart = toMinutes(bk.startTime);
      const bEnd = toMinutes(bk.endTime);
      intervals = intervals.flatMap(([s, e]) => {
        if (bEnd <= s || bStart >= e) return [[s, e]]; // no overlap
        let res = [];
        if (bStart > s) res.push([s, bStart]);
        if (bEnd < e) res.push([bEnd, e]);
        return res;
      });
    });
    available.push(...intervals.map(([s, e]) => ({
      startTime: `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`,
      endTime: `${String(Math.floor(e/60)).padStart(2,'0')}:${String(e%60).padStart(2,'0')}`
    })).filter(slot => toMinutes(slot.endTime) > toMinutes(slot.startTime)));
  });
  return available;
}

// Get employee schedule and available time slots for a specific date
router.get('/employee-schedule', async (req, res) => {
  try {
    const { employeeId, date } = req.query;
    
    console.log('getEmployeeSchedule called with:', req.query);
    console.log('Request date parsed:', new Date(date));
    
    if (!employeeId || !date) {
      return res.status(400).json({ 
        success: false,
        error: 'employeeId and date are required' 
      });
    }

    // 1. Fetch employee and their schedule
    let employee;
    try {
      employee = await Employee.findById(employeeId).lean();
    } catch (dbError) {
      console.error('Database error finding employee:', dbError.message);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid employee ID format' 
      });
    }
    
    if (!employee) {
      console.log('Employee not found with ID:', employeeId);
      return res.status(404).json({ 
        success: false,
        error: 'Employee not found' 
      });
    }

    console.log('Found employee:', employee.user?.firstName, employee.user?.lastName);
    console.log('Full workSchedule structure:', JSON.stringify(employee.workSchedule, null, 2));
    
    // Debug: List all keys in workSchedule
    if (employee.workSchedule instanceof Map) {
      console.log('WorkSchedule Map keys:', Array.from(employee.workSchedule.keys()));
    } else if (employee.workSchedule && typeof employee.workSchedule === 'object') {
      console.log('WorkSchedule Object keys:', Object.keys(employee.workSchedule));
    }

    // 2. Get scheduled shifts for the day from admin panel data
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dayIdx = new Date(date).getDay();
    const dayKey = dayNames[dayIdx];
    
    // Handle both Map and Object formats for workSchedule
    let schedule;
    if (employee.workSchedule instanceof Map) {
      // First try to get by specific date (new format - PRIORITY)
      const specificDateKey = date; // YYYY-MM-DD format
      schedule = employee.workSchedule.get(specificDateKey);
      console.log('Trying specific date key:', specificDateKey, 'Result:', schedule);
      
      // If not found, try by day name (legacy format)
      if (!schedule) {
        schedule = employee.workSchedule.get(dayKey);
        console.log('Fallback to day key:', dayKey, 'Result:', schedule);
      }
    } else if (employee.workSchedule && typeof employee.workSchedule === 'object') {
      // First try specific date (new format - PRIORITY)
      const specificDateKey = date; // YYYY-MM-DD format
      schedule = employee.workSchedule[specificDateKey];
      console.log('Trying specific date key in object:', specificDateKey, 'Result:', schedule);
      
      // If not found, try day name (legacy format)
      if (!schedule) {
        schedule = employee.workSchedule[dayKey];
        console.log('Fallback to day key in object:', dayKey, 'Result:', schedule);
      }
    }
    
    console.log('📅 FINAL SELECTED schedule for', dayKey, 'or date', date, ':', schedule);
    console.log('📅 Schedule source:', schedule === employee.workSchedule[date] ? 'DATE-SPECIFIC ✅' : 'DAY-BASED ❌');
    
    let scheduledShifts = [];
    if (schedule?.shiftsData && Array.isArray(schedule.shiftsData) && schedule.shiftsData.length) {
      // Use shiftsData array (admin format) - PRIORITY 1
      scheduledShifts = schedule.shiftsData.map(s => ({
        startTime: s.startTime,
        endTime: s.endTime
      }));
      console.log('Using shiftsData array:', scheduledShifts);
    } else if (schedule?.startTime && schedule?.endTime && schedule?.isWorking) {
      // Use startTime/endTime (fallback)
      scheduledShifts = [{ 
        startTime: schedule.startTime, 
        endTime: schedule.endTime 
      }];
      console.log('Using startTime/endTime:', scheduledShifts);
    } else {
      console.log('No working schedule found for this day');
    }

    // 3. Fetch bookings for employee on that date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookings = await Booking.find({
      'services.employee': employeeId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    }).lean();
    
    console.log('Found bookings:', bookings.length);
    
    const bookedSlots = [];
    bookings.forEach(booking => {
      booking.services.forEach(service => {
        if (service.employee.toString() === employeeId) {
          const startTime = new Date(service.startTime);
          const endTime = new Date(service.endTime);
          bookedSlots.push({
            startTime: `${String(startTime.getHours()).padStart(2,'0')}:${String(startTime.getMinutes()).padStart(2,'0')}`,
            endTime: `${String(endTime.getHours()).padStart(2,'0')}:${String(endTime.getMinutes()).padStart(2,'0')}`
          });
        }
      });
    });

    console.log('Booked slots:', bookedSlots);

    // 4. Generate time slots with 15-minute intervals using the same logic as getAvailableTimeSlots
    let availableTimeSlots = [];
    
    // Use the same time slot generation logic
    scheduledShifts.forEach(shift => {
      // Parse times more robustly to avoid timezone issues
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      
      // Create date objects using explicit components to avoid timezone parsing issues
      const startTime = new Date(date + 'T00:00:00.000Z');
      startTime.setUTCHours(startHour, startMin, 0, 0);
      
      const endTime = new Date(date + 'T00:00:00.000Z');
      endTime.setUTCHours(endHour, endMin, 0, 0);
      
      console.log('🕒 DEBUG: Generating slots for shift:', shift);
      console.log('🕒 DEBUG: startTime:', startTime.toISOString());
      console.log('🕒 DEBUG: endTime:', endTime.toISOString());
      console.log('🕒 DEBUG: Duration in minutes:', (endTime - startTime) / (1000 * 60));
      console.log('🕒 DEBUG: Expected slots with 15min intervals:', Math.floor((endTime - startTime) / (1000 * 60 * 15)));
      
      let currentTime = new Date(startTime);
      let slotCount = 0;
      
      // Generate slots every 15 minutes until we reach the end time
      while (currentTime < endTime) {
        slotCount++;
        
        // Format time as "HH:MM" (24-hour format)
        const timeString = String(currentTime.getUTCHours()).padStart(2, '0') + ':' + 
                          String(currentTime.getUTCMinutes()).padStart(2, '0');
        
        // Create slot end time (15 minutes later)
        const slotEnd = new Date(currentTime.getTime() + 15 * 60 * 1000);
        
        console.log(`🕒 DEBUG: Slot ${slotCount}: ${timeString} (${currentTime.toISOString()} to ${slotEnd.toISOString()})`);
        
        // Check if this slot overlaps with any booking
        const isBooked = bookedSlots.some(booking => {
          const bookingStart = booking.startTime;
          const bookingEnd = booking.endTime;
          return timeString >= bookingStart && timeString < bookingEnd;
        });
        
        // Add the slot
        availableTimeSlots.push({
          time: timeString,
          startTime: currentTime.toISOString(),
          endTime: slotEnd.toISOString(),
          available: !isBooked
        });

        // Move to next 15-minute interval
        currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
      }
      
      console.log('🕒 DEBUG: Generated', slotCount, 'slots for this shift');
    });
    
    console.log('🕒 Generated', availableTimeSlots.length, 'time slots with 15-minute intervals for getEmployeeSchedule');
    
    // Filter out booked slots
    const availableSlots = availableTimeSlots.filter(slot => slot.available);
    
    console.log('Available time slots:', availableSlots);

    // 5. Respond with all data
    res.json({
      success: true,
      data: {
        employeeId,
        date,
        dayOfWeek: dayKey,
        scheduledShifts,
        bookedSlots,
        availableTimeSlots: availableSlots,  // Use the filtered available slots
        totalSlots: availableTimeSlots.length, // Total generated slots
        availableSlots: availableSlots.length  // Available (non-booked) slots
      }
    });
  } catch (error) {
    console.error('Error fetching employee schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee schedule'
    });
  }
});

module.exports = router;
