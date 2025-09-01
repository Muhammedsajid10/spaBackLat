const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const StripeService = require('./stripeService');

// Base Payment Gateway Class
class BasePaymentGateway {
  constructor(config) {
    this.config = config;
  }

  async createPaymentIntent(amount, currency, metadata) {
    throw new Error('createPaymentIntent must be implemented by subclass');
  }

  async confirmPayment(paymentIntentId) {
    throw new Error('confirmPayment must be implemented by subclass');
  }

  async refundPayment(paymentIntentId, amount) {
    throw new Error('refundPayment must be implemented by subclass');
  }

  async getPaymentStatus(paymentIntentId) {
    throw new Error('getPaymentStatus must be implemented by subclass');
  }
}

// Stripe Payment Gateway Implementation
class StripeGateway extends BasePaymentGateway {
  constructor(config) {
    super(config);
    this.stripeService = new StripeService(config);
  }

  async createPaymentIntent(amount, currency, metadata) {
    try {
      const orderData = {
        orderId: metadata.orderId || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        currency: currency,
        customerEmail: metadata.customerEmail,
        customerName: metadata.customerName,
        customerPhone: metadata.customerPhone,
        description: metadata.description || 'SPA Booking Payment',
        returnUrl: metadata.returnUrl,
        cancelUrl: metadata.cancelUrl,
        notifyUrl: metadata.notifyUrl
      };

      const result = await this.stripeService.createOrder(orderData);

      return {
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        status: result.status,
        paymentUrl: result.paymentUrl,
        transactionId: result.transactionId
      };
    } catch (error) {
      throw new Error(`Stripe payment creation failed: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      // For Stripe, we verify the payment status
      const result = await this.stripeService.verifyPayment(paymentIntentId);
      
      return {
        status: result.status,
        amount: result.amount,
        currency: result.currency,
        transactionId: result.transactionId
      };
    } catch (error) {
      throw new Error(`Stripe payment confirmation failed: ${error.message}`);
    }
  }

  async refundPayment(paymentIntentId, amount) {
    try {
      const result = await this.stripeService.refundPayment(paymentIntentId, null, amount);
      
      return {
        refundId: result.refundId,
        status: result.status,
        amount: result.refundAmount
      };
    } catch (error) {
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentIntentId) {
    try {
      const result = await this.stripeService.verifyPayment(paymentIntentId);
      return result.status;
    } catch (error) {
      throw new Error(`Stripe status check failed: ${error.message}`);
    }
  }
}

// Mock Payment Gateway for Testing
class MockPaymentGateway extends BasePaymentGateway {
  constructor(config) {
    super(config);
  }

  async createPaymentIntent(amount, currency, metadata) {
    // Simulate payment creation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const orderId = metadata.orderId || `MOCK_ORDER_${Date.now()}`;
    
    return {
      paymentIntentId: orderId,
      clientSecret: `mock_secret_${Date.now()}`,
      status: 'pending',
      paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?paymentId=${orderId}&status=success`,
      transactionId: `MOCK_TXN_${Date.now()}`
    };
  }

  async confirmPayment(orderId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      status: 'completed',
      amount: 100,
      currency: 'AED',
      transactionId: orderId
    };
  }

  async refundPayment(orderId, amount) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      refundId: `MOCK_REFUND_${Date.now()}`,
      status: 'completed',
      amount: amount
    };
  }

  async getPaymentStatus(orderId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return 'completed';
  }
}

// Payment Service Factory
class PaymentService {
  constructor() {
    this.gateways = new Map();
    this.initializeGateways();
  }

  initializeGateways() {
    // Initialize Stripe
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    const looksValidStripeKeys = secretKey && publishableKey && /^sk_(test|live)_/.test(secretKey) && /^pk_(test|live)_/.test(publishableKey) && !/your_secret_key/i.test(secretKey);
    if (looksValidStripeKeys) {
      this.gateways.set('stripe', new StripeGateway({
        publishableKey,
        secretKey,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        environment: process.env.STRIPE_ENVIRONMENT || 'test',
        currency: process.env.STRIPE_CURRENCY || 'AED'
      }));
      console.log('Stripe gateway initialized with real credentials');
    } else {
      // Use mock gateway for testing
      this.gateways.set('stripe', new MockPaymentGateway({
        environment: 'test',
        currency: 'AED'
      }));
      console.log('Mock payment gateway initialized for testing (Stripe credentials not configured or invalid)');
    }
    
  // Removed legacy network_international gateway (Stripe only now)
  }

