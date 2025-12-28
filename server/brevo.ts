import * as brevo from '@getbrevo/brevo';

/* =======================
   CONFIG
======================= */
const apiKey = process.env.BREVO_API_KEY!;
const senderEmail = process.env.BREVO_SENDER_EMAIL!;
const senderName = process.env.BREVO_SENDER_NAME!;

const BASE_URL = 'https://members.iptvtop.live';
const DASHBOARD_URL = `${BASE_URL}/dashboard`;
const CHAT_URL = `${BASE_URL}/chat`;

/* =======================
   BREVO INIT
======================= */
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  apiKey
);

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
   SEND EMAIL CORE
======================= */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
) {
  const email = new brevo.SendSmtpEmail();
  email.sender = { email: senderEmail, name: senderName };
  email.to = [{ email: to }];
  email.subject = subject;
  email.htmlContent = htmlContent;

  await apiInstance.sendTransacEmail(email);
}

/* =======================
   OTP EMAIL
======================= */
export async function sendOTPEmail(
  email: string,
  otp: string
) {
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

  await sendEmail(
    email,
    'Verify Your Email - IPTV Premium',
    emailTemplate(content)
  );
}

/* =======================
   ORDER CONFIRMATION (FIXED EXPORT)
======================= */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  connections: number;
  price: string;
  paymentMethod: string;
}) {
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

  await sendEmail(
    to,
    `Order Confirmation #${orderId}`,
    emailTemplate(content)
  );
}

/* =======================
   CREDENTIALS EMAIL (NO JSON)
======================= */
export async function sendCredentialsEmail(
  email: string,
  credentials: {
    type: 'xtream' | 'm3u' | 'portal';
    username?: string;
    password?: string;
    url?: string;
    m3uUrl?: string;
    portalUrl?: string;
    macAddress?: string;
    expiresAt: Date;
  }
) {
  let rows = '';

  if (credentials.type === 'xtream') {
    rows = `
      <tr><td>Server URL</td><td>${credentials.url}</td></tr>
      <tr><td>Username</td><td>${credentials.username}</td></tr>
      <tr><td>Password</td><td>${credentials.password}</td></tr>
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
           border-radius:12px">
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


  await sendEmail(
    email,
    'Your IPTV Credentials',
    emailTemplate(content)
  );
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
}) {
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

  await sendEmail(
    to,
    `Payment ${status} - Order #${orderId}`,
    emailTemplate(content)
  );
}
function viewCredentialsButton() {
  return `
    <div style="margin:28px 0;text-align:center">
      <a href="https://members.iptvtop.live/credentials"
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
