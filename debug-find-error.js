console.log('=== Debugging Route Files ===');

// Test each controller individually
console.log('\n1. Testing authController...');
try {
  const authController = require('./controllers/authController');
  console.log('✓ authController loaded successfully');
  console.log('Available functions:', Object.keys(authController));
} catch (err) {
  console.log('✗ authController error:', err.message);
}

console.log('\n2. Testing employeeController...');
try {
  const employeeController = require('./controllers/employeeController');
  console.log('✓ employeeController loaded successfully');
  console.log('Available functions:', Object.keys(employeeController));
} catch (err) {
  console.log('✗ employeeController error:', err.message);
}

console.log('\n3. Testing bookingController...');
try {
  const bookingController = require('./controllers/bookingController');
  console.log('✓ bookingController loaded successfully');
  console.log('Available functions:', Object.keys(bookingController));
} catch (err) {
  console.log('✗ bookingController error:', err.message);
}

console.log('\n4. Testing authMiddleware...');
try {
  const authMiddleware = require('./middleware/authMiddleware');
  console.log('✓ authMiddleware loaded successfully');
  console.log('Available functions:', Object.keys(authMiddleware));
} catch (err) {
  console.log('✗ authMiddleware error:', err.message);
}

console.log('\n5. Testing route files individually...');

// Test auth routes
console.log('\n5a. Testing authRoutes...');
try {
  require('./routes/authRoutes');
  console.log('✓ authRoutes loaded successfully');
} catch (err) {
  console.log('✗ authRoutes error:', err.message);
}

// Test employee routes
console.log('\n5b. Testing employeeRoutes...');
try {
  require('./routes/employeeRoutes');
  console.log('✓ employeeRoutes loaded successfully');
} catch (err) {
  console.log('✗ employeeRoutes error:', err.message);
}

// Test booking routes
console.log('\n5c. Testing bookingRoutes...');
try {
  require('./routes/bookingRoutes');
  console.log('✓ bookingRoutes loaded successfully');
} catch (err) {
  console.log('✗ bookingRoutes error:', err.message);
}

console.log('\n=== Debug Complete ===');