  getGateway(gatewayName) {
    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      throw new Error(`Payment gateway '${gatewayName}' is not configured`);
    }
    return gateway;
  }

  async createPayment(bookingId, userId, amount, currency, paymentMethod, gatewayName, extraMetadata = {}) {
    try {
      // Validate booking
      const booking = await Booking.findById(bookingId).populate('client', 'firstName lastName email phone');
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Create payment record
      const payment = new Payment({
        booking: bookingId,
        user: userId,
        amount: Math.round(amount * 100), // Store in cents
        currency: currency.toUpperCase(),
        paymentMethod,
        paymentGateway: gatewayName,
        status: 'pending',
        metadata: Object.keys(extraMetadata).length ? extraMetadata : undefined
      });

      // Get payment gateway
      const gateway = this.getGateway(gatewayName);

      // Create payment intent
      const paymentIntent = await gateway.createPaymentIntent(
        amount,
        currency,
        {
          orderId: `ORDER_${bookingId}_${Date.now()}`,
          customerEmail: booking.client.email,
          customerName: `${booking.client.firstName} ${booking.client.lastName}`,
          customerPhone: booking.client.phone,
          description: `SPA Booking - ${booking.services[0]?.service?.name || 'Service'}`,
          returnUrl: `${process.env.FRONTEND_URL}/payment/success?paymentId=${payment._id}`,
          cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel?paymentId=${payment._id}`,
          notifyUrl: `${process.env.BACKEND_URL}/api/v1/payments/webhook/stripe`,
          ...extraMetadata
        }
      );

      // Update payment record
      payment.paymentIntent = paymentIntent.paymentIntentId;
      payment.clientSecret = paymentIntent.clientSecret;
      payment.paymentUrl = paymentIntent.paymentUrl;
      payment.gatewayResponse = paymentIntent;

      await payment.save();

      return {
        success: true,
        paymentId: payment._id,
        paymentIntent: paymentIntent.paymentIntentId,
        clientSecret: paymentIntent.clientSecret,
        paymentUrl: paymentIntent.paymentUrl,
        status: paymentIntent.status,
        metadata: payment.metadata
      };
    } catch (error) {
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

  async confirmPayment(paymentId, gatewayName) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const gateway = this.getGateway(gatewayName);
      const result = await gateway.confirmPayment(payment.paymentIntent);

      // Update payment status
      payment.status = result.status === 'SUCCESS' || result.status === 'COMPLETED' ? 'completed' : 'failed';
      payment.gatewayTransactionId = result.transactionId;
      payment.gatewayResponse = result;

      await payment.save();

      // Update booking status if payment successful
      if (payment.status === 'completed') {
        await Booking.findByIdAndUpdate(payment.booking, {
          status: 'confirmed',
          paymentStatus: 'paid'
        });
      }

      return {
        success: true,
        status: payment.status,
        amount: result.amount,
        currency: result.currency
      };
    } catch (error) {
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }

  async refundPayment(paymentId, amount, reason) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Payment must be completed to refund');
      }

      const gateway = this.getGateway(payment.paymentGateway);
      const refundAmount = amount || payment.amount / 100; // Convert from cents
      
      const result = await gateway.refundPayment(payment.paymentIntent, refundAmount);

      // Update payment record
      payment.status = 'refunded';
      payment.refundAmount = Math.round(refundAmount * 100);
      payment.refundReason = reason;
      payment.gatewayResponse = { ...payment.gatewayResponse, refund: result };

      await payment.save();

      return {
        success: true,
        refundId: result.refundId,
        amount: result.amount,
        status: result.status
      };
    } catch (error) {
      throw new Error(`Payment refund failed: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const gateway = this.getGateway(payment.paymentGateway);
      const status = await gateway.getPaymentStatus(payment.paymentIntent);

      return {
        success: true,
        status,
        paymentStatus: payment.status
      };
    } catch (error) {
      throw new Error(`Payment status check failed: ${error.message}`);
    }
  }

  async getPaymentHistory(userId, limit = 10) {
    try {
      const payments = await Payment.find({ user: userId })
        .populate('booking', 'services date time status')
        .sort({ createdAt: -1 })
        .limit(limit);

      return {
        success: true,
        payments: payments.map(payment => ({
          id: payment._id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          paymentGateway: payment.paymentGateway,
          createdAt: payment.createdAt,
          booking: payment.booking
        }))
      };
    } catch (error) {
      throw new Error(`Payment history retrieval failed: ${error.message}`);
    }
  }

  // Process Stripe webhook
  async processStripeWebhook(webhookData, signature) {
    try {
      const stripeService = new StripeService({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        environment: process.env.STRIPE_ENVIRONMENT || 'test'
      });

      const result = await stripeService.processWebhook(webhookData, signature);

      // Find and update payment
      const payment = await Payment.findOne({ paymentIntent: result.transactionId });
      if (payment) {
        payment.status = result.status === 'SUCCESS' ? 'completed' : 'failed';
        payment.gatewayTransactionId = result.transactionId;
        payment.gatewayResponse = result;
        await payment.save();

        // Update booking status if payment successful
        if (payment.status === 'completed') {
          await Booking.findByIdAndUpdate(payment.booking, {
            status: 'confirmed',
            paymentStatus: 'paid'
          });
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Stripe webhook processing failed: ${error.message}`);
    }
  }

  // Keep legacy Network International webhook method for backward compatibility
  async processNetworkInternationalWebhook(webhookData) {
    // Redirect to Stripe webhook processing for backward compatibility
    return this.processStripeWebhook(webhookData);
  }
}

module.exports = new PaymentService(); 
