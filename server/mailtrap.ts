/**
 * Mailtrap Email Service
 * Handles all transactional emails via Mailtrap SMTP
 */

import nodemailer from 'nodemailer';

/* ======================= CONFIG ======================= */

const mailtrapHost = process.env.MAILTRAP_HOST || 'live.smtp.mailtrap.io';
const mailtrapPort = parseInt(process.env.MAILTRAP_PORT || '2525', 10);
const mailtrapUser = process.env.MAILTRAP_USER;
const mailtrapPassword = process.env.MAILTRAP_PASSWORD;

const senderEmail =
  process.env.MAILTRAP_SENDER_EMAIL ||
  process.env.BREVO_SENDER_EMAIL ||
  'noreply@iptv.com';

const senderName =
  process.env.MAILTRAP_SENDER_NAME ||
  process.env.BREVO_SENDER_NAME ||
  'IPTV Premium';

/* ======================= STARTUP LOGS ======================= */

console.log('========================================');
console.log('📧 MAILTRAP EMAIL SERVICE');
console.log('========================================');
console.log('Host:', mailtrapHost);
console.log('Port:', mailtrapPort);
console.log(
  'User:',
  mailtrapUser ? `✓ Set (${mailtrapUser.substring(0, 6)}***)` : '✗ MISSING'
);
console.log(
  'Password:',
  mailtrapPassword ? '✓ Set' : '✗ MISSING'
);
console.log('Sender Email:', senderEmail);
console.log('Sender Name:', senderName);
console.log('========================================');

if (!mailtrapUser || !mailtrapPassword) {
  console.error('❌ MAILTRAP_USER or MAILTRAP_PASSWORD is missing');
}

/* ======================= TRANSPORTER ======================= */

const transporter = nodemailer.createTransport({
  host: mailtrapHost,
  port: mailtrapPort,
  secure: mailtrapPort === 465,
  auth: {
    user: mailtrapUser,
    pass: mailtrapPassword,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Mailtrap connection failed:', error);
  } else {
    console.log('✅ Mailtrap SMTP verified');
  }
});

/* ======================= HELPERS ======================= */

const baseUrl =
  process.env.VITE_APP_URL ||
  process.env.APP_URL ||
  'https://members.iptvprovider8k.com';

function dashboardButton(): string {
  return `
    <div style="margin:32px 0;text-align:center">
      <a href="${baseUrl}/dashboard"
        style="background:#4f46e5;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">
        View Dashboard
      </a>
    </div>
  `;
}

function credentialsButton(): string {
  return `
    <div style="margin:32px 0;text-align:center">
      <a href="${baseUrl}/credentials"
        style="background:#4f46e5;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">
        View Credentials
      </a>
    </div>
  `;
}

function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: Arial, sans-serif; background:#f8fafc; }
.container { max-width:600px; margin:auto; }
.header {
  background:linear-gradient(135deg,#4f46e5,#7c3aed);
  color:white; padding:24px; text-align:center;
}
.body { background:white; padding:24px; }
.footer { text-align:center; font-size:12px; color:#64748b; margin-top:24px; }
table { width:100%; border-collapse:collapse; }
td { padding:8px; border-bottom:1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h2>IPTV Premium</h2>
  </div>
  <div class="body">
    ${content}
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} IPTV Premium
  </div>
</div>
</body>
</html>
`;
}

/* ======================= CORE SEND ======================= */

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!to || !to.includes('@')) {
      return { success: false, error: 'Invalid recipient email' };
    }

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent to', to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
}

/* ======================= OTP EMAIL ======================= */

export async function sendOTPEmail(email: string, otp: string) {
  const content = `
    <h2>Your OTP Code 🔐</h2>
    <p>This code expires in 10 minutes.</p>
    <div style="font-size:36px;font-weight:bold;text-align:center">${otp}</div>
  `;
  return sendEmail(email, 'Your OTP Code', emailTemplate(content));
}

/* ======================= ORDER CONFIRM ======================= */

export async function sendOrderConfirmationEmail(data: {
  to: string;
  userName: string;
  orderId: number;
  planName: string;
  connections: number;
  price: string;
  paymentMethod: string;
}) {
  const content = `
    <h2>Order Confirmed ✅</h2>
    <p>Hi ${data.userName},</p>
    ${dashboardButton()}
    <table>
      <tr><td>Order</td><td>#${data.orderId}</td></tr>
      <tr><td>Plan</td><td>${data.planName}</td></tr>
      <tr><td>Connections</td><td>${data.connections}</td></tr>
      <tr><td>Price</td><td>${data.price}</td></tr>
      <tr><td>Payment</td><td>${data.paymentMethod}</td></tr>
    </table>
  `;
  return sendEmail(
    data.to,
    'Order Confirmation - IPTV Premium',
    emailTemplate(content)
  );
}

/* ======================= CREDENTIALS ======================= */

export async function sendCredentialsEmail(
  email: string,
  credentials: {
    type: string;
    username?: string;
    password?: string;
    url?: string;
    m3uUrl?: string;
    macAddress?: string;
    expiresAt: Date;
  }
) {
  let rows = '';

  if (credentials.username) {
    rows += `<tr><td>Username</td><td>${credentials.username}</td></tr>`;
  }
  if (credentials.password) {
    rows += `<tr><td>Password</td><td>${credentials.password}</td></tr>`;
  }
  if (credentials.url) {
    rows += `<tr><td>URL</td><td>${credentials.url}</td></tr>`;
  }
  if (credentials.m3uUrl) {
    rows += `<tr><td>M3U</td><td>${credentials.m3uUrl}</td></tr>`;
  }
  if (credentials.macAddress) {
    rows += `<tr><td>MAC</td><td>${credentials.macAddress}</td></tr>`;
  }

  rows += `<tr><td>Expires</td><td>${credentials.expiresAt.toDateString()}</td></tr>`;

  const content = `
    <h2>Your IPTV Credentials 🔑</h2>
    ${credentialsButton()}
    <table>${rows}</table>
  `;

  return sendEmail(email, 'Your IPTV Credentials', emailTemplate(content));
}

/* ======================= TEST ======================= */

export async function sendTestEmail(to: string) {
  const content = `<h2>Test Email ✅</h2><p>Email system working.</p>`;
  return sendEmail(to, 'Test Email', emailTemplate(content));
}
