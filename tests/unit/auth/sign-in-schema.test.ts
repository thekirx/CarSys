import { describe, expect, it } from "vitest";

import { signInSchema } from "@/features/auth/schemas";

describe("signInSchema", () => {
  it("accepts a valid email and trims it", () => {
    const result = signInSchema.safeParse({
      email: "  owner@apex-autohaus.example  ",
      password: "demo-password",
    });

    expect(result).toEqual({
      success: true,
      data: {
        email: "owner@apex-autohaus.example",
        password: "demo-password",
      },
    });
  });

  it.each([
    ["malformed", { email: "not-email", password: "secret" }],
    ["missing", { password: "secret" }],
    ["non-string", { email: 42, password: "secret" }],
  ])("rejects a %s email with the approved generic message", (_, input) => {
    const result = signInSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toEqual([
        "Enter a valid email address",
      ]);
    }
  });

  it.each([
    ["empty", ""],
    ["missing", undefined],
    ["non-string", 42],
  ])("rejects a %s password with the approved generic message", (_, password) => {
    const result = signInSchema.safeParse({
      email: "owner@apex-autohaus.example",
      ...(password === undefined ? {} : { password }),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toEqual([
        "Enter your password",
      ]);
    }
  });

  it("does not trim a non-empty password", () => {
    const result = signInSchema.parse({
      email: "owner@apex-autohaus.example",
      password: "  secret  ",
    });

    expect(result.password).toBe("  secret  ");
  });
});
