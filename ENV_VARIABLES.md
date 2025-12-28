# Environment Variables for IPTV SaaS Platform

This document lists all required environment variables for deploying the IPTV SaaS platform to Railway or other hosting providers.

## Database Configuration

### `DATABASE_URL` (Required)
PostgreSQL database connection string (Supabase uses PostgreSQL).

**Format:**
```
postgresql://username:password@host:port/database
```

**Example (Supabase):**
```
postgresql://postgres.xkmpxjemlpvqsxscxbmk:password@aws-1-ca-central-1.pooler.supabase.com:5432/postgres
```

**Note:** Use the Supabase "Session Pooler" connection string for production deployments.

## Authentication & Security

### `JWT_SECRET` (Required)
Secret key for signing JWT tokens and session cookies.

**Example:**
```
your-super-secret-jwt-key-change-this-in-production
```

**Generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Supabase Configuration

### `SUPABASE_URL` (Required)
Your Supabase project URL.

**Example:**
```
https://your-project.supabase.co
```

### `SUPABASE_ANON_KEY` (Required)
Supabase anonymous/public API key (safe for client-side use).

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `SUPABASE_SERVICE_KEY` (Required)
Supabase service role key (server-side only, has admin privileges).

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Brevo SMTP Configuration (Optional)

Brevo is used for sending transactional emails (order confirmations, credential delivery, etc.). If not configured, email notifications will be disabled but the platform will still function.

### `BREVO_API_KEY` (Optional)
Brevo (formerly Sendinblue) API key for sending transactional emails.

**Example:**
```
xkeysib-abc123...
```

### `BREVO_SENDER_EMAIL` (Optional)
Email address to use as sender for all outgoing emails. Must be verified in Brevo dashboard.

**Example:**
```
noreply@yourdomain.com
```

### `BREVO_SENDER_NAME` (Optional)
Display name for the email sender.

**Example:**
```
IPTV Premium Support
```

## Application Configuration

### `VITE_APP_TITLE` (Optional)
Application title displayed in browser tab and navigation.

**Default:** `IPTV SaaS Platform`

**Example:**
```
IPTV Premium
```

### `VITE_APP_LOGO` (Optional)
URL to application logo image.

**Example:**
```
https://yourdomain.com/logo.png
```

## Server Configuration

### `PORT` (Optional)
Port number for the Express server.

**Default:** `3000`

**Example:**
```
8080
```

### `NODE_ENV` (Optional)
Node environment mode.

**Values:** `development` | `production`

**Default:** `production`

## Railway-Specific Configuration

Railway automatically provides some environment variables:

- `RAILWAY_ENVIRONMENT` - Current environment name
- `RAILWAY_PROJECT_ID` - Project identifier
- `RAILWAY_SERVICE_NAME` - Service name

## Setting Environment Variables on Railway

1. Go to your Railway project dashboard
2. Select your service
3. Click on "Variables" tab
4. Add each environment variable listed above
5. Click "Deploy" to apply changes

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different credentials** for development and production
3. **Rotate secrets regularly** (JWT_SECRET, API keys)
4. **Use strong passwords** for database connections
5. **Enable SSL/TLS** for database connections in production
6. **Restrict SUPABASE_SERVICE_KEY** to server-side code only

## Testing Configuration

To test your configuration locally:

1. Create a `.env` file in the project root
2. Copy all required variables from this document
3. Fill in your actual values
4. Run `pnpm dev` to start the development server
5. Check console for any missing or invalid variables

## Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` format is correct
- Ensure database server is accessible from Railway
- Check if SSL is required and configured properly

### Email Sending Failures
- Verify `BREVO_API_KEY` is valid and active
- Check `BREVO_SENDER_EMAIL` is verified in Brevo dashboard
- Ensure sender email matches verified domain

### Authentication Issues
- Verify `SUPABASE_URL` and keys are correct
- Check if Supabase project is active
- Ensure `JWT_SECRET` is set and consistent across deployments

## Support

For deployment assistance, contact the development team or refer to:
- [Railway Documentation](https://docs.railway.app/)
- [Supabase Documentation](https://supabase.com/docs)
- [Brevo API Documentation](https://developers.brevo.com/)
