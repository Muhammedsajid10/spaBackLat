const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAdminOnly } = require('../middleware/roleMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/categories', categoryController.getCategories);

// Protected routes (require authentication)
router.use(protect);

// Admin-only routes
router.post('/categories', isAdminOnly, categoryController.createCategory);

// Delete category (admin only) - with extensive debugging
router.delete('/categories/:id', (req, res, next) => {
  console.log('🔄 DELETE /categories/:id route hit, ID:', req.params.id);
  console.log('🔍 User exists:', !!req.user);
  console.log('🔍 User role:', req.user?.role);
  console.log('🔍 User email:', req.user?.email);
  console.log('🔍 Headers:', req.headers.authorization);
  next();
}, isAdminOnly, (req, res, next) => {
  console.log('✅ Passed admin check, calling controller');
  next();
}, categoryController.deleteCategory);

module.exports = router; 