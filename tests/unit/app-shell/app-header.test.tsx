import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/app-shell/app-header";
import { OrganizationProvider } from "@/components/app-shell/organization-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/features/auth/actions", () => ({
  signOutAction: vi.fn(),
}));

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

describe("AppHeader", () => {
  it("keeps the constrained organization branch selector available at mobile widths", () => {
    render(
      <OrganizationProvider
        organization={{ id: "org-1", name: "Apex Autohaus" }}
        user={{
          displayName: "Miguel Santos",
          email: "owner@apex-autohaus.example",
          roleName: "Owner",
        }}
        scope="organization"
        branches={[
          { id: "branch-1", name: "Quezon City Main", isPrimary: true },
        ]}
      >
        <SidebarProvider>
          <AppHeader items={[]} />
        </SidebarProvider>
      </OrganizationProvider>,
    );

    const branchSelector = screen.getByRole("combobox", {
      name: "Branch for Apex Autohaus",
    });
    expect(branchSelector.parentElement).not.toHaveClass("hidden");
    expect(branchSelector).toHaveTextContent("All branches");
  });

  it("presents notifications as unavailable instead of an enabled dead control", () => {
    render(
      <OrganizationProvider
        organization={{ id: "org-1", name: "Apex Autohaus" }}
        user={{
          displayName: "Miguel Santos",
          email: "owner@apex-autohaus.example",
          roleName: "Owner",
        }}
        scope="organization"
        branches={[]}
      >
        <SidebarProvider>
          <AppHeader items={[]} />
        </SidebarProvider>
      </OrganizationProvider>,
    );

    const notifications = screen.getByRole("button", {
      name: "Notifications unavailable",
    });
    expect(notifications).toBeDisabled();
    expect(notifications).toHaveAccessibleDescription(
      "Notifications are not available in this foundation release.",
    );
  });
});
