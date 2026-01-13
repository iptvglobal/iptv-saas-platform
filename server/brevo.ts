import * as brevo from '@getbrevo/brevo';

/* =======================
   CONFIG
======================= */
const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME || 'IPTV Premium';

// Log configuration status on startup
console.log('========================================');
console.log('📧 BREVO EMAIL SERVICE INITIALIZATION');
console.log('========================================');
console.log('API Key:', apiKey ? `✓ Set (${apiKey.substring(0, 10)}...)` : '✗ MISSING - Emails will NOT work!');
console.log('Sender Email:', senderEmail || '✗ MISSING - Emails will NOT work!');
console.log('Sender Name:', senderName);
console.log('========================================');

if (!apiKey) {
  console.error('❌ CRITICAL: BREVO_API_KEY environment variable is not set!');
  console.error('   Please set BREVO_API_KEY in your environment variables.');
}
if (!senderEmail) {
  console.error('❌ CRITICAL: BREVO_SENDER_EMAIL environment variable is not set!');
  console.error('   Please set BREVO_SENDER_EMAIL in your environment variables.');
}

const BASE_URL = process.env.VITE_APP_URL || process.env.APP_URL || 'https://members.iptvprovider8k.com';
const DASHBOARD_URL = `${BASE_URL}/dashboard`;
const CHAT_URL = `${BASE_URL}/chat`;

console.log('Base URL:', BASE_URL);
console.log('Dashboard URL:', DASHBOARD_URL);
console.log('========================================');

/* =======================
   BREVO INIT
======================= */
const apiInstance = new brevo.TransactionalEmailsApi();

if (apiKey) {
  try {
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      apiKey
    );
    console.log('✓ Brevo API instance initialized');
  } catch (initError) {
    console.error('❌ Failed to initialize Brevo API:', initError);
  }
} else {
  console.error('❌ Brevo API NOT initialized - missing API key');
}

/* =======================
   TEMPLATE HELPERS
======================= */
function dashboardButton() {
  return `
    <div style="margin:32px 0;text-align:center">
      <a href="${DASHBOARD_URL}"
         style="display:inline-block;
                background:linear-gradient(135deg,#6366f1,#4f46e5);
                color:#fff;padding:14px 36px;
                border-radius:10px;
                font-weight:700;
                font-size:16px;
                text-decoration:none">
        🚀 Go to Dashboard
      </a>
    </div>
  `;
}

function chatSupport() {
  return `
    <div style="margin-top:28px;text-align:center">
      <p style="margin-bottom:10px;font-size:14px;color:#475569">
        Need help? Our support team is online
      </p>
      <a href="${CHAT_URL}"
         style="display:inline-block;
                background:#0ea5e9;
                color:#fff;
                padding:12px 26px;
                border-radius:8px;
                font-weight:600;
                font-size:14px;
                text-decoration:none">
        💬 Live Chat Support
      </a>
    </div>
  `;
}

function emailTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif">
<table width="100%" style="padding:40px 20px">
<tr><td align="center">

<table width="600" style="
  background:#ffffff;
  border-radius:16px;
  box-shadow:0 10px 25px rgba(0,0,0,.08);
  overflow:hidden">

