import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { createDemoAccessContext } from "@/lib/demo-data";
import { dashboardFixture } from "../../fixtures/dashboard";

it("does not render sensitive finance values when financial data is absent", () => {
  render(<DashboardView data={{ ...dashboardFixture, financials: null }} context={createDemoAccessContext("sales-agent")} />);
  expect(screen.getByText("Restricted")).toBeInTheDocument();
  expect(screen.queryByText("Projected revenue")).not.toBeInTheDocument();
  expect(screen.queryByText("₱2,000,000")).not.toBeInTheDocument();
});

it("renders financial summary for an authorized owner", () => {
  render(<DashboardView data={dashboardFixture} context={createDemoAccessContext("owner")} />);
  expect(screen.getByText("₱2,000,000")).toBeInTheDocument();
  expect(screen.getByText("Projected gross profit")).toBeInTheDocument();
});
