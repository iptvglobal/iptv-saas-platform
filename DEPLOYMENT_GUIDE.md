# IPTV SaaS Platform Deployment Guide

This guide provides comprehensive instructions for deploying the updated IPTV SaaS platform to Railway. The platform has been migrated from Manus Auth to Supabase Auth with OTP email verification.

## Summary of Changes

- **Authentication:** Replaced the original Manus OAuth with a complete Supabase authentication system. Users now sign up and sign in using email and password, with a one-time password (OTP) sent to their email for verification.
- **Deployment Fixes:** Resolved the critical deployment error on Railway caused by incorrect path resolution in the production build. The build process is now stable.
- **Database:** Removed hardcoded database credentials. The application now correctly uses the `DATABASE_URL` environment variable.
- **Code Cleanup:** Removed obsolete files and dependencies related to Manus Auth, resulting in a cleaner and more maintainable codebase.

## 1. Supabase Project Setup

Before deploying to Railway, you need to configure your Supabase project correctly.

### 1.1. Enable Email/Password Authentication

1.  Go to your Supabase project dashboard.
2.  Navigate to **Authentication** -> **Providers**.
3.  Enable the **Email** provider. It is enabled by default.

### 1.2. Disable Supabase-handled Email Verification

Since the application now handles email verification manually by sending an OTP code, you must disable Supabase's automatic verification emails to avoid sending duplicate or conflicting messages to users.

1.  Navigate to **Authentication** -> **Settings**.
2.  Find the **Email Templates** section.
3.  The "Confirm signup" template is used for email verification. We cannot disable it directly, but by handling the signup flow manually with `supabaseClient.auth.signUp` and not providing an `emailRedirectTo` option, we prevent Supabase from sending this email. The current code already does this, so no further action is needed here.

### 1.3. Get Supabase Credentials

You will need the following credentials for your environment variables:

1.  **Project URL:**
    - Go to **Project Settings** -> **API**.
    - Copy the **Project URL**.
2.  **Anonymous (public) Key:**
    - Go to **Project Settings** -> **API**.
    - Copy the `anon` `public` key from the **Project API Keys** section.
3.  **Service Role (secret) Key:**
    - Go to **Project Settings** -> **API**.
    - Copy the `service_role` `secret` key from the **Project API Keys** section. **Treat this like a password and never expose it on the client-side.**
4.  **Database Connection String (for Railway):**
    - Go to **Project Settings** -> **Database**.
    - Under **Connection string**, select the **URI** tab.
    - Copy the connection string. It will look like `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`.

## 2. Railway Deployment

Follow these steps to deploy the application on Railway.

### 2.1. Create a New Project

1.  Go to your Railway dashboard.
2.  Create a new project by selecting **Deploy from GitHub repo**.
3.  Choose your forked repository for this project.

### 2.2. Configure Environment Variables

In your Railway service, navigate to the **Variables** tab and add the following environment variables. **Do not use the old `pasted_content.txt` variables as they are outdated.**

| Variable Name          | Description                                                                 | Example Value                                                              |
| ---------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`         | The full PostgreSQL connection string from your Supabase project settings.  | `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`               |
| `SUPABASE_URL`         | Your Supabase project URL.                                                  | `https://your-project-id.supabase.co`                                      |
| `SUPABASE_ANON_KEY`    | The public anonymous key for your Supabase project.                         | `eyJhbGciOiJIUzI1NiIsIn...`                                                |
| `SUPABASE_SERVICE_KEY` | The secret service role key for your Supabase project.                      | `eyJhbGciOiJIUzI1NiIsIn...`                                                |
| `JWT_SECRET`           | A long, random string for signing session tokens.                           | `generate-a-secure-random-string-for-this`                                 |
| `BREVO_API_KEY`        | (Optional) Your API key from Brevo (formerly Sendinblue) for sending emails. | `xkeysib-abc123...`                                                        |
| `BREVO_SENDER_EMAIL`   | (Optional) The verified email address you use to send emails from Brevo.    | `noreply@yourdomain.com`                                                   |
| `BREVO_SENDER_NAME`    | (Optional) The name that appears as the sender in emails.                   | `IPTV Premium Support`                                                     |

**To generate a secure `JWT_SECRET`**, you can run this command in your terminal:
`node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"`

### 2.3. Check Deployment Settings

Railway will automatically detect the `railway.json` file and configure the build and deploy commands. You should verify the following settings in the **Settings** tab of your service:

-   **Build Method:** `Nixpacks`
-   **Build Command:** `pnpm install --no-frozen-lockfile && pnpm build`
-   **Start Command:** `pnpm start`
-   **Healthcheck Path:** `/api/trpc/system.health` (or `/health`)

These settings are now correctly configured in the `railway.json` file in the repository, so you should not need to change them manually.

### 2.4. Trigger Deployment

Once the environment variables are set, Railway will automatically trigger a new deployment. You can monitor the build and deploy logs to ensure everything is working correctly. The deployment should now complete without the previous errors.

Congratulations! Your IPTV SaaS platform is now deployed and running with Supabase authentication.
