# Postman Testing Guide - SPA Booking Flow

This guide will walk you through testing the complete booking flow in Postman step by step.

## Prerequisites

1. **Start your server**: Make sure your SPA backend is running
2. **Base URL**: Replace `{{base_url}}` with your actual server URL (e.g., `http://localhost:3000`)
3. **Postman Collection**: Create a new collection for better organization

## Step 1: Get Available Services

**Request**: `GET {{base_url}}/api/v1/bookings/services`

**Headers**:
```
Content-Type: application/json
```

**Expected Response**:
```json
{
  "success": true,
  "results": 2,
  "data": {
    "services": [
      {
        "_id": "service_id_here",
        "name": "Swedish Massage",
        "description": "Relaxing full body massage",
        "category": "massage",
        "duration": 60,
        "price": 80,
        "discountPrice": 70,
        "images": [],
        "ratings": {
          "average": 4.5,
          "count": 25
        }
      }
    ]
  }
}
```

**Save the service ID** from the response for the next step.

## Step 2: Get Available Professionals

**Request**: `GET {{base_url}}/api/v1/bookings/professionals`

**Headers**:
```
Content-Type: application/json
```

**Query Params**:
```
serviceId: [service_id_from_step_1]
date: 2024-01-15
```

**Expected Response**:
```json
{
  "success": true,
  "results": 1,
  "data": {
    "service": {
      "_id": "service_id_here",
      "name": "Swedish Massage",
      "duration": 60,
      "price": 70
    },
    "professionals": [
      {
        "_id": "employee_id_here",
        "employeeId": "EMP001",
        "position": "massage-therapist",
        "specializations": ["swedish-massage"],
        "ratings": {
          "average": 4.8,
          "count": 15
        },
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@spa.com"
        }
      }
    ]
  }
}
```

**Save the employee ID** from the response for the next step.

## Step 3: Get Available Time Slots

**Request**: `GET {{base_url}}/api/v1/bookings/time-slots`

**Headers**:
```
Content-Type: application/json
```

**Query Params**:
```
employeeId: [employee_id_from_step_2]
serviceId: [service_id_from_step_1]
date: 2024-01-15
```

**Expected Response**:
```json
{
  "success": true,
  "results": 8,
  "data": {
    "employee": {
      "_id": "employee_id_here",
      "employeeId": "EMP001",
      "position": "massage-therapist"
    },
    "service": {
      "_id": "service_id_here",
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

**Save a startTime** from the response for the next step.

## Step 4: Create Booking Confirmation

**Request**: `POST {{base_url}}/api/v1/bookings/confirmation`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "serviceId": "[service_id_from_step_1]",
  "employeeId": "[employee_id_from_step_2]",
  "appointmentDate": "2024-01-15",
  "startTime": "[startTime_from_step_3]",
  "clientNotes": "Please use lavender oil",
  "specialRequests": ["extra towels", "quiet room"]
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Booking confirmation created. Please login or signup to complete your booking.",
  "data": {
    "bookingConfirmation": {
      "service": {
        "_id": "service_id_here",
        "name": "Swedish Massage",
        "description": "Relaxing full body massage",
        "duration": 60,
        "price": 70
      },
      "employee": {
        "_id": "employee_id_here",
        "employeeId": "EMP001",
        "position": "massage-therapist"
      },
      "appointmentDate": "2024-01-15T00:00:00.000Z",
      "startTime": "2024-01-15T10:15:00.000Z",
      "endTime": "2024-01-15T11:15:00.000Z",
      "totalAmount": 70,
      "clientNotes": "Please use lavender oil",
      "specialRequests": ["extra towels", "quiet room"],
      "confirmationToken": "abc123def456..."
    },
    "requiresAuth": true
  }
}
```

**Save the confirmationToken** from the response.

## Step 5: User Registration (Option 1)

**Request**: `POST {{base_url}}/api/v1/auth/signup`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "firstName": "John",
  "lastName": "Client",
  "email": "john.client@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "user_id_here",
      "firstName": "John",
      "lastName": "Client",
      "email": "john.client@example.com",
      "role": "client"
    }
  }
}
```

**Save the token** from the response.

## Step 5 Alternative: User Login (Option 2)

**Request**: `POST {{base_url}}/api/v1/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "email": "john.client@example.com",
  "password": "password123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "user_id_here",
      "firstName": "John",
      "lastName": "Client",
      "email": "john.client@example.com",
      "role": "client"
    }
  }
}
```

**Save the token** from the response.

## Step 6: Complete Booking

**Request**: `POST {{base_url}}/api/v1/bookings/complete`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer [token_from_step_5]
```

**Body** (raw JSON):
```json
{
  "confirmationToken": "[confirmationToken_from_step_4]",
  "serviceId": "[service_id_from_step_1]",
  "employeeId": "[employee_id_from_step_2]",
  "appointmentDate": "2024-01-15",
  "startTime": "[startTime_from_step_3]",
  "clientNotes": "Please use lavender oil",
  "specialRequests": ["extra towels", "quiet room"]
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Booking completed successfully",
  "data": {
    "booking": {
      "_id": "booking_id_here",
      "bookingNumber": "BK1705123456ABC12",
      "client": "user_id_here",
      "services": [
        {
          "service": "service_id_here",
          "employee": "employee_id_here",
          "price": 70,
          "duration": 60,
          "startTime": "2024-01-15T10:15:00.000Z",
          "endTime": "2024-01-15T11:15:00.000Z",
          "status": "scheduled"
        }
      ],
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

## Bonus: Social Authentication Testing

### Facebook Login

**Request**: `POST {{base_url}}/api/v1/auth/facebook`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "accessToken": "facebook_access_token_here",
  "userID": "facebook_user_id_here",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Google Login

**Request**: `POST {{base_url}}/api/v1/auth/google`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "idToken": "google_id_token_here",
  "accessToken": "google_access_token_here",
  "googleId": "google_user_id_here",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

## Postman Environment Variables

Create environment variables in Postman for easier testing:

1. **base_url**: `http://localhost:3000`
2. **service_id**: (from step 1)
3. **employee_id**: (from step 2)
4. **start_time**: (from step 3)
5. **confirmation_token**: (from step 4)
6. **auth_token**: (from step 5)

## Testing Tips

1. **Use Environment Variables**: Set up variables to avoid copying/pasting IDs
2. **Test Error Cases**: Try invalid IDs, missing fields, etc.
3. **Check Response Status**: Ensure you get 200/201 for success, 400/401/404 for errors
4. **Validate Data**: Check that the returned data matches your expectations
5. **Test Concurrency**: Try booking the same time slot twice to test conflict detection

## Common Error Responses

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

## Complete Flow Summary

1. ✅ Get services → Select a service
2. ✅ Get professionals → Choose a professional
3. ✅ Get time slots → Pick a time slot
4. ✅ Create confirmation → Get confirmation token
5. ✅ Login/Signup → Get authentication token
6. ✅ Complete booking → Finalize the booking

This completes the full booking flow testing in Postman! 