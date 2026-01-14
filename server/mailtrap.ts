import nodemailer from 'nodemailer';

/* ================= CONFIG ================= */
const mailtrapHost = process.env.MAILTRAP_HOST || 'live.smtp.mailtrap.io';
const mailtrapPort = Number(process.env.MAILTRAP_PORT || 2525);
const mailtrapUser = process.env.MAILTRAP_USER!;
const mailtrapPassword = process.env.MAILTRAP_PASSWORD!;

const senderEmail =
  process.env.MAILTRAP_SENDER_EMAIL ||
  'support@iptvtop.com';

const senderName =
  process.env.MAILTRAP_SENDER_NAME ||
  'IPTV Premium';

const BASE_URL =
  process.env.VITE_APP_URL ||
  process.env.APP_URL ||
  'https://members.iptvtop.live';

/* ================= TRANSPORT ================= */
const transporter = nodemailer.createTransport({
  host: mailtrapHost,
  port: mailtrapPort,
  secure: mailtrapPort === 465,
  auth: {
    user: mailtrapUser,
    pass: mailtrapPassword,
  },
});

/* ================= HELPERS ================= */
function emailButton(label: string, url: string) {
  return `
  <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:32px auto">
    <tr>
      <td bgcolor="#4f46e5" style="border-radius:10px">
        <a href="${url}"
           style="display:inline-block;padding:14px 36px;color:#fff;text-decoration:none;font-weight:600;border-radius:10px">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function emailTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f8fafc;font-family:Arial">
  <table width="100%">
    <tr><td align="center">
      <table width="600" style="background:white;border-radius:12px;margin:20px">
        <tr>
          <td style="background:#4f46e5;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0">
            <h1>IPTV Premium</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">${content}</td>
        </tr>
        <tr>
          <td style="text-align:center;font-size:12px;color:#64748b;padding:16px">
            © ${new Date().getFullYear()} IPTV Premium
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!to || !to.includes('@')) {
    throw new Error('Invalid email');
  }

  return transporter.sendMail({
    from: `${senderName} <${senderEmail}>`,
    to,
    subject,
    html,
  });
}

/* ================= EXPORTS ================= */

/* OTP */
export async function sendOTPEmail(email: string, otp: string) {
  return sendEmail(
    email,
    'Your OTP Code',
    emailTemplate(`
      <h2>Your OTP 🔐</h2>
      <div style="font-size:32px;font-weight:700">${otp}</div>
    `)
  );
}

/* ORDER CONFIRMATION */
export async function sendOrderConfirmationEmail(data: any) {
  return sendEmail(
    data.to,
    'Order Confirmation',
    emailTemplate(`
      <h2>Order Confirmed ✅</h2>
      ${emailButton('Open Dashboard', `${BASE_URL}/dashboard`)}
    `)
  );
}

/* ADMIN ORDER */
export async function sendAdminNewOrderEmail(data: any) {
  return sendEmail(
    process.env.ADMIN_NOTIFICATION_EMAIL || senderEmail,
    `New Order #${data.orderId}`,
    emailTemplate(`
      <h2>New Order 📦</h2>
      <p>User: ${data.userEmail}</p>
    `)
  );
}

/* PAYMENT */
export async function sendPaymentVerificationEmail(data: any) {
  return sendEmail(
    data.to,
    `Payment ${data.status}`,
    emailTemplate(`
      <h2>Payment ${data.status}</h2>
      ${emailButton('Dashboard', `${BASE_URL}/dashboard`)}
    `)
  );
}

/* CREDENTIALS */
export async function sendCredentialsEmail(email: string, credentials: any) {
  return sendEmail(
    email,
    'Your IPTV Credentials',
    emailTemplate(`
      <h2>Your Credentials 🔑</h2>
      ${emailButton('View Credentials', `${BASE_URL}/dashboard`)}
    `)
  );
}

/* CHAT */
export async function sendNewChatMessageEmail(data: any) {
  return sendEmail(
    data.to,
    'New Message',
    emailTemplate(`
      <h2>New Message 💬</h2>
      <p>${data.message}</p>
      ${emailButton('Open Chat', `${BASE_URL}/chat`)}
    `)
  );
}

/* TEST */
export async function sendTestEmail(to: string) {
  return sendEmail(
    to,
    'Test Email',
    emailTemplate(`<h2>Email works ✅</h2>`)
  );
}
