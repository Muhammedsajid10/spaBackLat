// middleware/employeeMiddleware.js
const mongoose = require('mongoose');

// Middleware to ensure default workSchedule before employee creation
const ensureDefaultWorkSchedule = async function(req, res, next) {
  try {
    console.log('🛠️ Employee middleware: Checking for default workSchedule');
    
    // If there's no workSchedule in the request body, add a default one
    if (!req.body.workSchedule) {
      console.log('No workSchedule found in request, creating default 24-hour schedule');
      
      // Create a default workSchedule object that matches what frontend expects
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const defaultWorkSchedule = {};
      
      daysOfWeek.forEach(day => {
        defaultWorkSchedule[day] = {
          isWorking: true,
          startTime: '00:00',
          endTime: '23:59',
          shifts: null,
          shiftsData: [],
          shiftCount: 0
        };
      });
      
      req.body.workSchedule = defaultWorkSchedule;
      console.log('Default workSchedule added to request');
    } else if (typeof req.body.workSchedule === 'object' && Object.keys(req.body.workSchedule).length === 0) {
      console.log('Empty workSchedule object found, replacing with default 24-hour schedule');
      
      // Create a default workSchedule object
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const defaultWorkSchedule = {};
      
      daysOfWeek.forEach(day => {
        defaultWorkSchedule[day] = {
          isWorking: true,
          startTime: '00:00',
          endTime: '23:59',
          shifts: null,
          shiftsData: [],
          shiftCount: 0
        };
      });
      
      req.body.workSchedule = defaultWorkSchedule;
      console.log('Default workSchedule replacing empty object');
    }
    
    console.log('Middleware complete, moving to controller');
    next();
  } catch (error) {
    console.error('Error in employee middleware:', error);
    next(error);
  }
};

module.exports = {
  ensureDefaultWorkSchedule
};