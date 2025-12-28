import { describe, expect, it } from "vitest";
import { testSupabaseConnection, supabaseClient } from "./supabase";

describe("Supabase Integration", () => {
  it("should have valid Supabase credentials", async () => {
    const isConnected = await testSupabaseConnection();
    expect(isConnected).toBe(true);
  });

  it("should be able to query Supabase", async () => {
    // Test a simple query to verify the connection works
    const { error } = await supabaseClient.from('users').select('count').limit(1);
    expect(error).toBeNull();
  });
});
