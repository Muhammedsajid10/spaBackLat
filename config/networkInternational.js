module.exports = {
  // Network International Configuration
  merchantId: process.env.NETWORK_INTERNATIONAL_MERCHANT_ID || 'your_merchant_id',
  apiKey: process.env.NETWORK_INTERNATIONAL_API_KEY || 'your_api_key',
  secretKey: process.env.NETWORK_INTERNATIONAL_SECRET_KEY || 'your_secret_key',
  environment: process.env.NETWORK_INTERNATIONAL_ENVIRONMENT || 'test', // 'test' or 'live'
  currency: process.env.NETWORK_INTERNATIONAL_CURRENCY || 'AED',
  
  // URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  
  // API Endpoints
  baseUrl: process.env.NETWORK_INTERNATIONAL_ENVIRONMENT === 'live' 
    ? 'https://api-gateway.network.ae'
    : 'https://api-gateway-sandbox.network.ae',
    
  // Supported currencies
  supportedCurrencies: ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'],
  
  // Supported payment methods
  supportedMethods: ['card', 'digital_wallet', 'bank_transfer'],
  
  // Webhook settings
  webhookSecret: process.env.NETWORK_INTERNATIONAL_WEBHOOK_SECRET || 'your_webhook_secret',
  
  // Timeout settings
  timeout: 30000, // 30 seconds
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000, // 1 second
}; 