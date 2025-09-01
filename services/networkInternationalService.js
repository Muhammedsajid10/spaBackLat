const axios = require('axios');
const crypto = require('crypto');

class NetworkInternationalService {
  constructor(config) {
    this.config = {
      merchantId: config.merchantId,
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      environment: config.environment || 'test', // 'test' or 'live'
      currency: config.currency || 'AED',
      ...config
    };
    
    this.baseUrl = this.config.environment === 'live' 
      ? 'https://api-gateway.network.ae'
      : 'https://api-gateway-sandbox.network.ae';
  }

  // Generate signature for Network International API
  generateSignature(data, secretKey) {
    const sortedKeys = Object.keys(data).sort();
    let signatureString = '';
    
    sortedKeys.forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        signatureString += key + '=' + data[key] + '&';
      }
    });
    
    // Remove the last '&'
    signatureString = signatureString.slice(0, -1);
    
    // Add secret key
    signatureString += secretKey;
    
    // Generate SHA256 hash
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  // Create payment order
  async createOrder(orderData) {
    try {
      const {
        orderId,
        amount,
        currency = this.config.currency,
        customerEmail,
        customerName,
        customerPhone,
        description,
        returnUrl,
        cancelUrl,
        notifyUrl
      } = orderData;

      const requestData = {
        merchant_id: this.config.merchantId,
        order_id: orderId,
        amount: amount.toFixed(2),
        currency: currency,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        description: description,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        timestamp: Math.floor(Date.now() / 1000).toString()
      };

      // Generate signature
      const signature = this.generateSignature(requestData, this.config.secretKey);
      requestData.signature = signature;

      console.log('Network International - Creating order:', {
        orderId,
        amount,
        currency,
        customerEmail
      });

      const response = await axios.post(
        `${this.baseUrl}/order/create`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 30000
        }
      );

      console.log('Network International - Order created successfully:', response.data);

      return {
        success: true,
        orderId: response.data.order_id,
        paymentUrl: response.data.payment_url,
        transactionId: response.data.transaction_id,
        status: response.data.status
      };

    } catch (error) {
      console.error('Network International - Create order error:', error.response?.data || error.message);
      throw new Error(`Failed to create Network International order: ${error.response?.data?.message || error.message}`);
    }
  }

  // Verify payment status
  async verifyPayment(orderId, transactionId) {
    try {
      const requestData = {
        merchant_id: this.config.merchantId,
        order_id: orderId,
        transaction_id: transactionId,
        timestamp: Math.floor(Date.now() / 1000).toString()
      };

      // Generate signature
      const signature = this.generateSignature(requestData, this.config.secretKey);
      requestData.signature = signature;

      console.log('Network International - Verifying payment:', { orderId, transactionId });

      const response = await axios.post(
        `${this.baseUrl}/order/status`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 30000
        }
      );

      console.log('Network International - Payment verification response:', response.data);

      return {
        success: true,
        orderId: response.data.order_id,
        transactionId: response.data.transaction_id,
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        paymentMethod: response.data.payment_method,
        cardLast4: response.data.card_last4,
        cardBrand: response.data.card_brand,
        customerEmail: response.data.customer_email,
        customerName: response.data.customer_name,
        timestamp: response.data.timestamp
      };

    } catch (error) {
      console.error('Network International - Verify payment error:', error.response?.data || error.message);
      throw new Error(`Failed to verify Network International payment: ${error.response?.data?.message || error.message}`);
    }
  }

  // Refund payment
  async refundPayment(orderId, transactionId, amount, reason = 'Customer request') {
    try {
      const requestData = {
        merchant_id: this.config.merchantId,
        order_id: orderId,
        transaction_id: transactionId,
        refund_amount: amount.toFixed(2),
        refund_reason: reason,
        timestamp: Math.floor(Date.now() / 1000).toString()
      };

      // Generate signature
      const signature = this.generateSignature(requestData, this.config.secretKey);
      requestData.signature = signature;

      console.log('Network International - Processing refund:', { orderId, transactionId, amount });

      const response = await axios.post(
        `${this.baseUrl}/order/refund`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 30000
        }
      );

      console.log('Network International - Refund processed successfully:', response.data);

      return {
        success: true,
        refundId: response.data.refund_id,
        orderId: response.data.order_id,
        transactionId: response.data.transaction_id,
        refundAmount: response.data.refund_amount,
        status: response.data.status,
        timestamp: response.data.timestamp
      };

    } catch (error) {
      console.error('Network International - Refund error:', error.response?.data || error.message);
      throw new Error(`Failed to process Network International refund: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get transaction details
  async getTransactionDetails(orderId) {
    try {
      const requestData = {
        merchant_id: this.config.merchantId,
        order_id: orderId,
        timestamp: Math.floor(Date.now() / 1000).toString()
      };

      // Generate signature
      const signature = this.generateSignature(requestData, this.config.secretKey);
      requestData.signature = signature;

      const response = await axios.post(
        `${this.baseUrl}/order/details`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        ...response.data
      };

    } catch (error) {
      console.error('Network International - Get transaction details error:', error.response?.data || error.message);
      throw new Error(`Failed to get Network International transaction details: ${error.response?.data?.message || error.message}`);
    }
  }

  // Validate webhook signature
  validateWebhookSignature(data, signature) {
    const calculatedSignature = this.generateSignature(data, this.config.secretKey);
    return calculatedSignature === signature;
  }

  // Process webhook notification
  processWebhook(webhookData) {
    try {
      const {
        order_id,
        transaction_id,
        status,
        amount,
        currency,
        payment_method,
        customer_email,
        customer_name,
        timestamp,
        signature
      } = webhookData;

      // Validate signature
      if (!this.validateWebhookSignature(webhookData, signature)) {
        throw new Error('Invalid webhook signature');
      }

      return {
        success: true,
        orderId: order_id,
        transactionId: transaction_id,
        status: status,
        amount: parseFloat(amount),
        currency: currency,
        paymentMethod: payment_method,
        customerEmail: customer_email,
        customerName: customer_name,
        timestamp: timestamp
      };

    } catch (error) {
      console.error('Network International - Webhook processing error:', error);
      throw error;
    }
  }
}

module.exports = NetworkInternationalService; 