const express = require('express');
const router = express.Router();
const giftCardController = require('../controllers/giftCardController');
const { protect } = require('../middleware/authMiddleware');

console.log('🎁 Gift Card routes loaded');

router.use(protect);

router.get('/validate/:code', giftCardController.validateGiftCard);
router.get('/templates', giftCardController.getAllGiftCardTemplates);
router.post('/template', giftCardController.createGiftCardTemplate);
router.post('/purchase', giftCardController.purchaseGiftCard);
router.get('/purchased', giftCardController.getAllPurchasedGiftCards);
router.get('/code/:code', giftCardController.getGiftCardByCode);
router.patch('/use/:code', giftCardController.useGiftCard);
router.patch('/:id', giftCardController.updateGiftCard);
router.delete('/:id', giftCardController.deleteGiftCard);
router.patch('/:id/cancel', giftCardController.cancelGiftCard);
router.get('/admin/stats', giftCardController.getGiftCardStats);

module.exports = router;
