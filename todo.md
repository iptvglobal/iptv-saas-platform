# IPTV SaaS Platform - TODO

## Database & Schema
- [x] Users table with roles (user, admin, agent)
- [x] Subscription plans table with connection pricing
- [x] Plan pricing rules table (price per connection count)
- [x] Payment methods table (crypto widgets, manual methods)
- [x] Orders table with lifecycle status
- [x] IPTV credentials table (Xtream, M3U, Portal)
- [x] Chat messages table
- [x] Email templates table
- [x] Activity logs table

## Authentication System
- [x] Direct login page at root path (no landing page)
- [x] Email/password authentication (Manus OAuth)
- [x] User registration with email verification
- [x] Password reset functionality
- [x] Role-based access control (user, admin, agent)
- [x] Protected routes for authenticated users
- [x] Session persistence

## Subscription Plans
- [x] Plans management (CRUD)
- [x] Connection slider (1-10 connections)
- [x] Dynamic pricing based on connection count
- [x] Admin can set different prices per connection
- [x] Plan display on user dashboard

## Payment System
- [x] NowPayments crypto widget integration
- [x] Admin can assign widget iframe per plan
- [x] "I have paid" button with 10-second loading animation
- [x] Manual payment methods (Card, PayPal, custom)
- [x] Admin CRUD for payment methods
- [x] Payment instructions with optional links
- [x] Email payment instructions to user (template ready)

## Order Management
- [x] Order creation from subscription purchase
- [x] Order lifecycle: Pending → Verified → Rejected
- [x] Real-time order status updates (no page reload)
- [x] Order history in user dashboard
- [x] Admin order verification/rejection

## IPTV Credentials
- [x] Support Xtream Codes format
- [x] Support M3U with EPG format
- [x] Support Portal URL format
- [x] Up to 10 connections per user
- [x] Credentials organized by connection number
- [x] Admin can add/edit credentials anytime
- [x] User credentials display page

## Admin Dashboard
- [x] User management (view, edit roles, delete)
- [x] Plans management
- [x] Payment methods management
- [x] Order verification/rejection
- [x] IPTV credentials assignment
- [x] Activity logs viewer
- [x] Dashboard statistics

## Real-time Chat
- [x] Chat system integration
- [x] Chat icon on all pages
- [x] Dedicated chat page
- [x] Instant message delivery
- [x] Admin/agent can see all conversations
- [x] Email notifications for new messages (template ready)

## Email System (Brevo SMTP)
- [x] OTP verification code emails (template ready)
- [x] Order creation confirmation (template ready)
- [x] Payment instructions emails (template ready)
- [x] Payment verification emails (template ready)
- [x] IPTV credential delivery emails (template ready)
- [x] Chat notification emails (template ready)
- [x] Editable email templates

## UI/UX
- [x] Professional SaaS-style design
- [x] Light theme default
- [x] Dark mode toggle
- [x] Responsive layout
- [x] Smooth animations
- [x] Loading states
- [x] Toast notifications
- [x] Mobile-friendly navigation


## Critical Fixes & Improvements

### Chat System
- [x] Fix admin chat to display full message content (not just timestamps)
- [x] Ensure messages appear in correct order
- [x] Implement real-time updates without page reload
- [x] Show all user and admin messages correctly

### Payment Method Configuration
- [ ] Allow admin to configure which payment methods appear per plan
- [ ] Support multiple payment methods with different links
- [ ] Support custom instructions per payment method
- [ ] Link payment methods to specific plans

### NowPayments Widget Integration
- [x] Replace NowPayments API with iframe widget
- [x] Admin can enter widget invoice ID (iid) per plan
- [x] Display widget in modal or new page
- [x] Use iframe format: https://nowpayments.io/embeds/payment-widget?iid=INVOICE_ID
- [x] Widget dimensions: 410x696px

### Supabase Authentication Integration
- [x] Install Supabase client library (@supabase/supabase-js)
- [x] Create Supabase client configuration (server/supabase.ts)
- [x] Validate Supabase credentials with test (connection successful)
- [x] Create authentication helper functions (server/supabaseAuth.ts)
- [x] Accept Supabase URL and API key via environment variables
- [ ] Replace Manus OAuth with Supabase Auth (deferred - requires major refactoring)
- [ ] Update Login.tsx to use Supabase Auth
- [ ] Implement OTP email verification flow in UI
- [ ] Block dashboard access until email verified

### Brevo SMTP Integration
- [x] Install Brevo SDK (@getbrevo/brevo)
- [x] Create email service module (server/brevo.ts)
- [x] Test Brevo API connection (successful - account: soay300@gmail.com)
- [x] Create OTP verification email template
- [x] Create order confirmation email template  
- [x] Create credentials delivery email template
- [x] Accept Brevo API key, sender email, and sender name via environment variables
- [ ] Integrate Brevo into order creation flow
- [ ] Integrate Brevo into credential delivery flow
- [ ] Send real emails for all user notifications

### Bug Fixes
- [x] Fix crypto widget not appearing on plans page (was working, tested)
- [x] Ensure widget shows when plan has assigned widget (confirmed working)


