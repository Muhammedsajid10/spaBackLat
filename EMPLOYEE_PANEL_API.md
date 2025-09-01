# Employee Panel API Documentation

This document describes the restricted Employee Panel API that limits employee access to only their own data and essential functions.

## 🔒 **Employee Access Restrictions**

Employees can **ONLY** access:
- ✅ Their own schedule/appointments
- ✅ Their own attendance records
- ✅ Their own ratings and feedback
- ✅ Their own performance metrics
- ✅ Check-in/check-out functionality

Employees **CANNOT** access:
- ❌ Client contact information
- ❌ Other employees' data
- ❌ Service management (create/update/delete)
- ❌ Booking modifications
- ❌ Admin analytics
- ❌ System settings

## 📋 **Employee Panel Endpoints**

### **1. Schedule Dashboard**

**GET** `/api/v1/employees/my-schedule`

Returns the employee's upcoming appointments with limited client information.

**Headers:**
```
Authorization: Bearer <employee_token>
```

**Response:**
```json
{
  "success": true,
  "results": 3,
  "data": {
    "employee": {
      "_id": "employee_id",
      "employeeId": "EMP001",
      "position": "massage-therapist",
      "department": "spa-services"
    },
    "upcomingAppointments": [
      {
        "_id": "booking_id",
        "bookingNumber": "BK1705123456ABC12",
        "appointmentDate": "2024-01-15T00:00:00.000Z",
        "status": "confirmed",
        "services": [
          {
            "_id": "service_id",
            "service": {
              "name": "Swedish Massage",
              "duration": 60,
              "price": 70
            },
            "startTime": "2024-01-15T10:15:00.000Z",
            "endTime": "2024-01-15T11:15:00.000Z",
            "status": "scheduled"
          }
        ],
        "client": {
          "firstName": "John",
          "lastName": "Doe"
          // No email, phone, or other contact details
        },
        "totalDuration": 60,
        "totalAmount": 70
      }
    ]
  }
}
```

### **2. Attendance Management**

#### **Get My Attendance**
**GET** `/api/v1/employees/my-attendance?startDate=2024-01-01&endDate=2024-01-31`

**Response:**
```json
{
  "success": true,
  "results": 22,
  "data": {
    "attendance": [
      {
        "_id": "attendance_id",
        "employee": "employee_id",
        "date": "2024-01-15T00:00:00.000Z",
        "checkIn": "2024-01-15T09:00:00.000Z",
        "checkOut": "2024-01-15T17:00:00.000Z",
        "workingHours": 8,
        "status": "present"
      }
    ]
  }
}
```

#### **Check-In**
**POST** `/api/v1/employees/check-in`

**Response:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "checkInTime": "2024-01-15T09:00:00.000Z"
  }
}
```

#### **Check-Out**
**POST** `/api/v1/employees/check-out`

**Response:**
```json
{
  "success": true,
  "message": "Check-out successful",
  "data": {
    "checkOutTime": "2024-01-15T17:00:00.000Z",
    "workingHours": 8
  }
}
```

### **3. Ratings & Feedback**

**GET** `/api/v1/employees/my-ratings`

Returns the employee's ratings and feedback with limited client information.

**Response:**
```json
{
  "success": true,
  "data": {
    "employee": {
      "_id": "employee_id",
      "employeeId": "EMP001",
      "position": "massage-therapist"
    },
    "ratings": {
      "average": 4.8,
      "total": 25,
      "breakdown": {
        "5": 18,
        "4": 5,
        "3": 2,
        "2": 0,
        "1": 0
      }
    },
    "recentFeedback": [
      {
        "_id": "booking_id",
        "rating": 5,
        "comment": "Excellent massage, very professional!",
        "submittedAt": "2024-01-14T10:30:00.000Z",
        "wouldRecommend": true,
        "service": "Swedish Massage",
        "appointmentDate": "2024-01-13T00:00:00.000Z",
        "client": {
          "firstName": "Jane",
          "lastName": "Smith"
          // No email or contact details
        }
      }
    ]
  }
}
```

### **4. Performance Summary**

**GET** `/api/v1/employees/my-performance?period=month`

**Query Parameters:**
- `period`: `week`, `month`, `year` (default: `month`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "metrics": {
      "totalBookings": 45,
      "completedBookings": 42,
      "completionRate": 93,
      "totalRevenue": 3150.00,
      "averageRating": 4.8,
      "totalWorkingHours": 160.5,
      "attendanceRate": 95
    }
  }
}
```

## 🚫 **What Employees Cannot Access**

### **Service Management (Admin Only)**
- ❌ `POST /api/v1/services` - Create service
- ❌ `PATCH /api/v1/services/:id` - Update service
- ❌ `DELETE /api/v1/services/:id` - Delete service
- ❌ `GET /api/v1/services/:id/stats` - Service analytics

### **Client Data (Restricted)**
- ❌ Client email addresses
- ❌ Client phone numbers
- ❌ Client addresses
- ❌ Client payment information
- ❌ Client booking history (except their own appointments)

### **Other Employee Data (Restricted)**
- ❌ Other employees' schedules
- ❌ Other employees' attendance
- ❌ Other employees' ratings
- ❌ Other employees' performance

### **Booking Management (Restricted)**
- ❌ Modify existing bookings
- ❌ Cancel bookings
- ❌ Reschedule bookings
- ❌ Access booking payment details

## 🔐 **Authentication Requirements**

All employee panel endpoints require:
```
Authorization: Bearer <employee_jwt_token>
```

## 📊 **Data Privacy Features**

### **Client Information Filtering**
- Only `firstName` and `lastName` are shown
- No email, phone, address, or payment information
- No client booking history outside of employee's appointments

### **Employee Data Isolation**
- Employees can only access their own data
- No cross-employee data access
- Performance metrics are personal only

### **Audit Logging**
- All employee actions are logged
- Check-in/check-out events are tracked
- Data access is monitored

## 🎯 **Employee Panel Use Cases**

### **Daily Workflow**
1. **Check-in** when arriving at work
2. **View schedule** to see today's appointments
3. **Check-out** when leaving work
4. **View ratings** for motivation and feedback

### **Performance Tracking**
1. **View attendance** records
2. **Check performance** metrics
3. **Review feedback** from clients
4. **Monitor completion** rates

## ⚠️ **Error Responses**

### **403 Forbidden (Employee Access Denied)**
```json
{
  "success": false,
  "message": "Access denied. You can only access your own data."
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "message": "You are not logged in! Please log in to get access."
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Employee record not found"
}
```

## 📱 **Frontend Integration Example**

```javascript
// Employee dashboard
const employeeDashboard = async () => {
  const token = localStorage.getItem('employee_token');
  
  // Get schedule
  const schedule = await fetch('/api/v1/employees/my-schedule', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  
  // Get ratings
  const ratings = await fetch('/api/v1/employees/my-ratings', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  
  // Get performance
  const performance = await fetch('/api/v1/employees/my-performance', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  
  return { schedule, ratings, performance };
};

// Check-in
const checkIn = async () => {
  const token = localStorage.getItem('employee_token');
  
  const response = await fetch('/api/v1/employees/check-in', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
};
```

## 🔄 **Role Hierarchy**

```
Admin (Full Access)
├── Manage all employees
├── Manage all services
├── View all bookings
├── Access all analytics
└── System administration

Employee (Restricted Access)
├── View own schedule
├── Mark own attendance
├── View own ratings
├── View own performance
└── No client data access
```

This restricted employee panel ensures data privacy while providing employees with the essential tools they need for their daily work. 