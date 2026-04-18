const Membership = require('../models/Membership');
const GiftCard = require('../models/GiftCard');

class BookingBenefitResolver {
  /**
   * Find eligible memberships for a client and set of services
   */
  async resolveBenefits(clientId, services) {
    if (!clientId) return { memberships: [], giftCard: null };

    // Find all active memberships for the client
    const clientMemberships = await Membership.find({
      client: clientId,
      status: { $in: ['Active', 'Partially Used', 'active', 'partially used'] },
      isExpired: false
    }).populate('services');

    const applicableMemberships = [];
    
    for (const membership of clientMemberships) {
      // Check if membership has remaining sessions
      const remainingSessions = membership.numberOfSessions - membership.usedSessions;
      if (remainingSessions <= 0) continue;

      // Collect eligible service IDs and names
      let eligibleServiceIds = [];
      let eligibleServiceNames = [];
      
      if (Array.isArray(membership.services)) {
        eligibleServiceIds = membership.services.map(s => String(s._id));
        eligibleServiceNames = membership.services.map(s => s.name);
      }
      
      // Check which of the requested services match
      const matchedServices = services.filter(svc => {
        const svcId = String(svc.serviceId || svc.service || svc._id);
        const svcName = svc.serviceName || '';
        return eligibleServiceIds.includes(svcId) || eligibleServiceNames.includes(svcName);
      });

      if (matchedServices.length > 0) {
        applicableMemberships.push({
          membershipId: membership._id,
          name: membership.name,
          remainingSessions,
          totalSessions: membership.numberOfSessions,
          matchedServiceIds: matchedServices.map(svc => String(svc.serviceId || svc.service || svc._id))
        });
      }
    }

    return {
      memberships: applicableMemberships
    };
  }

  /**
   * Resolve gift card balance
   */
  async resolveGiftCard(code) {
    if (!code) return null;

    const giftCard = await GiftCard.findOne({ 
      code: code.toUpperCase(),
      status: 'Active'
    });

    if (!giftCard || giftCard.balance <= 0) return null;

    return {
      code: giftCard.code,
      balance: giftCard.balance,
      id: giftCard._id
    };
  }
}

module.exports = new BookingBenefitResolver();
