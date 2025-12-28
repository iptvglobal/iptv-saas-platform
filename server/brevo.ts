import * as brevo from '@getbrevo/brevo';

/* =======================
   ENV CONFIG
======================= */
const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME;

const appUrl =
  process.env.APP_URL ||
  'https://iptv-saas-platform-production.up.railway.app';

const chatUrl = `${appUrl}/dashboard/chat`;

if (!apiKey || !senderEmail || !senderName) {
  console.warn(
    '[Brevo] Email credentials missing. Emails will be disabled.'
  );
}

/* =======================
   BREVO CLIENT
======================= */
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  apiKey || ''
);

/* =======================
   TYPES
======================= */
export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/* =======================
   CHAT SUPPORT BLOCK
======================= */
function createChatSupportBlock(): string {
  return `
    <div style="margin-top:32px;padding:16px;background:#eef2ff;border-radius:8px;text-align:center">
      <p style="margin:0 0 12px;color:#1e293b;font-size:14px">
        Need help? Chat with our support team.
      </p>
      <a href="${chatUrl}"
         style="display:inline-block;background:#667eea;color:#fff;
                padding:10px 24px;border-radius:6px;text-decoration:none;
                font-weight:600;font-size:14px">
        Open Live Chat
      </a>
    </div>
  `;
}

/* =======================
   EMAIL TEMPLATE
======================= */
function createEmailTemplate(
  content: string,
  showDashboardButton = true
): string {
  const dashboardButton = showDashboardButton
    ? `
    <div style="text-align:center;margin:32px 0">
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);
         color:#fff;padding:14px 32px;border-radius:8px;
         text-decoration:none;font-weight:600;font-size:16px">
        Go to Dashboard
      </a>
    </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f9fc;font-family:Arial,sans-serif">
<table width="100%" style="padding:40px 20px">
<tr><td align="center">
<table width="600" style="background:#fff;border-radius:12px;overflow:hidden">

<tr>
<td style="padding:40px">
${content}
${createChatSupportBlock()}
</td>
</tr>

${
  showDashboardButton
    ? `<tr><td style="padding:0 40px 40px">${dashboardButton}</td></tr>`
    : ''
}

<tr>
<td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e9ecef">
<p style="margin:0;font-size:12px;color:#adb5bd">
© ${new Date().getFullYear()} IPTV Premium
</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/* =======================
   SEND EMAIL
======================= */
export async function sendEmail(
  params: SendEmailParams
): Promise<boolean> {
  if (!apiKey || !senderEmail || !senderName) return false;

  try {
    const email = new brevo.SendSmtpEmail();
    email.sender = { email: senderEmail, name: senderName };
    email.to = [{ email: params.to, name: params.toName || params.to }];
    email.subject = params.subject;
    email.htmlContent = params.htmlContent;
    email.textContent = params.textContent;

    await apiInstance.sendTransacEmail(email);
    return true;
  } catch (err: any) {
    console.error('[Brevo] Send failed:', err.message || err);
    return false;
  }
}

/* =======================
   OTP EMAIL
======================= */
export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<boolean> {
  const content = `
    <h2 style="margin:0 0 16px;color:#1e293b">
      Verify Your Email
    </h2>
    <p style="color:#64748b;font-size:15px">
      Use the code below to verify your account.
    </p>

    <div style="margin:24px 0;padding:24px;background:#f1f5f9;
                border-radius:8px;text-align:center">
      <div style="font-size:36px;font-weight:700;
                  letter-spacing:6px;color:#667eea">
        ${otp}
      </div>
      <p style="margin-top:12px;font-size:13px;color:#6b7280">
        Expires in 10 minutes
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - IPTV Premium',
    htmlContent: createEmailTemplate(content, false),
    textContent: `Your OTP: ${otp}\nLive chat: ${chatUrl}`
  });
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
}): Promise<boolean> {
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
    <h2 style="margin:0 0 12px;color:#1e293b">
      Order Confirmed 🎉
    </h2>
    <p style="color:#64748b">
      Hi <strong>${userName}</strong>, thanks for your purchase.
    </p>

    <div style="margin-top:24px;background:#f8f9fa;
                padding:20px;border-radius:8px">
      <p><strong>Order:</strong> #${orderId}</p>
      <p><strong>Plan:</strong> ${planName}</p>
      <p><strong>Connections:</strong> ${connections}</p>
      <p><strong>Payment:</strong> ${paymentMethod}</p>
      <p style="font-size:18px;font-weight:700;color:#667eea">
        Total: $${price}
      </p>
    </div>
  `;

  return sendEmail({
    to,
    toName: userName,
    subject: `Order Confirmation #${orderId}`,
    htmlContent: createEmailTemplate(content)
  });
}

/* =======================
   CREDENTIALS EMAIL
======================= */
export async function sendCredentialsEmail(
  email: string,
  credentials: {
    type: string;
    username?: string;
    password?: string;
    url?: string;
    m3uUrl?: string;
    portalUrl?: string;
    macAddress?: string;
    expiresAt: Date;
  }
): Promise<boolean> {
  const content = `
    <h2 style="margin:0 0 12px;color:#1e293b">
      Your IPTV Credentials 🔑
    </h2>

    <div style="margin-top:24px;background:#f8f9fa;
                padding:20px;border-radius:8px">
      <pre style="white-space:pre-wrap;font-size:14px">
${JSON.stringify(credentials, null, 2)}
      </pre>
    </div>

    <p style="margin-top:16px;color:#64748b;font-size:14px">
      Expires on ${credentials.expiresAt.toDateString()}
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Your IPTV Credentials',
    htmlContent: createEmailTemplate(content)
  });
}

/* =======================
   PAYMENT STATUS EMAIL
======================= */
export async function sendPaymentVerificationEmail(params: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  status: 'verified' | 'rejected';
}): Promise<boolean> {
  const { to, userName, orderId, planName, status } = params;

  const content =
    status === 'verified'
      ? `<h2>Payment Verified ✅</h2>
         <p>Your order #${orderId} is approved.</p>`
      : `<h2>Payment Rejected ❌</h2>
         <p>There was an issue with order #${orderId}.</p>`;

  return sendEmail({
    to,
    toName: userName,
    subject: `Payment ${status} - Order #${orderId}`,
    htmlContent: createEmailTemplate(content)
  });
}
