/**
 * Mailtrap Email Service – IPTV SaaS
 * Fully compatible with Gmail, Outlook, Apple Mail
 */

import nodemailer from 'nodemailer';

/* =======================
   CONFIG
======================= */
const mailtrapHost = process.env.MAILTRAP_HOST || 'live.smtp.mailtrap.io';
const mailtrapPort = Number(process.env.MAILTRAP_PORT || 2525);
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

const BASE_URL =
  process.env.VITE_APP_URL ||
  process.env.APP_URL ||
  'https://members.iptvtop.live';

/* =======================
   TRANSPORTER
======================= */
const transporter = nodemailer.createTransport({
  host: mailtrapHost,
  port: mailtrapPort,
  secure: mailtrapPort === 465,
  auth: {
    user: mailtrapUser,
    pass: mailtrapPassword,
  },
});

transporter.verify(err => {
  if (err) console.error('❌ SMTP Error:', err);
  else console.log('✅ SMTP Ready');
});

/* =======================
   BUTTON (EMAIL SAFE)
======================= */
function emailButton(label: string, url: string) {
  return `
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:32px auto">
      <tr>
        <td bgcolor="#4f46e5" style="border-radius:10px">
          <a href="${url}"
             target="_blank"
             style="
               display:inline-block;
               padding:14px 36px;
               color:#ffffff;
               font-size:16px;
               font-weight:600;
               text-decoration:none;
               border-radius:10px;
               font-family:Arial,Helvetica,sans-serif;
             ">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/* =======================
   EMAIL TEMPLATE
======================= */
function emailTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
</head>
<body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="margin:20px auto">
          <tr>
            <td style="background:#4f46e5;color:white;padding:28px;text-align:center;border-radius:12px 12px 0 0">
              <h1 style="margin:0;font-size:24px">IPTV Premium</h1>
            </td>
          </tr>
          <tr>
            <td style="background:white;padding:32px;border-radius:0 0 12px 12px">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="text-align:center;font-size:12px;color:#64748b;padding:20px">
              © ${new Date().getFullYear()} IPTV Premium — Do not reply
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

/* =======================
   CORE SEND FUNCTION
======================= */
async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid email' };
  }

  const info = await transporter.sendMail({
    from: `${senderName} <${senderEmail}>`,
    to,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId };
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
) {
  let rows = '';

  if (credentials.username)
    rows += `<tr><td><b>Username</b></td><td>${credentials.username}</td></tr>`;
  if (credentials.password)
    rows += `<tr><td><b>Password</b></td><td>${credentials.password}</td></tr>`;
  if (credentials.url)
    rows += `<tr><td><b>Server URL</b></td><td>${credentials.url}</td></tr>`;
  if (credentials.m3uUrl)
    rows += `<tr><td><b>M3U URL</b></td><td>${credentials.m3uUrl}</td></tr>`;
  if (credentials.portalUrl)
    rows += `<tr><td><b>Portal</b></td><td>${credentials.portalUrl}</td></tr>`;
  if (credentials.macAddress)
    rows += `<tr><td><b>MAC</b></td><td>${credentials.macAddress}</td></tr>`;

  const content = `
<h2>Your IPTV Credentials 🔑</h2>
<p>Your subscription is active.</p>

${emailButton('View Credentials', `${BASE_URL}/dashboard`)}

<table width="100%" cellpadding="10" style="border-collapse:collapse;background:#f8fafc">
  ${rows}
  <tr>
    <td><b>Expires</b></td>
    <td style="color:#4f46e5;font-weight:700">
      ${credentials.expiresAt.toDateString()}
    </td>
  </tr>
</table>

<p style="font-size:13px;color:#64748b;margin-top:16px">
⚠️ Do not share your credentials
</p>
`;

  return await sendEmail(
    email,
    'Your IPTV Credentials',
    emailTemplate(content)
  );
}

/* =======================
   NEW CHAT MESSAGE EMAIL
======================= */
export async function sendNewChatMessageEmail(data: {
  to: string;
  userName: string;
  message: string;
}) {
  const safeMessage = data.message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const content = `
<h2>New Message 💬</h2>
<p>Hi ${data.userName},</p>
<p>You have received a new support message:</p>

<div style="background:#f1f5f9;padding:16px;border-left:4px solid #4f46e5">
  "${safeMessage}"
</div>

${emailButton('Open Chat', `${BASE_URL}/chat`)}

<p style="font-size:13px;color:#64748b">
Reply via your dashboard
</p>
`;

  return await sendEmail(
    data.to,
    'New Support Message - IPTV Premium',
    emailTemplate(content)
  );
}
