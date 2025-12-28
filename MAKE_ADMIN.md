# How to Make a User Admin

There are **3 methods** to promote a user to admin role:

---

## Method 1: Using the Script (Recommended for Local/Railway CLI)

### Prerequisites
- Node.js installed
- Access to the project files
- DATABASE_URL environment variable set

### Steps

1. **If running locally:**
   ```bash
   # Set your DATABASE_URL
   export DATABASE_URL="your_supabase_connection_string"
   
   # Run the script
   tsx scripts/make-admin.ts soay300@gmail.com
   ```

2. **If using Railway CLI:**
   ```bash
   # Install Railway CLI if you haven't
   npm i -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Link to your project
   railway link
   
   # Run the script with Railway environment
   railway run tsx scripts/make-admin.ts soay300@gmail.com
   ```

---

## Method 2: Direct Database Query (Easiest)

### Using Supabase SQL Editor

1. Go to your **Supabase Dashboard**
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL:

```sql
-- Update user role to admin by email
UPDATE users 
SET role = 'admin' 
WHERE email = 'soay300@gmail.com';

-- Verify the change
SELECT id, email, name, role 
FROM users 
WHERE email = 'soay300@gmail.com';
```

5. Click **Run** or press `Ctrl+Enter`
6. You should see the user with `role = 'admin'`

---

## Method 3: Using Database Client

### Using any PostgreSQL client (pgAdmin, DBeaver, TablePlus, etc.)

1. **Connect to your database** using the connection string from Supabase:
   - Go to Supabase → Project Settings → Database
   - Copy the connection string (URI format)

2. **Run this SQL query:**
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'soay300@gmail.com';
   ```

3. **Verify:**
   ```sql
   SELECT * FROM users WHERE email = 'soay300@gmail.com';
   ```

---

## Verification

After promoting the user to admin, you can verify by:

1. **Sign in** to the platform with the user account
2. You should now see **admin-only features** like:
   - Admin Dashboard
   - User Management
   - Plans Management
   - Orders Management
   - Payment Methods
   - Email Templates
   - System Logs

---

## Quick Reference: User Roles

The platform has 3 roles:

- **`user`** (default) - Regular customers
- **`agent`** - Support staff (can view/manage orders and customers)
- **`admin`** - Full access to all features

---

## Troubleshooting

### "User not found"
- Make sure you've signed up and verified your email first
- Check that the email is spelled correctly

### "Permission denied"
- Make sure your DATABASE_URL has write permissions
- For Railway, use `railway run` to inherit environment variables

### Changes not reflecting
- Sign out and sign in again
- Clear browser cache/cookies
- Check that the database was actually updated
