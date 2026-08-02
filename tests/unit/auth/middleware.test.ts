import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const { createServerClientMock, getClaimsMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getClaimsMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

type CookieAdapter = {
  getAll(): Array<{ name: string; value: string }>;
  setAll(
    cookies: Array<{
      name: string;
      value: string;
      options?: { httpOnly?: boolean; path?: string; sameSite?: "lax" };
    }>,
    headers: Record<string, string>,
  ): void;
};

describe("updateSession", () => {
  let cookieAdapter: CookieAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_test-key",
    );

    createServerClientMock.mockImplementation((...args: unknown[]) => {
      const options = args[2] as { cookies: CookieAdapter };
      cookieAdapter = options.cookies;

      return { auth: { getClaims: getClaimsMock } };
    });
  });

  it("returns the verified claim subject and synchronizes refreshed cookies", async () => {
    getClaimsMock.mockImplementation(async () => {
      cookieAdapter.setAll(
        [
          {
            name: "sb-auth",
            value: "refreshed",
            options: { httpOnly: true, path: "/", sameSite: "lax" },
          },
        ],
        { "cache-control": "private, no-store" },
      );

      return { data: { claims: { sub: "user-123" } }, error: null };
    });

    const request = new NextRequest("https://carsys.example/dashboard", {
      headers: { cookie: "existing=one", "x-original": "true" },
    });
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set("x-carsys-current-path", "/dashboard");

    const { response, userId } = await updateSession(
      request,
      forwardedHeaders,
    );

    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "sb_publishable_test-key",
      expect.objectContaining({ cookies: expect.any(Object) }),
    );
    expect(cookieAdapter.getAll()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "existing", value: "one" }),
        expect.objectContaining({ name: "sb-auth", value: "refreshed" }),
      ]),
    );
    expect(userId).toBe("user-123");
    expect(request.cookies.get("sb-auth")?.value).toBe("refreshed");
    expect(response.cookies.get("sb-auth")).toMatchObject({
      name: "sb-auth",
      value: "refreshed",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      "sb-auth=refreshed",
    );
    expect(
      response.headers.get("x-middleware-request-x-carsys-current-path"),
    ).toBe("/dashboard");
  });

  it.each([
    { data: null, error: new Error("invalid token") },
    { data: { claims: {} }, error: null },
  ])("fails closed when claims are unavailable", async (claimsResult) => {
    getClaimsMock.mockResolvedValue(claimsResult);

    const request = new NextRequest("https://carsys.example/dashboard");
    const { userId } = await updateSession(request);

    expect(userId).toBeNull();
  });
});
