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
  beforeEach(() => {
    vi.clearAllMocks();
    createServerSupabaseClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession: exchangeCodeForSessionMock },
    });
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
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
