/**
 * Mailtrap Email Service
 * Handles all transactional emails via Mailtrap API (not SMTP)
 * 
 * Required Environment Variables:
 * - MAILTRAP_API_TOKEN: Your Mailtrap API token
 * - MAILTRAP_SENDER_EMAIL: Verified sender email address
 * - MAILTRAP_SENDER_NAME: Sender display name (optional, defaults to "IPTV Premium")
 */

/* ======================= CONFIG ======================= */

const mailtrapApiToken = process.env.MAILTRAP_API_TOKEN;
const senderEmail = process.env.MAILTRAP_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'noreply@iptv.com';
const senderName = process.env.MAILTRAP_SENDER_NAME || process.env.BREVO_SENDER_NAME || 'IPTV Premium';

const BASE_URL = process.env.VITE_APP_URL || process.env.APP_URL || 'https://members.iptvtop.live';
const DASHBOARD_URL = `${BASE_URL}/dashboard`;
// Credentials are now shown on the dashboard, no separate page
const CHAT_URL = `${BASE_URL}/chat`;
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

/* ======================= STARTUP LOGS ======================= */

console.log('========================================');
console.log('📧 MAILTRAP EMAIL SERVICE (API Mode)');
console.log('========================================');
console.log('API Token:', mailtrapApiToken ? `✓ Set (${mailtrapApiToken.substring(0, 10)}...)` : '✗ MISSING');
console.log('Sender Email:', senderEmail);
console.log('Sender Name:', senderName);
console.log('Base URL:', BASE_URL);
console.log('Dashboard URL:', DASHBOARD_URL);
console.log('Admin Email:', ADMIN_EMAIL || 'Not configured');
console.log('========================================');

if (!mailtrapApiToken) {
  console.error('❌ CRITICAL: MAILTRAP_API_TOKEN environment variable is not set!');
  console.error('   Emails will NOT be sent. Please configure your Mailtrap API token.');
}

/* ======================= MODERN EMAIL TEMPLATE ======================= */

