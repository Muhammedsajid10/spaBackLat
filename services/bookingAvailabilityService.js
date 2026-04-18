const Employee = require('../models/Employee');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

class BookingAvailabilityService {
  /**
   * Check if an employee is working on a specific date/time
   */
  isWorking(employee, dateObj) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()];
    
    // Check for date-specific schedule first, then day-based
    const dateKey = dateObj.toISOString().split('T')[0];
    
    let schedule;
    if (employee.workSchedule instanceof Map) {
      schedule = employee.workSchedule.get(dateKey) || employee.workSchedule.get(dayName);
    } else if (employee.workSchedule) {
      schedule = employee.workSchedule[dateKey] || employee.workSchedule[dayName];
    }

    return schedule && schedule.isWorking;
  }

  /**
   * Check for overlaps in a set of time ranges
   */
  hasOverlap(ranges, start, end) {
    return ranges.some(r => start < r.end && end > r.start);
  }

  /**
   * Get existing bookings for an employee on a specific date
   */
  async getEmployeeBookings(employeeId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const bookings = await Booking.find({
      'services.employee': employeeId,
      appointmentDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $ne: 'cancelled' }
    }).select('services.startTime services.endTime services.employee');

    const ranges = [];
    bookings.forEach(b => {
      b.services.forEach(s => {
        if (String(s.employee) === String(employeeId)) {
          ranges.push({
            start: new Date(s.startTime),
            end: new Date(s.endTime)
          });
        }
      });
    });

    return ranges;
  }

  /**
   * Check if the end time exceeds the business cutoff (e.g., 23:30)
   */
  checkEndTimeCutoff(startTime, duration, cutoffMinutes = 1410) { // 1410 = 23:30
    const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
    const endMinutes = startMinutes + duration;
    
    if (endMinutes > cutoffMinutes) {
      const endHours = String(Math.floor(endMinutes / 60)).padStart(2, '0');
      const endMins = String(endMinutes % 60).padStart(2, '0');
      return {
        exceeded: true,
        endTimeStr: `${endHours}:${endMins}`
      };
    }
    return { exceeded: false };
  }

  /**
   * Validate a set of services for potential conflicts
   */
  async validateAvailability(services, appointmentDate) {
    const allEmployees = await Employee.find({ isActive: true });
    const employeeBookingsCache = new Map();
    const errors = [];

    for (const svc of services) {
      const { employeeId, startTime, endTime, serviceName } = svc;
      
      if (!employeeId || employeeId === 'any') continue;

      const employee = allEmployees.find(e => String(e._id) === String(employeeId));
      if (!employee) {
        errors.push({ serviceName, message: `Professional not found or inactive` });
        continue;
      }

      // Check if working
      if (!this.isWorking(employee, new Date(startTime))) {
        errors.push({ serviceName, message: `${employee.user?.firstName || 'Professional'} is not scheduled to work at this time` });
        continue;
      }

      // Check for overlaps
      if (!employeeBookingsCache.has(String(employeeId))) {
        const bookings = await this.getEmployeeBookings(employeeId, appointmentDate);
        employeeBookingsCache.set(String(employeeId), bookings);
      }

      const existingRanges = employeeBookingsCache.get(String(employeeId));
      if (this.hasOverlap(existingRanges, new Date(startTime), new Date(endTime))) {
        errors.push({ serviceName, message: `Time slot conflict for ${employee.user?.firstName || 'Professional'}` });
      }

      // Add current service to cache to prevent conflicts within the same booking draft
      existingRanges.push({ start: new Date(startTime), end: new Date(endTime) });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new BookingAvailabilityService();
