import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedApplicationLayout from "@/app/(app)/layout";
import ApplicationLoading from "@/app/(app)/loading";
import type { OrganizationAccessContext } from "@/features/permissions/types";

const {
  getRequiredAccessContextMock,
  getVisibleNavigationMock,
  loadApplicationShellDataMock,
} = vi.hoisted(() => ({
  getRequiredAccessContextMock: vi.fn(),
  getVisibleNavigationMock: vi.fn(),
  loadApplicationShellDataMock: vi.fn(),
}));

vi.mock("@/features/auth/get-access-context", () => ({
  getRequiredAccessContext: getRequiredAccessContextMock,
}));
vi.mock("@/features/permissions/navigation", () => ({
  getVisibleNavigation: getVisibleNavigationMock,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock("@/components/app-shell/get-shell-data", () => ({
  loadApplicationShellData: loadApplicationShellDataMock,
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: () => "/dashboard",
}));

const context: OrganizationAccessContext = {
  organizationId: "22222222-2222-4222-8222-222222222222",
  userId: "11111111-1111-4111-8111-111111111111",
  scope: "organization",
  branchIds: [],
  permissions: ["reports.read"],
  enabledModules: ["dealership"],
};

const shellData = {
  organization: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Apex Autohaus",
  },
  user: {
    displayName: "Miguel Santos",
    email: "owner@apex-autohaus.example",
    roleName: "Owner",
  },
  scope: "organization" as const,
  branches: [],
};

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(cleanup);

describe("protected shell composition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRequiredAccessContextMock.mockResolvedValue(context);
    getVisibleNavigationMock.mockReturnValue([]);
    loadApplicationShellDataMock.mockResolvedValue(shellData);
  });

  it("resolves reviewed access exactly once and derives all shell inputs from it", async () => {
    const result = await ProtectedApplicationLayout({
      children: <div>Protected child</div>,
    });

    expect(result).toBeTruthy();
    expect(getRequiredAccessContextMock).toHaveBeenCalledTimes(1);
    expect(loadApplicationShellDataMock).toHaveBeenCalledWith(context);
    expect(getVisibleNavigationMock).toHaveBeenCalledWith(context);
  });

  it("layers a keyboard-focusable skip link above persistent shell chrome", async () => {
    const result = await ProtectedApplicationLayout({
      children: <div>Protected child</div>,
    });
    render(result);

    const skipLink = screen.getByRole("link", { name: "Skip to main content" });
    skipLink.focus();

    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveClass("z-50");
    expect(skipLink).toHaveClass("focus-visible:translate-y-0");
    expect(skipLink).toHaveClass("focus-visible:ring-2");
  });

  it("nests loading content under exactly one persistent header and main landmark", async () => {
    const result = await ProtectedApplicationLayout({
      children: <ApplicationLoading />,
    });
    const { container } = render(result);

    expect(container.querySelectorAll("header")).toHaveLength(1);
    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(container.querySelectorAll("aside")).toHaveLength(0);
    expect(screen.getByTestId("loading-content")).toBeInTheDocument();
  });
});
