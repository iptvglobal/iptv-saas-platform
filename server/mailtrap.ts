/**
 * Mailtrap Email Service - Complete Modern Email System
 * Version: Final
 * 
 * Email Types:
 * 1. Welcome Email (after registration)
 * 2. OTP Verification Email
 * 3. Order Confirmation Email
 * 4. Order Being Processed Email (when user clicks "I have paid")
 * 5. Credentials Email (with dynamic templates)
 * 6. Order Rejected Email (with reason)
 * 7. New Chat Message Email
 * 8. Payment Verification Email
 * 9. Admin New Order Email
 * 10. Test Email
 */

import axios from 'axios';

// Configuration
const mailtrapApiToken = process.env.MAILTRAP_PASSWORD;
const mailtrapSenderEmail = process.env.MAILTRAP_SENDER_EMAIL || 'noreply@yourdomain.com';
const mailtrapSenderName = process.env.MAILTRAP_SENDER_NAME || 'IPTV Premium';
const MAILTRAP_API_URL = 'https://send.api.mailtrap.io/api/send';

// Support Information
const SUPPORT_EMAIL = 'support@iptvtop.live';
const LIVE_CHAT_URL = 'https://members.iptvtop.live/dashboard';
const DASHBOARD_URL = 'https://members.iptvtop.live/dashboard';

// Startup logs
console.log('========================================');
console.log('📧 MAILTRAP EMAIL SERVICE INITIALIZATION');
console.log('========================================');
console.log('API Token: ' + (mailtrapApiToken ? '✓ Set' : '❌ NOT SET'));
console.log('Sender: ' + mailtrapSenderName + ' <' + mailtrapSenderEmail + '>');
console.log('========================================');

if (!mailtrapApiToken) {
  console.warn('⚠️  MAILTRAP_PASSWORD not set. Email sending will fail.');
}

/**
 * Modern Email Base Template
 */
