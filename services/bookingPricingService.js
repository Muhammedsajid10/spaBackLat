/**
 * Service to handle booking pricing logic
 */
class BookingPricingService {
  /**
   * Calculate subtotal and final pricing
   * @param {Array} transformedServices - Services that already have individual prices determined
   * @param {Object} options - { customDiscount, membershipDiscount, giftCardAmount }
   */
  calculateFinalPricing(transformedServices, options = {}) {
    const subtotal = transformedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    const { 
      customDiscount = 0, 
      membershipDiscount = 0, 
      giftCardAmount = 0 
    } = options;

    const finalAmount = Math.max(0, subtotal - customDiscount - membershipDiscount - giftCardAmount);

    return {
      subtotal,
      manualDiscount: customDiscount,
      membershipDiscount,
      giftCardAmount,
      finalAmount
    };
  }

  /**
   * Determine price for an individual service entry
   */
  getServicePrice(serviceDoc, rawInput = {}) {
    const basePrice = serviceDoc.price;
    const customPrice = rawInput.customPrice;
    
    const finalPrice = customPrice !== undefined && customPrice !== null
      ? Math.max(0, Number(customPrice))
      : basePrice;

    return {
      basePrice,
      finalPrice,
      isCustom: customPrice !== undefined && customPrice !== null,
      discount: Math.max(0, basePrice - finalPrice)
    };
  }
}

module.exports = new BookingPricingService();
