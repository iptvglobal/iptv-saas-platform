# IPTV SaaS Platform - Deployment Guide

This guide will help you deploy the IPTV SaaS platform to Railway or other hosting providers.

## Prerequisites

- Railway account (or other hosting provider)
- MySQL/TiDB database
- Supabase account
- Brevo account for email delivery
- Domain name (optional, Railway provides free subdomain)

## Quick Deploy to Railway

### Step 1: Create a New Project

1. Go to [Railway](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo" or "Empty Project"

### Step 2: Add MySQL Database

1. In your Railway project, click "New"
2. Select "Database" → "MySQL"
3. Railway will provision a MySQL database and provide connection details

### Step 3: Configure Environment Variables

Go to your service settings → Variables tab and add all required environment variables from `ENV_VARIABLES.md`:

**Minimum Required Variables (Core Functionality):**
```
DATABASE_URL=postgresql://user:pass@host:port/database
JWT_SECRET=your-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NODE_ENV=production
```

**Optional Variables (Email Notifications):**
```
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=IPTV Premium
```

**Note:** The platform will work without Brevo credentials, but email notifications (order confirmations, credential delivery) will be disabled.

### Step 4: Deploy

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Node.js project
3. It will run `pnpm install && pnpm build`
4. Then start the server with `pnpm start`
5. Your app will be live at `https://your-app.up.railway.app`

## Database Setup

After deployment, you need to initialize the database:

1. Railway will automatically run migrations on first deploy
2. The `pnpm db:push` command creates all necessary tables
3. Check Railway logs to ensure migrations completed successfully

## Post-Deployment Steps

### 1. Create Admin User

The first user to register will automatically become an admin if their email matches the owner email in the system.

### 2. Configure Subscription Plans

1. Log in as admin
2. Go to Admin → Plans
3. Create your IPTV subscription plans with pricing

### 3. Add Payment Methods

1. Go to Admin → Payment Methods
2. Add manual payment methods (PayPal, Bank Transfer, etc.)
3. Configure instructions and payment links

### 4. Add NowPayments Widgets

1. Go to Admin → Payment Widgets
2. Get invoice IDs from NowPayments dashboard
3. Assign widgets to specific plans and connection ranges

### 5. Test the Platform

1. Create a test order as a regular user
2. Verify payment confirmation works
3. Check admin can see and verify orders
4. Test IPTV credential delivery

## Troubleshooting

### pnpm Lockfile Configuration Mismatch

If you encounter this error during Railway deployment:
```
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH  Cannot proceed with the frozen installation.
The current "overrides" configuration doesn't match the value found in the lockfile
```

**Solution:** The `railway.json` file has been configured to use `--no-frozen-lockfile` flag:
```json
{
  "build": {
    "buildCommand": "pnpm install --no-frozen-lockfile && pnpm build"
  }
}
```

This allows Railway to regenerate the lockfile during build if there are any configuration mismatches.

### Database Connection Issues

If the app fails to connect to the database:
1. Verify `DATABASE_URL` is correctly set in Railway environment variables
2. Ensure the database is using PostgreSQL (not MySQL) for Supabase
3. Check Railway logs for specific connection errors
4. Verify Supabase project is not paused (free tier auto-pauses after inactivity)

### Build Failures

If the build fails:
1. Check Railway build logs for specific errors
2. Verify all environment variables are set
3. Ensure `pnpm-lock.yaml` is committed to your repository
4. Try triggering a manual redeploy

## Custom Domain Setup

### On Railway:

1. Go to Settings → Domains
2. Click "Add Domain"
3. Enter your custom domain
4. Add the provided CNAME record to your DNS provider
5. Wait for DNS propagation (usually 5-15 minutes)

## Monitoring & Logs

### Railway Logs:

1. Go to your service in Railway dashboard
2. Click "Logs" tab
3. Monitor application logs in real-time
4. Filter by log level (info, warn, error)

### Health Checks:

Railway automatically monitors your app's health:
- HTTP endpoint checks
- Process monitoring
- Automatic restarts on failure

## Scaling

### Vertical Scaling (Railway):

1. Go to Settings → Resources
2. Adjust CPU and RAM allocation
3. Changes apply on next deployment

### Horizontal Scaling:

For high traffic, consider:
- Load balancer in front of multiple instances
- Read replicas for database
- CDN for static assets

## Backup & Recovery

### Database Backups:

1. Railway provides automatic daily backups
2. Manual backups: Use Railway CLI or dashboard
3. Export data regularly for off-site storage

### Application Backups:

1. Keep your Git repository up to date
2. Tag releases for easy rollback
3. Document configuration changes

## Troubleshooting

### App Won't Start

**Check:**
- All environment variables are set correctly
- Database connection string is valid
- Build completed without errors
- Check Railway logs for specific error messages

### Database Connection Errors

**Solutions:**
- Verify `DATABASE_URL` format
- Ensure SSL is configured if required
- Check database is running and accessible
- Test connection from Railway CLI

### Email Not Sending

**Check:**
- Brevo API key is valid
- Sender email is verified in Brevo
- Check Brevo dashboard for sending limits
- Review application logs for email errors

### Payment Widget Not Loading

**Verify:**
- NowPayments invoice ID is correct
- Widget is assigned to the correct plan
- No browser console errors
- Iframe is not blocked by CSP headers

## Security Checklist

- [ ] All environment variables are set
- [ ] JWT_SECRET is strong and unique
- [ ] Database uses SSL/TLS in production
- [ ] SUPABASE_SERVICE_KEY is server-side only
- [ ] Brevo API key is not exposed to client
- [ ] Admin access is properly restricted
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] Input validation is in place
- [ ] SQL injection protection is active

## Performance Optimization

### Database:

- Add indexes on frequently queried columns
- Use connection pooling
- Enable query caching
- Monitor slow queries

### Application:

- Enable gzip compression
- Minimize bundle size
- Use CDN for static assets
- Implement caching strategies

### Frontend:

- Code splitting
- Lazy loading
- Image optimization
- Minimize API calls

## Maintenance

### Regular Tasks:

- Monitor error logs daily
- Review user feedback weekly
- Update dependencies monthly
- Security audits quarterly
- Database optimization as needed

### Updates:

1. Test updates in staging environment
2. Create database backup
3. Deploy during low-traffic hours
4. Monitor logs after deployment
5. Have rollback plan ready

## Support

For deployment issues:
- Check Railway documentation
- Review application logs
- Contact development team
- Open GitHub issue

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
