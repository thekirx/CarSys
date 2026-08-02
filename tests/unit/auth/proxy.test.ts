import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

import { CURRENT_PATH_HEADER } from "@/features/auth/get-access-context";
import { proxy } from "@/proxy";

const { updateSessionMock } = vi.hoisted(() => ({
  updateSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: updateSessionMock,
}));

describe("Proxy internal request context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateSessionMock.mockImplementation(
      async (_request: NextRequest, requestHeaders: Headers) => ({
        response: NextResponse.next({ request: { headers: requestHeaders } }),
        userId: "11111111-1111-4111-8111-111111111111",
      }),
    );
  });

  it("overwrites a client-supplied current path on protected extension-looking routes", async () => {
    const request = new NextRequest(
      "https://carsys.example/settings/export.js?format=legacy",
      { headers: { [CURRENT_PATH_HEADER]: "/unauthorized" } },
    );

    const response = await proxy(request);

    expect(
      response.headers.get(`x-middleware-request-${CURRENT_PATH_HEADER}`),
    ).toBe("/settings/export.js?format=legacy");
  });
});
