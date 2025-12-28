# Disable Supabase Automatic Confirmation Emails

You're receiving **two emails** when users sign up:
1. ✅ **OTP Email from Brevo** (IPTV TOP) - This is the one you want
2. ❌ **Confirmation Email from Supabase** - This needs to be disabled

## Solution: Disable Supabase Email Confirmations

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project at https://supabase.com
2. Click on **Authentication** in the left sidebar
3. Click on **Email Templates**

### Step 2: Disable Email Confirmation

1. In the Authentication settings, look for **Email Auth**
2. Find the setting **"Confirm email"** or **"Enable email confirmations"**
3. **Turn it OFF** (disable it)

### Alternative: Use Custom SMTP (Recommended)

If you can't find the disable option, you can configure Supabase to use your Brevo SMTP instead:

1. Go to **Project Settings** → **Auth**
2. Scroll down to **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter your Brevo SMTP credentials:
   - **Host**: `smtp-relay.brevo.com` (or `smtp-relay.sendinblue.com`)
   - **Port**: `587`
   - **Username**: Your Brevo SMTP username
   - **Password**: Your Brevo SMTP password (API key)
   - **Sender email**: Your verified sender email
   - **Sender name**: IPTV Premium

5. **Disable** the confirmation email template or leave it blank

### Step 3: Verify

1. Create a new test account
2. You should now receive **only ONE email** (the OTP from Brevo)
3. The Supabase confirmation email should no longer be sent

---

## Why This Happens

Supabase has built-in email confirmation enabled by default. When you call `signUp()`, it automatically sends a confirmation email. Since we're handling email verification manually with OTP codes via Brevo, we don't need Supabase's automatic emails.

---

## Current Setup

The platform now uses:
- ✅ **Brevo** for OTP verification emails (custom, branded)
- ❌ **Supabase** automatic emails (should be disabled)

After disabling Supabase emails, users will only receive the branded OTP email from "IPTV TOP" via Brevo.
