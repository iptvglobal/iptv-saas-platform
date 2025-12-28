import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Create a dummy client for when Supabase is not configured
const createDummyClient = (): SupabaseClient => {
  console.warn('[Supabase] Not configured - auth features will be disabled');
  return {
    auth: {
      signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
      resetPasswordForEmail: async () => ({ data: {}, error: new Error('Supabase not configured') }),
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
        updateUserById: async () => ({ data: { user: null }, error: null }),
      }
    },
    from: () => ({
      select: () => ({
        limit: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      })
    })
  } as unknown as SupabaseClient;
};

// Client for user-facing operations (uses anon key with RLS)
export const supabaseClient: SupabaseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient();

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin: SupabaseClient = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createDummyClient();

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - skipping connection test');
    return false;
  }
  
  try {
    // Just check if we can make a request
    const { error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('[Supabase] Connection test failed:', error.message);
      return false;
    }
    console.log('[Supabase] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Supabase] Connection test error:', error);
    return false;
  }
}
