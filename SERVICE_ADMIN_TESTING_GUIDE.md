# Service Management Testing Guide - Admin Only

This guide will walk you through testing the admin-only service management endpoints in Postman.

## Prerequisites

1. **Start your server**: Make sure your SPA backend is running
2. **Base URL**: Replace `{{base_url}}` with your actual server URL (e.g., `http://localhost:3000`)
3. **Admin Account**: You need an admin user account to test these routes

## Step 1: Admin Authentication

First, you need to authenticate as an admin user.

### Option A: Admin Login (if admin exists)

**Request**: `POST {{base_url}}/api/v1/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "email": "admin@spa.com",
  "password": "adminpassword123"
}
```

### Option B: Create Admin User (if no admin exists)

**Request**: `POST {{base_url}}/api/v1/auth/signup`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@spa.com",
  "password": "adminpassword123",
  "phone": "+1234567890",
  "dateOfBirth": "1980-01-01",
  "gender": "male",
  "role": "admin"
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
      "_id": "admin_user_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@spa.com",
      "role": "admin"
    }
  }
}
```

**Save the admin token** from the response.

## Step 2: Test Public Service Routes (No Auth Required)

### Get All Services

**Request**: `GET {{base_url}}/api/v1/services`

**Expected Response**:
```json
{
  "success": true,
  "results": 2,
  "data": {
    "services": [
      {
        "_id": "service_id_1",
        "name": "Swedish Massage",
        "description": "Relaxing full body massage",
        "category": "massage",
        "duration": 60,
        "price": 80,
        "discountPrice": 70,
        "isActive": true,
        "isPopular": true
      }
    ]
  }
}
```

### Get Service Categories

**Request**: `GET {{base_url}}/api/v1/services/categories`

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "categories": [
      "facial",
      "massage",
      "body-treatment",
      "nail-care",
      "hair-removal",
      "aromatherapy",
      "wellness",
      "package"
    ]
  }
}
```

### Get Popular Services

**Request**: `GET {{base_url}}/api/v1/services/popular`

**Expected Response**:
```json
{
  "success": true,
  "results": 1,
  "data": {
    "services": [
      {
        "_id": "service_id_1",
        "name": "Swedish Massage",
        "description": "Relaxing full body massage",
        "category": "massage",
        "duration": 60,
        "price": 80,
        "discountPrice": 70,
        "isPopular": true
      }
    ]
  }
}
```

### Get Individual Service

**Request**: `GET {{base_url}}/api/v1/services/{{service_id}}`

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "service": {
      "_id": "service_id_1",
      "name": "Swedish Massage",
      "description": "Relaxing full body massage",
      "category": "massage",
      "duration": 60,
      "price": 80,
      "discountPrice": 70,
      "images": [],
      "isActive": true,
      "isPopular": true,
      "ratings": {
        "average": 4.5,
        "count": 25
      }
    }
  }
}
```

## Step 3: Test Admin-Only Service Routes

### Create New Service

**Request**: `POST {{base_url}}/api/v1/services`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{admin_token}}
```

**Body** (raw JSON):
```json
{
  "name": "Deep Tissue Massage",
  "description": "Intensive massage for muscle tension and pain relief",
  "category": "massage",
  "duration": 90,
  "price": 120,
  "discountPrice": 100,
  "isActive": true,
  "isPopular": false,
  "requirements": {
    "minAge": 18,
    "maxAge": 80,
    "gender": "any",
    "specialInstructions": "Not recommended for pregnant women"
  },
  "benefits": [
    "Relieves muscle tension",
    "Improves blood circulation",
    "Reduces stress and anxiety"
  ],
  "contraindications": [
    "Pregnancy",
    "Recent surgery",
    "Blood clotting disorders"
  ],
  "preparationInstructions": [
    "Avoid heavy meals 2 hours before",
    "Stay hydrated",
    "Wear comfortable clothing"
  ],
  "aftercareInstructions": [
    "Drink plenty of water",
    "Rest for 30 minutes",
    "Avoid strenuous exercise for 24 hours"
  ],
  "equipment": [
    "Massage table",
    "Essential oils",
    "Towels"
  ],
  "products": [
    "Massage oil",
    "Essential oils"
  ],
  "skillLevel": "intermediate",
  "bookingSettings": {
    "advanceBookingDays": 30,
    "cancellationPolicy": 24,
    "reschedulePolicy": 12,
    "maxBookingsPerDay": 8,
    "bufferTime": 15
  },
  "tags": ["deep-tissue", "pain-relief", "muscle-tension"],
  "seoData": {
    "metaTitle": "Deep Tissue Massage - Professional Pain Relief",
    "metaDescription": "Expert deep tissue massage for muscle tension and pain relief",
    "keywords": ["deep tissue massage", "pain relief", "muscle tension"]
  }
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "service": {
      "_id": "new_service_id",
      "name": "Deep Tissue Massage",
      "description": "Intensive massage for muscle tension and pain relief",
      "category": "massage",
      "duration": 90,
      "price": 120,
      "discountPrice": 100,
      "isActive": true,
      "isPopular": false
    }
  }
}
```

**Save the new service ID** from the response.

### Update Service

