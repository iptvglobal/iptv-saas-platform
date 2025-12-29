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
async function sendEmail(to: string, subject: string, htmlContent: string) {
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
export async function sendOTPEmail(email: string, otp: string) {
  const content = `
    <h2>Verify Your Email</h2>
    <p>Use the code below:</p>
    <div style="font-size:36px;font-weight:800">${otp}</div>
  `;

  await sendEmail(email, 'Verify Your Email', emailTemplate(content));
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
}) {
  const { to, userName, orderId, planName, connections, price, paymentMethod } = params;

  const content = `
    <h2>Order Confirmed 🎉</h2>
    <p>Hi ${userName}, your order is confirmed.</p>
    <p><b>Order:</b> #${orderId}</p>
    <p><b>Plan:</b> ${planName}</p>
    <p><b>Connections:</b> ${connections}</p>
    <p><b>Total:</b> $${price}</p>
  `;

  await sendEmail(to, `Order Confirmation #${orderId}`, emailTemplate(content));
}

/* =======================
   ADMIN NEW ORDER (FIXED)
======================= */
export async function sendAdminNewOrderEmail(params: {
  orderId: number;
  userEmail: string;
  planName: string;
  connections: number;
  price: string;
  paymentMethod: string;
}) {
  const ADMIN_EMAILS = [
    { email: 'support@iptvtop.live' },
    { email: 'soay300@gmail.com' }
  ];

  const { orderId, userEmail, planName, connections, price, paymentMethod } = params;

  const content = `
    <h2>🆕 New Order Received</h2>
    <p><b>Order:</b> #${orderId}</p>
    <p><b>User:</b> ${userEmail}</p>
    <p><b>Plan:</b> ${planName}</p>
    <p><b>Connections:</b> ${connections}</p>
    <p><b>Total:</b> $${price}</p>

    <a href="${BASE_URL}/admin/orders/${orderId}">
      🔎 View Order
    </a>
  `;

  const email = new brevo.SendSmtpEmail();
  email.sender = { email: senderEmail, name: senderName };
  email.to = ADMIN_EMAILS;
  email.subject = `🆕 New Order #${orderId}`;
  email.htmlContent = emailTemplate(content);

  await apiInstance.sendTransacEmail(email);
}
