const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NjhiNzQ3NTZiMWUzNWJhOGY4ZTBmOSIsImlhdCI6MTc1MzM2OTg4MywiZXhwIjoxNzYxMTQ1ODgzfQ.qapNnrhTAuLpoa6UE2naHejQEUBh24ffwFKq82pbuuns";

console.log('JWT_SECRET from env:', process.env.JWT_SECRET ? 'Set' : 'Not set');

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token decoded successfully:', decoded);
  console.log('Token expires at:', new Date(decoded.exp * 1000));
  console.log('Current time:', new Date());
} catch (error) {
  console.log('Token verification failed:', error.message);
}

// Also try to decode without verification to see the payload
try {
  const decodedPayload = jwt.decode(token);
  console.log('Token payload:', decodedPayload);
} catch (error) {
  console.log('Token decode failed:', error.message);
}