<tr>
<td style="
  padding:28px 40px;
  background:linear-gradient(135deg,#6366f1,#4f46e5);
  text-align:center">
  <h1 style="margin:0;color:#fff;font-size:24px">
    IPTV Premium
  </h1>
  <p style="margin-top:6px;color:#e0e7ff;font-size:14px">
    Unlimited Entertainment Access
  </p>
</td>
</tr>

<tr>
<td style="padding:40px">
  ${content}
  ${dashboardButton()}
  ${chatSupport()}
</td>
</tr>

<tr>
<td style="
  padding:18px;
  text-align:center;
  background:#f8fafc;
  border-top:1px solid #e5e7eb">
  <p style="margin:0;font-size:12px;color:#94a3b8">
    © ${new Date().getFullYear()} IPTV Premium. All rights reserved.
  </p>
</td>
</tr>

</table>

</td></tr>
</table>
</body>
</html>
`;
}

/* =======================
   SEND EMAIL CORE (WITH DETAILED ERROR HANDLING)
======================= */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  bcc?: string[]
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  console.log('----------------------------------------');
  console.log('📤 SEND EMAIL REQUEST');
  console.log('----------------------------------------');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('BCC:', bcc?.join(', ') || 'None');
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

    if (!apiKey) {
      const error = 'BREVO_API_KEY is not configured. Please set this environment variable.';
      console.error('❌ Configuration Error:', error);
      return { success: false, error };
    }

    if (!senderEmail) {
      const error = 'BREVO_SENDER_EMAIL is not configured. Please set this environment variable.';
      console.error('❌ Configuration Error:', error);
      return { success: false, error };
    }

    const email = new brevo.SendSmtpEmail();
    email.sender = { email: senderEmail, name: senderName };
    email.to = [{ email: to }];
    email.subject = subject;
    email.htmlContent = htmlContent;

    if (bcc && bcc.length > 0) {
      email.bcc = bcc.map(bccEmail => ({ email: bccEmail }));
    }

    console.log('📧 Calling Brevo API...');
    console.log('   Sender:', senderEmail);
    console.log('   Recipient:', to);
    
    const response = await apiInstance.sendTransacEmail(email);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log('   Response:', JSON.stringify(response, null, 2));
    console.log('----------------------------------------');
    
    return { 
      success: true, 
      messageId: (response as any)?.messageId || 'unknown'
    };
  } catch (error: any) {
    console.error('❌ EMAIL SEND FAILED');
    console.error('   Error Type:', error?.constructor?.name || 'Unknown');
    console.error('   Error Message:', error?.message || 'No message');
    
    // Try to extract more details from Brevo error response
    if (error?.response) {
      console.error('   Response Status:', error.response?.status);
      console.error('   Response Body:', JSON.stringify(error.response?.body || error.response?.data, null, 2));
    }
    
    if (error?.body) {
      console.error('   Error Body:', JSON.stringify(error.body, null, 2));
    }
    
    console.error('   Full Error:', error);
    console.error('----------------------------------------');
    
    return { 
      success: false, 
      error: error?.message || error?.body?.message || 'Unknown error sending email'
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
      <h2 style="color:#1e293b">Verify Your Email</h2>
      <p style="color:#475569">
        Enter the code below to complete verification.
      </p>

      <div style="
        margin:24px 0;
        padding:24px;
        background:#f1f5f9;
        border-radius:12px;
        text-align:center">
        <div style="
          font-size:36px;
          font-weight:800;
          letter-spacing:6px;
          color:#4f46e5">
          ${otp}
        </div>
        <p style="margin-top:12px;font-size:13px;color:#64748b">
          Expires in 10 minutes
        </p>
      </div>
    `;

    const result = await sendEmail(
      email,
      'Verify Your Email - IPTV Premium',
      emailTemplate(content),
      []
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
   ORDER CONFIRMATION
======================= */
export async function sendOrderConfirmationEmail(params: {
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
  console.log('   Params:', JSON.stringify(params, null, 2));
  console.log('========================================');
  
  try {
    const {
      to,
      userName,
      orderId,
      planName,
      connections,
      price,
      paymentMethod
    } = params;

    const content = `
      <h2 style="color:#1e293b">Order Confirmed 🎉</h2>
      <p style="color:#475569">
        Hi <strong>${userName}</strong>, your order is confirmed.
      </p>

      <table width="100%" cellpadding="12"
        style="margin-top:24px;
               background:#f8fafc;
               border-radius:12px">
        <tr><td>Order ID</td><td>#${orderId}</td></tr>
        <tr><td>Plan</td><td>${planName}</td></tr>
        <tr><td>Connections</td><td>${connections}</td></tr>
        <tr><td>Payment</td><td>${paymentMethod}</td></tr>
        <tr>
          <td><strong>Total</strong></td>
          <td><strong>$${price}</strong></td>
        </tr>
      </table>
    `;

    const result = await sendEmail(
      to,
      `Order Confirmation #${orderId}`,
      emailTemplate(content),
      ['soay300@gmail.com', 'support@iptvtop.live']
    );
    
    if (!result.success) {
      console.error('❌ sendOrderConfirmationEmail failed:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Order confirmation email sent successfully to:', to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendOrderConfirmationEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send order confirmation email' };
  }
}

/* =======================
   CREDENTIALS EMAIL
======================= */
export async function sendCredentialsEmail(
  email: string,
  credentials: {
    type: 'xtream' | 'm3u' | 'portal' | 'mag' | 'enigma2';
    username?: string;
    password?: string;
    url?: string;
    m3uUrl?: string;
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
      emailTemplate(content),
      []
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
   PAYMENT STATUS
======================= */
export async function sendPaymentVerificationEmail(params: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  status: 'verified' | 'rejected';
}): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND PAYMENT VERIFICATION EMAIL');
  console.log('   Params:', JSON.stringify(params, null, 2));
  console.log('========================================');
  
  try {
    const { to, userName, orderId, status } = params;

    const content =
      status === 'verified'
        ? `
          <h2 style="color:#16a34a">Payment Verified ✅</h2>
          <p>Hi ${userName}, your order #${orderId} is approved.</p>
        `
        : `
          <h2 style="color:#dc2626">Payment Rejected ❌</h2>
          <p>Hi ${userName}, there was an issue with order #${orderId}.</p>
        `;

    const result = await sendEmail(
      to,
      `Payment ${status} - Order #${orderId}`,
      emailTemplate(content),
      []
    );
    
    if (!result.success) {
      console.error('❌ sendPaymentVerificationEmail failed:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Payment verification email sent successfully to:', to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendPaymentVerificationEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send payment verification email' };
  }
}

function viewCredentialsButton() {
  return `
    <div style="margin:28px 0;text-align:center">
      <a href="${BASE_URL}/credentials"
         style="display:inline-block;
                background:linear-gradient(135deg,#22c55e,#16a34a);
                color:#ffffff;
                padding:14px 34px;
                border-radius:10px;
                font-weight:700;
                font-size:16px;
                text-decoration:none">
        🔑 View Your Credentials
      </a>
    </div>
  `;
}

export async function sendAdminNewOrderEmail(params: {
  orderId: number;
  userEmail: string;
  planName: string;
  connections: number;
  price: string;
  paymentMethod: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND ADMIN NEW ORDER EMAIL');
  console.log('   Params:', JSON.stringify(params, null, 2));
  console.log('========================================');
  
  try {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      console.warn('⚠️ ADMIN_NOTIFICATION_EMAIL not configured, skipping admin notification');
      return { success: true }; // Not an error, just skipped
    }

    const {
      orderId,
      userEmail,
      planName,
      connections,
      price,
      paymentMethod
    } = params;

    const content = `
      <h2 style="color:#1e293b">🆕 New Order Received</h2>

      <table width="100%" cellpadding="12"
        style="margin-top:24px;
               background:#f8fafc;
               border-radius:12px">
        <tr><td>Order ID</td><td>#${orderId}</td></tr>
        <tr><td>User Email</td><td>${userEmail}</td></tr>
        <tr><td>Plan</td><td>${planName}</td></tr>
        <tr><td>Connections</td><td>${connections}</td></tr>
        <tr><td>Payment</td><td>${paymentMethod}</td></tr>
        <tr>
          <td><strong>Total</strong></td>
          <td><strong>$${price}</strong></td>
        </tr>
      </table>

      <div style="margin-top:24px;text-align:center">
        <a href="${BASE_URL}/admin/orders/${orderId}"
           style="display:inline-block;
                  background:#ef4444;
                  color:#fff;
                  padding:12px 28px;
                  border-radius:8px;
                  font-weight:700;
                  text-decoration:none">
          🔎 View Order
        </a>
      </div>
    `;

    const result = await sendEmail(
      adminEmail,
      `🆕 New Order #${orderId}`,
      emailTemplate(content),
      []
    );
    
    if (!result.success) {
      console.error('❌ sendAdminNewOrderEmail failed:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Admin notification email sent successfully to:', adminEmail);
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendAdminNewOrderEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send admin notification email' };
  }
}

/* =======================
   NEW CHAT MESSAGE EMAIL
======================= */
export async function sendNewChatMessageEmail(params: {
  to: string;
  senderName: string;
  messagePreview: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND NEW CHAT MESSAGE EMAIL');
  console.log('   Params:', JSON.stringify(params, null, 2));
  console.log('========================================');
  
  try {
    const { to, senderName, messagePreview } = params;

    const content = `
      <h2 style="color:#1e293b">New Message from ${senderName}</h2>
      <p style="color:#475569">
        You have received a new message in your chat.
      </p>

      <div style="
        margin:24px 0;
        padding:24px;
        background:#f1f5f9;
        border-radius:12px;
        border-left: 4px solid #0ea5e9;
        font-style: italic;
        color:#475569">
        "${messagePreview}"
      </div>

      <div style="margin:32px 0;text-align:center">
        <a href="${CHAT_URL}"
           style="display:inline-block;
                  background:#0ea5e9;
                  color:#fff;
                  padding:14px 36px;
                  border-radius:10px;
                  font-weight:700;
                  font-size:16px;
                  text-decoration:none">
          💬 View Chat
        </a>
      </div>
    `;

    const result = await sendEmail(
      to,
      `New Chat Message from ${senderName}`,
      emailTemplate(content),
      []
    );
    
    if (!result.success) {
      console.error('❌ sendNewChatMessageEmail failed:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Chat message email sent successfully to:', to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ sendNewChatMessageEmail exception:', error);
    return { success: false, error: error?.message || 'Failed to send chat message email' };
  }
}

/* =======================
   TEST EMAIL FUNCTION (for debugging)
======================= */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  console.log('========================================');
  console.log('📧 SEND TEST EMAIL');
  console.log('   To:', to);
  console.log('========================================');
  
  const content = `
    <h2 style="color:#1e293b">Test Email ✅</h2>
    <p style="color:#475569">
      This is a test email from IPTV Premium.
    </p>
    <p style="color:#475569">
      If you received this email, your email configuration is working correctly!
    </p>
    <p style="color:#64748b;font-size:13px">
      Sent at: ${new Date().toISOString()}
    </p>
  `;

  return await sendEmail(
    to,
    'Test Email - IPTV Premium',
    emailTemplate(content),
    []
  ).then(result => {
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  });
}
