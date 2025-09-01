const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Employee = require('./models/Employee');
const Booking = require('./models/Booking');
const Service = require('./models/Service');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URI || 'mongodb://localhost:27017/spa_management')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testReviewsAPI() {
  try {
    console.log('\n🔍 Testing Reviews API Integration...\n');

    // Find an employee user for testing
    const employeeUser = await User.findOne({ role: 'employee' });
    if (!employeeUser) {
      console.log('❌ No employee user found. Please create an employee user first.');
      return;
    }

    console.log(`📋 Testing with employee: ${employeeUser.firstName} ${employeeUser.lastName} (${employeeUser.email})`);

    // Get employee record
    const employee = await Employee.findOne({ user: employeeUser._id });
    if (!employee) {
      console.log('❌ No employee record found for this user.');
      return;
    }

    console.log(`👤 Employee ID: ${employee.employeeId}, Position: ${employee.position}`);

    // Find bookings for this employee with feedback
    const bookingsWithFeedback = await Booking.find({
      'services.employee': employee._id,
      'feedback.rating': { $exists: true, $ne: null }
    })
    .populate({
      path: 'client',
      select: 'firstName lastName'
    })
    .populate('services.service', 'name')
    .sort({ 'feedback.submittedAt': -1 })
    .limit(10);

    console.log(`\n📊 Found ${bookingsWithFeedback.length} bookings with feedback:`);

    if (bookingsWithFeedback.length === 0) {
      console.log('ℹ️  No feedback found. This is normal if no clients have left reviews yet.');
      
      // Show sample data structure
      console.log('\n📝 Expected API Response Structure:');
      console.log(JSON.stringify({
        success: true,
        data: {
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            position: employee.position
          },
          ratings: {
            average: 0,
            total: 0,
            breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          },
          recentFeedback: []
        }
      }, null, 2));

    } else {
      // Calculate ratings
      const ratings = bookingsWithFeedback.map(booking => booking.feedback.rating);
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      
      ratings.forEach(rating => {
        breakdown[rating]++;
      });

      // Format feedback
      const formattedFeedback = bookingsWithFeedback.map(booking => ({
        _id: booking._id,
        rating: booking.feedback.rating,
        comment: booking.feedback.comment,
        submittedAt: booking.feedback.submittedAt,
        wouldRecommend: booking.feedback.wouldRecommend,
        service: booking.services[0]?.service?.name || 'Unknown Service',
        appointmentDate: booking.appointmentDate,
        client: {
          firstName: booking.client?.firstName || 'Anonymous',
          lastName: booking.client?.lastName || 'Client'
        }
      }));

      console.log('\n⭐ Rating Summary:');
      console.log(`   Average: ${averageRating.toFixed(2)}/5`);
      console.log(`   Total Reviews: ${ratings.length}`);
      console.log(`   Breakdown: 5★(${breakdown[5]}) 4★(${breakdown[4]}) 3★(${breakdown[3]}) 2★(${breakdown[2]}) 1★(${breakdown[1]})`);

      console.log('\n💬 Recent Feedback:');
      formattedFeedback.slice(0, 3).forEach((feedback, index) => {
        console.log(`   ${index + 1}. ${feedback.client.firstName} ${feedback.client.lastName} - ${feedback.rating}★`);
        console.log(`      "${feedback.comment}"`);
        console.log(`      Service: ${feedback.service} | ${new Date(feedback.submittedAt).toLocaleDateString()}`);
        console.log('');
      });

      console.log('\n📝 Full API Response Structure:');
      console.log(JSON.stringify({
        success: true,
        data: {
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            position: employee.position
          },
          ratings: {
            average: Math.round(averageRating * 100) / 100,
            total: ratings.length,
            breakdown
          },
          recentFeedback: formattedFeedback.slice(0, 5)
        }
      }, null, 2));
    }

    console.log('\n✅ Reviews API test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing reviews API:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testReviewsAPI();
