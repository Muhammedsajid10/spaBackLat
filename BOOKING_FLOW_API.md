# SPA Booking Flow API Documentation

This document describes the complete booking flow for the SPA backend, including service selection, professional selection, time slot availability, and authentication.

## Booking Flow Overview

1. **Service Selection** - Client selects a service
2. **Professional Selection** - Client chooses a professional for the service
3. **Time Slot Selection** - Client selects available time slot
4. **Booking Confirmation** - System creates booking confirmation
5. **Authentication** - Client logs in or signs up
6. **Booking Completion** - Final booking is created

## API Endpoints

### 1. Get Available Services

**GET** `/api/v1/bookings/services`

Returns all available services for booking.

**Response:**
```json
{
  "success": true,
  "results": 2,
  "data": {
    "services": [
      {
        "_id": "service_id",
        "name": "Swedish Massage",
        "description": "Relaxing full body massage",
        "category": "massage",
        "duration": 60,
        "price": 80,
        "discountPrice": 70,
        "images": [...],
        "ratings": {
          "average": 4.5,
          "count": 25
        },
        "availableEmployees": [...]
      }
    ]
  }
}
```

### 2. Get Available Professionals

**GET** `/api/v1/bookings/professionals?serviceId=service_id&date=2024-01-15`

Returns available professionals for a specific service on a given date.

**Query Parameters:**
- `serviceId` (required): ID of the selected service
- `date` (optional): Date for availability check (default: today)

**Response:**
```json
{
  "success": true,
  "results": 2,
  "data": {
    "service": {
      "_id": "service_id",
      "name": "Swedish Massage",
      "duration": 60,
      "price": 70
    },
    "professionals": [
      {
        "_id": "employee_id",
        "employeeId": "EMP001",
        "position": "massage-therapist",
        "specializations": ["swedish-massage", "deep-tissue-massage"],
        "ratings": {
          "average": 4.8,
          "count": 15
        },
        "workSchedule": {
          "isWorking": true,
          "startTime": "09:00",
          "endTime": "17:00"
        },
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@spa.com",
          "phone": "+1234567890"
        }
      }
    ]
  }
}
```

### 3. Get Available Time Slots

**GET** `/api/v1/bookings/time-slots?employeeId=employee_id&serviceId=service_id&date=2024-01-15`

Returns available time slots for a specific professional and service on a given date.

**Query Parameters:**
- `employeeId` (required): ID of the selected professional
- `serviceId` (required): ID of the selected service
- `date` (required): Date for time slot availability

**Response:**
```json
{
  "success": true,
  "results": 8,
  "data": {
    "employee": {
      "_id": "employee_id",
      "employeeId": "EMP001",
      "position": "massage-therapist"
    },
    "service": {
      "_id": "service_id",
      "name": "Swedish Massage",
      "duration": 60,
      "price": 70
    },
    "date": "2024-01-15T00:00:00.000Z",
    "timeSlots": [
      {
        "startTime": "2024-01-15T09:00:00.000Z",
        "endTime": "2024-01-15T10:00:00.000Z",
        "available": true
      },
      {
        "startTime": "2024-01-15T10:15:00.000Z",
        "endTime": "2024-01-15T11:15:00.000Z",
        "available": true
      }
    ]
  }
}
```

### 4. Create Booking Confirmation

**POST** `/api/v1/bookings/confirmation`

Creates a booking confirmation before authentication.

**Request Body:**
```json
{
  "serviceId": "service_id",
  "employeeId": "employee_id",
  "appointmentDate": "2024-01-15",
  "startTime": "2024-01-15T10:15:00.000Z",
  "clientNotes": "Please use lavender oil",
  "specialRequests": ["extra towels", "quiet room"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking confirmation created. Please login or signup to complete your booking.",
  "data": {
    "bookingConfirmation": {
      "service": {
        "_id": "service_id",
        "name": "Swedish Massage",
        "description": "Relaxing full body massage",
        "duration": 60,
        "price": 70
      },
      "employee": {
        "_id": "employee_id",
        "employeeId": "EMP001",
        "position": "massage-therapist"
      },
      "appointmentDate": "2024-01-15T00:00:00.000Z",
      "startTime": "2024-01-15T10:15:00.000Z",
      "endTime": "2024-01-15T11:15:00.000Z",
      "totalAmount": 70,
      "clientNotes": "Please use lavender oil",
      "specialRequests": ["extra towels", "quiet room"],
      "confirmationToken": "abc123..."
    },
    "requiresAuth": true
  }
}
```

### 5. Authentication Endpoints

#### 5.1 Regular Login

**POST** `/api/v1/auth/login`

**Request Body:**
```json
{
  "email": "client@example.com",
  "password": "password123"
}
```

#### 5.2 Facebook Login

**POST** `/api/v1/auth/facebook`

**Request Body:**
```json
{
  "accessToken": "facebook_access_token",
  "userID": "facebook_user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### 5.3 Google Login

**POST** `/api/v1/auth/google`

**Request Body:**
```json
{
  "idToken": "google_id_token",
  "accessToken": "google_access_token",
  "googleId": "google_user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### 5.4 User Registration

**POST** `/api/v1/auth/signup`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

### 6. Complete Booking

**POST** `/api/v1/bookings/complete`

Completes the booking after authentication.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "confirmationToken": "abc123...",
  "serviceId": "service_id",
  "employeeId": "employee_id",
  "appointmentDate": "2024-01-15",
  "startTime": "2024-01-15T10:15:00.000Z",
  "clientNotes": "Please use lavender oil",
  "specialRequests": ["extra towels", "quiet room"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking completed successfully",
  "data": {
    "booking": {
      "_id": "booking_id",
      "bookingNumber": "BK1705123456ABC12",
      "client": "user_id",
      "services": [...],
      "appointmentDate": "2024-01-15T00:00:00.000Z",
      "totalDuration": 60,
      "totalAmount": 70,
      "finalAmount": 70,
      "status": "pending",
      "paymentStatus": "pending"
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Service ID is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Incorrect email or password"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Service not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Selected time slot is no longer available"
}
```

## Frontend Integration Example

```javascript
// 1. Get available services
const services = await fetch('/api/v1/bookings/services').then(r => r.json());

// 2. Get professionals for selected service
const professionals = await fetch(`/api/v1/bookings/professionals?serviceId=${serviceId}&date=${date}`).then(r => r.json());

// 3. Get time slots for selected professional
const timeSlots = await fetch(`/api/v1/bookings/time-slots?employeeId=${employeeId}&serviceId=${serviceId}&date=${date}`).then(r => r.json());

// 4. Create booking confirmation
const confirmation = await fetch('/api/v1/bookings/confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceId,
    employeeId,
    appointmentDate,
    startTime,
    clientNotes,
    specialRequests
  })
}).then(r => r.json());

// 5. Show login/signup page
if (confirmation.data.requiresAuth) {
  // Redirect to login page or show login modal
  showLoginModal();
}

// 6. After authentication, complete booking
const booking = await fetch('/api/v1/bookings/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    confirmationToken: confirmation.data.bookingConfirmation.confirmationToken,
    serviceId,
    employeeId,
    appointmentDate,
    startTime,
    clientNotes,
    specialRequests
  })
}).then(r => r.json());
```

## Notes

- All booking flow endpoints (except completion) are public and don't require authentication
- Time slots are generated based on professional work schedule and existing bookings
- Buffer time is added between appointments to allow for setup and cleanup
- Social authentication creates or links existing user accounts
- Booking confirmation tokens should be stored securely (Redis recommended for production)
- All dates should be in ISO 8601 format
- Time slots are in UTC and should be converted to local timezone on frontend 