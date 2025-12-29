import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { 
  signUpWithEmail, 
  signInWithEmail, 
  verifyOTP, 
  resendOTP,
  signOut as supabaseSignOut,
  getUserFromToken,
  requestPasswordReset,
  updatePassword
} from "../supabaseAuth";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Supabase Auth: Sign Up with Email
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const result = await signUpWithEmail(email, password, name);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ 
        success: true, 
        message: result.message,
        userId: result.userId,
        needsVerification: true
      });
    } catch (error) {
      console.error("[Auth] Sign up failed", error);
      res.status(500).json({ error: "Sign up failed" });
    }
  });

  // Supabase Auth: Sign In with Email
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const result = await signInWithEmail(email, password);

      if (!result.success) {
        res.status(400).json({ 
          error: result.error,
          needsVerification: result.needsVerification
        });
        return;
      }

      if (!result.user || !result.session) {
        res.status(400).json({ error: "Sign in failed" });
        return;
      }

      // Create or update user in our database
      const openId = result.user.id;
      await db.upsertUser({
        openId,
        name: result.user.user_metadata?.name || result.user.email?.split("@")[0] || null,
        email: result.user.email ?? null,
        loginMethod: "supabase",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: result.user.user_metadata?.name || result.user.email?.split("@")[0] || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ 
        success: true,
        accessToken: result.accessToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.user_metadata?.name
        }
      });
    } catch (error) {
      console.error("[Auth] Sign in failed", error);
      res.status(500).json({ error: "Sign in failed" });
    }
  });

  // Supabase Auth: Verify OTP
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ error: "Email and OTP are required" });
        return;
      }

      const result = await verifyOTP(email, otp);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error("[Auth] OTP verification failed", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Supabase Auth: Resend OTP
  app.post("/api/auth/resend-otp", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }

      const result = await resendOTP(email);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error("[Auth] Resend OTP failed", error);
      res.status(500).json({ error: "Failed to resend verification code" });
    }
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }

      const result = await requestPasswordReset(email);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error("[Auth] Forgot password failed", error);
      res.status(500).json({ error: "Failed to send reset email" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { password, accessToken } = req.body;

      if (!password || !accessToken) {
        res.status(400).json({ error: "Password and access token are required" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters" });
        return;
      }

      const result = await updatePassword(password, accessToken);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error("[Auth] Reset password failed", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Supabase Auth: Sign Out
  app.post("/api/auth/signout", async (req: Request, res: Response) => {
    try {
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      
      await supabaseSignOut();

      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Sign out failed", error);
      res.status(500).json({ error: "Sign out failed" });
    }
  });

  // Get current user from token
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "No token provided" });
        return;
      }

      const token = authHeader.substring(7);
      const user = await getUserFromToken(token);

      if (!user) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        emailVerified: user.email_confirmed_at !== null
      });
    } catch (error) {
      console.error("[Auth] Get user failed", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Legacy OAuth callback (for backwards compatibility, redirects to login)
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    // Redirect to login page since we're using Supabase Auth now
    res.redirect(302, "/login");
  });
}
