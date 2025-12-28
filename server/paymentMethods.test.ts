import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Payment Methods - Plan and Connection Filtering", () => {
  it("should filter payment methods by plan and connection count", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This test validates that getForPlan returns only methods
    // that match the specified planId and fall within the connection range
    const result = await caller.paymentMethods.getForPlan({
      planId: 1,
      connections: 1,
    });

    // Should return an array (empty or with matching methods)
    expect(Array.isArray(result)).toBe(true);
    
    // If there are results, verify they match the criteria
    if (result.length > 0) {
      result.forEach((method) => {
        expect(method.planId).toBe(1);
        expect(method.minConnections).toBeLessThanOrEqual(1);
        expect(method.maxConnections).toBeGreaterThanOrEqual(1);
      });
    }
  });

  it("should create payment method with plan and connection fields", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.paymentMethods.create({
      name: "Test Payment Method",
      type: "custom",
      planId: 1,
      minConnections: 1,
      maxConnections: 5,
      instructions: "Test instructions",
      isActive: true,
      sortOrder: 0,
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("should not return methods outside connection range", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Query for 10 connections
    const result = await caller.paymentMethods.getForPlan({
      planId: 1,
      connections: 10,
    });

    // Methods with maxConnections < 10 should not be included
    result.forEach((method) => {
      expect(method.maxConnections).toBeGreaterThanOrEqual(10);
      expect(method.minConnections).toBeLessThanOrEqual(10);
    });
  });
});