function emailTemplate(content: string, showDashboard: boolean = true, showChat: boolean = true): string {
  const dashboardSection = showDashboard ? `
    <div style="margin:32px 0;text-align:center">
      <a href="${DASHBOARD_URL}"
         style="display:inline-block;
                background:linear-gradient(135deg,#6366f1,#4f46e5);
                color:#ffffff;
                padding:14px 36px;
                border-radius:10px;
                font-weight:700;
                font-size:16px;
                text-decoration:none;
                box-shadow:0 4px 14px rgba(99,102,241,0.4)">
        🚀 Go to Dashboard
      </a>
      <p style="margin-top:12px;font-size:13px;color:#64748b">
        Or copy this link: <a href="${DASHBOARD_URL}" style="color:#4f46e5">${DASHBOARD_URL}</a>
      </p>
    </div>
  ` : '';

  const chatSection = showChat ? `
    <div style="margin-top:28px;text-align:center;padding-top:24px;border-top:1px solid #e5e7eb">
      <p style="margin-bottom:12px;font-size:14px;color:#475569">
        Need help? Our support team is online 24/7
      </p>
      <a href="${CHAT_URL}"
         style="display:inline-block;
                background:#0ea5e9;
                color:#ffffff;
                padding:12px 28px;
                border-radius:8px;
                font-weight:600;
                font-size:14px;
                text-decoration:none;
                box-shadow:0 4px 12px rgba(14,165,233,0.3)">
        💬 Live Chat Support
      </a>
      <p style="margin-top:8px;font-size:12px;color:#94a3b8">
        Or copy: <a href="${CHAT_URL}" style="color:#0ea5e9">${CHAT_URL}</a>
      </p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IPTV Premium</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="
          background:#ffffff;
          border-radius:16px;
          box-shadow:0 10px 40px rgba(0,0,0,0.1);
          overflow:hidden">
          
          <!-- Header -->
          <tr>
            <td style="
              padding:32px 40px;
              background:linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%);
              text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px">
                📺 IPTV Premium
              </h1>
              <p style="margin-top:8px;color:#e0e7ff;font-size:14px;font-weight:500">
                Unlimited Entertainment Access
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:40px">
              ${content}
              ${dashboardSection}
              ${chatSection}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="
              padding:24px;
              text-align:center;
              background:#f8fafc;
              border-top:1px solid #e5e7eb">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8">
                © ${new Date().getFullYear()} IPTV Premium. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1">
                This email was sent from <a href="${BASE_URL}" style="color:#6366f1">${BASE_URL}</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/* ======================= CREDENTIALS BUTTON ======================= */

function viewCredentialsButton(): string {
  return `
    <div style="margin:28px 0;text-align:center">
      <a href="${DASHBOARD_URL}"
         style="display:inline-block;
                background:linear-gradient(135deg,#22c55e,#16a34a);
                color:#ffffff;
                padding:14px 36px;
                border-radius:10px;
                font-weight:700;
                font-size:16px;
                text-decoration:none;
                box-shadow:0 4px 14px rgba(34,197,94,0.4)">
        🔑 View Your Credentials
      </a>
      <p style="margin-top:12px;font-size:13px;color:#64748b">
        Or copy this link: <a href="${DASHBOARD_URL}" style="color:#16a34a">${DASHBOARD_URL}</a>
      </p>
    </div>
  `;
}

/* ======================= CORE SEND EMAIL (API) ======================= */

async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  bcc?: string[]
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  console.log('----------------------------------------');
  console.log('📤 SEND EMAIL REQUEST (Mailtrap API)');
  console.log('----------------------------------------');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('BCC:', bcc?.join(', ') || 'None');
  
  try {
    // Validate inputs
    if (!to || !to.includes('@')) {
      const error = `Invalid recipient email: ${to}`;
      console.error('❌ Validation Error:', error);
      return { success: false, error };
    }

    if (!mailtrapApiToken) {
      const error = 'MAILTRAP_API_TOKEN is not configured';
      console.error('❌ Configuration Error:', error);
      return { success: false, error };
    }

    if (!senderEmail) {
      const error = 'MAILTRAP_SENDER_EMAIL is not configured';
      console.error('❌ Configuration Error:', error);
      return { success: false, error };
    }

    // Build request body
    const requestBody: any = {
      from: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject: subject,
      html: htmlContent,
    };

    // Add BCC if provided
    if (bcc && bcc.length > 0) {
      requestBody.bcc = bcc.filter(email => email && email.includes('@')).map(email => ({ email }));
    }

    console.log('📧 Calling Mailtrap API...');
    
    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': mailtrapApiToken,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Mailtrap API Error:', response.status, responseData);
      return { 
        success: false, 
        error: responseData?.errors?.[0] || responseData?.message || `API Error: ${response.status}` 
      };
    }

    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log('   Message IDs:', responseData.message_ids);
    console.log('----------------------------------------');
    
    return { 
      success: true, 
      messageId: responseData.message_ids?.[0] || 'unknown'
    };
  } catch (error: any) {
    console.error('❌ EMAIL SEND FAILED');
    console.error('   Error:', error?.message || error);
    console.error('----------------------------------------');
    
    return { 
      success: false, 
      error: error?.message || 'Unknown error sending email'
    };
  }
}

/* ======================= OTP EMAIL ======================= */

export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Sending OTP Email to:', email);
  
  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:24px">Verify Your Email 🔐</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
      Enter the verification code below to complete your sign-up. This code will expire in 10 minutes.
    </p>

    <div style="
      margin:32px 0;
      padding:32px;
      background:linear-gradient(135deg,#f1f5f9,#e2e8f0);
      border-radius:16px;
      text-align:center;
      border:2px dashed #cbd5e1">
      <p style="margin:0 0 12px;font-size:14px;color:#64748b;font-weight:600">
        YOUR VERIFICATION CODE
      </p>
      <div style="
        font-size:42px;
        font-weight:800;
        letter-spacing:8px;
        color:#4f46e5;
        font-family:'Courier New',monospace">
        ${otp}
      </div>
      <p style="margin-top:16px;font-size:13px;color:#94a3b8">
        ⏱️ Expires in 10 minutes
      </p>
    </div>

    <p style="color:#64748b;font-size:14px;text-align:center">
      If you didn't request this code, please ignore this email.
    </p>
  `;

  const result = await sendEmail(
    email,
    'Verify Your Email - IPTV Premium',
    emailTemplate(content, false, true)
  );
  
  return { success: result.success, error: result.error };
}

/* ======================= WELCOME EMAIL ======================= */

export async function sendWelcomeEmail(
  email: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Sending Welcome Email to:', email);
  
  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:24px">Welcome to IPTV Premium! 🎉</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
      Hi <strong>${userName}</strong>,
    </p>
    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
      Thank you for joining IPTV Premium! We're excited to have you on board. Your account has been successfully created and you're ready to explore our premium entertainment services.
    </p>

    <div style="
      margin:24px 0;
      padding:24px;
      background:#f0fdf4;
      border-radius:12px;
      border-left:4px solid #22c55e">
      <h3 style="margin:0 0 12px;color:#166534;font-size:16px">🚀 What's Next?</h3>
      <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.8">
        <li>Browse our subscription plans</li>
        <li>Choose the perfect plan for you</li>
        <li>Get instant access to premium content</li>
        <li>Enjoy unlimited entertainment!</li>
      </ul>
    </div>

    <p style="color:#475569;font-size:16px;line-height:1.6">
      If you have any questions, our support team is available 24/7 via live chat.
    </p>
  `;

  const result = await sendEmail(
    email,
    'Welcome to IPTV Premium! 🎉',
    emailTemplate(content, true, true)
  );
  
  return { success: result.success, error: result.error };
}

/* ======================= ORDER CONFIRMATION ======================= */

export async function sendOrderConfirmationEmail(params: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  connections: number;
  price: string;
  paymentMethod: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Sending Order Confirmation to:', params.to);
  
  const { to, userName, orderId, planName, connections, price, paymentMethod } = params;

  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:24px">Order Confirmed! 🎉</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
      Hi <strong>${userName}</strong>, thank you for your order! We've received your payment and your subscription is being processed.
    </p>

    <div style="
      margin:24px 0;
      background:#f8fafc;
      border-radius:12px;
      overflow:hidden;
      border:1px solid #e2e8f0">
      <div style="padding:16px 20px;background:#4f46e5;color:#ffffff">
        <h3 style="margin:0;font-size:16px;font-weight:600">Order #${orderId}</h3>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:0">
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Plan</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600;text-align:right">${planName}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Connections</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600;text-align:right">${connections}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Payment Method</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600;text-align:right">${paymentMethod}</td>
        </tr>
        <tr style="background:#f1f5f9">
          <td style="padding:16px 20px;color:#1e293b;font-size:16px;font-weight:700">Total</td>
          <td style="padding:16px 20px;color:#4f46e5;font-size:18px;font-weight:800;text-align:right">$${price}</td>
        </tr>
      </table>
    </div>

    <div style="
      margin:24px 0;
      padding:20px;
      background:#fef3c7;
      border-radius:12px;
      border-left:4px solid #f59e0b">
      <p style="margin:0;color:#92400e;font-size:14px">
        <strong>⏳ What happens next?</strong><br>
        Once your payment is verified, you'll receive your IPTV credentials via email. This usually takes a few minutes.
      </p>
    </div>
  `;

  const result = await sendEmail(
    to,
    `Order Confirmation #${orderId} - IPTV Premium`,
    emailTemplate(content, true, true),
    ['soay300@gmail.com', 'support@iptvtop.live']
  );
  
  return { success: result.success, error: result.error };
}

/* ======================= CREDENTIALS EMAIL ======================= */

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
  console.log('📧 Sending Credentials Email to:', email);
  
  let credentialsRows = '';

  if (credentials.type === 'xtream' || credentials.type === 'combined' || credentials.type === 'enigma2') {
    if (credentials.url) {
      credentialsRows += `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px;width:120px">Server URL</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600;word-break:break-all">${credentials.url}</td>
        </tr>
      `;
    }
    if (credentials.username) {
      credentialsRows += `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Username</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600;font-family:'Courier New',monospace">${credentials.username}</td>
        </tr>
      `;
    }
    if (credentials.password) {
      credentialsRows += `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Password</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600;font-family:'Courier New',monospace">${credentials.password}</td>
        </tr>
      `;
    }
  }

  if (credentials.type === 'm3u' || credentials.type === 'combined') {
    if (credentials.m3uUrl) {
      credentialsRows += `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">M3U URL</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:13px;font-weight:600;word-break:break-all">${credentials.m3uUrl}</td>
        </tr>
      `;
    }
    if (credentials.epgUrl) {
      credentialsRows += `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">EPG URL</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:13px;font-weight:600;word-break:break-all">${credentials.epgUrl}</td>
        </tr>
      `;
    }
  }

  if (credentials.type === 'portal') {
    if (credentials.portalUrl) {
      credentialsRows += `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Portal URL</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:13px;font-weight:600;word-break:break-all">${credentials.portalUrl}</td>
        </tr>
      `;
    }
  }

  if (credentials.type === 'mag' || credentials.type === 'portal') {
    if (credentials.macAddress) {
      credentialsRows += `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">MAC Address</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600;font-family:'Courier New',monospace">${credentials.macAddress}</td>
        </tr>
      `;
    }
  }

  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:24px">Your IPTV Credentials 🔑</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
      Great news! Your subscription is now active. Here are your access credentials:
    </p>

    ${viewCredentialsButton()}

    <div style="
      margin:24px 0;
      background:#f8fafc;
      border-radius:12px;
      overflow:hidden;
      border:1px solid #e2e8f0">
      <div style="padding:16px 20px;background:#22c55e;color:#ffffff">
        <h3 style="margin:0;font-size:16px;font-weight:600">🔐 Access Details</h3>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${credentialsRows}
        <tr style="background:#f0fdf4">
          <td style="padding:16px 20px;color:#166534;font-size:14px;font-weight:600">Expires</td>
          <td style="padding:16px 20px;color:#166534;font-size:14px;font-weight:700">${credentials.expiresAt.toDateString()}</td>
        </tr>
      </table>
    </div>

    <div style="
      margin:24px 0;
      padding:20px;
      background:#fef2f2;
      border-radius:12px;
      border-left:4px solid #ef4444">
      <p style="margin:0;color:#991b1b;font-size:14px">
        <strong>⚠️ Security Notice:</strong><br>
        Do not share your credentials with anyone. Keep them safe and secure.
      </p>
    </div>
  `;

  const result = await sendEmail(
    email,
    'Your IPTV Credentials - IPTV Premium',
    emailTemplate(content, true, true)
  );
  
  return { success: result.success, error: result.error };
}

/* ======================= PAYMENT VERIFICATION EMAIL ======================= */

export async function sendPaymentVerificationEmail(params: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  status: 'verified' | 'rejected';
  rejectionReason?: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Sending Payment Verification Email to:', params.to);
  
  const { to, userName, orderId, planName, status, rejectionReason } = params;

  let content: string;

  if (status === 'verified') {
    content = `
      <div style="text-align:center;margin-bottom:24px">
        <div style="
          display:inline-block;
          width:80px;
          height:80px;
          background:#dcfce7;
          border-radius:50%;
          line-height:80px;
          font-size:40px">
          ✅
        </div>
      </div>
      <h2 style="color:#166534;margin:0 0 16px;font-size:24px;text-align:center">Payment Verified!</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;text-align:center">
        Hi <strong>${userName}</strong>, great news! Your payment for order <strong>#${orderId}</strong> has been verified.
      </p>

      <div style="
        margin:24px 0;
        padding:20px;
        background:#f0fdf4;
        border-radius:12px;
        text-align:center;
        border:1px solid #bbf7d0">
        <p style="margin:0;color:#166534;font-size:16px">
          Your <strong>${planName}</strong> subscription is now active!<br>
          Check your email for your IPTV credentials.
        </p>
      </div>
    `;
  } else {
    content = `
      <div style="text-align:center;margin-bottom:24px">
        <div style="
          display:inline-block;
          width:80px;
          height:80px;
          background:#fee2e2;
          border-radius:50%;
          line-height:80px;
          font-size:40px">
          ❌
        </div>
      </div>
      <h2 style="color:#dc2626;margin:0 0 16px;font-size:24px;text-align:center">Payment Issue</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;text-align:center">
        Hi <strong>${userName}</strong>, unfortunately there was an issue with your payment for order <strong>#${orderId}</strong>.
      </p>

      <div style="
        margin:24px 0;
        padding:20px;
        background:#fef2f2;
        border-radius:12px;
        border:1px solid #fecaca">
        <h3 style="margin:0 0 12px;color:#991b1b;font-size:16px">❌ Order Rejected</h3>
        <p style="margin:0;color:#7f1d1d;font-size:14px">
          <strong>Plan:</strong> ${planName}<br>
          ${rejectionReason ? `<strong>Reason:</strong> ${rejectionReason}` : 'Please contact support for more information.'}
        </p>
      </div>

      <div style="
        margin:24px 0;
        padding:20px;
        background:#fef3c7;
        border-radius:12px;
        border-left:4px solid #f59e0b">
        <p style="margin:0;color:#92400e;font-size:14px">
          <strong>What to do next?</strong><br>
          Please contact our support team via live chat to resolve this issue. We're here to help!
        </p>
      </div>
    `;
  }

  const result = await sendEmail(
    to,
    status === 'verified' 
      ? `Payment Verified - Order #${orderId}` 
      : `Payment Issue - Order #${orderId}`,
    emailTemplate(content, true, true)
  );
  
  return { success: result.success, error: result.error };
}

