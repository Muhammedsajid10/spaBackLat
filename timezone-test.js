// Timezone conversion test
console.log('🌍 TIMEZONE CONVERSION TEST\n');

// Test: What time does 4:40 PM IST become in UTC?
const userTime = new Date('2025-09-04T16:40:00+05:30'); // 4:40 PM IST
console.log('User selects 4:40 PM IST:');
console.log('  Local:', userTime.toString());
console.log('  UTC ISO:', userTime.toISOString());
console.log('  Hours UTC:', userTime.getUTCHours());
console.log('  Hours Local:', userTime.getHours());

console.log('\n---\n');

// Test: What happens when we read UTC time back as local?
const storedUTC = '2025-09-04T04:00:00.000Z'; // From database
const readBack = new Date(storedUTC);
console.log('Database stores UTC:', storedUTC);
console.log('When read back:');
console.log('  Local:', readBack.toString());
console.log('  Hours Local:', readBack.getHours());
console.log('  Minutes Local:', readBack.getMinutes());

console.log('\n---\n');

// Test: Current booking in database
const dbTime = '2025-09-04T04:00:00.000Z';
const dbParsed = new Date(dbTime);
console.log('Current booking in DB:', dbTime);
console.log('Displays as:', dbParsed.toString());
console.log('Hours:', dbParsed.getHours(), 'Minutes:', dbParsed.getMinutes());

// What time was originally selected to get 4:00 UTC?
const originalUTC = new Date('2025-09-04T04:00:00.000Z');
console.log('Original UTC time 04:00 was selected as local time:', originalUTC.getHours() + ':' + originalUTC.getMinutes().toString().padStart(2, '0'));

console.log('\n🔍 DIAGNOSIS:');
console.log('If user selected 4:40 PM (16:40) local time...');
const userIntent = new Date('2025-09-04T16:40:00'); // User's local time without timezone
console.log('  User intent (local):', userIntent.toString());
console.log('  Stored as UTC:', userIntent.toISOString());
console.log('  When read back shows:', new Date(userIntent.toISOString()).toString());
