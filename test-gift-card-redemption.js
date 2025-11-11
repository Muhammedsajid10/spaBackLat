/**
 * Test script to verify gift card redemption flow
 * Run with: node test-gift-card-redemption.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const GiftCard = require('./models/GiftCard');

async function testGiftCardRedemption() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all gift cards
    const allCards = await GiftCard.find({ isTemplate: false })
      .populate('purchasedBy', 'firstName lastName email')
      .sort({ purchaseDate: -1 })
      .limit(10);

    console.log(`📊 Found ${allCards.length} gift cards\n`);
    console.log('=' .repeat(80));

    allCards.forEach((card, index) => {
      console.log(`\n${index + 1}. Gift Card: ${card.code}`);
      console.log(`   Status: ${card.status}`);
      console.log(`   Original Value: AED ${card.value}`);
      console.log(`   Remaining Value: AED ${card.remainingValue}`);
      console.log(`   Purchased By: ${card.purchasedBy?.firstName} ${card.purchasedBy?.lastName} (${card.purchasedBy?.email})`);
      console.log(`   Purchase Date: ${card.purchaseDate}`);
      console.log(`   Expiry Date: ${card.expiryDate}`);
      console.log(`   Is Expired: ${card.isExpired}`);
      console.log(`   Usage History: ${card.usageHistory?.length || 0} transactions`);
      
      if (card.usageHistory && card.usageHistory.length > 0) {
        console.log(`   Last Used: ${card.usageHistory[card.usageHistory.length - 1].usedAt}`);
        console.log(`   Total Used: AED ${card.value - card.remainingValue}`);
      }
      
      // Check if card should be visible in client list
      const shouldBeVisible = card.remainingValue > 0 && 
                             ['active', 'partially used'].includes(card.status?.toLowerCase()) &&
                             !card.isExpired;
      console.log(`   Should be visible to client: ${shouldBeVisible ? '✅ YES' : '❌ NO'}`);
      
      console.log('   ' + '-'.repeat(76));
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📈 SUMMARY:');
    
    const activeCards = allCards.filter(c => c.status?.toLowerCase() === 'active' && c.remainingValue > 0);
    const partiallyUsedCards = allCards.filter(c => c.status?.toLowerCase() === 'partially used' && c.remainingValue > 0);
    const fullyUsedCards = allCards.filter(c => c.remainingValue === 0 || c.status?.toLowerCase() === 'used');
    const expiredCards = allCards.filter(c => c.isExpired);

    console.log(`   Active Cards (with balance): ${activeCards.length}`);
    console.log(`   Partially Used Cards (with balance): ${partiallyUsedCards.length}`);
    console.log(`   Fully Used Cards: ${fullyUsedCards.length}`);
    console.log(`   Expired Cards: ${expiredCards.length}`);
    console.log(`\n   Total cards that should be available: ${activeCards.length + partiallyUsedCards.length}`);
    console.log(`   Total cards that should be hidden: ${fullyUsedCards.length + expiredCards.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testGiftCardRedemption();
