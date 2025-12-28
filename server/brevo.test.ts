import { describe, expect, it } from "vitest";
import { testBrevoConnection } from "./brevo";

describe("Brevo Integration", () => {
  it("should have valid Brevo API credentials", async () => {
    const isConnected = await testBrevoConnection();
    expect(isConnected).toBe(true);
  }, 10000); // 10 second timeout for API call
});
