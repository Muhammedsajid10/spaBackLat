const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendBookingConfirmation(booking, payment) {
    try {
      console.log('Sending booking confirmation email to:', booking.client.email);

      const emailHTML = this.generateBookingConfirmationHTML(booking, payment);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: booking.client.email,
        subject: `Booking Confirmation - ${booking.bookingNumber}`,
        html: emailHTML
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      throw new Error(`Failed to send confirmation email: ${error.message}`);
    }
  }

  generateBookingConfirmationHTML(booking, payment) {
    const servicesList = booking.services.map(service => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${service.service?.name || 'Service'}</strong><br>
          <small>Employee: ${service.employee?.firstName} ${service.employee?.lastName}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">AED ${service.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${service.duration} min</td>
      </tr>
    `).join('');

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
          <h1>🎉 Booking Confirmed!</h1>
          <p>Thank you for choosing our spa services</p>
        </div>
        
        <div class="content">
          <p>Dear ${booking.client.firstName} ${booking.client.lastName},</p>
          
          <p>Your booking has been confirmed and payment has been processed successfully. We look forward to providing you with an exceptional spa experience!</p>
          
          <div class="booking-details">
            <h3>📋 Booking Details</h3>
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
            <h3>💆‍♀️ Services Booked</h3>
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
                  <td style="padding: 15px;"><strong>AED ${payment?.amount || booking.totalAmount}</strong></td>
                  <td style="padding: 15px;"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="next-steps">
            <h3>📱 What's Next?</h3>
            <ul>
              <li>✅ Your appointment is confirmed</li>
              <li>📍 Please arrive 15 minutes before your appointment time</li>
              <li>🔄 You can modify or cancel your booking up to 24 hours before</li>
              <li>📞 Contact us if you have any questions</li>
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
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email, resetURL, firstName = '') {
    try {
      console.log('Sending password reset email to:', email);

      const emailHTML = this.generatePasswordResetHTML(email, resetURL, firstName);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request - Allora Spa',
        html: emailHTML
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
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
                <div class="logo">🌸 Allora Spa</div>
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
}

module.exports = EmailService;
