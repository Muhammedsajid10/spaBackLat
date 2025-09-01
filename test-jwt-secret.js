const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('ENV JWT_SECRET:', process.env.JWT_SECRET);

// Test creating and verifying a token
const testId = '6868b74756b1e35ba8f8e0f9';

// Create a new token
const newToken = jwt.sign({ id: testId }, process.env.JWT_SECRET, {
  expiresIn: '1d'
});

console.log('New token:', newToken);

// Try to verify the new token
try {
  const decoded = jwt.verify(newToken, process.env.JWT_SECRET);
  console.log('New token verified successfully:', decoded);
} catch (error) {
  console.log('New token verification failed:', error.message);
}

// Test the problematic token
const problemToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NjhiNzQ3NTZiMWUzNWJhOGY4ZTBmOSIsImlhdCI6MTc1MzM2OTU3OCwiZXhwIjoxNzYxMTQ1NTc4fQ.O7AICYCJkrl04l7a6PZuSW-Q3btb29yyYBsYXTiWD0D0";

try {
  const decoded = jwt.verify(problemToken, process.env.JWT_SECRET);
  console.log('Problem token verified successfully:', decoded);
} catch (error) {
  console.log('Problem token verification failed:', error.message);
}
