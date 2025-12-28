import { supabaseClient, supabaseAdmin } from './supabase';
import { sendOTPEmail } from './brevo';

/**
 * Generate a 6-digit OTP code
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sign up a new user with email and password
 * Sends OTP verification email via Brevo
 */
export async function signUpWithEmail(email: string, password: string, name?: string) {
  try {
    // Create user in Supabase Auth
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
        emailRedirectTo: undefined, // We'll handle OTP manually
      }
    });

    if (error) {
      console.error('[Supabase Auth] Sign up error:', error.message);
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user' };
    }

    // Generate OTP code (6 digits)
    const otp = generateOTP();
    
    // Store OTP in user metadata (temporary, expires in 10 minutes)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      data.user.id,
      {
        user_metadata: {
          ...data.user.user_metadata,
          otp_code: otp,
          otp_expires: Date.now() + 10 * 60 * 1000, // 10 minutes
          email_verified: false,
        }
      }
    );

    if (updateError) {
      console.error('[Supabase Auth] Failed to store OTP:', updateError.message);
    }

    // Send OTP via Brevo
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error('[Supabase Auth] Failed to send OTP email:', emailError);
      // Don't fail signup if email fails - user can request resend
    }

    return {
      success: true,
      userId: data.user.id,
      message: 'Verification code sent to your email'
    };
  } catch (error: any) {
    console.error('[Supabase Auth] Sign up exception:', error);
    return { success: false, error: error.message || 'Sign up failed' };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(email: string, otp: string) {
  try {
    console.log('[Supabase Auth] Verifying OTP for:', email);
    
    // Get user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('[Supabase Auth] Failed to list users:', listError.message);
      return { success: false, error: 'Failed to verify code' };
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error('[Supabase Auth] User not found:', email);
      return { success: false, error: 'User not found' };
    }

    const metadata = user.user_metadata || {};
    const storedOtp = metadata.otp_code;
    const otpExpires = metadata.otp_expires;

    console.log('[Supabase Auth] OTP check:', {
      email,
      hasStoredOtp: !!storedOtp,
      hasExpiry: !!otpExpires,
      expired: otpExpires ? Date.now() > otpExpires : 'N/A'
    });

    if (!storedOtp || !otpExpires) {
      return { success: false, error: 'No verification code found. Please request a new one.' };
    }

    if (Date.now() > otpExpires) {
      return { success: false, error: 'Verification code expired. Please request a new one.' };
    }

    if (storedOtp !== otp) {
      console.error('[Supabase Auth] OTP mismatch. Expected:', storedOtp, 'Got:', otp);
      return { success: false, error: 'Invalid verification code' };
    }

    // Mark email as verified - update both email_confirm and user_metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true,
        user_metadata: {
          ...metadata,
          email_verified: true,
          otp_code: null,
          otp_expires: null,
        }
      }
    );

    if (updateError) {
      console.error('[Supabase Auth] Failed to verify email:', updateError.message);
      return { success: false, error: 'Verification failed' };
    }

    console.log('[Supabase Auth] Email verified successfully for:', email);
    return { success: true, message: 'Email verified successfully' };
  } catch (error: any) {
    console.error('[Supabase Auth] OTP verification exception:', error);
    return { success: false, error: error.message || 'Verification failed' };
  }
}

/**
 * Resend OTP code
 */
export async function resendOTP(email: string) {
  try {
    // Get user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return { success: false, error: 'Failed to resend code' };
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if already verified
    const metadata = user.user_metadata || {};
    if (metadata.email_verified || user.email_confirmed_at) {
      return { success: false, error: 'Email already verified' };
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Update user metadata with new OTP
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...metadata,
          otp_code: otp,
          otp_expires: Date.now() + 10 * 60 * 1000, // 10 minutes
        }
      }
    );

    if (updateError) {
      console.error('[Supabase Auth] Failed to update OTP:', updateError.message);
      return { success: false, error: 'Failed to generate new code' };
    }

    // Send OTP via Brevo
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error('[Supabase Auth] Failed to send OTP email:', emailError);
      return { success: false, error: 'Failed to send verification email' };
    }

    return { success: true, message: 'Verification code sent to your email' };
  } catch (error: any) {
    console.error('[Supabase Auth] Resend OTP exception:', error);
    return { success: false, error: error.message || 'Failed to resend code' };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    console.log('[Supabase Auth] Sign in attempt for:', email);
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Supabase Auth] Sign in error:', error.message, error);
      return { success: false, error: `Authentication failed: ${error.message}` };
    }

    if (!data.user || !data.session) {
      console.error('[Supabase Auth] No user or session returned');
      return { success: false, error: 'Sign in failed - no session created' };
    }

    console.log('[Supabase Auth] Sign in successful, checking verification status...');

    // Get the latest user data from admin API to check verification status
    const { data: { user: adminUser }, error: adminError } = await supabaseAdmin.auth.admin.getUserById(data.user.id);
    
    if (adminError || !adminUser) {
      console.error('[Supabase Auth] Failed to get user details:', adminError?.message);
      // Continue with the original user data if admin call fails
    }

    const userToCheck = adminUser || data.user;
    const metadata = userToCheck.user_metadata || {};
    
    // Check if email is verified - check both metadata and email_confirmed_at
    const isVerified = metadata.email_verified === true || userToCheck.email_confirmed_at !== null;
    
    console.log('[Supabase Auth] Verification status:', {
      email: userToCheck.email,
      email_verified_metadata: metadata.email_verified,
      email_confirmed_at: userToCheck.email_confirmed_at,
      isVerified,
      userId: userToCheck.id
    });

    if (!isVerified) {
      console.warn('[Supabase Auth] Email not verified for:', email);
      return {
        success: false,
        error: 'Email not verified. Please check your email for the verification code.',
        needsVerification: true,
        userId: data.user.id
      };
    }

    console.log('[Supabase Auth] Sign in completed successfully for:', email);
    return {
      success: true,
      user: data.user,
      session: data.session,
      accessToken: data.session.access_token
    };
  } catch (error: any) {
    console.error('[Supabase Auth] Sign in exception:', error);
    return { success: false, error: `Sign in failed: ${error.message || 'Unknown error'}` };
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('[Supabase Auth] Sign out error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    console.error('[Supabase Auth] Sign out exception:', error);
    return { success: false, error: error.message || 'Sign out failed' };
  }
}

/**
 * Get current user from session token
 */
export async function getUserFromToken(token: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('[Supabase Auth] Get user error:', error);
    return null;
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    
    if (error) {
      console.error('[Supabase Auth] Password reset error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Password reset email sent' };
  } catch (error: any) {
    console.error('[Supabase Auth] Password reset exception:', error);
    return { success: false, error: error.message || 'Password reset failed' };
  }
}
