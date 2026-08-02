import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/auth/callback/route";

const { createServerSupabaseClientMock, exchangeCodeForSessionMock } =
  vi.hoisted(() => ({
    createServerSupabaseClientMock: vi.fn(),
    exchangeCodeForSessionMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

describe("authentication callback", () => {
  let responseMutations:
    | {
        cookies: Array<{
          name: string;
          value: string;
          options: { httpOnly: boolean; path: string; sameSite: "lax" };
        }>;
        headers: Headers;
      }
    | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    responseMutations = undefined;
    createServerSupabaseClientMock.mockImplementation((options) => {
      responseMutations = options?.responseMutations;
      return {
        auth: { exchangeCodeForSession: exchangeCodeForSessionMock },
      };
    });
    exchangeCodeForSessionMock.mockImplementation(async () => {
      responseMutations?.cookies.push({
        name: "sb-auth",
        value: "new-session",
        options: { httpOnly: true, path: "/", sameSite: "lax" },
      });
      responseMutations?.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate, max-age=0",
      );
      responseMutations?.headers.set("Expires", "0");
      responseMutations?.headers.set("Pragma", "no-cache");

      return { error: null };
    });
  });

  it("falls back to the dashboard after a successful exchange with an external return path", async () => {
    const request = new NextRequest(
      "https://carsys.example/auth/callback?code=valid-code&next=https%3A%2F%2Fexample.com%2Fsteal-session",
    );

    const response = await GET(request);

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("valid-code");
    expect(response.headers.get("location")).toBe(
      "https://carsys.example/dashboard",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "sb-auth=new-session",
    );
    expect(response.headers.get("cache-control")).toBe(
      "private, no-cache, no-store, must-revalidate, max-age=0",
    );
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
  });

  it("honors an allowlisted return path after a successful exchange", async () => {
    const request = new NextRequest(
      "https://carsys.example/auth/callback?code=valid-code&next=%2Fvehicles%3Fstatus%3Dactive",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://carsys.example/vehicles?status=active",
    );
  });
});
