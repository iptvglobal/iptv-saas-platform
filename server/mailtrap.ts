/**
 * Mailtrap Email Service
 * 
 * This module handles all email sending through Mailtrap SMTP.
 * Mailtrap provides both sandbox testing and production transactional email.
 */

import nodemailer from 'nodemailer';

/* =======================
   CONFIG
======================= */
const mailtrapHost = process.env.MAILTRAP_HOST || 'live.smtp.mailtrap.io';
const mailtrapPort = parseInt(process.env.MAILTRAP_PORT || '2525', 10);
const mailtrapUser = process.env.MAILTRAP_USER;
const mailtrapPassword = process.env.MAILTRAP_PASSWORD;
const senderEmail = process.env.MAILTRAP_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'noreply@iptv.com';
const senderName = process.env.MAILTRAP_SENDER_NAME || process.env.BREVO_SENDER_NAME || 'IPTV Premium';

// Log configuration status on startup
console.log('========================================');
console.log('📧 MAILTRAP EMAIL SERVICE INITIALIZATION');
console.log('========================================');
console.log('Host:', mailtrapHost);
console.log('Port:', mailtrapPort);
console.log('User:', mailtrapUser ? `✓ Set (${mailtrapUser.substring(0, 10)}...)` : '✗ MISSING');
console.log('Password:', mailtrapPassword ? '✓ Set' : '✗ MISSING');
console.log('Sender Email:', senderEmail);
console.log('Sender Name:', senderName);
console.log('========================================');

if (!mailtrapUser || !mailtrapPassword) {
  console.error('❌ CRITICAL: MAILTRAP_USER and MAILTRAP_PASSWORD environment variables are not set!');
  console.error('   Please set these in your environment variables.');
}

/* =======================
   NODEMAILER TRANSPORTER
======================= */
const transporter = nodemailer.createTransport({
  host: mailtrapHost,
  port: mailtrapPort,
  secure: mailtrapPort === 465, // true for 465, false for other ports
  auth: {
    user: mailtrapUser,
    pass: mailtrapPassword,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Mailtrap connection failed:', error);
  } else {
    console.log('✓ Mailtrap SMTP connection verified');
  }
});

/* =======================
   EMAIL TEMPLATE HELPERS
======================= */
function dashboardButton() {
  const baseUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://members.iptvprovider8k.com';
  return `
    <div style="margin:32px 0;text-align:center">
      <a href="${baseUrl}/dashboard" 
         style="background:#4f46e5;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
        View in Dashboard
      </a>
    </div>
  `;
}

function viewCredentialsButton() {
  const baseUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://members.iptvprovider8k.com';
  return `
    <div style="margin:32px 0;text-align:center">
      <a href="${baseUrl}/credentials" 
         style="background:#4f46e5;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
        View Your Credentials
      </a>
    </div>
  `;
}

function emailTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 32px 20px; border-radius: 12px 12px 0 0; text-align: center; }
          .body { background: #f8fafc; padding: 32px 20px; border-radius: 0 0 12px 12px; }
          .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
          strong { color: #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">IPTV Premium</h1>
          </div>
          <div class="body">
            ${content}
          </div>
          <div class="footer">
            <p style="margin: 8px 0;">© ${new Date().getFullYear()} IPTV Premium. All rights reserved.</p>
            <p style="margin: 8px 0; color: #94a3b8;">This is an automated email. Please do not reply to this address.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/* =======================
   CORE SEND EMAIL FUNCTION
======================= */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  console.log('----------------------------------------');
  console.log('📤 SEND EMAIL REQUEST');
  console.log('----------------------------------------');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('HTML Length:', htmlContent.length, 'chars');
  
  try {
    // Validate inputs
    if (!to) {
      const error = 'Recipient email is empty';
      console.error('❌ Validation Error:', error);
      return { success: false, error };
    }
    
    if (!to.includes('@')) {
      const error = `Invalid recipient email format: ${to}`;
      console.error('❌ Validation Error:', error);
      return { success: false, error };
    }

    if (!mailtrapUser || !mailtrapPassword) {
      const error = 'MAILTRAP_USER or MAILTRAP_PASSWORD is not configured.';
      console.error('❌ Configuration Error:', error);
      return { success: false, error };
    }

    console.log('📧 Sending via Mailtrap SMTP...');
    console.log('   From:', `${senderName} <${senderEmail}>`);
    console.log('   To:', to);
    
    const info = await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log('   Message ID:', info.messageId);
    console.log('----------------------------------------');
    
    return { 
      success: true, 
      messageId: info.messageId || 'unknown'
    };
  } catch (error: any) {
    console.error('❌ EMAIL SEND FAILED');
    console.error('   Error Type:', error?.constructor?.name || 'Unknown');
    console.error('   Error Message:', error?.message || 'No message');
    console.error('   Full Error:', error);
    console.error('----------------------------------------');
    
    return { 
      success: false, 
      error: error?.message || 'Unknown error sending email'
    };
  }
}

/* =======================
   OTP EMAIL
======================= */
export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND OTP EMAIL');
  console.log('   Email:', email);
  console.log('   OTP:', otp);
  console.log('========================================');
  
  try {
    const content = `
      <h2 style="color:#1e293b">Your OTP Code 🔐</h2>
      <p style="color:#475569">
        Use this code to verify your email address. This code will expire in 10 minutes.
      </p>

      <div style="margin:32px 0;text-align:center;background:#f1f5f9;padding:24px;border-radius:12px">
        <div style="font-size:48px;font-weight:700;color:#4f46e5;letter-spacing:8px;font-family:monospace">
          ${otp}
        </div>
      </div>

      <p style="margin-top:24px;font-size:13px;color:#64748b">
        If you didn't request this code, please ignore this email.
      </p>
    `;

    const result = await sendEmail(
      email,
      'Your OTP Verification Code',
      emailTemplate(content)
    );
    
    if (!result.success) {
      console.error('❌ sendOTPEmail failed:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ OTP email sent successfully to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendOTPEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send OTP email' };
  }
}

/* =======================
   ORDER CONFIRMATION EMAIL
======================= */
export async function sendOrderConfirmationEmail(data: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  connections: number;
  price: string;
  paymentMethod: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND ORDER CONFIRMATION EMAIL');
  console.log('   Email:', data.to);
  console.log('   Order ID:', data.orderId);
  console.log('========================================');
  
  try {
    const content = `
      <h2 style="color:#1e293b">Order Confirmation ✅</h2>
      <p style="color:#475569">
        Hi ${data.userName},
      </p>
      <p style="color:#475569">
        Thank you for your order! We've received your subscription request and it's being processed.
      </p>

      ${dashboardButton()}

      <table width="100%" cellpadding="12"
        style="margin-top:24px;
               background:#f8fafc;
               border-radius:12px;
               border-collapse:collapse">
        <tr>
          <td><strong>Order ID</strong></td>
          <td>#${data.orderId}</td>
        </tr>
        <tr>
          <td><strong>Plan</strong></td>
          <td>${data.planName}</td>
        </tr>
        <tr>
          <td><strong>Connections</strong></td>
          <td>${data.connections}</td>
        </tr>
        <tr>
          <td><strong>Price</strong></td>
          <td style="color:#4f46e5;font-weight:700">${data.price}</td>
        </tr>
        <tr>
          <td><strong>Payment Method</strong></td>
          <td>${data.paymentMethod}</td>
        </tr>
      </table>

      <p style="margin-top:24px;font-size:13px;color:#64748b">
        Your order is pending verification. You'll receive another email once it's confirmed.
      </p>
    `;

    const result = await sendEmail(
      data.to,
      'Order Confirmation - IPTV Premium',
      emailTemplate(content)
    );
    
    if (!result.success) {
      console.error('❌ sendOrderConfirmationEmail failed:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Order confirmation email sent successfully to:', data.to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendOrderConfirmationEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send order confirmation email' };
  }
}

/* =======================
   ADMIN NEW ORDER EMAIL
======================= */
export async function sendAdminNewOrderEmail(data: {
  orderId: number;
  userEmail: string;
  planName: string;
  connections: number;
  price: string;
  paymentMethod: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND ADMIN NEW ORDER EMAIL');
  console.log('   Order ID:', data.orderId);
  console.log('   User Email:', data.userEmail);
  console.log('========================================');
  
  try {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.BREVO_SENDER_EMAIL || senderEmail;
    
    if (!adminEmail) {
      console.warn('⚠️  No admin email configured, skipping admin notification');
      return { success: true };
    }

    const content = `
      <h2 style="color:#1e293b">New Order Received 📦</h2>
      <p style="color:#475569">
        A new order has been placed on your IPTV platform.
      </p>

      ${dashboardButton()}

      <table width="100%" cellpadding="12"
        style="margin-top:24px;
               background:#f8fafc;
               border-radius:12px;
               border-collapse:collapse">
        <tr>
          <td><strong>Order ID</strong></td>
          <td>#${data.orderId}</td>
        </tr>
        <tr>
          <td><strong>Customer Email</strong></td>
          <td>${data.userEmail}</td>
        </tr>
        <tr>
          <td><strong>Plan</strong></td>
          <td>${data.planName}</td>
        </tr>
        <tr>
          <td><strong>Connections</strong></td>
          <td>${data.connections}</td>
        </tr>
        <tr>
          <td><strong>Price</strong></td>
          <td style="color:#4f46e5;font-weight:700">${data.price}</td>
        </tr>
        <tr>
          <td><strong>Payment Method</strong></td>
          <td>${data.paymentMethod}</td>
        </tr>
      </table>

      <p style="margin-top:24px;font-size:13px;color:#64748b">
        Please review and verify this order in your admin dashboard.
      </p>
    `;

    const result = await sendEmail(
      adminEmail,
      `New Order #${data.orderId} - IPTV Premium`,
      emailTemplate(content)
    );
    
    if (!result.success) {
      console.error('❌ sendAdminNewOrderEmail failed:', result.error);
      // Don't throw, just log - admin notification failure shouldn't block order creation
      return { success: false, error: result.error };
    }
    
    console.log('✅ Admin notification email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendAdminNewOrderEmail exception:', error);
    // Don't throw, just log - admin notification failure shouldn't block order creation
    return { success: false, error: error?.message || 'Failed to send admin notification email' };
  }
}

/* =======================
   CREDENTIALS EMAIL
======================= */
export async function sendCredentialsEmail(
  email: string,
  credentials: {
    type: 'xtream' | 'm3u' | 'portal' | 'mag' | 'enigma2' | 'combined';
    username?: string;
    password?: string;
    url?: string;
    m3uUrl?: string;
    epgUrl?: string;
    portalUrl?: string;
    macAddress?: string;
    expiresAt: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND CREDENTIALS EMAIL');
  console.log('   Email:', email);
  console.log('   Type:', credentials.type);
  console.log('========================================');
  
  try {
    let rows = '';

    if (credentials.type === 'xtream') {
      rows = `
        <tr><td><strong>Server URL</strong></td><td style="word-break:break-all">${credentials.url}</td></tr>
        <tr><td><strong>Username</strong></td><td>${credentials.username}</td></tr>
        <tr><td><strong>Password</strong></td><td>${credentials.password}</td></tr>
      `;
    } else if (credentials.type === 'm3u') {
      rows = `
        <tr><td><strong>M3U URL</strong></td><td style="word-break:break-all">${credentials.m3uUrl}</td></tr>
        ${credentials.epgUrl ? `<tr><td><strong>EPG URL</strong></td><td style="word-break:break-all">${credentials.epgUrl}</td></tr>` : ''}
      `;
    } else if (credentials.type === 'portal') {
      rows = `
        <tr><td><strong>Portal URL</strong></td><td style="word-break:break-all">${credentials.portalUrl}</td></tr>
        <tr><td><strong>MAC Address</strong></td><td>${credentials.macAddress}</td></tr>
      `;
    } else if (credentials.type === 'mag') {
      rows = `
        <tr><td><strong>MAC Address</strong></td><td>${credentials.macAddress}</td></tr>
      `;
    } else if (credentials.type === 'enigma2') {
      rows = `
        <tr><td><strong>Server URL</strong></td><td style="word-break:break-all">${credentials.url}</td></tr>
        <tr><td><strong>Username</strong></td><td>${credentials.username}</td></tr>
        <tr><td><strong>Password</strong></td><td>${credentials.password}</td></tr>
      `;
    } else if (credentials.type === 'combined') {
      // Combined type includes both Xtream and M3U credentials
      rows = `
        <tr><td><strong>Server URL</strong></td><td style="word-break:break-all">${credentials.url}</td></tr>
        <tr><td><strong>Username</strong></td><td>${credentials.username}</td></tr>
        <tr><td><strong>Password</strong></td><td>${credentials.password}</td></tr>
        ${credentials.m3uUrl ? `<tr><td><strong>M3U URL</strong></td><td style="word-break:break-all">${credentials.m3uUrl}</td></tr>` : ''}
      `;
    }

    const content = `
      <h2 style="color:#1e293b">Your IPTV Credentials 🔑</h2>
      <p style="color:#475569">
        Your subscription is active. Use the details below or view them securely in your dashboard.
      </p>

      ${viewCredentialsButton()}

      <table width="100%" cellpadding="12"
        style="margin-top:24px;
               background:#f8fafc;
               border-radius:12px;
               border-collapse:collapse">
        ${rows}
        <tr>
          <td><strong>Expires</strong></td>
          <td style="color:#4f46e5;font-weight:700">
            ${credentials.expiresAt.toDateString()}
          </td>
        </tr>
      </table>

      <p style="margin-top:16px;font-size:13px;color:#64748b">
        ⚠️ Do not share your credentials with anyone.
      </p>
    `;

    const result = await sendEmail(
      email,
      'Your IPTV Credentials',
      emailTemplate(content)
    );
    
    if (!result.success) {
      console.error('❌ sendCredentialsEmail failed:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Credentials email sent successfully to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendCredentialsEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send credentials email' };
  }
}

/* =======================
   PAYMENT VERIFICATION EMAIL
======================= */
export async function sendPaymentVerificationEmail(data: {
  to: string;
  userName: string;
  orderId: number;
  status: 'verified' | 'rejected';
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND PAYMENT VERIFICATION EMAIL');
  console.log('   Email:', data.to);
  console.log('   Status:', data.status);
  console.log('========================================');
  
  try {
    const isVerified = data.status === 'verified';
    const statusColor = isVerified ? '#10b981' : '#ef4444';
    const statusText = isVerified ? 'VERIFIED ✅' : 'REJECTED ❌';

    const content = `
      <h2 style="color:#1e293b">Payment ${statusText}</h2>
      <p style="color:#475569">
        Hi ${data.userName},
      </p>
      <p style="color:#475569">
        Your payment for order #${data.orderId} has been ${data.status}.
      </p>

      ${isVerified ? `
        <div style="margin:24px 0;padding:16px;background:#ecfdf5;border-left:4px solid #10b981;border-radius:8px">
          <p style="color:#047857;margin:0">
            <strong>Great news!</strong> Your subscription is now active. You can view your credentials in your dashboard.
          </p>
        </div>
        ${dashboardButton()}
      ` : `
        <div style="margin:24px 0;padding:16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px">
          <p style="color:#991b1b;margin:0">
            <strong>Payment Rejected:</strong> ${data.reason || 'Please contact support for more information.'}
          </p>
        </div>
      `}

      <p style="margin-top:24px;font-size:13px;color:#64748b">
        If you have any questions, please contact our support team.
      </p>
    `;

    const result = await sendEmail(
      data.to,
      `Payment ${statusText} - Order #${data.orderId}`,
      emailTemplate(content)
    );
    
    if (!result.success) {
      console.error('❌ sendPaymentVerificationEmail failed:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Payment verification email sent successfully to:', data.to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendPaymentVerificationEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send payment verification email' };
  }
}

/* =======================
   NEW CHAT MESSAGE EMAIL
======================= */
export async function sendNewChatMessageEmail(data: {
  to: string;
  userName: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND NEW CHAT MESSAGE EMAIL');
  console.log('   Email:', data.to);
  console.log('========================================');
  
  try {
    const baseUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://members.iptvprovider8k.com';
    
    const content = `
      <h2 style="color:#1e293b">New Message 💬</h2>
      <p style="color:#475569">
        Hi ${data.userName},
      </p>
      <p style="color:#475569">
        You have a new message from our support team.
      </p>

      <div style="margin:24px 0;padding:16px;background:#f1f5f9;border-left:4px solid #4f46e5;border-radius:8px">
        <p style="color:#1e293b;margin:0;font-style:italic">
          "${data.message}"
        </p>
      </div>

      <div style="margin:32px 0;text-align:center">
        <a href="${baseUrl}/chat" 
           style="background:#4f46e5;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
          View Message
        </a>
      </div>

      <p style="margin-top:24px;font-size:13px;color:#64748b">
        Reply to this message in your dashboard chat.
      </p>
    `;

    const result = await sendEmail(
      data.to,
      'New Support Message - IPTV Premium',
      emailTemplate(content)
    );
    
    if (!result.success) {
      console.error('❌ sendNewChatMessageEmail failed:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Chat message email sent successfully to:', data.to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendNewChatMessageEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send chat message email' };
  }
}

/* =======================
   TEST EMAIL
======================= */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND TEST EMAIL');
  console.log('   Email:', to);
  console.log('========================================');
  
  try {
    const content = `
      <h2 style="color:#1e293b">Test Email ✅</h2>
      <p style="color:#475569">
        This is a test email from your IPTV SaaS platform.
      </p>
      <p style="color:#475569">
        If you received this email, your email configuration is working correctly!
      </p>
      <div style="margin:24px 0;padding:16px;background:#ecfdf5;border-radius:8px">
        <p style="color:#047857;margin:0">
          <strong>Configuration Status:</strong> ✅ All systems operational
        </p>
      </div>
    `;

    const result = await sendEmail(
      to,
      'Test Email - IPTV Premium',
      emailTemplate(content)
    );
    
    return result;
  } catch (error: any) {
    console.error('❌ sendTestEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send test email' };
  }
}
