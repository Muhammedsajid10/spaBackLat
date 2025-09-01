const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { protect } = require('../middleware/authMiddleware');

console.log('🎯 Membership routes loaded');

 
router.use(protect);


router.get('/test', (req, res) => {
  res.json({ message: 'Membership routes working!' });
});


router.get('/templates', membershipController.getAllMembershipTemplates);


router.get('/purchased', membershipController.getAllPurchasedMemberships);

// Purchase (assign) a membership to a client from a template
router.post('/purchase', membershipController.purchaseMembership);

router.post('/template', membershipController.createMembershipTemplate);


router.patch('/:id', membershipController.updateMembership);


router.delete('/:id', membershipController.deleteMembership);

module.exports = router;
