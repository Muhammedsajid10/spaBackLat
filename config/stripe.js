module.exports = {
  // Stripe Configuration
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key',
  environment: process.env.STRIPE_ENVIRONMENT || 'test', // 'test' or 'live'
  currency: process.env.STRIPE_CURRENCY || 'AED',
  
  // URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  
  // API Configuration
  apiVersion: '2023-10-16', // Latest Stripe API version
  
  // Supported currencies (Stripe supports 135+ currencies)
  supportedCurrencies: [
    'AED', 'USD', 'EUR', 'GBP', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR',
    'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK',
    'HUF', 'RON', 'BGN', 'HRK', 'TRY', 'ILS', 'ZAR', 'SGD', 'HKD',
    'NZD', 'MXN', 'BRL', 'INR', 'THB', 'MYR', 'PHP', 'IDR', 'VND'
  ],
  
  // Supported payment methods
  supportedMethods: [
    'card',
    'apple_pay', 
    'google_pay',
    'link',
    'paypal',
    'bank_transfer',
    'digital_wallet'
  ],
  
  // Webhook settings
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  
  // Payment settings
  captureMethod: 'automatic', // or 'manual'
  confirmationMethod: 'automatic', // or 'manual'
  
  // Timeout settings
  timeout: 30000, // 30 seconds
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  
  // Feature flags
  features: {
    automaticPaymentMethods: true,
    setupFutureUsage: false, // Set to true if you want to save payment methods
    statementDescriptor: 'SPA BOOKING', // Appears on customer's statement
    statementDescriptorSuffix: undefined, // Dynamic suffix for statements
  },
  
  // Metadata settings
  metadata: {
    source: 'spa-booking-system',
    version: '1.0.0'
  }
};
