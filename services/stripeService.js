const stripe = require('stripe');

/**
 * Stripe Payment Service
 * Handles all Stripe payment operations including payment intents, confirmations, and webhooks
 */
class StripeService {
  constructor(config) {
    this.config = config;
    this.stripe = stripe(config.secretKey);
    this.baseUrl = config.environment === 'live' 
      ? 'https://api.stripe.com'
      : 'https://api.stripe.com'; // Stripe uses same URL for both test and live
  }

  /**
   * Create a payment intent
   * @param {Object} orderData - Order data for payment
   * @returns {Object} Payment intent details
   */
  async createOrder(orderData) {
    try {
      console.log('Stripe - Creating payment intent:', orderData);

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(orderData.amount * 100), // Convert to cents
        currency: orderData.currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: orderData.orderId,
          customerEmail: orderData.customerEmail,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          description: orderData.description,
        },
        receipt_email: orderData.customerEmail,
        description: orderData.description,
      });

      console.log('Stripe - Payment intent created successfully:', paymentIntent.id);

      return {
        success: true,
        orderId: orderData.orderId,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: orderData.amount,
        currency: orderData.currency,
        paymentUrl: `${orderData.returnUrl}?payment_intent=${paymentIntent.id}&payment_intent_client_secret=${paymentIntent.client_secret}`,
        transactionId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe - Error creating payment intent:', error);
      throw new Error(`Failed to create Stripe payment intent: ${error.message}`);
    }
  }

  /**
   * Create a payment intent (compatibility method for PaymentService)
   * @param {number} amount - Payment amount
   * @param {string} currency - Currency code
   * @param {Object} metadata - Payment metadata
   * @returns {Object} Payment intent details
   */
  async createPaymentIntent(amount, currency, metadata) {
    return this.createOrder({
      amount,
      currency,
      orderId: metadata.orderId,
      customerEmail: metadata.customerEmail,
      customerName: metadata.customerName,
      customerPhone: metadata.customerPhone,
      description: metadata.description,
      returnUrl: metadata.returnUrl,
      cancelUrl: metadata.cancelUrl,
      notifyUrl: metadata.notifyUrl
    });
  }

  /**
   * Verify payment status
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Object} Payment verification result
   */
  async verifyPayment(paymentIntentId) {
    try {
      console.log('Stripe - Verifying payment:', paymentIntentId);

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      console.log('Stripe - Payment verification result:', paymentIntent.status);

      return {
        success: true,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        transactionId: paymentIntent.id,
        paymentMethod: paymentIntent.payment_method,
        charges: paymentIntent.charges?.data || []
      };
    } catch (error) {
      console.error('Stripe - Error verifying payment:', error);
      throw new Error(`Failed to verify Stripe payment: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {string} chargeId - Stripe charge ID (optional, will use latest charge)
   * @param {number} amount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {Object} Refund result
   */
  async refundPayment(paymentIntentId, chargeId, amount, reason = 'requested_by_customer') {
    try {
      console.log('Stripe - Processing refund:', { paymentIntentId, amount, reason });

      // If no chargeId provided, get it from payment intent
      if (!chargeId) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        if (!paymentIntent.charges?.data?.length) {
          throw new Error('No charges found for this payment intent');
        }
        chargeId = paymentIntent.charges.data[0].id;
      }

      const refund = await this.stripe.refunds.create({
        charge: chargeId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents, undefined for full refund
        reason: reason,
        metadata: {
          original_payment_intent: paymentIntentId,
          refund_reason: reason
        }
      });

      console.log('Stripe - Refund processed successfully:', refund.id);

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        refundAmount: refund.amount / 100, // Convert from cents
        currency: refund.currency.toUpperCase(),
        transactionId: refund.charge,
        reason: refund.reason
      };
    } catch (error) {
      console.error('Stripe - Error processing refund:', error);
      throw new Error(`Failed to process Stripe refund: ${error.message}`);
    }
  }

  /**
   * Process Stripe webhook
   * @param {Object} webhookData - Webhook payload
   * @param {string} signature - Stripe signature header
   * @returns {Object} Webhook processing result
   */
  async processWebhook(webhookData, signature) {
    try {
      console.log('Stripe - Processing webhook event');

      let event;

      if (this.config.webhookSecret) {
        // Verify webhook signature
        event = this.stripe.webhooks.constructEvent(
          webhookData,
          signature,
          this.config.webhookSecret
        );
      } else {
        // For testing without webhook signature verification
        event = webhookData;
      }

      console.log('Stripe - Webhook event type:', event.type);

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentSucceeded(event.data.object);
        case 'payment_intent.payment_failed':
          return this.handlePaymentFailed(event.data.object);
        case 'payment_intent.canceled':
          return this.handlePaymentCanceled(event.data.object);
        case 'charge.dispute.created':
          return this.handleChargeDispute(event.data.object);
        default:
          console.log('Stripe - Unhandled event type:', event.type);
          return {
            success: true,
            message: `Unhandled event type: ${event.type}`
          };
      }
    } catch (error) {
      console.error('Stripe - Webhook processing error:', error);
      throw new Error(`Failed to process Stripe webhook: ${error.message}`);
    }
  }

  /**
   * Handle successful payment webhook
   * @param {Object} paymentIntent - Stripe payment intent object
   * @returns {Object} Processing result
   */
  handlePaymentSucceeded(paymentIntent) {
    return {
      success: true,
      orderId: paymentIntent.metadata.orderId,
      transactionId: paymentIntent.id,
      status: 'SUCCESS',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      paymentMethod: paymentIntent.payment_method,
      event: 'payment_succeeded'
    };
  }

  /**
   * Handle failed payment webhook
   * @param {Object} paymentIntent - Stripe payment intent object
   * @returns {Object} Processing result
   */
  handlePaymentFailed(paymentIntent) {
    return {
      success: false,
      orderId: paymentIntent.metadata.orderId,
      transactionId: paymentIntent.id,
      status: 'FAILED',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      error: paymentIntent.last_payment_error,
      event: 'payment_failed'
    };
  }

  /**
   * Handle canceled payment webhook
   * @param {Object} paymentIntent - Stripe payment intent object
   * @returns {Object} Processing result
   */
  handlePaymentCanceled(paymentIntent) {
    return {
      success: false,
      orderId: paymentIntent.metadata.orderId,
      transactionId: paymentIntent.id,
      status: 'CANCELED',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      event: 'payment_canceled'
    };
  }

  /**
   * Handle charge dispute webhook
   * @param {Object} dispute - Stripe dispute object
   * @returns {Object} Processing result
   */
  handleChargeDispute(dispute) {
    return {
      success: true,
      disputeId: dispute.id,
      chargeId: dispute.charge,
      status: 'DISPUTED',
      amount: dispute.amount / 100,
      currency: dispute.currency.toUpperCase(),
      reason: dispute.reason,
      event: 'charge_disputed'
    };
  }

  /**
   * Map Stripe status to our standard status
   * @param {string} stripeStatus - Stripe payment intent status
   * @returns {string} Mapped status
   */
  mapStripeStatus(stripeStatus) {
    const statusMap = {
      'requires_payment_method': 'PENDING',
      'requires_confirmation': 'PENDING',
      'requires_action': 'PENDING',
      'processing': 'PROCESSING',
      'requires_capture': 'AUTHORIZED',
      'succeeded': 'SUCCESS',
      'canceled': 'CANCELED'
    };

    return statusMap[stripeStatus] || 'UNKNOWN';
  }

  /**
   * Confirm payment with test card (for test environment)
   * @param {string} paymentIntentId - Payment intent ID to confirm
   * @returns {Object} Confirmed payment intent
   */
  async confirmPaymentWithTestCard(paymentIntentId) {
    try {
      console.log('Stripe - Confirming payment with test card:', paymentIntentId);

      // First, let's try to confirm with the automatic confirmation
      // For test mode, we can confirm directly since we control the payment intent
      const confirmedPayment = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: 'pm_card_visa', // Stripe's test payment method
        return_url: 'https://example.com/return',
      });

      console.log('Stripe - Payment confirmed successfully:', confirmedPayment.id);

      return {
        success: true,
        paymentIntent: confirmedPayment,
        status: this.mapStripeStatus(confirmedPayment.status),
        id: confirmedPayment.id,
        amount: confirmedPayment.amount / 100, // Convert from cents
        currency: confirmedPayment.currency.toUpperCase(),
      };

    } catch (error) {
      console.error('Stripe - Error confirming payment with test card:', error);
      throw new Error(`Stripe payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Get supported currencies for Stripe
   * @returns {Array} List of supported currencies
   */
  getSupportedCurrencies() {
    return [
      'AED', 'USD', 'EUR', 'GBP', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR',
      'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK',
      'HUF', 'RON', 'BGN', 'HRK', 'TRY', 'ILS', 'ZAR', 'SGD', 'HKD',
      'NZD', 'MXN', 'BRL', 'INR', 'THB', 'MYR', 'PHP', 'IDR', 'VND'
    ];
  }

  /**
   * Get supported payment methods for Stripe
   * @returns {Array} List of supported payment methods
   */
  getSupportedPaymentMethods() {
    return [
      'card',
      'apple_pay',
      'google_pay',
      'link',
      'paypal',
      'bank_transfer',
      'digital_wallet'
    ];
  }
}

module.exports = StripeService;
