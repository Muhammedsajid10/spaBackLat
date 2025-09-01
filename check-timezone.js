// Check timezone and current date
const dotenv = require('dotenv');
dotenv.config();

console.log('🌍 Server Timezone Info:');
console.log('  Current Date/Time:', new Date());
console.log('  Timezone Offset (minutes):', new Date().getTimezoneOffset());
console.log('  UTC Date/Time:', new Date().toISOString());

const today = new Date();
today.setHours(0, 0, 0, 0);
console.log('\n📅 Backend "today" logic:');
console.log('  Original date:', new Date());
console.log('  After setHours(0,0,0,0):', today);
console.log('  ISO String:', today.toISOString());

// Correct way to get today in UTC
const todayUTC = new Date();
const correctToday = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()));
console.log('\n✅ Correct "today" UTC:');
console.log('  UTC Today:', correctToday);
console.log('  ISO String:', correctToday.toISOString());

// Show what should be used for date comparison
console.log('\n🔧 Recommended fix:');
console.log('  Use UTC date for consistent comparisons across timezones');
console.log('  Current method creates timezone-dependent dates');
