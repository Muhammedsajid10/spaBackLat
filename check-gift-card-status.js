require('dotenv').config();
const mongoose = require('mongoose');
const GiftCard = require('./models/GiftCard');

async function checkGiftCards() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all gift cards with usage history
    const recentCards = await GiftCard.find({
      usageHistory: { $exists: true, $ne: [] }
    }).sort({ purchaseDate: -1 }).limit(20);

    console.log(`\n📊 Found ${recentCards.length} gift cards with usage history:\n`);

    for (const card of recentCards) {
      const usageCount = card.usageHistory?.length || 0;
      const totalUsed = card.usageHistory?.reduce((sum, h) => sum + (h.amountUsed || 0), 0) || 0;
      
      console.log('━'.repeat(60));
      console.log(`Code: ${card.code}`);
      console.log(`Status: ${card.status} (backend)`);
      console.log(`Value: AED ${card.value}`);
      console.log(`Remaining Value: AED ${card.remainingValue} (raw: ${JSON.stringify(card.remainingValue)})`);
      console.log(`Used: AED ${totalUsed} (${usageCount} transactions)`);
      console.log(`Calculated Remaining: AED ${(card.value - totalUsed).toFixed(2)}`);
      console.log(`Should be "Used"?: ${card.remainingValue < 0.01 ? 'YES ✅' : 'NO ❌'}`);
      console.log(`Exact remainingValue check: ${card.remainingValue} < 0.01 = ${card.remainingValue < 0.01}`);
      
      if (card.remainingValue > 0 && card.remainingValue < 0.01) {
        console.log(`\n⚠️  FOUND FLOATING POINT ISSUE: ${card.remainingValue}`);
        console.log(`   Fixing by setting to 0 and status to "Used"...`);
        card.remainingValue = 0;
        card.status = 'Used';
        await card.save();
        console.log(`   ✅ Fixed!`);
      }

      if (usageCount > 0) {
        console.log(`\nUsage History:`);
        card.usageHistory.slice(-3).forEach((h, i) => {
          console.log(`  ${i + 1}. Used: AED ${h.amountUsed} - ${h.notes || 'No notes'}`);
        });
      }
    }

    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkGiftCards();
