/**
 * Mailtrap Email Service - Using HTTP API (Transactional Stream)
 * Enhanced Version with Complete Credentials Email Templates
 * 
 * Uses Mailtrap's HTTP API instead of SMTP for better reliability
 * API Docs: https://api-docs.mailtrap.io/
 */

import axios from 'axios';

// Initialize Mailtrap API configuration
const mailtrapApiToken = process.env.MAILTRAP_PASSWORD;
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
      timeout: 10000,
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
 * Send IPTV credentials email with different templates based on credential type
 * Supports: xtream, m3u, portal, combined, enigma2
 */
export async function sendCredentialsEmail(
  email: string,
  credentials: {
    type?: string;
    credentialType?: 'xtream' | 'm3u' | 'portal' | 'combined' | 'enigma2';
    serverUrl?: string | null;
    url?: string | null;
    username?: string | null;
    password?: string | null;
    m3uUrl?: string | null;
    epgUrl?: string | null;
    portalUrl?: string | null;
    macAddress?: string | null;
    expiresAt?: Date | string | null;
  }
): Promise<void> {
  try {
    // Handle both 'type' and 'credentialType' for backwards compatibility
    const credentialType = credentials.credentialType || credentials.type || 'combined';
    const serverUrl = credentials.serverUrl || credentials.url;
    const expiryDate = credentials.expiresAt 
      ? new Date(credentials.expiresAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) 
      : 'Not specified';

    let credentialsHtml = '';
    let typeLabel = '';

    switch (credentialType) {
      case 'xtream':
        typeLabel = 'Xtream Codes';
        credentialsHtml = `
          <div class="credential-row">
            <div class="credential-label">Server URL:</div>
            <div class="credential-value">${serverUrl || 'N/A'}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">Username:</div>
            <div class="credential-value">${credentials.username || 'N/A'}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">Password:</div>
            <div class="credential-value">${credentials.password || 'N/A'}</div>
          </div>
        `;
        break;

      case 'm3u':
        typeLabel = 'M3U Playlist';
        credentialsHtml = `
          <div class="credential-row">
            <div class="credential-label">M3U URL:</div>
            <div class="credential-value">${credentials.m3uUrl || 'N/A'}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">EPG URL:</div>
            <div class="credential-value">${credentials.epgUrl || 'N/A'}</div>
          </div>
        `;
        break;

      case 'portal':
        typeLabel = 'Web Portal';
        credentialsHtml = `
          <div class="credential-row">
            <div class="credential-label">Portal URL:</div>
            <div class="credential-value">${credentials.portalUrl || 'N/A'}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">MAC Address:</div>
            <div class="credential-value">${credentials.macAddress || 'N/A'}</div>
          </div>
        `;
        break;

      case 'combined':
        typeLabel = 'Combined (Xtream + M3U + EPG)';
        credentialsHtml = `
          <div class="section-title">Xtream Codes</div>
          <div class="credential-row">
            <div class="credential-label">Server URL:</div>
            <div class="credential-value">${serverUrl || 'N/A'}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">Username:</div>
            <div class="credential-value">${credentials.username || 'N/A'}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">Password:</div>
            <div class="credential-value">${credentials.password || 'N/A'}</div>
          </div>
          <div class="divider"></div>
          <div class="section-title">M3U Playlist & EPG</div>
          <div class="credential-row">
            <div class="credential-label">M3U URL:</div>
            <div class="credential-value">${credentials.m3uUrl || 'N/A'}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">EPG URL:</div>
            <div class="credential-value">${credentials.epgUrl || 'N/A'}</div>
          </div>
        `;
        break;

      case 'enigma2':
        typeLabel = 'Enigma2';
        credentialsHtml = `
          <div class="credential-row">
            <div class="credential-label">Server URL:</div>
            <div class="credential-value">${serverUrl || 'N/A'}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">Username:</div>
            <div class="credential-value">${credentials.username || 'N/A'}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">Password:</div>
            <div class="credential-value">${credentials.password || 'N/A'}</div>
          </div>
        `;
        break;

      default:
        credentialsHtml = '<p>Your credentials are being processed. You will receive them shortly.</p>';
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background-color: #f5f5f5; }
              .container { max-width: 650px; margin: 20px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
              .header h1 { font-size: 28px; margin-bottom: 5px; }
              .header p { font-size: 14px; opacity: 0.9; }
              .content { padding: 30px 20px; }
              .credentials-box { background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
              .section-title { font-weight: bold; font-size: 14px; color: #667eea; margin-top: 15px; margin-bottom: 10px; text-transform: uppercase; }
              .credential-row { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0; }
              .credential-row:last-child { border-bottom: none; }
              .credential-label { font-weight: 600; color: #333; font-size: 13px; margin-bottom: 5px; }
              .credential-value { 
                  color: #007bff; 
                  font-family: 'Courier New', monospace; 
                  font-size: 13px;
                  word-break: break-all;
                  background-color: #f0f0f0;
                  padding: 8px 10px;
                  border-radius: 4px;
                  display: block;
              }
              .divider { height: 1px; background-color: #e0e0e0; margin: 15px 0; }
              .expiry-section { background-color: #fff3cd; padding: 12px; border-radius: 5px; margin-top: 15px; }
              .expiry-label { font-weight: 600; color: #856404; font-size: 13px; }
              .expiry-value { color: #007bff; font-family: monospace; font-size: 13px; }
              .dashboard-button { 
                  display: inline-block; 
                  padding: 12px 30px; 
                  margin-top: 20px; 
                  background-color: #667eea; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 5px;
                  font-weight: 600;
                  transition: background-color 0.3s;
              }
              .dashboard-button:hover { background-color: #764ba2; }
              .instructions { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin-top: 20px; font-size: 13px; line-height: 1.6; }
              .instructions strong { color: #0066cc; }
              .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
              .footer p { margin: 5px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>IPTV Premium</h1>
                  <p>Your Credentials Are Ready</p>
              </div>
              <div class="content">
                  <p>Hello,</p>
                  <p>Your order has been approved! Here are your <strong>${typeLabel}</strong> credentials:</p>
                  
                  <div class="credentials-box">
                      ${credentialsHtml}
                      
                      <div class="expiry-section">
                          <div class="expiry-label">Expires On:</div>
                          <div class="expiry-value">${expiryDate}</div>
                      </div>
                  </div>

                  <div class="instructions">
                      <strong>How to use your credentials:</strong>
                      <ul style="margin-left: 20px; margin-top: 10px;">
                          <li>Copy the credentials above</li>
                          <li>Enter them in your IPTV player or application</li>
                          <li>Start streaming your favorite content</li>
                          <li>Visit your dashboard to manage your account</li>
                      </ul>
                  </div>

                  <div style="text-align: center;">
                      <a href="https://members.iptvtop.live/dashboard" class="dashboard-button">View Dashboard</a>
                  </div>

                  <p style="margin-top: 20px; font-size: 13px; color: #666;">
                      If you have any issues or need support, please contact us through your dashboard or email us at support@iptvtop.live
                  </p>
              </div>
              
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} IPTV Premium. All rights reserved.</p>
                  <p>This is an automated message. Please do not reply to this email.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    await sendEmail(email, 'Your IPTV Premium Credentials - ' + typeLabel, htmlContent);

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
