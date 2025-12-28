/**
 * Script to promote a user to admin role
 * Usage: tsx scripts/make-admin.ts <email>
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email is required');
  console.log('Usage: tsx scripts/make-admin.ts <email>');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function makeAdmin() {
  console.log(`🔍 Looking for user: ${email}`);
  
  const client = postgres(databaseUrl!);
  const db = drizzle(client);

  try {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);
    console.log(`   Current role: ${user.role}`);

    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin');
      process.exit(0);
    }

    // Update user role to admin
    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, user.id));

    console.log('✅ User promoted to admin successfully!');
    console.log(`   ${user.email} is now an admin`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

makeAdmin();