/* ======================= ORDER REJECTION EMAIL ======================= */

export async function sendOrderRejectionEmail(params: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Sending Order Rejection Email to:', params.to);
  
  return sendPaymentVerificationEmail({
    ...params,
    status: 'rejected',
    rejectionReason: params.reason,
  });
}

/* ======================= NEW CHAT MESSAGE EMAIL ======================= */

export async function sendNewChatMessageEmail(params: {
  to: string;
  senderName: string;
  messagePreview: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Sending Chat Message Email to:', params.to);
  
  const { to, senderName, messagePreview } = params;

  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:24px">New Message 💬</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
      You have received a new message from <strong>${senderName}</strong>:
    </p>

    <div style="
      margin:24px 0;
      padding:24px;
      background:#f1f5f9;
      border-radius:12px;
      border-left:4px solid #0ea5e9">
      <p style="margin:0;color:#475569;font-size:15px;font-style:italic;line-height:1.6">
        "${messagePreview}"
      </p>
    </div>

    <div style="margin:32px 0;text-align:center">
      <a href="${CHAT_URL}"
         style="display:inline-block;
                background:#0ea5e9;
                color:#ffffff;
                padding:14px 36px;
                border-radius:10px;
                font-weight:700;
                font-size:16px;
                text-decoration:none;
                box-shadow:0 4px 14px rgba(14,165,233,0.4)">
        💬 View & Reply
      </a>
      <p style="margin-top:12px;font-size:13px;color:#64748b">
        Or copy this link: <a href="${CHAT_URL}" style="color:#0ea5e9">${CHAT_URL}</a>
      </p>
    </div>
  `;

  const result = await sendEmail(
    to,
    `New Message from ${senderName} - IPTV Premium`,
    emailTemplate(content, false, false)
  );
  
  return { success: result.success, error: result.error };
}

/* ======================= ADMIN NEW ORDER EMAIL ======================= */

export async function sendAdminNewOrderEmail(params: {
  orderId: number;
  userEmail: string;
  planName: string;
  connections: number;
  price: string;
  paymentMethod: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!ADMIN_EMAIL) {
    console.log('⚠️ Admin email not configured, skipping notification');
    return { success: true };
  }

  console.log('📧 Sending Admin Notification to:', ADMIN_EMAIL);
  
  const { orderId, userEmail, planName, connections, price, paymentMethod } = params;

  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:24px">🆕 New Order Received</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
      A new order has been placed and requires attention.
    </p>

    <div style="
      margin:24px 0;
      background:#f8fafc;
      border-radius:12px;
      overflow:hidden;
      border:1px solid #e2e8f0">
      <div style="padding:16px 20px;background:#ef4444;color:#ffffff">
        <h3 style="margin:0;font-size:16px;font-weight:600">Order #${orderId}</h3>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Customer Email</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600">${userEmail}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Plan</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600">${planName}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Connections</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600">${connections}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:14px 20px;color:#64748b;font-size:14px">Payment Method</td>
          <td style="padding:14px 20px;color:#1e293b;font-size:14px;font-weight:600">${paymentMethod}</td>
        </tr>
        <tr style="background:#fef2f2">
          <td style="padding:16px 20px;color:#991b1b;font-size:16px;font-weight:700">Total</td>
          <td style="padding:16px 20px;color:#dc2626;font-size:18px;font-weight:800">$${price}</td>
        </tr>
      </table>
    </div>

    <div style="margin:32px 0;text-align:center">
      <a href="${BASE_URL}/admin/orders/${orderId}"
         style="display:inline-block;
                background:#ef4444;
                color:#ffffff;
                padding:14px 36px;
                border-radius:10px;
                font-weight:700;
                font-size:16px;
                text-decoration:none;
                box-shadow:0 4px 14px rgba(239,68,68,0.4)">
        🔎 View Order
      </a>
    </div>
  `;

  const result = await sendEmail(
    ADMIN_EMAIL,
    `🆕 New Order #${orderId} - $${price}`,
    emailTemplate(content, false, false)
  );
  
  return { success: result.success, error: result.error };
}

/* ======================= TEST EMAIL ======================= */

export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Sending Test Email to:', to);
  
  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:24px">Test Email ✅</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
      This is a test email from IPTV Premium.
    </p>
    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
      If you received this email, your email configuration is working correctly!
    </p>
    <div style="
      margin:24px 0;
      padding:20px;
      background:#f0fdf4;
      border-radius:12px;
      text-align:center;
      border:1px solid #bbf7d0">
      <p style="margin:0;color:#166534;font-size:14px">
        <strong>✅ Email System Status:</strong> Operational<br>
        <span style="font-size:12px;color:#64748b">Sent at: ${new Date().toISOString()}</span>
      </p>
    </div>
  `;

  const result = await sendEmail(
    to,
    'Test Email - IPTV Premium',
    emailTemplate(content, true, true)
  );
  
  return { success: result.success, error: result.error };
}
