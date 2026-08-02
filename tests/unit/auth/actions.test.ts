import { describe, expect, it } from "vitest";

import {
  INVALID_CREDENTIALS_MESSAGE,
  performPasswordSignIn,
} from "@/features/auth/action-logic";

const validFormData = () => {
  const formData = new FormData();
  formData.set("email", " owner@apex-autohaus.example ");
  formData.set("password", "secret");
  return formData;
};

describe("performPasswordSignIn", () => {
  it("returns field errors without contacting Auth for invalid input", async () => {
    let providerWasCalled = false;
    const formData = validFormData();
    formData.set("email", "not-email");

    const result = await performPasswordSignIn(formData, async () => {
      providerWasCalled = true;
      return { error: null };
    });

    expect(result).toEqual({
      ok: false,
      state: {
        fieldErrors: { email: ["Enter a valid email address"] },
      },
    });
    expect(providerWasCalled).toBe(false);
  });

  it.each([
    ["provider error", async () => ({ error: new Error("User not found") })],
    ["thrown provider error", async () => { throw new Error("connection details"); }],
  ])("returns the same generic message for a %s", async (_, authenticate) => {
    const result = await performPasswordSignIn(validFormData(), authenticate);

    expect(result).toEqual({
      ok: false,
      state: { formError: INVALID_CREDENTIALS_MESSAGE },
    });
    expect(JSON.stringify(result)).not.toContain("User not found");
    expect(JSON.stringify(result)).not.toContain("connection details");
  });

  it("passes normalized credentials to Auth and reports success", async () => {
    let received: { email: string; password: string } | undefined;

    const result = await performPasswordSignIn(validFormData(), async (credentials) => {
      received = credentials;
      return { error: null };
    });

    expect(result).toEqual({ ok: true });
    expect(received).toEqual({
      email: "owner@apex-autohaus.example",
      password: "secret",
    });
  });
});
