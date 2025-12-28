# Modern Email Templates 📧

## Overview

All email templates have been redesigned with a modern, clean, and professional look. Each email includes a **"Go to Dashboard"** button that links directly to the user's account dashboard.

## Design Features

✨ **Modern & Clean Design**
- Gradient header with IPTV Premium branding
- Light color scheme with professional typography
- Rounded corners and subtle shadows
- Mobile-responsive layout

🎨 **Visual Elements**
- Purple gradient header (#667eea to #764ba2)
- Clean white content area
- Subtle gray footer
- Icon-based status indicators

🔘 **Dashboard Button**
- Prominent gradient button in every email
- Direct link to user dashboard
- Easy one-click access to account

## Email Types

### 1. OTP Verification Email
**Sent when:** User signs up for a new account

**Features:**
- Large, easy-to-read verification code
- 10-minute expiration notice
- Security tip for unrecognized requests
- No dashboard button (user not logged in yet)

**Subject:** `Verify Your Email - IPTV Premium`

---

### 2. Order Confirmation Email
**Sent when:** User places a new order

**Features:**
- Order details table (Order ID, Plan, Connections, Payment Method, Total)
- Clear pricing display
- Status update information
- **Dashboard button** to track order

**Subject:** `Order Confirmation #[ORDER_ID] - IPTV Premium`

---

### 3. Payment Verification Email
**Sent when:** Admin verifies or rejects payment

**Features:**
- Visual status indicator (✓ for verified, ✗ for rejected)
- Order summary
- Next steps information
- **Dashboard button** to view order status

**Subjects:**
- Verified: `Payment Verified ✓ - Order #[ORDER_ID]`
- Rejected: `Payment Issue - Order #[ORDER_ID]`

---

### 4. Credentials Delivery Email
**Sent when:** IPTV credentials are ready

**Features:**
- Credential type (Xtream Codes, M3U, or Portal)
- All access details in organized table
- Expiration date
- Security warning
- **Dashboard button** to manage credentials

**Subject:** `Your IPTV Credentials - IPTV Premium`

**Supported credential types:**
- **Xtream Codes**: Server URL, Username, Password
- **M3U Playlist**: M3U URL, EPG URL
- **Portal**: Portal URL, MAC Address

---

## Configuration

### Environment Variables

Add this to your Railway environment variables:

```
APP_URL=https://your-domain.com
```

If not set, it defaults to: `https://iptv-saas-platform-production.up.railway.app`

### Email Service

All emails are sent via **Brevo** (formerly Sendinblue). Make sure these variables are set:

```
BREVO_API_KEY=your_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=IPTV Premium
```

---

## Template Structure

All emails follow this structure:

```
┌─────────────────────────────────────┐
│  Gradient Header (Purple)           │
│  - IPTV Premium Logo                │
│  - Tagline                          │
├─────────────────────────────────────┤
│  White Content Area                 │
│  - Heading                          │
│  - Message                          │
│  - Data Table (if applicable)      │
│  - Info Box                         │
├─────────────────────────────────────┤
│  Dashboard Button (if applicable)   │
│  [Go to Dashboard]                  │
├─────────────────────────────────────┤
│  Gray Footer                        │
│  - Support contact                  │
│  - Copyright                        │
└─────────────────────────────────────┘
```

---

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary Gradient | `#667eea` → `#764ba2` | Header, buttons |
| Background | `#f7f9fc` | Email background |
| Content BG | `#ffffff` | Main content area |
| Text Primary | `#1e293b` | Headings, important text |
| Text Secondary | `#64748b` | Body text |
| Text Muted | `#6c757d` | Labels, footer |
| Success | `#10b981` | Verified status |
| Error | `#ef4444` | Rejected status |
| Warning | `#ffc107` | Security notices |
| Info | `#0d6efd` | Information boxes |

---

## Testing

To test the email templates:

1. Sign up for a new account → Receive OTP email
2. Place an order → Receive order confirmation email
3. Admin verifies payment → Receive payment verification email
4. Admin delivers credentials → Receive credentials email

All emails will include the "Go to Dashboard" button (except OTP email).

---

## Customization

To customize the email templates, edit `/server/brevo.ts`:

- **Change colors**: Update the inline styles in `createEmailTemplate()`
- **Modify button text**: Change "Go to Dashboard" text
- **Update branding**: Modify the header SVG icon and text
- **Add/remove sections**: Edit individual email functions

---

## Browser Compatibility

The email templates are tested and work in:
- ✅ Gmail (Desktop & Mobile)
- ✅ Outlook (Desktop & Web)
- ✅ Apple Mail (macOS & iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird

---

## Support

For email delivery issues:
1. Check Brevo API credentials
2. Verify sender email is verified in Brevo
3. Check Railway logs for email errors
4. Test Brevo connection using the test endpoint

Need help? Contact support at your configured support email.
