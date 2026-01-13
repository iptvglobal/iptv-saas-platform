import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { supabaseClient, supabaseAdmin } from "./supabase";
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from "./brevo";

/**
 * Register guest checkout routes
 * This allows users to create an account and place an order in a single step
 */
export function registerGuestCheckoutRoutes(app: Express) {
  app.post("/api/guest-checkout", async (req: Request, res: Response) => {
    try {
      const { 
        email, 
        password, 
        name,
        planId,
        connections,
        price,
        paymentMethodId,
        paymentWidgetId,
        paymentMethodName,
        paymentMethodType,
        credentialsType,
        macAddress
      } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      if (!planId || !connections || !price) {
        res.status(400).json({ error: "Plan details are required" });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      // Validate password length
      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters" });
        return;
      }

      // Validate MAC address if credentials type is MAG
      if (credentialsType === "mag") {
        if (!macAddress) {
          res.status(400).json({ error: "MAC address is required for MAG Portal" });
          return;
        }
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!macRegex.test(macAddress)) {
          res.status(400).json({ error: "Invalid MAC address format" });
          return;
        }
      }

      console.log("[Guest Checkout] Processing checkout for:", email);

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      let userId: string;
      let isNewUser = false;

      if (existingUser) {
        // User exists - try to sign them in
        console.log("[Guest Checkout] User exists, attempting sign in");
        
        const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // If sign in fails, it could be wrong password or unverified email
          console.error("[Guest Checkout] Sign in failed:", signInError.message);
          res.status(400).json({ 
            error: "An account with this email already exists. Please sign in or use a different email.",
            existingAccount: true
          });
          return;
        }

        if (!signInData.user) {
          res.status(400).json({ error: "Failed to authenticate existing user" });
          return;
        }

        userId = signInData.user.id;
      } else {
        // Create new user
        console.log("[Guest Checkout] Creating new user");
        isNewUser = true;

        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
              email_verified: true, // Auto-verify for guest checkout
            },
          }
        });

        if (signUpError) {
          console.error("[Guest Checkout] Sign up error:", signUpError.message);
          res.status(400).json({ error: signUpError.message });
          return;
        }

        if (!signUpData.user) {
          res.status(400).json({ error: "Failed to create user" });
          return;
        }

        userId = signUpData.user.id;

        // Mark email as verified immediately for guest checkout users
        // This allows them to sign in without OTP verification
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            email_confirm: true,
            user_metadata: {
              name: name || email.split('@')[0],
              email_verified: true,
              guest_checkout: true,
            }
          });
          console.log("[Guest Checkout] Email auto-verified for guest checkout user");
        } catch (verifyError) {
          console.error("[Guest Checkout] Failed to auto-verify email:", verifyError);
          // Continue anyway - user can verify later
        }
      }

      // Create or update user in our database
      await db.upsertUser({
        openId: userId,
        name: name || email.split("@")[0] || null,
        email: email,
        loginMethod: "supabase",
        lastSignedIn: new Date(),
      });

      // Get the user from our database to get the internal ID
      const dbUser = await db.getUserByOpenId(userId);
      
      if (!dbUser) {
        console.error("[Guest Checkout] Failed to get user from database");
        res.status(500).json({ error: "Failed to create user record" });
        return;
      }

      // Create the order with credentials type and MAC address
      const orderId = await db.createOrder({
        userId: dbUser.id,
        planId,
        connections,
        price,
        paymentMethodId,
        paymentWidgetId,
        paymentMethodName,
        paymentMethodType,
        credentialsType: credentialsType || "xtream",
        macAddress: credentialsType === "mag" ? macAddress : undefined,
      });

      if (!orderId) {
        res.status(500).json({ error: "Failed to create order" });
        return;
      }

      // Credentials preference is now stored in the order
      const credentialsData = {
        credentialsType: credentialsType || "xtream",
        macAddress: credentialsType === "mag" ? macAddress : undefined
      };

      // Log the activity
      try {
        await db.createActivityLog({
          userId: dbUser.id,
          action: "guest_checkout",
          entityType: "order",
          entityId: orderId,
          details: { 
            planId, 
            connections, 
            isNewUser,
            email,
            ...credentialsData
          },
        });
      } catch (logError) {
        console.error('[Guest Checkout] Failed to log activity:', logError);
        // Don't fail the checkout if logging fails
      }

      // Send order confirmation email to user and admin notification
      try {
        const plan = await db.getPlanById(planId);
        if (email) {
          await sendOrderConfirmationEmail({
            to: email,
            userName: name || email.split('@')[0] || 'Customer',
            orderId: orderId,
            planName: plan?.name || 'Unknown Plan',
            connections: connections,
            price: price,
            paymentMethod: paymentMethodName || 'Not specified',
          });
        }
        
        // Send admin notification email
        await sendAdminNewOrderEmail({
          orderId: orderId,
          userEmail: email,
          planName: plan?.name || 'Unknown Plan',
          connections: connections,
          price: price,
          paymentMethod: paymentMethodName || 'Not specified',
        });
      } catch (emailError) {
        console.error('[Guest Checkout] Failed to send order emails:', emailError);
        // Don't fail the checkout if email fails
      }

      // Create session token for the user
      const sessionToken = await sdk.createSessionToken(userId, {
        name: name || email.split("@")[0] || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set the session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[Guest Checkout] Checkout completed successfully", { 
        orderId, 
        userId, 
        isNewUser,
        credentialsType,
        hasMacAddress: !!macAddress
      });

      res.json({ 
        success: true,
        orderId,
        userId,
        isNewUser,
        credentialsType,
        message: isNewUser 
          ? "Account created and order placed successfully" 
          : "Order placed successfully"
      });

    } catch (error: any) {
      console.error("[Guest Checkout] Error:", error);
      res.status(500).json({ error: error.message || "Checkout failed" });
    }
  });
}
