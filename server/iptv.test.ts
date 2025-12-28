import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create a mock context for testing
function createMockContext(user?: TrpcContext["user"]): TrpcContext {
  return {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Create an authenticated user context
function createAuthContext(role: "user" | "admin" | "agent" = "user"): TrpcContext {
  return createMockContext({
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });
}

describe("Auth Router", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
    expect(result?.role).toBe("user");
  });
});

describe("Plans Router", () => {
  it("lists plans for any user (public)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.plans.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("lists active plans only when requested", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.plans.list({ activeOnly: true });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Users Router - Admin Only", () => {
  it("allows admin to list all users", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies regular user access to user list", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.users.list()).rejects.toThrow("Admin access required");
  });
});

describe("Orders Router", () => {
  it("allows staff to list orders", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.orders.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies regular user access to orders list", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.orders.list()).rejects.toThrow("Staff access required");
  });
});

describe("Payment Methods Router", () => {
  it("lists payment methods (public)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.paymentMethods.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Payment Widgets Router", () => {
  it("allows admin to list payment widgets", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.paymentWidgets.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Credentials Router", () => {
  it("allows admin to list all credentials", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.credentials.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Chat Router", () => {
  it("allows staff to list conversations", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.chat.listConversations();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Activity Logs Router", () => {
  it("allows admin to list activity logs", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.activityLogs.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Email Templates Router", () => {
  it("allows admin to list email templates", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.emailTemplates.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
