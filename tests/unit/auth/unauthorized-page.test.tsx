import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import UnauthorizedPage from "@/app/(access)/unauthorized/page";

const { getAccessContextResolutionMock, redirectMock } = vi.hoisted(() => ({
  getAccessContextResolutionMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/features/auth/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/features/auth/get-access-context", () => ({
  getAccessContextResolution: getAccessContextResolutionMock,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

describe("unauthorized route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation((destination: string) => {
      throw new Error(`REDIRECT:${destination}`);
    });
  });

  it("shows owner guidance only for a genuine missing membership", async () => {
    getAccessContextResolutionMock.mockResolvedValue({
      status: "missing_membership",
    });

    render(await UnauthorizedPage());

    expect(
      screen.getByText(/ask an organization owner to review your access/i),
    ).toBeVisible();
  });

  it("sends operational failures to the retry-safe unavailable state", async () => {
    getAccessContextResolutionMock.mockResolvedValue({ status: "unavailable" });

    await expect(UnauthorizedPage()).rejects.toThrow(
      "REDIRECT:/access-unavailable",
    );
  });

  it("sends a valid context to the safe default protected route", async () => {
    getAccessContextResolutionMock.mockResolvedValue({
      status: "ready",
      context: {
        organizationId: "22222222-2222-4222-8222-222222222222",
        userId: "11111111-1111-4111-8111-111111111111",
        scope: "organization",
        branchIds: [],
        permissions: [],
        enabledModules: [],
      },
    });

    await expect(UnauthorizedPage()).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
  });

  it("keeps an unauthenticated direct visit on the sign-in path", async () => {
    getAccessContextResolutionMock.mockResolvedValue({
      status: "unauthenticated",
    });

    await expect(UnauthorizedPage()).rejects.toThrow(
      "REDIRECT:/sign-in?next=%2Fdashboard",
    );
  });
});
