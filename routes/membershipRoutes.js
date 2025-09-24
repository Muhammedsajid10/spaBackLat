const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

console.log('🎯 Membership routes loaded');

 
// Use optional auth for debugging - allows requests with or without token
router.use(optionalAuth);


router.get('/test', (req, res) => {
  res.json({ message: 'Membership routes working!' });
});


router.get('/templates', membershipController.getAllMembershipTemplates);


router.get('/purchased', membershipController.getAllPurchasedMemberships);

// Purchase (assign) a membership to a client from a template
router.post('/purchase', membershipController.purchaseMembership);

router.post('/template', membershipController.createMembershipTemplate);

// User-side routes for membership functionality
router.get('/my-memberships/:userId', membershipController.getUserMemberships);
router.get('/check-service/:serviceId', membershipController.checkMembershipForService);
router.post('/:membershipId/use-session', membershipController.useMembershipSession);

router.patch('/:id', membershipController.updateMembership);

router.delete('/:id', membershipController.deleteMembership);

module.exports = router;
