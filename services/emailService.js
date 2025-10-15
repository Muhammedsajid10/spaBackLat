
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// Set SendGrid API key from env
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}


class EmailService {
  constructor() {}

  async sendBookingConfirmation(booking, payment) {
    try {
      console.log('Sending booking confirmation email to:', booking.client.email);
      // Normalize payment amount: if payment.amount is stored in cents, convert to AED
      let paymentAmountAED;
      if (payment && typeof payment.amount === 'number') {
        // Some parts of the app store payment.amount in cents (e.g., Stripe/Payment model)
        // Convert to major currency units (AED)
        paymentAmountAED = payment.amount / 100;
      }
      const emailHTML = this.generateBookingConfirmationHTML(booking, paymentAmountAED);
      const msg = {
        to: booking.client.email,
        from: process.env.EMAIL_FROM,
        subject: `Booking Confirmation - ${booking.bookingNumber}`,
        html: emailHTML
      };
      // Prefer SendGrid if configured, otherwise fallback to SMTP
      if (process.env.SENDGRID_API_KEY) {
        const [result] = await sgMail.send(msg);
        console.log('Email sent successfully (SendGrid):', result && result.headers ? result.headers['x-message-id'] : 'no message id');
        return {
          success: true,
          messageId: result && result.headers ? result.headers['x-message-id'] : undefined
        };
      }
      // Fallback to SMTP if SendGrid not configured
      const smtpResult = await this._sendViaSMTP(msg);
      console.log('Email sent successfully (SMTP):', smtpResult.messageId || 'no message id');
      return { success: true, messageId: smtpResult.messageId };
    } catch (error) {
      // If SendGrid returns a response body, log it for debugging
      if (error && error.response && error.response.body) {
        console.error('SendGrid response body:', JSON.stringify(error.response.body));
      }
      console.error('Error sending booking confirmation email (primary path):', error);
      // As a resilience fallback: if SendGrid path failed and SMTP is configured, try SMTP once
      try {
        const fallbackMsg = {
          to: booking.client.email,
          from: process.env.EMAIL_FROM,
          subject: `Booking Confirmation - ${booking.bookingNumber}`,
          html: this.generateBookingConfirmationHTML(booking, payment && typeof payment.amount === 'number' ? payment.amount / 100 : undefined)
        };
        const smtpResult = await this._sendViaSMTP(fallbackMsg);
        console.log('Email sent successfully on fallback (SMTP):', smtpResult.messageId || 'no message id');
        return { success: true, messageId: smtpResult.messageId };
      } catch (fallbackErr) {
        const extra = error && error.response && error.response.body ? ` | sendgrid:${JSON.stringify(error.response.body)}` : '';
        throw new Error(`Failed to send confirmation email: ${error.message}${extra} | smtp:${fallbackErr.message}`);
      }
    }
  }

