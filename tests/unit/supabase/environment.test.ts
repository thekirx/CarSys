import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/lib/env";

describe("public Supabase environment", () => {
  it("accepts a project URL and publishable key", () => {
    expect(parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example" })).toEqual({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example" });
  });
  it("rejects a missing publishable key", () => expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" })).toThrow());
});
