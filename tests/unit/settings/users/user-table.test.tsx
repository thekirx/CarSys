import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { UserTable } from "@/features/settings/users/user-table";
import type { UserManagementRecord } from "@/features/settings/users/user-queries";

const users: UserManagementRecord[] = [{
  id: "user-1", membershipId: "membership-1", name: "Paolo Reyes", email: "sales@example.com",
  role: "Sales Agent", roleCode: "sales-agent", scope: "Assigned branches", branches: "Quezon City Main", status: "Active",
}];

it("renders user access details and disables mutations in demo mode", () => {
  render(<UserTable initialUsers={users} currentUserId="owner" demoMode />);
  expect(screen.getByText("Paolo Reyes")).toBeInTheDocument();
  expect(screen.getByText("Sales Agent")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Suspend" })[0]).toBeDisabled();
});