**Request**: `PATCH {{base_url}}/api/v1/services/{{service_id}}`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{admin_token}}
```

**Body** (raw JSON):
```json
{
  "price": 130,
  "discountPrice": 110,
  "description": "Updated description for deep tissue massage",
  "isPopular": true
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": {
    "service": {
      "_id": "service_id",
      "name": "Deep Tissue Massage",
      "description": "Updated description for deep tissue massage",
      "price": 130,
      "discountPrice": 110,
      "isPopular": true
    }
  }
}
```

### Get Service Statistics (Admin Only)

**Request**: `GET {{base_url}}/api/v1/services/{{service_id}}/stats`

**Headers**:
```
Authorization: Bearer {{admin_token}}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "service": {
      "_id": "service_id",
      "name": "Deep Tissue Massage"
    },
    "stats": {
      "totalBookings": 45,
      "completedBookings": 42,
      "cancelledBookings": 3,
      "totalRevenue": 5040,
      "averageRating": 4.7,
      "totalReviews": 38,
      "popularityScore": 85,
      "monthlyBookings": [
        {"month": "Jan", "bookings": 12},
        {"month": "Feb", "bookings": 15},
        {"month": "Mar", "bookings": 18}
      ]
    }
  }
}
```

### Update Service Ratings (Admin Only)

**Request**: `PATCH {{base_url}}/api/v1/services/{{service_id}}/update-ratings`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{admin_token}}
```

**Body** (raw JSON):
```json
{
  "average": 4.8,
  "count": 40
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Service ratings updated successfully",
  "data": {
    "service": {
      "_id": "service_id",
      "name": "Deep Tissue Massage",
      "ratings": {
        "average": 4.8,
        "count": 40
      }
    }
  }
}
```

### Delete Service

**Request**: `DELETE {{base_url}}/api/v1/services/{{service_id}}`

**Headers**:
```
Authorization: Bearer {{admin_token}}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

## Step 4: Test Error Cases

### Test Employee Access (Should Fail)

**Request**: `POST {{base_url}}/api/v1/services`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{employee_token}}
```

**Body** (raw JSON):
```json
{
  "name": "Test Service",
  "description": "Test description",
  "category": "massage",
  "duration": 60,
  "price": 80
}
```

**Expected Response** (403 Forbidden):
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### Test Client Access (Should Fail)

**Request**: `POST {{base_url}}/api/v1/services`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{client_token}}
```

**Expected Response** (403 Forbidden):
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### Test Without Authentication (Should Fail)

**Request**: `POST {{base_url}}/api/v1/services`

**Headers**:
```
Content-Type: application/json
```

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "You are not logged in! Please log in to get access."
}
```

## Step 5: Test Service Search and Filtering

### Search Services

**Request**: `GET {{base_url}}/api/v1/services/search?q=massage`

**Expected Response**:
```json
{
  "success": true,
  "results": 2,
  "data": {
    "services": [
      {
        "_id": "service_id_1",
        "name": "Swedish Massage",
        "description": "Relaxing full body massage",
        "category": "massage"
      },
      {
        "_id": "service_id_2",
        "name": "Deep Tissue Massage",
        "description": "Intensive massage for muscle tension",
        "category": "massage"
      }
    ]
  }
}
```

### Get Services by Category

**Request**: `GET {{base_url}}/api/v1/services/category/massage`

**Expected Response**:
```json
{
  "success": true,
  "results": 2,
  "data": {
    "category": "massage",
    "services": [
      {
        "_id": "service_id_1",
        "name": "Swedish Massage",
        "description": "Relaxing full body massage",
        "duration": 60,
        "price": 80
      }
    ]
  }
}
```

### Get Services with Availability

**Request**: `GET {{base_url}}/api/v1/services/with-availability?date=2024-01-15`

**Expected Response**:
```json
{
  "success": true,
  "results": 2,
  "data": {
    "services": [
      {
        "_id": "service_id_1",
        "name": "Swedish Massage",
        "description": "Relaxing full body massage",
        "duration": 60,
        "price": 80,
        "availableSlots": 8,
        "availableEmployees": 3
      }
    ]
  }
}
```

## Postman Environment Variables

Create these variables in your Postman environment:

1. **base_url**: `http://localhost:3000`
2. **admin_token**: (from admin login)
3. **service_id**: (from get services response)
4. **new_service_id**: (from create service response)

## Testing Checklist

### ✅ Admin Authentication
- [ ] Admin login successful
- [ ] Admin token received
- [ ] Token works for admin routes

### ✅ Public Routes (No Auth)
- [ ] Get all services
- [ ] Get service categories
- [ ] Get popular services
- [ ] Get individual service
- [ ] Search services
- [ ] Get services by category

### ✅ Admin-Only Routes
- [ ] Create new service
- [ ] Update existing service
- [ ] Get service statistics
- [ ] Update service ratings
- [ ] Delete service

### ✅ Error Cases
- [ ] Employee access denied
- [ ] Client access denied
- [ ] No authentication denied
- [ ] Invalid service ID returns 404

### ✅ Data Validation
- [ ] Required fields validation
- [ ] Price validation (non-negative)
- [ ] Duration validation (15-480 minutes)
- [ ] Category validation (enum values)

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Service name is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "You are not logged in! Please log in to get access."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Service not found"
}
```

## Tips for Testing

1. **Use Environment Variables**: Set up variables to avoid copying/pasting IDs
2. **Test All CRUD Operations**: Create, Read, Update, Delete
3. **Test Authorization**: Try different user roles
4. **Test Validation**: Try invalid data
5. **Check Response Format**: Ensure consistent JSON structure
6. **Test Search & Filter**: Verify search functionality works
7. **Test Statistics**: Verify admin analytics work

This completes the comprehensive testing guide for admin-only service management routes! 