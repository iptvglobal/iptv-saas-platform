import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { supabaseAdmin } from "../supabase";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a user
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId || "iptv-saas",
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session payload missing openId");
        return null;
      }

      return {
        openId,
        appId: isNonEmptyString(appId) ? appId : "iptv-saas",
        name: isNonEmptyString(name) ? name : "",
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Authenticate request using session cookie (Supabase Auth)
   */
  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    
    // First try our JWT session
    const session = await this.verifySession(sessionCookie);

    if (session) {
      const sessionUserId = session.openId;
      const signedInAt = new Date();
      let user = await db.getUserByOpenId(sessionUserId);

      if (user) {
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: signedInAt,
        });
        return user;
      }
    }

    // Try Supabase access token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !supabaseUser) {
          throw ForbiddenError("Invalid access token");
        }

        // Get or create user in our database
        const openId = supabaseUser.id;
        let user = await db.getUserByOpenId(openId);

        if (!user) {
          await db.upsertUser({
            openId,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || null,
            email: supabaseUser.email ?? null,
            loginMethod: "supabase",
            lastSignedIn: new Date(),
          });
          user = await db.getUserByOpenId(openId);
        } else {
          await db.upsertUser({
            openId: user.openId,
            lastSignedIn: new Date(),
          });
        }

        if (!user) {
          throw ForbiddenError("Failed to create user");
        }

        return user;
      } catch (error: any) {
        if (error.message?.includes("ForbiddenError")) {
          throw error;
        }
        console.error("[Auth] Supabase token verification failed:", error);
        throw ForbiddenError("Authentication failed");
      }
    }

    throw ForbiddenError("No valid session found");
  }
}

export const sdk = new SDKServer();