function getEmailTemplate(title: string, content: string, showSupport: boolean = true): string {
  const supportSection = showSupport ? `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #333;">Need Help?</p>
      <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
        Our support team is here for you 24/7.<br>
        📧 Email us: <a href="mailto:${SUPPORT_EMAIL}" style="color: #6366f1; text-decoration: none;">${SUPPORT_EMAIL}</a><br>
        💬 Live Chat: <a href="${LIVE_CHAT_URL}" style="color: #6366f1; text-decoration: none;">Open Live Chat</a>
      </p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #6366f1;">IPTV Premium</h1>
        </div>
        
        <!-- Main Card -->
        <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Title Bar -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px 30px;">
            <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">${title}</h2>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            ${content}
            ${supportSection}
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0 0 5px 0;">&copy; ${new Date().getFullYear()} IPTV Premium. All rights reserved.</p>
          <p style="margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
        
      </div>
    </body>
    </html>
  `;
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

    console.log('📤 Sending email to: ' + toEmail + ' | Subject: ' + subject);

    const response = await axios.post(MAILTRAP_API_URL, {
      from: { email: mailtrapSenderEmail, name: mailtrapSenderName },
      to: [{ email: toEmail }],
      subject: subject,
      html: htmlContent,
      ...(textContent && { text: textContent }),
      category: 'IPTV Premium',
    }, {
      headers: {
        Authorization: `Bearer ${mailtrapApiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('✅ Email sent successfully to: ' + toEmail);
    return { success: true, messageId: response.data.success };
  } catch (error: any) {
    console.error('❌ Email failed: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 1. Welcome Email - Sent after successful registration
 */
export async function sendWelcomeEmail(
  email: string,
  userName?: string
): Promise<void> {
  const name = userName || 'Valued Customer';
  
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hello ${name},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Welcome to <strong>IPTV Premium</strong>! We're thrilled to have you join our community of entertainment enthusiasts.
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Your account has been successfully created. Here's what you can do next:
    </p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">
        <strong>1.</strong> Browse our subscription plans
      </p>
      <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">
        <strong>2.</strong> Choose the plan that suits you best
      </p>
      <p style="margin: 0; color: #374151; font-size: 14px;">
        <strong>3.</strong> Start streaming thousands of channels
      </p>
    </div>
    
    <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Visit your dashboard to get started:
    </p>
    <p style="margin: 0; color: #6366f1; font-size: 14px;">
      <a href="${DASHBOARD_URL}" style="color: #6366f1; text-decoration: none;">${DASHBOARD_URL}</a>
    </p>
  `;

  const html = getEmailTemplate('Welcome to IPTV Premium', content);
  await sendEmail(email, 'Welcome to IPTV Premium - Your Account is Ready', html);
}

/**
 * 2. OTP Verification Email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Your verification code is:
    </p>
    
    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0;">
      <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6366f1;">${otp}</span>
    </div>
    
    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      This code will expire in <strong>10 minutes</strong>.
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      If you didn't request this code, please ignore this email or contact support if you have concerns.
    </p>
  `;

  const html = getEmailTemplate('Email Verification', content);
  await sendEmail(email, 'Your IPTV Premium Verification Code', html);
}

/**
 * 3. Order Confirmation Email
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
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Thank you for your order! We've received your request and it's now in our system.
    </p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Order ID</td>
          <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right;">${orderData.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Plan</td>
          <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${orderData.plan}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Duration</td>
          <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${orderData.duration}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Amount</td>
          <td style="padding: 10px 0; color: #6366f1; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb;">$${orderData.amount}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Please complete your payment to proceed. Once payment is confirmed, you'll receive your credentials.
    </p>
  `;

  const html = getEmailTemplate('Order Received', content);
  await sendEmail(email, 'Order Confirmation - IPTV Premium #' + orderData.orderId, html);
}

/**
 * 4. Order Being Processed Email - When user clicks "I have paid"
 */
export async function sendOrderBeingProcessedEmail(
  email: string,
  orderData: {
    orderId: string;
    plan: string;
    amount: number;
  }
): Promise<void> {
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Thank you for confirming your payment! Your order is now being processed.
    </p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #92400e; font-weight: 600; font-size: 14px;">
        ⏳ Payment Verification in Progress
      </p>
      <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
        Our support team manually verifies all payments to ensure security. This process typically takes <strong>0 to 2 hours</strong>.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right;">${orderData.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Plan</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${orderData.plan}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Amount</td>
          <td style="padding: 8px 0; color: #6366f1; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb;">$${orderData.amount}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 14px; line-height: 1.6;">
      <strong>What happens next?</strong>
    </p>
    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      • Once verified, you'll receive an email with your IPTV credentials
    </p>
    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      • You can also check your order status anytime from your dashboard
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      • Dashboard: <a href="${DASHBOARD_URL}" style="color: #6366f1; text-decoration: none;">${DASHBOARD_URL}</a>
    </p>
  `;

  const html = getEmailTemplate('Order Being Processed', content);
  await sendEmail(email, 'Your Order is Being Processed - IPTV Premium', html);
}

/**
 * 5. Credentials Email - With dynamic templates based on credential type
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
  const credentialType = credentials.credentialType || credentials.type || 'combined';
  const serverUrl = credentials.serverUrl || credentials.url;
  const expiryDate = credentials.expiresAt 
    ? new Date(credentials.expiresAt).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }) 
    : 'Not specified';

  let credentialsHtml = '';
  let typeLabel = '';

  const credentialRow = (label: string, value: string | null | undefined) => `
    <tr>
      <td style="padding: 12px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">${label}</td>
      <td style="padding: 12px 0; color: #374151; font-size: 13px; font-family: 'Courier New', monospace; text-align: right; border-bottom: 1px solid #e5e7eb; word-break: break-all;">${value || 'N/A'}</td>
    </tr>
  `;

  switch (credentialType) {
    case 'xtream':
      typeLabel = 'Xtream Codes';
      credentialsHtml = `
        ${credentialRow('Server URL', serverUrl)}
        ${credentialRow('Username', credentials.username)}
        ${credentialRow('Password', credentials.password)}
      `;
      break;

    case 'm3u':
      typeLabel = 'M3U Playlist';
      credentialsHtml = `
        ${credentialRow('M3U URL', credentials.m3uUrl)}
        ${credentialRow('EPG URL', credentials.epgUrl)}
      `;
      break;

    case 'portal':
      typeLabel = 'MAG Portal';
      credentialsHtml = `
        ${credentialRow('Portal URL', credentials.portalUrl)}
        ${credentialRow('MAC Address', credentials.macAddress)}
      `;
      break;

    case 'combined':
      typeLabel = 'Combined (Xtream + M3U + EPG)';
      credentialsHtml = `
        <tr>
          <td colspan="2" style="padding: 15px 0 10px 0; color: #6366f1; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Xtream Codes</td>
        </tr>
        ${credentialRow('Server URL', serverUrl)}
        ${credentialRow('Username', credentials.username)}
        ${credentialRow('Password', credentials.password)}
        <tr>
          <td colspan="2" style="padding: 20px 0 10px 0; color: #6366f1; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">M3U Playlist & EPG</td>
        </tr>
        ${credentialRow('M3U URL', credentials.m3uUrl)}
        ${credentialRow('EPG URL', credentials.epgUrl)}
      `;
      break;

    case 'enigma2':
      typeLabel = 'Enigma2';
      credentialsHtml = `
        ${credentialRow('Server URL', serverUrl)}
        ${credentialRow('Username', credentials.username)}
        ${credentialRow('Password', credentials.password)}
      `;
      break;

    default:
      typeLabel = 'IPTV';
      credentialsHtml = credentialRow('Status', 'Your credentials are being prepared');
  }

  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Great news! Your order has been approved. Here are your <strong>${typeLabel}</strong> credentials:
    </p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        ${credentialsHtml}
        <tr>
          <td style="padding: 15px 0 0 0; color: #f59e0b; font-size: 14px; font-weight: 600;">Expires On</td>
          <td style="padding: 15px 0 0 0; color: #f59e0b; font-size: 14px; font-weight: 600; text-align: right;">${expiryDate}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px; line-height: 1.6;">
      You can also view and manage your credentials from your dashboard:
    </p>
    <p style="margin: 0; color: #6366f1; font-size: 14px;">
      <a href="${DASHBOARD_URL}" style="color: #6366f1; text-decoration: none;">${DASHBOARD_URL}</a>
    </p>
  `;

  const html = getEmailTemplate('Your Credentials Are Ready', content);
  await sendEmail(email, 'Your IPTV Premium Credentials - ' + typeLabel, html);
}

/**
 * 6. Order Rejected Email - With admin's rejection reason
 */
export async function sendOrderRejectedEmail(
  email: string,
  orderData: {
    orderId: string;
    plan: string;
    reason: string;
  }
): Promise<void> {
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      We regret to inform you that your order could not be processed.
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: 600; font-size: 14px;">
        Order Rejected
      </p>
      <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
        <strong>Reason:</strong> ${orderData.reason || 'No reason provided'}
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right;">${orderData.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Plan</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${orderData.plan}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      If you believe this is an error or need assistance, please contact our support team. We're here to help!
    </p>
  `;

  const html = getEmailTemplate('Order Update', content);
  await sendEmail(email, 'Order Update - IPTV Premium #' + orderData.orderId, html);
}

/**
 * 7. New Chat Message Email
 */
export async function sendNewChatMessageEmail(
  email: string,
  senderName: string,
  message: string
): Promise<void> {
  // Truncate message if too long
  const truncatedMessage = message.length > 200 ? message.substring(0, 200) + '...' : message;
  
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      You have a new message from <strong>${senderName}</strong>:
    </p>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #6366f1; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; font-style: italic;">
        "${truncatedMessage}"
      </p>
    </div>
    
    <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px; line-height: 1.6;">
      Reply to this message from your dashboard:
    </p>
    <p style="margin: 0; color: #6366f1; font-size: 14px;">
      <a href="${DASHBOARD_URL}" style="color: #6366f1; text-decoration: none;">${DASHBOARD_URL}</a>
    </p>
  `;

  const html = getEmailTemplate('New Message', content);
  await sendEmail(email, 'New Message from ' + senderName + ' - IPTV Premium', html);
}

/**
 * 8. Payment Verification Email
 */
export async function sendPaymentVerificationEmail(
  email: string,
  paymentData: {
    transactionId: string;
    amount: number;
    date: string;
  }
): Promise<void> {
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Your payment has been successfully verified. Thank you for your purchase!
    </p>
    
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 14px;">
        ✓ Payment Confirmed
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Transaction ID</td>
          <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right;">${paymentData.transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Amount</td>
          <td style="padding: 10px 0; color: #6366f1; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb;">$${paymentData.amount}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Date</td>
          <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${paymentData.date}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Your credentials will be sent to you shortly in a separate email.
    </p>
  `;

  const html = getEmailTemplate('Payment Confirmed', content);
  await sendEmail(email, 'Payment Confirmed - IPTV Premium', html);
}

/**
 * 9. Admin New Order Email
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
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      A new order has been received and requires your attention.
    </p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Order ID</td>
          <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right;">${orderData.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Customer</td>
          <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${orderData.customerEmail}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Plan</td>
          <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${orderData.plan}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Amount</td>
          <td style="padding: 10px 0; color: #6366f1; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb;">$${orderData.amount}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Please review and process this order from the admin dashboard.
    </p>
  `;

  const html = getEmailTemplate('New Order Received', content, false);
  await sendEmail(adminEmail, 'New Order #' + orderData.orderId + ' - Action Required', html);
}

/**
 * 10. Test Email
 */
export async function sendTestEmail(email: string): Promise<void> {
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      This is a test email from IPTV Premium.
    </p>
    
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 14px;">
        ✓ Email service is working correctly!
      </p>
    </div>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      If you received this email, your Mailtrap integration is configured properly.
    </p>
  `;

  const html = getEmailTemplate('Test Email', content);
  await sendEmail(email, 'Test Email - IPTV Premium', html);
}
