import * as brevo from '@getbrevo/brevo';

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME;

if (!apiKey || !senderEmail || !senderName) {
  console.warn('[Brevo] WARNING: Email credentials not configured (BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME). Email notifications will be disabled. Set these variables to enable email delivery.');
}

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey || '');

export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Send transactional email via Brevo
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!apiKey || !senderEmail || !senderName) {
    console.error('[Brevo] Cannot send email: missing credentials');
    return false;
  }

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: senderEmail, name: senderName };
    sendSmtpEmail.to = [{ email: params.to, name: params.toName || params.to }];
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.htmlContent;
    if (params.textContent) {
      sendSmtpEmail.textContent = params.textContent;
    }

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('[Brevo] Email sent successfully:', result.body.messageId);
    return true;
  } catch (error: any) {
    console.error('[Brevo] Failed to send email:', error.message || error);
    return false;
  }
}

/**
 * Test Brevo API connection
 */
export async function testBrevoConnection(): Promise<boolean> {
  if (!apiKey) {
    console.error('[Brevo] No API key provided');
    return false;
  }

  try {
    // Test by getting account info
    const accountApi = new brevo.AccountApi();
    accountApi.setApiKey(brevo.AccountApiApiKeys.apiKey, apiKey);
    const account = await accountApi.getAccount();
    console.log('[Brevo] Connection test successful. Account:', account.body.email);
    return true;
  } catch (error: any) {
    console.error('[Brevo] Connection test failed:', error.message || error);
    return false;
  }
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Verify Your Email - IPTV Premium',
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Thank you for signing up! Please use the following code to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 12px;">IPTV Premium - Premium IPTV Service</p>
        </body>
      </html>
    `,
    textContent: `Verify Your Email\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  connections: number;
  price: string;
  paymentMethod: string;
}): Promise<boolean> {
  const { to, userName, orderId, planName, connections, price, paymentMethod } = params;
  return sendEmail({
    to,
    toName: userName,
    subject: `Order Confirmation #${orderId} - IPTV Premium`,
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Order Confirmation</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for your order! Here are your order details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f4f4f4;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Plan</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${planName}</td>
            </tr>
            <tr style="background-color: #f4f4f4;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Connections</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${connections}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Method</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${paymentMethod}</td>
            </tr>
            <tr style="background-color: #f4f4f4;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>$${price}</strong></td>
            </tr>
          </table>
          <p>Your order is now pending verification. We'll notify you once it's approved.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 12px;">IPTV Premium - Premium IPTV Service</p>
        </body>
      </html>
    `
  });
}

/**
 * Send credentials delivery email
 */
export async function sendCredentialsEmail(
  email: string,
  credentials: {
    type: string;
    username?: string;
    password?: string;
    url?: string;
    m3uUrl?: string;
    epgUrl?: string;
    portalUrl?: string;
    macAddress?: string;
    expiresAt: Date;
  }
): Promise<boolean> {
  let credentialsHtml = '';
  
  if (credentials.type === 'xtream') {
    credentialsHtml = `
      <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Type</strong></td><td style="padding: 10px; border: 1px solid #ddd;">Xtream Codes</td></tr>
      <tr style="background-color: #f4f4f4;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Server URL</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${credentials.url}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Username</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${credentials.username}</td></tr>
      <tr style="background-color: #f4f4f4;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Password</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${credentials.password}</td></tr>
    `;
  } else if (credentials.type === 'm3u') {
    credentialsHtml = `
      <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Type</strong></td><td style="padding: 10px; border: 1px solid #ddd;">M3U Playlist</td></tr>
      <tr style="background-color: #f4f4f4;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>M3U URL</strong></td><td style="padding: 10px; border: 1px solid #ddd; word-break: break-all;">${credentials.m3uUrl}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>EPG URL</strong></td><td style="padding: 10px; border: 1px solid #ddd; word-break: break-all;">${credentials.epgUrl || 'N/A'}</td></tr>
    `;
  } else if (credentials.type === 'portal') {
    credentialsHtml = `
      <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Type</strong></td><td style="padding: 10px; border: 1px solid #ddd;">Portal URL</td></tr>
      <tr style="background-color: #f4f4f4;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Portal URL</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${credentials.portalUrl}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>MAC Address</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${credentials.macAddress}</td></tr>
    `;
  }

  return sendEmail({
    to: email,
    subject: 'Your IPTV Credentials - IPTV Premium',
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Your IPTV Credentials</h2>
          <p>Your order has been verified! Here are your IPTV access credentials:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            ${credentialsHtml}
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Expires</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${credentials.expiresAt.toLocaleDateString()}</td></tr>
          </table>
          <p><strong>Important:</strong> Keep these credentials safe and do not share them with others.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 12px;">IPTV Premium - Premium IPTV Service</p>
        </body>
      </html>
    `
  });
}


/**
 * Send payment verification email
 */
export async function sendPaymentVerificationEmail(params: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  status: 'verified' | 'rejected';
}): Promise<boolean> {
  const { to, userName, orderId, planName, status } = params;
  
  const isVerified = status === 'verified';
  const subject = isVerified 
    ? `Payment Verified - Order #${orderId}` 
    : `Payment Issue - Order #${orderId}`;
  
  const htmlContent = isVerified
    ? `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #22c55e;">Payment Verified!</h2>
          <p>Hi ${userName},</p>
          <p>Great news! Your payment for Order #${orderId} has been verified.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f4f4f4;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Plan</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${planName}</td>
            </tr>
            <tr style="background-color: #f4f4f4;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><span style="color: #22c55e; font-weight: bold;">✓ Verified</span></td>
            </tr>
          </table>
          <p>Your IPTV credentials will be sent to you shortly.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 12px;">IPTV Premium - Premium IPTV Service</p>
        </body>
      </html>
    `
    : `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ef4444;">Payment Issue</h2>
          <p>Hi ${userName},</p>
          <p>We're sorry, but there was an issue verifying your payment for Order #${orderId}.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f4f4f4;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Plan</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${planName}</td>
            </tr>
            <tr style="background-color: #f4f4f4;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><span style="color: #ef4444; font-weight: bold;">✗ Rejected</span></td>
            </tr>
          </table>
          <p>Please contact our support team for assistance or try placing a new order.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 12px;">IPTV Premium - Premium IPTV Service</p>
        </body>
      </html>
    `;

  return sendEmail({
    to,
    toName: userName,
    subject,
    htmlContent,
  });
}
