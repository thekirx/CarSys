import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BlocksIcon,
  Building2Icon,
  ChartNoAxesCombinedIcon,
  CarFrontIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { MobileNavigation } from "@/components/app-shell/mobile-navigation";
import {
  createShellNavigationItems,
  isNavigationItemActive,
} from "@/components/app-shell/navigation-items";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { NavigationItem } from "@/features/permissions/navigation";

vi.mock("next/link", () => ({
  default: ({
    href,
    onClick,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    />
  ),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/settings/company/profile",
}));

const permittedNavigation: readonly NavigationItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    requiredModule: "dealership",
    requiredPermission: "reports.read",
  },
  {
    key: "vehicle-inventory",
    label: "Vehicle Inventory",
    href: "/vehicles",
    requiredModule: "dealership",
    requiredPermission: "vehicles.read",
  },
  {
    key: "reports",
    label: "Reports",
    href: "/reports",
    requiredModule: "dealership",
    requiredPermission: "reports.read",
  },
  {
    key: "company-settings",
    label: "Company Settings",
    href: "/settings/company",
    requiredModule: "dealership",
    requiredPermission: "settings.manage",
  },
  {
    key: "module-settings",
    label: "Module Settings",
    href: "/settings/modules",
    requiredModule: "dealership",
    requiredPermission: "modules.manage",
  },
  {
    key: "user-management",
    label: "User Management",
    href: "/settings/users",
    requiredModule: "dealership",
    requiredPermission: "users.manage",
  },
  {
    key: "audit-logs",
    label: "Audit Logs",
    href: "/audit-logs",
    requiredModule: "dealership",
    requiredPermission: "audit_logs.read",
  },
];

const unsupportedFutureNavigation = [
  {
    key: "fleet-management",
    label: "Fleet Management",
    href: "/fleet",
    requiredModule: "fleet_management",
    requiredPermission: "vehicles.read",
  },
  {
    key: "vehicle-rental",
    label: "Vehicle Rental",
    href: "/rental",
    requiredModule: "vehicle_rental",
    requiredPermission: "vehicles.read",
  },
] as const satisfies readonly NavigationItem[];

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

describe("application shell navigation", () => {
  it("renders only explicitly permitted Dealership links", () => {
    const items = createShellNavigationItems([
      ...permittedNavigation,
      ...unsupportedFutureNavigation,
    ]);

    render(
      <SidebarProvider>
        <AppSidebar items={items} />
      </SidebarProvider>,
    );

    for (const item of permittedNavigation) {
      expect(
        screen.getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", item.href);
    }
    expect(screen.queryByText("Fleet Management")).not.toBeInTheDocument();
    expect(screen.queryByText("Vehicle Rental")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Company Settings" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("matches active routes only on segment boundaries", () => {
    expect(isNavigationItemActive("/settings/company", "/settings/company")).toBe(
      true,
    );
    expect(
      isNavigationItemActive(
        "/settings/company/branding",
        "/settings/company",
      ),
    ).toBe(true);
    expect(
      isNavigationItemActive(
        "/settings/company-malicious",
        "/settings/company",
      ),
    ).toBe(false);
    expect(isNavigationItemActive("/settings-malicious", "/settings")).toBe(
      false,
    );
  });

  it("maps stable navigation keys to exact Lucide component objects", () => {
    expect(createShellNavigationItems(permittedNavigation).map((item) => item.icon)).toEqual(
      [
        LayoutDashboardIcon,
        CarFrontIcon,
        ChartNoAxesCombinedIcon,
        Building2Icon,
        BlocksIcon,
        UsersIcon,
        ShieldCheckIcon,
      ],
    );
  });

  it("opens and closes accessible mobile navigation with the same permitted set", async () => {
    const user = userEvent.setup();
    const items = createShellNavigationItems([
      ...permittedNavigation,
      ...unsupportedFutureNavigation,
    ]);

    render(<MobileNavigation items={items} />);

    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);

    expect(
      screen.getByRole("dialog", { name: "Application navigation" }),
    ).toBeInTheDocument();
    for (const item of permittedNavigation) {
      expect(
        screen.getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", item.href);
    }
    expect(screen.queryByText("Fleet Management")).not.toBeInTheDocument();
    expect(screen.queryByText("Vehicle Rental")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Application navigation" }),
      ).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole("link", { name: "Dashboard" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Application navigation" }),
      ).not.toBeInTheDocument(),
    );
  });
});
