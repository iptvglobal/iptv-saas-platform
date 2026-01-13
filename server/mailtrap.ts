/**
 * Mailtrap Email Service - Using HTTP API (Transactional Stream)
 * Replaces Brevo email service
 * 
 * Uses Mailtrap's HTTP API instead of SMTP for better reliability
 * API Docs: https://api-docs.mailtrap.io/
 */

import axios from 'axios';

// Initialize Mailtrap API configuration
const mailtrapApiToken = process.env.MAILTRAP_PASSWORD; // Using PASSWORD as the API token
const mailtrapSenderEmail = process.env.MAILTRAP_SENDER_EMAIL || 'noreply@yourdomain.com';
const mailtrapSenderName = process.env.MAILTRAP_SENDER_NAME || 'IPTV Premium';

// Mailtrap API endpoint
const MAILTRAP_API_URL = 'https://send.api.mailtrap.io/api/send';

// Verify configuration on startup
console.log('========================================');
console.log('📧 MAILTRAP EMAIL SERVICE INITIALIZATION');
console.log('========================================');
console.log('API Endpoint: send.api.mailtrap.io');
console.log('API Token: ' + (mailtrapApiToken ? '✓ Set' : '❌ NOT SET'));
console.log('Sender Email: ' + mailtrapSenderEmail);
console.log('Sender Name: ' + mailtrapSenderName);
console.log('========================================');

if (!mailtrapApiToken) {
  console.warn('⚠️  MAILTRAP_PASSWORD environment variable is not set. Email sending will fail.');
}

/**
 * Send email via Mailtrap HTTP API
 */
