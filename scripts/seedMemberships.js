const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Membership = require('../models/Membership');
const User = require('../models/User');

dotenv.config();

async function seedMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Fetch up to 5 clients
    const clients = await User.find({ role: 'client' }).limit(5);
    if (clients.length === 0) {
      console.error('No clients found. Please seed users first.');
      process.exit(1);
    }

    const membershipTypes = ['One-time', 'Recurring'];
    const statuses = ['Active', 'Used', 'Expired'];
    const names = [
      'W residence',
      'Kempensiki',
      'lymphatic package',
      'Anti Cellulite',
      'Wellness Gold'
    ];

    const now = new Date();
    const memberships = clients.map((client, i) => {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, now.getDate());
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      return {
        name: names[i % names.length],
        client: client._id,
        type: membershipTypes[i % membershipTypes.length],
        startDate,
        endDate,
        status: statuses[i % statuses.length],
        totalCharged: 1000 + i * 200
      };
    });

    await Membership.deleteMany({});
    const created = await Membership.insertMany(memberships);
    console.log('Seeded memberships:', created);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding memberships:', err);
    process.exit(1);
  }
}

seedMemberships(); 