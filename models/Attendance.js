const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required']
  },
  date: {
    type: Date,
    required: [true, 'Attendance date is required']
  },
  clockIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    method: {
      type: String,
      enum: ['manual', 'biometric', 'card', 'mobile-app'],
      default: 'manual'
    },
    recordedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
  },
  clockOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    method: {
      type: String,
      enum: ['manual', 'biometric', 'card', 'mobile-app'],
      default: 'manual'
    },
    recordedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
  },
  breaks: [{
    breakStart: Date,
    breakEnd: Date,
    duration: Number, // in minutes
    type: {
      type: String,
      enum: ['lunch', 'short-break', 'personal', 'other'],
      default: 'short-break'
    },
    notes: String
  }],
  scheduledShift: {
    startTime: Date,
    endTime: Date,
    duration: Number // in minutes
  },
  actualHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'holiday', 'sick-leave', 'vacation'],
    default: 'present'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  isEarlyLeave: {
    type: Boolean,
    default: false
  },
  earlyLeaveMinutes: {
    type: Number,
    default: 0
  },
  leaveType: {
    type: String,
    enum: ['sick', 'vacation', 'personal', 'emergency', 'bereavement', 'maternity', 'paternity', 'other']
  },
  leaveReason: String,
  approvedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  notes: String,
  productivity: {
    bookingsHandled: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    customerRating: { type: Number, min: 0, max: 5 },
    tasksCompleted: { type: Number, default: 0 }
  },
  violations: [{
    type: {
      type: String,
      enum: ['late-arrival', 'early-departure', 'extended-break', 'no-show', 'policy-violation']
    },
    description: String,
    severity: { type: String, enum: ['minor', 'major', 'critical'] },
    actionTaken: String,
    reportedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
  }],
  corrections: [{
    originalClockIn: Date,
    originalClockOut: Date,
    correctedClockIn: Date,
    correctedClockOut: Date,
    reason: String,
    correctedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    correctedAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total break time
attendanceSchema.virtual('totalBreakTime').get(function() {
  if (!this.breaks || this.breaks.length === 0) return 0;
  return this.breaks.reduce((total, breakItem) => {
    return total + (breakItem.duration || 0);
  }, 0);
});

// Virtual for net working hours
attendanceSchema.virtual('netWorkingHours').get(function() {
  const totalBreakHours = this.totalBreakTime / 60;
  return Math.max(0, this.actualHours - totalBreakHours);
});

// Virtual for attendance percentage
attendanceSchema.virtual('attendancePercentage').get(function() {
  if (!this.scheduledShift || !this.scheduledShift.duration) return 0;
  const scheduledHours = this.scheduledShift.duration / 60;
  return Math.round((this.netWorkingHours / scheduledHours) * 100);
});

// Indexes for better query performance
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ isLate: 1 });
attendanceSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate actual hours and overtime
attendanceSchema.pre('save', function(next) {
  if (this.clockIn.time && this.clockOut.time) {
    const clockInTime = new Date(this.clockIn.time);
    const clockOutTime = new Date(this.clockOut.time);
    
    // Calculate actual hours worked
    const diffMs = clockOutTime - clockInTime;
    this.actualHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    
    // Calculate if late
    if (this.scheduledShift && this.scheduledShift.startTime) {
      const scheduledStart = new Date(this.scheduledShift.startTime);
      if (clockInTime > scheduledStart) {
        this.isLate = true;
        this.lateMinutes = Math.round((clockInTime - scheduledStart) / (1000 * 60));
      }
    }
    
    // Calculate if early leave
    if (this.scheduledShift && this.scheduledShift.endTime) {
      const scheduledEnd = new Date(this.scheduledShift.endTime);
      if (clockOutTime < scheduledEnd) {
        this.isEarlyLeave = true;
        this.earlyLeaveMinutes = Math.round((scheduledEnd - clockOutTime) / (1000 * 60));
      }
    }
    
    // Calculate overtime
    if (this.scheduledShift && this.scheduledShift.duration) {
      const scheduledHours = this.scheduledShift.duration / 60;
      this.overtimeHours = Math.max(0, this.actualHours - scheduledHours);
    }
  }
  
  next();
});

// Populate employee data when querying
attendanceSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'employee',
    select: 'employeeId user',
    populate: {
      path: 'user',
      select: 'firstName lastName'
    }
  });
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);

