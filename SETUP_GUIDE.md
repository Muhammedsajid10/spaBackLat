# 🚀 SPA Backend Setup Guide

This guide will walk you through setting up your SPA Backend from scratch.

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

## 🛠️ Step-by-Step Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd spa-backend

# Install dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit the .env file with your configuration
nano .env
```

**Required Environment Variables:**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/spa-backend
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Step 3: Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# On Windows: Download from mongodb.com
# On Mac: brew install mongodb-community
# On Ubuntu: sudo apt install mongodb

# Start MongoDB service
# Windows: Start MongoDB service
# Mac/Linux: sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Recommended for Production)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

### Step 4: Initialize the Application

```bash
# Run the complete initialization
npm run init
```

This script will:
- ✅ Validate environment variables
- ✅ Test database connection
- ✅ Create necessary directories
- ✅ Create the first admin user
- ✅ Run security checks

### Step 5: Start the Server

```bash
# Development mode
npm run dev

# Or use the setup command (init + dev)
npm run setup
```

### Step 6: Verify Installation

1. **Health Check**: Visit `http://localhost:3000/health`
2. **API Documentation**: Visit `http://localhost:3000/api`
3. **Admin Login**: Use the credentials from the initialization output

## 🔑 Default Admin Credentials

After running `npm run init`, you'll get default admin credentials:

- **Email**: `admin@spa.com`
- **Password**: `Admin@123`

**⚠️ Important**: Change these credentials after first login!

## 🧪 Testing the Setup

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. Admin Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@spa.com",
    "password": "Admin@123"
  }'
```

### 3. Test Admin Dashboard
```bash
# Use the token from login response
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/v1/admin/dashboard
```

## 📁 Project Structure

```
spa-backend/
├── config/          # Database and app configuration
├── controllers/     # Business logic
├── middleware/      # Authentication and authorization
├── models/          # Database models
├── routes/          # API routes
├── scripts/         # Setup and utility scripts
├── uploads/         # File uploads (created by init)
├── logs/           # Application logs (created by init)
├── app.js          # Express app configuration
├── server.js       # Server entry point
└── .env            # Environment variables
```

 ## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run start        # Start server with nodemon

# Setup & Initialization
npm run init         # Complete initialization
npm run create-admin # Create admin user only
npm run setup        # Init + start dev server

# Production
npm run prod         # Start production server

# Testing & Quality
npm run test         # Run tests
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues

# Database
npm run seed         # Seed database with sample data
npm run migrate      # Run database migrations
npm run backup       # Create database backup
```

## 🚨 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```bash
# Check if MongoDB is running
# Windows: Check Services
# Mac/Linux: sudo systemctl status mongod

# Test connection
mongo mongodb://localhost:27017/spa-backend
```

**2. Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

**3. Permission Errors**
```bash
# Create directories manually if needed
mkdir -p uploads logs
chmod 755 uploads logs
```

**4. Environment Variables Not Loading**
```bash
# Check if .env file exists
ls -la .env

# Verify file format (no spaces around =)
cat .env
```

### Getting Help

1. Check the logs in `logs/app.log`
2. Review the `SECURITY_SETUP.md` for security configurations
3. Check the API documentation at `http://localhost:3000/api`

## 🔒 Security Next Steps

After successful setup:

1. **Change Default Passwords**
   - Admin password
   - Database passwords
   - JWT secret

2. **Configure Production Settings**
   - Update `NODE_ENV=production`
   - Set proper CORS origins
   - Configure rate limiting

3. **Set Up Monitoring**
   - Enable logging
   - Set up alerts
   - Configure backups

4. **Review Security Guide**
   - Read `SECURITY_SETUP.md`
   - Implement security best practices
   - Set up SSL/TLS

## 📚 Additional Resources

- [API Documentation](http://localhost:3000/api)
- [Security Setup Guide](./SECURITY_SETUP.md)
- [Postman Testing Guide](./POSTMAN_TESTING_GUIDE.md)
- [Booking Flow Documentation](./BOOKING_FLOW_API.md)

---

**🎉 Congratulations!** Your SPA Backend is now set up and ready to use.

**Next Steps:**
1. Explore the API endpoints
2. Set up your frontend application
3. Configure production settings
4. Set up monitoring and backups 