async function sendEmail(
  toEmail: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!mailtrapApiToken) {
      console.error('❌ MAILTRAP_PASSWORD not configured');
      return { success: false, error: 'Email service not configured' };
    }

    console.log('----------------------------------------');
    console.log('📤 SEND EMAIL REQUEST');
    console.log('----------------------------------------');
    console.log('To: ' + toEmail);
    console.log('Subject: ' + subject);
    console.log('HTML Length: ' + htmlContent.length + ' chars');

    const payload = {
      from: {
        email: mailtrapSenderEmail,
        name: mailtrapSenderName,
      },
      to: [
        {
          email: toEmail,
        },
      ],
      subject: subject,
      html: htmlContent,
      ...(textContent && { text: textContent }),
      category: 'IPTV Premium',
    };

    console.log('📧 Sending via Mailtrap HTTP API...');
    console.log('   From: ' + mailtrapSenderName + ' <' + mailtrapSenderEmail + '>');
    console.log('   To: ' + toEmail);

    const response = await axios.post(MAILTRAP_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${mailtrapApiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    console.log('✅ Email sent successfully');
    console.log('   Message ID: ' + response.data.success);
    console.log('----------------------------------------');

    return {
      success: true,
      messageId: response.data.success,
    };
  } catch (error: any) {
    console.error('❌ EMAIL SEND FAILED');
    console.error('   Error Type: ' + error.constructor.name);
    console.error('   Error Message: ' + error.message);

    if (error.response) {
      console.error('   Status: ' + error.response.status);
      console.error('   Response: ' + JSON.stringify(error.response.data));
    }

    console.error('   Full Error: ' + error.message);
    console.error('----------------------------------------');

    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  try {
    console.log('========================================');
    console.log('📧 SEND OTP EMAIL');
    console.log('   Email: ' + email);
    console.log('   OTP: ' + otp);
    console.log('========================================');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .content { text-align: center; }
            .otp-box { background-color: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>IPTV Premium</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your email verification code is:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 IPTV Premium. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `Your IPTV Premium verification code is: ${otp}\n\nThis code will expire in 10 minutes.`;

    const result = await sendEmail(
      email,
      'Your IPTV Premium Verification Code',
      htmlContent,
      textContent
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to send OTP email');
    }
  } catch (error: any) {
    console.error('❌ sendOTPEmail failed: ' + error.message);
    throw error;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderData: {
    orderId: string;
    amount: number;
    plan: string;
    duration: string;
  }
): Promise<void> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .order-details { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .detail-label { font-weight: bold; color: #333; }
            .detail-value { color: #666; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <p>Hello,</p>
            <p>Thank you for your order! Here are your order details:</p>
            <div class="order-details">
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${orderData.orderId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">${orderData.plan}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${orderData.duration}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">$${orderData.amount}</span>
              </div>
            </div>
            <p>Your order has been received and is being processed. You will receive your credentials shortly.</p>
            <div class="footer">
              <p>&copy; 2026 IPTV Premium. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, 'Order Confirmation - IPTV Premium', htmlContent);
  } catch (error: any) {
    console.error('❌ sendOrderConfirmationEmail failed: ' + error.message);
    throw error;
  }
}

/**
 * Send credentials email
 */
export async function sendCredentialsEmail(
  email: string,
  credentials: {
    username: string;
    password: string;
    expiryDate: string;
  }
): Promise<void> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .credentials-box { background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .credential-row { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #333; }
            .credential-value { color: #007bff; font-family: monospace; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your IPTV Premium Credentials</h1>
            </div>
            <p>Hello,</p>
            <p>Your order has been approved! Here are your IPTV credentials:</p>
            <div class="credentials-box">
              <div class="credential-row">
                <div class="credential-label">Username:</div>
                <div class="credential-value">${credentials.username}</div>
              </div>
              <div class="credential-row">
                <div class="credential-label">Password:</div>
                <div class="credential-value">${credentials.password}</div>
              </div>
              <div class="credential-row">
                <div class="credential-label">Expiry Date:</div>
                <div class="credential-value">${credentials.expiryDate}</div>
              </div>
            </div>
            <p>You can now log in to IPTV Premium and start streaming!</p>
            <div class="footer">
              <p>&copy; 2026 IPTV Premium. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, 'Your IPTV Premium Credentials', htmlContent);
  } catch (error: any) {
    console.error('❌ sendCredentialsEmail failed: ' + error.message);
    throw error;
  }
}

/**
 * Send payment verification email
 */
export async function sendPaymentVerificationEmail(
  email: string,
  paymentData: {
    transactionId: string;
    amount: number;
    date: string;
  }
): Promise<void> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .payment-box { background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .detail-label { font-weight: bold; color: #333; }
            .detail-value { color: #666; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received</h1>
            </div>
            <p>Hello,</p>
            <p>We have received your payment. Here are the details:</p>
            <div class="payment-box">
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${paymentData.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">$${paymentData.amount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${paymentData.date}</span>
              </div>
            </div>
            <p>Thank you for your purchase!</p>
            <div class="footer">
              <p>&copy; 2026 IPTV Premium. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, 'Payment Verification - IPTV Premium', htmlContent);
  } catch (error: any) {
    console.error('❌ sendPaymentVerificationEmail failed: ' + error.message);
    throw error;
  }
}

/**
 * Send new chat message notification
 */
export async function sendNewChatMessageEmail(
  email: string,
  senderName: string,
  message: string
): Promise<void> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .message-box { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Message</h1>
            </div>
            <p>Hello,</p>
            <p><strong>${senderName}</strong> sent you a new message:</p>
            <div class="message-box">
              <p>${message}</p>
            </div>
            <p>Log in to your account to reply.</p>
            <div class="footer">
              <p>&copy; 2026 IPTV Premium. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, 'New Message - IPTV Premium', htmlContent);
  } catch (error: any) {
    console.error('❌ sendNewChatMessageEmail failed: ' + error.message);
    throw error;
  }
}

/**
 * Send admin notification for new order
 */
export async function sendAdminNewOrderEmail(
  adminEmail: string,
  orderData: {
    orderId: string;
    customerEmail: string;
    plan: string;
    amount: number;
  }
): Promise<void> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .order-box { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .detail-label { font-weight: bold; color: #333; }
            .detail-value { color: #666; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Order Received</h1>
            </div>
            <p>A new order has been received:</p>
            <div class="order-box">
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${orderData.orderId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer Email:</span>
                <span class="detail-value">${orderData.customerEmail}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">${orderData.plan}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">$${orderData.amount}</span>
              </div>
            </div>
            <p>Please review and process this order.</p>
            <div class="footer">
              <p>&copy; 2026 IPTV Premium. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(adminEmail, 'New Order - IPTV Premium', htmlContent);
  } catch (error: any) {
    console.error('❌ sendAdminNewOrderEmail failed: ' + error.message);
    throw error;
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(email: string): Promise<void> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Test Email</h1>
            </div>
            <p>This is a test email from IPTV Premium.</p>
            <p>If you received this email, the email service is working correctly!</p>
            <div class="footer">
              <p>&copy; 2026 IPTV Premium. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, 'Test Email - IPTV Premium', htmlContent);
  } catch (error: any) {
    console.error('❌ sendTestEmail failed: ' + error.message);
    throw error;
  }
}
