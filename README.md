# Spa Booking & Management System Backend

A comprehensive Node.js backend API for spa booking and management systems, designed to support both Flutter mobile applications and web applications (MERN stack).

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Database Models](#database-models)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

## Features

### Core Features
- **User Management**: Registration, authentication, profile management
- **Role-Based Access Control**: Client, Employee, and Admin roles
- **Service Management**: Create, update, and manage spa services
- **Booking System**: Complete booking lifecycle management
- **Employee Management**: Staff scheduling and performance tracking
- **Real-time Availability**: Check service and employee availability
- **Payment Integration**: Support for multiple payment methods
- **Notification System**: Email, SMS, and push notifications
- **Analytics Dashboard**: Comprehensive business analytics
- **Feedback System**: Customer reviews and ratings

### Advanced Features
- **Multi-platform Support**: Optimized for both mobile and web clients
- **Rate Limiting**: API protection against abuse
- **Data Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Centralized error management
- **Logging**: Detailed application logging
- **Security**: JWT authentication, CORS, helmet protection
- **Caching**: Redis integration for improved performance
- **File Upload**: Image and document management
- **Backup System**: Automated database backups

## Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Mongoose validation + custom validators
- **File Upload**: Multer with Sharp for image processing
- **Email**: Nodemailer
- **Testing**: Jest with Supertest
- **Documentation**: Comprehensive API docs

## Project Structure

```
spa-backend/
├── controllers/
│   ├── authController.js      # Authentication logic
│   ├── bookingController.js   # Booking management
│   ├── clientController.js    # Client management
│   ├── employeeController.js  # Employee management
│   ├── serviceController.js   # Service management
│   └── adminController.js     # Admin dashboard & analytics
├── models/
│   ├── User.js               # User model (clients, employees, admins)
│   ├── Booking.js            # Booking model
│   ├── Service.js            # Service model
│   ├── Employee.js           # Employee model
│   ├── Attendance.js         # Employee attendance tracking
│   └── Feedback.js           # Customer feedback & reviews
├── routes/
│   ├── authRoutes.js         # Authentication endpoints
│   ├── bookingRoutes.js      # Booking endpoints
│   ├── serviceRoutes.js      # Service endpoints
│   ├── employeeRoutes.js     # Employee endpoints
│   └── adminRoutes.js        # Admin endpoints
├── middleware/
│   ├── authMiddleware.js     # JWT authentication
│   └── roleMiddleware.js     # Role-based access control
├── config/
│   └── db.js                 # Database configuration
├── app.js                    # Express app configuration
├── server.js                 # Server startup
├── package.json              # Dependencies and scripts
└── .env                      # Environment variables
```

## Installation

### Prerequisites
- Node.js 16.0 or higher
- MongoDB 4.4 or higher
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd spa-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

5. **Run the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` by default.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/spa-booking-system |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT expiration time | 90d |
| `EMAIL_HOST` | SMTP host for emails | (optional) |
| `EMAIL_PORT` | SMTP port | 587 |
| `RATE_LIMIT_MAX` | Max requests per window | 1000 |
| `TAX_RATE` | Tax rate for bookings | 0.08 |

### Business Configuration

Configure business-specific settings in `.env`:

```env
BUSINESS_NAME=Luxury Spa & Wellness Center
BUSINESS_HOURS_START=9
BUSINESS_HOURS_END=18
BUSINESS_CLOSED_DAYS=0  # Sunday
TAX_RATE=0.08
```

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/signup
Content-Type: application/json

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

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <jwt-token>
```

### Service Endpoints

#### Get All Services
```http
GET /api/v1/services
```

#### Get Service by ID
```http
GET /api/v1/services/:id
```

#### Create Service (Staff Only)
```http
POST /api/v1/services
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Swedish Massage",
  "description": "Relaxing full-body massage",
  "category": "massage",
  "duration": 60,
  "price": 120,
  "availableEmployees": ["employee_id_1", "employee_id_2"]
}
```

### Booking Endpoints

#### Create Booking
```http
POST /api/v1/bookings
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "services": [
    {
      "service": "service_id",
      "employee": "employee_id",
      "startTime": "2024-01-15T10:00:00Z"
    }
  ],
  "appointmentDate": "2024-01-15T10:00:00Z",
  "clientNotes": "First time visit",
  "paymentMethod": "card"
}
```

#### Get User Bookings
```http
GET /api/v1/bookings
Authorization: Bearer <jwt-token>
```

#### Cancel Booking
```http
PATCH /api/v1/bookings/:id/cancel
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "reason": "Schedule conflict"
}
```

### Employee Endpoints

#### Get Available Employees
```http
GET /api/v1/employees/available?serviceId=<service_id>&startTime=<iso_date>&endTime=<iso_date>
Authorization: Bearer <jwt-token>
```

#### Get Employee Schedule
```http
GET /api/v1/employees/:id/schedule?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <jwt-token>
```

### Admin Endpoints

#### Dashboard Statistics
```http
GET /api/v1/admin/dashboard
Authorization: Bearer <admin-jwt-token>
```

#### Revenue Analytics
```http
GET /api/v1/admin/analytics/revenue?period=monthly&year=2024
Authorization: Bearer <admin-jwt-token>
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### User Roles

1. **Client**: Can book services, view their bookings, update profile
2. **Employee**: Can view assigned bookings, update availability, view performance
3. **Admin**: Full access to all endpoints, analytics, user management

### Protected Routes

Most endpoints require authentication. Public endpoints include:
- Service listings
- Service details
- User registration
- User login
- Password reset

## Database Models

### User Model
- Personal information (name, email, phone)
- Authentication data (password, tokens)
- Role-based permissions
- Preferences and settings

### Service Model
- Service details (name, description, category)
- Pricing and duration
- Employee assignments
- Booking settings and policies

### Booking Model
- Client and service information
- Appointment scheduling
- Payment tracking
- Status management (confirmed, completed, cancelled)

### Employee Model
- Professional information
- Work schedule and availability
- Performance metrics
- Certifications and skills

## Deployment

### Production Deployment

1. **Environment Setup**
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/spa-booking
```

2. **Build and Start**
```bash
npm install --production
npm run prod
```

3. **Process Management**
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name spa-backend
pm2 startup
pm2 save
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Cloud Deployment

The application is configured to work with:
- **Heroku**: Ready for Heroku deployment
- **AWS**: Compatible with EC2, ECS, Lambda
- **Google Cloud**: App Engine and Cloud Run ready
- **DigitalOcean**: App Platform compatible

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- booking.test.js
```

### Test Structure
```
tests/
├── unit/
│   ├── models/
│   ├── controllers/
│   └── middleware/
├── integration/
│   ├── auth.test.js
│   ├── booking.test.js
│   └── service.test.js
└── fixtures/
    └── testData.js
```

## Performance Optimization

### Caching Strategy
- Redis for session storage
- MongoDB query optimization
- Response caching for static data

### Database Optimization
- Proper indexing on frequently queried fields
- Aggregation pipelines for analytics
- Connection pooling

### Security Measures
- Rate limiting per IP
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- JWT token expiration

## Monitoring and Logging

### Application Monitoring
- Health check endpoint: `/health`
- Performance metrics collection
- Error tracking and alerting

### Logging Configuration
```javascript
// Log levels: error, warn, info, debug
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## API Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 1000 requests | 1 hour |
| File Upload | 10 requests | 1 hour |

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Use ESLint configuration
- Follow Airbnb JavaScript style guide
- Write meaningful commit messages
- Add JSDoc comments for functions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Email: support@spa-booking.com
- Documentation: [API Docs](http://localhost:3000/api)

## Changelog

### Version 1.0.0
- Initial release
- Complete booking system
- User management
- Service management
- Employee management
- Admin dashboard
- Analytics and reporting

