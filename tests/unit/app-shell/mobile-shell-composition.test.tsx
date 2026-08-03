import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LayoutDashboardIcon } from "lucide-react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/app-shell/app-header";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import type { ShellNavigationItem } from "@/components/app-shell/navigation-items";
import { OrganizationProvider } from "@/components/app-shell/organization-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/features/auth/actions", () => ({
  signOutAction: vi.fn(),
}));

const dashboardItem: ShellNavigationItem = {
  key: "dashboard",
  label: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboardIcon,
};

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true,
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

describe("mobile application shell composition", () => {
  it.each([
    ["Ctrl+B", { key: "b", ctrlKey: true }],
    ["Cmd+B", { key: "b", metaKey: true }],
  ] as const)(
    "%s leaves the dedicated mobile navigation as the only dialog path",
    async (_label, shortcut) => {
      const user = userEvent.setup();

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
            <div className="hidden lg:block">
              <AppSidebar items={[dashboardItem]} />
            </div>
            <AppHeader items={[dashboardItem]} />
          </SidebarProvider>
        </OrganizationProvider>,
      );

      fireEvent.keyDown(window, shortcut);

      expect(screen.queryAllByRole("dialog")).toHaveLength(0);
      expect(
        screen.queryAllByRole("navigation", { name: /primary navigation/i }),
      ).toHaveLength(0);

      await user.click(
        screen.getByRole("button", { name: "Open navigation" }),
      );

      const dialog = await screen.findByRole("dialog", {
        name: "Application navigation",
      });
      expect(dialog).toBeInTheDocument();
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(
        screen.getAllByRole("navigation", { name: /primary navigation/i }),
      ).toHaveLength(1);
      expect(
        screen.getByRole("navigation", { name: "Mobile primary navigation" }),
      ).toBeInTheDocument();
    },
  );
});
