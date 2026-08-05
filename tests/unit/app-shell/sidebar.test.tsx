import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { OrganizationProvider } from "@/components/app-shell/organization-provider";
import { createDemoAccessContext } from "@/lib/demo-data";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

it("renders permitted dealership navigation without future modules", () => {
  render(<OrganizationProvider value={createDemoAccessContext("owner")}><AppSidebar collapsed={false} onToggle={() => undefined} /></OrganizationProvider>);
  expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  expect(screen.queryByText("Fleet Management")).not.toBeInTheDocument();
  expect(screen.queryByText("Vehicle Rental")).not.toBeInTheDocument();
});