  generateBookingConfirmationHTML(booking, paymentAmountAED) {
    // Helper to format numbers as currency with 2 decimals
    const fmt = (val) => {
      const n = Number(val) || 0;
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    };

    const servicesList = booking.services.map(service => {
      // Resolve employee display name. Booking.services.employee may be populated as:
      // - { user: { firstName, lastName } }
      // - { firstName, lastName } (older shape)
      // - an ObjectId (unpopulated)
      // - { employeeId }
      let employeeName = '';
      try {
        if (service.employee && service.employee.user) {
          const u = service.employee.user;
          employeeName = `${u.firstName || ''}`.trim();
          if (u.lastName) employeeName = `${employeeName} ${u.lastName}`.trim();
        } else if (service.employee && (service.employee.firstName || service.employee.lastName)) {
          employeeName = `${service.employee.firstName || ''}`.trim();
          if (service.employee.lastName) employeeName = `${employeeName} ${service.employee.lastName}`.trim();
        } else if (service.employee && service.employee.employeeId) {
          employeeName = `Staff ${service.employee.employeeId}`;
        }
      } catch (e) {
        // defensive
        employeeName = '';
      }
      if (!employeeName) employeeName = 'Assigned Staff';

      return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${service.service?.name || 'Service'}</strong><br>
          <small>Employee: ${employeeName}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">AED ${fmt(service.price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${service.duration || ''} min</td>
      </tr>
    `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .services-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .services-table th { background: #667eea; color: white; padding: 12px; text-align: left; }
        .total-row { background: #667eea; color: white; font-weight: bold; }
        .next-steps { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
          <p>Thank you for choosing our spa services</p>
        </div>
        
        <div class="content">
          <p>Dear ${booking.client.firstName} ${booking.client.lastName},</p>
          
          <p>Your booking has been confirmed and payment has been processed successfully. We look forward to providing you with an exceptional spa experience!</p>
          
          <div class="booking-details">
            <h3>Booking Details</h3>
            <div class="detail-row">
              <span><strong>Booking Number:</strong></span>
              <span>${booking.bookingNumber}</span>
            </div>
            <div class="detail-row">
              <span><strong>Date:</strong></span>
              <span>${new Date(booking.appointmentDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div class="detail-row">
              <span><strong>Time:</strong></span>
              <span>${new Date(booking.services[0]?.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <div class="detail-row">
              <span><strong>Status:</strong></span>
              <span style="color: #28a745; font-weight: bold;">✅ Confirmed</span>
            </div>
          </div>

          <div class="booking-details">
            <h3>Services Booked</h3>
            <table class="services-table">
              <thead>
                <tr>
                  <th>Service & Employee</th>
                  <th>Price</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${servicesList}
                <tr class="total-row">
                  <td style="padding: 15px;"><strong>Total Amount Paid</strong></td>
                  <td style="padding: 15px;"><strong>AED ${fmt(paymentAmountAED !== undefined ? paymentAmountAED : booking.totalAmount)}</strong></td>
                  <td style="padding: 15px;"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>✅ Your appointment is confirmed</li>
              <li>Please arrive 15 minutes before your appointment time</li>
              <li>You can modify or cancel your booking up to 24 hours before</li>
              <li>Contact us if you have any questions</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/client-profile" class="btn">View My Bookings</a>
            <a href="${process.env.FRONTEND_URL}/" class="btn">Book Another Service</a>
          </div>

          <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
            <p>Thank you for choosing our spa services!</p>
            <p>If you have any questions, please contact us at ${process.env.EMAIL_FROM}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendEmail(to, subject, html) {
    try {
      const msg = {
        to,
        from: process.env.EMAIL_FROM,
        subject,
        html
      };
      if (process.env.SENDGRID_API_KEY) {
        const [result] = await sgMail.send(msg);
        return {
          success: true,
          messageId: result && result.headers ? result.headers['x-message-id'] : undefined
        };
      }
      // Fallback to SMTP when SendGrid is not available
      const smtpResult = await this._sendViaSMTP(msg);
      return { success: true, messageId: smtpResult.messageId };
    } catch (error) {
      if (error && error.response && error.response.body) {
        console.error('SendGrid response body:', JSON.stringify(error.response.body));
      }
      console.error('Error sending email (primary path):', error);
      // Final failure
      const extra = error && error.response && error.response.body ? ` | sendgrid:${JSON.stringify(error.response.body)}` : '';
      throw new Error(`Failed to send email: ${error.message}${extra}`);
    }
  }

  async sendPasswordResetEmail(email, resetURL, firstName = '') {
    try {
      console.log('Sending password reset email to:', email);
      const emailHTML = this.generatePasswordResetHTML(email, resetURL, firstName);
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Password Reset Request - Allora Spa',
        html: emailHTML
      };
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured (SENDGRID_API_KEY)');
      }
      const [result] = await sgMail.send(msg);
      console.log('Password reset email sent successfully:', result && result.headers ? result.headers['x-message-id'] : 'no message id');
      return {
        success: true,
        messageId: result && result.headers ? result.headers['x-message-id'] : undefined
      };
    } catch (error) {
      if (error && error.response && error.response.body) {
        console.error('SendGrid response body:', JSON.stringify(error.response.body));
      }
      console.error('Error sending password reset email:', error);
      const extra = error && error.response && error.response.body ? ` | sendgrid:${JSON.stringify(error.response.body)}` : '';
      throw new Error(`Failed to send password reset email: ${error.message}${extra}`);
    }
  }

  generatePasswordResetHTML(email, resetURL, firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Allora Spa</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e74c3c; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #e74c3c; margin-bottom: 10px; }
            .content { padding: 20px 0; }
            .reset-button { display: inline-block; background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .reset-button:hover { background-color: #c0392b; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Allora Spa</div>
                <h1 style="color: #e74c3c; margin: 0;">Password Reset Request</h1>
            </div>
            
            <div class="content">
                <h2>Hello ${firstName}!</h2>
                
                <p>We received a request to reset the password for your account associated with <strong>${email}</strong>.</p>
                
                <p>If you made this request, please click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetURL}" class="reset-button">Reset My Password</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Information:</strong>
                    <ul>
                        <li>This reset link will expire in 10 minutes for security reasons</li>
                        <li>If you didn't request this password reset, please ignore this email</li>
                        <li>Never share this reset link with anyone</li>
                    </ul>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${resetURL}
                </p>
                
                <div class="warning">
                    <strong>📱 Having trouble with the link?</strong>
                    <ul>
                        <li>Make sure to open the link in the same browser where you'll log in</li>
                        <li>If the link doesn't work, copy the entire URL and paste it in your browser</li>
                        <li>The link works on both mobile and desktop devices</li>
                    </ul>
                </div>
                
                <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <p>For security reasons, this link will expire in 10 minutes.</p>
            </div>
            
            <div class="footer">
                <p><strong>Allora Spa</strong><br>
                Your trusted beauty and wellness partner</p>
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>If you need help, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async _sendViaSMTP(msg) {
    // Ensure SMTP envs are present
    const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error('SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)');
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return await transporter.sendMail({
      from: msg.from || process.env.EMAIL_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
    });
  }
}

module.exports = EmailService;