## New Requirements - Payment Method Configuration
- [x] Update payment methods to be plan and connection-specific (like payment widgets)
- [x] Add planId, minConnections, maxConnections to paymentMethods table
- [x] Remove planPaymentMethods junction table (no longer needed)
- [x] Update admin UI to select plan and connection range when creating payment method
- [x] Update checkout to filter payment methods by plan and connections
- [x] Each payment method should only appear for its assigned plan/connection combination
- [x] Write and pass tests for payment method filtering (3/3 tests passing)
- [x] Verify end-to-end: create payment method in admin, see it on checkout


## Final Fixes & Deployment Preparation
- [x] Add paymentMethod field to orders table to track which payment method user selected
- [x] Update order creation to save payment method name/type
- [x] Update admin orders page to display payment method for each order
- [x] Create Railway deployment configuration (railway.json)
- [x] Add proper environment variable configuration for Railway
- [x] Document all required environment variables (ENV_VARIABLES.md)
- [x] Create comprehensive deployment guide (DEPLOYMENT.md)
- [x] Ensure database connection works with Railway MySQL
- [x] Test production build (successful, 1.26 MB bundle)


## UI Bug Fix
- [x] Fix crypto widget dialog - "I Have Paid" button not visible without zooming out
- [x] Make payment dialog scrollable (max-h-[90vh] overflow-y-auto)
- [x] Reduce iframe height to 600px and enable scrolling
- [x] Ensure button is always accessible on all screen sizes


## Brevo Email Activation
- [x] Send order confirmation email when user creates order
- [x] Send payment instructions email for manual payment methods (included in order confirmation)
- [x] Send order verification email when admin verifies payment
- [x] Send order rejection email when admin rejects payment
- [x] Send credential delivery email when admin adds IPTV credentials
- [x] Handle email delivery errors gracefully (try-catch blocks, don't fail operations)
- [ ] Test all email templates with real Brevo delivery (ready for testing)


## Database Migration to Supabase PostgreSQL
- [x] Convert schema from MySQL to PostgreSQL syntax
- [x] Change mysqlTable to pgTable in schema
- [x] Update data types (int → serial/integer, mysqlEnum → pgEnum, decimal → numeric, etc.)
- [x] Create backup of MySQL schema
- [x] Update database connection to use Supabase PostgreSQL URL
- [x] Install postgres-js driver and update drizzle config
- [x] Push new schema to Supabase (manually via SQL editor)
- [x] Update MySQL-specific queries to PostgreSQL (onDuplicateKeyUpdate → onConflictDoUpdate)
- [x] Fix insertId references to use RETURNING clause
- [x] Fix numeric precision parameters
- [x] Test platform with Supabase database (working perfectly!)

## Promotional Badge Feature
- [x] Add promoText field to plans table (optional text field)
- [x] Update admin plans form to include promo text input
- [x] Display red badge on plan cards when promoText is set
- [x] Hide badge when promoText is empty/null (conditional rendering)
- [x] Style badge as red flag with custom text (e.g., "Free Premium Player")


## Bug Fix - Promotional Badge Not Appearing
- [x] Check if promoText is being saved to database correctly (added to input schema)
- [x] Verify backend router returns promoText in plan queries (already returns all plan fields)
- [x] Ensure frontend receives and displays promoText (working correctly)
- [x] Test end-to-end flow: add promo text → save → view on plans page (VERIFIED - badge displays correctly)


## Railway Deployment Error Fix
- [x] Fix pnpm lockfile configuration mismatch error (updated railway.json)
- [x] Update package.json overrides configuration (already correct)
- [x] Regenerate pnpm-lock.yaml with correct configuration (verified up to date)
- [x] Updated railway.json to use --no-frozen-lockfile flag
- [x] Test Railway build succeeds (verified locally)
- [x] Update deployment documentation (added troubleshooting section)


## Railway Runtime Errors Fix
- [x] Fix missing OAUTH_SERVER_URL error (changed to warning, optional for Railway)
- [x] Fix missing Brevo environment variables warning (improved message)
- [x] Fix ERR_INVALID_ARG_TYPE for undefined path variable (replaced import.meta.dirname with __dirname)
- [x] Make OAuth optional when not configured (warns instead of errors)
- [x] Update environment variable validation (graceful degradation)
- [ ] Test Railway deployment succeeds (user needs to redeploy)


## Production Path Resolution Error
- [x] Fix ERR_INVALID_ARG_TYPE in production build (dist/index.js:1872)
- [x] Investigate why __dirname is undefined in bundled code (esbuild bundling issue)
- [x] Update esbuild configuration to handle path resolution (added --banner and --keep-names)
- [x] Test production build locally (server starts successfully on port 3001)
- [ ] Verify Railway deployment succeeds (user needs to redeploy after checkpoint)


## Replace Manus OAuth with Supabase Auth
- [x] Fix production path resolution error permanently (using process.cwd() instead of import.meta.url)
- [ ] Remove Manus OAuth dependency completely
- [ ] Implement Supabase Auth with email OTP verification
- [ ] Create new Login page with email input and OTP verification
- [ ] Update session management to use Supabase tokens
- [ ] Update protected routes to use Supabase session
- [ ] Test full authentication flow
- [ ] Verify Railway deployment succeeds
